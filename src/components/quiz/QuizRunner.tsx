import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Award,
  Check,
  X,
  Plus,
  HelpCircle
} from 'lucide-react';
import type { Quiz, QuizAttempt, QuizQuestion } from '../../types';
import {
  getQuizzes,
  saveQuizAttempt,
  getQuizAttempts,
  createQuiz
} from '../../services/dataService';

interface QuizRunnerProps {
  quizType: 'PRE' | 'POST';
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({ quizType }) => {
  const { selectedCourse, currentUser, role, addToast, openCreateCourseModal } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Active Quiz State
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeftSec, setTimeLeftSec] = useState(600); // 10 mins
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Completed Result
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);
  const [showReview, setShowReview] = useState(false);

  // Teacher Create Quiz Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizDuration, setQuizDuration] = useState(10);
  const emptyQuestion = (): QuizQuestion => ({
  questionId: `q-${Date.now()}`,
  text: '',
  type: 'MCQ',
  options: ['', '', '', ''],
  correctAnswer: 0,
  explanation: '',
  marks: 5
});

const [newQuestions, setNewQuestions] = useState<QuizQuestion[]>([emptyQuestion()]);

  useEffect(() => {
    if (selectedCourse) {
      getQuizzes(selectedCourse.courseId).then((all) => {
        const filtered = all.filter((q) => q.type === quizType);
        setQuizzes(filtered);
        if (filtered.length > 0 && !selectedQuiz) {
          setSelectedQuiz(filtered[0]);
        }
      });
    }
  }, [selectedCourse, quizType]);

  // Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isQuizActive && timeLeftSec > 0) {
      timer = setInterval(() => {
        setTimeLeftSec((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isQuizActive, timeLeftSec]);

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setAnswers({});
    setFlagged({});
    setCurrentQuestionIndex(0);
    setTimeLeftSec(quiz.durationMin * 60);
    setIsQuizActive(true);
    setLatestAttempt(null);
    setShowReview(false);
    addToast('Quiz started! Good luck.', 'info');
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleAutoSubmit = () => {
    addToast('⏰ Time is up! Submitting answers automatically...', 'info');
    handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz) return;
    setShowSubmitModal(false);

    // Calculate score
    let score = 0;
    selectedQuiz.questions.forEach((q) => {
      const selected = answers[q.questionId];
      if (selected !== undefined && selected === q.correctAnswer) {
        score += q.marks;
      }
    });

    const attempt = await saveQuizAttempt(
      selectedQuiz.quizId,
      currentUser.userId,
      currentUser.fullName,
      selectedCourse?.courseId || 'course-swe301',
      answers,
      score,
      selectedQuiz.totalMarks
    );

    setLatestAttempt(attempt);
    setIsQuizActive(false);
    setShowReview(true);
    addToast(`Quiz submitted! You scored ${score}/${selectedQuiz.totalMarks} (${attempt.percentage}%)`, 'success');
  };

  const handleSaveNewQuiz = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!quizTitle.trim() || !selectedCourse) return;

  const invalid = newQuestions.some(
    (q) => !q.text.trim() || q.options.some((o) => !o.trim())
  );
  if (invalid) {
    addToast('Please fill in every question and all its options.', 'error');
    return;
  }

  try {
    const totalMarks = newQuestions.reduce((acc, q) => acc + q.marks, 0);
    const created = await createQuiz({
      courseId: selectedCourse.courseId,
      title: quizTitle,
      type: quizType,
      description: quizDesc,
      durationMin: quizDuration,
      totalMarks,
      maxAttempts: quizType === 'PRE' ? 1 : 3,
      isPublished: true,
      questions: newQuestions
    });

    setQuizzes((prev) => [...prev, created]);
    setSelectedQuiz(created);
    setShowCreateModal(false);
    setQuizTitle('');
    setQuizDesc('');
    setNewQuestions([emptyQuestion()]); // reset for next quiz
    addToast('Quiz published successfully!', 'success');
  } catch (err) {
    console.error('Quiz creation failed:', err);
    addToast('Failed to create quiz — check permissions or connection.', 'error');
  }
};

const updateQuestionField = (index: number, field: keyof QuizQuestion, value: any) => {
    setNewQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setNewQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, oi) => (oi === optIndex ? value : o)) }
          : q
      )
    );
  };

  const addQuestion = () => {
    setNewQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const removeQuestion = (index: number) => {
    setNewQuestions((prev) => prev.filter((_, i) => i !== index));
  };
  
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. ACTIVE QUIZ RUNNER INTERFACE
  if (isQuizActive && selectedQuiz) {
    const currentQ = selectedQuiz.questions[currentQuestionIndex];
    const totalQuestions = selectedQuiz.questions.length;
    const answeredCount = Object.keys(answers).length;
    const isLowTime = timeLeftSec < 120;

    return (
      <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-150">
        {/* Top Sticky Quiz Bar */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider">
              {quizType === 'PRE' ? 'Pre-Class Readiness Quiz' : 'Post-Class Mastery Quiz'}
            </span>
            <h2 className="text-sm font-bold text-[#1E3A5F]">
              {selectedQuiz.title}
            </h2>
          </div>

          {/* Circular/Box Timer */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-sm font-bold transition ${
              isLowTime
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                : 'bg-teal-50 text-[#0F766E] border-teal-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeLeftSec)}</span>
          </div>
        </div>

        {/* Question Navigator Grid */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5B6B7C]">Question:</span>
            {selectedQuiz.questions.map((q, idx) => {
              const isAnswered = answers[q.questionId] !== undefined;
              const isFlagged = flagged[q.questionId];
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition flex items-center justify-center border ${
                    isCurrent
                      ? 'ring-2 ring-[#0F766E] border-[#0F766E]'
                      : ''
                  } ${
                    isAnswered
                      ? 'bg-[#0F766E] text-white border-[#0F766E]'
                      : isFlagged
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-[#EEF3F7] text-[#5B6B7C] border-[#E2E8F0]'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-[#5B6B7C]">
            Answered: <span className="font-semibold text-[#0F766E]">{answeredCount}</span> of {totalQuestions}
          </div>
        </div>

        {/* Current Question Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#0F766E] uppercase tracking-wider">
                Question {currentQuestionIndex + 1} of {totalQuestions} · {currentQ.marks} Marks
              </span>
              <h3 className="text-base sm:text-lg font-semibold text-[#0F172A] leading-relaxed">
                {currentQ.text}
              </h3>
            </div>

            <button
              onClick={() => toggleFlag(currentQ.questionId)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                flagged[currentQ.questionId]
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-white text-[#5B6B7C] border-[#E2E8F0] hover:bg-[#EEF3F7]'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">
                {flagged[currentQ.questionId] ? 'Flagged' : 'Flag'}
              </span>
            </button>
          </div>

          {/* Option Cards */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = answers[currentQ.questionId] === optIdx;

              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQ.questionId, optIdx)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-50/70 border-[#0F766E] text-[#0F766E] shadow-xs'
                      : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#F7F9FB] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'border-[#0F766E] bg-[#0F766E] text-white'
                          : 'border-slate-300 text-[#5B6B7C]'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{option}</span>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-[#0F766E]" />}
                </div>
              );
            })}
          </div>

          {/* Bottom Step Actions */}
          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="px-4 py-2 bg-[#EEF3F7] hover:bg-[#E2E8F0] disabled:opacity-40 text-[#1E3A5F] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                Next Question
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                Submit Quiz
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-3">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1E3A5F] mb-1">
                Confirm Quiz Submission
              </h3>
              <p className="text-xs text-[#5B6B7C] mb-4">
                You have answered <span className="font-semibold text-[#0F766E]">{answeredCount}</span> of {totalQuestions} questions.
                {answeredCount < totalQuestions && (
                  <span className="block text-amber-700 font-semibold mt-1">
                    Warning: You have {totalQuestions - answeredCount} unanswered question(s).
                  </span>
                )}
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-[#EEF3F7] text-[#1E3A5F] hover:bg-[#E2E8F0] rounded-xl text-xs font-semibold"
                >
                  Review Answers
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold"
                >
                  Yes, Submit Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. QUIZ RESULT REVIEW SCREEN
  if (showReview && latestAttempt && selectedQuiz) {
    const isPassed = latestAttempt.percentage >= 60;

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Result Hero Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xs text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-teal-50 text-[#0F766E]">
            <Award className="w-10 h-10" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              Quiz Evaluated
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A5F] mt-2">
              You Scored {latestAttempt.score} / {latestAttempt.totalMarks} ({latestAttempt.percentage}%)
            </h2>
            <p className="text-xs text-[#5B6B7C] max-w-lg mx-auto mt-1">
              {quizType === 'PRE'
                ? isPassed
                  ? 'Congratulations! Your preparation status is marked as READY for Wednesday’s lab session.'
                  : 'Review the explanations below to brush up on architectural concepts before class.'
                : 'Great work reinforcing your knowledge following our in-class collaborative activity.'}
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setShowReview(false)}
              className="px-4 py-2 bg-[#EEF3F7] hover:bg-[#E2E8F0] text-[#1E3A5F] rounded-xl text-xs font-semibold transition"
            >
              Back to Quizzes
            </button>
            {quizType === 'POST' && (
              <button
                onClick={() => startQuiz(selectedQuiz)}
                className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake Quiz (Improve Score)
              </button>
            )}
          </div>
        </div>

        {/* Detailed Question Review Breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#1E3A5F]">
            Detailed Solution & Explanations Review
          </h3>

          {selectedQuiz.questions.map((q, idx) => {
            const userChoice = latestAttempt.answers[q.questionId];
            const isCorrect = userChoice === q.correctAnswer;

            return (
              <div
                key={q.questionId}
                className={`bg-white rounded-2xl p-5 border ${
                  isCorrect ? 'border-emerald-200' : 'border-rose-200'
                } shadow-xs space-y-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-xs text-[#0F172A]">
                    <span className="text-[#5B6B7C] mr-2">Q{idx + 1}.</span>
                    {q.text}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {isCorrect ? `+${q.marks} Marks (Correct)` : '0 Marks'}
                  </span>
                </div>

                {/* Options Review */}
                <div className="space-y-1.5 text-xs">
                  {q.options.map((opt, optIdx) => {
                    const isUserChoice = userChoice === optIdx;
                    const isCorrectAnswer = q.correctAnswer === optIdx;

                    let rowStyle = 'bg-[#F7F9FB] border-transparent text-[#5B6B7C]';
                    if (isCorrectAnswer) {
                      rowStyle = 'bg-emerald-50/80 border-emerald-300 text-emerald-800 font-semibold';
                    } else if (isUserChoice && !isCorrect) {
                      rowStyle = 'bg-rose-50/80 border-rose-300 text-rose-800 font-semibold line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${rowStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[11px]">{String.fromCharCode(65 + optIdx)}.</span>
                          <span>{opt}</span>
                        </div>
                        {isCorrectAnswer && (
                          <span className="text-[10px] font-bold text-emerald-700">Correct Answer</span>
                        )}
                        {isUserChoice && !isCorrect && (
                          <span className="text-[10px] font-bold text-rose-700">Your Selection</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pedagogical Explanation */}
                <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200 text-xs text-[#0F172A] leading-relaxed">
                  <span className="font-semibold text-[#0F766E] flex items-center gap-1 mb-0.5">
                    <HelpCircle className="w-3.5 h-3.5" /> Explanation:
                  </span>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. QUIZ INTRO / LIST SCREEN
  if (!selectedCourse) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-xs text-center animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#1E3A5F] mb-1">No Active Course Selected</h2>
        <p className="text-xs text-[#5B6B7C] max-w-md mx-auto mb-4">
          Please select or create a course to take or manage {quizType === 'PRE' ? 'pre-class readiness' : 'post-class mastery'} quizzes.
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
      {/* Quiz Category Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-teal-50 text-[#0F766E] border border-teal-200">
              {quizType === 'PRE' ? 'Phase 1 · Pre-Class Assessment' : 'Phase 3 · Post-Class Mastery'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">
            {quizType === 'PRE' ? 'Pre-Class Readiness Quizzes' : 'Post-Class Reinforcement Quizzes'}
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-2xl mt-1">
            {quizType === 'PRE'
              ? 'Complete these short diagnostic assessments before coming to physical sessions to qualify your preparation readiness.'
              : 'Test your retention and post-class mastery to earn badges and track learning gains.'}
          </p>
        </div>

        {role === 'TEACHER' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Create {quizType === 'PRE' ? 'Pre-Quiz' : 'Post-Quiz'}
          </button>
        )}
      </div>

      {quizzes.length === 0 && (
        <div className="bg-white rounded-2xl p-10 border border-dashed border-[#E2E8F0] text-center shadow-xs">
          <HelpCircle className="w-8 h-8 text-[#0F766E] mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-bold text-[#1E3A5F]">No {quizType === 'PRE' ? 'Pre-Class' : 'Post-Class'} Quizzes Configured</h3>
          <p className="text-xs text-[#5B6B7C] max-w-sm mx-auto mt-1 mb-4">
            {role === 'TEACHER'
              ? `Click "Create ${quizType === 'PRE' ? 'Pre-Quiz' : 'Post-Quiz'}" to define diagnostic multiple-choice questions for your students.`
              : 'Your instructor has not published a quiz for this course yet.'}
          </p>
          {role === 'TEACHER' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              + Create First Quiz
            </button>
          )}
        </div>
      )}

      {/* Quizzes List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map((quiz) => (
          <div
            key={quiz.quizId}
            className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-300 transition"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold bg-[#EEF3F7] text-[#1E3A5F] px-2 py-0.5 rounded-md">
                  {quiz.durationMin} Minutes · {quiz.totalMarks} Marks
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Published
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#1E3A5F] mb-1">
                {quiz.title}
              </h3>
              <p className="text-xs text-[#5B6B7C] leading-relaxed">
                {quiz.description}
              </p>

              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#5B6B7C]">
                <span>Questions: <strong className="text-[#0F172A]">{quiz.questions.length} MCQs</strong></span>
                <span>Max Attempts: <strong className="text-[#0F172A]">{quiz.maxAttempts}</strong></span>
              </div>
            </div>

            <button
              onClick={() => startQuiz(quiz)}
              className="w-full py-2.5 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition"
            >
              <FileCheck2 className="w-4 h-4 text-amber-300" />
              {role === 'STUDENT' ? 'Start Quiz Now' : 'Preview / Test Quiz'}
            </button>
          </div>
        ))}
      </div>

      {/* Teacher Create Quiz Modal */}
      {showCreateModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
    <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
      <h3 className="text-base font-bold text-[#1E3A5F] mb-4">
        Configure New {quizType === 'PRE' ? 'Pre-Class' : 'Post-Class'} Quiz
      </h3>
      <form onSubmit={handleSaveNewQuiz} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Quiz Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Module 2 Pre-Class Schema Modeling Quiz"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Instructions / Description</label>
          <textarea
            rows={2}
            placeholder="Instructions for students..."
            value={quizDesc}
            onChange={(e) => setQuizDesc(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Time Limit (Minutes)</label>
          <input
            type="number"
            min={3}
            max={60}
            value={quizDuration}
            onChange={(e) => setQuizDuration(parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
          />
        </div>

        <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#1E3A5F]">Questions</label>
            <button
              type="button"
              onClick={addQuestion}
              className="text-xs font-semibold text-[#0F766E] flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
          </div>

          {newQuestions.map((q, qIdx) => (
            <div key={q.questionId} className="p-4 rounded-xl border border-[#E2E8F0] space-y-3 bg-[#F7F9FB]">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-[#5B6B7C]">Question {qIdx + 1}</span>
                {newQuestions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(qIdx)} className="text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <textarea
                required
                placeholder="Question text"
                value={q.text}
                onChange={(e) => updateQuestionField(qIdx, 'text', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
              />

              {q.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${q.questionId}`}
                    checked={q.correctAnswer === optIdx}
                    onChange={() => updateQuestionField(qIdx, 'correctAnswer', optIdx)}
                  />
                  <input
                    type="text"
                    required
                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                    value={opt}
                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
              ))}

              <textarea
                placeholder="Explanation (shown after submission)"
                value={q.explanation}
                onChange={(e) => updateQuestionField(qIdx, 'explanation', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <label className="text-xs text-[#5B6B7C]">Marks:</label>
                <input
                  type="number"
                  min={1}
                  value={q.marks}
                  onChange={(e) => updateQuestionField(qIdx, 'marks', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 rounded-lg border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>
            </div>
          ))}
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
            Publish Quiz
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
};
