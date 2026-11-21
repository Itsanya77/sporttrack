import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthScreen } from './components/AuthScreen';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { EquipmentManagement } from './components/EquipmentManagement';
import { TeacherRequests } from './components/TeacherRequests';
import { TeacherReturns } from './components/TeacherReturns';
import { IssuedEquipmentView } from './components/IssuedEquipmentView';
import { StudentManagement } from './components/StudentManagement';
import { SportsManagement } from './components/SportsManagement';
import { HistoryAndReports } from './components/HistoryAndReports';
import { VideoManagement } from './components/VideoManagement';
import { LoginPageSettings } from './components/LoginPageSettings';
import { NotificationsView } from './components/NotificationsView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { StudentEquipmentCatalog } from './components/StudentEquipmentCatalog';
import { StudentRequests } from './components/StudentRequests';
import { RequestEquipmentModal } from './components/RequestEquipmentModal';
import { AdminStaffManagement } from './components/AdminStaffManagement';
import { CompleteProfileModal } from './components/CompleteProfileModal';
import { StudentFeedbackView } from './components/StudentFeedbackView';
import { TeacherFeedbackView } from './components/TeacherFeedbackView';
import { AdminImportEquipment } from './components/AdminImportEquipment';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

const TEACHER_TABS = [
  'dashboard',
  'students',
  'staff-management',
  'equipment',
  'requests',
  'student-feedback',
  'issued',
  'returns',
  'videos',
  'sports',
  'notifications',
  'login-settings',
  'reports',
  'profile',
  'settings',
  'import-equipment'
];

const STUDENT_TABS = [
  'dashboard',
  'student-dashboard',
  'sports-catalog',
  'my-equipment',
  'my-requests',
  'feedback-box',
  'learn',
  'notifications',
  'profile'
];

const AppContent: React.FC = () => {
  const { currentUser, logout } = useApp();

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Read initial route from URL hash if available
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    if (hash.startsWith('teacher/')) {
      return hash.replace('teacher/', '');
    }
    if (hash.startsWith('student/')) {
      const sub = hash.replace('student/', '');
      return sub === 'dashboard' ? 'student-dashboard' : sub;
    }
    return 'dashboard';
  });

  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [preselectedEquipmentId, setPreselectedEquipmentId] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Sync default tab and URL hash when user logs in or switches
  useEffect(() => {
    if (!currentUser) {
      window.location.hash = '#/login';
      return;
    }

    const isStaff = currentUser.role === 'TEACHER' || currentUser.role === 'ADMIN';

    if (isStaff) {
      if (!TEACHER_TABS.includes(activeTab)) {
        setActiveTab('dashboard');
        window.location.hash = '#/teacher/dashboard';
      } else {
        window.location.hash = `#/teacher/${activeTab}`;
      }
    } else if (currentUser.role === 'STUDENT') {
      if (!STUDENT_TABS.includes(activeTab) && activeTab !== 'import-equipment') {
        setActiveTab('student-dashboard');
        window.location.hash = '#/student/dashboard';
      } else {
        const hashSub = activeTab === 'student-dashboard' ? 'dashboard' : activeTab;
        window.location.hash = `#/student/${hashSub}`;
      }
    }
  }, [currentUser?.role, currentUser?.id]);

  // Listen to hash changes in browser
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (!hash || hash === 'login') return;

      const isStaff = currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN';

      if (hash === 'import-equipment') {
        setActiveTab('import-equipment');
        return;
      }

      if (hash.startsWith('teacher/')) {
        const target = hash.replace('teacher/', '');
        if (target === 'import-equipment') {
          setActiveTab('import-equipment');
          return;
        }
        if (!isStaff) {
          // Security guard: Students cannot access staff routes
          setActiveTab('student-dashboard');
          window.location.hash = '#/student/dashboard';
          return;
        }
        setActiveTab(target);
      } else if (hash.startsWith('student/')) {
        const target = hash.replace('student/', '');
        const targetTab = target === 'dashboard' ? 'student-dashboard' : target;
        if (!STUDENT_TABS.includes(targetTab) && targetTab !== 'import-equipment') {
          setActiveTab('student-dashboard');
          window.location.hash = '#/student/dashboard';
          return;
        }
        setActiveTab(targetTab);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser?.role]);

  const handleNavigate = (tab: string) => {
    const isStaff = currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN';
    if (tab === 'import-equipment') {
      setActiveTab('import-equipment');
      if (isStaff) {
        window.location.hash = '#/teacher/import-equipment';
      } else {
        window.location.hash = '#/student/import-equipment';
      }
      return;
    }
    if (!isStaff && !STUDENT_TABS.includes(tab)) {
      setActiveTab('student-dashboard');
      window.location.hash = '#/student/dashboard';
      return;
    }
    setActiveTab(tab);
    if (isStaff) {
      window.location.hash = `#/teacher/${tab}`;
    } else if (currentUser?.role === 'STUDENT') {
      const hashSub = tab === 'student-dashboard' ? 'dashboard' : tab;
      window.location.hash = `#/student/${hashSub}`;
    }
  };

  // If no user is authenticated, render the full-screen institutional Auth Screen
  if (!currentUser) {
    return <AuthScreen />;
  }

  // Compulsory Complete Your Profile screen: Block access to student dashboard until saved
  if (currentUser.role === 'STUDENT' && !currentUser.profile_completed) {
    return <CompleteProfileModal />;
  }

  const handleOpenRequestModal = (equipmentId?: string) => {
    setPreselectedEquipmentId(equipmentId);
    setIsRequestModalOpen(true);
  };

  // RBAC Validation: Check if student is trying to access teacher-restricted view
  const isUnauthorizedStudent = currentUser.role === 'STUDENT' && !STUDENT_TABS.includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Institutional Top App Bar */}
      <Header 
        onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onNavigateTab={handleNavigate}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 gap-6">
        {/* Navigation Sidebar */}
        <Sidebar 
          currentTab={activeTab} 
          onSelectTab={(tab) => {
            handleNavigate(tab);
            setIsMobileSidebarOpen(false);
          }}
          onRequestEquipmentClick={() => handleOpenRequestModal()}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Content View */}
        <main className="flex-1 min-w-0">
          {/* RBAC Violation Notice for Student */}
          {activeTab === 'import-equipment' ? (
            <AdminImportEquipment onNavigateTab={handleNavigate} />
          ) : isUnauthorizedStudent ? (
            <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-sm text-center max-w-xl mx-auto my-12">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                Access Denied: Teacher Permissions Required
              </h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Your account (<strong className="text-slate-800">{currentUser.name}</strong> • Student ID: {currentUser.student_id || 'N/A'}) is enrolled as a <strong>Student</strong>. 
                This section is reserved exclusively for Sports Department faculty, directors, and administrators.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => handleNavigate('student-dashboard')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Student Dashboard</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span>Sign In as Faculty</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ================= TEACHER / ADMIN VIEWS ================= */}
              {(currentUser.role === 'TEACHER' || currentUser.role === 'ADMIN') && (
                <>
                  {activeTab === 'dashboard' && <TeacherDashboard onNavigateTab={handleNavigate} />}
                  {activeTab === 'students' && <StudentManagement />}
                  {activeTab === 'staff-management' && <AdminStaffManagement />}
                  {activeTab === 'equipment' && <EquipmentManagement />}
                  {activeTab === 'requests' && <TeacherRequests />}
                  {activeTab === 'student-feedback' && <TeacherFeedbackView />}
                  {activeTab === 'issued' && <IssuedEquipmentView />}
                  {activeTab === 'returns' && <TeacherReturns />}
                  {activeTab === 'videos' && <VideoManagement readOnlyStudentMode={false} />}
                  {activeTab === 'sports' && <SportsManagement />}
                  {activeTab === 'notifications' && <NotificationsView onNavigateTab={handleNavigate} />}
                  {activeTab === 'login-settings' && <LoginPageSettings />}
                  {activeTab === 'reports' && <HistoryAndReports />}
                  {activeTab === 'profile' && <ProfileView />}
                  {activeTab === 'settings' && <SettingsView />}
                </>
              )}

              {/* ================= STUDENT VIEWS ================= */}
              {currentUser.role === 'STUDENT' && (
                <>
                  {(activeTab === 'student-dashboard' || activeTab === 'dashboard') && (
                    <StudentDashboard
                      onRequestEquipmentClick={() => handleOpenRequestModal()}
                      onNavigateTab={handleNavigate}
                    />
                  )}
                  {activeTab === 'sports-catalog' && (
                    <StudentEquipmentCatalog
                      onRequestItem={(equipmentId) => handleOpenRequestModal(equipmentId)}
                    />
                  )}
                  {activeTab === 'my-equipment' && (
                    <StudentDashboard
                      onRequestEquipmentClick={() => handleOpenRequestModal()}
                      onNavigateTab={handleNavigate}
                    />
                  )}
                  {activeTab === 'my-requests' && (
                    <StudentRequests
                      onRequestNewClick={() => handleOpenRequestModal()}
                    />
                  )}
                  {activeTab === 'feedback-box' && (
                    <StudentFeedbackView />
                  )}
                  {activeTab === 'learn' && (
                    <VideoManagement readOnlyStudentMode={true} />
                  )}
                  {activeTab === 'notifications' && (
                    <NotificationsView onNavigateTab={handleNavigate} />
                  )}
                  {activeTab === 'profile' && (
                    <ProfileView />
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Request Equipment Modal */}
      <RequestEquipmentModal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setPreselectedEquipmentId(undefined);
        }}
        initialEquipmentId={preselectedEquipmentId}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
