export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string;
  rollNo?: string;
  employeeId?: string;
  semester?: number;
  section?: string;
  phone?: string;
  createdAt: string;
}

export interface Department {
  deptId: string;
  name: string;
  code: string;
  programsCount: number;
  coursesCount: number;
}

export interface Course {
  courseId: string;
  code: string;
  title: string;
  description: string;
  credits: number;
  semester: string;
  departmentId: string;
  teacherId: string;
  teacherName: string;
  coverUrl: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  enrolledStudentsCount: number;
  createdAt?: string;
}

export interface Module {
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
  releaseDate?: string;
  isPublished: boolean;
  lessonsCount?: number;
}

export interface Lesson {
  lessonId: string;
  moduleId: string;
  courseId: string;
  title: string;
  content: string;
  durationMin: number;
  orderIndex: number;
  videoId?: string;
  materialsCount?: number;
}

export interface VideoLecture {
  videoId: string;
  lessonId: string;
  courseId: string;
  title: string;
  url: string;
  durationSec: number;
  thumbnailUrl: string;
  uploadedBy: string;
  uploadedAt?: string;
  transcript?: string;
}

export interface LearningMaterial {
  materialId: string;
  lessonId: string;
  courseId: string;
  title: string;
  type: 'PDF' | 'SLIDES' | 'NOTES' | 'CODE';
  url: string;
  sizeBytes: number;
  downloadsCount: number;
}

export interface VideoProgress {
  id?: string;
  studentId: string;
  videoId: string;
  courseId: string;
  watchedSec: number;
  percent: number;
  completed: boolean;
  lastPosition: number;
  updatedAt: string;
}

export interface MaterialProgress {
  id?: string;
  studentId: string;
  materialId: string;
  courseId: string;
  completed: boolean;
  updatedAt: string;
}

export interface QuizQuestion {
  questionId: string;
  text: string;
  type: 'MCQ' | 'TF' | 'SHORT';
  options: string[];
  correctAnswer: string | number; // index or value
  explanation: string;
  marks: number;
}

export interface Quiz {
  quizId: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  title: string;
  type: 'PRE' | 'POST';
  description: string;
  durationMin: number;
  totalMarks: number;
  maxAttempts: number;
  isPublished: boolean;
  opensAt?: string;
  closesAt?: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  attemptId: string;
  quizId: string;
  studentId: string;
  studentName?: string;
  courseId: string;
  attemptNo: number;
  startedAt: string;
  submittedAt?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT';
  answers: Record<string, string | number>; // questionId -> selected option
}

export interface PhysicalClass {
  classId: string;
  courseId: string;
  moduleId?: string;
  topic: string;
  classDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room: string;
  agenda: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  teacherId: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceRecord {
  id?: string;
  classId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  courseId: string;
  status: AttendanceStatus;
  markedAt: string;
  remarks?: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  maxMarks: number;
  weight: number;
}

export interface Assignment {
  assignmentId: string;
  courseId: string;
  moduleId?: string;
  title: string;
  description: string;
  instructions: string;
  attachmentUrl?: string;
  maxMarks: number;
  deadline: string;
  latePenaltyPercent: number;
  isPublished: boolean;
  rubric: RubricCriterion[];
}

export interface Submission {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  rollNo?: string;
  courseId: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  textAnswer?: string;
  submittedAt: string;
  isLate: boolean;
  status: 'SUBMITTED' | 'GRADED' | 'RESUBMIT';
  marksObtained?: number;
  letterGrade?: string;
  gradedAt?: string;
  gradedBy?: string;
  generalFeedback?: string;
  rubricScores?: Record<string, number>;
}

export interface FeedbackMessage {
  feedbackId: string;
  submissionId: string;
  fromUserId: string;
  fromUserName: string;
  fromRole: UserRole;
  message: string;
  createdAt: string;
}

export interface StudentReadiness {
  studentId: string;
  studentName: string;
  rollNo: string;
  avatarUrl?: string;
  videoCompletionPct: number;
  materialsReadCount: number;
  totalMaterialsCount: number;
  preQuizScorePct: number;
  status: 'READY' | 'PARTIALLY_READY' | 'NOT_READY';
  lastActivityAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'QUIZ' | 'ASSIGNMENT' | 'CLASS' | 'GRADE' | 'SYSTEM';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  logId: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  entity: string;
  entityId: string;
  ip: string;
  createdAt: string;
}
