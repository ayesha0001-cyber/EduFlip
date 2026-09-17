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
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { SEMESTERS } from '../../utils/semester';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    openAuthModal,
    initialSignUpRole,
    loginWithEmail,
    signUp,
    addToast
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [teacherLoginSemester, setTeacherLoginSemester] = useState<number>(6);
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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim()) {
      addToast('Please enter your university email address', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await loginWithEmail(
        signInEmail.trim(),
        selectedRole,
        selectedRole === 'TEACHER' ? teacherLoginSemester : undefined
      );
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
        semester: selectedRole === 'STUDENT' ? semester : (selectedRole === 'TEACHER' ? teacherLoginSemester : undefined)
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
                {activeTab === 'signin' ? 'Sign In to EduFlip' : 'Sign Up for EduFlip'}
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
            <span>Sign Up</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <div className="space-y-5">
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
                      placeholder="e.g. ayesha0001@std.uftb.ac.bd or your-name@university.edu"
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

                {selectedRole === 'TEACHER' && (
                  <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200">
                    <label className="block text-xs font-semibold text-[#1E3A5F] mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
                        Select Teaching Semester *
                      </span>
                      <span className="text-[10px] text-[#0F766E] font-medium">Cohort Visibility</span>
                    </label>
                    <select
                      value={teacherLoginSemester}
                      onChange={(e) => setTeacherLoginSemester(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-blue-200 bg-white font-medium text-[#1E3A5F] focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                    >
                      {SEMESTERS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[#5B6B7C] mt-1.5 leading-relaxed">
                      Choose the semester you are teaching. Your dashboard, created courses, and enrolled student lists will align with this semester cohort.
                    </p>
                  </div>
                )}

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
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
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

                    <div>
                      <label className="block text-[10px] font-semibold text-[#1E3A5F] mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#0F766E]" />
                        Initial Teaching Semester
                      </label>
                      <select
                        value={teacherLoginSemester}
                        onChange={(e) => setTeacherLoginSemester(Number(e.target.value))}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-blue-200 bg-white focus:outline-none"
                      >
                        {SEMESTERS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
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
                <span>Create Account</span>
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
