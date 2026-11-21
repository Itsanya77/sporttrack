import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { TeacherCreateStudentRequestModal } from './TeacherCreateStudentRequestModal';
import { 
  Users, 
  Search, 
  Filter, 
  History, 
  X,
  UserPlus,
  KeyRound,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const { 
    users, 
    issueRecords, 
    getEquipmentById, 
    toggleUserActive,
    addStudent,
    editStudent,
    deleteStudent,
    resetStudentPassword,
    highlightRecord,
    setHighlightRecord
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Auto-focus and scroll to student from notification
  React.useEffect(() => {
    if (highlightRecord?.recordId) {
      const match = users.find(u => u.id === highlightRecord.recordId);
      if (match) {
        setCourseFilter('ALL');
        setStatusFilter('ALL');
        setSearchTerm('');
        setTimeout(() => {
          const el = document.getElementById(`student-row-${highlightRecord.recordId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, [highlightRecord?.recordId, users]);
  
  // Modals state
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [selectedStudentForRequest, setSelectedStudentForRequest] = useState<string | undefined>(undefined);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [resettingStudent, setResettingStudent] = useState<User | null>(null);
  const [newPassVal, setNewPassVal] = useState('');
  const [deletingStudent, setDeletingStudent] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Feedback
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [addModalError, setAddModalError] = useState<string | null>(null);
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    student_id: '',
    email: '',
    phone: '',
    course: 'MCA',
    year: '1st Year',
    division: 'A',
    password: '',
  });

  const students = users.filter(u => u.role === 'STUDENT');

  const filteredStudents = students.filter(student => {
    if (courseFilter !== 'ALL' && student.course !== courseFilter) return false;
    if (statusFilter === 'ACTIVE' && !student.active) return false;
    if (statusFilter === 'SUSPENDED' && student.active) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const name = student.name.toLowerCase();
      const sid = (student.student_id || '').toLowerCase();
      const email = student.email.toLowerCase();
      if (!name.includes(term) && !sid.includes(term) && !email.includes(term)) {
        return false;
      }
    }
    return true;
  });

  const courses = Array.from(new Set(students.map(s => s.course).filter(Boolean)));

  const studentIssues = selectedStudentForHistory
    ? issueRecords.filter(i => i.student_id === selectedStudentForHistory.id)
    : [];

  const deletingStudentActiveLoans = deletingStudent
    ? issueRecords.filter(i => i.student_id === deletingStudent.id && i.status === 'ISSUED')
    : [];

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    setAddModalError(null);

    const res = await addStudent({
      name: addForm.name.trim(),
      student_id: addForm.student_id.trim().toUpperCase(),
      email: addForm.email.trim(),
      phone: addForm.phone.trim(),
      course: addForm.course,
      year: addForm.year,
      division: addForm.division,
      password: addForm.password || 'Student@123',
    });

    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      setIsAddModalOpen(false);
      setAddModalError(null);
      setAddForm({
        name: '',
        student_id: '',
        email: '',
        phone: '',
        course: 'MCA',
        year: '1st Year',
        division: 'A',
        password: '',
      });
    } else {
      setAddModalError(res.message);
      setActionMessage({ type: 'error', text: res.message });
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setActionMessage(null);

    const res = await editStudent(editingStudent.id, {
      name: editingStudent.name,
      student_id: editingStudent.student_id,
      email: editingStudent.email,
      phone: editingStudent.phone,
      course: editingStudent.course,
      year: editingStudent.year,
      division: editingStudent.division,
    });

    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      setEditingStudent(null);
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
  };

  const handleDelete = (student: User) => {
    setDeletingStudent(student);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteStudent(deletingStudent.id);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setDeletingStudent(null);
      } else {
        setDeleteError(res.message);
        setActionMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to delete student account.';
      setDeleteError(msg);
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingStudent || !newPassVal.trim()) return;
    const res = await resetStudentPassword(resettingStudent.id, newPassVal.trim());
    if (res.success) {
      setActionMessage({ type: 'success', text: `Password for ${resettingStudent.name} updated.` });
      setResettingStudent(null);
      setNewPassVal('');
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Student Directory & Borrow Profiles</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student registrations, inspect gear borrowing records, activate/suspend accounts, and reset credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setSelectedStudentForRequest(undefined);
              setIsCreateRequestOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Create Request for Student</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by student name, ID, or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">All Courses</option>
            {courses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Email & Phone</th>
                  <th className="px-4 py-3">Course / Year</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(student => {
                  const isHighlighted = highlightRecord?.recordId === student.id;

                  return (
                    <tr 
                      key={student.id} 
                      id={`student-row-${student.id}`}
                      className={`transition-all ${
                        isHighlighted 
                          ? 'bg-blue-50/90 ring-2 ring-blue-500 shadow-sm' 
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900">{student.name}</span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                              Linked
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Enrolled {new Date(student.created_at).toLocaleDateString()}
                        </div>
                      </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold">
                        {student.student_id}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      <div>{student.email}</div>
                      {student.phone && <div className="text-slate-400 mt-0.5">{student.phone}</div>}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {student.course} • {student.year} (Div {student.division})
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          student.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {student.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedStudentForRequest(student.id);
                            setIsCreateRequestOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Create Offline Equipment Request for this student"
                        >
                          <Clock className="w-4 h-4 text-blue-600" />
                        </button>

                        <button
                          onClick={() => setSelectedStudentForHistory(student)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Borrowing History"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditingStudent(student)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setResettingStudent(student);
                            setNewPassVal('');
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => toggleUserActive(student.id)}
                          className={`px-2 py-1 text-xs font-bold rounded-md border transition-colors ${
                            student.active
                              ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {student.active ? 'Suspend' : 'Activate'}
                        </button>

                        <button
                          onClick={() => handleDelete(student)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Student Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enroll Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Enroll New Student</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addModalError && (
              <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="flex-1">{addModalError}</span>
                <button 
                  type="button" 
                  onClick={() => setAddModalError(null)}
                  className="text-rose-400 hover:text-rose-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Student ID / Roll</label>
                  <input
                    type="text"
                    required
                    placeholder="2024-MCA-099"
                    value={addForm.student_id}
                    onChange={e => setAddForm({ ...addForm, student_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Course</label>
                  <select
                    value={addForm.course}
                    onChange={e => setAddForm({ ...addForm, course: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                    <option value="BCA">BCA</option>
                    <option value="BBA">BBA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Year</label>
                  <select
                    value={addForm.year}
                    onChange={e => setAddForm({ ...addForm, year: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    required
                    placeholder="A or B"
                    value={addForm.division}
                    onChange={e => setAddForm({ ...addForm, division: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="student@dmims.edu"
                    value={addForm.email}
                    onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={addForm.phone}
                    onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Initial Password</label>
                <div className="relative">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    placeholder="Defaults to Student@123"
                    value={addForm.password}
                    onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>Edit Student Record</span>
              </h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Student ID</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.student_id || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, student_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Course</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.course || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, course: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Year</label>
                  <input
                    type="text"
                    value={editingStudent.year || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, year: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    value={editingStudent.division || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, division: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingStudent.email}
                    onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingStudent.phone || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Reset Student Password</span>
              </h3>
              <button onClick={() => setResettingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Set a new temporary password for <strong>{resettingStudent.name}</strong> ({resettingStudent.student_id}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassVal}
                  onChange={e => setNewPassVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setResettingStudent(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Equipment History Modal */}
      {selectedStudentForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Borrow History: {selectedStudentForHistory.name}
                </h3>
                <p className="text-xs text-slate-500">
                  ID: {selectedStudentForHistory.student_id} • Course: {selectedStudentForHistory.course}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentForHistory(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {studentIssues.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  This student has no past or active sports equipment transactions.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {studentIssues.map(issue => {
                    const eq = getEquipmentById(issue.equipment_id);
                    return (
                      <div key={issue.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center space-x-2">
                            <span>{eq?.name || (issue as any).equipment_name || 'Removed item'}</span>
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                              {eq?.equipment_code || 'Removed'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Issued: {issue.issued_at ? new Date(issue.issued_at).toLocaleDateString() : 'N/A'} • Expected Return: {issue.expected_return ? new Date(issue.expected_return).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>

                        <div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                            issue.status === 'ISSUED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {issue.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Permanent Student Deletion Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-rose-600 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Permanently Delete Student</span>
              </h3>
              <button
                onClick={() => {
                  if (!isDeleting) {
                    setDeletingStudent(null);
                    setDeleteError(null);
                  }
                }}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
                <div className="font-semibold text-slate-900 text-sm">{deletingStudent.name}</div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-slate-500">Roll / Student ID:</span>
                  <span className="font-mono font-bold text-slate-800">{deletingStudent.student_id || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-slate-500">Email:</span>
                  <span className="text-slate-800">{deletingStudent.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-slate-500">Class:</span>
                  <span className="text-slate-800">{deletingStudent.course} • {deletingStudent.year} (Div {deletingStudent.division})</span>
                </div>
              </div>

              {deletingStudentActiveLoans.length > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-amber-800 text-xs leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <div className="font-bold">Active Equipment Loan Detected</div>
                    <div>This student currently has {deletingStudentActiveLoans.length} unreturned equipment item(s) in their possession. Student accounts cannot be deleted until all equipment is returned to inventory.</div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs leading-relaxed">
                  <div className="font-bold mb-1">
                    Warning: This action is permanent and irreversible.
                  </div>
                  <div>
                    Permanently deletes this student's profile from Firestore and removes their Firebase Authentication account. If deleted, the student will no longer be able to log in with these credentials, but may re-register with this email in the future.
                  </div>
                </div>
              )}

              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="flex-1">{deleteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingStudent(null);
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting || deletingStudentActiveLoans.length > 0}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/25 flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Permanently Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Permanently Delete Student</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency / Offline Requisition Modal */}
      <TeacherCreateStudentRequestModal
        isOpen={isCreateRequestOpen}
        preselectedStudentId={selectedStudentForRequest}
        onClose={() => {
          setIsCreateRequestOpen(false);
          setSelectedStudentForRequest(undefined);
        }}
      />
    </div>
  );
};
