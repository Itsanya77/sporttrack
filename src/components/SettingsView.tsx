import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Building2, 
  ShieldAlert, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Sliders,
  Database,
  Upload,
  Check,
  X
} from 'lucide-react';
import {
  DEFAULT_COLLEGE_LOGO,
  clearCachedCollegeLogo,
  handleLogoImgError,
  processLogoImageFile,
  ProcessedLogoResult
} from '../utils/logoUtils';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, currentUser } = useApp();
  const canEditSettings = currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN';

  const [form, setForm] = useState({
    college_name: settings.college_name,
    department: settings.department,
    logo_url: settings.logo_url || DEFAULT_COLLEGE_LOGO,
    sports_incharge_name: settings.sports_incharge_name || '',
    academic_year: settings.academic_year || '2024-2025',
    contact_email: settings.contact_email || 'sports@dmims.edu',
    contact_phone: settings.contact_phone || '',
    max_borrow_duration_days: settings.max_borrow_duration_days || 7,
    fine_per_day: settings.fine_per_day || 10,
    require_selfie: settings.require_selfie || false,
    auto_approve_enabled: settings.auto_approve_enabled || false,
    allow_student_registration: settings.allow_student_registration ?? true,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasEditedLogoRef = useRef(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState<ProcessedLogoResult | null>(null);

  // Sync form state when academic year or logo updates from Firestore in real-time (without clobbering unsaved logo edits)
  React.useEffect(() => {
    setForm(prev => {
      const nextAcademicYear = settings.academic_year || prev.academic_year;
      const nextLogoUrl = !hasEditedLogoRef.current
        ? (settings.logo_url || DEFAULT_COLLEGE_LOGO)
        : prev.logo_url;
      if (nextAcademicYear === prev.academic_year && nextLogoUrl === prev.logo_url) {
        return prev;
      }
      return {
        ...prev,
        academic_year: nextAcademicYear,
        logo_url: nextLogoUrl,
      };
    });
  }, [settings.academic_year, settings.logo_url]);

  const handleLogoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canEditSettings) return;

    setLogoUploadError(null);
    setPendingLogoPreview(null);
    setIsProcessingLogo(true);
    try {
      const processed = await processLogoImageFile(file);
      setPendingLogoPreview(processed);
    } catch (err: any) {
      setLogoUploadError(err?.message || 'Failed to process the selected image.');
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleConfirmPendingLogo = () => {
    if (!pendingLogoPreview || !canEditSettings) return;
    hasEditedLogoRef.current = true;
    setForm(prev => ({ ...prev, logo_url: pendingLogoPreview.dataUrl }));
    setPendingLogoPreview(null);
    setLogoUploadError(null);
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleCancelPendingLogo = () => {
    setPendingLogoPreview(null);
    setLogoUploadError(null);
  };

  const handleResetLogo = () => {
    if (!canEditSettings) return;
    hasEditedLogoRef.current = true;
    setForm(prev => ({ ...prev, logo_url: DEFAULT_COLLEGE_LOGO }));
    setPendingLogoPreview(null);
    setLogoUploadError(null);
    clearCachedCollegeLogo();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSettings || isSaving) return;
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const res = await updateSettings(form);
      if (res && res.success === false) {
        setSaveError(res.message);
      } else {
        hasEditedLogoRef.current = false;
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save settings to Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!canEditSettings) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-sm text-center max-w-xl mx-auto my-12">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
          Access Denied: Teacher or Admin Permissions Required
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          System settings and institutional emblem customization are restricted to Sports Department faculty and administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <Settings className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Teacher / Admin Panel</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System & Department Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure institutional parameters, loan tenure limits, fines, and departmental administration.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {saveError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-rose-800 text-xs font-bold shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-800 text-xs font-bold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Department configuration saved successfully!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Institutional Identification */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Institutional Identification</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">College Name</label>
              <input
                type="text"
                required
                value={form.college_name}
                onChange={e => setForm({ ...form, college_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Department</label>
              <input
                type="text"
                required
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Sports Director / In-Charge</label>
              <input
                type="text"
                required
                value={form.sports_incharge_name}
                onChange={e => setForm({ ...form, sports_incharge_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                required
                value={form.academic_year}
                onChange={e => setForm({ ...form, academic_year: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Official Contact Email</label>
              <input
                type="email"
                required
                value={form.contact_email}
                onChange={e => setForm({ ...form, contact_email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Department Phone</label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                College Emblem / Logo URL
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                  <img 
                    src={form.logo_url || DEFAULT_COLLEGE_LOGO} 
                    alt="Emblem Preview" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={handleLogoImgError}
                  />
                </div>
                <div className="flex-1 w-full flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={form.logo_url}
                    onChange={e => {
                      hasEditedLogoRef.current = true;
                      setForm({ ...form, logo_url: e.target.value });
                    }}
                    placeholder="/college_logo.jpg"
                    className="flex-1 min-w-[180px] px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                    onChange={handleLogoFileSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isProcessingLogo || isSaving}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 transition-colors whitespace-nowrap inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isProcessingLogo ? 'Processing...' : 'Choose logo from computer'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Reset to DMIMCS Emblem
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-1.5">
                Accepts PNG, JPG, or WebP up to 5 MB (automatically resized to max 256 px and compressed under 200 KB). Click &ldquo;Save Settings&rdquo; to apply changes.
              </p>

              {logoUploadError && (
                <div className="mt-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{logoUploadError}</span>
                </div>
              )}

              {pendingLogoPreview && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                      <img
                        src={pendingLogoPreview.dataUrl}
                        alt="New Logo Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        New Logo Live Preview
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {pendingLogoPreview.width} × {pendingLogoPreview.height} px • {(pendingLogoPreview.byteLength / 1024).toFixed(1)} KB
                      </div>
                      <div className="text-[11px] text-blue-700 font-medium mt-0.5">
                        Click &ldquo;Use this logo&rdquo; to place it into the URL field, then click &ldquo;Save Settings&rdquo;.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleConfirmPendingLogo}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Use this logo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelPendingLogo}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}

              {!pendingLogoPreview && form.logo_url !== (settings.logo_url || DEFAULT_COLLEGE_LOGO) && (
                <div className="mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 inline-block">
                  Emblem updated in form — click &ldquo;Save Settings&rdquo; at the top to save to database.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Requisition & Loan Policies */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Equipment Loan & Penalty Policies</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Standard Max Loan Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={form.max_borrow_duration_days}
                onChange={e => setForm({ ...form, max_borrow_duration_days: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Late Fine Per Overdue Day (INR ₹)
              </label>
              <input
                type="number"
                min={0}
                value={form.fine_per_day}
                onChange={e => setForm({ ...form, fine_per_day: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.auto_approve_enabled}
                onChange={e => setForm({ ...form, auto_approve_enabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-slate-700">
                Enable Instant Auto-Approval for high-stock practice balls and shuttlecocks
              </span>
            </label>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allow_student_registration}
                  onChange={e => setForm({ ...form, allow_student_registration: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Allow Student Self-Registration on Login Portal (Public Access)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    When enabled, new students can click "Register for Sports Requisition" on the login screen. When disabled, student accounts can only be enrolled manually by the Teacher/Admin.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Database & Cloud Firestore Status */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-indigo-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Cloud Database Single Source of Truth</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            All sports equipment catalogs, registered student accounts, active loan records, return inspections, and academic configuration settings are synchronized directly with Google Cloud Firestore (collections: users, equipment, requests, issues, returns, settings).
          </p>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Cloud Firestore Synchronization Active • Single Source of Truth</span>
          </div>
        </div>
      </form>
    </div>
  );
};
