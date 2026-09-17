import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, X, Sparkles, CheckCircle2, Calendar } from 'lucide-react';
import { createCourse, addAuditLog } from '../../services/dataService';
import { SEMESTERS, formatSemesterLabel } from '../../utils/semester';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, role, addToast, setSelectedCourse, activeSemester } = useAuth();
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Educational Technology and Engineering');
  const [semesterNumber, setSemesterNumber] = useState<number>(activeSemester || 6);
  const [credits, setCredits] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeSemester) {
      setSemesterNumber(activeSemester);
    }
  }, [activeSemester, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      addToast('Please provide both Course Code and Course Title', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedSemester = formatSemesterLabel(semesterNumber);
      const newCourse = await createCourse({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim(),
        departmentId: department,
        semester: formattedSemester,
        credits: Number(credits) || 3,
        teacherId: currentUser?.userId || 'faculty-1',
        teacherName: currentUser?.fullName || 'Faculty Instructor',
        coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
        status: 'PUBLISHED'
      });

      if (currentUser) {
        await addAuditLog(
          currentUser.userId,
          currentUser.fullName,
          role,
          'CREATE_COURSE',
          'Course',
          newCourse.courseId
        );
      }

      setSelectedCourse(newCourse);
      addToast(`Course ${newCourse.code}: ${newCourse.title} created for ${formattedSemester}! Only ${formattedSemester} students will see it.`, 'success');
      onClose();
      setCode('');
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Failed to create course:', err);
      addToast('Failed to create course. Please check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E2E8F0] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#5B6B7C] hover:text-[#0F172A] hover:bg-[#EEF3F7] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1E3A5F]">Create New Academic Course</h3>
            <p className="text-xs text-[#5B6B7C]">
              Set up a real-time blended curriculum course with flipped learning modules.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SWE-301"
                className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Credits *</label>
              <input
                type="number"
                min="1"
                max="6"
                required
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Course Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Software Architecture and Design Patterns"
              className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              >
                <option value="Educational Technology and Engineering">Educational Technology and Engineering</option>
                <option value="IoT and Robotics Engineering">IoT and Robotics Engineering</option>
                <option value="Cyber Security Engineering">Cyber Security Engineering</option>
                <option value="Data Science and Engineering">Data Science and Engineering</option>
                <option value="Software Engineering">Software Engineering</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1 flex items-center justify-between">
                <span>Target Semester *</span>
                <span className="text-[10px] text-[#0F766E] font-normal">Cohort Filter</span>
              </label>
              <select
                value={semesterNumber}
                onChange={(e) => setSemesterNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white font-medium text-[#1E3A5F] focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
              >
                {SEMESTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-[#1E3A5F] text-[11px] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0F766E] shrink-0" />
            <span>
              <strong>Cohort Guarantee:</strong> Only students registered in <strong>Semester {semesterNumber}</strong> will see and access this course, modules, and flipped assignments.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Course Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief course objectives and syllabus overview..."
              className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>

          <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-teal-800 text-[11px] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0F766E] shrink-0" />
            <span>This course will be saved directly to Firestore and synced in real-time across student, faculty, and admin views.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E2E8F0] hover:bg-[#EEF3F7] font-semibold text-[#5B6B7C] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0B5F59] text-white font-semibold shadow-xs transition flex items-center gap-2 disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Creating Course...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
