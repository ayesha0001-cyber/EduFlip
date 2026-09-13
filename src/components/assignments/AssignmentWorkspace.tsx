import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  Send,
  MessageSquare,
  Plus,
  Save,
  Check,
  Download,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';
import type { Assignment, Submission, FeedbackMessage, RubricCriterion } from '../../types';
import {
  getAssignments,
  getSubmissions,
  submitAssignment,
  gradeSubmission,
  getFeedback,
  addFeedback,
  createAssignment
} from '../../services/dataService';

export const AssignmentWorkspace: React.FC = () => {
  const { selectedCourse, role, currentUser, addToast, openCreateCourseModal } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Student Submissions
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userSubmission, setUserSubmission] = useState<Submission | null>(null);

  // Student Submit Form
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Teacher Grading Workspace
  const [activeGradingSub, setActiveGradingSub] = useState<Submission | null>(null);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [isGradingSaving, setIsGradingSaving] = useState(false);

  // Threaded Feedback
  const [feedbackList, setFeedbackList] = useState<FeedbackMessage[]>([]);
  const [newComment, setNewComment] = useState('');

  // Create Assignment Modal (Teacher)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assignMaxMarks, setAssignMaxMarks] = useState(100);
  const [assignDeadline, setAssignDeadline] = useState('2026-09-25T23:59');

  useEffect(() => {
    if (selectedCourse) {
      getAssignments(selectedCourse.courseId).then((all) => {
        setAssignments(all);
        if (all.length > 0 && !selectedAssignment) {
          setSelectedAssignment(all[0]);
        }
      });
    }
  }, [selectedCourse]);

  // Load submissions whenever selected assignment changes
  useEffect(() => {
    if (selectedAssignment) {
      getSubmissions(selectedAssignment.assignmentId).then((subs) => {
        setSubmissions(subs);
        const mySub = subs.find((s) => s.studentId === currentUser.userId);
        setUserSubmission(mySub || null);

        if (role === 'TEACHER' && subs.length > 0 && !activeGradingSub) {
          selectSubmissionForGrading(subs[0]);
        }
      });
    }
  }, [selectedAssignment, currentUser.userId, role]);

  // Load feedback for student submission
  useEffect(() => {
    const targetSubId = role === 'STUDENT' ? userSubmission?.submissionId : activeGradingSub?.submissionId;
    if (targetSubId) {
      getFeedback(targetSubId).then(setFeedbackList);
    }
  }, [userSubmission, activeGradingSub, role]);

  const selectSubmissionForGrading = (sub: Submission) => {
    setActiveGradingSub(sub);
    setGeneralFeedback(sub.generalFeedback || '');
    if (sub.rubricScores) {
      setRubricScores(sub.rubricScores);
    } else if (selectedAssignment) {
      // Default to 80% marks on all criteria
      const initial: Record<string, number> = {};
      selectedAssignment.rubric.forEach((r) => {
        initial[r.id] = Math.round(r.maxMarks * 0.85);
      });
      setRubricScores(initial);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !selectedCourse) return;
    setIsSubmitting(true);

    const fName = uploadFileName.trim() || `${currentUser.fullName.replace(/\s+/g, '_')}_Assignment1_Report.pdf`;
    const fSize = uploadFileSize || '3.2 MB';

    const sub = await submitAssignment(
      selectedAssignment.assignmentId,
      currentUser.userId,
      currentUser.fullName,
      selectedCourse.courseId,
      fName,
      fSize,
      textAnswer
    );

    setUserSubmission(sub);
    setSubmissions((prev) => [...prev.filter((s) => s.studentId !== currentUser.userId), sub]);
    setIsSubmitting(false);
    addToast('Assignment submitted successfully! Receipt recorded.', 'success');
  };

  const handleSaveGrade = async () => {
    if (!activeGradingSub || !selectedAssignment) return;
    setIsGradingSaving(true);

    const totalScore = (Object.values(rubricScores) as number[]).reduce((a: number, b: number) => a + b, 0);
    const maxMarks = selectedAssignment.maxMarks;
    const pct = Math.round((totalScore / maxMarks) * 100);

    let letter = 'B';
    if (pct >= 90) letter = 'A+';
    else if (pct >= 80) letter = 'A';
    else if (pct >= 70) letter = 'B+';
    else if (pct >= 60) letter = 'B';

    const graded = await gradeSubmission(
      activeGradingSub.submissionId,
      totalScore,
      letter,
      generalFeedback,
      rubricScores,
      currentUser.fullName
    );

    // Update state
    setActiveGradingSub(graded);
    setSubmissions((prev) => prev.map((s) => (s.submissionId === graded.submissionId ? graded : s)));
    setIsGradingSaving(false);
    addToast(`Grade released: ${totalScore}/${maxMarks} (${letter}) for ${activeGradingSub.studentName}`, 'success');
  };

  const handleSendFeedbackReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSubId = role === 'STUDENT' ? userSubmission?.submissionId : activeGradingSub?.submissionId;
    if (!newComment.trim() || !targetSubId) return;

    const msg = await addFeedback(
      targetSubId,
      currentUser.userId,
      currentUser.fullName,
      currentUser.role,
      newComment
    );

    setFeedbackList((prev) => [...prev, msg]);
    setNewComment('');
    addToast('Feedback message sent', 'info');
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim() || !selectedCourse) return;

    const newAssign = await createAssignment({
      courseId: selectedCourse.courseId,
      title: assignTitle,
      description: assignDesc,
      instructions: assignInstructions,
      maxMarks: assignMaxMarks,
      deadline: assignDeadline,
      latePenaltyPercent: 10,
      isPublished: true,
      rubric: [
        { id: 'r1', name: 'System Architecture & 3-Tier Modeling', maxMarks: 40, weight: 40 },
        { id: 'r2', name: 'PostgreSQL Relational Schema & ERD', maxMarks: 30, weight: 30 },
        { id: 'r3', name: 'Security, Sequence Diagrams & Viva Presentation', maxMarks: 30, weight: 30 }
      ]
    });

    setAssignments((prev) => [...prev, newAssign]);
    setSelectedAssignment(newAssign);
    setShowCreateModal(false);
    setAssignTitle('');
    addToast('Assignment published to students!', 'success');
  };

  if (!selectedCourse) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-xs text-center animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#1E3A5F] mb-1">No Active Course Selected</h2>
        <p className="text-xs text-[#5B6B7C] max-w-md mx-auto mb-4">
          Please select or create a course to access student assignments, rubrics, and grading workspaces.
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
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
              Phase 3 · After Class Assessment
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">
            Assignments, Submissions & Rubrics
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-2xl mt-1">
            After collaborative in-class activities, students synthesize their learning by submitting comprehensive architectural reports and receiving rubric-based evaluation.
          </p>
        </div>

        {role === 'TEACHER' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Create Assignment
          </button>
        )}
      </div>

      {/* Assignment Selector Chips */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {assignments.map((a) => (
          <button
            key={a.assignmentId}
            onClick={() => setSelectedAssignment(a)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition whitespace-nowrap flex items-center gap-2 ${
              selectedAssignment?.assignmentId === a.assignmentId
                ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                : 'bg-white text-[#1E3A5F] border-[#E2E8F0] hover:bg-[#EEF3F7]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{a.title}</span>
          </button>
        ))}
      </div>

      {selectedAssignment && (
        <>
          {/* Assignment Brief Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#1E3A5F]">
                  {selectedAssignment.title}
                </h2>
                <div className="flex items-center gap-4 text-xs text-[#5B6B7C] mt-1">
                  <span>Max Marks: <strong className="text-[#0F172A]">{selectedAssignment.maxMarks}</strong></span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Deadline: <strong>{new Date(selectedAssignment.deadline).toLocaleDateString()} at 11:59 PM</strong>
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                Late penalty: {selectedAssignment.latePenaltyPercent}% / day
              </span>
            </div>

            <div className="text-xs text-[#0F172A] leading-relaxed whitespace-pre-line bg-[#F7F9FB] p-4 rounded-xl border border-[#E2E8F0]">
              <strong className="text-[#1E3A5F] block mb-1">Instructions:</strong>
              {selectedAssignment.instructions}
            </div>

            {/* Rubric Criteria Preview */}
            <div>
              <span className="text-[11px] font-bold text-[#5B6B7C] uppercase tracking-wider block mb-2">
                Grading Rubric Criteria ({selectedAssignment.rubric.length} Dimensions)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {selectedAssignment.rubric.map((crit) => (
                  <div key={crit.id} className="p-3 rounded-xl border border-[#E2E8F0] bg-white text-xs space-y-1">
                    <div className="font-semibold text-[#1E3A5F] truncate">{crit.name}</div>
                    <div className="text-[11px] text-[#5B6B7C] flex justify-between">
                      <span>Max Marks:</span>
                      <strong className="text-[#0F766E]">{crit.maxMarks} pts</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= TEACHER GRADING WORKSPACE ================= */}
          {role === 'TEACHER' ? (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-4 bg-[#EEF3F7] border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#1E3A5F] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#0F766E]" />
                  Instructor Interactive Grading Workspace (3-Pane View)
                </h3>
                <span className="text-xs font-semibold text-[#5B6B7C]">
                  {submissions.filter((s) => s.status === 'GRADED').length} of {submissions.length} Submissions Graded
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {/* Pane 1: Submissions Roster List (3 cols) */}
                <div className="lg:col-span-3 p-3 space-y-2 max-h-[600px] overflow-y-auto">
                  <div className="text-[11px] font-bold text-[#5B6B7C] uppercase px-2 py-1">
                    Student Submissions ({submissions.length})
                  </div>
                  {submissions.map((sub) => {
                    const isSelected = activeGradingSub?.submissionId === sub.submissionId;
                    return (
                      <div
                        key={sub.submissionId}
                        onClick={() => selectSubmissionForGrading(sub)}
                        className={`p-3 rounded-xl border cursor-pointer transition text-xs space-y-1 ${
                          isSelected
                            ? 'bg-teal-50/80 border-[#0F766E] shadow-xs'
                            : 'bg-white border-[#E2E8F0] hover:bg-[#F7F9FB]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0F172A]">{sub.studentName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'GRADED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5B6B7C] flex justify-between">
                          <span>{sub.fileName || 'Attached file'}</span>
                          {sub.marksObtained !== undefined && (
                            <span className="font-bold text-[#0F766E]">{sub.marksObtained}/100</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pane 2: Document / Submission Preview (5 cols) */}
                <div className="lg:col-span-5 p-5 space-y-4 max-h-[600px] overflow-y-auto bg-[#F7F9FB]">
                  {activeGradingSub ? (
                    <>
                      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-[#1E3A5F]">
                              {activeGradingSub.studentName}
                            </h4>
                            <span className="text-[11px] font-mono text-[#5B6B7C]">
                              Roll: {activeGradingSub.rollNo || 'CS-2023-042'} · Submitted {new Date(activeGradingSub.submittedAt).toLocaleString()}
                            </span>
                          </div>
                          {activeGradingSub.isLate ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              Late Submission
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              On Time
                            </span>
                          )}
                        </div>

                        {/* File Attachment Card */}
                        <div className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F7F9FB] flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#0F766E]" />
                            <div>
                              <div className="font-semibold text-xs text-[#0F172A]">{activeGradingSub.fileName || 'Assignment_Submission.pdf'}</div>
                              <div className="text-[10px] text-[#5B6B7C]">{activeGradingSub.fileSize || '3.4 MB'}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => addToast('Opening document preview...', 'info')}
                            className="px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0] hover:bg-[#EEF3F7] text-xs font-semibold text-[#1E3A5F] flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5 text-[#0F766E]" />
                            Download
                          </button>
                        </div>
                      </div>

                      {/* Student Text Note */}
                      {activeGradingSub.textAnswer && (
                        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs text-xs space-y-1">
                          <span className="font-semibold text-[#1E3A5F]">Student Remarks & Submission Note:</span>
                          <p className="text-[#5B6B7C] leading-relaxed">
                            {activeGradingSub.textAnswer}
                          </p>
                        </div>
                      )}

                      {/* Threaded Discussion under submission */}
                      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs space-y-3">
                        <span className="text-xs font-bold text-[#1E3A5F] flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-[#0F766E]" />
                          Instructor Feedback Thread
                        </span>

                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {feedbackList.map((msg) => (
                            <div
                              key={msg.feedbackId}
                              className={`p-2.5 rounded-lg text-xs ${
                                msg.fromRole === 'TEACHER' ? 'bg-teal-50/70 border border-teal-200' : 'bg-slate-50 border border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                                <span className={msg.fromRole === 'TEACHER' ? 'text-[#0F766E]' : 'text-[#1E3A5F]'}>
                                  {msg.fromUserName} ({msg.fromRole})
                                </span>
                                <span className="text-slate-400 text-[10px]">Recent</span>
                              </div>
                              <p className="text-[#0F172A] leading-relaxed">{msg.message}</p>
                            </div>
                          ))}
                        </div>

                        <form onSubmit={handleSendFeedbackReply} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add comment to student..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-xs text-[#5B6B7C]">
                      Select a student submission on the left to begin grading.
                    </div>
                  )}
                </div>

                {/* Pane 3: Rubric Scoring Sliders & Grade Form (4 cols) */}
                <div className="lg:col-span-4 p-5 space-y-4 max-h-[600px] overflow-y-auto bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A5F]">
                      Rubric Scoring
                    </span>
                    <div className="text-xs font-bold text-[#0F766E] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                      Total: {(Object.values(rubricScores) as number[]).reduce((a: number, b: number) => a + b, 0)} / {selectedAssignment.maxMarks}
                    </div>
                  </div>

                  {/* Dynamic Rubric Sliders */}
                  <div className="space-y-4">
                    {selectedAssignment.rubric.map((crit) => {
                      const currentVal = rubricScores[crit.id] ?? Math.round(crit.maxMarks * 0.8);

                      return (
                        <div key={crit.id} className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F7F9FB] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#1E3A5F]">{crit.name}</span>
                            <span className="font-bold text-[#0F766E]">
                              {currentVal} / {crit.maxMarks}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={crit.maxMarks}
                            value={currentVal}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setRubricScores((prev) => ({ ...prev, [crit.id]: val }));
                            }}
                            className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* General Feedback Comments with Quick Presets */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#1E3A5F]">
                      Instructor Evaluation Feedback
                    </label>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1">
                      {['Outstanding architectural decoupling', 'Need clearer sequence diagrams', 'Good data modeling'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setGeneralFeedback((prev) => (prev ? `${prev} ${preset}.` : `${preset}.`))}
                          className="px-2 py-0.5 rounded-md bg-[#EEF3F7] hover:bg-[#E2E8F0] text-[10px] text-[#1E3A5F]"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={generalFeedback}
                      onChange={(e) => setGeneralFeedback(e.target.value)}
                      placeholder="Write personalized critique and suggestions for student improvement..."
                      className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                    />
                  </div>

                  {/* Save & Publish Grade CTA */}
                  <button
                    onClick={handleSaveGrade}
                    disabled={isGradingSaving || !activeGradingSub}
                    className="w-full py-2.5 bg-[#0F766E] hover:bg-[#0B5F59] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition"
                  >
                    <Save className="w-4 h-4" />
                    {isGradingSaving ? 'Saving Grade...' : 'Save Grade & Notify Student'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= STUDENT SUBMISSION VIEW ================= */
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-[#1E3A5F] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#0F766E]" />
                Your Submission Status & File Upload
              </h3>

              {userSubmission ? (
                /* Graded or Submitted Receipt */
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <div className="font-bold text-sm text-[#0F172A]">
                            Submission Received ({userSubmission.status})
                          </div>
                          <span className="text-[11px] text-[#5B6B7C]">
                            Timestamp: {new Date(userSubmission.submittedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {userSubmission.status === 'GRADED' && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-extrabold text-emerald-700 bg-white px-3 py-1 rounded-xl border border-emerald-300">
                            {userSubmission.marksObtained} / {selectedAssignment.maxMarks} ({userSubmission.letterGrade})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#0F766E]" />
                        <span className="font-medium text-[#0F172A]">{userSubmission.fileName}</span>
                      </div>
                      <span className="text-[11px] text-[#5B6B7C]">{userSubmission.fileSize}</span>
                    </div>

                    {userSubmission.generalFeedback && (
                      <div className="p-3.5 bg-white rounded-xl border border-teal-200 text-xs space-y-1">
                        <strong className="text-[#0F766E] block font-semibold">
                          Instructor Review (Prof. Tariq Rahman):
                        </strong>
                        <p className="text-[#0F172A] italic leading-relaxed">
                          "{userSubmission.generalFeedback}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Threaded Discussion between Student & Instructor */}
                  <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
                    <span className="text-xs font-bold text-[#1E3A5F] flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-[#0F766E]" />
                      Direct Discussion with Instructor
                    </span>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {feedbackList.map((msg) => (
                        <div
                          key={msg.feedbackId}
                          className={`p-3 rounded-xl text-xs space-y-1 ${
                            msg.fromRole === 'TEACHER' ? 'bg-teal-50/70 border border-teal-200' : 'bg-[#F7F9FB] border border-[#E2E8F0]'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className={msg.fromRole === 'TEACHER' ? 'text-[#0F766E]' : 'text-[#1E3A5F]'}>
                              {msg.fromUserName} {msg.fromRole === 'TEACHER' ? '(Instructor)' : '(You)'}
                            </span>
                            <span className="text-[10px] text-slate-400">Recent</span>
                          </div>
                          <p className="text-[#0F172A] leading-relaxed">{msg.message}</p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendFeedbackReply} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Reply to instructor feedback or ask for clarification..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Reply
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                /* Submission Upload Form */
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div className="p-8 border-2 border-dashed border-teal-300 bg-teal-50/20 rounded-2xl text-center space-y-3 hover:bg-teal-50/40 transition">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-[#1E3A5F]">
                        Upload Architecture Report & Source Diagrams
                      </div>
                      <p className="text-[11px] text-[#5B6B7C]">
                        PDF, ZIP or DOCX up to 25 MB supported.
                      </p>
                    </div>

                    <div className="inline-block">
                      <input
                        type="text"
                        placeholder="File Name (e.g. CS2023_042_Report.pdf)"
                        value={uploadFileName}
                        onChange={(e) => {
                          setUploadFileName(e.target.value);
                          setUploadFileSize('3.4 MB');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs w-64 focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1E3A5F] mb-1">
                      Student Remarks & Summary of Architecture Decisions (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Outline any specific design choices, sequence diagram assumptions, or framework rationale..."
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#0F766E] hover:bg-[#0B5F59] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
                  >
                    <Upload className="w-4 h-4" />
                    {isSubmitting ? 'Uploading & Submitting...' : 'Submit Assignment'}
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
            <h3 className="text-base font-bold text-[#1E3A5F] mb-4">
              Publish New Course Assignment
            </h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Assignment 2: High-Concurrency PostgreSQL Indexing & Optimization"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Detailed criteria, submission guidelines, and required deliverables..."
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={assignMaxMarks}
                    onChange={(e) => setAssignMaxMarks(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Deadline Date & Time</label>
                  <input
                    type="datetime-local"
                    value={assignDeadline}
                    onChange={(e) => setAssignDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#EEF3F7] text-[#1E3A5F] hover:bg-[#E2E8F0] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
