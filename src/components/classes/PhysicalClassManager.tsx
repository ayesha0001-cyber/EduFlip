import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck2,
  Plus,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import type { PhysicalClass, AttendanceRecord, AttendanceStatus, User } from '../../types';
import {
  getPhysicalClasses,
  schedulePhysicalClass,
  getAttendanceForClass,
  saveAttendanceBulk,
  getStudentAttendance,
  getUsers
} from '../../services/dataService';

export const PhysicalClassManager: React.FC = () => {
  const { selectedCourse, role, currentUser, addToast, openCreateCourseModal } = useAuth();
  const [classes, setClasses] = useState<PhysicalClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<PhysicalClass | null>(null);

  // Attendance Sheet state (Teacher view)
  const [students, setStudents] = useState<User[]>([]);
  const [sheetRecords, setSheetRecords] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Student Attendance Summary
  const [studentStats, setStudentStats] = useState<{
    records: AttendanceRecord[];
    percentage: number;
    presentCount: number;
    totalSessions: number;
  }>({ records: [], percentage: 100, presentCount: 0, totalSessions: 0 });

  // Schedule Modal (Teacher)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [topic, setTopic] = useState('');
  const [classDate, setClassDate] = useState('2026-09-18');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [room, setRoom] = useState('Lab 402, Building A');
  const [agenda, setAgenda] = useState('Hands-on system design refactoring sprint.');

  useEffect(() => {
    if (selectedCourse) {
      getPhysicalClasses(selectedCourse.courseId).then((cls) => {
        setClasses(cls);
        if (cls.length > 0 && !selectedClass) {
          setSelectedClass(cls[0]);
        }
      });
      getUsers().then((u) => setStudents(u.filter((user) => user.role === 'STUDENT')));
    }
  }, [selectedCourse]);

  // Load attendance sheet whenever selectedClass changes
  useEffect(() => {
    if (selectedClass) {
      getAttendanceForClass(selectedClass.classId).then((records) => {
        const map: Record<string, { status: AttendanceStatus; remarks: string }> = {};
        records.forEach((r) => {
          map[r.studentId] = { status: r.status, remarks: r.remarks || '' };
        });
        // Set defaults for any student not yet marked
        students.forEach((s) => {
          if (!map[s.userId]) {
            map[s.userId] = { status: 'PRESENT', remarks: '' };
          }
        });
        setSheetRecords(map);
      });
    }
  }, [selectedClass, students]);

  // Load student personal record if role is STUDENT
  useEffect(() => {
    if (role === 'STUDENT' && selectedCourse) {
      getStudentAttendance(currentUser.userId, selectedCourse.courseId).then(setStudentStats);
    }
  }, [role, currentUser.userId, selectedCourse]);

  const handleMarkStatus = (studentId: string, status: AttendanceStatus) => {
    setSheetRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleUpdateRemarks = (studentId: string, remarks: string) => {
    setSheetRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const next: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    students.forEach((s) => {
      next[s.userId] = { status, remarks: sheetRecords[s.userId]?.remarks || '' };
    });
    setSheetRecords(next);
    addToast(`Marked all students as ${status}`, 'info');
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedCourse) return;
    setIsSaving(true);

    const recordsToSave = students.map((s) => ({
      classId: selectedClass.classId,
      studentId: s.userId,
      studentName: s.fullName,
      rollNo: s.rollNo || 'N/A',
      courseId: selectedCourse.courseId,
      status: sheetRecords[s.userId]?.status || 'PRESENT',
      remarks: sheetRecords[s.userId]?.remarks || ''
    }));

    await saveAttendanceBulk(recordsToSave);
    setIsSaving(false);
    addToast('Attendance sheet saved to Firestore & students notified!', 'success');
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !selectedCourse) return;

    const created = await schedulePhysicalClass({
      courseId: selectedCourse.courseId,
      topic,
      classDate,
      startTime,
      endTime,
      room,
      agenda,
      teacherId: currentUser.userId
    });

    setClasses((prev) => [...prev, created]);
    setSelectedClass(created);
    setShowScheduleModal(false);
    setTopic('');
    addToast('Physical classroom session scheduled!', 'success');
  };

  // Counters
  const sheetValues = Object.values(sheetRecords) as { status: AttendanceStatus; remarks: string }[];
  const presentCount = sheetValues.filter((r) => r.status === 'PRESENT').length;
  const absentCount = sheetValues.filter((r) => r.status === 'ABSENT').length;
  const lateCount = sheetValues.filter((r) => r.status === 'LATE').length;
  const excusedCount = sheetValues.filter((r) => r.status === 'EXCUSED').length;

  if (!selectedCourse) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-xs text-center animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#1E3A5F] mb-1">No Active Course Selected</h2>
        <p className="text-xs text-[#5B6B7C] max-w-md mx-auto mb-4">
          Please select or create a course to schedule physical classroom sessions and manage student attendance.
        </p>
        {(role === 'TEACHER' || role === 'ADMIN') && (
          <button
            onClick={openCreateCourseModal}
            className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Course
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
              Phase 2 · During Class
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">
            Physical Classroom Sessions & Attendance
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-2xl mt-1">
            In the flipped classroom model, in-person time is dedicated to collaborative problem solving, active group discussions, and teacher-guided lab activities.
          </p>
        </div>

        {role === 'TEACHER' && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Schedule Physical Session
          </button>
        )}
      </div>

      {/* Student Personal Attendance Card (Visible for Student role) */}
      {role === 'STUDENT' && (
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center text-[#0F766E]">
                <span className="text-xl font-extrabold">{studentStats.percentage}%</span>
                <span className="text-[9px] uppercase font-bold text-[#5B6B7C]">Attendance</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E3A5F]">Your Classroom Attendance Status</h3>
                <p className="text-xs text-[#5B6B7C]">
                  Attended {studentStats.presentCount} of {studentStats.totalSessions} physical classroom sessions.
                </p>
                {studentStats.percentage < 75 ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-semibold mt-1">
                    <AlertTriangle className="w-4 h-4" />
                    Attendance is below 75% university requirement!
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Good academic standing (Above 75%)
                  </div>
                )}
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Roll No: {currentUser.rollNo || 'CS-2023-042'}
            </span>
          </div>
        </div>
      )}

      {/* Scheduled Classes Strip */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#1E3A5F] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#0F766E]" />
          Scheduled Physical Laboratory & Discussion Sessions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((cls) => {
            const isSelected = selectedClass?.classId === cls.classId;

            return (
              <div
                key={cls.classId}
                onClick={() => setSelectedClass(cls)}
                className={`bg-white rounded-2xl p-5 border cursor-pointer transition shadow-xs space-y-3 ${
                  isSelected ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20' : 'border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-teal-50 text-[#0F766E] px-2 py-0.5 rounded-md border border-teal-200">
                    {cls.classDate} · {cls.startTime} - {cls.endTime}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {cls.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#1E3A5F]">
                    {cls.topic}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#5B6B7C] mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>{cls.room}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F7F9FB] border border-[#E2E8F0] text-xs text-[#5B6B7C]">
                  <strong className="text-[#1E3A5F]">Agenda: </strong>
                  {cls.agenda}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Teacher Attendance Mark Sheet (For selected class) */}
      {role === 'TEACHER' && selectedClass && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                Session Attendance Roll Call
              </div>
              <h3 className="text-base font-bold text-[#1E3A5F]">
                {selectedClass.topic}
              </h3>
              <div className="text-xs text-[#5B6B7C]">
                {selectedClass.classDate} · {selectedClass.startTime} - {selectedClass.endTime} · {selectedClass.room}
              </div>
            </div>

            {/* Quick Batch Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleMarkAll('PRESENT')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition"
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleMarkAll('ABSENT')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Real-time Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800">Present</span>
              <div className="text-lg font-extrabold text-emerald-700">{presentCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800">Late</span>
              <div className="text-lg font-extrabold text-amber-700">{lateCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-800">Absent</span>
              <div className="text-lg font-extrabold text-rose-700">{absentCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-800">Excused</span>
              <div className="text-lg font-extrabold text-blue-700">{excusedCount}</div>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="divide-y divide-slate-100 border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="bg-[#EEF3F7] p-3 text-xs font-bold text-[#1E3A5F] grid grid-cols-12 gap-2">
              <div className="col-span-5">Student Information</div>
              <div className="col-span-4 text-center">Attendance Status</div>
              <div className="col-span-3 text-right">Remarks</div>
            </div>

            {students.map((student) => {
              const record = sheetRecords[student.userId] || { status: 'PRESENT', remarks: '' };

              return (
                <div
                  key={student.userId}
                  className="p-3.5 grid grid-cols-12 gap-2 items-center text-xs hover:bg-[#F7F9FB] transition"
                >
                  {/* Student Info */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-[#0F766E] font-bold flex items-center justify-center text-xs border border-teal-200">
                      {student.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-[#0F172A]">{student.fullName}</div>
                      <div className="text-[11px] font-mono text-[#5B6B7C]">Roll: {student.rollNo}</div>
                    </div>
                  </div>

                  {/* 4-State Status Pill Buttons */}
                  <div className="col-span-4 flex items-center justify-center gap-1">
                    {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as AttendanceStatus[]).map((st) => {
                      const isActive = record.status === st;

                      let btnStyle = 'text-[#5B6B7C] bg-white hover:bg-[#EEF3F7] border-[#E2E8F0]';
                      if (isActive) {
                        if (st === 'PRESENT') btnStyle = 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs';
                        if (st === 'LATE') btnStyle = 'bg-amber-500 text-white font-bold border-amber-500 shadow-xs';
                        if (st === 'ABSENT') btnStyle = 'bg-rose-600 text-white font-bold border-rose-600 shadow-xs';
                        if (st === 'EXCUSED') btnStyle = 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs';
                      }

                      return (
                        <button
                          key={st}
                          onClick={() => handleMarkStatus(student.userId, st)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${btnStyle}`}
                        >
                          {st.charAt(0) + st.slice(1).toLowerCase()}
                        </button>
                      );
                    })}
                  </div>

                  {/* Remarks Input */}
                  <div className="col-span-3 text-right">
                    <input
                      type="text"
                      placeholder="Optional notes..."
                      value={record.remarks}
                      onChange={(e) => handleUpdateRemarks(student.userId, e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Save Sheet Bar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <button
              onClick={handleSaveAttendance}
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#0F766E] hover:bg-[#0B5F59] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving to Database...' : 'Save & Publish Attendance'}
            </button>
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
            <h3 className="text-base font-bold text-[#1E3A5F] mb-4">
              Schedule Physical Classroom Session
            </h3>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Session Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab 402: Hands-on Architectural Refactoring"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={classDate}
                    onChange={(e) => setClassDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Room / Venue</label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1E3A5F] mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Session Agenda</label>
                <textarea
                  rows={3}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-[#EEF3F7] text-[#1E3A5F] hover:bg-[#E2E8F0] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
