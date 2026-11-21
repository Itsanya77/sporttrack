import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Clock, 
  PackageCheck, 
  RotateCcw, 
  Video, 
  Medal, 
  Bell, 
  Palette, 
  BarChart3, 
  UserCircle, 
  Settings, 
  LogOut, 
  PlusCircle, 
  BookOpen, 
  History,
  X,
  ShieldCheck,
  MessageSquare,
  MessageSquarePlus,
  Upload
} from 'lucide-react';
import { DEFAULT_COLLEGE_LOGO, handleLogoImgError } from '../utils/logoUtils';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onRequestEquipmentClick?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  onRequestEquipmentClick,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { currentUser, requests, returnRecords, issueRecords, notifications, logout, settings, users, feedback } = useApp();

  if (!currentUser) return null;

  // Live notification badges
  const registeredStudentIds = new Set(users.filter(u => u.role === 'STUDENT').map(u => u.id));
  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;
  const pendingReturnsCount = returnRecords.filter(
    r => r.status === 'RETURN_PENDING' && registeredStudentIds.has(r.student_id)
  ).length;
  const activeIssuedCount = issueRecords.filter(i => i.status === 'ISSUED').length;
  const newFeedbackCount = feedback.filter(f => f.status === 'NEW').length;
  const unreadNotifCount = notifications.filter(n => {
    if (n.target_role !== 'ALL' && n.target_role !== currentUser.role) return false;
    return !n.read;
  }).length;

  const isStudentMatch = (studentId: string | undefined) => {
    if (!studentId || !currentUser) return false;
    return (
      studentId === currentUser.id ||
      (Boolean(currentUser.email) && studentId.toLowerCase() === currentUser.email.toLowerCase()) ||
      (Boolean(currentUser.student_id) && studentId.toUpperCase() === (currentUser.student_id || '').toUpperCase())
    );
  };

  const studentActiveEquipmentCount = currentUser.role === 'STUDENT'
    ? issueRecords.filter(i => isStudentMatch(i.student_id) && i.status === 'ISSUED').length
    : 0;
  const studentPendingReqCount = currentUser.role === 'STUDENT'
    ? requests.filter(r => isStudentMatch(r.student_id) && r.status === 'PENDING').length
    : 0;

  // Teacher navigation items (Explicitly requested in order)
  const teacherItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'staff-management', label: 'Staff Management', icon: ShieldCheck },
    { id: 'equipment', label: 'Equipment', icon: Package },
    { id: 'requests', label: 'Equipment Requests', icon: Clock, badge: pendingRequestsCount, badgeColor: 'bg-amber-500 text-slate-950' },
    { id: 'student-feedback', label: 'Student Feedback', icon: MessageSquare, badge: newFeedbackCount, badgeColor: 'bg-emerald-500 text-white' },
    { id: 'issued', label: 'Issued Equipment', icon: PackageCheck, badge: activeIssuedCount, badgeColor: 'bg-blue-500 text-white' },
    { id: 'returns', label: 'Returns', icon: RotateCcw, badge: pendingReturnsCount, badgeColor: 'bg-orange-500 text-slate-950' },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'sports', label: 'Categories', icon: Medal },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifCount, badgeColor: 'bg-rose-500 text-white' },
    { id: 'login-settings', label: 'Login Page Settings', icon: Palette },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
    ...(currentUser.role === 'ADMIN' ? [
      { id: 'import-equipment', label: 'Import Equipment', icon: Upload }
    ] : []),
  ];

  // Student navigation items (Explicitly requested in order)
  const studentItems = [
    { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'request-action', label: 'Request Equipment', icon: PlusCircle, isAction: true },
    { id: 'my-equipment', label: 'My Equipment', icon: Package, badge: studentActiveEquipmentCount, badgeColor: 'bg-blue-500 text-white' },
    { id: 'my-requests', label: 'My Requests', icon: Clock, badge: studentPendingReqCount, badgeColor: 'bg-amber-500 text-slate-950' },
    { id: 'feedback-box', label: 'Feedback Box', icon: MessageSquarePlus },
    { id: 'learn', label: 'Learn & Play', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  const isStaff = currentUser.role === 'TEACHER' || currentUser.role === 'ADMIN';
  const items = isStaff ? teacherItems : studentItems;

  const handleItemClick = (id: string, isAction?: boolean) => {
    if (isAction) {
      if (onRequestEquipmentClick) {
        onRequestEquipmentClick();
      } else {
        onSelectTab('sports-catalog');
      }
    } else {
      onSelectTab(id);
    }
    if (onCloseMobile) onCloseMobile();
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of SportTrack?')) {
      logout();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-all duration-300 z-40 ${
          isMobileOpen 
            ? 'fixed inset-y-0 left-0 shadow-2xl' 
            : 'hidden md:flex min-h-[calc(100vh-80px)]'
        }`}
      >
        {/* College Emblem Brand Banner */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center shadow-xs overflow-hidden border border-slate-700/50">
            <img 
              src={settings.logo_url || DEFAULT_COLLEGE_LOGO} 
              alt="DMIMCS Emblem" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={handleLogoImgError}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white leading-tight truncate">
              Dr. Moonje Institute
            </div>
            <div className="text-[10px] text-amber-400 font-medium truncate">
              उद्योगः कर्मसु कौशलम्
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Sports Department
            </div>
          </div>
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Top User/Role Badge */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-400">
              {isStaff ? 'Faculty / Admin Portal' : 'Student Portal'}
            </div>
            <div className="text-sm text-white font-bold truncate mt-0.5 max-w-[190px]">
              {currentUser.name}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {isStaff ? (currentUser.role === 'ADMIN' ? 'Administrator' : 'Sports In-Charge') : `ID: ${currentUser.student_id || currentUser.username}`}
            </div>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            if ('isAction' in item && item.isAction) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id, true)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md shadow-blue-500/25 mb-2 cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4 text-white" />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-white border-l-4 border-blue-500 font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black ${item.badgeColor || 'bg-blue-600 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Explicit Logout Item */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
