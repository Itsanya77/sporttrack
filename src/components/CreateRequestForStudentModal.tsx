import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getCatalogSports, matchesSportFilter } from '../utils/sportsHelper';
import { User, Equipment } from '../types';
import { 
  X, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  Layers, 
  Calendar, 
  Minus, 
  Plus, 
  WifiOff, 
  RotateCcw,
  Sparkles,
  UserCheck
} from 'lucide-react';

interface CreateRequestForStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (requestId: string) => void;
  preselectedStudentId?: string;
}

export const CreateRequestForStudentModal: React.FC<CreateRequestForStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedStudentId,
}) => {
  const { currentUser, users, sports, equipment, createRequestForStudent } = useApp();

  // Student selection state
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // Initialize or preselect student when opened
  useEffect(() => {
    if (isOpen) {
      if (preselectedStudentId) {
        const found = users.find(u => u.id === preselectedStudentId && u.role === 'STUDENT');
        if (found) {
          setSelectedStudent(found);
        }
      }
    } else {
      setSelectedStudent(null);
      setStudentSearch('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, preselectedStudentId, users]);

  // Equipment & Requisition state
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [requestedQuantity, setRequestedQuantity] = useState<number>(1);
  const [requiredDate, setRequiredDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expectedReturn, setExpectedReturn] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [purpose, setPurpose] = useState<string>('');
  const [notes, setNotes] = useState<string>('Requested in-person at Sports Desk (Campus network connectivity issue)');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Purpose shortcuts
  const purposeShortcuts = [
    'Gymkhana Match Practice',
    'Inter-College Tournament Practice',
    'Physical Education Practical',
    'Department Sports Session',
    'Intra-College League Match'
  ];

  // Selected equipment object
  const selectedItem: Equipment | undefined = equipment.find(e => e.id === selectedEquipmentId);

  // Reset or adjust quantity when selected equipment changes
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

  // Strict role check: Only TEACHER or ADMIN can see or operate this feature
  if (!currentUser || (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN')) {
    return null;
  }

  // Filter ONLY registered student accounts (never staff or admin)
  const studentAccounts = users.filter(u => u.role === 'STUDENT' && u.active);

  const filteredStudents = studentAccounts.filter(s => {
    if (!studentSearch.trim()) return true;
    const term = studentSearch.toLowerCase().trim();
    const idMatch = (s.student_id || '').toLowerCase().includes(term);
    const nameMatch = (s.name || '').toLowerCase().includes(term);
    const emailMatch = (s.email || '').toLowerCase().includes(term);
    return idMatch || nameMatch || emailMatch;
  });

  const catalogSports = getCatalogSports(equipment, sports);

  // Filter equipment by selected sport
  const filteredEquipment = equipment.filter(e => {
    if (!e.active) return false;
    if (selectedSportId && !matchesSportFilter(e.sport_id, selectedSportId, sports)) return false;
    return true;
  });

  const maxAvailable = selectedItem ? selectedItem.available_quantity : 0;
  const isOutOfStock = selectedItem ? selectedItem.available_quantity <= 0 : false;
  const isQuantityExceeded = selectedItem ? requestedQuantity > maxAvailable : false;

  const handleClose = () => {
    setStudentSearch('');
    setSelectedStudent(null);
    setSelectedSportId('');
    setSelectedEquipmentId('');
    setRequestedQuantity(1);
    setPurpose('');
    setNotes('Requested in-person at Sports Desk (Campus network connectivity issue)');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedStudent) {
      setErrorMsg('Please search and select a student account first.');
      return;
    }

    if (!selectedEquipmentId || !selectedItem) {
      setErrorMsg('Please select an equipment item to request.');
      return;
    }

    if (selectedItem.available_quantity <= 0) {
      setErrorMsg('Selected equipment is currently out of stock.');
      return;
    }

    if (requestedQuantity < 1) {
      setErrorMsg('Requested quantity must be at least 1 unit.');
      return;
    }

    if (requestedQuantity > selectedItem.available_quantity) {
      setErrorMsg(`Only ${selectedItem.available_quantity} available.`);
      return;
    }

    if (!expectedReturn) {
      setErrorMsg('Please specify an expected return date.');
      return;
    }

    if (!purpose.trim()) {
      setErrorMsg('Please specify the borrowing purpose.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createRequestForStudent(
        selectedStudent.id,
        selectedEquipmentId,
        requestedQuantity,
        expectedReturn,
        purpose.trim(),
        requiredDate || new Date().toISOString().split('T')[0],
        notes?.trim() || ''
      );

      if (!res.success) {
        setErrorMsg(res.message);
        setIsSubmitting(false);
      } else {
        setSuccessMsg(res.message);
        if (onSuccess) {
          onSuccess(selectedEquipmentId);
        }
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create student request. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-request-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <UserPlus className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 id="create-request-modal-title" className="text-lg font-bold tracking-tight">
                Create Request for Student
              </h2>
              <p className="text-xs text-blue-200 flex items-center space-x-1.5 mt-0.5">
                <WifiOff className="w-3 h-3 text-amber-300" />
                <span>Assisted Requisition • For poor/no network connectivity at campus</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Institutional Audit Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
            <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Ownership Rule:</span> This request belongs to the selected student and will automatically appear in their personal requisition log and borrow history. Your staff ID (<span className="font-mono font-semibold">{currentUser.name}</span>) will be logged as the assisting creator.
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 1: SEARCH & SELECT STUDENT                      */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center justify-center text-xs font-extrabold">1</span>
                <span>Select Registered Student</span>
              </label>
              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Change Student</span>
                </button>
              )}
            </div>

            {!selectedStudent ? (
              <div className="space-y-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search by Student ID / Roll Number, Name, or Email..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium placeholder:text-slate-400"
                  />
                  {studentSearch && (
                    <button
                      type="button"
                      onClick={() => setStudentSearch('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown List */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto bg-slate-50/50">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No active student found matching <span className="font-semibold text-slate-700">"{studentSearch}"</span>.
                    </div>
                  ) : (
                    filteredStudents.slice(0, 8).map(student => (
                      <div
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student);
                          setErrorMsg(null);
                        }}
                        className="p-3 hover:bg-blue-50/80 transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                              {student.name}
                            </span>
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              {student.student_id || 'ID Pending'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {student.course} {student.year ? `• Year ${student.year}` : ''} {student.division ? `(Div ${student.division})` : ''} • {student.email}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          Select
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  Showing existing student accounts only. Staff or admin accounts cannot borrow gear.
                </p>
              </div>
            ) : (
              /* Verified Student Confirmation Banner */
              <div className="p-4 rounded-xl bg-emerald-50/90 border-2 border-emerald-400 text-slate-900 animate-in fade-in duration-150">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-800">
                        Confirmed Student Requisition Target:
                      </div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {selectedStudent.name} <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 ml-1 text-xs">ID: {selectedStudent.student_id || 'N/A'}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Course: <span className="font-semibold">{selectedStudent.course || 'General'}</span> {selectedStudent.year ? `• Year: ${selectedStudent.year}` : ''} {selectedStudent.division ? `(Div: ${selectedStudent.division})` : ''} • Email: <span className="font-mono text-slate-700">{selectedStudent.email}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900 shrink-0">
                    Verified
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: EQUIPMENT & INVENTORY SELECTION               */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center justify-center text-xs font-extrabold">2</span>
              <span>Select Equipment & Borrow Quantity</span>
            </label>

            {/* Sport & Equipment Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sport / Discipline
                </label>
                <select
                  value={selectedSportId}
                  onChange={e => {
                    setSelectedSportId(e.target.value);
                    setSelectedEquipmentId('');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white font-medium"
                >
                  <option value="">All Sports Categories</option>
                  {catalogSports.map(sport => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Equipment Item <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedEquipmentId}
                  onChange={e => setSelectedEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white font-medium"
                >
                  <option value="">-- Choose Equipment --</option>
                  {filteredEquipment.map(item => (
                    <option 
                      key={item.id} 
                      value={item.id}
                      disabled={item.available_quantity <= 0}
                    >
                      {item.name} ({item.equipment_code}) — {item.available_quantity > 0 ? `${item.available_quantity} Avail` : 'OUT OF STOCK'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Inventory Counter Card */}
            {selectedItem && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>{selectedItem.name}</span>
                    <span className="font-mono text-slate-500">({selectedItem.equipment_code})</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Location: {selectedItem.location || 'Main Sports Store'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Total Stock</div>
                    <div className="text-base font-black text-slate-800">{selectedItem.quantity}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-blue-200">
                    <div className="text-[10px] uppercase font-bold text-blue-600">Currently Issued</div>
                    <div className="text-base font-black text-blue-700">{selectedItem.issued_quantity}</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${
                    selectedItem.available_quantity > 0 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-rose-50 border-rose-300'
                  }`}>
                    <div className={`text-[10px] uppercase font-bold ${
                      selectedItem.available_quantity > 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      Currently Available
                    </div>
                    <div className={`text-base font-black ${
                      selectedItem.available_quantity > 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {selectedItem.available_quantity}
                    </div>
                  </div>
                </div>

                {isOutOfStock && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>This item is out of stock. You cannot create a requisition until units are returned.</span>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Stepper */}
            {selectedItem && !isOutOfStock && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Units Requested for Student <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Max available for this batch: <span className="font-bold text-emerald-700">{maxAvailable} units</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setRequestedQuantity(prev => Math.max(1, prev - 1))}
                    disabled={requestedQuantity <= 1}
                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={maxAvailable}
                    value={requestedQuantity}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setRequestedQuantity(val);
                      setErrorMsg(null);
                    }}
                    className={`w-16 py-1.5 text-center font-bold text-sm rounded-lg border ${
                      isQuantityExceeded 
                        ? 'border-rose-500 text-rose-600 bg-rose-50' 
                        : 'border-slate-300 text-slate-800'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setRequestedQuantity(prev => Math.min(maxAvailable, prev + 1))}
                    disabled={requestedQuantity >= maxAvailable}
                    className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {isQuantityExceeded && selectedItem && (
              <p className="text-xs font-bold text-rose-600">
                Only {selectedItem.available_quantity} available.
              </p>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: SCHEDULE & PURPOSE                           */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center justify-center text-xs font-extrabold">3</span>
              <span>Requisition Dates & Purpose</span>
            </label>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Required / Issue Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    value={requiredDate}
                    onChange={e => setRequiredDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expected Return Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    min={requiredDate}
                    value={expectedReturn}
                    onChange={e => setExpectedReturn(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Purpose Input & Suggestions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Purpose of Borrowing <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Inter-college football practice match on main ground"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
              />

              {/* Quick Purpose Suggestion Pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {purposeShortcuts.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPurpose(p)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 transition-colors border border-slate-200 cursor-pointer"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Audit Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Staff Audit Remarks / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes regarding student connectivity issue, ground timing, or special authorization..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-normal"
              />
            </div>
          </div>

          {/* Error & Success Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting || 
                !selectedStudent || 
                !selectedItem || 
                isOutOfStock || 
                isQuantityExceeded || 
                requestedQuantity < 1
              }
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Requisition...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {selectedStudent ? `Create Request for ${selectedStudent.name}` : 'Create Request for Student'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
