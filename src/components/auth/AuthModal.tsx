import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole, User } from '../../types';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  X,
  Mail,
  Lock,
  User as UserIcon,
  Building2,
  BadgeCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    initialSignUpRole,
    login,
    loginWithEmail,
    signUp,
    addToast
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign Up Form State
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [department, setDepartment] = useState('Educational Technology and Engineering');
  const [rollNo, setRollNo] = useState('');
  const [semester, setSemester] = useState(6);
  const [designation, setDesignation] = useState('Assistant Professor');
  const [employeeId, setEmployeeId] = useState('');

  useEffect(() => {
    if (isAuthModalOpen) {
      setActiveTab(authModalMode);
      setSelectedRole(initialSignUpRole);
    }
  }, [isAuthModalOpen, authModalMode, initialSignUpRole]);

  if (!isAuthModalOpen) return null;

  // Predefined Quick Demo Sign In Personas
  const demoAccounts = [
    {
      role: 'STUDENT' as UserRole,
      title: 'Student Account',
      name: 'Ayesha Rahman',
      email: 'student@edublend.edu',
      meta: 'Roll: CS-2023-042 · 6th Semester',
      icon: GraduationCap,
      color: 'border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-[#0F766E]'
    },
    {
      role: 'TEACHER' as UserRole,
      title: 'Teacher / Faculty Account',
      name: 'Prof. Tariq Rahman',
      email: 'teacher@edublend.edu',
      meta: 'Course Instructor · Distributed Systems',
      icon: BookOpen,
      color: 'border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-[#1E3A5F]'
    },
    {
      role: 'ADMIN' as UserRole,
      title: 'University Admin Account',
      name: 'Dr. Ayesha Siddiqa',
      email: 'ayesha0001@std.uftb.ac.bd',
      meta: 'Academic Operations & Curriculum Director',
      icon: ShieldCheck,
      color: 'border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-700'
    }
  ];

  const handleQuickSignIn = (demo: typeof demoAccounts[0]) => {
    setIsSubmitting(true);
    const demoUser: User = {
      userId: `user-${demo.role.toLowerCase()}-1`,
      fullName: demo.name,
      email: demo.email,
      role: demo.role,
      department: 'Educational Technology and Engineering',
      status: 'ACTIVE',
      rollNo: demo.role === 'STUDENT' ? 'CS-2023-042' : undefined,
      employeeId: demo.role !== 'STUDENT' ? 'EMP-882' : undefined,
      semester: demo.role === 'STUDENT' ? 6 : undefined,
      section: demo.role === 'STUDENT' ? 'A' : undefined,
      createdAt: '2026-02-10T11:00:00Z'
    };
    setTimeout(() => {
      login(demoUser);
      setIsSubmitting(false);
    }, 200);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim()) {
      addToast('Please enter your university email address', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await loginWithEmail(signInEmail.trim(), selectedRole);
    } catch {
      addToast('Failed to authenticate. Please check your credentials.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !signUpEmail.trim()) {
      addToast('Please fill in your name and email address', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUserPayload: Omit<User, 'userId' | 'createdAt'> = {
        fullName: fullName.trim(),
        email: signUpEmail.trim(),
        role: selectedRole,
        department,
        status: 'ACTIVE',
        rollNo: selectedRole === 'STUDENT' ? rollNo.trim() || `CS-2023-${Math.floor(100 + Math.random() * 900)}` : undefined,
        employeeId: selectedRole !== 'STUDENT' ? employeeId.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}` : undefined,
        semester: selectedRole === 'STUDENT' ? semester : undefined
      };

      await signUp(newUserPayload);
    } catch {
      addToast('Error during sign up. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F7F9FB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E3A5F]">
                {activeTab === 'signin' ? 'Sign In to EduFlip' : 'Create Role Account'}
              </h2>
              <p className="text-[11px] text-[#5B6B7C]">
                Flipped Classroom Blended Learning Platform
              </p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-[#5B6B7C] hover:text-[#1E3A5F] hover:bg-[#EEF3F7] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E2E8F0] bg-white px-6 pt-3">
          <button
            onClick={() => setActiveTab('signin')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'signin'
                ? 'border-[#0F766E] text-[#0F766E]'
                : 'border-transparent text-[#5B6B7C] hover:text-[#1E3A5F]'
            }`}
          >
            <span>Sign In</span>
          </button>

          <button
            onClick={() => setActiveTab('signup')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'signup'
                ? 'border-[#0F766E] text-[#0F766E]'
                : 'border-transparent text-[#5B6B7C] hover:text-[#1E3A5F]'
            }`}
          >
            <span>Sign Up (Role-Based)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <div className="space-y-5">
              {/* Quick Demo Instant Login Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A5F] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                    Instant Role Demo Logins
                  </span>
                  <span className="text-[10px] text-[#5B6B7C]">Click to test any persona</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {demoAccounts.map((demo) => {
                    const Icon = demo.icon;
                    return (
                      <button
                        key={demo.role}
                        type="button"
                        onClick={() => handleQuickSignIn(demo)}
                        disabled={isSubmitting}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between group ${demo.color}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/70">
                            {demo.role}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1E3A5F] group-hover:text-[#0F766E] transition">
                            {demo.name}
                          </div>
                          <div className="text-[10px] opacity-75 mt-0.5 line-clamp-1">
                            {demo.meta}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#E2E8F0]"></div>
                <span className="flex-shrink mx-3 text-[11px] text-[#5B6B7C] uppercase font-semibold">
                  Or Sign In with Email
                </span>
                <div className="flex-grow border-t border-[#E2E8F0]"></div>
              </div>

              {/* Email Sign In Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-3.5">
                {/* Role Pill Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#1E3A5F] mb-1.5">
                    Select Your Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['STUDENT', 'TEACHER', 'ADMIN'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                          selectedRole === r
                            ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                            : 'bg-[#F7F9FB] border-[#E2E8F0] text-[#5B6B7C] hover:bg-[#EEF3F7]'
                        }`}
                      >
                        {r === 'STUDENT' && <GraduationCap className="w-3.5 h-3.5" />}
                        {r === 'TEACHER' && <BookOpen className="w-3.5 h-3.5" />}
                        {r === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5" />}
                        <span className="capitalize">{r.toLowerCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E3A5F] mb-1">
                    University Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#5B6B7C] absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@edublend.edu or ayesha0001@std.uftb.ac.bd"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E3A5F] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#5B6B7C] absolute left-3 top-2.5" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 mt-2"
                >
                  <span>Sign In as {selectedRole.toLowerCase()}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="text-center pt-2 text-xs text-[#5B6B7C]">
                Don't have an account yet?{' '}
                <button
                  onClick={() => setActiveTab('signup')}
                  className="font-bold text-[#0F766E] hover:underline"
                >
                  Create one here
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN UP */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              {/* Step 1: Choose Role */}
              <div>
                <label className="block text-xs font-bold text-[#1E3A5F] mb-2">
                  1. Choose Your Academic Role:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('STUDENT')}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      selectedRole === 'STUDENT'
                        ? 'border-[#0F766E] bg-teal-50/80 text-[#0F766E] ring-2 ring-[#0F766E]/20'
                        : 'border-[#E2E8F0] bg-white text-[#5B6B7C] hover:bg-[#F7F9FB]'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 shrink-0 mt-0.5 text-[#0F766E]" />
                    <div>
                      <div className="text-xs font-bold text-[#1E3A5F]">Student</div>
                      <div className="text-[10px] text-[#5B6B7C]">Attend, watch lectures, do quizzes & assignments</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('TEACHER')}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      selectedRole === 'TEACHER'
                        ? 'border-[#1E3A5F] bg-blue-50/80 text-[#1E3A5F] ring-2 ring-[#1E3A5F]/20'
                        : 'border-[#E2E8F0] bg-white text-[#5B6B7C] hover:bg-[#F7F9FB]'
                    }`}
                  >
                    <BookOpen className="w-5 h-5 shrink-0 mt-0.5 text-[#1E3A5F]" />
                    <div>
                      <div className="text-xs font-bold text-[#1E3A5F]">Faculty / Teacher</div>
                      <div className="text-[10px] text-[#5B6B7C]">Manage syllabus, readiness, attendance & grading</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('ADMIN')}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      selectedRole === 'ADMIN'
                        ? 'border-amber-600 bg-amber-50/80 text-amber-800 ring-2 ring-amber-600/20'
                        : 'border-[#E2E8F0] bg-white text-[#5B6B7C] hover:bg-[#F7F9FB]'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
                    <div>
                      <div className="text-xs font-bold text-[#1E3A5F]">Administrator</div>
                      <div className="text-[10px] text-[#5B6B7C]">Manage departments, users, curricula & security</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Personal & Academic Info */}
              <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                <label className="block text-xs font-bold text-[#1E3A5F]">
                  2. User Information:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#1E3A5F] mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-3.5 h-3.5 text-[#5B6B7C] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ayesha Rahman"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#1E3A5F] mb-1">
                      University Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-[#5B6B7C] absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. ayesha@uftb.ac.bd"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#1E3A5F] mb-1">
                      Academic Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0F766E] focus:outline-none bg-white"
                    >
                      <option value="Educational Technology and Engineering">Educational Technology and Engineering</option>
                      <option value="IoT and Robotics Engineering">IoT and Robotics Engineering</option>
                      <option value="Cyber Security Engineering">Cyber Security Engineering</option>
                      <option value="Data Science and Engineering">Data Science and Engineering</option>
                      <option value="Software Engineering">Software Engineering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#1E3A5F] mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-[#5B6B7C] absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Specific Fields */}
                {selectedRole === 'STUDENT' && (
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-teal-50/60 border border-teal-100">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#0F766E] mb-1">
                        Student ID / Roll No
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CS-2023-042"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-teal-200 bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#0F766E] mb-1">
                        Current Semester
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-teal-200 bg-white focus:outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {selectedRole === 'TEACHER' && (
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#1E3A5F] mb-1">
                        Academic Designation
                      </label>
                      <select
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-blue-200 bg-white focus:outline-none"
                      >
                        <option value="Professor">Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Lecturer">Lecturer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#1E3A5F] mb-1">
                        Faculty Staff ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. FAC-CSE-09"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-blue-200 bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {selectedRole === 'ADMIN' && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                    <label className="block text-[10px] font-semibold text-amber-800 mb-1">
                      Administrative Officer ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ADM-HQ-01"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-amber-200 bg-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 mt-3"
              >
                <span>Complete Registration & Enter Workspace</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-[#5B6B7C]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="font-bold text-[#0F766E] hover:underline"
                >
                  Sign In instead
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
