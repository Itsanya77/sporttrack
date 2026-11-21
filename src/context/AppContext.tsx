import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { 
  User, 
  Role,
  Sport, 
  Equipment, 
  EquipmentRequest, 
  IssueRecord, 
  ReturnRecord, 
  LearningContent, 
  SystemSettings, 
  EquipmentCondition,
  EquipmentStatus,
  ReturnInspectionOutcome,
  LoginSettings,
  VideoItem,
  AppNotification,
  FeedbackItem,
  FeedbackType,
  FeedbackStatus
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_SPORTS, 
  INITIAL_REQUESTS, 
  INITIAL_ISSUES, 
  INITIAL_RETURNS, 
  INITIAL_SETTINGS,
  DEFAULT_LOGIN_SETTINGS,
  INITIAL_VIDEOS,
  INITIAL_NOTIFICATIONS
} from '../data/seedData';
import { 
  hashPassword, 
  generateSalt, 
  verifyPassword, 
  generateResetCode 
} from '../utils/authCrypto';
import { 
  firebaseSignIn, 
  firebaseRegister,
  firebaseLogout, 
  firebaseGoogleSignIn,
  isAllowedGoogleDomain,
  isAllowedGoogleStudent,
  isFirebaseAuthReady,
  subscribeToAuthChanges,
  adminCreateStaffAuthUser
} from '../services/authService';
import { 
  getFirestoreEquipment, 
  addOrUpdateFirestoreEquipment,
  generateFirestoreEquipmentDocId,
  batchCreateFirestoreEquipment,
  deleteFirestoreEquipment,
  subscribeToFirestoreEquipment,
  createFirestoreEquipmentRequest,
  checkActiveFirestoreEquipmentRequest,
  getFirestoreRequests,
  updateFirestoreRequestStatus,
  subscribeToFirestoreRequests,
  createFirestoreIssueRecord,
  updateFirestoreEquipmentQuantities,
  createFirestoreReturnRecord,
  updateFirestoreReturnRecord,
  getFirestoreReturnRecords,
  subscribeToFirestoreReturns,
  getFirestoreUsers,
  subscribeToFirestoreUsers,
  getFirestoreUserById,
  setFirestoreUser,
  updateFirestoreUser,
  deleteFirestoreUser,
  getFirestoreIssueRecords,
  subscribeToFirestoreIssues,
  updateFirestoreIssueRecord,
  getFirestoreSettings,
  setFirestoreSettings,
  subscribeToFirestoreSettings,
  createFirestoreFeedback,
  updateFirestoreFeedback,
  subscribeToFirestoreFeedback
} from '../services/firestoreService';
import { auth, isFirebaseConfigured, firebaseConfig } from '../firebase';
import { resolveEquipmentSportName } from '../utils/sportsHelper';
import {
  DEFAULT_COLLEGE_LOGO,
  setCachedCollegeLogo,
  clearCachedCollegeLogo
} from '../utils/logoUtils';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  sports: Sport[];
  equipment: Equipment[];
  requests: EquipmentRequest[];
  issueRecords: IssueRecord[];
  returnRecords: ReturnRecord[];
  videos: VideoItem[];
  loginSettings: LoginSettings;
  notifications: AppNotification[];
  settings: SystemSettings;
  feedback: FeedbackItem[];
  isFirebaseAuthConfigured: boolean;

  // Feedback Box (Students) & Student Feedback (Teachers)
  submitFeedback: (data: {
    type: FeedbackType;
    subject: string;
    message: string;
    equipment_name?: string;
    quantity?: number;
  }) => Promise<{ success: boolean; message: string; feedbackId?: string }>;
  replyFeedback: (
    id: string,
    status: FeedbackStatus,
    reply?: string
  ) => Promise<{ success: boolean; message: string }>;

  // Auth & Session
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message: string; role?: User['role'] }>;
  loginWithGoogle: () => Promise<{ success: boolean; message: string; role?: User['role'] }>;
  logout: () => void;
  registerUser: (data: {
    name: string;
    email: string;
    password: string;
    role?: Role;
    student_id?: string;
    course?: string;
    year?: string;
    division?: string;
    phone?: string;
    autoLogin?: boolean;
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  registerStudent: (data: {
    name: string;
    student_id: string;
    email: string;
    password: string;
    course: string;
    year: string;
    division: string;
    phone?: string;
    autoLogin?: boolean;
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPasswordWithToken: (email: string, token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;

  // Student Actions
  requestEquipment: (
    equipmentId: string, 
    expectedReturn: string, 
    purpose: string, 
    selfiePath?: string, 
    quantity?: number, 
    requiredDate?: string, 
    notes?: string
  ) => Promise<{ success: boolean; message: string }>;
  requestReturn: (issueId: string) => Promise<{ success: boolean; message: string }>;

  // Teacher Request Actions
  createRequestForStudent: (
    studentId: string,
    equipmentId: string,
    quantity: number,
    expectedReturn: string,
    purpose: string,
    requiredDate?: string,
    notes?: string
  ) => Promise<{ success: boolean; message: string }>;
  approveRequest: (requestId: string, teacherRemarks?: string) => Promise<{ success: boolean; message: string }>;
  rejectRequest: (requestId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  cancelRequest: (requestId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  issueEquipment: (requestId: string, teacherRemarks?: string) => Promise<{ success: boolean; message: string }>;
  acceptReturn: (returnId: string, condition: ReturnInspectionOutcome, remarks: string) => Promise<{ success: boolean; message: string }>;
  editRequest: (requestId: string, updates: Partial<EquipmentRequest>) => { success: boolean; message: string };
  deleteRequest: (requestId: string) => { success: boolean; message: string };

  // Equipment Management (Full CRUD)
  addEquipment: (item: Omit<Equipment, 'id' | 'created_at' | 'active' | 'available_quantity' | 'issued_quantity'> & { available_quantity?: number; issued_quantity?: number }) => Promise<{ success: boolean; message: string }>;
  editEquipment: (id: string, updates: Partial<Equipment>) => Promise<{ success: boolean; message: string }>;
  deleteEquipment: (id: string) => Promise<{ success: boolean; message: string }>;
  bulkCreateEquipment: (prefix: string, name: string, sportId: string, condition: EquipmentCondition, quantity: number, purchaseDate: string) => Promise<{ success: boolean; message: string; createdCount: number }>;
  updateEquipmentStatus: (id: string, status: Equipment['status'], remarks?: string) => Promise<{ success: boolean; message: string }>;
  replaceEquipmentCatalogState: (newEquipment: Equipment[]) => void;
  refreshEquipmentFromFirestore: () => Promise<Equipment[]>;

  // Student Management (Full CRUD)
  addStudent: (student: {
    name: string;
    student_id: string;
    email: string;
    phone?: string;
    course: string;
    year: string;
    division: string;
    username?: string;
    password?: string;
  }) => Promise<{ success: boolean; message: string }>;
  editStudent: (id: string, updates: Partial<User>) => Promise<{ success: boolean; message: string }>;
  deleteStudent: (id: string) => Promise<{ success: boolean; message: string }>;
  deleteMyAccount: () => Promise<{ success: boolean; message: string }>;
  toggleUserActive: (userId: string) => { success: boolean; message: string };
  resetStudentPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; message: string }>;

  // Video / Learn & Play Management (Full CRUD)
  addVideo: (video: Omit<VideoItem, 'id' | 'created_at'>) => { success: boolean; message: string };
  editVideo: (id: string, updates: Partial<VideoItem>) => { success: boolean; message: string };
  deleteVideo: (id: string) => { success: boolean; message: string };
  togglePublishVideo: (id: string) => { success: boolean; message: string };

  // Sports & Categories CRUD
  addSport: (name: string, description: string) => { success: boolean; message: string };
  editSport: (id: string, name: string, description: string) => { success: boolean; message: string };
  deleteSport: (id: string) => { success: boolean; message: string };
  toggleSportActive: (id: string) => { success: boolean; message: string };

  // Login Page Customization (Teacher Admin Panel)
  updateLoginSettings: (newSettings: Partial<LoginSettings>) => void;
  resetLoginSettings: () => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  resolveNotificationTarget: (item: AppNotification, userRole?: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    tab: string;
    label: string;
    recordId?: string;
    type?: string;
  };
  navigateToNotification: (
    item: AppNotification,
    onNavigateTab?: (tab: string) => void
  ) => void;
  addNotification: (
    title: string, 
    message: string, 
    type?: AppNotification['type'], 
    targetRole?: AppNotification['target_role'],
    targetTab?: string,
    targetId?: string,
    targetType?: AppNotification['target_type']
  ) => void;
  highlightRecord: {
    tab?: string;
    recordId?: string;
    type?: string;
  } | null;
  setHighlightRecord: (record: { tab?: string; recordId?: string; type?: string } | null) => void;

  // Profile & Settings
  updateProfile: (userId: string, updates: Partial<User>) => Promise<{ success: boolean; message: string }>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<{ success: boolean; message: string }>;
  resetAllData: () => void;

  // Staff Management (Admin Only)
  createStaffUser: (data: {
    name: string;
    email: string;
    phone?: string;
    role: 'TEACHER' | 'ADMIN';
    password: string;
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  toggleStaffActiveStatus: (staffId: string) => Promise<{ success: boolean; message: string }>;

  // Helpers
  isOverdue: (expectedReturnStr: string, issueStatus: 'ISSUED' | 'RETURNED') => { overdue: boolean; days: number };
  getSportName: (sportId: string) => string;
  getUserName: (userId: string) => string;
  getEquipmentById: (id: string) => Equipment | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'sporttrack_users_v2',
  SPORTS: 'sporttrack_sports_v2',
  EQUIPMENT: 'sporttrack_equipment_v2',
  REQUESTS: 'sporttrack_requests_v2',
  ISSUES: 'sporttrack_issues_v2',
  RETURNS: 'sporttrack_returns_v2',
  VIDEOS: 'sporttrack_videos_v2',
  LOGIN_SETTINGS: 'sporttrack_login_settings_v2',
  NOTIFICATIONS: 'sporttrack_notifications_v2',
  SETTINGS: 'sporttrack_settings_v2',
  CURRENT_USER_ID: 'sporttrack_current_user_id_v2',
  FEEDBACK: 'sporttrack_feedback_v2',
  EQUIPMENT_REPLACED: 'sporttrack_equipment_replaced_v2',
};

const OLD_DEMO_EQUIPMENT_CODES = new Set([
  'FB-001',
  'BB-001',
  'CR-BAT-001',
  'CR-BALL-001',
  'VB-001',
  'BAD-R-001',
  'BAD-S-001',
  'TT-R-001',
  'TT-B-001',
  'ATH-SP-001',
  'GYM-YM-001',
  'GYM-DB-001',
]);

const containsOldDemoEquipment = (items: unknown): boolean => {
  if (!Array.isArray(items) || items.length === 0) return false;
  return items.some((item: any) => {
    if (!item || typeof item !== 'object') return false;
    if (item.sample_data_flag === true) return true;
    const code = typeof item.equipment_code === 'string' ? item.equipment_code.trim().toUpperCase() : '';
    const id = typeof item.id === 'string' ? item.id.trim() : '';
    if (/^eq_([1-9]|1[0-2])$/.test(id) || id.startsWith('eq_demo_')) return true;
    if (!code) return false;
    if (code === 'FB-001') return item.name !== 'Football Gloves - Nivia';
    if (code === 'BB-001') return item.name !== 'Basketball No. 7';
    return OLD_DEMO_EQUIPMENT_CODES.has(code);
  });
};

const dedupeEquipmentList = (items: Equipment[]): Equipment[] => {
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
  const deduped: Equipment[] = [];

  for (const item of items) {
    if (!item || typeof item.id !== 'string') continue;
    const cleanId = item.id.trim();
    const cleanCode = (item.equipment_code || '').trim().toUpperCase();
    if (!cleanId || seenIds.has(cleanId)) continue;
    if (cleanCode && seenCodes.has(cleanCode)) continue;
    seenIds.add(cleanId);
    if (cleanCode) seenCodes.add(cleanCode);
    deduped.push(item);
  }

  return deduped;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users (Synchronized with Firestore users collection)
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        const filtered = parsed.filter(u => u.email.toLowerCase() !== 'aniketbadhe09876@gmail.com');
        return filtered.length > 0 ? filtered : INITIAL_USERS;
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Sports / Categories
  const [sports, setSports] = useState<Sport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SPORTS);
      return saved ? JSON.parse(saved) : INITIAL_SPORTS;
    } catch {
      return INITIAL_SPORTS;
    }
  });

  // Equipment (Loaded strictly from Firestore; clear cached localStorage key on load if it holds old demo items)
  const [equipment, setEquipment] = useState<Equipment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (containsOldDemoEquipment(parsed)) {
          localStorage.removeItem(STORAGE_KEYS.EQUIPMENT);
          return [];
        }
        if (!isFirebaseConfigured && Array.isArray(parsed)) {
          return dedupeEquipmentList(
            parsed.filter(
              item =>
                item &&
                typeof item.name === 'string' &&
                typeof item.quantity === 'number' &&
                !item.sample_data_flag
            )
          );
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Requests (Synchronized with Firestore requests collection)
  const [requests, setRequests] = useState<EquipmentRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (saved) {
        const parsed: EquipmentRequest[] = JSON.parse(saved);
        return parsed;
      }
      return INITIAL_REQUESTS;
    } catch {
      return INITIAL_REQUESTS;
    }
  });

  // Issues (Synchronized with Firestore issues collection)
  const [issueRecords, setIssueRecords] = useState<IssueRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ISSUES);
      if (saved) {
        const parsed: IssueRecord[] = JSON.parse(saved);
        return parsed;
      }
      return INITIAL_ISSUES;
    } catch {
      return INITIAL_ISSUES;
    }
  });

  // Returns (Synchronized with Firestore returns collection)
  const [returnRecords, setReturnRecords] = useState<ReturnRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RETURNS);
      if (saved) {
        const parsed: ReturnRecord[] = JSON.parse(saved);
        return parsed;
      }
      return INITIAL_RETURNS;
    } catch {
      return INITIAL_RETURNS;
    }
  });

  // Videos
  const [videos, setVideos] = useState<VideoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIDEOS);
      return saved ? JSON.parse(saved) : INITIAL_VIDEOS;
    } catch {
      return INITIAL_VIDEOS;
    }
  });

  // Login Page Customization Settings
  const [loginSettings, setLoginSettings] = useState<LoginSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGIN_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.college_logo_url) {
          parsed.college_logo_url = '/college_logo.jpg';
        }
        return parsed;
      }
      return DEFAULT_LOGIN_SETTINGS;
    } catch {
      return DEFAULT_LOGIN_SETTINGS;
    }
  });

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Highlight Record State for Notification Navigation
  const [highlightRecord, setHighlightRecord] = useState<{ tab?: string; recordId?: string; type?: string } | null>(null);

  // Institutional Settings
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.logo_url) {
          parsed.logo_url = '/college_logo.jpg';
        }
        return parsed;
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Student Feedback & Requisitions
  const [feedback, setFeedback] = useState<FeedbackItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Current User: In Firebase mode, wait for Firebase Auth to confirm session; in offline mode, check local storage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (isFirebaseConfigured) {
      return null;
    }
    try {
      const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (savedId) {
        const found = users.find(u => u.id === savedId);
        if (found && found.active && found.email.toLowerCase() !== 'aniketbadhe09876@gmail.com') return found;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Persist state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.SPORTS, JSON.stringify(sports));
      if (!isFirebaseConfigured) {
        localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipment));
      }
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
      localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issueRecords));
      localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returnRecords));
      localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
      localStorage.setItem(STORAGE_KEYS.LOGIN_SETTINGS, JSON.stringify(loginSettings));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      }
    } catch (e) {
      console.warn('Storage sync issue:', e);
    }
  }, [users, sports, equipment, requests, issueRecords, returnRecords, videos, loginSettings, notifications, settings, currentUser]);

/**
 * Constructs a new student profile object adhering strictly to the User schema
 * used by standard registration so that all fields (name, student_id, email, phone, role, course, year, division, active, created_at)
 * are populated consistently.
 */
const buildGoogleStudentProfile = (fbUser: any, email: string): User => {
  const emailUsername = email.split('@')[0];
  const derivedName = fbUser.displayName && fbUser.displayName.trim() !== ''
    ? fbUser.displayName.trim()
    : emailUsername;
  return {
    id: fbUser.uid,
    name: derivedName,
    username: emailUsername,
    student_id: '',
    email: email.toLowerCase().trim(),
    phone: '',
    avatar: fbUser.photoURL || undefined,
    role: 'STUDENT',
    course: '',
    year: '',
    division: '',
    profile_completed: false,
    active: true,
    created_at: new Date().toISOString(),
  };
};

  // Synchronize Firebase Authentication session state with AppContext
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let isMounted = true;
    const unsubscribe = subscribeToAuthChanges(async (fbUser) => {
      if (!isMounted) return;

      if (fbUser) {
        try {
          const isGoogleProvider = fbUser.providerData.some(p => p.providerId === 'google.com');

          // Strict verification: Google student must have email, emailVerified === true, and exact domain @moonjeinstitute.com
          if (isGoogleProvider && !isAllowedGoogleStudent(fbUser)) {
            console.warn(`[Auth] Rejecting Google user with invalid domain or unverified email: ${fbUser.email}`);
            await firebaseLogout();
            if (isMounted) {
              setCurrentUser(null);
            }
            return;
          }

          let profile = await getFirestoreUserById(fbUser.uid);

          if (!profile) {
            if (isGoogleProvider) {
              // Create student profile strictly with STUDENT role for allowed Google student
              const email = (fbUser.email || '').toLowerCase();
              profile = buildGoogleStudentProfile(fbUser, email);
              await setFirestoreUser(profile);
            } else {
              // Find existing local profile by email to inherit metadata if present
              const localMatch = users.find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());
              profile = {
                id: fbUser.uid,
                name: fbUser.displayName || localMatch?.name || fbUser.email?.split('@')[0] || 'User',
                username: localMatch?.username || fbUser.email?.split('@')[0] || 'user',
                student_id: localMatch?.student_id,
                email: fbUser.email || localMatch?.email || '',
                phone: localMatch?.phone,
                role: localMatch?.role || 'STUDENT',
                course: localMatch?.course || '',
                year: localMatch?.year || '',
                division: localMatch?.division || '',
                profile_completed: localMatch?.role !== 'STUDENT' ? true : Boolean(localMatch?.profile_completed || (localMatch?.course && localMatch?.year && localMatch?.division && localMatch?.student_id)),
                active: true,
                created_at: localMatch?.created_at || new Date().toISOString(),
              };
              await setFirestoreUser(profile);
            }
          }

          if (isMounted) {
            setCurrentUser(profile);
            setUsers(prev => {
              const filtered = prev.filter(u => u.id !== profile!.id && u.email.toLowerCase() !== profile!.email.toLowerCase());
              const updated = [...filtered, profile!];
              try {
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, profile!.id);
              } catch (e) {}
              return updated;
            });
          }
        } catch (err) {
          console.warn('Failed to sync Firebase Auth user profile:', err);
        }
      } else {
        if (isMounted) {
          setCurrentUser(null);
          try {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
          } catch (e) {}
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Load and subscribe to Equipment exclusively from Cloud Firestore when authenticated
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (!currentUser) {
      setEquipment([]);
      return;
    }

    let isMounted = true;
    let unsubscribe: () => void = () => {};

    const fetchEquipment = async () => {
      try {
        const cloudEquipment = await getFirestoreEquipment();
        if (isMounted) {
          setEquipment(
            Array.isArray(cloudEquipment)
              ? dedupeEquipmentList(cloudEquipment.filter(item => !item.sample_data_flag))
              : []
          );
        }
      } catch (err) {
        console.warn('Cloud Firestore equipment fetch failed; showing empty catalog:', err);
        if (isMounted) {
          setEquipment([]);
        }
      }
    };

    fetchEquipment();

    // Real-time subscription for equipment updates
    try {
      unsubscribe = subscribeToFirestoreEquipment(
        (cloudEquipment) => {
          if (!isMounted) return;
          setEquipment(
            Array.isArray(cloudEquipment)
              ? dedupeEquipmentList(cloudEquipment.filter(item => !item.sample_data_flag))
              : []
          );
        },
        () => {
          if (isMounted) {
            setEquipment([]);
          }
        }
      );
    } catch (err) {
      console.warn('Failed to establish Firestore real-time equipment subscription:', err);
      if (isMounted) {
        setEquipment([]);
      }
    }

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser?.id, currentUser?.role]);

  // Load and Real-time listener for Registered Users from Cloud Firestore for Teacher/Admin staff
  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) return;
    if (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') return;

    let isMounted = true;

    // 1. Initial snapshot fetch
    const fetchUsers = async () => {
      try {
        const cloudUsers = await getFirestoreUsers();
        if (isMounted && cloudUsers && cloudUsers.length > 0) {
          setUsers(prev => {
            const map = new Map<string, User>();
            prev.forEach(u => map.set(u.id, u));
            cloudUsers.forEach(u => map.set(u.id, u));
            const merged = Array.from(map.values()).filter(u => u.email.toLowerCase() !== 'aniketbadhe09876@gmail.com');
            try {
              localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('Cloud Firestore users fetch warning:', err);
      }
    };

    fetchUsers();

    // 2. Real-time subscription for teachers/admins
    let unsubscribe: () => void = () => {};
    try {
      unsubscribe = subscribeToFirestoreUsers((cloudUsers) => {
        if (!isMounted) return;
        if (cloudUsers && cloudUsers.length > 0) {
          setUsers(prev => {
            const map = new Map<string, User>();
            prev.forEach(u => map.set(u.id, u));
            cloudUsers.forEach(u => map.set(u.id, u));
            const merged = Array.from(map.values()).filter(u => u.email.toLowerCase() !== 'aniketbadhe09876@gmail.com');
            try {
              localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      });
    } catch (err) {
      console.warn('Failed to establish Firestore real-time users subscription:', err);
    }

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser?.id, currentUser?.role]);

  // Load and Real-time listener for Equipment Requests from Cloud Firestore when authenticated (Steps 4-B & 4-C)
  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) return;

    let isMounted = true;
    const studentFilterId = currentUser?.role === 'STUDENT' ? currentUser.id : undefined;

    // 1. Initial snapshot fetch
    const fetchRequests = async () => {
      try {
        const cloudRequests = await getFirestoreRequests(studentFilterId);

        if (isMounted && cloudRequests) {
          setRequests(prev => {
            if (currentUser.role === 'STUDENT') {
              const others = prev.filter(r => r.student_id !== currentUser.id);
              const merged = [...others, ...cloudRequests];
              try {
                localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(merged));
              } catch (storageErr) {}
              return merged;
            } else {
              try {
                localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(cloudRequests));
              } catch (storageErr) {}
              return cloudRequests;
            }
          });
        }
      } catch (err) {
        console.warn('Cloud Firestore requests fetch unavailable or failed, falling back to localStorage:', err);
      }
    };

    fetchRequests();

    // 2. Real-time subscription (Step 4-C)
    let unsubscribe: () => void = () => {};
    try {
      unsubscribe = subscribeToFirestoreRequests((cloudRequests) => {
        if (!isMounted) return;
        if (cloudRequests) {
          setRequests(prev => {
            if (currentUser.role === 'STUDENT') {
              const others = prev.filter(r => r.student_id !== currentUser.id);
              const merged = [...others, ...cloudRequests];
              try {
                localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(merged));
              } catch (storageErr) {}
              return merged;
            } else {
              try {
                localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(cloudRequests));
              } catch (storageErr) {}
              return cloudRequests;
            }
          });
        }
      }, studentFilterId);
    } catch (err) {
      console.warn('Failed to establish Firestore real-time request subscription:', err);
    }

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser?.id, currentUser?.role]);

  // Load and Real-time listener for Return Records from Cloud Firestore when authenticated (Step 4-E)
  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) return;

    let isMounted = true;
    const studentFilterId = currentUser?.role === 'STUDENT' ? (auth?.currentUser?.uid || currentUser.id) : undefined;

    // 1. Initial snapshot fetch
    const fetchReturns = async () => {
      try {
        const cloudReturns = await getFirestoreReturnRecords(studentFilterId);

        if (isMounted && cloudReturns && cloudReturns.length > 0) {
          setReturnRecords(prev => {
            const cloudIds = new Set(cloudReturns.map(r => r.id));
            const localOnly = prev.filter(r => !cloudIds.has(r.id));
            const merged = [...cloudReturns, ...localOnly];
            try {
              localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(merged));
            } catch (storageErr) {
              console.warn('Failed to cache Firestore returns in localStorage:', storageErr);
            }
            return merged;
          });
        }
      } catch (err) {
        console.warn('Cloud Firestore returns fetch unavailable or failed, falling back to localStorage:', err);
      }
    };

    fetchReturns();

    // 2. Real-time subscription
    let unsubscribe: () => void = () => {};
    try {
      unsubscribe = subscribeToFirestoreReturns((cloudReturns) => {
        if (!isMounted) return;
        if (cloudReturns) {
          setReturnRecords(prev => {
            const cloudIds = new Set(cloudReturns.map(r => r.id));
            const localOnly = prev.filter(r => !cloudIds.has(r.id));
            const merged = [...cloudReturns, ...localOnly];
            try {
              localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(merged));
            } catch (storageErr) {
              console.warn('Failed to cache real-time Firestore returns in localStorage:', storageErr);
            }
            return merged;
          });
        }
      }, studentFilterId);
    } catch (err) {
      console.warn('Failed to establish Firestore real-time return subscription:', err);
    }

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser?.id, currentUser?.role]);

  // Load and Real-time listener for Issue Records from Cloud Firestore when authenticated
  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) return;

    let isMounted = true;
    const studentFilterId = currentUser?.role === 'STUDENT' ? (auth?.currentUser?.uid || currentUser.id) : undefined;

    // 1. Initial snapshot fetch
    const fetchIssues = async () => {
      try {
        const cloudIssues = await getFirestoreIssueRecords(studentFilterId);
        if (isMounted && cloudIssues && cloudIssues.length > 0) {
          setIssueRecords(prev => {
            const cloudIds = new Set(cloudIssues.map(i => i.id));
            const localOnly = prev.filter(i => !cloudIds.has(i.id));
            const merged = [...cloudIssues, ...localOnly];
            try {
              localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(merged));
            } catch (storageErr) {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('Cloud Firestore issues fetch fallback:', err);
      }
    };

    fetchIssues();

    // 2. Real-time subscription
    let unsubscribe: () => void = () => {};
    try {
      unsubscribe = subscribeToFirestoreIssues((cloudIssues) => {
        if (!isMounted) return;
        if (cloudIssues) {
          setIssueRecords(prev => {
            if (currentUser.role === 'STUDENT') {
              const others = prev.filter(i => i.student_id !== currentUser.id);
              const merged = [...others, ...cloudIssues];
              try {
                localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(merged));
              } catch (storageErr) {}
              return merged;
            } else {
              try {
                localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(cloudIssues));
              } catch (storageErr) {}
              return cloudIssues;
            }
          });
        }
      }, studentFilterId);
    } catch (err) {
      console.warn('Failed to establish Firestore real-time issues subscription:', err);
    }

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser?.id, currentUser?.role]);

  // Real-time listener for Settings from Cloud Firestore (settings/app)
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let isMounted = true;
    let unsubscribe: () => void = () => {};

    // 1. Initial snapshot fetch
    getFirestoreSettings().then(cloudSettings => {
      if (isMounted && cloudSettings) {
        if (typeof cloudSettings.logo_url === 'string') {
          setCachedCollegeLogo(cloudSettings.logo_url);
        }
        setSettings(prev => {
          const updated = {
            ...prev,
            ...cloudSettings,
            academic_year: cloudSettings.academic_year || prev.academic_year || '2024-2025'
          };
          try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    }).catch(err => {
      console.warn('Initial Firestore settings fetch warning:', err);
    });

    // 2. Real-time subscription
    try {
      unsubscribe = subscribeToFirestoreSettings((cloudSettings) => {
        if (!isMounted) return;
        if (cloudSettings) {
          if (typeof cloudSettings.logo_url === 'string') {
            setCachedCollegeLogo(cloudSettings.logo_url);
          }
          setSettings(prev => {
            const updated = {
              ...prev,
              ...cloudSettings,
              academic_year: cloudSettings.academic_year || prev.academic_year || '2024-2025'
            };
            try {
              localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      });
    } catch (err) {
      console.warn('Failed to establish Firestore settings subscription:', err);
    }

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser?.id]);

  // Load and Real-time listener for Feedback from Cloud Firestore when authenticated
  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) return;

    let isMounted = true;
    const studentFilterId = currentUser?.role === 'STUDENT' ? (auth?.currentUser?.uid || currentUser.id) : undefined;

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToFirestoreFeedback((cloudFeedback) => {
        if (!isMounted) return;
        if (cloudFeedback) {
          setFeedback(prev => {
            const cloudIds = new Set(cloudFeedback.map(f => f.id));
            const localOnly = prev.filter(f => !cloudIds.has(f.id));
            const merged = [...cloudFeedback, ...localOnly];
            try {
              localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      }, studentFilterId);
    } catch (err) {
      console.warn('Failed to establish Firestore real-time feedback subscription:', err);
    }

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser?.id, currentUser?.role]);

  // Synchronize current logged-in user profile with Firestore (Step 4-F)
  const lastSyncedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) {
      lastSyncedUserIdRef.current = null;
      return;
    }

    // Prevent loop and redundant writes if already synced for this user ID
    if (lastSyncedUserIdRef.current === currentUser.id) {
      return;
    }

    let isMounted = true;
    const syncUserProfile = async () => {
      try {
        const cloudUser = await getFirestoreUserById(currentUser.id);
        if (!isMounted) return;

        if (cloudUser) {
          // Cloud profile exists: treat as cloud authority, preserve role, update React state & cache
          lastSyncedUserIdRef.current = currentUser.id;
          setCurrentUser(cloudUser);
          setUsers(prev => {
            const index = prev.findIndex(u => u.id === cloudUser.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...prev[index], ...cloudUser };
              return updated;
            }
            return [...prev, cloudUser];
          });
          try {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, cloudUser.id);
          } catch (e) {}
        } else {
          // Cloud profile does not exist yet: save current valid local profile to Firestore
          lastSyncedUserIdRef.current = currentUser.id;
          await setFirestoreUser(currentUser);
        }
      } catch (err) {
        console.warn('Firestore user profile sync unavailable or failed, falling back to local user:', err);
      }
    };

    syncUserProfile();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // ==========================================
  // AUTHENTICATION (FIREBASE AUTHENTICATION + OFFLINE FALLBACK)
  // ==========================================
  const login = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; message: string; role?: User['role'] }> => {
    const term = usernameOrEmail.trim().toLowerCase();

    // =========================================================================
    // 1. FIREBASE AUTHENTICATION (PRIMARY WHEN CONFIGURED)
    // =========================================================================
    if (isFirebaseConfigured && isFirebaseAuthReady()) {
      let targetEmail = term;
      const localMatch = users.find(u => 
        u.email.toLowerCase() === targetEmail ||
        (u.username && u.username.toLowerCase() === term) ||
        (u.student_id && u.student_id.toLowerCase() === term)
      );

      if (localMatch && localMatch.email) {
        targetEmail = localMatch.email.toLowerCase();
      }

      if (!targetEmail.includes('@')) {
        return {
          success: false,
          message: 'Please enter a valid email address to sign in with Firebase Authentication.'
        };
      }

      // Execute Firebase signInWithEmailAndPassword
      const fbResult = await firebaseSignIn(targetEmail, password);

      if (fbResult.success && fbResult.user) {
        const fbUser = fbResult.user;
        let profile = await getFirestoreUserById(fbUser.uid);

        if (!profile) {
          // Cloud profile does not exist yet: initialize from local metadata to preserve role (e.g. TEACHER or ADMIN)
          profile = {
            id: fbUser.uid,
            name: fbUser.displayName || localMatch?.name || targetEmail.split('@')[0],
            username: localMatch?.username || targetEmail.split('@')[0],
            student_id: localMatch?.student_id,
            email: fbUser.email || targetEmail,
            phone: localMatch?.phone,
            role: localMatch?.role || 'STUDENT',
            course: localMatch?.course || 'MCA',
            year: localMatch?.year || '1st Year',
            division: localMatch?.division || 'A',
            active: true,
            created_at: localMatch?.created_at || new Date().toISOString(),
          };
          await setFirestoreUser(profile);
        }

        setCurrentUser(profile);
        setUsers(prev => {
          const filtered = prev.filter(u => u.id !== profile!.id && u.email.toLowerCase() !== targetEmail);
          const updated = [...filtered, profile!];
          try {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, profile!.id);
          } catch (e) {}
          return updated;
        });

        return { 
          success: true, 
          message: `Welcome back, ${profile.name}!`, 
          role: profile.role 
        };
      }

      // Handle unauthenticated Firebase result
      if (fbResult.errorCode === 'auth/user-not-found' || fbResult.errorCode === 'auth/invalid-credential') {
        return {
          success: false,
          message: 'Invalid email or password. Please verify your credentials.'
        };
      }

      return {
        success: false,
        message: fbResult.error || 'Firebase Authentication failed. Please verify your credentials.'
      };
    }

    // =========================================================================
    // 2. OFFLINE / LOCAL FALLBACK (ONLY WHEN FIREBASE IS NOT CONFIGURED)
    // =========================================================================
    let user = users.find(u => 
      u.email.toLowerCase() === term ||
      (u.student_id && u.student_id.toLowerCase() === term) ||
      (u.username && u.username.toLowerCase() === term)
    );

    if (!user) {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        user = stored.find((u: User) =>
          u.email.toLowerCase() === term ||
          (u.student_id && u.student_id.toLowerCase() === term) ||
          (u.username && u.username.toLowerCase() === term)
        );
      } catch (e) {
        console.warn('LocalStorage fallback error in login:', e);
      }
    }

    if (user) {
      if (!user.active) {
        return { success: false, message: 'This account has been deactivated by the administrator.' };
      }

      const isValid = await verifyPassword(password, user.password_hash, user.salt, user.password);
      if (isValid) {
        setCurrentUser(user);
        try {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
        } catch (e) {}
        return { success: true, message: `Welcome back, ${user.name}! (Offline Mode)`, role: user.role };
      }
    }

    if (!user) {
      return { success: false, message: 'Invalid credentials. User does not exist.' };
    }
    return { success: false, message: 'Invalid email/username or password.' };
  };

  /**
   * Real Google Authentication for Students strictly restricted to @moonjeinstitute.com.
   * Disallows arbitrary Gmail or external domains, prevents role escalation,
   * creates the required Student profile on first login, and maintains stable Firebase Auth UID.
   */
  const loginWithGoogle = async (): Promise<{ success: boolean; message: string; role?: User['role'] }> => {
    if (!isFirebaseConfigured || !isFirebaseAuthReady()) {
      return {
        success: false,
        message: 'Firebase Authentication is not configured or available.'
      };
    }

    try {
      const res = await firebaseGoogleSignIn();
      if (!res.success || !res.user) {
        return {
          success: false,
          message: res.error || 'Failed to authenticate with Google.'
        };
      }

      const fbUser = res.user;
      const email = (fbUser.email || '').toLowerCase().trim();

      // Double-check student verification (email exists, emailVerified === true, domain === 'moonjeinstitute.com')
      if (!isAllowedGoogleStudent(fbUser)) {
        await firebaseLogout();
        return {
          success: false,
          message: 'Only @moonjeinstitute.com Google accounts are allowed.'
        };
      }

      // Check whether users/{uid} already exists in Firestore
      let profile = await getFirestoreUserById(fbUser.uid);

      if (!profile) {
        // Create new Student profile adhering to exact student registration schema
        const newStudentProfile = buildGoogleStudentProfile(fbUser, email);
        await setFirestoreUser(newStudentProfile);
        profile = newStudentProfile;
      }
      // If profile exists, use it as-is without overwriting its role or metadata!

      setCurrentUser(profile);
      setUsers(prev => {
        const filtered = prev.filter(u => u.id !== profile!.id && u.email.toLowerCase() !== profile!.email.toLowerCase());
        const updated = [...filtered, profile!];
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, profile!.id);
        } catch (e) {}
        return updated;
      });

      return {
        success: true,
        message: `Welcome to SPORTTRACK, ${profile.name}!`,
        role: profile.role
      };
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      return {
        success: false,
        message: err?.message || 'An unexpected error occurred during Google Sign-In.'
      };
    }
  };

  const logout = async () => {
    if (isFirebaseAuthReady()) {
      await firebaseLogout();
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    } catch (e) {}
  };

  const registerUser = async (data: {
    name: string;
    email: string;
    password: string;
    role?: Role;
    student_id?: string;
    course?: string;
    year?: string;
    division?: string;
    phone?: string;
    autoLogin?: boolean;
  }): Promise<{ success: boolean; message: string; user?: User }> => {
    // Prevent role escalation: Public registration MUST ALWAYS create a STUDENT role.
    // Client-submitted role parameters are never trusted for public registrations.
    // Only an active administrator session could create a non-student account internally.
    let role: Role = 'STUDENT';
    if (currentUser?.role === 'ADMIN' && data.role) {
      role = data.role;
    }

    // Check if student registration is permitted by administrator
    if (role === 'STUDENT' && settings.allow_student_registration === false) {
      return { success: false, message: 'Public student registration is currently disabled by the administrator.' };
    }

    const trimmedName = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const studentId = data.student_id ? data.student_id.trim().toUpperCase() : '';

    if (!trimmedName) {
      return { success: false, message: 'Please enter your full name.' };
    }

    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (role === 'STUDENT' && !studentId) {
      return { success: false, message: 'Student ID or Roll Number is required for student registration.' };
    }

    if (!data.password || data.password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const shouldAutoLogin = data.autoLogin !== false;

    // =========================================================================
    // 1. FIREBASE AUTHENTICATION REGISTRATION (WHEN CONFIGURED)
    // =========================================================================
    if (isFirebaseConfigured && isFirebaseAuthReady()) {
      const fbResult = await firebaseRegister(email, data.password);
      if (!fbResult.success || !fbResult.user) {
        return {
          success: false,
          message: fbResult.error || 'Failed to create Firebase Authentication account.'
        };
      }

      const fbUser = fbResult.user;
      const newUser: User = {
        id: fbUser.uid, // MUST match Firebase Auth UID for security rules users/{uid}
        name: trimmedName,
        username: email.split('@')[0],
        student_id: studentId || undefined,
        email: email,
        phone: data.phone?.trim() || '',
        role: role, // Explicitly 'STUDENT'
        course: data.course?.trim() || '',
        year: data.year?.trim() || '',
        division: data.division?.trim() || '',
        profile_completed: Boolean(trimmedName && studentId && data.phone?.trim() && data.course?.trim() && data.year?.trim() && data.division?.trim()),
        active: true,
        created_at: new Date().toISOString(),
      };

      // Create profile in Firestore users/{uid} collection
      await setFirestoreUser(newUser);

      // Update local state and storage
      setUsers(prev => {
        const filtered = prev.filter(u => u.id !== newUser.id && u.email.toLowerCase() !== newUser.email.toLowerCase());
        const updated = [...filtered, newUser];
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      if (shouldAutoLogin) {
        setCurrentUser(newUser);
        try {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
        } catch (e) {}
      }

      addNotification(
        'New Student Enrolled',
        `Student ${newUser.name} (${newUser.email}${newUser.student_id ? ` • ID: ${newUser.student_id}` : ''}) has registered via Firebase Authentication.`,
        'INFO',
        'TEACHER',
        'students',
        newUser.id,
        'STUDENT'
      );

      return { 
        success: true, 
        message: `Student account created successfully with Firebase Authentication! ${shouldAutoLogin ? 'Redirecting to your student dashboard...' : 'You can now sign in.'}`,
        user: newUser 
      };
    }

    // =========================================================================
    // 2. OFFLINE REGISTRATION (WHEN FIREBASE NOT CONFIGURED)
    // =========================================================================
    // Check duplicates across memory and storage
    const allUsers = [...users];
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      stored.forEach((u: User) => {
        if (!allUsers.some(ex => ex.id === u.id)) {
          allUsers.push(u);
        }
      });
    } catch (e) {}

    if (allUsers.some(u => u.email.toLowerCase() === email)) {
      return { success: false, message: 'An account with this email address already exists. Please sign in.' };
    }

    if (studentId && allUsers.some(u => u.student_id && u.student_id.toUpperCase() === studentId)) {
      return { 
        success: false, 
        message: `Student ID / Roll Number "${studentId}" is already registered.`
      };
    }

    // Generate secure salt & hash
    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);

    const newUser: User = {
      id: `user_student_${Date.now()}`,
      name: trimmedName,
      username: email.split('@')[0],
      student_id: studentId || `STU-${Date.now().toString().slice(-6)}`,
      email: email,
      phone: data.phone?.trim() || '',
      password_hash: passwordHash,
      salt: salt,
      role: 'STUDENT',
      course: data.course?.trim() || 'MCA',
      year: data.year?.trim() || '1st Year',
      division: data.division?.trim() || 'A',
      active: true,
      created_at: new Date().toISOString(),
    };

    // Commit to state and storage immediately
    setUsers(prev => {
      const updated = [...prev, newUser];
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Auto-login newly registered user by default
    if (shouldAutoLogin) {
      setCurrentUser(newUser);
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
      } catch (e) {}
    }

    // Dispatch system notification for teachers/faculty
    addNotification(
      'New Student Enrolled',
      `Student ${newUser.name} (${newUser.email}${newUser.student_id ? ` • ID: ${newUser.student_id}` : ''}) has registered.`,
      'INFO',
      'TEACHER',
      'students',
      newUser.id,
      'STUDENT'
    );

    return { 
      success: true, 
      message: `Student account created successfully! ${shouldAutoLogin ? 'Redirecting to your dashboard...' : 'You can now sign in.'}`,
      user: newUser 
    };
  };

  const registerStudent = async (data: {
    name: string;
    student_id: string;
    email: string;
    password: string;
    course: string;
    year: string;
    division: string;
    phone?: string;
    autoLogin?: boolean;
  }): Promise<{ success: boolean; message: string; user?: User }> => {
    return registerUser({
      name: data.name,
      student_id: data.student_id,
      email: data.email,
      password: data.password,
      course: data.course,
      year: data.year,
      division: data.division,
      phone: data.phone,
      role: 'STUDENT',
      autoLogin: data.autoLogin,
    });
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string; resetToken?: string }> => {
    const term = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === term);
    if (!user) {
      return { success: false, message: 'No registered account found with that email address.' };
    }

    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, reset_token: resetCode, reset_token_expires: expiresAt } : u));

    addNotification(
      'Password Reset Code',
      `Verification Code for ${user.email}: ${resetCode} (Valid for 15 minutes)`,
      'ALERT',
      'ALL'
    );

    return { 
      success: true, 
      message: 'Password reset code generated and dispatched to your email.',
      resetToken: resetCode
    };
  };

  const resetPasswordWithToken = async (email: string, token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const term = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === term);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    if (!user.reset_token || user.reset_token !== token.trim()) {
      return { success: false, message: 'Invalid verification code. Please check and re-enter.' };
    }

    if (user.reset_token_expires && new Date(user.reset_token_expires).getTime() < Date.now()) {
      return { success: false, message: 'Verification code has expired. Please request a new one.' };
    }

    if (newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    const salt = generateSalt();
    const hash = await hashPassword(newPassword, salt);

    setUsers(prev => prev.map(u => u.id === user.id ? { 
      ...u, 
      salt, 
      password_hash: hash, 
      password: undefined, 
      reset_token: undefined, 
      reset_token_expires: undefined 
    } : u));

    addNotification(
      'Password Successfully Reset',
      `The password for ${user.email} was successfully updated.`,
      'INFO',
      user.role
    );

    return { success: true, message: 'Password reset successful. Please sign in with your new password.' };
  };

  // ==========================================
  // STUDENT ACTIONS
  // ==========================================
  const requestEquipment = async (
    equipmentId: string, 
    expectedReturn: string, 
    purpose: string, 
    selfiePath?: string,
    quantity: number = 1,
    requiredDate?: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || currentUser.role !== 'STUDENT') {
      return { success: false, message: 'Unauthorized. Student session required.' };
    }

    const eq = equipment.find(e => e.id === equipmentId);
    if (!eq) {
      return { success: false, message: 'Equipment not found.' };
    }

    const requestedQty = Math.max(1, Math.floor(quantity || 1));

    if (eq.available_quantity <= 0) {
      return { success: false, message: 'Equipment is currently out of stock.' };
    }

    if (requestedQty > eq.available_quantity) {
      return { success: false, message: `Only ${eq.available_quantity} available.` };
    }

    // Duplicate submission protection: prevent accidental rapid double-clicks (< 3 seconds)
    // with exact same details, while allowing legitimate subsequent quantity-based requests
    const recentDuplicate = requests.find(r => 
      r.student_id === currentUser.id &&
      r.equipment_id === equipmentId &&
      r.status === 'PENDING' &&
      r.purpose === purpose.trim() &&
      r.expected_return === expectedReturn &&
      r.quantity === requestedQty &&
      (Date.now() - new Date(r.created_at).getTime()) < 3000
    );

    if (recentDuplicate) {
      return { 
        success: false, 
        message: 'Duplicate submission detected. Your request was already received.' 
      };
    }

    const newReq: EquipmentRequest = {
      id: `req_${Date.now()}`,
      student_id: currentUser.id,
      equipment_id: equipmentId,
      quantity: requestedQty,
      required_date: requiredDate || new Date().toISOString().split('T')[0],
      expected_return: expectedReturn,
      purpose: purpose.trim(),
      notes: notes?.trim() || '',
      selfie_path: selfiePath,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    // Firestore Sync: Await write before updating local state
    if (isFirebaseConfigured) {
      try {
        await createFirestoreEquipmentRequest(newReq);
      } catch (err: any) {
        console.error('Firestore createFirestoreEquipmentRequest failed:', err);
        return {
          success: false,
          message: err?.message || 'Failed to submit requisition in Cloud Firestore. Check student permissions or network.'
        };
      }
    }

    // ONLY update local state AFTER the Firestore write succeeds (or if Firebase not configured)
    setRequests(prev => [newReq, ...prev]);

    // Add alert notification for teacher
    addNotification(
      'New Equipment Request',
      `${currentUser.name} requested ${requestedQty}x ${eq.name} for ${purpose.trim()}.`,
      'INFO',
      'TEACHER',
      'requests',
      newReq.id,
      'REQUEST'
    );

    return { success: true, message: 'Requisition submitted for Teacher approval.' };
  };

  const requestReturn = async (issueId: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const issue = issueRecords.find(i => i.id === issueId);
    if (!issue || issue.status !== 'ISSUED') {
      return { success: false, message: 'Valid issued record not found.' };
    }

    // Check if return request already pending
    const existingReturn = returnRecords.find(r => r.issue_id === issueId && r.status === 'RETURN_PENDING');
    if (existingReturn) {
      return { success: false, message: 'Return inspection already initiated.' };
    }

    // Authenticated Firebase user UID used as student_id to strictly satisfy Firestore Security Rules
    const studentUid = auth?.currentUser?.uid || currentUser.id;

    const newReturn: ReturnRecord = {
      id: `ret_${Date.now()}`,
      issue_id: issueId,
      student_id: studentUid,
      requested_at: new Date().toISOString(),
      status: 'RETURN_PENDING',
    };

    // Firestore Sync: Must be awaited FIRST. Only proceed if write succeeds!
    if (isFirebaseConfigured) {
      try {
        await createFirestoreReturnRecord(newReturn);
      } catch (err: any) {
        console.error('Failed to create return record in Cloud Firestore:', err);
        return {
          success: false,
          message: err?.message || 'Failed to submit return request to Cloud Firestore. Please check your connection.'
        };
      }
    }

    // ONLY update local state AFTER the Firestore write succeeds (or if Firebase not configured)
    setReturnRecords(prev => [newReturn, ...prev]);

    // Update issue equipment status to RETURN_PENDING
    setEquipment(prev => prev.map(e => e.id === issue.equipment_id ? { ...e, status: 'RETURN_PENDING' } : e));

    addNotification(
      'Return Inspection Submitted',
      `${currentUser.name} has submitted equipment for return verification.`,
      'WARNING',
      'TEACHER',
      'returns',
      newReturn.id,
      'RETURN'
    );

    return { success: true, message: 'Return initiated! Please present gear to the Sports Desk.' };
  };

  // ==========================================
  // TEACHER REQUEST WORKFLOWS
  // ==========================================
  const createRequestForStudent = async (
    studentId: string,
    equipmentId: string,
    quantity: number = 1,
    expectedReturn: string,
    purpose: string,
    requiredDate?: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    // 1. Authorization: Only faculty (TEACHER or ADMIN) can create requests on behalf of students
    if (!currentUser || (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN')) {
      return { success: false, message: 'Unauthorized. Teacher access required.' };
    }

    // 2. Validate selected student: must exist and have role === 'STUDENT'
    const student = users.find(u => u.id === studentId);
    if (!student || student.role !== 'STUDENT') {
      return { 
        success: false, 
        message: 'Student is not registered. Request cannot be created.' 
      };
    }

    // 3. Validate equipment: must exist and have available inventory
    const eq = equipment.find(e => e.id === equipmentId);
    if (!eq) {
      return { success: false, message: 'Equipment not found.' };
    }

    const requestedQty = Math.max(1, Math.floor(quantity || 1));

    if (eq.available_quantity <= 0) {
      return { success: false, message: 'Equipment is currently out of stock.' };
    }

    if (requestedQty > eq.available_quantity) {
      return { success: false, message: `Only ${eq.available_quantity} available. Cannot request ${requestedQty} units.` };
    }

    if (!expectedReturn) {
      return { success: false, message: 'Please specify an expected return date.' };
    }

    if (!purpose.trim()) {
      return { success: false, message: 'Please provide the purpose for borrowing.' };
    }

    // 4. Duplicate protection (prevent rapid accidental double clicks within 3 seconds)
    const recentDuplicate = requests.find(r => 
      r.student_id === student.id &&
      r.equipment_id === equipmentId &&
      r.status === 'PENDING' &&
      r.purpose === purpose.trim() &&
      r.expected_return === expectedReturn &&
      r.quantity === requestedQty &&
      (Date.now() - new Date(r.created_at).getTime()) < 3000
    );

    if (recentDuplicate) {
      return { 
        success: false, 
        message: 'Duplicate submission detected. Requisition was already created.' 
      };
    }

    // 5. Construct the Request object using the existing schema with audit fields
    const newReq: EquipmentRequest = {
      id: `req_${Date.now()}`,
      student_id: student.id, // Strictly belongs to the selected student!
      equipment_id: equipmentId,
      quantity: requestedQty,
      required_date: requiredDate || new Date().toISOString().split('T')[0],
      expected_return: expectedReturn,
      purpose: purpose.trim(),
      notes: notes?.trim() || '',
      status: 'PENDING', // Starts with the standard initial status PENDING
      created_at: new Date().toISOString(),
      created_by: currentUser.id,
      created_by_role: currentUser.role,
      request_source: 'TEACHER_CREATED',
    };

    // 6. Firestore Sync: Must be awaited FIRST. Only proceed if write succeeds!
    if (isFirebaseConfigured) {
      try {
        await createFirestoreEquipmentRequest(newReq);
      } catch (err: any) {
        console.error('Firestore createFirestoreEquipmentRequest failed:', err);
        return {
          success: false,
          message: err?.message || 'Failed to submit requisition in Cloud Firestore. Check staff permissions or network.'
        };
      }
    }

    // 7. Update local React state ONLY after successful Firestore write
    setRequests(prev => [newReq, ...prev]);

    // 8. Notifications
    // Add alert notification for student
    addNotification(
      'Requisition Created on Your Behalf',
      `Faculty member ${currentUser.name} submitted an emergency requisition for ${requestedQty}x ${eq.name} on your behalf.`,
      'INFO',
      'STUDENT',
      'my-requests',
      newReq.id,
      'REQUEST'
    );

    // Add alert notification for staff/teachers
    addNotification(
      'Offline Student Request Created',
      `${currentUser.name} created an offline requisition for ${student.name} (${requestedQty}x ${eq.name}).`,
      'INFO',
      'TEACHER',
      'requests',
      newReq.id,
      'REQUEST'
    );

    return { 
      success: true, 
      message: `Request created successfully for ${student.name}.` 
    };
  };

  const approveRequest = async (requestId: string, teacherRemarks?: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN')) {
      return { success: false, message: 'Unauthorized. Staff access required.' };
    }

    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found.' };

    const approvedAt = new Date().toISOString();

    // Firestore Sync: Must be awaited FIRST. Only proceed if write succeeds!
    if (isFirebaseConfigured) {
      try {
        await updateFirestoreRequestStatus(requestId, 'APPROVED', {
          approved_at: approvedAt,
          teacher_remarks: teacherRemarks,
        });
      } catch (err: any) {
        console.error('Failed to approve request in Cloud Firestore:', err);
        return {
          success: false,
          message: err?.message || 'Failed to update request status in Cloud Firestore. Check staff permissions or network.'
        };
      }
    }

    // ONLY update local state AFTER the Firestore write succeeds
    setRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { ...r, status: 'APPROVED', approved_at: approvedAt, teacher_remarks: teacherRemarks }
        : r
    ));

    const eq = equipment.find(e => e.id === req.equipment_id);
    addNotification(
      'Your Equipment Request was Approved',
      `Your request for ${eq?.name || 'sports equipment'} has been approved by the sports desk.${teacherRemarks ? ` Note: ${teacherRemarks}` : ''}`,
      'SUCCESS',
      'STUDENT',
      'my-requests',
      requestId,
      'REQUEST'
    );

    return { success: true, message: 'Request approved successfully.' };
  };

  const rejectRequest = async (requestId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN')) {
      return { success: false, message: 'Unauthorized. Staff access required.' };
    }

    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found.' };

    const rejectedAt = new Date().toISOString();
    const rejectionReason = reason.trim();

    // Firestore Sync: Must be awaited FIRST. Only proceed if write succeeds!
    if (isFirebaseConfigured) {
      try {
        await updateFirestoreRequestStatus(requestId, 'REJECTED', {
          rejected_at: rejectedAt,
          rejection_reason: rejectionReason,
        });
      } catch (err: any) {
        console.error('Failed to reject request in Cloud Firestore:', err);
        return {
          success: false,
          message: err?.message || 'Failed to update request rejection in Cloud Firestore. Check staff permissions or network.'
        };
      }
    }

    // ONLY update local state AFTER the Firestore write succeeds
    setRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { ...r, status: 'REJECTED', rejection_reason: rejectionReason, rejected_at: rejectedAt }
        : r
    ));

    const eq = equipment.find(e => e.id === req.equipment_id);
    addNotification(
      'Your Equipment Request was Rejected',
      `Your request for ${eq?.name || 'sports equipment'} was declined.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      'WARNING',
      'STUDENT',
      'my-requests',
      requestId,
      'REQUEST'
    );

    return { success: true, message: 'Request rejected.' };
  };

  const cancelRequest = async (requestId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Not logged in.' };
    }

    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found.' };

    const isStudentOwner = req.student_id === currentUser.id ||
      (Boolean(currentUser.email) && req.student_id.toLowerCase() === (currentUser.email || '').toLowerCase()) ||
      (Boolean(currentUser.student_id) && req.student_id.toUpperCase() === (currentUser.student_id || '').toUpperCase());

    const isStaff = currentUser.role === 'TEACHER' || currentUser.role === 'ADMIN';

    if (!isStudentOwner && !isStaff) {
      return { success: false, message: 'Unauthorized. You can only cancel your own requisitions.' };
    }

    if (req.status !== 'PENDING') {
      return { success: false, message: `Cannot cancel request. Status is already "${req.status}".` };
    }

    const cancelReason = (reason || 'Cancelled by student').trim();

    if (isFirebaseConfigured) {
      try {
        await updateFirestoreRequestStatus(requestId, 'CANCELLED', {
          teacher_remarks: cancelReason,
        });
      } catch (err: any) {
        console.error('Failed to cancel request in Cloud Firestore:', err);
        return {
          success: false,
          message: err?.message || 'Failed to update request cancellation in database.'
        };
      }
    }

    setRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { ...r, status: 'CANCELLED', teacher_remarks: cancelReason }
        : r
    ));

    const eq = equipment.find(e => e.id === req.equipment_id);
    addNotification(
      'Equipment Request Cancelled',
      `Requisition for ${eq?.name || 'sports equipment'} has been cancelled.`,
      'INFO',
      isStaff ? 'STUDENT' : 'TEACHER',
      'my-requests',
      requestId,
      'REQUEST'
    );

    return { success: true, message: 'Request cancelled successfully.' };
  };

  const submitFeedback = async (data: {
    type: FeedbackType;
    subject: string;
    message: string;
    equipment_name?: string;
    quantity?: number;
  }): Promise<{ success: boolean; message: string; feedbackId?: string }> => {
    if (!currentUser) return { success: false, message: 'You must be logged in to submit feedback.' };
    if (currentUser.role !== 'STUDENT') return { success: false, message: 'Only registered students can submit feedback.' };

    const subject = data.subject.trim();
    const message = data.message.trim();

    if (!subject) return { success: false, message: 'Subject is required.' };
    if (subject.length > 100) return { success: false, message: 'Subject cannot exceed 100 characters.' };
    if (!message) return { success: false, message: 'Message is required.' };
    if (message.length > 1000) return { success: false, message: 'Message cannot exceed 1000 characters.' };

    if (data.type === 'EQUIPMENT_NEEDED') {
      if (!data.equipment_name?.trim()) {
        return { success: false, message: 'Equipment name is required for equipment requests.' };
      }
      if (!data.quantity || data.quantity < 1) {
        return { success: false, message: 'Quantity must be at least 1 unit.' };
      }
    }

    const studentUid = auth?.currentUser?.uid || currentUser.id;
    const now = new Date().toISOString();
    const newFeedback: FeedbackItem = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      student_id: studentUid,
      student_name: currentUser.name,
      student_roll: currentUser.student_id || '',
      type: data.type,
      subject,
      message,
      equipment_name: data.type === 'EQUIPMENT_NEEDED' ? data.equipment_name?.trim() : undefined,
      quantity: data.type === 'EQUIPMENT_NEEDED' ? Math.max(1, Math.floor(data.quantity || 1)) : undefined,
      status: 'NEW',
      created_at: now,
      updated_at: now,
    };

    if (isFirebaseConfigured) {
      try {
        await createFirestoreFeedback(newFeedback);
      } catch (err: any) {
        console.error('Failed to submit feedback to Firestore:', err);
        return {
          success: false,
          message: err?.message || 'Failed to save feedback to cloud database. Check network.'
        };
      }
    }

    setFeedback(prev => [newFeedback, ...prev]);
    try {
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify([newFeedback, ...feedback]));
    } catch (e) {}

    addNotification(
      'New Student Feedback Received',
      `${currentUser.name} (${currentUser.student_id || 'Student'}) submitted ${data.type === 'EQUIPMENT_NEEDED' ? 'an equipment request' : 'feedback'}: "${subject}"`,
      'INFO',
      'TEACHER',
      'student-feedback',
      newFeedback.id,
      'FEEDBACK'
    );

    return { 
      success: true, 
      message: 'Feedback submitted successfully! Sports faculty will review your request.', 
      feedbackId: newFeedback.id 
    };
  };

  const replyFeedback = async (
    id: string,
    status: FeedbackStatus,
    replyText?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN')) {
      return { success: false, message: 'Unauthorized: Staff permissions required.' };
    }

    const target = feedback.find(f => f.id === id);
    if (!target) return { success: false, message: 'Feedback record not found.' };

    const now = new Date().toISOString();
    const cleanReply = replyText !== undefined ? replyText.trim() : target.reply;
    const updates: Partial<FeedbackItem> = {
      status,
      reply: cleanReply || undefined,
      replied_by: currentUser.name,
      replied_at: cleanReply ? now : target.replied_at,
      updated_at: now,
    };

    if (isFirebaseConfigured) {
      try {
        await updateFirestoreFeedback(id, updates);
      } catch (err: any) {
        console.error('Failed to update feedback in Firestore:', err);
        return {
          success: false,
          message: err?.message || 'Failed to update feedback in cloud database.'
        };
      }
    }

    setFeedback(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    try {
      const updated = feedback.map(f => f.id === id ? { ...f, ...updates } : f);
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(updated));
    } catch (e) {}

    addNotification(
      `Feedback Update: ${target.subject}`,
      `Sports Faculty updated your feedback status to "${status}"${cleanReply ? `: "${cleanReply}"` : ''}`,
      status === 'RESOLVED' ? 'SUCCESS' : status === 'REJECTED' ? 'WARNING' : 'INFO',
      'STUDENT',
      'feedback-box',
      id,
      'FEEDBACK'
    );

    return { success: true, message: 'Feedback updated and student notified.' };
  };

  const issueEquipment = async (requestId: string, teacherRemarks?: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || currentUser.role !== 'TEACHER') {
      return { success: false, message: 'Unauthorized. Teacher access required.' };
    }

    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found.' };

    const eq = equipment.find(e => e.id === req.equipment_id);
    if (!eq) return { success: false, message: 'Equipment record not found.' };

    const issueQty = req.quantity || 1;
    if (eq.available_quantity < issueQty) {
      return { success: false, message: `Only ${eq.available_quantity} available. Cannot issue ${issueQty} units.` };
    }

    const newIssue: IssueRecord = {
      id: `issue_${Date.now()}`,
      request_id: req.id,
      student_id: req.student_id,
      equipment_id: req.equipment_id,
      quantity: issueQty,
      issued_by: currentUser.id,
      issued_at: new Date().toISOString(),
      expected_return: req.expected_return,
      status: 'ISSUED',
    };

    const newAvailable = Math.max(0, eq.available_quantity - issueQty);
    const newIssued = eq.issued_quantity + issueQty;

    // Firestore Sync: Must be awaited in order before mutating local state
    if (isFirebaseConfigured) {
      try {
        // 1. Atomically update equipment quantities in Firestore using transaction
        await updateFirestoreEquipmentQuantities(
          req.equipment_id,
          -issueQty, // availableDelta
          issueQty,  // issuedDelta
          newAvailable === 0 ? 'ISSUED' : undefined
        );

        // 2. Create IssueRecord in Firestore
        await createFirestoreIssueRecord(newIssue);

        // 3. Update Request status in Firestore to ISSUED
        await updateFirestoreRequestStatus(requestId, 'ISSUED', {
          teacher_remarks: teacherRemarks,
        });
      } catch (err: any) {
        console.error('Failed to issue equipment in Cloud Firestore:', err);
        return {
          success: false,
          message: err?.message || 'Failed to complete equipment issuance in Cloud Firestore. Check teacher permissions or network.'
        };
      }
    }

    // ONLY update local state AFTER the Firestore write succeeds (or if Firebase not configured)
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'ISSUED', teacher_remarks: teacherRemarks } : r));
    setEquipment(prev => prev.map(e => {
      if (e.id === req.equipment_id) {
        return {
          ...e,
          available_quantity: newAvailable,
          issued_quantity: newIssued,
          status: newAvailable === 0 ? 'ISSUED' : 'AVAILABLE',
        };
      }
      return e;
    }));
    setIssueRecords(prev => [newIssue, ...prev]);

    addNotification(
      'Your Equipment is Ready & Issued',
      `${eq.name} (${issueQty} unit${issueQty > 1 ? 's' : ''}) has been officially issued to you. Expected return: ${req.expected_return}.`,
      'SUCCESS',
      'STUDENT',
      'my-equipment',
      newIssue.id,
      'ISSUE'
    );

    return { success: true, message: `Equipment successfully issued to student.` };
  };

  const acceptReturn = async (returnId: string, condition: ReturnInspectionOutcome, remarks: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN')) {
      return { success: false, message: 'Unauthorized. Teacher access required.' };
    }

    if (condition === 'LOST' && !remarks.trim()) {
      return { success: false, message: 'Inspection remarks are required when recording equipment as LOST.' };
    }

    let returnRec = returnRecords.find(r => r.id === returnId);
    let issue: IssueRecord | undefined;

    if (returnRec) {
      issue = issueRecords.find(i => i.id === returnRec.issue_id);
    } else {
      // Check if returnId corresponds to an issue ID or quick return
      const cleanIssueId = returnId.replace(/^ret_quick_/, '');
      issue = issueRecords.find(i => i.id === returnId || i.id === cleanIssueId);
      if (!issue) {
        returnRec = returnRecords.find(r => r.issue_id === cleanIssueId || r.issue_id === returnId);
        if (returnRec) {
          issue = issueRecords.find(i => i.id === returnRec.issue_id);
        }
      }
      if (issue && !returnRec) {
        returnRec = {
          id: returnId.startsWith('ret_') ? returnId : `ret_${Date.now()}`,
          issue_id: issue.id,
          student_id: issue.student_id,
          requested_at: new Date().toISOString(),
          status: 'RETURNED',
          accepted_at: new Date().toISOString(),
          accepted_by: currentUser.id,
          condition,
          remarks: remarks.trim()
        };
      }
    }

    if (!returnRec) return { success: false, message: 'Return record not found.' };
    if (!issue) return { success: false, message: 'Associated issue record not found.' };

    const eq = equipment.find(e => e.id === issue.equipment_id);
    if (!eq) return { success: false, message: 'Equipment record not found.' };

    const returnQty = issue.quantity || 1;
    const isDamaged = condition === 'DAMAGED';
    const isLost = condition === 'LOST';

    // Quantity handling:
    // When gear is returned, issued_quantity decreases by returnQty (released from student custody).
    // available_quantity increases by returnQty so that the fundamental invariant:
    // available_quantity + issued_quantity = total_quantity is strictly maintained across all inspections.
    const newIssued = Math.max(0, eq.issued_quantity - returnQty);
    const newAvailable = eq.available_quantity + returnQty;

    // Equipment condition and status:
    const newEquipmentCondition: EquipmentCondition = isLost ? (eq.condition || 'FAIR') : (condition as EquipmentCondition);
    const newStatus: EquipmentStatus = isDamaged ? 'DAMAGED' : 'AVAILABLE';

    const availableDelta = returnQty;
    const issuedDelta = -returnQty;
    const acceptedAt = new Date().toISOString();
    const trimmedRemarks = remarks.trim();

    // Firestore Sync: Await writes in order before mutating local state
    // 1. Equipment quantity transaction first
    // 2. Return record
    // 3. Issue record
    // 4. Request status
    if (isFirebaseConfigured) {
      try {
        // 1. Equipment quantity transaction first
        await updateFirestoreEquipmentQuantities(
          issue.equipment_id,
          availableDelta,
          issuedDelta,
          newStatus,
          isLost ? undefined : (condition as EquipmentCondition)
        );

        // 2. Return record in Firestore
        const isPreExistingReturn = returnRecords.some(r => r.id === returnRec!.id);
        const returnPayload: ReturnRecord = {
          ...returnRec,
          status: 'RETURNED',
          accepted_at: acceptedAt,
          accepted_by: currentUser.id,
          condition,
          remarks: trimmedRemarks,
        };
        if (isPreExistingReturn) {
          await updateFirestoreReturnRecord(returnRec.id, {
            status: 'RETURNED',
            accepted_at: acceptedAt,
            accepted_by: currentUser.id,
            condition,
            remarks: trimmedRemarks,
          });
        } else {
          await createFirestoreReturnRecord(returnPayload);
        }

        // 3. Update Issue Record in Firestore to RETURNED
        await updateFirestoreIssueRecord(issue.id, {
          status: 'RETURNED',
          actual_return: acceptedAt,
        });

        // 4. Update Request status in Firestore to RETURNED
        if (issue.request_id) {
          await updateFirestoreRequestStatus(issue.request_id, 'RETURNED');
        }
      } catch (err: any) {
        console.error('Firestore acceptReturn failed:', err);
        return {
          success: false,
          message: err?.message || 'Failed to complete return transaction in Cloud Firestore. Check staff permissions or network.'
        };
      }
    }

    // ONLY update local state AFTER the Firestore writes succeed (or if Firebase not configured)
    // 1. Update Return Record
    setReturnRecords(prev => {
      const exists = prev.some(r => r.id === returnRec!.id);
      if (exists) {
        return prev.map(r => 
          r.id === returnRec!.id 
            ? { ...r, status: 'RETURNED', accepted_at: acceptedAt, accepted_by: currentUser.id, condition, remarks: trimmedRemarks }
            : r
        );
      }
      return [{
        ...returnRec!,
        status: 'RETURNED',
        accepted_at: acceptedAt,
        accepted_by: currentUser.id,
        condition,
        remarks: trimmedRemarks,
      }, ...prev];
    });

    // 2. Update Issue Record (Status becomes RETURNED, so it immediately drops off Overdue Tracker)
    setIssueRecords(prev => prev.map(i => 
      i.id === issue!.id 
        ? { ...i, status: 'RETURNED', actual_return: acceptedAt }
        : i
    ));

    // 3. Update Request
    setRequests(prev => prev.map(r => 
      r.id === issue!.request_id 
        ? { ...r, status: 'RETURNED' }
        : r
    ));

    // 4. Update Equipment condition and quantities
    setEquipment(prev => prev.map(e => {
      if (e.id === issue!.equipment_id) {
        return {
          ...e,
          condition: newEquipmentCondition,
          status: newStatus,
          available_quantity: newAvailable,
          issued_quantity: newIssued,
          remarks: remarks ? `${e.remarks} [Return remark: ${trimmedRemarks}]` : e.remarks,
        };
      }
      return e;
    }));

    // Notifications
    if (isLost) {
      addNotification(
        'Equipment Processed as LOST',
        `${eq.name} (${returnQty} unit${returnQty > 1 ? 's' : ''}) has been officially registered as LOST.${remarks ? ` Remarks: ${remarks}` : ''} Your custody has been cleared.`,
        'ALERT',
        'STUDENT',
        'my-equipment',
        issue.id,
        'RETURN'
      );
      addNotification(
        `Equipment Flagged LOST: ${eq.name}`,
        `Student return processed: ${returnQty} unit(s) of ${eq.name} marked as LOST. Remarks: ${trimmedRemarks}. Student released; write-off pending in Equipment Management.`,
        'ALERT',
        'TEACHER',
        'returns',
        returnRec.id,
        'RETURN'
      );
    } else if (isDamaged) {
      addNotification(
        'Equipment Returned (Flagged Damaged)',
        `Return inspection for ${eq.name} completed and accepted with condition: DAMAGED.${remarks ? ` Remarks: ${remarks}` : ''}`,
        'ALERT',
        'STUDENT',
        'my-equipment',
        issue.id,
        'RETURN'
      );
      addNotification(
        `Equipment Flagged DAMAGED: ${eq.name}`,
        `Student returned ${eq.name} in DAMAGED condition.${remarks ? ` Remarks: ${remarks}` : ''} Requires faculty inspection/repair.`,
        'ALERT',
        'TEACHER',
        'returns',
        returnRec.id,
        'RETURN'
      );
    } else {
      addNotification(
        'Equipment Return Accepted',
        `Return inspection for ${eq.name} completed and accepted with condition: ${condition}.${remarks ? ` Remarks: ${remarks}` : ''}`,
        'SUCCESS',
        'STUDENT',
        'my-equipment',
        issue.id,
        'RETURN'
      );
      addNotification(
        `Equipment Return Processed: ${eq.name}`,
        `${eq.name} (${returnQty} unit${returnQty > 1 ? 's' : ''}) verified and restocked in ${condition} condition.`,
        'INFO',
        'TEACHER',
        'returns',
        returnRec.id,
        'RETURN'
      );
    }

    return { 
      success: true, 
      message: isLost 
        ? 'Return processed. Equipment marked as LOST and student released from custody.' 
        : isDamaged 
          ? 'Return accepted and item flagged as DAMAGED for repair/quarantine.' 
          : 'Return accepted. Item restored to Available inventory.' 
    };
  };

  const editRequest = (requestId: string, updates: Partial<EquipmentRequest>) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));
    return { success: true, message: 'Request updated successfully.' };
  };

  const deleteRequest = (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
    return { success: true, message: 'Request removed from register.' };
  };

  const dedupedEquipment = useMemo(() => dedupeEquipmentList(equipment), [equipment]);

  // ==========================================
  // EQUIPMENT CRUD
  // ==========================================
  const addEquipment = async (item: Omit<Equipment, 'id' | 'created_at' | 'active' | 'available_quantity' | 'issued_quantity'> & { available_quantity?: number; issued_quantity?: number }): Promise<{ success: boolean; message: string }> => {
    if (currentUser && currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized: Only faculty and staff can add equipment.' };
    }

    const code = (item.equipment_code || '').trim().toUpperCase();
    if (!code) {
      return { success: false, message: 'Equipment Code is required.' };
    }
    if (dedupedEquipment.some(e => e.equipment_code.trim().toUpperCase() === code)) {
      return { success: false, message: `Equipment Code "${code}" is already in use.` };
    }

    const cleanName = (item.name || '').trim();
    if (!cleanName) {
      return { success: false, message: 'Equipment Name is required.' };
    }

    const cleanSportId = (item.sport_id || '').trim();
    if (!cleanSportId) {
      return { success: false, message: 'Sport / Discipline is required.' };
    }

    const totalQty = Number(item.quantity ?? 1);
    if (!Number.isInteger(totalQty) || totalQty <= 0) {
      return { success: false, message: 'Quantity must be a positive whole number greater than 0.' };
    }

    const docId = generateFirestoreEquipmentDocId();
    const newEquipment: Equipment = {
      ...item,
      id: docId,
      equipment_code: code,
      name: cleanName,
      sport_id: cleanSportId,
      condition: item.condition || 'GOOD',
      status: item.status || 'AVAILABLE',
      quantity: totalQty,
      available_quantity: item.available_quantity ?? totalQty,
      issued_quantity: item.issued_quantity ?? 0,
      purchase_date: item.purchase_date || new Date().toISOString().split('T')[0],
      remarks: (item.remarks || '').trim(),
      created_at: new Date().toISOString(),
      active: true,
    };

    // Firestore Sync: Await write first using the canonical Firestore document ID
    if (isFirebaseConfigured) {
      try {
        await addOrUpdateFirestoreEquipment(newEquipment);
      } catch (err: any) {
        console.error('Failed to add equipment in Firestore:', err);
        return { success: false, message: err?.message || 'Failed to save equipment to database.' };
      }
    }

    // Update state once after success, de-duplicating against any realtime snapshot that arrived mid-await
    setEquipment(prev =>
      dedupeEquipmentList([
        newEquipment,
        ...prev.filter(
          e => e.id !== newEquipment.id && e.equipment_code.trim().toUpperCase() !== code
        ),
      ])
    );
    return { success: true, message: `Equipment "${newEquipment.name}" (${totalQty} ${totalQty === 1 ? 'unit' : 'units'}) added to inventory.` };
  };

  const editEquipment = async (id: string, updates: Partial<Equipment>): Promise<{ success: boolean; message: string }> => {
    // Permission check: only authorized staff (TEACHER or ADMIN)
    if (currentUser && currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized: Only faculty and staff can edit equipment specifications and quantities.' };
    }

    const currentItem = equipment.find(e => e.id === id);
    if (!currentItem) {
      return { success: false, message: 'Equipment record not found.' };
    }

    if (updates.equipment_code) {
      const code = updates.equipment_code.trim().toUpperCase();
      if (equipment.some(e => e.id !== id && e.equipment_code.toUpperCase() === code)) {
        return { success: false, message: `Equipment Code "${code}" is already assigned to another item.` };
      }
      updates.equipment_code = code;
    }

    // Process and validate Total Quantity if specified
    if (updates.quantity !== undefined) {
      const newTotal = Number(updates.quantity);
      if (isNaN(newTotal) || !Number.isInteger(newTotal) || newTotal <= 0) {
        return { success: false, message: 'Total quantity must be a positive whole number greater than 0.' };
      }

      const currentIssued = currentItem.issued_quantity ?? 0;
      if (newTotal < currentIssued) {
        return {
          success: false,
          message: `Cannot reduce total quantity below currently issued quantity (${currentIssued}).`
        };
      }

      // Auto-calculate: available_quantity = total quantity - issued_quantity
      const newAvailable = newTotal - currentIssued;
      if (newAvailable < 0) {
        return { success: false, message: 'Available quantity cannot be negative.' };
      }

      updates.quantity = newTotal;
      updates.available_quantity = newAvailable;
      updates.issued_quantity = currentIssued; // Guarantee consistency; cannot be altered manually

      // Adjust status automatically if stock changes
      if (currentItem.status === 'AVAILABLE' || currentItem.status === 'ISSUED') {
        if (newAvailable === 0 && currentIssued > 0) {
          updates.status = 'ISSUED';
        } else if (newAvailable > 0 && currentItem.status === 'ISSUED') {
          updates.status = 'AVAILABLE';
        }
      }
    }

    const target: Equipment = {
      ...currentItem,
      ...updates,
      id: currentItem.id,
      equipment_code: updates.equipment_code || currentItem.equipment_code,
    };

    // Firestore Sync: Await write before updating state
    if (isFirebaseConfigured) {
      try {
        await addOrUpdateFirestoreEquipment(target);
      } catch (err: any) {
        console.error('Failed to update equipment in Firestore:', err);
        return { success: false, message: err?.message || 'Failed to update equipment in database.' };
      }
    }

    setEquipment(prev => prev.map(e => e.id === id ? target : e));

    return { 
      success: true, 
      message: updates.quantity !== undefined
        ? `Equipment updated successfully. Total: ${updates.quantity}, Available: ${updates.available_quantity ?? currentItem.available_quantity}, Issued: ${currentItem.issued_quantity ?? 0}.`
        : 'Equipment specifications updated.' 
    };
  };

  const deleteEquipment = async (id: string): Promise<{ success: boolean; message: string }> => {
    // Check if currently issued
    const hasActiveIssue = issueRecords.some(i => i.equipment_id === id && i.status === 'ISSUED');
    if (hasActiveIssue) {
      return { success: false, message: 'Cannot delete equipment that is currently issued to a student.' };
    }

    if (isFirebaseConfigured) {
      try {
        await deleteFirestoreEquipment(id);
      } catch (err: any) {
        console.error('Failed to delete equipment from Firestore:', err);
        return { success: false, message: err?.message || 'Failed to delete equipment from database.' };
      }
    }

    setEquipment(prev => prev.filter(e => e.id !== id));
    return { success: true, message: 'Equipment item deleted permanently.' };
  };

  const bulkCreateEquipment = async (
    prefix: string, 
    name: string, 
    sportId: string, 
    condition: EquipmentCondition, 
    quantity: number, 
    purchaseDate: string
  ): Promise<{ success: boolean; message: string; createdCount: number }> => {
    if (currentUser && currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized: Only faculty and staff can add equipment.', createdCount: 0 };
    }

    const cleanPrefix = (prefix || '').trim().toUpperCase();
    if (!cleanPrefix) {
      return { success: false, message: 'Code Prefix is required.', createdCount: 0 };
    }

    const cleanName = (name || '').trim();
    if (!cleanName) {
      return { success: false, message: 'Base Equipment Name is required.', createdCount: 0 };
    }

    const cleanSportId = (sportId || '').trim();
    if (!cleanSportId) {
      return { success: false, message: 'Sport / Discipline is required.', createdCount: 0 };
    }

    const count = Number(quantity);
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      return { success: false, message: 'Quantity must be a whole number between 1 and 50.', createdCount: 0 };
    }

    const existingCodes = new Set(dedupedEquipment.map(e => e.equipment_code.trim().toUpperCase()));
    const newItems: Equipment[] = [];
    let counter = 1;

    for (let i = 0; i < count; i++) {
      let code = `${cleanPrefix}-${String(counter).padStart(3, '0')}`;
      while (existingCodes.has(code)) {
        counter++;
        code = `${cleanPrefix}-${String(counter).padStart(3, '0')}`;
      }
      existingCodes.add(code);
      counter++;

      newItems.push({
        id: generateFirestoreEquipmentDocId(),
        equipment_code: code,
        name: cleanName,
        sport_id: cleanSportId,
        condition,
        status: 'AVAILABLE',
        quantity: 1,
        available_quantity: 1,
        issued_quantity: 0,
        purchase_date: purchaseDate || new Date().toISOString().split('T')[0],
        remarks: 'Batch registered item',
        created_at: new Date().toISOString(),
        active: true,
      });
    }

    if (isFirebaseConfigured) {
      try {
        await batchCreateFirestoreEquipment(newItems);
      } catch (err: any) {
        console.error('Failed to bulk create equipment in Firestore:', err);
        return { success: false, message: err?.message || 'Failed to save batch equipment to database.', createdCount: 0 };
      }
    }

    setEquipment(prev => {
      const addedIds = new Set(newItems.map(n => n.id));
      const addedCodes = new Set(newItems.map(n => n.equipment_code.trim().toUpperCase()));
      return dedupeEquipmentList([
        ...newItems,
        ...prev.filter(
          e => !addedIds.has(e.id) && !addedCodes.has(e.equipment_code.trim().toUpperCase())
        ),
      ]);
    });
    return { success: true, message: `Successfully registered ${newItems.length} units with prefix "${cleanPrefix}".`, createdCount: newItems.length };
  };

  const updateEquipmentStatus = async (id: string, status: Equipment['status'], remarks?: string): Promise<{ success: boolean; message: string }> => {
    const current = equipment.find(e => e.id === id);
    if (!current) {
      return { success: false, message: 'Equipment record not found.' };
    }

    const updated: Equipment = {
      ...current,
      status,
      remarks: remarks ? `${current.remarks} [${remarks}]` : current.remarks
    };

    if (isFirebaseConfigured) {
      try {
        await addOrUpdateFirestoreEquipment(updated);
      } catch (err: any) {
        console.error('Failed to update equipment status in Firestore:', err);
        return { success: false, message: err?.message || 'Failed to update equipment status in database.' };
      }
    }

    setEquipment(prev => prev.map(e => e.id === id ? updated : e));
    return { success: true, message: `Status updated to ${status}.` };
  };

  const replaceEquipmentCatalogState = (newEquipment: Equipment[]) => {
    const cleanEquipment = dedupeEquipmentList(newEquipment);
    setEquipment(cleanEquipment);
    if (!isFirebaseConfigured) {
      try {
        localStorage.setItem(STORAGE_KEYS.EQUIPMENT_REPLACED, 'true');
        localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(cleanEquipment));
      } catch (e) {
        console.warn('Failed to save replaced equipment to local storage', e);
      }
    }
  };

  const refreshEquipmentFromFirestore = async (): Promise<Equipment[]> => {
    if (!isFirebaseConfigured) {
      return dedupedEquipment;
    }
    const cloudEquipment = await getFirestoreEquipment();
    const cleanEquipment = Array.isArray(cloudEquipment)
      ? dedupeEquipmentList(cloudEquipment.filter(item => !item.sample_data_flag))
      : [];
    setEquipment(cleanEquipment);
    return cleanEquipment;
  };

  // ==========================================
  // STUDENT MANAGEMENT CRUD
  // ==========================================
  const addStudent = async (student: {
    name: string;
    student_id: string;
    email: string;
    phone?: string;
    course: string;
    year: string;
    division: string;
    username?: string;
    password?: string;
  }) => {
    return registerUser({
      name: student.name,
      student_id: student.student_id,
      email: student.email,
      phone: student.phone,
      course: student.course,
      year: student.year,
      division: student.division,
      password: student.password || 'Student@123',
      role: 'STUDENT',
      autoLogin: false, // Keep current teacher session intact
    });
  };

  const editStudent = async (id: string, updates: Partial<User>): Promise<{ success: boolean; message: string }> => {
    if (updates.student_id) {
      const sId = updates.student_id.trim().toUpperCase();
      if (users.some(u => u.id !== id && u.student_id && u.student_id.toUpperCase() === sId)) {
        return { success: false, message: `Student ID "${sId}" is already assigned to another student.` };
      }
      updates.student_id = sId;
    }
    if (updates.email) {
      const mail = updates.email.trim().toLowerCase();
      if (users.some(u => u.id !== id && u.email.toLowerCase() === mail)) {
        return { success: false, message: `Email "${mail}" is already in use.` };
      }
      updates.email = mail;
    }

    if (isFirebaseConfigured) {
      try {
        await updateFirestoreUser(id, updates);
      } catch (err: any) {
        console.error('Failed to update student in Firestore:', err);
        return { success: false, message: err?.message || 'Failed to update student record in database.' };
      }
    }

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    return { success: true, message: 'Student record updated.' };
  };

  const deleteStudent = async (id: string): Promise<{ success: boolean; message: string }> => {
    // 1. Role Authorization Check: Only TEACHER or ADMIN can delete
    if (!currentUser || (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN')) {
      return { 
        success: false, 
        message: 'Unauthorized: Only authorized Sports Teachers and Administrators are permitted to delete student accounts.' 
      };
    }

    // 2. Validate Target User: Must exist and must be a STUDENT
    const targetStudent = users.find(u => u.id === id);
    if (!targetStudent) {
      return { success: false, message: 'Student account not found.' };
    }

    if (targetStudent.role !== 'STUDENT') {
      return { 
        success: false, 
        message: 'Security Violation: Staff accounts (Teachers & Admins) cannot be deleted through student management.' 
      };
    }

    // 3. Check for unreturned equipment / active loans
    const activeLoans = issueRecords.filter(i => i.student_id === id && i.status === 'ISSUED');
    if (activeLoans.length > 0) {
      return { 
        success: false, 
        message: `Cannot delete student "${targetStudent.name}". They currently have ${activeLoans.length} active equipment item(s) on loan. All items must be returned before deletion.` 
      };
    }

    // 4. Server-Side Permanent Deletion (Firebase Auth + Firestore)
    let backendEndpointReached = false;
    if (isFirebaseConfigured && auth && auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const apiRes = await fetch(`/api/students/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });

        const contentType = apiRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const resData = await apiRes.json().catch(() => null);
          if (apiRes.ok && resData?.success) {
            backendEndpointReached = true;
          } else if (resData?.message) {
            console.warn('[AppContext] Backend student deletion returned warning:', resData.message);
          }
        } else {
          console.warn('[AppContext] /api/students endpoint returned non-JSON (static hosting environment)');
        }
      } catch (apiErr) {
        console.warn('[AppContext] Backend student deletion call notice:', apiErr);
      }
    }

    // 5. Delete Firestore Document users/{id} directly via Firestore SDK
    if (isFirebaseConfigured) {
      try {
        await deleteFirestoreUser(id);
      } catch (firestoreErr: any) {
        console.error('[AppContext] Firestore student document delete error:', firestoreErr);
        return {
          success: false,
          message: firestoreErr?.message || 'Failed to delete student record from Cloud Firestore.'
        };
      }
    }

    // 6. Clean up local state and storage
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    addNotification(
      'Student Account Deleted',
      `Student profile for ${targetStudent.name} (${targetStudent.student_id || targetStudent.email}) has been removed by ${currentUser.name}.`,
      'WARNING',
      'TEACHER',
      'students',
      targetStudent.id,
      'STUDENT'
    );

    return { 
      success: true, 
      message: backendEndpointReached
        ? `Student profile and authentication account for ${targetStudent.name} permanently deleted.`
        : `Student profile for ${targetStudent.name} removed from database. (Note: Server-side Auth deletion endpoint is not available on static hosting).`
    };
  };

  const deleteMyAccount = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const activeLoans = issueRecords.filter(i => 
      (i.student_id === currentUser.id ||
      (Boolean(currentUser.email) && i.student_id.toLowerCase() === (currentUser.email || '').toLowerCase()) ||
      (Boolean(currentUser.student_id) && i.student_id.toUpperCase() === (currentUser.student_id || '').toUpperCase())) &&
      i.status === 'ISSUED'
    );

    if (activeLoans.length > 0) {
      return { 
        success: false, 
        message: `Cannot delete account. You currently have ${activeLoans.length} active equipment item(s) on loan. Please return all equipment before closing your account.` 
      };
    }

    const userId = currentUser.id;

    if (isFirebaseConfigured) {
      try {
        await deleteFirestoreUser(userId);
      } catch (err: any) {
        console.warn('Firestore user delete notice:', err);
      }
    }

    setUsers(prev => {
      const updated = prev.filter(u => u.id !== userId);
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    await logout();
    return { success: true, message: 'Your account has been deleted successfully.' };
  };

  const toggleUserActive = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };

    const newStatus = !user.active;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: newStatus } : u));
    return { success: true, message: `Account ${newStatus ? 'activated' : 'deactivated'}.` };
  };

  const resetStudentPassword = async (userId: string, newPass: string) => {
    if (newPass.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }
    const salt = generateSalt();
    const hash = await hashPassword(newPass, salt);
    setUsers(prev => prev.map(u => u.id === userId ? { 
      ...u, 
      salt, 
      password_hash: hash, 
      password: undefined 
    } : u));
    return { success: true, message: 'Password reset successfully.' };
  };

  // ==========================================
  // STAFF MANAGEMENT (TEACHER & ADMIN)
  // ==========================================
  const createStaffUser = async (data: {
    name: string;
    email: string;
    phone?: string;
    role: 'TEACHER' | 'ADMIN';
    password: string;
  }): Promise<{ success: boolean; message: string; user?: User }> => {
    // 1. Strict Authorization check: ONLY active TEACHER or ADMIN can provision staff
    if (!currentUser || (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN')) {
      return { 
        success: false, 
        message: 'Unauthorized: Students are not permitted to access staff management or provision staff accounts.' 
      };
    }

    const trimmedName = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const selectedRole = data.role;

    if (!trimmedName) {
      return { success: false, message: 'Please enter the staff member’s full name.' };
    }

    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid official email address.' };
    }

    if (selectedRole !== 'TEACHER' && selectedRole !== 'ADMIN') {
      return { success: false, message: 'Invalid role selected. Staff must be assigned TEACHER or ADMIN.' };
    }

    // Role-enforcement: TEACHER can NEVER create ADMIN
    if (currentUser.role === 'TEACHER' && selectedRole !== 'TEACHER') {
      return {
        success: false,
        message: 'Permission denied: Sports Teachers are only authorized to create Sports Teacher accounts. Administrator accounts require Administrator authorization.'
      };
    }

    if (!data.password || data.password.length < 6) {
      return { success: false, message: 'Initial temporary password must be at least 6 characters long.' };
    }

    // Check if email already exists in users list
    if (users.some(u => u.email.toLowerCase() === email)) {
      return { 
        success: false, 
        message: `An account with email "${email}" already exists.` 
      };
    }

    // 2. Primary: Provision via Secure Backend API Endpoint (/api/staff)
    let createdStaffUser: User | null = null;
    let apiErrorMessage: string | null = null;

    try {
      const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      if (idToken) {
        const apiRes = await fetch('/api/staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            name: trimmedName,
            email: email,
            phone: data.phone?.trim() || '',
            role: selectedRole,
            password: data.password,
            clientApiKey: firebaseConfig.apiKey,
          }),
        });

        const resData = await apiRes.json().catch(() => null);

        if (apiRes.ok && resData?.success && resData.user) {
          createdStaffUser = resData.user as User;
        } else if (resData?.message) {
          // If server explicitly rejected with permission or validation error, return immediately
          if (apiRes.status === 403 || apiRes.status === 409 || apiRes.status === 400) {
            return {
              success: false,
              message: resData.message,
            };
          }
          apiErrorMessage = resData.message;
        }
      }
    } catch (e: any) {
      console.warn('Backend /api/staff call failed, evaluating client fallback:', e);
    }

    // 3. Fallback: If backend endpoint was not reached, provision via secondary client app (never disrupting session)
    if (!createdStaffUser) {
      let newUid: string;
      if (isFirebaseConfigured && isFirebaseAuthReady()) {
        const fbResult = await adminCreateStaffAuthUser(email, data.password);
        if (!fbResult.success || !fbResult.uid) {
          return {
            success: false,
            message: fbResult.error || apiErrorMessage || 'Failed to create Firebase Authentication account for staff.'
          };
        }
        newUid = fbResult.uid;
      } else {
        newUid = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }

      // Create staff profile in Firestore users/{uid}
      const staffProfile: User = {
        id: newUid, // Firebase Auth UID
        name: trimmedName,
        username: email.split('@')[0],
        email: email,
        phone: data.phone?.trim() || '',
        role: selectedRole,
        active: true,
        created_at: new Date().toISOString(),
      };

      if (isFirebaseConfigured) {
        try {
          await setFirestoreUser(staffProfile);
        } catch (err) {
          console.warn('Failed to save staff profile in Firestore:', err);
          return {
            success: false,
            message: 'Staff authentication account was created, but failed to write user profile to Firestore.'
          };
        }
      }

      createdStaffUser = staffProfile;
    }

    // 4. Update in-memory state and local storage
    setUsers(prev => {
      const filtered = prev.filter(u => u.id !== createdStaffUser!.id && u.email.toLowerCase() !== email);
      const updated = [...filtered, createdStaffUser!];
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    addNotification(
      'New Staff Member Provisioned',
      `${trimmedName} has been enrolled as ${selectedRole === 'ADMIN' ? 'an Administrator' : 'a Sports Teacher'}.`,
      'INFO',
      'TEACHER',
      'staff-management',
      createdStaffUser.id,
      'STAFF'
    );

    return {
      success: true,
      message: `Successfully provisioned ${selectedRole === 'ADMIN' ? 'Administrator' : 'Sports Teacher'} account for ${trimmedName}.`,
      user: createdStaffUser
    };
  };

  const toggleStaffActiveStatus = async (staffId: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized: Only administrators can modify staff status.' };
    }
    const target = users.find(u => u.id === staffId);
    if (!target) {
      return { success: false, message: 'Staff member record not found.' };
    }
    if (target.id === currentUser.id) {
      return { success: false, message: 'You cannot deactivate your own active administrator account.' };
    }

    const updatedUser: User = { ...target, active: !target.active };
    if (isFirebaseConfigured) {
      try {
        await setFirestoreUser(updatedUser);
      } catch (err: any) {
        console.error('Failed to update staff status in Firestore:', err);
        return { success: false, message: err?.message || 'Failed to update staff status in Cloud Firestore.' };
      }
    }

    setUsers(prev => {
      const updated = prev.map(u => u.id === staffId ? updatedUser : u);
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    return {
      success: true,
      message: `Staff account for ${target.name} has been ${updatedUser.active ? 'activated' : 'deactivated'}.`
    };
  };

  // ==========================================
  // VIDEO / LEARN & PLAY CRUD
  // ==========================================
  const addVideo = (video: Omit<VideoItem, 'id' | 'created_at'>) => {
    const newVideo: VideoItem = {
      ...video,
      id: `vid_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setVideos(prev => [newVideo, ...prev]);
    return { success: true, message: 'Video tutorial published to Learn & Play.' };
  };

  const editVideo = (id: string, updates: Partial<VideoItem>) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    return { success: true, message: 'Video details saved.' };
  };

  const deleteVideo = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
    return { success: true, message: 'Video tutorial removed.' };
  };

  const togglePublishVideo = (id: string) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, published: !v.published } : v));
    return { success: true, message: 'Publish status toggled.' };
  };

  // ==========================================
  // SPORTS CATEGORIES CRUD
  // ==========================================
  const addSport = (name: string, description: string) => {
    const cleanName = name.trim();
    if (sports.some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
      return { success: false, message: `Sport category "${cleanName}" already exists.` };
    }

    const newSport: Sport = {
      id: `sport_${Date.now()}`,
      name: cleanName,
      description: description.trim(),
      active: true,
      created_at: new Date().toISOString(),
    };

    setSports(prev => [...prev, newSport]);
    return { success: true, message: `Category "${cleanName}" created.` };
  };

  const editSport = (id: string, name: string, description: string) => {
    setSports(prev => prev.map(s => s.id === id ? { ...s, name: name.trim(), description: description.trim() } : s));
    return { success: true, message: 'Category updated.' };
  };

  const deleteSport = (id: string) => {
    // Check if any equipment references this sport
    if (equipment.some(e => e.sport_id === id)) {
      return { success: false, message: 'Cannot delete sport category with existing equipment. Move or delete equipment first.' };
    }
    setSports(prev => prev.filter(s => s.id !== id));
    return { success: true, message: 'Category removed.' };
  };

  const toggleSportActive = (id: string) => {
    setSports(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    return { success: true, message: 'Category status changed.' };
  };

  // ==========================================
  // LOGIN PAGE SETTINGS
  // ==========================================
  const updateLoginSettings = (newSettings: Partial<LoginSettings>) => {
    setLoginSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetLoginSettings = () => {
    setLoginSettings(DEFAULT_LOGIN_SETTINGS);
  };

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  const addNotification = (
    title: string, 
    message: string, 
    type: AppNotification['type'] = 'INFO', 
    targetRole: AppNotification['target_role'] = 'ALL',
    targetTab?: string,
    targetId?: string,
    targetType?: AppNotification['target_type']
  ) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      target_role: targetRole,
      created_at: new Date().toISOString(),
      read: false,
      target_tab: targetTab,
      target_id: targetId,
      target_type: targetType,
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      try {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    } catch (e) {}
  };

  /**
   * Safely resolves the target view, human-readable action label, and record metadata
   * with strict Role-Based Access Control so students can NEVER reach staff routes.
   */
  const resolveNotificationTarget = (
    item: AppNotification, 
    userRole?: 'STUDENT' | 'TEACHER' | 'ADMIN'
  ): { tab: string; label: string; recordId?: string; type?: string } => {
    const role = userRole || currentUser?.role;
    const isStudent = role === 'STUDENT';
    const title = (item.title || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();

    // 1. Explicit target_tab stored
    if (item.target_tab) {
      let tab = item.target_tab;

      // Strict role security mapping
      if (isStudent) {
        if (tab === 'requests') tab = 'my-requests';
        else if (tab === 'returns' || tab === 'issued') tab = 'my-equipment';
        else if (tab === 'equipment') tab = 'sports-catalog';
        else if (tab === 'videos') tab = 'learn';
        else if (tab === 'student-feedback') tab = 'feedback-box';
        else if (
          tab === 'students' || 
          tab === 'staff-management' || 
          tab === 'reports' || 
          tab === 'login-settings' || 
          tab === 'settings' || 
          tab === 'dashboard'
        ) {
          tab = 'student-dashboard';
        }
      } else {
        // Teacher / Admin
        if (tab === 'my-requests') tab = 'requests';
        else if (tab === 'my-equipment') tab = 'issued';
        else if (tab === 'sports-catalog') tab = 'equipment';
        else if (tab === 'learn') tab = 'videos';
        else if (tab === 'feedback-box') tab = 'student-feedback';
        else if (tab === 'student-dashboard') tab = 'dashboard';
      }

      let label = 'View Section';
      if (tab === 'my-requests') label = 'View My Requests';
      else if (tab === 'my-equipment') label = 'View My Equipment';
      else if (tab === 'sports-catalog') label = 'Explore Sports Catalog';
      else if (tab === 'learn') label = 'Watch Learning Videos';
      else if (tab === 'feedback-box') label = 'View My Feedback';
      else if (tab === 'student-feedback') label = 'Open Student Feedback';
      else if (tab === 'requests') label = 'Open Requests Desk';
      else if (tab === 'returns') label = 'Inspect Returns';
      else if (tab === 'issued') label = 'View Issued Records';
      else if (tab === 'students') label = 'Open Student Directory';
      else if (tab === 'staff-management') label = 'Open Staff Management';
      else if (tab === 'equipment') label = 'View Equipment Inventory';
      else if (tab === 'videos') label = 'Manage Videos';
      else if (tab === 'reports') label = 'Open Reports';
      else if (tab === 'profile') label = 'View Profile';

      return { tab, label, recordId: item.target_id, type: item.target_type };
    }

    // 2. Intelligent Heuristic Resolution (for older notifications or broadcasts)
    if (isStudent) {
      if (title.includes('approved') || title.includes('reject') || title.includes('requisition') || msg.includes('request')) {
        return { tab: 'my-requests', label: 'View My Requisitions', recordId: item.target_id, type: 'REQUEST' };
      }
      if (title.includes('ready') || title.includes('issued') || title.includes('gear') || msg.includes('issued')) {
        return { tab: 'my-equipment', label: 'View Issued Equipment', recordId: item.target_id, type: 'ISSUE' };
      }
      if (title.includes('return') || msg.includes('return')) {
        return { tab: 'my-equipment', label: 'View Equipment & Returns', recordId: item.target_id, type: 'RETURN' };
      }
      if (title.includes('video') || title.includes('tutorial') || msg.includes('learn')) {
        return { tab: 'learn', label: 'Watch Video Tutorial', recordId: item.target_id, type: 'VIDEO' };
      }
      if (title.includes('equipment') || title.includes('catalog') || title.includes('inventory') || msg.includes('equipment')) {
        return { tab: 'sports-catalog', label: 'Explore Equipment Catalog', recordId: item.target_id, type: 'EQUIPMENT' };
      }
      return { tab: 'student-dashboard', label: 'Go to Student Dashboard', recordId: item.target_id };
    } else {
      // Teacher or Administrator
      if (title.includes('return') || msg.includes('return') || title.includes('damaged') || title.includes('lost')) {
        return { tab: 'returns', label: 'Open Returns Desk', recordId: item.target_id, type: 'RETURN' };
      }
      if (title.includes('request') || msg.includes('request') || title.includes('requisition')) {
        return { tab: 'requests', label: 'Review Equipment Requests', recordId: item.target_id, type: 'REQUEST' };
      }
      if (title.includes('issued') || msg.includes('issued') || title.includes('borrow') || title.includes('overdue')) {
        return { tab: 'issued', label: 'Inspect Issued Records', recordId: item.target_id, type: 'ISSUE' };
      }
      if (title.includes('student') || msg.includes('student') || title.includes('enrolled')) {
        return { tab: 'students', label: 'Open Student Directory', recordId: item.target_id, type: 'STUDENT' };
      }
      if (title.includes('staff') || msg.includes('staff') || title.includes('administrator') || title.includes('teacher')) {
        return { tab: 'staff-management', label: 'Open Staff Management', recordId: item.target_id, type: 'STAFF' };
      }
      if (title.includes('video') || msg.includes('video')) {
        return { tab: 'videos', label: 'Manage Videos', recordId: item.target_id, type: 'VIDEO' };
      }
      if (title.includes('maintenance') || title.includes('equipment') || msg.includes('inventory')) {
        return { tab: 'equipment', label: 'View Equipment Inventory', recordId: item.target_id, type: 'EQUIPMENT' };
      }
      if (title.includes('report') || title.includes('audit')) {
        return { tab: 'reports', label: 'Open Reports & History', recordId: item.target_id, type: 'REPORT' };
      }
      return { tab: 'dashboard', label: 'Open Department Dashboard', recordId: item.target_id };
    }
  };

  /**
   * Universal notification click handler:
   * 1. Marks notification as read
   * 2. Resolves target route with RBAC
   * 3. Sets highlight record state
   * 4. Navigates using existing router / tab switcher
   */
  const navigateToNotification = (
    item: AppNotification,
    onNavigateTab?: (tab: string) => void
  ) => {
    // 1. Mark as read
    markNotificationAsRead(item.id);

    // 2. Resolve destination
    const target = resolveNotificationTarget(item, currentUser?.role);

    // 3. Set contextual highlight
    setHighlightRecord({
      tab: target.tab,
      recordId: target.recordId,
      type: target.type
    });

    // 4. Navigate using application navigation handler
    if (onNavigateTab) {
      onNavigateTab(target.tab);
    } else {
      const isStaff = currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN';
      if (isStaff) {
        window.location.hash = `#/teacher/${target.tab}`;
      } else {
        const hashSub = target.tab === 'student-dashboard' ? 'dashboard' : target.tab;
        window.location.hash = `#/student/${hashSub}`;
      }
    }
  };

  // ==========================================
  // PROFILE & SETTINGS
  // ==========================================
  const updateProfile = async (userId: string, updates: Partial<User>) => {
    // Prevent non-admin users from altering their role (anti-escalation)
    if (updates.role && currentUser?.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized. Role modification is strictly forbidden.' };
    }

    let finalUpdates = { ...updates };
    if (updates.password) {
      if (updates.password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
      }
      const salt = generateSalt();
      const hash = await hashPassword(updates.password, salt);
      finalUpdates = {
        ...finalUpdates,
        salt,
        password_hash: hash,
        password: undefined
      };
    }

    // Await Firestore write
    if (isFirebaseConfigured) {
      try {
        await updateFirestoreUser(userId, finalUpdates);
      } catch (err: any) {
        console.error('Failed to update user profile in Firestore:', err);
        return { success: false, message: err?.message || 'Failed to update profile in database.' };
      }
    }

    setUsers(prev => {
      const next = prev.map(u => u.id === userId ? { ...u, ...finalUpdates } : u);
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...finalUpdates } : null);
    }
    return { success: true, message: 'Profile updated successfully.' };
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN')) {
      return { success: false, message: 'Unauthorized. Teacher/Admin access required.' };
    }

    const normalizedUpdates: Partial<SystemSettings> = { ...newSettings };
    if ('logo_url' in normalizedUpdates) {
      const cleanLogo = (normalizedUpdates.logo_url || '').trim();
      normalizedUpdates.logo_url = cleanLogo || DEFAULT_COLLEGE_LOGO;
    }

    // Await Firestore write to settings/app with synchronized cloud channel
    if (isFirebaseConfigured) {
      try {
        await setFirestoreSettings(normalizedUpdates);
      } catch (err: any) {
        console.error('Firestore setFirestoreSettings cloud write error:', err);
        return {
          success: false,
          message: err?.message || 'Failed to save settings to Cloud Firestore.'
        };
      }
    }

    const updatedSettings = { ...settings, ...normalizedUpdates };
    setSettings(prev => ({ ...prev, ...normalizedUpdates }));
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    } catch (e) {}

    if ('logo_url' in normalizedUpdates) {
      if (normalizedUpdates.logo_url && normalizedUpdates.logo_url !== DEFAULT_COLLEGE_LOGO) {
        setCachedCollegeLogo(normalizedUpdates.logo_url);
      } else {
        clearCachedCollegeLogo();
      }
    }

    return { success: true, message: 'Settings saved successfully.' };
  };

  const resetAllData = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setSports(INITIAL_SPORTS);
    setEquipment([]);
    setRequests(INITIAL_REQUESTS);
    setIssueRecords(INITIAL_ISSUES);
    setReturnRecords(INITIAL_RETURNS);
    setVideos(INITIAL_VIDEOS);
    setLoginSettings(DEFAULT_LOGIN_SETTINGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSettings(INITIAL_SETTINGS);
    setCurrentUser(null);
  };

  // ==========================================
  // HELPERS
  // ==========================================
  const isOverdue = (expectedReturnStr: string, issueStatus: 'ISSUED' | 'RETURNED') => {
    if (issueStatus !== 'ISSUED') return { overdue: false, days: 0 };
    const expected = new Date(expectedReturnStr);
    expected.setHours(23, 59, 59, 999);
    const today = new Date();
    if (today > expected) {
      const diffTime = Math.abs(today.getTime() - expected.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { overdue: true, days: diffDays };
    }
    return { overdue: false, days: 0 };
  };

  const getSportName = (sportId: string) => {
    return resolveEquipmentSportName(sportId, sports);
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown User';
  };

  const getEquipmentById = (id: string) => {
    return dedupedEquipment.find(e => e.id === id);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      sports,
      equipment: dedupedEquipment,
      requests,
      issueRecords,
      returnRecords,
      videos,
      loginSettings,
      notifications,
      settings,
      login,
      loginWithGoogle,
      logout,
      registerUser,
      registerStudent,
      requestPasswordReset,
      resetPasswordWithToken,
      requestEquipment,
      createRequestForStudent,
      requestReturn,
      approveRequest,
      rejectRequest,
      cancelRequest,
      issueEquipment,
      acceptReturn,
      editRequest,
      deleteRequest,
      addEquipment,
      editEquipment,
      deleteEquipment,
      bulkCreateEquipment,
      updateEquipmentStatus,
      replaceEquipmentCatalogState,
      refreshEquipmentFromFirestore,
      addStudent,
      editStudent,
      deleteStudent,
      deleteMyAccount,
      toggleUserActive,
      resetStudentPassword,
      addVideo,
      editVideo,
      deleteVideo,
      togglePublishVideo,
      addSport,
      editSport,
      deleteSport,
      toggleSportActive,
      updateLoginSettings,
      resetLoginSettings,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearAllNotifications,
      resolveNotificationTarget,
      navigateToNotification,
      addNotification,
      highlightRecord,
      setHighlightRecord,
      updateProfile,
      updateSettings,
      resetAllData,
      createStaffUser,
      toggleStaffActiveStatus,
      isOverdue,
      getSportName,
      getUserName,
      getEquipmentById,
      feedback,
      submitFeedback,
      replyFeedback,
      isFirebaseAuthConfigured: isFirebaseAuthReady(),
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
