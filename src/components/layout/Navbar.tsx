import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Bell,
  CheckCircle2,
  BookOpen,
  UserCheck,
  Shield,
  Check,
  ChevronDown,
  Layers,
  Menu,
  LogOut,
  Sparkles,
  LayoutDashboard,
  Plus
} from 'lucide-react';
import type { UserRole } from '../../types';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  onToggleMobileSidebar?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  onToggleMobileSidebar,
  activeTab,
  setActiveTab
}) => {
  const {
    currentUser,
    role,
    courses,
    selectedCourse,
    setSelectedCourse,
    activeSemester,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    isAuthenticated,
    logout,
    openAuthModal,
    viewMode,
    openCreateCourseModal
  } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showCourseMenu, setShowCourseMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleSidebar = onToggleMobileMenu || onToggleMobileSidebar;

  const roleLabels: Record<UserRole, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    STUDENT: {
      label: 'Student',
      bg: 'bg-teal-50 border-teal-200',
      text: 'text-teal-800',
      icon: <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
    },
    TEACHER: {
      label: 'Teacher / Faculty',
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: <UserCheck className="w-3.5 h-3.5 text-blue-700" />
    },
    ADMIN: {
      label: 'University Admin',
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: <Shield className="w-3.5 h-3.5 text-amber-700" />
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            {toggleSidebar && viewMode === 'dashboard' && (
              <button
                id="sidebar-toggle-mobile-btn"
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-xl text-[#5B6B7C] hover:text-[#0F172A] hover:bg-[#EEF3F7] transition"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Brand Logo & Name */}
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => {
                if (setActiveTab) {
                  if (role === 'STUDENT') setActiveTab('student-dashboard');
                  else if (role === 'TEACHER') setActiveTab('teacher-dashboard');
                  else if (role === 'ADMIN') setActiveTab('admin-dashboard');
                }
              }}
              title="EduFlip Dashboard"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg text-[#1E3A5F] tracking-tight block leading-tight">
                  EduFlip
                </span>
                <span className="text-[10px] text-[#5B6B7C] font-medium hidden sm:block">
                  Flipped Classroom Platform
                </span>
              </div>
            </div>

            {/* Course Selector Dropdown (When on Dashboard) */}
            {viewMode === 'dashboard' && (
              <div className="flex items-center gap-2 ml-2 sm:ml-4">
                <div className="relative hidden md:block">
                  <button
                    id="course-selector-btn"
                    onClick={() => setShowCourseMenu(!showCourseMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F7F9FB] hover:bg-[#EEF3F7] text-xs font-medium text-[#1E3A5F] transition"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>{selectedCourse?.code || 'Select Course'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#5B6B7C]" />
                  </button>

                  {showCourseMenu && (
                    <div className="absolute left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-2 z-50 animate-in fade-in slide-in-from-top-1">
                      <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                        <span className="text-[10px] font-bold text-[#5B6B7C] uppercase tracking-wider">
                          {activeSemester ? `${activeSemester} Courses` : 'Active Curriculum Courses'} ({courses.length})
                        </span>
                        {(role === 'TEACHER' || role === 'ADMIN') && (
                          <button
                            onClick={() => {
                              setShowCourseMenu(false);
                              openCreateCourseModal();
                            }}
                            className="text-[11px] font-semibold text-[#0F766E] hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> New
                          </button>
                        )}
                      </div>
                      {courses.length === 0 ? (
                        <div className="px-4 py-4 text-center">
                          <p className="text-xs text-[#5B6B7C] mb-2">No courses found for {activeSemester || 'this semester'}.</p>
                          {(role === 'TEACHER' || role === 'ADMIN') && (
                            <button
                              onClick={() => {
                                setShowCourseMenu(false);
                                openCreateCourseModal();
                              }}
                              className="px-3 py-1.5 bg-[#0F766E] text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-[#0B5F59] transition"
                            >
                              + Create {activeSemester || ''} Course
                            </button>
                          )}
                        </div>
                      ) : (
                        courses.map((course) => (
                          <button
                            key={course.courseId}
                            onClick={() => {
                              setSelectedCourse(course);
                              setShowCourseMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-[#EEF3F7] transition ${
                              selectedCourse?.courseId === course.courseId
                                ? 'bg-teal-50/70 font-semibold text-[#0F766E]'
                                : 'text-[#0F172A]'
                            }`}
                          >
                            <div>
                              <div className="font-medium">{course.code}: {course.title}</div>
                              <div className="text-[10px] text-[#5B6B7C]">
                                {course.semester} · {course.credits} Credits · {course.teacherName}
                              </div>
                            </div>
                            {selectedCourse?.courseId === course.courseId && (
                              <Check className="w-4 h-4 text-[#0F766E]" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {activeSemester && (
                  <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0F766E] border border-teal-200">
                    <Sparkles className="w-3 h-3 text-[#0F766E]" />
                    {activeSemester}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Verified Role Badge (Locked / Read-Only in Dashboard) */}
            {viewMode === 'dashboard' && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7F9FB] border border-[#E2E8F0]">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold border ${roleLabels[role].bg} ${roleLabels[role].text}`}>
                  {roleLabels[role].icon}
                  <span>{roleLabels[role].label}</span>
                </span>
                {currentUser?.department && (
                  <span className="text-xs text-[#5B6B7C] font-medium hidden xl:inline border-l border-slate-200 pl-2">
                    {currentUser.department}
                  </span>
                )}
              </div>
            )}

            {/* If Not Authenticated: Show Sign In & Sign Up buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('signin')}
                  className="px-3.5 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-[#EEF3F7] text-xs font-bold text-[#1E3A5F] transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F59] text-white text-xs font-bold shadow-xs transition"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    id="notifications-btn"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-xl text-[#5B6B7C] hover:text-[#0F172A] hover:bg-[#EEF3F7] transition"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-[#0F766E] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadNotificationCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Popover */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] mb-2">
                        <div className="font-bold text-xs text-[#1E3A5F]">
                          Notifications ({notifications.length})
                        </div>
                        {unreadNotificationCount > 0 && (
                          <button
                            onClick={markAllNotificationsRead}
                            className="text-[11px] text-[#0F766E] hover:underline font-semibold"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-100">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => markNotificationRead(notif.id)}
                            className={`p-2.5 rounded-xl text-xs cursor-pointer transition ${
                              notif.isRead ? 'bg-transparent text-[#5B6B7C]' : 'bg-[#D6F2EE]/40 text-[#0F172A]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-semibold text-[#1E3A5F] flex items-center gap-1.5">
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-[#0F766E] inline-block" />
                                )}
                                {notif.title}
                              </div>
                              <span className="text-[10px] text-[#5B6B7C] whitespace-nowrap">
                                Just now
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#5B6B7C] leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Pill & Dropdown */}
                <div className="relative">
                  <button
                    id="user-profile-menu-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#EEF3F7] transition"
                  >
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-[#0F766E] font-bold text-xs flex items-center justify-center border border-teal-200">
                      {currentUser?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="text-left hidden md:block">
                      <div className="text-xs font-bold text-[#0F172A] leading-tight">
                        {currentUser?.fullName || 'User'}
                      </div>
                      <div className="text-[10px] text-[#5B6B7C]">
                        {roleLabels[role].label}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#5B6B7C] hidden md:block" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-2.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                      <div className="px-3 py-2 border-b border-[#E2E8F0] mb-1">
                        <div className="font-bold text-[#1E3A5F]">{currentUser?.fullName}</div>
                        <div className="text-[11px] text-[#5B6B7C] truncate">{currentUser?.email}</div>
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                          {roleLabels[role].icon}
                          <span>{roleLabels[role].label}</span>
                        </div>
                      </div>

                      <div className="py-1 space-y-0.5">
                        <button
                          onClick={() => {
                            if (setActiveTab) {
                              setActiveTab(
                                role === 'STUDENT'
                                  ? 'student-dashboard'
                                  : role === 'TEACHER'
                                  ? 'teacher-dashboard'
                                  : 'admin-dashboard'
                              );
                            }
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#EEF3F7] text-[#0F172A] flex items-center gap-2"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>My Dashboard</span>
                        </button>
                      </div>

                      {/* Account Identity Details (Role is locked) */}
                      <div className="pt-2 border-t border-[#E2E8F0] px-3 py-2 bg-[#F7F9FB] rounded-xl my-1 text-[11px] space-y-1 text-[#5B6B7C]">
                        <div className="flex justify-between">
                          <span>Role:</span>
                          <strong className="text-[#1E3A5F]">{roleLabels[role].label}</strong>
                        </div>
                        {currentUser?.studentId && (
                          <div className="flex justify-between">
                            <span>Student ID:</span>
                            <span className="font-mono font-medium text-[#1E3A5F]">{currentUser.studentId}</span>
                          </div>
                        )}
                        {currentUser?.designation && (
                          <div className="flex justify-between">
                            <span>Designation:</span>
                            <span className="font-medium text-[#1E3A5F]">{currentUser.designation}</span>
                          </div>
                        )}
                        {currentUser?.department && (
                          <div className="flex justify-between">
                            <span>Department:</span>
                            <span className="font-medium text-[#1E3A5F]">{currentUser.department}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-[#5B6B7C] pt-1 leading-tight">
                          Role is bound to this account. To access another role, sign out and log in with that role&apos;s account.
                        </p>
                      </div>

                      {/* Explicit Log Out Button */}
                      <div className="pt-2 mt-1 border-t border-[#E2E8F0]">
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          <span>Sign Out / Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
