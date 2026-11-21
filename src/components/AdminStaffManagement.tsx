import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Filter, 
  Users, 
  Medal, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  Phone, 
  Mail, 
  Calendar,
  Sparkles,
  RefreshCw,
  Shield
} from 'lucide-react';
import { Role, User } from '../types';

export const AdminStaffManagement: React.FC = () => {
  const { currentUser, users, createStaffUser, toggleStaffActiveStatus, isFirebaseAuthConfigured, highlightRecord, setHighlightRecord } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'TEACHER' | 'ADMIN'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Auto-scroll to highlighted staff member from notification
  React.useEffect(() => {
    if (highlightRecord?.recordId) {
      setRoleFilter('ALL');
      setSearchTerm('');
      setTimeout(() => {
        const el = document.getElementById(`staff-row-${highlightRecord.recordId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [highlightRecord?.recordId]);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'TEACHER' | 'ADMIN'>('TEACHER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter for staff only (TEACHER or ADMIN)
  const staffMembers = users.filter(u => u.role === 'TEACHER' || u.role === 'ADMIN');
  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = 
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.phone && staff.phone.includes(searchTerm));
    const matchesRole = roleFilter === 'ALL' || staff.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const teacherCount = staffMembers.filter(s => s.role === 'TEACHER').length;
  const adminCount = staffMembers.filter(s => s.role === 'ADMIN').length;
  const activeCount = staffMembers.filter(s => s.active).length;

  const handleOpenModal = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSelectedRole('TEACHER');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setStatusMessage(null);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsCreateModalOpen(false);
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setStatusMessage({ type: 'error', text: 'Please enter the staff member\'s full name.' });
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid official email address.' });
      return;
    }

    if (password.length < 6) {
      setStatusMessage({ type: 'error', text: 'Initial password must be at least 6 characters.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match. Please verify and retry.' });
      return;
    }

    const targetRole: 'TEACHER' | 'ADMIN' = isCurrentUserAdmin ? selectedRole : 'TEACHER';

    setIsSubmitting(true);
    try {
      const res = await createStaffUser({
        name: trimmedName,
        email: trimmedEmail,
        phone: phone.trim(),
        role: targetRole,
        password: password,
      });

      if (res.success) {
        setStatusMessage({ 
          type: 'success', 
          text: res.message || `Staff account successfully provisioned with role ${targetRole}.` 
        });
        // Clear sensitive inputs immediately
        setPassword('');
        setConfirmPassword('');
        // Auto-close modal after brief feedback
        setTimeout(() => {
          setIsCreateModalOpen(false);
        }, 1800);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred while creating the staff account.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffId: string) => {
    const res = await toggleStaffActiveStatus(staffId);
    if (!res.success) {
      setStatusMessage({ type: 'error', text: res.message });
    } else {
      setStatusMessage({ type: 'success', text: res.message });
    }
  };

  // Guard: If an unauthorized user somehow renders this component
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'TEACHER')) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-100 shadow-sm max-w-xl mx-auto my-12">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600 mt-1">
          Staff Account Management requires an active Sports Teacher or Administrator session. Students are not permitted to view this section.
        </p>
      </div>
    );
  }

  const isCurrentUserAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isCurrentUserAdmin ? 'Administrator Security Portal' : 'Sports Department Staff Portal'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Staff Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isCurrentUserAdmin 
              ? 'Provision authorized Sports Department Teachers and Administrators. All accounts are secured with Firebase Authentication and role-enforced Firestore access rules.'
              : 'Provision authorized Sports Department Teachers. All accounts are secured with Firebase Authentication and role-enforced Firestore access rules.'}
          </p>
        </div>

        <button
          id="btn-open-create-staff"
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isCurrentUserAdmin ? 'Add Staff Member' : 'Add Sports Teacher'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Staff</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{staffMembers.length}</div>
            <div className="text-[10px] text-slate-400">Authorized personnel</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Medal className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Sports Teachers</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{teacherCount}</div>
            <div className="text-[10px] text-blue-600 font-medium">Sports In-Charge</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Administrators</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{adminCount}</div>
            <div className="text-[10px] text-purple-600 font-medium">Full System Access</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Status</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{activeCount} / {staffMembers.length}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Ready for duty</div>
          </div>
        </div>
      </div>

      {/* Security Model Card */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-900">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>
            <strong>Role-Based Access Control:</strong> Public registration is strictly restricted to Students. Authorized Sports Teachers can provision Sports Teachers. Only Administrators can provision Administrators.
          </span>
        </div>
        <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white text-indigo-700 font-semibold border border-indigo-200 shrink-0">
          <span>{isFirebaseAuthConfigured ? 'Cloud Auth Enforced' : 'Offline Engine'}</span>
        </div>
      </div>

      {/* Staff Table & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Roles ({staffMembers.length})</option>
              <option value="TEACHER">Sports Teachers ({teacherCount})</option>
              <option value="ADMIN">Administrators ({adminCount})</option>
            </select>
          </div>
        </div>

        {/* Staff List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
              <tr>
                <th className="px-5 py-3.5">Staff Member</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    No authorized staff members found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isCurrent = staff.id === currentUser.id;
                  const isTeacher = staff.role === 'TEACHER';
                  const isAdmin = staff.role === 'ADMIN';
                  const isHighlighted = highlightRecord?.recordId === staff.id;

                  return (
                    <tr 
                      key={staff.id} 
                      id={`staff-row-${staff.id}`}
                      className={`transition-all ${
                        isHighlighted 
                          ? 'bg-blue-50/90 ring-2 ring-blue-500 shadow-sm' 
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isAdmin 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {staff.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span className="truncate">{staff.name}</span>
                              {isHighlighted && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                  Linked
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>{staff.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-3.5">
                        {isAdmin ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Shield className="w-3 h-3" />
                            <span>Administrator</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Medal className="w-3 h-3" />
                            <span>Sports Teacher</span>
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5">
                        {staff.phone ? (
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{staff.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not provided</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {staff.active ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500">
                            <XCircle className="w-3 h-3" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-5 py-3.5 text-[11px] text-slate-500">
                        {staff.created_at ? new Date(staff.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {isCurrentUserAdmin ? (
                          !isCurrent ? (
                            <button
                              onClick={() => handleToggleStatus(staff.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                staff.active
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {staff.active ? 'Deactivate' : 'Activate'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Self</span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {isCurrent ? 'You' : 'Managed by Admin'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STAFF MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-indigo-600 mb-1">
              <UserPlus className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Provision Authorized Staff Account</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Create a secure Firebase Authentication credential and assign role-based access for sports department personnel.
            </p>

            {statusMessage && (
              <div className={`p-3.5 rounded-xl text-xs mb-4 flex items-start space-x-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prof. Rajesh Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Official Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rajesh.sharma@dmims.edu"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used as the login credential in Firebase Authentication.
                </span>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Phone / Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Assigned Staff Role <span className="text-rose-500">*</span>
                </label>
                {isCurrentUserAdmin ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* TEACHER OPTION */}
                    <label 
                      onClick={() => setSelectedRole('TEACHER')}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col ${
                        selectedRole === 'TEACHER'
                          ? 'border-blue-600 bg-blue-50/50 text-blue-950'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Medal className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold">Sports Teacher</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Full sports inventory, requisitions, issue & return processing. Recommended for departmental staff.
                      </p>
                    </label>

                    {/* ADMIN OPTION */}
                    <label 
                      onClick={() => setSelectedRole('ADMIN')}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col ${
                        selectedRole === 'ADMIN'
                          ? 'border-purple-600 bg-purple-50/50 text-purple-950'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold">Administrator</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Full sports operations plus staff account creation and administrative controls.
                      </p>
                    </label>
                  </div>
                ) : (
                  <div>
                    <div className="p-3.5 rounded-xl border-2 border-blue-600 bg-blue-50/50 text-blue-950 flex flex-col">
                      <div className="flex items-center space-x-2 mb-1">
                        <Medal className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold">Sports Teacher (Authorized Role)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Full sports operations: equipment management, requisitions, approvals, issue and return processing.
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Note: Sports Teachers are authorized to create Sports Teacher accounts. Administrator accounts can only be provisioned by Administrators.
                    </p>
                  </div>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Credential Privacy Guarantee</span>
                </div>
                <p>
                  Passwords are directly encrypted by Firebase Authentication. Passwords are never saved in Firestore documents or accessible to anyone after submission.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-create-staff"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisioning Staff...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Staff Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
