import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { TeacherDashboard } from './components/dashboard/TeacherDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { CourseModulesView } from './components/modules/CourseModulesView';
import { QuizRunner } from './components/quiz/QuizRunner';
import { PhysicalClassManager } from './components/classes/PhysicalClassManager';
import { PreparationMatrix } from './components/readiness/PreparationMatrix';
import { AssignmentWorkspace } from './components/assignments/AssignmentWorkspace';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { AdminUsersView } from './components/admin/AdminUsersView';
import { AdminDepartmentsView } from './components/admin/AdminDepartmentsView';
import { CreateCourseModal } from './components/courses/CreateCourseModal';
import { CourseFeedbackView } from './components/feedback/CourseFeedbackView';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    role,
    viewMode,
    isAuthenticated,
    currentUser,
    toasts,
    removeToast,
    isCreateCourseOpen,
    closeCreateCourseModal
  } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('student-dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync default tab when persona role changes
  useEffect(() => {
    if (role === 'STUDENT' && !['student-dashboard', 'course-modules', 'pre-quiz', 'physical-classes', 'assignments', 'post-quiz', 'analytics', 'feedback'].includes(activeTab)) {
      setActiveTab('student-dashboard');
    } else if (role === 'TEACHER' && !['teacher-dashboard', 'course-modules', 'readiness', 'pre-quiz', 'physical-classes', 'assignments', 'grading', 'post-quiz', 'analytics', 'feedback'].includes(activeTab)) {
      setActiveTab('teacher-dashboard');
    } else if (role === 'ADMIN' && !['admin-dashboard', 'admin-users', 'admin-departments', 'course-modules', 'analytics', 'feedback'].includes(activeTab)) {
      setActiveTab('admin-dashboard');
    }
  }, [role, activeTab]);

  const renderActiveView = () => {
    switch (activeTab) {
      // Student Views
      case 'student-dashboard':
        return <StudentDashboard onNavigate={setActiveTab} />;

      // Teacher Views
      case 'teacher-dashboard':
        return <TeacherDashboard onNavigate={setActiveTab} />;
      case 'readiness':
        return <PreparationMatrix />;
      case 'grading':
        return <AssignmentWorkspace />;

      // Admin Views
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={setActiveTab} />;
      case 'admin-users':
        return <AdminUsersView />;
      case 'admin-departments':
        return <AdminDepartmentsView />;

      // Shared Core Views across Flipped Classroom Phases
      case 'course-modules':
        return <CourseModulesView onNavigateToQuiz={() => setActiveTab('pre-quiz')} />;
      case 'pre-quiz':
        return <QuizRunner quizType="PRE" />;
      case 'physical-classes':
        return <PhysicalClassManager />;
      case 'assignments':
        return <AssignmentWorkspace />;
      case 'post-quiz':
        return <QuizRunner quizType="POST" />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'feedback':
        return <CourseFeedbackView />;

      default:
        if (role === 'STUDENT') return <StudentDashboard onNavigate={setActiveTab} />;
        if (role === 'TEACHER') return <TeacherDashboard onNavigate={setActiveTab} />;
        return <AdminDashboard onNavigate={setActiveTab} />;
    }
  };

  // If unauthenticated or in landing page mode (first time visitor or logged out)
  if (!isAuthenticated || !currentUser || viewMode === 'landing') {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex flex-col text-[#0F172A] font-sans antialiased">
        <LandingPage />
        <AuthModal />
        {/* Global Toast Container */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-2.5 p-3.5 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 ${
                toast.type === 'success'
                  ? 'bg-emerald-900/90 text-white border-emerald-700'
                  : toast.type === 'error'
                  ? 'bg-rose-900/90 text-white border-rose-700'
                  : 'bg-slate-900/90 text-white border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : toast.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-teal-400 shrink-0" />
                )}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Dashboard View Mode
  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col text-[#0F172A] font-sans antialiased selection:bg-[#0F766E]/20 selection:text-[#0F766E]">
      {/* Top Universal Navbar */}
      <Navbar
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Responsive Body with Fixed Alignment: Sidebar and Main Workspace side by side */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 gap-6 items-start">
        {/* Left Sidebar (in-flow on desktop, overlay drawer on mobile) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          isMobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Central Workspace with full visibility and zero overlap */}
        <main className="flex-1 min-w-0">
          {renderActiveView()}
        </main>
      </div>

      {/* Auth Modal for Sign In & Role-Based Sign Up */}
      <AuthModal />

      {/* Real-time Create Course Modal */}
      <CreateCourseModal isOpen={isCreateCourseOpen} onClose={closeCreateCourseModal} />

      {/* Global Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-2.5 p-3.5 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900/90 text-white border-rose-700'
                : 'bg-slate-900/90 text-white border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-teal-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
