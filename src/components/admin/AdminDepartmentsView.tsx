import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, Plus, BookOpen, GraduationCap, CheckCircle2, ChevronRight } from 'lucide-react';
import type { Department } from '../../types';
import { subscribeToDepartments, createDepartment, addAuditLog } from '../../services/dataService';

export const AdminDepartmentsView: React.FC = () => {
  const { addToast, currentUser, role } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  useEffect(() => {
    const unsub = subscribeToDepartments(setDepartments);
    return () => unsub();
  }, []);

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) return;

    try {
      const newD = await createDepartment({
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
        programsCount: 1,
        coursesCount: 0
      });

      if (currentUser) {
        await addAuditLog(
          currentUser.userId,
          currentUser.fullName,
          role,
          'CREATE_DEPARTMENT',
          'Department',
          newD.deptId
        );
      }

      setShowAddModal(false);
      setDeptName('');
      setDeptCode('');
      addToast(`Department ${newD.name} registered and saved to Firestore!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to register department', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-teal-50 text-[#0F766E] border border-teal-200">
              Academic Organization
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">
            Academic Departments & Programs
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-2xl mt-1">
            Configure faculties, degree programs, and curriculum offerings across university departments.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div
            key={dept.deptId}
            className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4 hover:border-teal-300 transition"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs font-bold bg-[#EEF3F7] text-[#1E3A5F] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
                {dept.code}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#1E3A5F] mb-1">
                {dept.name}
              </h3>
              <p className="text-xs text-[#5B6B7C]">
                Active accredited degree programs and blended learning faculty.
              </p>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#5B6B7C]">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#0F766E]" />
                <span>{dept.programsCount} Programs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#1E3A5F]" />
                <span>{dept.coursesCount} Courses</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
            <h3 className="text-base font-bold text-[#1E3A5F] mb-4">Register Academic Department</h3>
            <form onSubmit={handleAddDept} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical & Aerospace Engineering"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ME"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#EEF3F7] text-[#1E3A5F] hover:bg-[#E2E8F0] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
