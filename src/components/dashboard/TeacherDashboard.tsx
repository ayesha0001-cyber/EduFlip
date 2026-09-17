import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Users,
  Video,
  FileCheck2,
  Calendar,
  Clock,
  ArrowRight,
  AlertTriangle,
  UserCheck2,
  Send,
  CheckCircle2,
  TrendingUp,
  FileText,
  BookOpen,
  Plus,
  BarChart3
} from 'lucide-react';
import { getCourseReadiness, getPhysicalClasses } from '../../services/dataService';
import type { StudentReadiness, PhysicalClass } from '../../types';

interface TeacherDashboardProps {
  onNavigate: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const { currentUser, selectedCourse, addToast, openCreateCourseModal, role } = useAuth();
  const [readinessList, setReadinessList] = useState<StudentReadiness[]>([]);
  const [upcomingClass, setUpcomingClass] = useState<PhysicalClass | null>(null);

  useEffect(() => {
    if (selectedCourse) {
      getCourseReadiness(selectedCourse.courseId).then(setReadinessList);
      getPhysicalClasses(selectedCourse.courseId).then((cls) => {
        if (cls.length > 0) setUpcomingClass(cls[0]);
        else setUpcomingClass(null);
      });
    }
  }, [selectedCourse]);

  if (!selectedCourse) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-xs text-center animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#1E3A5F] mb-1">No Courses Assigned</h2>
        <p className="text-xs text-[#5B6B7C] max-w-md mx-auto mb-4">
          You currently have no active courses configured in the system. Create your first course to begin scheduling flipped lectures, diagnostics, and in-person sessions.
        </p>
        {(role === 'TEACHER' || role === 'ADMIN') && (
          <button
            onClick={openCreateCourseModal}
            className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create First Course
          </button>
        )}
      </div>
    );
  }

  const readyCount = readinessList.filter((r) => r.status === 'READY').length;
  const partiallyReadyCount = readinessList.filter((r) => r.status === 'PARTIALLY_READY').length;
  const notReadyCount = readinessList.filter((r) => r.status === 'NOT_READY').length;
  const total = Math.max(readinessList.length, 1);

  const handleSendReminder = (studentName: string) => {
    addToast(`Pre-class study reminder sent to ${studentName}!`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Teacher Welcome & Fast Action Strip */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0F766E] rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-semibold backdrop-blur-xs mb-3">
            <UserCheck2 className="w-3.5 h-3.5 text-teal-300" />
            Instructor Portal · Flipped Classroom Orchestrator
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Welcome back, {currentUser?.fullName || 'Faculty Instructor'}!
          </h1>
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed mb-5">
            Active course: <span className="text-white font-semibold">{selectedCourse.code}: {selectedCourse.title}</span>.
            {upcomingClass
              ? ` Upcoming session scheduled on ${upcomingClass.classDate} (${upcomingClass.startTime} - ${upcomingClass.endTime}) in ${upcomingClass.room}.`
              : ' No in-person sessions currently scheduled.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="teacher-hero-attendance-btn"
              onClick={() => onNavigate('physical-classes')}
              className="px-4 py-2 bg-white text-[#1E3A5F] hover:bg-[#EEF3F7] rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-[#0F766E]" />
              Manage Classroom Sessions
            </button>
            <button
              id="teacher-hero-readiness-btn"
              onClick={() => onNavigate('readiness')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition flex items-center gap-2 border border-white/20"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Student Readiness Matrix
            </button>
            <button
              id="teacher-hero-grade-btn"
              onClick={() => onNavigate('grading')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition flex items-center gap-2 border border-white/20"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-300" />
              Grading Workspace
            </button>
            <button
              id="teacher-hero-analytics-btn"
              onClick={() => onNavigate('analytics')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition flex items-center gap-2 border border-white/20"
            >
              <BarChart3 className="w-4 h-4 text-teal-200" />
              Cohort Analytics & Roster
            </button>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl" />
      </div>

      {/* Preparation Status at-a-glance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Preparation Health Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0F766E]" />
                Student Pre-Class Preparation Status ({selectedCourse.code})
              </h2>
              <p className="text-[11px] text-[#5B6B7C]">
                Telemetry aggregated from video lecture telemetry and pre-class diagnostic quizzes.
              </p>
            </div>
            <button
              onClick={() => onNavigate('readiness')}
              className="text-xs font-semibold text-[#0F766E] hover:underline"
            >
              Full Matrix →
            </button>
          </div>

          {readinessList.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#E2E8F0] rounded-xl text-xs text-[#5B6B7C]">
              No student accounts enrolled in this course yet. Once students sign in or are registered, their real-time telemetry will appear here.
            </div>
          ) : (
            <>
              {/* Progress Breakdown Bar */}
              <div className="mb-4">
                <div className="h-3.5 w-full bg-[#EEF3F7] rounded-full overflow-hidden flex">
                  <div
                    className="bg-[#16A34A] h-full transition-all duration-500"
                    style={{ width: `${(readyCount / total) * 100}%` }}
                    title={`Ready: ${readyCount} students`}
                  />
                  <div
                    className="bg-[#D97706] h-full transition-all duration-500"
                    style={{ width: `${(partiallyReadyCount / total) * 100}%` }}
                    title={`Partially Ready: ${partiallyReadyCount} students`}
                  />
                  <div
                    className="bg-[#DC2626] h-full transition-all duration-500"
                    style={{ width: `${(notReadyCount / total) * 100}%` }}
                    title={`Not Ready: ${notReadyCount} students`}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#16A34A]" />
                    <span className="font-medium text-[#0F172A]">Ready: {readyCount} ({Math.round((readyCount / total) * 100)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#D97706]" />
                    <span className="font-medium text-[#0F172A]">Partially Ready: {partiallyReadyCount} ({Math.round((partiallyReadyCount / total) * 100)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#DC2626]" />
                    <span className="font-medium text-[#0F172A]">Not Ready: {notReadyCount} ({Math.round((notReadyCount / total) * 100)}%)</span>
                  </div>
                </div>
              </div>

              {/* Quick Roster Snippet */}
              <div className="divide-y divide-slate-100 border-t border-[#E2E8F0] pt-3">
                {readinessList.slice(0, 4).map((student) => (
                  <div key={student.studentId} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-teal-50 text-[#0F766E] font-semibold flex items-center justify-center text-xs">
                        {student.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-[#0F172A]">{student.studentName}</div>
                        <div className="text-[11px] text-[#5B6B7C]">Roll: {student.rollNo}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <div className="text-[11px] text-[#5B6B7C]">Video: {student.videoCompletionPct}% · Quiz: {student.preQuizScorePct}%</div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          student.status === 'READY'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : student.status === 'PARTIALLY_READY'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {student.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* At-Risk Students & Reminder Tool */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#1E3A5F]">
                  At-Risk Students
                </h3>
                <span className="text-[11px] text-[#5B6B7C]">
                  Missing pre-class video or diagnostic quiz
                </span>
              </div>
            </div>

            {readinessList.filter((r) => r.status === 'NOT_READY' || r.status === 'PARTIALLY_READY').length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[#E2E8F0] rounded-xl text-xs text-emerald-700 bg-emerald-50/50 mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                All active students are prepared for the upcoming session!
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {readinessList
                  .filter((r) => r.status === 'NOT_READY' || r.status === 'PARTIALLY_READY')
                  .slice(0, 4)
                  .map((student) => (
                    <div
                      key={student.studentId}
                      className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F7F9FB] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#0F172A]">{student.studentName}</div>
                        <div className="text-[10px] text-rose-600 font-medium">
                          Video: {student.videoCompletionPct}% · Quiz: {student.preQuizScorePct}%
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendReminder(student.studentName)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] hover:bg-teal-50 hover:text-[#0F766E] text-[11px] font-medium transition flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Remind
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const unready = readinessList.filter((r) => r.status === 'NOT_READY');
              unready.forEach((s) => handleSendReminder(s.studentName));
              addToast(`Bulk reminders sent to ${unready.length} unready students`, 'success');
            }}
            className="w-full py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold transition"
          >
            Send Reminder to All Unready ({notReadyCount})
          </button>
        </div>
      </div>

      {/* Quick Access to Key Instructor Workflows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('course-modules')}
          className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-teal-300 hover:shadow-xs transition text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <Video className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-[#1E3A5F] mb-1">
            Course Modules & Lectures
          </div>
          <p className="text-[11px] text-[#5B6B7C]">
            Add learning videos, slides, and syllabus topics.
          </p>
        </button>

        <button
          onClick={() => onNavigate('pre-quiz')}
          className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-teal-300 hover:shadow-xs transition text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-[#1E3A5F] mb-1">
            Pre-Class Diagnostic Quiz
          </div>
          <p className="text-[11px] text-[#5B6B7C]">
            Configure MCQs, marks, and readiness thresholds.
          </p>
        </button>

        <button
          onClick={() => onNavigate('physical-classes')}
          className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-teal-300 hover:shadow-xs transition text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <UserCheck2 className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-[#1E3A5F] mb-1">
            Mark Session Attendance
          </div>
          <p className="text-[11px] text-[#5B6B7C]">
            Take attendance and log absent/late students.
          </p>
        </button>

        <button
          onClick={() => onNavigate('grading')}
          className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-teal-300 hover:shadow-xs transition text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-[#1E3A5F] mb-1">
            Grade Submissions
          </div>
          <p className="text-[11px] text-[#5B6B7C]">
            Evaluate assignments with multi-criteria rubrics.
          </p>
        </button>
      </div>
    </div>
  );
};
