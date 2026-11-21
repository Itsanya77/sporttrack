import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  User, 
  Hash, 
  Phone, 
  BookOpen, 
  Calendar, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  LogOut, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const CompleteProfileModal: React.FC = () => {
  const { currentUser, updateProfile, logout } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [studentId, setStudentId] = useState(currentUser?.student_id || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [course, setCourse] = useState(currentUser?.course || '');
  const [year, setYear] = useState(currentUser?.year || '');
  const [division, setDivision] = useState(currentUser?.division || '');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    const trimmedStudentId = studentId.trim().toUpperCase();
    const trimmedPhone = phone.trim();
    const trimmedCourse = course.trim();
    const trimmedYear = year.trim();
    const trimmedDivision = division.trim().toUpperCase();

    // Strict validation: Nothing can be empty
    if (!trimmedName) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!trimmedStudentId) {
      setErrorMsg('Student ID / Roll Number is required.');
      return;
    }
    if (!trimmedPhone) {
      setErrorMsg('Phone Number is required.');
      return;
    }
    if (!trimmedCourse) {
      setErrorMsg('Course is required (e.g., MCA, MBA, BCA).');
      return;
    }
    if (!trimmedYear) {
      setErrorMsg('Year of Study is required (e.g., 1st Year, 2nd Year).');
      return;
    }
    if (!trimmedDivision) {
      setErrorMsg('Division is required (e.g., A, B).');
      return;
    }

    setIsSubmitting(true);

    const updatedFields = {
      name: trimmedName,
      student_id: trimmedStudentId,
      phone: trimmedPhone,
      course: trimmedCourse,
      year: trimmedYear,
      division: trimmedDivision,
      profile_completed: true,
    };

    try {
      const res = await updateProfile(currentUser.id, updatedFields);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      console.error('Failed to complete profile:', err);
      setErrorMsg(err?.message || 'Failed to save profile. Please verify your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        {/* Header Banner */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Complete Your Profile</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Welcome to Dr. Moonje Institute Sports Portal. Please provide your academic details to activate borrowing privileges.
          </p>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Profile completion is compulsory before accessing sports gear</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
              />
            </div>
          </div>

          {/* Student ID & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Student ID / Roll No <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder="e.g. 2024-MCA-042"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Course, Year, Division */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Course <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  placeholder="e.g. MCA"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Year <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  required
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium bg-white"
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="Final Year">Final Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Division <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={division}
                  onChange={e => setDivision(e.target.value)}
                  placeholder="e.g. A"
                  maxLength={4}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Saving to Database...' : 'Save & Continue to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
