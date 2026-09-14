import type {
  User,
  Course,
  Module,
  Lesson,
  VideoLecture,
  LearningMaterial,
  Quiz,
  PhysicalClass,
  Assignment,
  Submission,
  AuditLog,
  Department
} from '../types';

// Default mock data removed per user instruction. All data is now driven in real-time from Firestore.
export const INITIAL_DEPARTMENTS: Department[] = [
  {
    deptId: 'dept-edte',
    name: 'Educational Technology and Engineering',
    code: 'EdTE',
    programsCount: 1,
    coursesCount: 0
  },
  {
    deptId: 'dept-ire',
    name: 'IoT and Robotics Engineering',
    code: 'IRE',
    programsCount: 1,
    coursesCount: 0
  },
  {
    deptId: 'dept-cyse',
    name: 'Cyber Security Engineering',
    code: 'CYSE',
    programsCount: 1,
    coursesCount: 0
  },
  {
    deptId: 'dept-dse',
    name: 'Data Science and Engineering',
    code: 'DSE',
    programsCount: 1,
    coursesCount: 0
  },
  {
    deptId: 'dept-swe',
    name: 'Software Engineering',
    code: 'SWE',
    programsCount: 1,
    coursesCount: 0
  }
];

export const INITIAL_USERS: User[] = [];
export const INITIAL_COURSES: Course[] = [];
export const INITIAL_MODULES: Module[] = [];
export const INITIAL_LESSONS: Lesson[] = [];
export const INITIAL_VIDEOS: VideoLecture[] = [];
export const INITIAL_MATERIALS: LearningMaterial[] = [];
export const INITIAL_QUIZZES: Quiz[] = [];
export const INITIAL_PHYSICAL_CLASSES: PhysicalClass[] = [];
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
export const INITIAL_SUBMISSIONS: Submission[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
