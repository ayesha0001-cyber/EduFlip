import React, { useState } from 'react';
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
  ArrowUpRight
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AnalyticsDashboard: React.FC = () => {
  const { selectedCourse, role, addToast } = useAuth();

  // Learning gains data across course modules
  const moduleGainData = [
    { module: 'Mod 1: 3-Tier Arch', preScore: 56, postScore: 88, gain: 32 },
    { module: 'Mod 2: Schema Design', preScore: 61, postScore: 92, gain: 31 },
    { module: 'Mod 3: API Security', preScore: 48, postScore: 84, gain: 36 },
    { module: 'Mod 4: Microservices', preScore: 52, postScore: 86, gain: 34 }
  ];

  // Weekly attendance trend
  const weeklyAttendanceData = [
    { week: 'Wk 1', attendance: 95 },
    { week: 'Wk 2', attendance: 92 },
    { week: 'Wk 3', attendance: 88 },
    { week: 'Wk 4', attendance: 94 },
    { week: 'Wk 5', attendance: 91 },
    { week: 'Wk 6', attendance: 96 }
  ];

  // Readiness distribution
  const readinessDistribution = [
    { name: 'Ready (≥80% watched + passed)', value: 68, color: '#0F766E' },
    { name: 'Partially Ready', value: 24, color: '#F59E0B' },
    { name: 'Not Ready', value: 8, color: '#E11D48' }
  ];

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Module,Pre-Class Score,Post-Class Score,Learning Gain Delta\n' +
      moduleGainData.map((d) => `${d.module},${d.preScore}%,${d.postScore}%,+${d.gain}%`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedCourse?.code || 'SWE301'}_Flipped_Learning_Gains.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Learning gains analytics exported as CSV!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-teal-50 text-[#0F766E] border border-teal-200">
              Efficacy Analytics & Normalized Learning Gains
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">
            Flipped Classroom Learning Gains Dashboard
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-2xl mt-1">
            Empirical evaluation comparing before-class diagnostic knowledge with post-class synthesis scores. Demonstrates the educational impact of blended asynchronous and collaborative learning.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-[#EEF3F7] rounded-xl text-xs font-semibold text-[#1E3A5F] shadow-xs flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4 text-[#0F766E]" />
          Export Report (CSV)
        </button>
      </div>

      {/* 4 Core Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#5B6B7C]">Avg Learning Gain</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1E3A5F]">+33.2%</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Normalized Hake Gain: 0.72 (High)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#5B6B7C]">Pre-Class Video Watch Rate</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1E3A5F]">84.6%</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Threshold ≥90% reached by 78%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#5B6B7C]">Post-Quiz Mastery Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1E3A5F]">87.5%</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#5B6B7C]">
            <span>Up from 54.2% pre-class diagnostic</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#5B6B7C]">Classroom Attendance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1E3A5F]">92.8%</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
            <span>Well above 75% institutional requirement</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Pre vs Post Quiz Scores */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1E3A5F]">
                Pre-Class vs. Post-Class Score Delta by Module
              </h3>
              <p className="text-[11px] text-[#5B6B7C]">
                Visualizing student comprehension before physical sessions vs after active problem solving.
              </p>
            </div>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleGainData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1E3A5F]">
                Weekly Physical Attendance Compliance
              </h3>
              <p className="text-[11px] text-[#5B6B7C]">
                Maintains steady presence during in-person lab and problem-solving sessions.
              </p>
            </div>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#5B6B7C' }} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: '#5B6B7C' }} />
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

      {/* Readiness Distribution Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs">
        <h3 className="text-sm font-bold text-[#1E3A5F] mb-1">
          Pre-Class Readiness Breakdown Across Cohort
        </h3>
        <p className="text-xs text-[#5B6B7C] mb-4">
          Percentage of students completing all pre-class requirements prior to entering physical classrooms.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {readinessDistribution.map((item) => (
            <div
              key={item.name}
              className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F7F9FB] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E3A5F]">{item.name}</span>
                <span className="text-lg font-bold" style={{ color: item.color }}>
                  {item.value}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.value}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
