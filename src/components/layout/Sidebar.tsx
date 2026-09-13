import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Video,
  FileCheck2,
  CalendarDays,
  UserCheck2,
  FileText,
  Award,
  BarChart3,
  Users,
  Building2,
  BookOpen,
  LogOut,
  X,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  isMobileOpen,
  onCloseMobile
}) => {
  const { role, currentUser, logout } = useAuth();

  const isDrawerOpen = isMobileOpen ?? mobileOpen ?? false;
  const handleClose = () => {
    if (onCloseMobile) onCloseMobile();
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleNavClick = (tabKey: string) => {
    setActiveTab(tabKey);
    handleClose();
  };

  const roleLabel =
    role === 'STUDENT'
      ? 'Student Workspace'
      : role === 'TEACHER'
      ? 'Instructor Portal'
      : 'Administrator';

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Mobile Drawer Header with Close Button */}
      <div className="p-4 border-b border-[#E2E8F0] bg-[#F7F9FB]/80 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-[#1E3A5F]">EduFlip Navigation</span>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded-lg text-[#5B6B7C] hover:bg-[#EEF3F7] transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Persona Chip in Sidebar */}
      <div className="p-4 border-b border-[#E2E8F0] bg-[#F7F9FB]/60">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6B7C] mb-1.5">
          Active Workspace
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-[#0F766E] flex items-center justify-center font-bold text-xs border border-teal-200 shrink-0">
            {currentUser?.fullName?.charAt(0) || role.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#1E3A5F] truncate">
              {roleLabel}
            </div>
            <div className="text-[11px] text-[#5B6B7C] truncate">
              {currentUser?.fullName || 'User'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="p-3 space-y-5 flex-1 overflow-y-auto">
        {/* Main Dashboard */}
        <div>
          <button
            id="sidebar-nav-dashboard"
            onClick={() =>
              handleNavClick(
                role === 'STUDENT'
                  ? 'student-dashboard'
                  : role === 'TEACHER'
                  ? 'teacher-dashboard'
                  : 'admin-dashboard'
              )
            }
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
              activeTab.includes('dashboard')
                ? 'bg-[#0F766E] text-white shadow-xs font-semibold'
                : 'text-[#5B6B7C] hover:bg-[#EEF3F7] hover:text-[#0F172A]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </div>
          </button>
        </div>

        {/* Phase 1: Before Class */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
            Phase 1: Before Class
          </div>

          <button
            id="sidebar-nav-modules"
            onClick={() => handleNavClick('course-modules')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
              activeTab === 'course-modules'
                ? 'bg-teal-50 text-[#0F766E] font-semibold border border-teal-200'
                : 'text-[#5B6B7C] hover:bg-[#EEF3F7] hover:text-[#0F172A]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Video className="w-4 h-4" />
              <span>Modules & Lectures</span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
              3 Mod
            </span>
          </button>

          {role === 'TEACHER' && (
            <button
              id="sidebar-nav-readiness"
              onClick={() => handleNavClick('readiness')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'readiness'
                  ? 'bg-teal-50 text-[#0F766E] font-semibold border border-teal-200'
                  : 'text-[#5B6B7C] hover:bg-[#EEF3F7] hover:text-[#0F172A]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck2 className="w-4 h-4" />
                <span>Preparation Matrix</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                Live
              </span>
            </button>
          )}

          <button
            id="sidebar-nav-pre-quiz"
            onClick={() => handleNavClick('pre-quiz')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
              activeTab === 'pre-quiz'
                ? 'bg-teal-50 text-[#0F766E] font-semibold border border-teal-200'
                : 'text-[#5B6B7C] hover:bg-[#EEF3F7] hover:text-[#0F172A]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-4 h-4" />
              <span>Pre-Class Quizzes</span>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
              Required
            </span>
          </button>
        </div>

        {/* Phase 2: During Class */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#1E3A5F] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A5F]" />
            Phase 2: During Class
          </div>

          <button
            id="sidebar-nav-physical-classes"
            onClick={() => handleNavClick('physical-classes')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
              activeTab === 'physical-classes'
                ? 'bg-blue-50 text-[#1E3A5F] font-semibold border border-blue-200'
                : 'text-[#5B6B7C] hover:bg-[#EEF3F7] hover:text-[#0F172A]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4" />
              <span>{role === 'STUDENT' ? 'Physical Schedule' : 'Attendance & Roll Call'}</span>
            </div>
          </button>
        </div>

        {/* Phase 3: After Class */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Phase 3: After Class
          </div>

          <button
            id="sidebar-nav-assignments"
            onClick={() => handleNavClick('assignments')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
              activeTab === 'assignments'
                ? 'bg-amber-50 text-amber-800 font-semibold border border-amber-200'
                : 'text-[#5B6B7C] hover:bg-[#EEF3F7] hover:text-[#0F172A]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4" />
              <span>{role === 'TEACHER' ? 'Assignment Rubrics & Grading' : 'Submit Assignments'}</span>
            </div>
          </button>

          <button
            id="sidebar-nav-post-quiz"
            onClick={() => handleNavClick('post-quiz')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
              activeTab === 'post-quiz'
                ? 'bg-amber-50 text-amber-800 font-semibold border border-amber-200'
                : 'text-[#5B6B7C] hover:bg-[#EEF3F7] hover:text-[#0F172A]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4" />
              <span>Post-Class Quizzes</span>
            </div>
          </button>
        </div>

        {/* Analytics & Outcomes */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5B6B7C]">
            Insights & Progress
          </div>

          <button
            id="sidebar-nav-analytics"
            onClick={() => handleNavClick('analytics')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
              activeTab === 'analytics'
                ? 'bg-[#EEF3F7] text-[#1E3A5F] font-semibold border border-[#E2E8F0]'
                : 'text-[#5B6B7C] hover:bg-[#EEF3F7] hover:text-[#0F172A]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4" />
              <span>{role === 'STUDENT' ? 'My Learning Progress' : 'Cohort Analytics'}</span>
            </div>
          </button>
        </div>

        {/* Administrator Specific Views */}
        {role === 'ADMIN' && (
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5B6B7C]">
              Administration
            </div>

            <button
              id="sidebar-nav-admin-users"
              onClick={() => handleNavClick('admin-users')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'admin-users'
                  ? 'bg-teal-50 text-[#0F766E] font-semibold border border-teal-200'
                  : 'text-[#5B6B7C] hover:bg-[#EEF3F7] hover:text-[#0F172A]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </div>
            </button>

            <button
              id="sidebar-nav-departments"
              onClick={() => handleNavClick('admin-departments')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'admin-departments'
                  ? 'bg-teal-50 text-[#0F766E] font-semibold border border-teal-200'
                  : 'text-[#5B6B7C] hover:bg-[#EEF3F7] hover:text-[#0F172A]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                <span>Departments & Org</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Log Out Section */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F7F9FB]/80 shrink-0">
        <button
          onClick={() => {
            logout();
            handleClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign Out / Log Out</span>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={handleClose}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-200 ease-in-out lg:hidden ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop In-Flow Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs self-start sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {sidebarContent}
      </aside>
    </>
  );
};
