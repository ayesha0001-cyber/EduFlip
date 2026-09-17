import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import type { User, UserRole } from '../../types';
import { subscribeToUsers, createUser, deleteUser, addAuditLog } from '../../services/dataService';

export const AdminUsersView: React.FC = () => {
  const { addToast, currentUser, users: authUsers } = useAuth();
  const [users, setUsers] = useState<User[]>(authUsers || []);
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [department, setDepartment] = useState('Educational Technology and Engineering');
  const [rollNo, setRollNo] = useState('');

  useEffect(() => {
    if (authUsers && authUsers.length > 0) {
      setUsers(authUsers);
    }
  }, [authUsers]);

  useEffect(() => {
    const unsub = subscribeToUsers((fetched) => {
      if (fetched && fetched.length > 0) {
        setUsers(fetched);
      }
    });
    return () => unsub();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    try {
      const newUser = await createUser({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        role,
        department,
        status: 'ACTIVE',
        employeeId: role !== 'STUDENT' ? `EDTE-FAC-${Math.floor(10 + Math.random() * 90)}` : undefined,
        rollNo: role === 'STUDENT' ? rollNo || `EDTE-2026-${Math.floor(100 + Math.random() * 900)}` : undefined
      });

      if (currentUser) {
        await addAuditLog(
          currentUser.userId,
          currentUser.fullName,
          currentUser.role,
          'PROVISION_USER',
          'User',
          newUser.userId
        );
      }

      setShowAddModal(false);
      setFullName('');
      setEmail('');
      setRollNo('');
      addToast(`User ${newUser.fullName} (${newUser.role}) provisioned in Firestore!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to create user', 'error');
    }
  };

  const studentCount = users.filter((u) => u.role === 'STUDENT').length;
  const teacherCount = users.filter((u) => u.role === 'TEACHER').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesRole;

    const matchesSearch =
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.rollNo && u.rollNo.toLowerCase().includes(q)) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q));

    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-teal-50 text-[#0F766E] border border-teal-200">
              Administrative User Directory
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">
            Manage Students, Faculty & Administrators
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-2xl mt-1">
            Provision platform accounts, assign university roll numbers, configure departmental affiliations, and manage role-based authorization.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Add New User / Faculty
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#5B6B7C] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              roleFilter === 'ALL'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'bg-[#EEF3F7] text-[#5B6B7C] hover:bg-[#E2E8F0]'
            }`}
          >
            <span>All Roles</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${roleFilter === 'ALL' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setRoleFilter('STUDENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              roleFilter === 'STUDENT'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'bg-[#EEF3F7] text-[#5B6B7C] hover:bg-[#E2E8F0]'
            }`}
          >
            <span>Students</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${roleFilter === 'STUDENT' ? 'bg-white/25 text-white' : 'bg-teal-100 text-[#0F766E]'}`}>
              {studentCount}
            </span>
          </button>

          <button
            onClick={() => setRoleFilter('TEACHER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              roleFilter === 'TEACHER'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'bg-[#EEF3F7] text-[#5B6B7C] hover:bg-[#E2E8F0]'
            }`}
          >
            <span>Faculty / Teachers</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${roleFilter === 'TEACHER' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {teacherCount}
            </span>
          </button>

          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              roleFilter === 'ADMIN'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'bg-[#EEF3F7] text-[#5B6B7C] hover:bg-[#E2E8F0]'
            }`}
          >
            <span>Admins</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${roleFilter === 'ADMIN' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800'}`}>
              {adminCount}
            </span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#EEF3F7] text-[#1E3A5F] border-b border-[#E2E8F0] font-bold">
                <th className="p-4">User Details</th>
                <th className="p-4">System Role</th>
                <th className="p-4">Department</th>
                <th className="p-4">Roll / Faculty ID</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#5B6B7C]">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-[#1E3A5F]">No users found</p>
                    <p className="text-xs mt-1">No users match your current filter or search criteria.</p>
                    {(roleFilter !== 'ALL' || searchQuery) && (
                      <button
                        onClick={() => {
                          setRoleFilter('ALL');
                          setSearchQuery('');
                        }}
                        className="mt-3 px-3 py-1 bg-teal-50 text-[#0F766E] border border-teal-200 rounded-lg text-xs font-medium hover:bg-teal-100 transition"
                      >
                        Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.userId} className="hover:bg-[#F7F9FB] transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-50 text-[#0F766E] font-bold flex items-center justify-center text-xs border border-teal-200">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-[#0F172A]">{user.fullName}</div>
                          <div className="text-[11px] text-[#5B6B7C]">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'ADMIN'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : user.role === 'TEACHER'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="p-4 text-[#5B6B7C]">
                      {user.department || 'Educational Technology and Engineering'}
                    </td>

                    <td className="p-4 font-mono text-[#0F172A]">
                      {user.rollNo || user.employeeId || '—'}
                      {user.section && <span className="ml-1 text-[10px] font-sans text-[#5B6B7C] font-normal">(Sec {user.section})</span>}
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => addToast(`User ${user.fullName} (${user.role}) details verified`, 'info')}
                          className="px-2.5 py-1 text-xs border border-[#E2E8F0] rounded-lg hover:bg-[#EEF3F7] text-[#1E3A5F] transition"
                        >
                          Details
                        </button>
                        <button
                          onClick={async () => {
                            if (user.userId === currentUser?.userId) {
                              addToast('You cannot delete your own active administrator account.', 'error');
                              return;
                            }
                            if (window.confirm(`Are you sure you want to permanently delete user "${user.fullName}" (${user.email})?`)) {
                              await deleteUser(user.userId);
                              await addAuditLog(
                                currentUser?.userId || 'system',
                                currentUser?.fullName || 'Admin',
                                currentUser?.role || 'ADMIN',
                                'DELETE_USER',
                                'users',
                                user.userId
                              );
                              addToast(`User ${user.fullName} was deleted successfully.`, 'success');
                            }
                          }}
                          className="p-1 text-xs border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
            <h3 className="text-base font-bold text-[#1E3A5F] mb-4">Provision New User Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jennifer Adams or Alex Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. j.adams@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher / Faculty</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Roll No (if Student)</label>
                  <input
                    type="text"
                    placeholder="e.g. CS-2023-088"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none bg-white"
                >
                  <option value="Educational Technology and Engineering">Educational Technology and Engineering</option>
                  <option value="IoT and Robotics Engineering">IoT and Robotics Engineering</option>
                  <option value="Cyber Security Engineering">Cyber Security Engineering</option>
                  <option value="Data Science and Engineering">Data Science and Engineering</option>
                  <option value="Software Engineering">Software Engineering</option>
                </select>
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
