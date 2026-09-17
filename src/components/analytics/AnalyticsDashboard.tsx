import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Award,
  Video,
  UserCheck2,
  Calendar,
  Download,
  Filter,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  FileText,
  Search,
  BookOpen,
  FolderDown,
  Clock,
  RefreshCw,
  HelpCircle,
  BarChart2,
  GraduationCap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  getCourseCohortAnalytics,
  getStudentComprehensiveProgress
} from '../../services/dataService';

export const AnalyticsDashboard: React.FC = () => {
  const { selectedCourse, role, currentUser, addToast } = useAuth();

  // Cohort Analytics State (Teacher & Admin)
  const [cohortData, setCohortData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'HIGH' | 'LOW'>('ALL');

  // Student Individual Progress State (Student)
  const [studentProgress, setStudentProgress] = useState<any>(null);

  const fetchAnalytics = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      if (role === 'STUDENT' && currentUser) {
        const prog = await getStudentComprehensiveProgress(currentUser.userId, selectedCourse.courseId);

        setStudentProgress({
          attendance: {
            percentage: prog.attendancePercentage,
            present: prog.attendedClasses,
            total: prog.totalClasses
          },
          videoWatchRate: prog.avgVideoWatchPct,
          materialsDownloaded: prog.totalMaterials > 0 && prog.materialsOpenedCount >= prog.totalMaterials,
          preQuizScore: null, // service doesn't currently split PRE vs POST attempts
          postQuizScore: null,
          assignments: {
            submitted: prog.assignmentsSubmittedCount,
            totalGiven: prog.totalAssignments
          },
          readinessScore: Math.round(
            (prog.attendancePercentage + prog.avgVideoWatchPct + prog.avgQuizScorePct) / 3
          )
        });
      } else {
        const cohort = await getCourseCohortAnalytics(selectedCourse.courseId);

        setCohortData({
          avgAttendancePct: cohort.avgAttendanceRate,
          avgVideoWatchPct: cohort.avgVideoWatchRate,
          materialsEngagementPct: cohort.materialEngagementRate,
          avgSubmissionPct: cohort.assignmentSubmissionRate,
          totalAssignments: cohort.students[0]?.totalAssignments || 0,
          moduleGains: [], // not computed by the backend yet — chart will render empty
          weeklyAttendance: cohort.weeklyAttendance.map((w) => ({
            week: w.weekLabel,
            attendance: w.complianceRate
          })),
          studentsList: cohort.students.map((s) => ({
            studentId: s.studentId,
            studentName: s.studentName,
            rollNo: s.rollNo,
            attendancePct: s.attendanceRate,
            videoWatchPct: s.avgVideoWatchPct,
            materialsDownloadedPct: s.materialsPct,
            quizAvgPct: s.avgQuizScore,
            assignmentsSubmitted: s.assignmentsSubmittedCount,
            totalAssignments: s.totalAssignments
          }))
        });
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      addToast('Failed to load analytics data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedCourse, role, currentUser]);

  if (!selectedCourse) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-xs text-center">
        <BookOpen className="w-10 h-10 text-[#0F766E] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#1E3A5F]">No Active Course Selected</h3>
        <p className="text-xs text-[#5B6B7C] mt-1">Please select an assigned course to inspect real-time flipped classroom analytics.</p>
      </div>
    );
  }

  const handleExportCSV = () => {
    if (role === 'STUDENT') {
      if (!studentProgress) return;
      const csv = `Metric,Value\n` +
        `Physical Classes Attended,${studentProgress.attendance.present} of ${studentProgress.attendance.total} (${studentProgress.attendance.percentage}%)\n` +
        `Pre-Class Video Watch Rate,${studentProgress.videoWatchRate}%\n` +
        `Materials Downloaded/Opened,${studentProgress.materialsDownloaded ? 'YES' : 'PENDING'}\n` +
        `Pre-Class Diagnostic Quiz,${studentProgress.preQuizScore !== null ? studentProgress.preQuizScore + '%' : 'Pending'}\n` +
        `Post-Class Synthesis Quiz,${studentProgress.postQuizScore !== null ? studentProgress.postQuizScore + '%' : 'Pending'}\n` +
        `Assignments Submitted,${studentProgress.assignments.submitted} of ${studentProgress.assignments.totalGiven}\n`;
      downloadBlob(csv, `${selectedCourse.code}_My_Progress.csv`);
    } else {
      if (!cohortData) return;
      const headers = 'Student Name,Roll No,Attendance (%),Video Watch Rate (%),Materials Opened/Downloaded (%),Quiz Avg (%),Assignments Submitted,Total Assignments\n';
      const rows = cohortData.studentsList
        .map(
          (s: any) =>
            `"${s.studentName}",${s.rollNo},${s.attendancePct}%,${s.videoWatchPct}%,${s.materialsDownloadedPct}%,${s.quizAvgPct}%,${s.assignmentsSubmitted},${s.totalAssignments}`
        )
        .join('\n');
      downloadBlob(headers + rows, `${selectedCourse.code}_Cohort_Analytics.csv`);
    }
    addToast('Analytics exported successfully!', 'success');
  };

  const downloadBlob = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter student list
  const filteredStudents = (cohortData?.studentsList || []).filter((st: any) => {
    const matchesSearch =
      st.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (attendanceFilter === 'HIGH') return st.attendancePct >= 75;
    if (attendanceFilter === 'LOW') return st.attendancePct < 75;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {role === 'STUDENT' ? 'Personal Learning Telemetry' : 'Real-Time Cohort Analytics'}
            </span>
            <span className="text-xs text-[#5B6B7C] font-mono">• {selectedCourse.code}: {selectedCourse.title}</span>
          </div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">
            {role === 'STUDENT' ? 'My Learning Progress & Compliance' : 'Flipped Learning Analytics & Student Readiness'}
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-2xl mt-1 leading-relaxed">
            {role === 'STUDENT'
              ? 'Real-time telemetry tracking your physical attendance, pre-class video watch completion, downloaded study materials, quiz diagnostics, and assignment submissions.'
              : 'Empirical cohort telemetry showing student physical attendance compliance across all sessions, video watch rates, materials engagement, and pre/post quiz learning gains.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 bg-white border border-[#E2E8F0] hover:bg-[#EEF3F7] rounded-xl text-xs font-semibold text-[#1E3A5F] shadow-xs transition"
            title="Refresh real-time data"
          >
            <RefreshCw className={`w-4 h-4 text-[#0F766E] ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading && !cohortData && !studentProgress ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E2E8F0] text-center text-xs text-[#5B6B7C]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0F766E] mx-auto mb-2" />
          Loading real-time classroom analytics from Firestore...
        </div>
      ) : role === 'STUDENT' && studentProgress ? (
        /* ================= STUDENT VIEW: MY LEARNING PROGRESS ================= */
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#5B6B7C]">Physical Class Attendance</span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
                  <UserCheck2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1E3A5F]">{studentProgress.attendance.percentage}%</div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#5B6B7C]">
                <span>Attended {studentProgress.attendance.present} of {studentProgress.attendance.total} sessions</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#5B6B7C]">Pre-Class Video Watch Rate</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1E3A5F]">{studentProgress.videoWatchRate}%</div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
                {studentProgress.videoWatchRate >= 80 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5 text-amber-500" />}
                <span>{studentProgress.videoWatchRate >= 80 ? 'Target ≥80% Reached' : 'Watching Required'}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#5B6B7C]">Course Materials Engagement</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <FolderDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1E3A5F]">
                {studentProgress.materialsDownloaded ? 'Downloaded' : '100% Accessed'}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Slides, PDFs & Notes Synced</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#5B6B7C]">Assignments Submitted</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1E3A5F]">
                {studentProgress.assignments.submitted} / {studentProgress.assignments.totalGiven}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#5B6B7C]">
                <span>{studentProgress.assignments.totalGiven - studentProgress.assignments.submitted === 0 ? 'All caught up' : 'Pending work remaining'}</span>
              </div>
            </div>
          </div>

          {/* Quizzes and Detailed Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#1E3A5F] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#0F766E]" />
                Quiz Results & Diagnostic Mastery
              </h3>
              <p className="text-xs text-[#5B6B7C]">
                Comparing your diagnostic entry benchmark with post-class mastery quizzes.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-[#5B6B7C]">Pre-Class Diagnostic Quiz</span>
                    <span className="text-[#0F172A]">{studentProgress.preQuizScore !== null ? `${studentProgress.preQuizScore}%` : 'Not Attempted'}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full transition-all"
                      style={{ width: `${studentProgress.preQuizScore || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-[#0F766E]">Post-Class Synthesis Quiz</span>
                    <span className="text-[#0F766E]">{studentProgress.postQuizScore !== null ? `${studentProgress.postQuizScore}%` : 'Not Attempted'}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F766E] rounded-full transition-all"
                      style={{ width: `${studentProgress.postQuizScore || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-[#1E3A5F] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                Flipped Learning Readiness Verdict
              </h3>
              <p className="text-xs text-[#5B6B7C] leading-relaxed">
                Students who achieve ≥80% video completion and take the diagnostic pre-quiz participate 2.4x more actively in classroom peer sprints.
              </p>
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 mt-3">
                <div className="text-xs font-bold text-teal-900 mb-1">
                  Readiness Score: {studentProgress.readinessScore}%
                </div>
                <p className="text-[11px] text-teal-800">
                  {studentProgress.readinessScore >= 80
                    ? 'You are fully prepared for active in-class discussions and group lab activities!'
                    : 'Watch your remaining video lectures to unlock complete preparation credit before entering class.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= TEACHER & ADMIN VIEW: COHORT ANALYTICS ================= */
        <div className="space-y-6">
          {/* Top 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#5B6B7C]">Pre-Class Video Watch Rate</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1E3A5F]">
                {cohortData?.avgVideoWatchPct ?? 0}%
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Cohort Average Telemetry</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#5B6B7C]">Materials Downloaded / Opened</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <FolderDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1E3A5F]">
                {cohortData?.materialsEngagementPct ?? 0}%
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-indigo-600 font-medium">
                <span>Lecture slides & notes engagement</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#5B6B7C]">Weekly Attendance Compliance</span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
                  <UserCheck2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1E3A5F]">
                {cohortData?.avgAttendancePct ?? 0}%
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Above 75% institutional bar</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#5B6B7C]">Assignment Submissions</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1E3A5F]">
                {cohortData?.avgSubmissionPct ?? 0}%
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#5B6B7C]">
                <span>{cohortData?.totalAssignments ?? 0} assignments active</span>
              </div>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Pre vs Post Quiz Scores */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#1E3A5F]">
                  Pre-Class vs. Post-Class Score Delta by Module
                </h3>
                <p className="text-[11px] text-[#5B6B7C]">
                  Visualizing student comprehension before physical sessions vs after active problem solving.
                </p>
              </div>

              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cohortData?.moduleGains || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="module" tick={{ fontSize: 10, fill: '#5B6B7C' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#5B6B7C' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="preScore" name="Pre-Class Quiz Avg (%)" fill="#94A3B8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="postScore" name="Post-Class Quiz Avg (%)" fill="#0F766E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Weekly Physical Attendance Trend */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#1E3A5F]">
                  Weekly Physical Attendance Compliance
                </h3>
                <p className="text-[11px] text-[#5B6B7C]">
                  Maintains steady presence during in-person lab and problem-solving sessions.
                </p>
              </div>

              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cohortData?.weeklyAttendance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#5B6B7C' }} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: '#5B6B7C' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      name="Attendance (%)"
                      stroke="#1E3A5F"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0F766E', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ALL REGISTERED STUDENTS REAL-TIME TABLE */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#1E3A5F] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#0F766E]" />
                  Enrolled Students Telemetry ({filteredStudents.length})
                </h3>
                <p className="text-xs text-[#5B6B7C] mt-0.5">
                  Detailed breakdown of physical attendance, video completion, materials accessed, and assignments for {selectedCourse.semester}.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#5B6B7C] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name or roll..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>

                {/* Attendance filter */}
                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value as any)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-[#E2E8F0] bg-white text-[#1E3A5F] focus:outline-none"
                >
                  <option value="ALL">All Attendance</option>
                  <option value="HIGH">Compliant (≥75%)</option>
                  <option value="LOW">At-Risk (&lt;75%)</option>
                </select>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#E2E8F0] rounded-xl text-xs text-[#5B6B7C]">
                No students match your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F9FB] border-y border-[#E2E8F0] text-[#5B6B7C] uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Student & Roll No</th>
                      <th className="py-3 px-3">Physical Attendance</th>
                      <th className="py-3 px-3">Pre-Class Video</th>
                      <th className="py-3 px-3">Materials</th>
                      <th className="py-3 px-3">Quizzes Avg</th>
                      <th className="py-3 px-3">Assignments</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((st: any) => {
                      const isReady = st.videoWatchPct >= 80 && st.attendancePct >= 75;
                      const isAtRisk = st.videoWatchPct < 50 || st.attendancePct < 70;

                      return (
                        <tr key={st.studentId} className="hover:bg-[#F7F9FB]/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#0F172A]">{st.studentName}</div>
                            <div className="text-[11px] text-[#5B6B7C]">{st.rollNo}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-[#1E3A5F]">{st.attendancePct}%</div>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${st.attendancePct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(st.attendancePct, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-[#1E3A5F]">{st.videoWatchPct}%</div>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${st.videoWatchPct >= 80 ? 'bg-[#0F766E]' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(st.videoWatchPct, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] font-medium text-[#1E3A5F]">
                              {st.materialsDownloadedPct}% opened
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-[#1E3A5F]">
                              {st.quizAvgPct}%
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-[#1E3A5F]">
                              {st.assignmentsSubmitted} / {st.totalAssignments}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                isReady
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isAtRisk
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {isReady ? 'Prepared' : isAtRisk ? 'At Risk' : 'In Progress'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};