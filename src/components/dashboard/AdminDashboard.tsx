import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Building2,
  BookOpen,
  HardDrive,
  ShieldCheck,
  TrendingUp,
  Activity,
  Plus,
  ArrowRight,
  Database,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { subscribeToAuditLogs, subscribeToDepartments } from '../../services/dataService';
import type { AuditLog, Department } from '../../types';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { currentUser, users, courses, openCreateCourseModal } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const unsubLogs = subscribeToAuditLogs(setAuditLogs);
    const unsubDepts = subscribeToDepartments(setDepartments);
    return () => {
      unsubLogs();
      unsubDepts();
    };
  }, []);

  const studentCount = users.filter((u) => u.role === 'STUDENT').length;
  const teacherCount = users.filter((u) => u.role === 'TEACHER').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Admin Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1E3A5F] via-[#0F766E] to-[#1E3A5F] rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-semibold backdrop-blur-xs mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            University Academic Administration · Real-Time Mode
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Academic Operations Center
          </h1>
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed mb-5">
            Logged in as <span className="text-white font-semibold">{currentUser?.fullName || 'Administrator'}</span> ({currentUser?.email}). Real-time telemetry, live Firestore synchronization, and academic resource provisioning.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('admin-users')}
              className="px-4 py-2 bg-white text-[#1E3A5F] hover:bg-[#EEF3F7] rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-[#0F766E]" />
              Manage Users & Faculty ({users.length})
            </button>
            <button
              onClick={() => onNavigate('admin-departments')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition flex items-center gap-2 border border-white/20"
            >
              <Building2 className="w-4 h-4 text-amber-300" />
              Departments & Programs ({departments.length})
            </button>
            <button
              onClick={openCreateCourseModal}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition flex items-center gap-2 border border-white/20"
            >
              <Plus className="w-4 h-4 text-emerald-300" />
              Add Course
            </button>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl" />
      </div>

      {/* 4 Core KPI Cards (Live Real-Time from Firestore) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#5B6B7C]">Registered Students</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1E3A5F]">{studentCount}</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#5B6B7C]">
            <span>Live from Firestore users collection</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#5B6B7C]">Faculty & Instructors</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1E3A5F]">{teacherCount}</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#5B6B7C]">
            <span>Across university departments</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#5B6B7C]">Active Courses</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1E3A5F]">{courses.length}</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
            <span>Real-time catalog</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#5B6B7C]">Backend State</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1E3A5F]">Firestore</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Real-Time Sync Active</span>
          </div>
        </div>
      </div>

      {/* Departments & Platform Activity Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Departments List */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0F766E]" />
              Academic Departments ({departments.length})
            </h2>
            <button
              onClick={() => onNavigate('admin-departments')}
              className="text-xs font-semibold text-[#0F766E] hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {departments.length === 0 ? (
              <p className="text-xs text-[#5B6B7C] py-4 text-center">
                No departments registered yet. Click to add your first department.
              </p>
            ) : (
              departments.map((dept) => (
                <div
                  key={dept.deptId}
                  className="p-3 rounded-xl border border-[#E2E8F0] hover:border-teal-200 transition bg-[#F7F9FB] flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-[#0F172A]">{dept.name}</div>
                    <div className="text-[11px] text-[#5B6B7C]">
                      Code: <span className="font-medium text-[#1E3A5F]">{dept.code}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#0F766E] bg-white px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                    {dept.code}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-Time Platform Audit Log */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0F766E]" />
                Live Platform Audit Trail
              </h2>
              <p className="text-[11px] text-[#5B6B7C]">
                Security and operational log synchronized directly from Firestore in real time.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </span>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#E2E8F0] rounded-xl text-xs text-[#5B6B7C]">
                <Clock className="w-6 h-6 text-[#5B6B7C]/60 mx-auto mb-2" />
                No actions logged yet. User logins, course creations, and grade releases will appear here in real time.
              </div>
            ) : (
              auditLogs.slice(0, 10).map((log) => (
                <div
                  key={log.logId}
                  className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F7F9FB] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center font-bold text-xs shrink-0">
                      {log.userName ? log.userName.charAt(0) : 'A'}
                    </div>
                    <div>
                      <div className="font-semibold text-[#0F172A] flex items-center gap-2">
                        <span>{log.userName}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-white border border-[#E2E8F0] font-medium text-[#5B6B7C]">
                          {log.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5B6B7C]">
                        {log.action} on <span className="font-medium text-[#1E3A5F]">{log.entity}</span> ({log.entityId})
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-[#5B6B7C] shrink-0 ml-2">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
