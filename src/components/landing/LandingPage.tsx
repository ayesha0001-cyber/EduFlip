import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Video,
  FileCheck2,
  CalendarDays,
  Award,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  PlayCircle,
  Clock,
  Layers,
  ChevronRight,
  School
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const {
    isAuthenticated,
    currentUser,
    setViewMode,
    openAuthModal,
    switchUserRole
  } = useAuth();

  const handleLaunchRole = (role: UserRole) => {
    switchUserRole(role);
    setViewMode('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col text-[#0F172A] font-sans">
      {/* Landing Navigation */}
      <nav className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-[#1E3A5F] tracking-tight block leading-tight">
                EduFlip
              </span>
              <span className="text-[11px] text-[#5B6B7C] font-medium hidden sm:block">
                Flipped Classroom Blended Learning Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#5B6B7C] hidden sm:inline">
                  Logged in as <strong className="text-[#1E3A5F]">{currentUser.fullName}</strong> ({currentUser.role})
                </span>
                <button
                  onClick={() => setViewMode('dashboard')}
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('signin')}
                  className="px-4 py-2 border border-[#E2E8F0] hover:bg-[#EEF3F7] text-[#1E3A5F] text-xs font-bold rounded-xl transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-[#EEF3F7]/70 via-white to-[#F7F9FB] border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-50 text-[#0F766E] border border-teal-200">
            <Sparkles className="w-4 h-4 text-[#0F766E]" />
            <span>3-Phase Flipped Classroom & Blended Learning Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1E3A5F] tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Learn Asynchronously. <br />
            <span className="text-[#0F766E]">Master Actively</span> in the Classroom.
          </h1>

          <p className="text-sm sm:text-base text-[#5B6B7C] max-w-2xl mx-auto leading-relaxed">
            EduFlip bridges pre-class multimedia study with high-impact physical lab collaboration,
            multi-criteria rubric grading, and real-time normalized learning gain analytics.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openAuthModal('signup', 'STUDENT')}
              className="px-6 py-3 bg-[#0F766E] hover:bg-[#0B5F59] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <span>Student Sign Up</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => openAuthModal('signup', 'TEACHER')}
              className="px-6 py-3 bg-[#1E3A5F] hover:bg-[#152842] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Teacher / Faculty Registration</span>
            </button>

            <button
              onClick={() => openAuthModal('signin')}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-[#1E3A5F] border border-[#E2E8F0] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition"
            >
              Sign In to Account
            </button>
          </div>

          {/* Quick Demo Launch Cards */}
          <div className="pt-10 max-w-4xl mx-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-[#5B6B7C] mb-4">
              Or Explore Instantly with Pre-Configured Personas:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div
                onClick={() => handleLaunchRole('STUDENT')}
                className="bg-white p-5 rounded-2xl border border-teal-200 shadow-xs hover:shadow-md hover:border-teal-400 transition cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E3A5F]">Student Workspace</h3>
                  <ChevronRight className="w-4 h-4 text-[#0F766E] group-hover:translate-x-1 transition" />
                </div>
                <p className="text-xs text-[#5B6B7C] mt-1">
                  Experience pre-class video lectures, interactive readiness quiz, attendance history, and submissions.
                </p>
                <div className="mt-3 text-[11px] font-semibold text-[#0F766E]">
                  Enter as Ayesha Rahman →
                </div>
              </div>

              <div
                onClick={() => handleLaunchRole('TEACHER')}
                className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs hover:shadow-md hover:border-blue-400 transition cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A5F] flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E3A5F]">Faculty Workspace</h3>
                  <ChevronRight className="w-4 h-4 text-[#1E3A5F] group-hover:translate-x-1 transition" />
                </div>
                <p className="text-xs text-[#5B6B7C] mt-1">
                  Inspect student preparation matrices, schedule in-person labs, take roll-call attendance, and score rubrics.
                </p>
                <div className="mt-3 text-[11px] font-semibold text-[#1E3A5F]">
                  Enter as Prof. Tariq →
                </div>
              </div>

              <div
                onClick={() => handleLaunchRole('ADMIN')}
                className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs hover:shadow-md hover:border-amber-400 transition cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E3A5F]">Admin Workspace</h3>
                  <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-xs text-[#5B6B7C] mt-1">
                  Manage university departments, faculty assignments, student enrollment accounts, and system health.
                </p>
                <div className="mt-3 text-[11px] font-semibold text-amber-700">
                  Enter as Dr. Ayesha →
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Phase Flipped Pedagogy Explained */}
      <section className="py-16 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              The Pedagogical Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] mt-3">
              How the 3-Phase Flipped Classroom Works
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6B7C] mt-2">
              Unlike traditional passive lecturing, EduFlip shifts foundational knowledge transfer before class,
              maximizing face-to-face time for hands-on application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phase 1 */}
            <div className="bg-[#F7F9FB] rounded-2xl p-6 border border-[#E2E8F0] space-y-4 hover:border-teal-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
                  Phase 1: Before Class
                </span>
                <span className="text-xs font-mono font-bold text-[#5B6B7C]">01 / 03</span>
              </div>
              <h3 className="text-base font-bold text-[#1E3A5F]">
                Asynchronous Self-Study & Diagnostic Check
              </h3>
              <p className="text-xs text-[#5B6B7C] leading-relaxed">
                Students watch micro-lectures with embedded playback telemetry (requiring ≥90% completion) and take diagnostic pre-class readiness quizzes.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-[#1E3A5F]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  <span>Video Progress Tracking & Notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  <span>Immediate Diagnostic Quiz Feedback</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  <span>Readiness Threshold Certification</span>
                </li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="bg-[#F7F9FB] rounded-2xl p-6 border border-[#E2E8F0] space-y-4 hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-[#1E3A5F] border border-blue-200">
                  Phase 2: During Class
                </span>
                <span className="text-xs font-mono font-bold text-[#5B6B7C]">02 / 03</span>
              </div>
              <h3 className="text-base font-bold text-[#1E3A5F]">
                Active In-Person Laboratory & Sprints
              </h3>
              <p className="text-xs text-[#5B6B7C] leading-relaxed">
                Physical class time is devoted to group problem solving, system architecture diagrams, viva evaluations, and real-time attendance roll call.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-[#1E3A5F]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1E3A5F]" />
                  <span>4-State Attendance Roster</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1E3A5F]" />
                  <span>Teacher Preparation Matrix</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1E3A5F]" />
                  <span>Hands-on Physical Lab Exercises</span>
                </li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="bg-[#F7F9FB] rounded-2xl p-6 border border-[#E2E8F0] space-y-4 hover:border-amber-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Phase 3: After Class
                </span>
                <span className="text-xs font-mono font-bold text-[#5B6B7C]">03 / 03</span>
              </div>
              <h3 className="text-base font-bold text-[#1E3A5F]">
                Mastery Evaluation & Rubric Feedback
              </h3>
              <p className="text-xs text-[#5B6B7C] leading-relaxed">
                Students submit project assignments, receive criteria-based rubric scoring and threaded professor commentary, and complete post-class mastery quizzes.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-[#1E3A5F]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  <span>Dynamic Rubric Scoring Sliders</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  <span>Threaded Instructor Discussions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  <span>Normalized Learning Gain Charts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics & Normalized Gain Highlight */}
      <section className="py-16 bg-[#EEF3F7]/50 border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A5F]">
              Demonstrated Empirical Outcomes
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] mt-2">
              Measurable Academic Gains
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="text-3xl font-extrabold text-[#0F766E]">+33.8%</div>
              <div className="text-xs font-medium text-[#5B6B7C] mt-1">Normalized Gain (Hake's g)</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="text-3xl font-extrabold text-[#1E3A5F]">94.2%</div>
              <div className="text-xs font-medium text-[#5B6B7C] mt-1">Lab Attendance Rate</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="text-3xl font-extrabold text-[#0F766E]">88.5%</div>
              <div className="text-xs font-medium text-[#5B6B7C] mt-1">Pre-Class Video Completion</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="text-3xl font-extrabold text-[#1E3A5F]">100%</div>
              <div className="text-xs font-medium text-[#5B6B7C] mt-1">Rubric-Aligned Feedback</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-[#5B6B7C] space-y-2">
          <div className="flex items-center justify-center gap-2 text-[#1E3A5F] font-bold">
            <GraduationCap className="w-4 h-4 text-[#0F766E]" />
            <span>EduFlip Academic Blended Learning Management</span>
          </div>
          <p>
            Designed for Higher Education Institutions · University of Frontier Technology & Business
          </p>
        </div>
      </footer>
    </div>
  );
};
