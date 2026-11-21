import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Trophy, 
  Shield, 
  User, 
  LogOut, 
  ArrowLeftRight, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2,
  Info,
  Building2, 
  Bell, 
  Menu,
  Clock,
  ArrowRight,
  Check
} from 'lucide-react';
import { DEFAULT_COLLEGE_LOGO, handleLogoImgError } from '../utils/logoUtils';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleMobileMenu,
  onNavigateTab 
}) => {
  const { 
    currentUser, 
    logout, 
    settings, 
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    resolveNotificationTarget,
    navigateToNotification 
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotifOpen(false);
      }
    };

    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotifOpen]);

  if (!currentUser) return null;

  const relevantNotifs = notifications.filter(n => {
    if (n.target_role !== 'ALL' && n.target_role !== currentUser.role) return false;
    return true;
  });

  const unreadNotifs = relevantNotifs.filter(n => !n.read).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* College Branding Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <img 
            src={settings.logo_url || DEFAULT_COLLEGE_LOGO} 
            alt="DMIMCS Emblem" 
            className="w-4 h-4 object-contain rounded-xs bg-white p-0.5 shrink-0"
            referrerPolicy="no-referrer"
            onError={handleLogoImgError}
          />
          <span className="font-semibold text-white tracking-wide truncate max-w-[280px] sm:max-w-none">
            {settings.college_name}
          </span>
          <span className="text-amber-400 text-[11px] font-medium hidden md:inline">
            • उद्योगः कर्मसु कौशलम्
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-300 font-medium hidden sm:inline">{settings.department}</span>
        </div>

        {/* Academic Session / System Status */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-300">
            {settings.academic_year || 'Academic Year 2024-2025'}
          </span>
        </div>
      </div>

      {/* Main App Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Hamburger (Mobile) + Logo and App Title */}
        <div className="flex items-center space-x-3">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
            <img 
              src={settings.logo_url || DEFAULT_COLLEGE_LOGO} 
              alt="Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={handleLogoImgError}
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                SportTrack
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Dr. Moonje Institute • Sports Equipment Portal
            </p>
          </div>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notifications Bell with Interactive Dropdown */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2 rounded-xl transition-colors cursor-pointer ${
                isNotifOpen 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="Notifications"
              aria-expanded={isNotifOpen}
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Dropdown Header */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">Notifications</span>
                    {unreadNotifs > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold">
                        {unreadNotifs} unread
                      </span>
                    )}
                  </div>
                  {unreadNotifs > 0 && (
                    <button
                      onClick={() => markAllNotificationsAsRead()}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification Items List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {relevantNotifs.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">No notifications yet</p>
                      <p className="mt-0.5">You are all caught up with sports alerts.</p>
                    </div>
                  ) : (
                    relevantNotifs.slice(0, 6).map(notif => {
                      const target = resolveNotificationTarget(notif, currentUser.role);

                      return (
                        <button
                          key={notif.id}
                          type="button"
                          onClick={() => {
                            navigateToNotification(notif, onNavigateTab);
                            setIsNotifOpen(false);
                          }}
                          className={`w-full p-3.5 text-left transition-colors flex items-start space-x-3 cursor-pointer group ${
                            notif.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/60 hover:bg-blue-50/90'
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {notif.type === 'ALERT' ? (
                              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                                <AlertCircle className="w-3.5 h-3.5" />
                              </div>
                            ) : notif.type === 'WARNING' ? (
                              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </div>
                            ) : notif.type === 'SUCCESS' ? (
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                <Info className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className={`text-xs font-bold truncate ${notif.read ? 'text-slate-800' : 'text-slate-950 font-extrabold'}`}>
                                {notif.title}
                              </span>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                            <div className="mt-1.5 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-mono">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-blue-600 font-bold group-hover:underline flex items-center space-x-0.5">
                                <span>{target.label}</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Dropdown Footer */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('notifications');
                      setIsNotifOpen(false);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>View All Notifications ({relevantNotifs.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Badge */}
          <button
            onClick={() => onNavigateTab && onNavigateTab('profile')}
            className="flex items-center space-x-2 pl-2 border-l border-slate-200 hover:bg-slate-50 p-1.5 rounded-xl transition-colors text-left cursor-pointer"
            title="View Profile"
          >
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold shrink-0 ${
              currentUser.role === 'ADMIN'
                ? 'bg-purple-50 border-purple-200 text-purple-700'
                : currentUser.role === 'TEACHER'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              {currentUser.role === 'ADMIN' ? (
                <Shield className="w-4 h-4 text-purple-600" />
              ) : currentUser.role === 'TEACHER' ? (
                <Shield className="w-4 h-4 text-blue-600" />
              ) : (
                <User className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                {currentUser.role}
              </div>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Logout of SportTrack"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
