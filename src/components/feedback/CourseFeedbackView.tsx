import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Send,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Filter,
  User,
  ShieldCheck,
  Reply,
  HelpCircle,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import {
  getCourseFeedback,
  submitCourseFeedback,
  replyCourseFeedback,
  subscribeToCourseFeedback
} from '../../services/dataService';
import type { CourseFeedback } from '../../types';

export const CourseFeedbackView: React.FC = () => {
  const { currentUser, selectedCourse, role, addToast } = useAuth();
  const [feedbacks, setFeedbacks] = useState<CourseFeedback[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  // New Feedback Form (Student)
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'LECTURE_CLARITY' | 'PACE' | 'ASSIGNMENT_DIFFICULTY' | 'GENERAL'>('LECTURE_CLARITY');
  const [rating, setRating] = useState<number>(5);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Teacher Reply State
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [isReplying, setIsReplying] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedCourse) return;

    setLoading(true);
    const unsubscribe = subscribeToCourseFeedback(selectedCourse.courseId, (data) => {
      setFeedbacks(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedCourse]);

  if (!selectedCourse) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-xs text-center">
        <BookOpen className="w-10 h-10 text-[#0F766E] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#1E3A5F]">No Active Course Selected</h3>
        <p className="text-xs text-[#5B6B7C] mt-1">Please select an enrolled or assigned course from the top menu.</p>
      </div>
    );
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      addToast('Please enter both a topic and message for your feedback', 'error');
      return;
    }

    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      await submitCourseFeedback({
        courseId: selectedCourse.courseId,
        studentId: currentUser.userId,
        studentName: currentUser.fullName,
        studentRollNo: currentUser.rollNo || 'STD-2026',
        category,
        subject: subject.trim(),
        message: message.trim(),
        rating,
        isAnonymous
      });

      addToast('Feedback submitted successfully! Your instructor can now view and reply.', 'success');
      setSubject('');
      setMessage('');
      setRating(5);
      setIsAnonymous(false);
    } catch {
      addToast('Failed to submit feedback. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (feedbackId: string) => {
    if (!replyText.trim()) {
      addToast('Please enter a response message', 'error');
      return;
    }

    setIsReplying(true);
    try {
      await replyCourseFeedback(feedbackId, replyText.trim(), currentUser?.fullName || 'Faculty Instructor');
      addToast('Response posted to student inquiry!', 'success');
      setReplyingId(null);
      setReplyText('');
    } catch {
      addToast('Failed to post reply.', 'error');
    } finally {
      setIsReplying(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (categoryFilter === 'ALL') return true;
    return fb.category === categoryFilter;
  });

  const categoryLabels: Record<string, string> = {
    LECTURE_CLARITY: 'Pre-Class Lecture Clarity',
    PACE: 'Course Pace & Workload',
    ASSIGNMENT_DIFFICULTY: 'Assignment Difficulty',
    GENERAL: 'General Course Inquiry'
  };

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / feedbacks.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Continuous Improvement Feedback Loop
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">
            Course Feedback & Student Inquiries ({selectedCourse.code})
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-2xl mt-1">
            Empower students to raise questions about flipped lecture clarity, pacing, and assignment difficulty, while instructors respond in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#F7F9FB] px-4 py-2 rounded-xl border border-[#E2E8F0]">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-[#5B6B7C]">Cohort Satisfaction</div>
            <div className="text-lg font-bold text-[#1E3A5F] flex items-center gap-1">
              <span>{avgRating}</span>
              <span className="text-xs text-amber-500">★</span>
              <span className="text-[11px] font-normal text-[#5B6B7C]">({feedbacks.length} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Submit Form OR Teacher Instructions */}
        <div className="lg:col-span-1 space-y-4">
          {role === 'STUDENT' ? (
            <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
              <h2 className="text-sm font-bold text-[#1E3A5F] flex items-center gap-2 mb-1">
                <Send className="w-4 h-4 text-[#0F766E]" />
                Submit Feedback / Inquiry
              </h2>
              <p className="text-xs text-[#5B6B7C] mb-4">
                Share your thoughts on lecture clarity, pacing, or specific topics with your teacher.
              </p>

              <form onSubmit={handleSubmitFeedback} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#1E3A5F] mb-1">Topic / Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-[#1E3A5F] focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="LECTURE_CLARITY">Pre-Class Lecture Clarity</option>
                    <option value="PACE">Course Pace & Workload</option>
                    <option value="ASSIGNMENT_DIFFICULTY">Assignment Difficulty</option>
                    <option value="GENERAL">General Course Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1E3A5F] mb-1">Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 rounded-md transition ${star <= rating ? 'text-amber-500' : 'text-slate-300'}`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                    <span className="text-[11px] font-semibold text-[#5B6B7C] ml-2">
                      {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : 'Needs Help'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1E3A5F] mb-1">Subject / Question Summary *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Need clarification on Module 2 normalization"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1E3A5F] mb-1">Detailed Message / Notes *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Explain what was easy, what was confusing, or what you would like revisited during in-person class..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="anonymousCheck"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-[#E2E8F0] text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <label htmlFor="anonymousCheck" className="text-[11px] text-[#5B6B7C] select-none cursor-pointer">
                    Submit anonymously (name & roll hidden from instructor)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl font-bold transition shadow-xs flex items-center justify-center gap-2 mt-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Post Course Feedback'}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F]">
                <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
                Instructor Feedback Hub
              </div>
              <p className="text-xs text-[#5B6B7C] leading-relaxed">
                Review questions and ratings submitted by enrolled students for <strong>{selectedCourse.code}</strong>. You can respond directly to address learning bottlenecks before the next in-person session.
              </p>

              <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-teal-900 text-xs space-y-2">
                <div className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#0F766E]" />
                  Pedagogical Tip
                </div>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  Look for patterns in pre-class lecture feedback to adjust your physical classroom agenda. If multiple students report confusion on a specific topic, schedule a dedicated group sprint.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Feedbacks List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#5B6B7C]" />
                <span className="text-xs font-bold text-[#1E3A5F]">Filter by Topic:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'LECTURE_CLARITY', 'PACE', 'ASSIGNMENT_DIFFICULTY', 'GENERAL'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      categoryFilter === cat
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-[#F7F9FB] text-[#5B6B7C] hover:bg-[#EEF3F7]'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Feedback' : categoryLabels[cat] || cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="py-12 text-center text-xs text-[#5B6B7C]">Loading course feedback...</div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-[#E2E8F0] rounded-xl my-4 text-xs text-[#5B6B7C]">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No feedback submitted yet for this category.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 pt-2">
                {filteredFeedbacks.map((fb) => (
                  <div key={fb.feedbackId} className="py-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1E3A5F]">{fb.subject}</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 text-[#0F766E] border border-teal-200">
                            {categoryLabels[fb.category] || fb.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5B6B7C] flex items-center gap-2 mt-0.5">
                          <span>{fb.isAnonymous ? 'Anonymous Student' : `${fb.studentName} (${fb.studentRollNo})`}</span>
                          <span>•</span>
                          <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-amber-500 text-xs font-bold shrink-0">
                        {Array.from({ length: fb.rating || 5 }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#1E3A5F] bg-[#F7F9FB] p-3 rounded-xl border border-[#E2E8F0]/70 leading-relaxed">
                      "{fb.message}"
                    </p>

                    {/* Teacher Reply Section */}
                    {fb.reply ? (
                      <div className="ml-4 pl-3 border-l-2 border-[#0F766E] bg-teal-50/50 p-3 rounded-r-xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#0F766E]">
                          <span className="flex items-center gap-1.5">
                            <Reply className="w-3 h-3 rotate-180" />
                            Instructor Response ({fb.replyBy || 'Teacher'})
                          </span>
                          <span className="text-[10px] text-[#5B6B7C]">
                            {fb.repliedAt ? new Date(fb.repliedAt).toLocaleDateString() : 'Answered'}
                          </span>
                        </div>
                        <p className="text-slate-800 leading-relaxed italic">
                          "{fb.reply}"
                        </p>
                      </div>
                    ) : (
                      (role === 'TEACHER' || role === 'ADMIN') && (
                        <div>
                          {replyingId === fb.feedbackId ? (
                            <div className="ml-4 p-3 bg-[#F7F9FB] rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
                              <label className="block font-semibold text-[#1E3A5F]">
                                Write Response to Student Inquiry:
                              </label>
                              <textarea
                                rows={2}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Explain the concept or acknowledge the suggestion..."
                                className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingId(null);
                                    setReplyText('');
                                  }}
                                  className="px-3 py-1 text-xs text-[#5B6B7C] hover:underline"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={isReplying}
                                  onClick={() => handleSendReply(fb.feedbackId)}
                                  className="px-3 py-1 bg-[#0F766E] text-white rounded-lg font-semibold hover:bg-[#0B5F59] transition"
                                >
                                  {isReplying ? 'Posting...' : 'Post Reply'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setReplyingId(fb.feedbackId);
                                setReplyText('');
                              }}
                              className="text-[11px] font-semibold text-[#0F766E] hover:underline flex items-center gap-1 ml-2"
                            >
                              <Reply className="w-3 h-3" /> Reply to Feedback
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
