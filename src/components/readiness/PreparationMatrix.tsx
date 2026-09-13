import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Search,
  Filter,
  Send,
  Video,
  FileCheck2,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowUpDown,
  GraduationCap
} from 'lucide-react';
import type { StudentReadiness } from '../../types';
import { getCourseReadiness } from '../../services/dataService';

export const PreparationMatrix: React.FC = () => {
  const { selectedCourse, addToast, openCreateCourseModal, role } = useAuth();
  const [students, setStudents] = useState<StudentReadiness[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'READY' | 'PARTIALLY_READY' | 'NOT_READY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (selectedCourse) {
      getCourseReadiness(selectedCourse.courseId).then(setStudents);
    }
  }, [selectedCourse]);

  const handleSendReminder = (studentName: string) => {
    addToast(`Pre-class preparation reminder sent to ${studentName}!`, 'success');
  };

  const filteredStudents = students.filter((s) => {
    const matchesFilter = filterStatus === 'ALL' || s.status === filterStatus;
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const readyCount = students.filter((s) => s.status === 'READY').length;
  const partiallyReadyCount = students.filter((s) => s.status === 'PARTIALLY_READY').length;
  const notReadyCount = students.filter((s) => s.status === 'NOT_READY').length;

  if (!selectedCourse) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-xs text-center animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#1E3A5F] mb-1">No Active Course Selected</h2>
        <p className="text-xs text-[#5B6B7C] max-w-md mx-auto mb-4">
          Please select or create a course to monitor student pre-class readiness metrics.
        </p>
        {(role === 'TEACHER' || role === 'ADMIN') && (
          <button
            onClick={openCreateCourseModal}
            className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-2"
          >
            Create Course
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-teal-50 text-[#0F766E] border border-teal-200">
              Instructor Intelligence · Pre-Class Preparation Matrix
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">
            Student Preparation & Readiness Tracker
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-2xl mt-1">
            Real-time telemetry of lecture video completion, slide reading, and pre-class diagnostic quiz scores. Use this data during physical sessions to target weak concepts.
          </p>
        </div>

        <button
          onClick={() => {
            students
              .filter((s) => s.status === 'NOT_READY')
              .forEach((s) => handleSendReminder(s.studentName));
            addToast('Bulk reminders sent to all unready students!', 'success');
          }}
          className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
        >
          <Send className="w-4 h-4" />
          Remind All Unready ({notReadyCount})
        </button>
      </div>

      {/* Summary Readiness Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-800 uppercase">Ready For Class</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{readyCount} Students</div>
          <p className="text-[11px] text-[#5B6B7C] mt-1">
            Watched ≥80% video + passed pre-quiz.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-800 uppercase">Partially Ready</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">{partiallyReadyCount} Students</div>
          <p className="text-[11px] text-[#5B6B7C] mt-1">
            Watched partial video or attempted quiz.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-rose-800 uppercase">Not Ready</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700">{notReadyCount} Students</div>
          <p className="text-[11px] text-[#5B6B7C] mt-1">
            Zero or minimal pre-class engagement.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#5B6B7C] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'READY', 'PARTIALLY_READY', 'NOT_READY'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === st
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'bg-[#EEF3F7] text-[#5B6B7C] hover:bg-[#E2E8F0]'
              }`}
            >
              {st === 'ALL'
                ? `All (${students.length})`
                : st === 'READY'
                ? `Ready (${readyCount})`
                : st === 'PARTIALLY_READY'
                ? `Partially Ready (${partiallyReadyCount})`
                : `Not Ready (${notReadyCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Readiness Matrix Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#EEF3F7] text-[#1E3A5F] border-b border-[#E2E8F0] font-bold">
                <th className="p-4">Student Name & Roll No</th>
                <th className="p-4">Video Completion</th>
                <th className="p-4">Materials Read</th>
                <th className="p-4">Pre-Quiz Score</th>
                <th className="p-4">Preparation Status</th>
                <th className="p-4 text-right">Instructor Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => (
                <tr key={s.studentId} className="hover:bg-[#F7F9FB] transition">
                  {/* Name */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-50 text-[#0F766E] font-bold flex items-center justify-center text-xs border border-teal-200">
                        {s.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-[#0F172A]">{s.studentName}</div>
                        <div className="text-[11px] font-mono text-[#5B6B7C]">Roll: {s.rollNo}</div>
                      </div>
                    </div>
                  </td>

                  {/* Video */}
                  <td className="p-4">
                    <div className="space-y-1 w-32">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#0F172A]">{s.videoCompletionPct}%</span>
                        <span className="text-[#5B6B7C]">
                          {s.videoCompletionPct >= 90 ? 'Complete' : 'In progress'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#EEF3F7] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            s.videoCompletionPct >= 90
                              ? 'bg-emerald-600'
                              : s.videoCompletionPct >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${s.videoCompletionPct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Materials */}
                  <td className="p-4">
                    <span className="font-semibold text-[#0F172A]">
                      {s.materialsReadCount} / {s.totalMaterialsCount} Read
                    </span>
                  </td>

                  {/* Pre-Quiz */}
                  <td className="p-4">
                    {s.preQuizScorePct > 0 ? (
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md font-mono ${
                          s.preQuizScorePct >= 70
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {s.preQuizScorePct}%
                      </span>
                    ) : (
                      <span className="text-[#5B6B7C] italic">Not attempted</span>
                    )}
                  </td>

                  {/* Badge */}
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.status === 'READY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.status === 'PARTIALLY_READY'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleSendReminder(s.studentName)}
                      className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-teal-50 hover:text-[#0F766E] font-medium text-xs transition inline-flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Remind
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
