import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getCatalogSports, matchesSportFilter, resolveEquipmentSportName } from '../utils/sportsHelper';
import { User, Equipment } from '../types';
import { 
  X, 
  Search, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Package, 
  FileText, 
  Plus, 
  Minus, 
  AlertTriangle, 
  Layers,
  ArrowRight,
  ShieldCheck,
  UserX,
  Clock
} from 'lucide-react';

interface TeacherCreateStudentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudentId?: string;
  preselectedEquipmentId?: string;
}

export const TeacherCreateStudentRequestModal: React.FC<TeacherCreateStudentRequestModalProps> = ({
  isOpen,
  onClose,
  preselectedStudentId,
  preselectedEquipmentId,
}) => {
  const { 
    users, 
    sports, 
    equipment, 
    currentUser, 
    createRequestForStudent, 
    getSportName 
  } = useApp();

  // Search & Student Selection State
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // Equipment & Form State
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(preselectedEquipmentId || '');
  const [requestedQuantity, setRequestedQuantity] = useState<number>(1);
  const [requiredDate, setRequiredDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expectedReturn, setExpectedReturn] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [purpose, setPurpose] = useState<string>('');
  const [notes, setNotes] = useState<string>('Offline / emergency request created due to student network unavailability.');

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-selection on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsSubmitting(false);

      if (preselectedStudentId) {
        const student = users.find(u => u.id === preselectedStudentId && u.role === 'STUDENT');
        if (student) {
          setSelectedStudent(student);
          setSearchTerm(student.student_id || student.name);
          setHasSearched(true);
        }
      } else {
        setSelectedStudent(null);
        setSearchTerm('');
        setHasSearched(false);
      }

      if (preselectedEquipmentId) {
        setSelectedEquipmentId(preselectedEquipmentId);
        const item = equipment.find(e => e.id === preselectedEquipmentId);
        if (item) {
          setSelectedSportId(resolveEquipmentSportName(item.sport_id, sports));
          setRequestedQuantity(item.available_quantity > 0 ? 1 : 0);
        }
      }
    }
  }, [isOpen, preselectedStudentId, preselectedEquipmentId, users, equipment, sports]);

  // Only consider registered users whose role is strictly STUDENT
  const studentUsers = users.filter(u => u.role === 'STUDENT');

  // Search logic: strictly query Student ID, Roll No, or Name
  const searchResults = studentUsers.filter(s => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.trim().toLowerCase();
    const sid = (s.student_id || '').toLowerCase();
    const username = (s.username || '').toLowerCase();
    const name = s.name.toLowerCase();
    const email = s.email.toLowerCase();

    return sid === term || 
      sid.includes(term) || 
      username === term || 
      name.includes(term) || 
      email === term;
  });

  // Selected Equipment metadata
  const selectedItem: Equipment | undefined = equipment.find(e => e.id === selectedEquipmentId);

  // Automatically reset quantity when equipment changes
  useEffect(() => {
    if (selectedItem) {
      if (selectedItem.available_quantity > 0) {
        setRequestedQuantity(1);
      } else {
        setRequestedQuantity(0);
      }
      setErrorMsg(null);
    }
  }, [selectedEquipmentId]);

  if (!isOpen) return null;

  const catalogSports = getCatalogSports(equipment, sports);

  // Filter equipment by sport
  const filteredEquipment = equipment.filter(e => {
    if (!e.active) return false;
    if (selectedSportId && !matchesSportFilter(e.sport_id, selectedSportId, sports)) return false;
    return true;
  });

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    setErrorMsg(null);
  };

  const handleSelectStudent = (student: User) => {
    setSelectedStudent(student);
    setErrorMsg(null);
  };

  const handleClearSelectedStudent = () => {
    setSelectedStudent(null);
    setErrorMsg(null);
  };

  const handleQuantityChange = (val: number) => {
    setErrorMsg(null);
    setRequestedQuantity(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Validation: Selected Student
    if (!selectedStudent) {
      setErrorMsg('Please search and select a registered student first.');
      return;
    }

    if (selectedStudent.role !== 'STUDENT') {
      setErrorMsg('Selected user is not an enrolled student.');
      return;
    }

    // 2. Validation: Selected Equipment
    if (!selectedEquipmentId || !selectedItem) {
      setErrorMsg('Please select an equipment item to request.');
      return;
    }

    if (selectedItem.available_quantity <= 0) {
      setErrorMsg('Selected equipment is currently out of stock. Cannot create requisition.');
      return;
    }

    if (requestedQuantity < 1) {
      setErrorMsg('Requested quantity must be at least 1 unit.');
      return;
    }

    if (requestedQuantity > selectedItem.available_quantity) {
      setErrorMsg(`Only ${selectedItem.available_quantity} units available. Cannot request ${requestedQuantity} units.`);
      return;
    }

    // 3. Dates & Purpose
    if (!expectedReturn) {
      setErrorMsg('Please provide an expected return date.');
      return;
    }

    if (!purpose.trim()) {
      setErrorMsg('Please provide the purpose for borrowing this equipment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createRequestForStudent(
        selectedStudent.id,
        selectedEquipmentId,
        requestedQuantity,
        expectedReturn,
        purpose.trim(),
        requiredDate,
        notes.trim()
      );

      if (result.success) {
        setSuccessMsg(result.message);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred while creating the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxAvailable = selectedItem ? selectedItem.available_quantity : 0;
  const isOutOfStock = selectedItem ? selectedItem.available_quantity <= 0 : false;
  const isQuantityExceeded = selectedItem ? requestedQuantity > maxAvailable : false;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">Create Request for Student</h3>
              <p className="text-xs text-slate-300">
                Emergency & offline requisition created on behalf of a registered student
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Status / Alert Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-semibold">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center space-x-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold">{successMsg}</div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  The requisition belongs to the student and has been placed in the Pending approval queue.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 1: SEARCH & SELECT REGISTERED STUDENT */}
          {/* ========================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center justify-center text-[11px] font-bold">1</span>
                <span>Student Identification (Roll No / Student ID)</span>
                <span className="text-rose-500">*</span>
              </label>
              {selectedStudent && (
                <button
                  type="button"
                  onClick={handleClearSelectedStudent}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Change Student
                </button>
              )}
            </div>

            {/* If NO student selected yet: Search Box */}
            {!selectedStudent ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Enter Student ID, Roll No, or Name..."
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setHasSearched(false);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchSubmit();
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit()}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Search
                  </button>
                </div>

                {/* Case 1: Unregistered Student ID / No Match */}
                {hasSearched && searchTerm.trim() && searchResults.length === 0 && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start space-x-3">
                    <UserX className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Student is not registered. Request cannot be created.</div>
                      <p className="text-xs text-amber-700 mt-1">
                        No registered student account was found matching "<span className="font-mono font-bold">{searchTerm}</span>". 
                        The student must be officially enrolled in SportTrack before equipment requests can be processed.
                      </p>
                    </div>
                  </div>
                )}

                {/* Case 2: Matching Registered Students Found */}
                {searchTerm.trim() && searchResults.length > 0 && (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto bg-slate-50/50">
                    <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 flex items-center justify-between">
                      <span>Matching Registered Students ({searchResults.length})</span>
                      <span className="text-[10px] text-slate-400">Click Select Student to confirm</span>
                    </div>
                    {searchResults.map(student => (
                      <div
                        key={student.id}
                        className="p-3 bg-white hover:bg-blue-50/60 transition-colors flex items-center justify-between gap-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                            <span className="truncate">{student.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Registered Student
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            <span>Student ID / Roll No: <strong className="font-mono text-slate-800">{student.student_id || '-'}</strong></span>
                            <span>Course: <strong className="text-slate-800">{student.course || 'N/A'}</strong> ({student.division || 'A'})</span>
                            <span>Email: <span className="text-slate-500">{student.email}</span></span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectStudent(student)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Select Student</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Confirmed Selected Student Box */
              <div className="p-4 rounded-xl bg-emerald-50/80 border-2 border-emerald-500/80 shadow-xs text-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Selected Student (Requester & Owner)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                    Confirmed
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 bg-white/80 p-3 rounded-lg border border-emerald-200 text-xs">
                  <div>
                    <span className="text-slate-500">Student Name:</span>
                    <div className="font-bold text-slate-900 text-sm">{selectedStudent.name}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Student ID / Roll No:</span>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      {selectedStudent.student_id || '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Course & Year:</span>
                    <div className="font-medium text-slate-800">
                      {selectedStudent.course || '-'} • Year {selectedStudent.year || '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Division & Email:</span>
                    <div className="font-medium text-slate-800 truncate">
                      Div {selectedStudent.division || '-'} • {selectedStudent.email}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-700 mt-2 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>The equipment request will belong directly to {selectedStudent.name} (UID: {selectedStudent.id}).</span>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* STEP 2: EQUIPMENT SELECTION & INVENTORY DETAILS */}
          {/* ========================================================= */}
          <div className={`space-y-4 pt-4 border-t border-slate-200 transition-opacity ${!selectedStudent ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center justify-center text-[11px] font-bold">2</span>
              <span>Equipment & Quantity Selection</span>
              <span className="text-rose-500">*</span>
            </label>

            {/* Sport Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Filter by Sport / Category
              </label>
              <select
                value={selectedSportId}
                onChange={e => {
                  setSelectedSportId(e.target.value);
                  setSelectedEquipmentId('');
                }}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All Sports Categories</option>
                {catalogSports.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Equipment Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Select Equipment Item <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedEquipmentId}
                onChange={e => setSelectedEquipmentId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option value="">-- Choose Equipment Item --</option>
                {filteredEquipment.map(item => (
                  <option 
                    key={item.id} 
                    value={item.id}
                    disabled={item.available_quantity <= 0}
                  >
                    {item.name} ({item.equipment_code}) — {item.available_quantity} available {item.available_quantity <= 0 ? '(OUT OF STOCK)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Equipment Inventory Display */}
            {selectedItem && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-slate-800 flex items-center space-x-2">
                    <span>{selectedItem.name}</span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                      {selectedItem.equipment_code}
                    </span>
                  </div>
                  <span className="text-slate-500">
                    Category: <strong>{getSportName(selectedItem.sport_id)}</strong>
                  </span>
                </div>

                {/* Inventory Breakdown Cards */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Stock</span>
                    <span className="text-base font-bold text-slate-800">{selectedItem.quantity}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-200">
                    <span className="text-blue-600 text-[10px] uppercase font-bold block">Issued</span>
                    <span className="text-base font-bold text-blue-700">{selectedItem.issued_quantity}</span>
                  </div>
                  <div className={`bg-white p-2 rounded-lg border ${selectedItem.available_quantity > 0 ? 'border-emerald-200' : 'border-rose-200'}`}>
                    <span className={`text-[10px] uppercase font-bold block ${selectedItem.available_quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Available
                    </span>
                    <span className={`text-base font-bold ${selectedItem.available_quantity > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {selectedItem.available_quantity}
                    </span>
                  </div>
                </div>

                {isOutOfStock && (
                  <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Out of Stock: All units are currently issued or undergoing inspection. Cannot request.</span>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            {selectedItem && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Quantity <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(Math.max(1, requestedQuantity - 1))}
                      disabled={requestedQuantity <= 1 || isOutOfStock}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={maxAvailable}
                      value={requestedQuantity}
                      onChange={e => handleQuantityChange(parseInt(e.target.value, 10) || 0)}
                      disabled={isOutOfStock}
                      className="w-16 py-2 text-center text-sm font-bold text-slate-900 border-x border-slate-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(Math.min(maxAvailable, requestedQuantity + 1))}
                      disabled={requestedQuantity >= maxAvailable || isOutOfStock}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-500">
                    Max allowable: <strong>{maxAvailable} unit{maxAvailable === 1 ? '' : 's'}</strong>
                  </span>
                </div>

                {isQuantityExceeded && (
                  <p className="text-xs font-bold text-rose-600 mt-1">
                    Requested quantity ({requestedQuantity}) exceeds available inventory ({maxAvailable}).
                  </p>
                )}
              </div>
            )}

            {/* Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Date
                </label>
                <input
                  type="date"
                  value={requiredDate}
                  onChange={e => setRequiredDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Return Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={expectedReturn}
                  min={requiredDate || new Date().toISOString().split('T')[0]}
                  onChange={e => setExpectedReturn(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purpose of Borrowing <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Inter-college cricket tournament practice, Physical training session"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Faculty Offline Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Faculty Notes / Offline Reason (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Notes for sports desk records (e.g. Student campus network unavailable)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Audit Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Operational Note:</strong> The created request starts in <strong>PENDING</strong> status. 
              Inventory is <em>not</em> deducted until the equipment is officially issued through the sports desk issue workflow when the student collects it.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !selectedStudent || 
                !selectedEquipmentId || 
                isOutOfStock || 
                isQuantityExceeded || 
                requestedQuantity < 1 || 
                !purpose.trim() || 
                isSubmitting
              }
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <span>Creating Requisition...</span>
              ) : (
                <>
                  <span>Create Request for Student</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
