import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  KeyRound,
  X,
  LogIn,
  UserPlus
} from 'lucide-react';
import defaultStadiumBg from '../assets/images/sports_stadium_bg_1789122177534.jpg';
import {
  DEFAULT_COLLEGE_LOGO,
  getCachedCollegeLogo,
  handleLogoImgError
} from '../utils/logoUtils';

export const AuthScreen: React.FC = () => {
  const { 
    login, 
    loginWithGoogle,
    requestPasswordReset, 
    resetPasswordWithToken, 
    loginSettings, 
    settings 
  } = useApp();

  // Active Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Inputs
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // Authentication Feedback Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password Reset Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Dynamic Background from Login Settings or Fallback
  const bgImage = loginSettings.background_image && loginSettings.background_image.trim() !== '' 
    ? loginSettings.background_image 
    : defaultStadiumBg;

  // Handle Email/Password Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const term = usernameOrEmail.trim();
    if (!term) {
      setErrorMsg('Please enter your email or username.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(term, password);
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg(res.message);
      }
    } catch {
      setErrorMsg('An unexpected error occurred during authentication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Authentication Handler (Used on both Login and Register tabs)
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg(res.message);
      }
    } catch {
      setErrorMsg('Failed to connect to Google Sign-In. Please try again.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  // Step 1: Request password reset code
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetFeedback(null);

    if (!resetEmail.trim()) {
      setResetFeedback({ type: 'error', message: 'Please enter your registered email address.' });
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await requestPasswordReset(resetEmail.trim());
      if (!res.success) {
        setResetFeedback({ type: 'error', message: res.message });
      } else {
        setResetStep(2);
        setResetFeedback({ 
          type: 'success', 
          message: `Verification code dispatched! ${res.resetToken ? `(Demo Code: ${res.resetToken})` : 'Check notifications'}` 
        });
        if (res.resetToken) {
          setResetCode(res.resetToken);
        }
      }
    } catch {
      setResetFeedback({ type: 'error', message: 'Failed to dispatch reset code. Please try again.' });
    } finally {
      setResetSubmitting(false);
    }
  };

  // Step 2: Confirm code and change password
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetFeedback(null);

    if (!resetCode.trim()) {
      setResetFeedback({ type: 'error', message: 'Please enter the 6-digit verification code.' });
      return;
    }

    if (newPassword.length < 6) {
      setResetFeedback({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await resetPasswordWithToken(resetEmail.trim(), resetCode.trim(), newPassword);
      if (!res.success) {
        setResetFeedback({ type: 'error', message: res.message });
      } else {
        setResetFeedback({ type: 'success', message: res.message });
        setTimeout(() => {
          setIsForgotOpen(false);
          setResetStep(1);
          setUsernameOrEmail(resetEmail.trim());
          setPassword('');
          setSuccessMsg('Password updated successfully. Please sign in with your new password.');
        }, 1500);
      }
    } catch {
      setResetFeedback({ type: 'error', message: 'Failed to reset password.' });
    } finally {
      setResetSubmitting(false);
    }
  };

  // Reusable Google Sign-In Button
  const renderGoogleButton = () => (
    <button
      id="btn-google-signin"
      type="button"
      disabled={isGoogleSubmitting || isSubmitting}
      onClick={handleGoogleSignIn}
      className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-xs transition-all flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-60 hover:border-slate-400 active:scale-[0.99]"
    >
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
      <span>{isGoogleSubmitting ? 'Connecting...' : 'Continue with Google'}</span>
    </button>
  );

  return (
    <div 
      className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 bg-cover bg-center bg-no-repeat overflow-y-auto"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Dark Transparent Overlay */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
        style={{ 
          backgroundColor: loginSettings.overlay_color || '#020617',
          opacity: loginSettings.overlay_opacity ?? 0.8
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center transition-all duration-300 my-6">
        {/* College & Department Top Branding */}
        <div className="text-center mb-4 text-white">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white shadow-2xl ring-4 ring-white/20 mb-3 border border-slate-100">
            <img 
              src={getCachedCollegeLogo() || DEFAULT_COLLEGE_LOGO} 
              alt="College Emblem" 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl"
              referrerPolicy="no-referrer"
              onError={handleLogoImgError}
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
            SportTrack
          </h1>
          <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mt-1 px-4">
            {loginSettings.college_name || settings.college_name}
          </p>
          <p className="text-xs font-semibold text-amber-300 tracking-wide mt-0.5">
            उद्योगः कर्मसु कौशलम्
          </p>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            {loginSettings.subtitle || settings.department}
          </p>
        </div>

        {/* Centered Auth Card */}
        <div 
          className="w-full rounded-2xl shadow-2xl border border-white/20 overflow-hidden backdrop-blur-md transition-all duration-300"
          style={{ 
            backgroundColor: `rgba(255, 255, 255, ${loginSettings.card_opacity ?? 0.98})` 
          }}
        >
          {/* Two Tabs: Login and Register */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/80">
            <button
              id="tab-auth-login"
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
            <button
              id="tab-auth-register"
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </div>

          <div className="p-6 sm:p-7">
            {/* Validation Alerts */}
            {errorMsg && (
              <div className="p-3 mb-5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="flex-1">{errorMsg}</span>
                <button 
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="text-rose-400 hover:text-rose-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {successMsg && (
              <div className="p-3 mb-5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="flex-1">{successMsg}</span>
                <button 
                  type="button"
                  onClick={() => setSuccessMsg(null)}
                  className="text-emerald-400 hover:text-emerald-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ================= TAB 1: LOGIN ================= */}
            {activeTab === 'login' && (
              <div className="space-y-4">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label 
                      htmlFor="login-identifier" 
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Email or Username
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        id="login-identifier"
                        type="text"
                        required
                        autoComplete="username"
                        value={usernameOrEmail}
                        onChange={e => setUsernameOrEmail(e.target.value)}
                        placeholder="Enter your email or username"
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label 
                        htmlFor="login-password" 
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotOpen(true);
                          setResetStep(1);
                          setResetFeedback(null);
                          setResetEmail(usernameOrEmail.includes('@') ? usernameOrEmail : '');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      <span className="font-medium">Remember login session</span>
                    </label>
                  </div>

                  {/* Sign In Button */}
                  <button
                    id="btn-login-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                  >
                    <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Divider */}
                <div className="relative flex py-2 items-center my-3">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="shrink-0 mx-3 text-xs font-medium text-slate-400 lowercase">
                    or
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Continue with Google */}
                {renderGoogleButton()}
              </div>
            )}

            {/* ================= TAB 2: REGISTER ================= */}
            {activeTab === 'register' && (
              <div className="space-y-5 py-3 text-center">
                <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100">
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    Register and sign in quickly with your <span className="font-bold text-blue-700">Google account</span>.
                  </p>
                </div>

                {renderGoogleButton()}
              </div>
            )}
          </div>
        </div>

        {/* Footnote */}
        <div className="mt-5 text-center text-slate-300 text-xs">
          <span>{settings.college_name}</span>
          <br />
          <span className="text-[11px] text-slate-400">
            {settings.department} • Sports Equipment Management Portal
          </span>
        </div>
      </div>

      {/* Password Reset Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={() => {
                setIsForgotOpen(false);
                setResetFeedback(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-blue-600 mb-1">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Password Recovery</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {resetStep === 1 
                ? 'Enter your registered email address to receive a password reset verification code.' 
                : 'Enter the verification code and set a new secure password for your account.'}
            </p>

            {resetFeedback && (
              <div className={`p-3 mb-4 rounded-xl flex items-start space-x-2 text-xs font-semibold ${
                resetFeedback.type === 'error' 
                  ? 'bg-rose-50 border border-rose-200 text-rose-800' 
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}>
                {resetFeedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <span>{resetFeedback.message}</span>
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md disabled:opacity-60 cursor-pointer"
                  >
                    {resetSubmitting ? 'Sending Code...' : 'Request Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmPasswordReset} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3 py-2 text-sm text-center tracking-widest font-mono font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      setResetFeedback(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md disabled:opacity-60 cursor-pointer"
                  >
                    {resetSubmitting ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
