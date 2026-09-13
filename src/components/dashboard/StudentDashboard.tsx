import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  PlayCircle,
  FileCheck2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Award,
  AlertCircle,
  FileText,
  MapPin,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Plus
} from 'lucide-react';
import {
  getPhysicalClasses,
  getStudentAttendance,
  getAssignments,
  getSubmissions,
  getFeedback,
  getVideoLectures,
  getVideoProgress,
  getQuizzes,
  getStudentQuizAttempts
} from '../../services/dataService';
import type { PhysicalClass, Submission, FeedbackMessage, VideoLecture, Quiz } from '../../types';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { currentUser, selectedCourse, courses, openCreateCourseModal, role } = useAuth();

  const [upcomingClass, setUpcomingClass] = useState<PhysicalClass | null>(null);
  const [attendancePct, setAttendancePct] = useState<number>(100);
  const [attendanceCount, setAttendanceCount] = useState({ present: 0, total: 0 });

  const [recentGradedSub, setRecentGradedSub] = useState<Submission | null>(null);
  const [latestFeedback, setLatestFeedback] = useState<FeedbackMessage | null>(null);

  const [videoPct, setVideoPct] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [hasVideos, setHasVideos] = useState<boolean>(false);
  const [hasQuiz, setHasQuiz] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedCourse || !currentUser) return;

    // 1. Next In-Person Session
    getPhysicalClasses(selectedCourse.courseId).then((classes) => {
      if (classes.length > 0) {
        setUpcomingClass(classes[0]);
      } else {
        setUpcomingClass(null);
      }
    });

    // 2. Attendance
    getStudentAttendance(currentUser.userId, selectedCourse.courseId).then((res) => {
      setAttendancePct(res.percentage);
      setAttendanceCount({ present: res.presentCount, total: res.totalSessions });
    });

    // 3. Graded Submissions & Feedback
    getAssignments(selectedCourse.courseId).then(async (assigns) => {
      for (const a of assigns) {
        const subs = await getSubmissions(a.assignmentId);
        const myGraded = subs.find((s) => s.studentId === currentUser.userId && s.status === 'GRADED');
        if (myGraded) {
          setRecentGradedSub(myGraded);
          const fbs = await getFeedback(myGraded.submissionId);
          if (fbs.length > 0) {
            setLatestFeedback(fbs[fbs.length - 1]);
          }
          break;
        }
      }
    });

    // 4. Video & Quiz Progress
    getVideoLectures(selectedCourse.courseId).then(async (videos) => {
      setHasVideos(videos.length > 0);
      if (videos.length > 0) {
        let total = 0;
        for (const v of videos) {
          const prog = await getVideoProgress(currentUser.userId, v.videoId);
          if (prog) total += prog.percent;
        }
        setVideoPct(Math.round(total / videos.length));
      } else {
        setVideoPct(0);
      }
    });

    getQuizzes(selectedCourse.courseId).then(async (quizzes) => {
      const preQuiz = quizzes.find((q) => q.type === 'PRE');
      setHasQuiz(!!preQuiz);
      if (preQuiz) {
        const attempts = await getStudentQuizAttempts(currentUser.userId, selectedCourse.courseId);
        const attempt = attempts.find((att) => att.quizId === preQuiz.quizId);
        if (attempt) setQuizScore(attempt.percentage);
        else setQuizScore(null);
      } else {
        setQuizScore(null);
      }
    });
  }, [selectedCourse, currentUser]);

  if (!selectedCourse) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-xs text-center animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#1E3A5F] mb-1">No Active Courses Found</h2>
        <p className="text-xs text-[#5B6B7C] max-w-md mx-auto mb-4">
          There are currently no courses registered in the system. Teachers or administrators can create a new course to get started.
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

  const isReady = videoPct >= 80 && (quizScore === null || quizScore >= 60);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F766E] to-[#1E3A5F] rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-semibold backdrop-blur-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Flipped Classroom · Active Learning Mode
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Welcome back, {currentUser?.fullName || 'Student'}!
          </h1>
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed mb-5">
            You are enrolled in <span className="text-white font-semibold">{selectedCourse.code}: {selectedCourse.title}</span>. Complete your pre-class video and readiness quiz before attending upcoming physical classroom sessions.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="student-hero-watch-btn"
              onClick={() => onNavigate('course-modules')}
              className="px-4 py-2 bg-white text-[#0F766E] hover:bg-[#EEF3F7] rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Watch Pre-Class Lecture
            </button>
            <button
              id="student-hero-prequiz-btn"
              onClick={() => onNavigate('pre-quiz')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition flex items-center gap-2 border border-white/20"
            >
              <FileCheck2 className="w-4 h-4 text-amber-300" />
              Take Readiness Quiz
            </button>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl" />
      </div>

      {/* Flipped Classroom 3-Stage Stepper Overview */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0F766E]" />
            Your Flipped Classroom Progress ({selectedCourse.code})
          </h2>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              isReady
                ? 'text-[#0F766E] bg-teal-50 border-teal-200'
                : 'text-amber-800 bg-amber-50 border-amber-200'
            }`}
          >
            Readiness: {isReady ? 'Ready for Class' : 'Preparation in Progress'} ({videoPct}%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1: Before Class */}
          <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider">
                Phase 1: Before Class
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                {videoPct >= 80 ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-teal-600" /> Done
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-teal-600" /> In Progress
                  </>
                )}
              </span>
            </div>
            <div className="font-semibold text-xs text-[#0F172A] mb-1">
              Online Lecture & Pre-Quiz
            </div>
            <p className="text-[11px] text-[#5B6B7C] mb-3">
              {hasVideos
                ? `Video watch progress: ${videoPct}%. `
                : 'No pre-class videos uploaded yet by instructor. '}
              {hasQuiz
                ? quizScore !== null
                  ? `Quiz score: ${quizScore}%.`
                  : 'Diagnostic quiz pending.'
                : ''}
            </p>
            <button
              onClick={() => onNavigate('course-modules')}
              className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center gap-1"
            >
              Study Materials <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step 2: During Class */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                Phase 2: During Class
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3 text-blue-600" /> Upcoming
              </span>
            </div>
            <div className="font-semibold text-xs text-[#0F172A] mb-1">
              Physical Lab & Interactive Sprint
            </div>
            <p className="text-[11px] text-[#5B6B7C] mb-3">
              {upcomingClass
                ? `${upcomingClass.topic} in ${upcomingClass.room}`
                : 'No scheduled sessions currently. Check with your instructor.'}
            </p>
            <button
              onClick={() => onNavigate('physical-classes')}
              className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
            >
              Session Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step 3: After Class */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                Phase 3: After Class
              </span>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {recentGradedSub ? 'Evaluated' : 'Submissions'}
              </span>
            </div>
            <div className="font-semibold text-xs text-[#0F172A] mb-1">
              Assignments & Post-Quiz
            </div>
            <p className="text-[11px] text-[#5B6B7C] mb-3">
              {recentGradedSub
                ? `Graded: ${recentGradedSub.marksObtained} marks (${recentGradedSub.letterGrade || 'Graded'})`
                : 'Submit assignment deliverables and review teacher feedback.'}
            </p>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
            >
              Assignment Workspace <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Key Info: Next Session + Teacher Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Scheduled Physical Class Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#1E3A5F]">
                  Upcoming In-Person Classroom Session
                </h3>
                <span className="text-[11px] text-[#5B6B7C]">
                  {upcomingClass ? `${upcomingClass.classDate} · ${upcomingClass.startTime} - ${upcomingClass.endTime}` : 'No upcoming session scheduled'}
                </span>
              </div>
            </div>
            {upcomingClass && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Scheduled
              </span>
            )}
          </div>

          {upcomingClass ? (
            <div className="p-4 rounded-xl bg-[#F7F9FB] border border-[#E2E8F0] space-y-2 mb-4">
              <div className="font-semibold text-xs text-[#0F172A]">
                {upcomingClass.topic}
              </div>
              <div className="flex items-center gap-4 text-xs text-[#5B6B7C]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>{upcomingClass.room}</span>
                </div>
              </div>
              {upcomingClass.agenda && (
                <div className="pt-2 border-t border-[#E2E8F0] text-xs text-[#5B6B7C]">
                  <span className="font-semibold text-[#1E3A5F]">Agenda: </span>
                  {upcomingClass.agenda}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-[#E2E8F0] rounded-xl text-xs text-[#5B6B7C] mb-4">
              Your instructor has not scheduled an in-person session for this course yet.
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-[#5B6B7C]">
              Your Attendance Record: <span className="font-semibold text-[#0F766E]">{attendancePct}% ({attendanceCount.present} of {attendanceCount.total} sessions)</span>
            </div>
            <button
              onClick={() => onNavigate('physical-classes')}
              className="text-xs font-semibold text-[#0F766E] hover:underline"
            >
              View Attendance Sheet →
            </button>
          </div>
        </div>

        {/* Recent Teacher Feedback Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#1E3A5F]">
                  Teacher Feedback & Grade
                </h3>
                <span className="text-[11px] text-[#5B6B7C]">
                  {selectedCourse.code}
                </span>
              </div>
            </div>

            {recentGradedSub ? (
              <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200 mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#1E3A5F]">{recentGradedSub.gradedBy || 'Instructor'}</span>
                  <span className="text-[11px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                    {recentGradedSub.marksObtained} Marks ({recentGradedSub.letterGrade || 'Graded'})
                  </span>
                </div>
                <p className="text-[11px] text-[#5B6B7C] italic leading-relaxed">
                  "{recentGradedSub.generalFeedback || latestFeedback?.message || 'Good submission!'}"
                </p>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-[#E2E8F0] rounded-xl text-xs text-[#5B6B7C] mb-3">
                No graded assignments yet. When your instructor reviews your work, grades and feedback will show here.
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('assignments')}
            className="w-full py-2 bg-[#EEF3F7] hover:bg-[#E2E8F0] text-[#1E3A5F] rounded-xl text-xs font-semibold transition text-center"
          >
            Go to Assignments
          </button>
        </div>
      </div>
    </div>
  );
};
