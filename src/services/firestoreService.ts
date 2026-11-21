import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  runTransaction,
  writeBatch,
  CollectionReference,
  DocumentData,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../firebase';
import { 
  User, 
  Equipment, 
  EquipmentRequest, 
  IssueRecord, 
  ReturnRecord, 
  RequestStatus,
  ReturnStatus,
  EquipmentCondition,
  EquipmentStatus,
  ReturnInspectionOutcome,
  SystemSettings,
  FeedbackItem
} from '../types';

/**
 * Collection Names
 */
export const COLLECTIONS = {
  USERS: 'users',
  EQUIPMENT: 'equipment',
  REQUESTS: 'requests',
  ISSUES: 'issues',
  RETURNS: 'returns',
  SETTINGS: 'settings',
  FEEDBACK: 'feedback',
} as const;

/**
 * Strips undefined properties recursively from objects to adhere to Firestore requirements.
 * Firestore strictly rejects undefined in any document write (setDoc, updateDoc).
 */
export const sanitizeFirestoreData = <T extends Record<string, any>>(data: T): Partial<T> => {
  if (!data || typeof data !== 'object') return data;
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = sanitizeFirestoreData(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as Partial<T>;
};

/**
 * Handle and log Firestore errors gracefully.
 * Permission and authentication failures are expected in the dual-layer architecture
 * when operating without cloud authentication and are logged as dual-layer warnings so
 * that local storage fallback functions without polluting the error monitors.
 */
const handleFirestoreError = (context: string, error: unknown): never => {
  const errStr = error instanceof Error ? error.message : String(error);
  const isPermissionOrAuthError =
    errStr.includes('Missing or insufficient permissions') ||
    errStr.includes('permission-denied') ||
    errStr.includes('unauthenticated') ||
    (error && typeof error === 'object' && (error as any).code === 'permission-denied');

  if (isPermissionOrAuthError) {
    console.warn(`[Firestore Dual-Layer Fallback] ${context}: Permission or authentication not active in cloud. Delegating to local storage fallback.`);
  } else {
    console.warn(`[Firestore Warning] ${context}:`, error);
  }
  throw error;
};

/**
 * Normalizes dates from various Firestore formats (Timestamp, Date, ISO string, seconds) to standard ISO 8601 string.
 */
export const normalizeFirestoreDate = (dateVal: any, fallback?: string): string => {
  if (!dateVal) return fallback || new Date().toISOString();
  if (typeof dateVal === 'string') {
    if (!isNaN(Date.parse(dateVal))) return dateVal;
    return fallback || new Date().toISOString();
  }
  if (typeof dateVal === 'number') {
    return new Date(dateVal).toISOString();
  }
  if (typeof dateVal === 'object' && typeof dateVal.toDate === 'function') {
    try {
      return dateVal.toDate().toISOString();
    } catch {
      return fallback || new Date().toISOString();
    }
  }
  if (typeof dateVal === 'object' && typeof dateVal.seconds === 'number') {
    return new Date(dateVal.seconds * 1000).toISOString();
  }
  return fallback || new Date().toISOString();
};

/**
 * Normalizes User documents to prevent runtime errors from missing or camelCase fields
 */
export const normalizeUserDoc = (id: string, data: any): User => ({
  id,
  name: data?.name || 'User',
  username: data?.username || '',
  student_id: data?.student_id || data?.studentId,
  email: data?.email || '',
  phone: data?.phone || '',
  role: data?.role || 'STUDENT',
  course: data?.course || '',
  year: data?.year || '',
  division: data?.division || '',
  avatar: data?.avatar,
  profile_completed: data?.profile_completed ?? (data?.role === 'STUDENT' ? false : true),
  active: data?.active ?? true,
  created_at: normalizeFirestoreDate(data?.created_at || data?.createdAt),
});

/**
 * Normalizes Equipment documents ensuring numeric quantities and safe defaults
 */
export const normalizeEquipmentDoc = (id: string, data: any): Equipment => ({
  id,
  equipment_code: data?.equipment_code || data?.equipmentCode || id,
  name: data?.name || 'Equipment',
  sport_id: data?.sport_id || data?.sportId || '',
  quantity: Math.max(0, Number(data?.quantity ?? 0)),
  available_quantity: Math.max(0, Number(data?.available_quantity ?? (data?.availableQuantity ?? data?.quantity ?? 0))),
  issued_quantity: Math.max(0, Number(data?.issued_quantity ?? (data?.issuedQuantity ?? 0))),
  condition: data?.condition || 'GOOD',
  status: data?.status || 'AVAILABLE',
  purchase_date: normalizeFirestoreDate(data?.purchase_date || data?.purchaseDate),
  remarks: data?.remarks || '',
  active: data?.active ?? true,
  created_at: normalizeFirestoreDate(data?.created_at || data?.createdAt),
});

/**
 * Normalizes EquipmentRequest documents
 */
export const normalizeRequestDoc = (id: string, data: any): EquipmentRequest => ({
  id,
  student_id: data?.student_id || data?.studentId || '',
  equipment_id: data?.equipment_id || data?.equipmentId || '',
  quantity: Math.max(1, Number(data?.quantity || 1)),
  required_date: data?.required_date || data?.requiredDate || '',
  expected_return: data?.expected_return || data?.expectedReturn || '',
  purpose: data?.purpose || '',
  notes: data?.notes || '',
  selfie_path: data?.selfie_path || data?.selfiePath,
  status: data?.status || 'PENDING',
  created_at: normalizeFirestoreDate(data?.created_at || data?.createdAt),
  approved_at: data?.approved_at ? normalizeFirestoreDate(data?.approved_at) : undefined,
  rejected_at: data?.rejected_at ? normalizeFirestoreDate(data?.rejected_at) : undefined,
  teacher_remarks: data?.teacher_remarks || data?.teacherRemarks,
  rejection_reason: data?.rejection_reason || data?.rejectionReason,
  created_by: data?.created_by || data?.createdBy,
  created_by_role: data?.created_by_role || data?.createdByRole,
  request_source: data?.request_source || data?.requestSource,
});

/**
 * Normalizes IssueRecord documents
 */
export const normalizeIssueDoc = (id: string, data: any): IssueRecord => ({
  id,
  request_id: data?.request_id || data?.requestId || '',
  student_id: data?.student_id || data?.studentId || '',
  equipment_id: data?.equipment_id || data?.equipmentId || '',
  quantity: Math.max(1, Number(data?.quantity || 1)),
  issued_by: data?.issued_by || data?.issuedBy || '',
  issued_at: normalizeFirestoreDate(data?.issued_at || data?.issuedAt),
  expected_return: data?.expected_return || data?.expectedReturn || '',
  actual_return: data?.actual_return ? normalizeFirestoreDate(data?.actual_return) : undefined,
  status: data?.status || 'ISSUED',
  notes: data?.notes || '',
});

/**
 * Normalizes ReturnRecord documents
 */
export const normalizeReturnDoc = (id: string, data: any): ReturnRecord => ({
  id,
  issue_id: data?.issue_id || data?.issueId || '',
  student_id: data?.student_id || data?.studentId,
  requested_at: normalizeFirestoreDate(data?.requested_at || data?.requestedAt),
  status: data?.status || 'RETURN_PENDING',
  accepted_at: data?.accepted_at ? normalizeFirestoreDate(data?.accepted_at) : undefined,
  accepted_by: data?.accepted_by || data?.acceptedBy,
  condition: data?.condition,
  remarks: data?.remarks || '',
});

/**
 * Helper to ensure Firestore instance is active
 */
const getDbInstance = () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Cloud Firestore is not initialized. Check your Firebase environment configuration.');
  }
  return db;
};

/**
 * Typed collection helper
 */
const getTypedCollection = <T = DocumentData>(collectionName: string): CollectionReference<T> => {
  const database = getDbInstance();
  return collection(database, collectionName) as CollectionReference<T>;
};

// ==========================================
// 1. USERS COLLECTION HELPERS
// ==========================================

/**
 * Retrieve all registered users from Firestore
 */
export const getFirestoreUsers = async (): Promise<User[]> => {
  try {
    const colRef = getTypedCollection<User>(COLLECTIONS.USERS);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => normalizeUserDoc(d.id, d.data()));
  } catch (error) {
    handleFirestoreError('getFirestoreUsers', error);
  }
};

/**
 * Retrieve a specific user by Document ID
 */
export const getFirestoreUserById = async (userId: string): Promise<User | null> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.USERS, userId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return normalizeUserDoc(snapshot.id, snapshot.data());
  } catch (error) {
    handleFirestoreError(`getFirestoreUserById for ID ${userId}`, error);
  }
};

/**
 * Save or update a user profile in Firestore
 */
export const setFirestoreUser = async (user: User): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.USERS, user.id);
    const cleanUser = sanitizeFirestoreData(user);
    await setDoc(docRef, cleanUser, { merge: true });
  } catch (error) {
    handleFirestoreError('setFirestoreUser', error);
  }
};

/**
 * Update specific fields on a user profile (e.g. course, year, division, student_id, phone, profile_completed)
 * Uses setDoc with merge to ensure safe creation/update while strictly maintaining unchanged fields
 */
export const updateFirestoreUser = async (userId: string, data: Partial<User>): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.USERS, userId);
    const cleanData = sanitizeFirestoreData(data);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(`updateFirestoreUser for ID ${userId}`, error);
  }
};

/**
 * Permanently delete a user profile document from Firestore users/{userId}
 */
export const deleteFirestoreUser = async (userId: string): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.USERS, userId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(`deleteFirestoreUser for ID ${userId}`, error);
  }
};

// ==========================================
// 2. EQUIPMENT COLLECTION HELPERS
// ==========================================

/**
 * Retrieve all sports equipment catalog items
 */
export const getFirestoreEquipment = async (): Promise<Equipment[]> => {
  try {
    const colRef = getTypedCollection<Equipment>(COLLECTIONS.EQUIPMENT);
    const q = query(colRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .filter(d => {
        const data = d.data();
        // Exclude non-equipment documents (like metadata/settings) and ensure valid equipment item
        return d.id !== 'app_settings' && data && typeof data.name === 'string' && typeof data.quantity === 'number';
      })
      .map(d => normalizeEquipmentDoc(d.id, d.data()));
  } catch (error) {
    handleFirestoreError('getFirestoreEquipment', error);
  }
};

/**
 * Generates a single canonical Firestore document ID for a new equipment record.
 * Falls back cleanly if Firebase is not configured.
 */
export const generateFirestoreEquipmentDocId = (): string => {
  if (isFirebaseConfigured && db) {
    try {
      return doc(collection(db, COLLECTIONS.EQUIPMENT)).id;
    } catch {
      // fallback below
    }
  }
  const nonce = Math.random().toString(36).slice(2, 8);
  return `eq_${Date.now()}_${nonce}`;
};

/**
 * Add or update equipment in Firestore
 */
export const addOrUpdateFirestoreEquipment = async (item: Equipment): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.EQUIPMENT, item.id);
    const cleanItem = sanitizeFirestoreData(item);
    await setDoc(docRef, cleanItem, { merge: true });
  } catch (error) {
    handleFirestoreError('addOrUpdateFirestoreEquipment', error);
  }
};

/**
 * Permanently delete an equipment document from Firestore
 */
export const deleteFirestoreEquipment = async (equipmentId: string): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.EQUIPMENT, equipmentId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(`deleteFirestoreEquipment for ${equipmentId}`, error);
  }
};

/**
 * Loads all genuine equipment documents directly from Firestore (string name & numeric quantity),
 * preserving raw document fields for archival JSON backup alongside normalized Equipment objects.
 */
export interface RawFirestoreEquipmentEntry {
  id: string;
  rawData: Record<string, any>;
  normalized: Equipment;
}

export const loadRawFirestoreEquipmentDocs = async (): Promise<RawFirestoreEquipmentEntry[]> => {
  try {
    const database = getDbInstance();
    const colRef = collection(database, COLLECTIONS.EQUIPMENT);
    const snapshot = await getDocs(colRef);
    return snapshot.docs
      .filter(d => {
        const data = d.data();
        return d.id !== 'app_settings' && data && typeof data.name === 'string' && typeof data.quantity === 'number';
      })
      .map(d => ({
        id: d.id,
        rawData: { id: d.id, ...d.data() },
        normalized: normalizeEquipmentDoc(d.id, d.data()),
      }))
      .sort((a, b) => a.normalized.name.localeCompare(b.normalized.name));
  } catch (error) {
    handleFirestoreError('loadRawFirestoreEquipmentDocs', error);
  }
};

/**
 * Atomically creates all college equipment documents with brand-new document IDs
 * inside ONE single Firestore writeBatch. Never deletes or modifies any existing document.
 * Blocks if the equipment collection already contains any real equipment item
 * (string name and numeric quantity).
 */
export const atomicImportFirestoreEquipment = async (
  newItems: Equipment[]
): Promise<{ createdCount: number }> => {
  try {
    const database = getDbInstance();
    const colRef = collection(database, COLLECTIONS.EQUIPMENT);
    const snapshot = await getDocs(colRef);

    const existingRealEquipment = snapshot.docs.filter(d => {
      if (d.id === 'app_settings') return false;
      const data = d.data();
      return Boolean(data && typeof data.name === 'string' && typeof data.quantity === 'number');
    });

    if (existingRealEquipment.length > 0) {
      throw new Error(
        `Import blocked: The Firestore equipment collection already contains ${existingRealEquipment.length} real equipment item(s). Remove existing equipment before running this one-time import.`
      );
    }

    if (!newItems || newItems.length === 0) {
      throw new Error('No equipment items provided for import.');
    }

    if (newItems.length > 500) {
      throw new Error(
        `Atomic Firestore batch limit exceeded (${newItems.length} creates > 500 limit).`
      );
    }

    const allExistingDocIds = new Set(snapshot.docs.map(d => d.id));
    const seenIds = new Set<string>();
    const seenCodes = new Set<string>();

    for (const item of newItems) {
      if (!item.name || !item.name.trim()) {
        throw new Error(`Invalid equipment item (${item.id}): name cannot be empty.`);
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error(`Invalid quantity for "${item.name}": must be a positive integer.`);
      }
      const code = (item.equipment_code || '').trim().toUpperCase();
      if (!code || seenCodes.has(code)) {
        throw new Error(`Duplicate or empty equipment code detected: "${item.equipment_code}".`);
      }
      if (!item.id || seenIds.has(item.id)) {
        throw new Error(`Duplicate or empty equipment document ID detected: "${item.id}".`);
      }
      if (allExistingDocIds.has(item.id)) {
        throw new Error(`Document ID collision detected ("${item.id}"). Import requires brand-new document IDs.`);
      }
      seenCodes.add(code);
      seenIds.add(item.id);
    }

    const batch = writeBatch(database);
    newItems.forEach(item => {
      const docRef = doc(database, COLLECTIONS.EQUIPMENT, item.id);
      batch.set(docRef, sanitizeFirestoreData(item));
    });

    await batch.commit();

    return {
      createdCount: newItems.length,
    };
  } catch (error) {
    handleFirestoreError('atomicImportFirestoreEquipment', error);
  }
};

/**
 * Atomically creates multiple equipment documents using a single Firestore writeBatch.
 */
export const batchCreateFirestoreEquipment = async (
  items: Equipment[]
): Promise<{ createdCount: number }> => {
  try {
    const database = getDbInstance();
    if (!items || items.length === 0) {
      throw new Error('No equipment items provided for batch creation.');
    }
    if (items.length > 500) {
      throw new Error(`Batch size (${items.length}) exceeds Firestore 500-write limit.`);
    }
    const batch = writeBatch(database);
    items.forEach(item => {
      const docRef = doc(database, COLLECTIONS.EQUIPMENT, item.id);
      batch.set(docRef, sanitizeFirestoreData(item));
    });
    await batch.commit();
    return { createdCount: items.length };
  } catch (error) {
    handleFirestoreError('batchCreateFirestoreEquipment', error);
  }
};

/**
 * Update total quantity and derived available quantity for an existing equipment document
 */
export const updateFirestoreEquipmentQuantity = async (
  equipmentId: string,
  newTotalQuantity: number,
  newAvailableQuantity: number,
  newStatus?: EquipmentStatus
): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.EQUIPMENT, equipmentId);
    const updates: Record<string, any> = {
      quantity: newTotalQuantity,
      available_quantity: newAvailableQuantity,
    };
    if (newStatus) {
      updates.status = newStatus;
    }
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(`updateFirestoreEquipmentQuantity for ${equipmentId}`, error);
  }
};

/**
 * Atomically update available and issued equipment quantities
 */
export const updateFirestoreEquipmentQuantities = async (
  equipmentId: string, 
  availableDelta: number, 
  issuedDelta: number,
  newStatus?: EquipmentStatus,
  newCondition?: EquipmentCondition
): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.EQUIPMENT, equipmentId);

    await runTransaction(database, async (transaction) => {
      const sfDoc = await transaction.get(docRef);
      if (!sfDoc.exists()) {
        // Equipment document does not exist in Firestore yet (e.g. running on local fallback)
        return;
      }

      const data = sfDoc.data() as Equipment;
      const newAvailable = Math.max(0, (data.available_quantity || 0) + availableDelta);
      const newIssued = Math.max(0, (data.issued_quantity || 0) + issuedDelta);

      const updates: Partial<Equipment> = {
        available_quantity: newAvailable,
        issued_quantity: newIssued,
      };

      if (newStatus) {
        updates.status = newStatus;
      } else if (newAvailable === 0 && newIssued > 0) {
        updates.status = 'ISSUED';
      } else if (newAvailable > 0) {
        updates.status = 'AVAILABLE';
      }

      if (newCondition) {
        updates.condition = newCondition;
      }

      const cleanUpdates = sanitizeFirestoreData(updates);
      transaction.update(docRef, cleanUpdates);
    });
  } catch (error) {
    handleFirestoreError(`updateFirestoreEquipmentQuantities for ${equipmentId}`, error);
  }
};

// ==========================================
// 3. EQUIPMENT REQUESTS HELPERS
// ==========================================

/**
 * Check Firestore for an existing active request for the same authenticated student_id and equipment_id.
 * Active statuses: 'PENDING', 'APPROVED', 'ISSUED'.
 * Statuses 'RETURNED' or 'REJECTED' do NOT block new requests.
 */
export const checkActiveFirestoreEquipmentRequest = async (
  studentId: string,
  equipmentId: string
): Promise<EquipmentRequest | null> => {
  if (!isFirebaseConfigured || !db) return null;
  const activeStatuses: RequestStatus[] = ['PENDING', 'APPROVED', 'ISSUED'];

  try {
    const colRef = getTypedCollection<EquipmentRequest>(COLLECTIONS.REQUESTS);

    // Primary check: Direct query matching student_id and equipment_id
    try {
      const q = query(
        colRef,
        where('student_id', '==', studentId),
        where('equipment_id', '==', equipmentId)
      );
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (activeStatuses.includes(data.status)) {
          return {
            ...data,
            id: docSnap.id,
          };
        }
      }
      return null;
    } catch (compoundErr) {
      console.warn('checkActiveFirestoreEquipmentRequest compound query fallback to studentId query:', compoundErr);
      const q = query(colRef, where('student_id', '==', studentId));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.equipment_id === equipmentId && activeStatuses.includes(data.status)) {
          return {
            ...data,
            id: docSnap.id,
          };
        }
      }
      return null;
    }
  } catch (error) {
    console.warn('checkActiveFirestoreEquipmentRequest error:', error);
    return null;
  }
};

/**
 * Create a new equipment requisition submitted by a student
 */
export const createFirestoreEquipmentRequest = async (request: EquipmentRequest): Promise<string> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.REQUESTS, request.id);
    const cleanRequest = sanitizeFirestoreData(request);
    await setDoc(docRef, cleanRequest);
    return request.id;
  } catch (error) {
    handleFirestoreError('createFirestoreEquipmentRequest', error);
  }
};

/**
 * Retrieve equipment requests (optionally filtered by student ID)
 */
export const getFirestoreRequests = async (studentId?: string): Promise<EquipmentRequest[]> => {
  try {
    const colRef = getTypedCollection<EquipmentRequest>(COLLECTIONS.REQUESTS);
    let q = query(colRef, orderBy('created_at', 'desc'));
    
    if (studentId) {
      // Avoid composite index requirement in Firestore by querying without orderBy
      q = query(colRef, where('student_id', '==', studentId));
    }

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(d => normalizeRequestDoc(d.id, d.data()));
    return records.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  } catch (error) {
    handleFirestoreError('getFirestoreRequests', error);
  }
};

/**
 * Update the status of an equipment request (APPROVED, REJECTED, ISSUED, RETURNED, etc.)
 */
export const updateFirestoreRequestStatus = async (
  requestId: string, 
  status: RequestStatus, 
  metadata?: {
    rejection_reason?: string;
    teacher_remarks?: string;
    approved_at?: string;
    rejected_at?: string;
  }
): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.REQUESTS, requestId);
    const rawUpdates: Partial<EquipmentRequest> = {
      status,
      ...metadata,
    };
    const cleanUpdates = sanitizeFirestoreData(rawUpdates);
    // Use setDoc with merge: true so that if the document wasn't created earlier, it creates/updates cleanly without throwing NOT_FOUND
    await setDoc(docRef, cleanUpdates, { merge: true });
  } catch (error) {
    handleFirestoreError(`updateFirestoreRequestStatus for ${requestId}`, error);
  }
};

/**
 * Permanently delete a request document from Firestore
 */
export const deleteFirestoreRequest = async (requestId: string): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.REQUESTS, requestId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(`deleteFirestoreRequest for ID ${requestId}`, error);
  }
};

// ==========================================
// 4. ISSUE RECORDS HELPERS
// ==========================================

/**
 * Create an issued equipment record when a teacher hands out equipment
 */
export const createFirestoreIssueRecord = async (issue: IssueRecord): Promise<string> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.ISSUES, issue.id);
    const cleanIssue = sanitizeFirestoreData(issue);
    await setDoc(docRef, cleanIssue);
    return issue.id;
  } catch (error) {
    handleFirestoreError('createFirestoreIssueRecord', error);
  }
};

/**
 * Retrieve issue records (optionally filtered by student ID)
 */
export const getFirestoreIssueRecords = async (studentId?: string): Promise<IssueRecord[]> => {
  try {
    const colRef = getTypedCollection<IssueRecord>(COLLECTIONS.ISSUES);
    let q = query(colRef, orderBy('issued_at', 'desc'));

    if (studentId) {
      // Avoid composite index requirement in Firestore by querying without orderBy
      q = query(colRef, where('student_id', '==', studentId));
    }

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(d => normalizeIssueDoc(d.id, d.data()));
    return records.sort((a, b) => new Date(b.issued_at || 0).getTime() - new Date(a.issued_at || 0).getTime());
  } catch (error) {
    handleFirestoreError('getFirestoreIssueRecords', error);
  }
};

/**
 * Update an existing issue record (e.g. mark RETURNED when return accepted)
 */
export const updateFirestoreIssueRecord = async (
  issueId: string,
  data: Partial<IssueRecord>
): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.ISSUES, issueId);
    const cleanData = sanitizeFirestoreData(data);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(`updateFirestoreIssueRecord for ID ${issueId}`, error);
  }
};

/**
 * Permanently delete an issue record (e.g. removing stale or erroneous loans)
 */
export const deleteFirestoreIssueRecord = async (issueId: string): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.ISSUES, issueId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(`deleteFirestoreIssueRecord for ID ${issueId}`, error);
  }
};

// ==========================================
// 5. RETURN RECORDS HELPERS
// ==========================================

/**
 * Create a return record when gear is submitted or accepted back
 * Explicitly targets the 'returns' collection and verifies student_id matches request.auth.uid
 */
export const createFirestoreReturnRecord = async (returnRecord: ReturnRecord): Promise<string> => {
  try {
    const database = getDbInstance();
    // Verify target write is specifically the returns collection
    const docRef = doc(database, COLLECTIONS.RETURNS, returnRecord.id);
    
    // Ensure student_id is set using authenticated Firebase user UID to pass firestore.rules
    const authUid = auth?.currentUser?.uid;
    const payload: ReturnRecord = {
      ...returnRecord,
      student_id: returnRecord.student_id || authUid,
    };

    const cleanReturn = sanitizeFirestoreData(payload);
    await setDoc(docRef, cleanReturn);
    return returnRecord.id;
  } catch (error) {
    handleFirestoreError('createFirestoreReturnRecord', error);
  }
};

/**
 * Retrieve return inspection records (optionally filtered by student ID)
 */
export const getFirestoreReturnRecords = async (studentId?: string): Promise<ReturnRecord[]> => {
  try {
    const colRef = getTypedCollection<ReturnRecord>(COLLECTIONS.RETURNS);
    let q = query(colRef);
    if (studentId) {
      q = query(colRef, where('student_id', '==', studentId));
    }
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(d => normalizeReturnDoc(d.id, d.data()));
    return records.sort((a, b) => new Date(b.requested_at || 0).getTime() - new Date(a.requested_at || 0).getTime());
  } catch (error) {
    handleFirestoreError('getFirestoreReturnRecords', error);
  }
};

/**
 * Update an existing return record when accepted/inspected by a faculty member
 */
export const updateFirestoreReturnRecord = async (
  returnId: string, 
  updates: {
    status: ReturnStatus;
    accepted_at?: string;
    accepted_by?: string;
    condition?: ReturnInspectionOutcome;
    remarks?: string;
  }
): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.RETURNS, returnId);
    const cleanUpdates = sanitizeFirestoreData(updates);
    await setDoc(docRef, cleanUpdates, { merge: true });
  } catch (error) {
    handleFirestoreError(`updateFirestoreReturnRecord for ${returnId}`, error);
  }
};

/**
 * Permanently delete a return record from Firestore
 */
export const deleteFirestoreReturnRecord = async (returnId: string): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.RETURNS, returnId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(`deleteFirestoreReturnRecord for ID ${returnId}`, error);
  }
};

// ==========================================
// REAL-TIME LISTENERS
// ==========================================

/**
 * Listen to real-time changes on equipment collection
 */
export const subscribeToFirestoreEquipment = (
  callback: (equipment: Equipment[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }
  const colRef = getTypedCollection<Equipment>(COLLECTIONS.EQUIPMENT);
  const q = query(colRef, orderBy('name', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs
      .filter(d => {
        const item = d.data();
        return d.id !== 'app_settings' && item && typeof item.name === 'string' && typeof item.quantity === 'number';
      })
      .map(d => normalizeEquipmentDoc(d.id, d.data()));
    callback(data);
  }, (err) => {
    const errStr = err instanceof Error ? err.message : String(err);
    if (errStr.includes('Missing or insufficient permissions') || (err as any)?.code === 'permission-denied') {
      console.warn('[Firestore Dual-Layer Fallback] subscribeToFirestoreEquipment: Permission not available in cloud.');
    } else {
      console.warn('Firestore subscribeToFirestoreEquipment warning:', err);
    }
    if (onError) {
      onError(err);
    }
  });
};

/**
 * Listen to real-time changes on registered users collection
 * Allows teacher and admin staff to instantly see new students signed up or logged in via Google.
 */
export const subscribeToFirestoreUsers = (
  callback: (users: User[]) => void
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }
  const colRef = getTypedCollection<User>(COLLECTIONS.USERS);
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map(d => normalizeUserDoc(d.id, d.data()));
    callback(data);
  }, (err) => {
    const errStr = err instanceof Error ? err.message : String(err);
    if (errStr.includes('Missing or insufficient permissions') || (err as any)?.code === 'permission-denied') {
      console.warn('[Firestore Dual-Layer Fallback] subscribeToFirestoreUsers: Permission not available in cloud. Using local state fallback.');
    } else {
      console.warn('Firestore subscribeToFirestoreUsers warning:', err);
    }
  });
};

/**
 * Listen to real-time changes on equipment requests
 * Strictly filters by studentId for students to satisfy security rules (resource.data.student_id == request.auth.uid)
 * and prevent permission-denied errors.
 */
export const subscribeToFirestoreRequests = (
  callback: (requests: EquipmentRequest[]) => void,
  studentId?: string
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }
  const colRef = getTypedCollection<EquipmentRequest>(COLLECTIONS.REQUESTS);
  const q = studentId
    ? query(colRef, where('student_id', '==', studentId))
    : query(colRef, orderBy('created_at', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => normalizeRequestDoc(d.id, d.data()));
    data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    callback(data);
  }, (err) => {
    const errStr = err instanceof Error ? err.message : String(err);
    if (errStr.includes('Missing or insufficient permissions') || (err as any)?.code === 'permission-denied') {
      console.warn('[Firestore Dual-Layer Fallback] subscribeToFirestoreRequests: Permission not available in cloud. Using local state fallback.');
    } else {
      console.warn('Firestore subscribeToFirestoreRequests warning:', err);
    }
  });
};

/**
 * Listen to real-time changes on equipment return requests
 */
export const subscribeToFirestoreReturns = (
  callback: (returns: ReturnRecord[]) => void,
  studentId?: string
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }
  const colRef = getTypedCollection<ReturnRecord>(COLLECTIONS.RETURNS);
  const q = studentId
    ? query(colRef, where('student_id', '==', studentId))
    : query(colRef);

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => normalizeReturnDoc(d.id, d.data()));
    data.sort((a, b) => new Date(b.requested_at || 0).getTime() - new Date(a.requested_at || 0).getTime());
    callback(data);
  }, (err) => {
    const errStr = err instanceof Error ? err.message : String(err);
    if (errStr.includes('Missing or insufficient permissions') || (err as any)?.code === 'permission-denied') {
      console.warn('[Firestore Dual-Layer Fallback] subscribeToFirestoreReturns: Permission not available in cloud. Using local state fallback.');
    } else {
      console.warn('Firestore subscribeToFirestoreReturns warning:', err);
    }
  });
};

/**
 * Listen to real-time changes on issued equipment records
 * Students only receive their own records; staff receive all issued equipment
 */
export const subscribeToFirestoreIssues = (
  callback: (issues: IssueRecord[]) => void,
  studentId?: string
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }
  const colRef = getTypedCollection<IssueRecord>(COLLECTIONS.ISSUES);
  const q = studentId
    ? query(colRef, where('student_id', '==', studentId))
    : query(colRef, orderBy('issued_at', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => normalizeIssueDoc(d.id, d.data()));
    data.sort((a, b) => new Date(b.issued_at || 0).getTime() - new Date(a.issued_at || 0).getTime());
    callback(data);
  }, (err) => {
    const errStr = err instanceof Error ? err.message : String(err);
    if (errStr.includes('Missing or insufficient permissions') || (err as any)?.code === 'permission-denied') {
      console.warn('[Firestore Dual-Layer Fallback] subscribeToFirestoreIssues: Permission not available in cloud. Using local state fallback.');
    } else {
      console.warn('Firestore subscribeToFirestoreIssues warning:', err);
    }
  });
};

// ==========================================
// 6. SETTINGS HELPERS
// ==========================================

/**
 * Retrieve system settings document from settings/app
 */
export const getFirestoreSettings = async (): Promise<Partial<SystemSettings> | null> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.SETTINGS, 'app');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as Partial<SystemSettings>;
    }
    return null;
  } catch (error) {
    handleFirestoreError('getFirestoreSettings', error);
  }
};

/**
 * Persist system settings document strictly to settings/app
 */
export const setFirestoreSettings = async (settings: Partial<SystemSettings>): Promise<void> => {
  try {
    const database = getDbInstance();
    const cleanSettings = sanitizeFirestoreData(settings);
    const docRef = doc(database, COLLECTIONS.SETTINGS, 'app');
    await setDoc(docRef, cleanSettings, { merge: true });
  } catch (error) {
    handleFirestoreError('setFirestoreSettings', error);
  }
};

/**
 * Real-time listener for settings (listening strictly to settings/app)
 */
export const subscribeToFirestoreSettings = (
  callback: (settings: Partial<SystemSettings>) => void
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  const docRef = doc(db, COLLECTIONS.SETTINGS, 'app');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as Partial<SystemSettings>);
    }
  }, (err) => {
    const errStr = err instanceof Error ? err.message : String(err);
    if (errStr.includes('Missing or insufficient permissions') || (err as any)?.code === 'permission-denied') {
      console.warn('[Firestore Dual-Layer Fallback] subscribeToFirestoreSettings: Permission restricted. Using local settings.');
    } else {
      console.warn('Firestore subscribeToFirestoreSettings warning:', err);
    }
  });
};

// ==========================================
// 8. FEEDBACK COLLECTION HELPERS
// ==========================================

export const normalizeFeedbackDoc = (id: string, data: any): FeedbackItem => ({
  id,
  student_id: data?.student_id || '',
  student_name: data?.student_name || 'Student',
  student_roll: data?.student_roll || '',
  type: data?.type || 'OTHER',
  subject: data?.subject || '',
  message: data?.message || '',
  equipment_name: data?.equipment_name || undefined,
  quantity: data?.quantity !== undefined && data?.quantity !== null ? Number(data.quantity) : undefined,
  status: data?.status || 'NEW',
  reply: data?.reply || undefined,
  replied_by: data?.replied_by || undefined,
  replied_at: data?.replied_at || undefined,
  created_at: data?.created_at || new Date().toISOString(),
  updated_at: data?.updated_at || new Date().toISOString(),
});

/**
 * Creates a new feedback document in the 'feedback' collection
 */
export const createFirestoreFeedback = async (item: FeedbackItem): Promise<string> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.FEEDBACK, item.id);
    const cleanItem = sanitizeFirestoreData(item);
    await setDoc(docRef, cleanItem);
    return item.id;
  } catch (error) {
    handleFirestoreError('createFirestoreFeedback', error);
  }
};

/**
 * Updates a feedback document with faculty reply and status change
 */
export const updateFirestoreFeedback = async (
  id: string,
  updates: Partial<FeedbackItem>
): Promise<void> => {
  try {
    const database = getDbInstance();
    const docRef = doc(database, COLLECTIONS.FEEDBACK, id);
    const cleanUpdates = sanitizeFirestoreData({
      ...updates,
      updated_at: new Date().toISOString(),
    });
    await setDoc(docRef, cleanUpdates, { merge: true });
  } catch (error) {
    handleFirestoreError(`updateFirestoreFeedback for ${id}`, error);
  }
};

/**
 * Real-time listener for feedback collection
 * When studentId is provided, queries strictly where('student_id', '==', studentId) and sorts client-side
 * to strictly adhere to Firestore constraints without requiring composite indexes.
 */
export const subscribeToFirestoreFeedback = (
  callback: (items: FeedbackItem[]) => void,
  studentId?: string
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  const colRef = getTypedCollection<FeedbackItem>(COLLECTIONS.FEEDBACK);
  const q = studentId
    ? query(colRef, where('student_id', '==', studentId))
    : query(colRef);

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => normalizeFeedbackDoc(d.id, d.data()));
    // Client-side sort: newest first (no Firestore orderBy to prevent index errors)
    data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    callback(data);
  }, (err) => {
    const errStr = err instanceof Error ? err.message : String(err);
    if (errStr.includes('Missing or insufficient permissions') || (err as any)?.code === 'permission-denied') {
      console.warn('[Firestore Dual-Layer Fallback] subscribeToFirestoreFeedback: Permission not active in cloud. Using local state fallback.');
    } else {
      console.warn('Firestore subscribeToFirestoreFeedback warning:', err);
    }
  });
};
