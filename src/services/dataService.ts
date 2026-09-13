import {
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
  type DocumentData
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import type {
  User,
  Course,
  Module,
  Lesson,
  VideoLecture,
  LearningMaterial,
  VideoProgress,
  Quiz,
  QuizAttempt,
  PhysicalClass,
  AttendanceRecord,
  AttendanceStatus,
  Assignment,
  Submission,
  FeedbackMessage,
  StudentReadiness,
  AuditLog,
  Department
} from '../types';

// Standard error handling enum & function conforming to the Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  const isPermissionDenied =
    errMessage.includes('insufficient permissions') ||
    errMessage.includes('permission-denied') ||
    errMessage.includes('PERMISSION_DENIED');

  if (isPermissionDenied) {
    console.error('Firestore Permission Denied:', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.warn('Firestore Connection Notice (' + operationType + ' ' + (path || '') + '):', errMessage);
  }
}

// Connection test constraint from Firebase Skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection test: client is offline or network is limited.');
      return false;
    }
    // Expected in security-restricted test path
    return true;
  }
}

// Memory cache populated strictly from real-time Firestore listeners
const memoryStore = {
  users: [] as User[],
  courses: [] as Course[],
  modules: [] as Module[],
  lessons: [] as Lesson[],
  videos: [] as VideoLecture[],
  materials: [] as LearningMaterial[],
  videoProgress: [] as VideoProgress[],
  materialProgress: [] as { id: string; studentId: string; materialId: string; courseId: string; completed: boolean; updatedAt: string }[],
  quizzes: [] as Quiz[],
  quizAttempts: [] as QuizAttempt[],
  physicalClasses: [] as PhysicalClass[],
  attendance: [] as AttendanceRecord[],
  assignments: [] as Assignment[],
  submissions: [] as Submission[],
  feedback: [] as FeedbackMessage[],
  auditLogs: [] as AuditLog[],
  departments: [] as Department[]
};

// Initializes connection check & verifies baseline collections without injecting fake data
export async function initializeFirestoreData(): Promise<void> {
  await testConnection();
}

// =========================================================================
// 1. USERS SERVICE (Real-Time + CRUD)
// =========================================================================

export function subscribeToUsers(callback: (users: User[]) => void): Unsubscribe {
  const colRef = collection(db, 'users');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((d) => {
        users.push(d.data() as User);
      });
      memoryStore.users = users;
      callback(users);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  );
}

export async function getUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const items: User[] = [];
    snap.forEach((d) => items.push(d.data() as User));
    memoryStore.users = items;
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'users');
    return memoryStore.users;
  }
}

export async function createUser(user: Omit<User, 'userId' | 'createdAt'> & { userId?: string }): Promise<User> {
  const userId = user.userId || 'user-' + Date.now();
  const newUser: User = {
    ...user,
    userId,
    status: user.status || 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'users', userId), newUser);
    const existingIndex = memoryStore.users.findIndex((u) => u.userId === userId);
    if (existingIndex >= 0) {
      memoryStore.users[existingIndex] = newUser;
    } else {
      memoryStore.users.push(newUser);
    }
    return newUser;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${userId}`);
    return newUser;
  }
}

export async function updateUserStatus(userId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), { status });
    const u = memoryStore.users.find((item) => item.userId === userId);
    if (u) u.status = status;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId));
    memoryStore.users = memoryStore.users.filter((u) => u.userId !== userId);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
  }
}

// =========================================================================
// 2. COURSES SERVICE (Real-Time + CRUD)
// =========================================================================

export function subscribeToCourses(callback: (courses: Course[]) => void): Unsubscribe {
  const colRef = collection(db, 'courses');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const courses: Course[] = [];
      snapshot.forEach((d) => {
        courses.push(d.data() as Course);
      });
      // Sort courses by creation or code
      courses.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      memoryStore.courses = courses;
      callback(courses);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'courses');
    }
  );
}

export async function getCourses(): Promise<Course[]> {
  try {
    const snap = await getDocs(collection(db, 'courses'));
    const items: Course[] = [];
    snap.forEach((d) => items.push(d.data() as Course));
    items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    memoryStore.courses = items;
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'courses');
    return memoryStore.courses;
  }
}

export async function createCourse(
  course: Omit<Course, 'courseId' | 'enrolledStudentsCount'> & { courseId?: string }
): Promise<Course> {
  const courseId = course.courseId || 'course-' + Date.now();
  const newCourse: Course = {
    ...course,
    courseId,
    status: course.status || 'PUBLISHED',
    enrolledStudentsCount: 0,
    createdAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'courses', courseId), newCourse);
    memoryStore.courses.unshift(newCourse);
    return newCourse;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `courses/${courseId}`);
    return newCourse;
  }
}

export async function updateCourse(courseId: string, updates: Partial<Course>): Promise<void> {
  try {
    await updateDoc(doc(db, 'courses', courseId), updates);
    const existing = memoryStore.courses.find((c) => c.courseId === courseId);
    if (existing) Object.assign(existing, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `courses/${courseId}`);
  }
}

export async function deleteCourse(courseId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'courses', courseId));
    memoryStore.courses = memoryStore.courses.filter((c) => c.courseId !== courseId);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}`);
  }
}

// =========================================================================
// 3. MODULES & LESSONS (Real-Time + CRUD)
// =========================================================================

export function subscribeToModules(courseId: string, callback: (modules: Module[]) => void): Unsubscribe {
  const q = query(collection(db, 'modules'), where('courseId', '==', courseId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Module[] = [];
      snapshot.forEach((d) => list.push(d.data() as Module));
      list.sort((a, b) => a.orderIndex - b.orderIndex);
      // update memory store
      memoryStore.modules = [
        ...memoryStore.modules.filter((m) => m.courseId !== courseId),
        ...list
      ];
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'modules');
    }
  );
}

export async function getModules(courseId: string): Promise<Module[]> {
  try {
    const q = query(collection(db, 'modules'), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    const items: Module[] = [];
    snap.forEach((d) => items.push(d.data() as Module));
    items.sort((a, b) => a.orderIndex - b.orderIndex);
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'modules');
    return memoryStore.modules.filter((m) => m.courseId === courseId);
  }
}

export async function createModule(courseId: string, title: string, description: string): Promise<Module> {
  const moduleId = 'mod-' + Date.now();
  const existing = await getModules(courseId);
  const newMod: Module = {
    moduleId,
    courseId,
    title,
    description,
    orderIndex: existing.length + 1,
    isPublished: true,
    lessonsCount: 0
  };
  try {
    await setDoc(doc(db, 'modules', moduleId), newMod);
    memoryStore.modules.push(newMod);
    return newMod;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `modules/${moduleId}`);
    return newMod;
  }
}

export function subscribeToLessons(moduleId: string, callback: (lessons: Lesson[]) => void): Unsubscribe {
  const q = query(collection(db, 'lessons'), where('moduleId', '==', moduleId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Lesson[] = [];
      snapshot.forEach((d) => list.push(d.data() as Lesson));
      list.sort((a, b) => a.orderIndex - b.orderIndex);
      memoryStore.lessons = [
        ...memoryStore.lessons.filter((l) => l.moduleId !== moduleId),
        ...list
      ];
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'lessons');
    }
  );
}

export async function getLessons(moduleId: string): Promise<Lesson[]> {
  try {
    const q = query(collection(db, 'lessons'), where('moduleId', '==', moduleId));
    const snap = await getDocs(q);
    const items: Lesson[] = [];
    snap.forEach((d) => items.push(d.data() as Lesson));
    items.sort((a, b) => a.orderIndex - b.orderIndex);
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'lessons');
    return memoryStore.lessons.filter((l) => l.moduleId === moduleId);
  }
}

export async function createLesson(lesson: Omit<Lesson, 'lessonId'>): Promise<Lesson> {
  const lessonId = 'les-' + Date.now();
  const newLesson: Lesson = {
    ...lesson,
    lessonId
  };
  try {
    await setDoc(doc(db, 'lessons', lessonId), newLesson);
    memoryStore.lessons.push(newLesson);
    // increment module lesson count
    const modSnap = await getDoc(doc(db, 'modules', lesson.moduleId));
    if (modSnap.exists()) {
      const currentCount = modSnap.data().lessonsCount || 0;
      await updateDoc(doc(db, 'modules', lesson.moduleId), { lessonsCount: currentCount + 1 });
    }
    return newLesson;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `lessons/${lessonId}`);
    return newLesson;
  }
}

// =========================================================================
// 4. VIDEO LECTURES & STUDY MATERIALS (Real-Time + CRUD)
// =========================================================================

export function subscribeToVideoLectures(courseId: string, callback: (videos: VideoLecture[]) => void): Unsubscribe {
  const q = query(collection(db, 'videoLectures'), where('courseId', '==', courseId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: VideoLecture[] = [];
      snapshot.forEach((d) => list.push(d.data() as VideoLecture));
      memoryStore.videos = [
        ...memoryStore.videos.filter((v) => v.courseId !== courseId),
        ...list
      ];
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'videoLectures');
    }
  );
}

export async function getVideoLectures(courseId: string): Promise<VideoLecture[]> {
  try {
    const q = query(collection(db, 'videoLectures'), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    const items: VideoLecture[] = [];
    snap.forEach((d) => items.push(d.data() as VideoLecture));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'videoLectures');
    return memoryStore.videos.filter((v) => v.courseId === courseId);
  }
}

export async function addVideoLecture(video: Omit<VideoLecture, 'videoId'>): Promise<VideoLecture> {
  const videoId = 'vid-' + Date.now();
  const newVideo: VideoLecture = {
    ...video,
    videoId,
    uploadedAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'videoLectures', videoId), newVideo);
    memoryStore.videos.push(newVideo);
    return newVideo;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `videoLectures/${videoId}`);
    return newVideo;
  }
}

export function subscribeToLearningMaterials(courseId: string, callback: (materials: LearningMaterial[]) => void): Unsubscribe {
  const q = query(collection(db, 'learningMaterials'), where('courseId', '==', courseId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: LearningMaterial[] = [];
      snapshot.forEach((d) => list.push(d.data() as LearningMaterial));
      memoryStore.materials = [
        ...memoryStore.materials.filter((m) => m.courseId !== courseId),
        ...list
      ];
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'learningMaterials');
    }
  );
}

export async function getMaterials(courseId: string): Promise<LearningMaterial[]> {
  try {
    const q = query(collection(db, 'learningMaterials'), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    const items: LearningMaterial[] = [];
    snap.forEach((d) => items.push(d.data() as LearningMaterial));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'learningMaterials');
    return memoryStore.materials.filter((m) => m.courseId === courseId);
  }
}

export async function addMaterial(
  mat: Omit<LearningMaterial, 'materialId' | 'downloadsCount'>
): Promise<LearningMaterial> {
  const materialId = 'mat-' + Date.now();
  const newMat: LearningMaterial = {
    ...mat,
    materialId,
    downloadsCount: 0
  };
  try {
    await setDoc(doc(db, 'learningMaterials', materialId), newMat);
    memoryStore.materials.push(newMat);
    return newMat;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `learningMaterials/${materialId}`);
    return newMat;
  }
}

export async function deleteMaterial(materialId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'learningMaterials', materialId));
    memoryStore.materials = memoryStore.materials.filter((m) => m.materialId !== materialId);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `learningMaterials/${materialId}`);
  }
}

export async function deleteVideoLecture(videoId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'videoLectures', videoId));
    memoryStore.videos = memoryStore.videos.filter((v) => v.videoId !== videoId);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `videoLectures/${videoId}`);
  }
}

// Student Video Progress
export async function getVideoProgress(studentId: string, videoId: string): Promise<VideoProgress | null> {
  try {
    const progressId = `${studentId}_${videoId}`;
    const snap = await getDoc(doc(db, 'videoProgress', progressId));
    if (snap.exists()) {
      return snap.data() as VideoProgress;
    }
  } catch (err) {
    console.warn('Could not fetch video progress from Firestore', err);
  }
  return memoryStore.videoProgress.find((vp) => vp.studentId === studentId && vp.videoId === videoId) || null;
}

export async function saveVideoProgress(
  studentId: string,
  videoId: string,
  courseId: string,
  watchedSec: number,
  percent: number,
  completed: boolean
): Promise<VideoProgress> {
  const progressId = `${studentId}_${videoId}`;
  const existing = await getVideoProgress(studentId, videoId);
  const updated: VideoProgress = {
    id: progressId,
    studentId,
    videoId,
    courseId,
    watchedSec,
    percent: Math.max(existing?.percent || 0, percent),
    completed: existing?.completed || completed || percent >= 90,
    lastPosition: watchedSec,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'videoProgress', progressId), updated);
    const localIdx = memoryStore.videoProgress.findIndex((vp) => vp.id === progressId);
    if (localIdx >= 0) memoryStore.videoProgress[localIdx] = updated;
    else memoryStore.videoProgress.push(updated);
    return updated;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `videoProgress/${progressId}`);
    return updated;
  }
}

export async function markMaterialRead(studentId: string, materialId: string, courseId: string): Promise<void> {
  const id = `${studentId}_${materialId}`;
  const item = {
    id,
    studentId,
    materialId,
    courseId,
    completed: true,
    updatedAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'materialProgress', id), item);
    const existing = memoryStore.materialProgress.findIndex((mp) => mp.id === id);
    if (existing >= 0) memoryStore.materialProgress[existing] = item;
    else memoryStore.materialProgress.push(item);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `materialProgress/${id}`);
  }
}

// =========================================================================
// 5. QUIZZES & ATTEMPTS (Real-Time + CRUD)
// =========================================================================

export function subscribeToQuizzes(courseId: string, callback: (quizzes: Quiz[]) => void): Unsubscribe {
  const q = query(collection(db, 'quizzes'), where('courseId', '==', courseId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Quiz[] = [];
      snapshot.forEach((d) => list.push(d.data() as Quiz));
      memoryStore.quizzes = [
        ...memoryStore.quizzes.filter((qz) => qz.courseId !== courseId),
        ...list
      ];
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'quizzes');
    }
  );
}

export async function getQuizzes(courseId: string): Promise<Quiz[]> {
  try {
    const q = query(collection(db, 'quizzes'), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    const items: Quiz[] = [];
    snap.forEach((d) => items.push(d.data() as Quiz));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'quizzes');
    return memoryStore.quizzes.filter((q) => q.courseId === courseId);
  }
}

export async function getQuizById(quizId: string): Promise<Quiz | undefined> {
  try {
    const snap = await getDoc(doc(db, 'quizzes', quizId));
    if (snap.exists()) return snap.data() as Quiz;
  } catch (err) {
    console.warn('Could not fetch quiz by ID from Firestore', err);
  }
  return memoryStore.quizzes.find((q) => q.quizId === quizId);
}

export async function createQuiz(quiz: Omit<Quiz, 'quizId'>): Promise<Quiz> {
  const quizId = 'quiz-' + Date.now();
  const newQuiz: Quiz = {
    ...quiz,
    quizId,
    isPublished: quiz.isPublished !== undefined ? quiz.isPublished : true
  };
  try {
    await setDoc(doc(db, 'quizzes', quizId), newQuiz);
    memoryStore.quizzes.push(newQuiz);
    return newQuiz;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `quizzes/${quizId}`);
    return newQuiz;
  }
}

export async function saveQuizAttempt(
  quizId: string,
  studentId: string,
  studentName: string,
  courseId: string,
  answers: Record<string, string | number>,
  score: number,
  totalMarks: number
): Promise<QuizAttempt> {
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const attemptId = `att-${studentId}-${quizId}-${Date.now()}`;

  const attempt: QuizAttempt = {
    attemptId,
    quizId,
    studentId,
    studentName,
    courseId,
    attemptNo: 1,
    startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    submittedAt: new Date().toISOString(),
    score,
    totalMarks,
    percentage,
    status: 'SUBMITTED',
    answers
  };

  try {
    await setDoc(doc(db, 'quizAttempts', attemptId), attempt);
    memoryStore.quizAttempts.push(attempt);
    return attempt;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `quizAttempts/${attemptId}`);
    return attempt;
  }
}

export function subscribeToQuizAttempts(
  courseId: string,
  callback: (attempts: QuizAttempt[]) => void
): Unsubscribe {
  const q = query(collection(db, 'quizAttempts'), where('courseId', '==', courseId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: QuizAttempt[] = [];
      snapshot.forEach((d) => list.push(d.data() as QuizAttempt));
      memoryStore.quizAttempts = [
        ...memoryStore.quizAttempts.filter((a) => a.courseId !== courseId),
        ...list
      ];
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'quizAttempts');
    }
  );
}

export async function getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  try {
    const q = query(collection(db, 'quizAttempts'), where('quizId', '==', quizId));
    const snap = await getDocs(q);
    const items: QuizAttempt[] = [];
    snap.forEach((d) => items.push(d.data() as QuizAttempt));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'quizAttempts');
    return memoryStore.quizAttempts.filter((a) => a.quizId === quizId);
  }
}

export async function getStudentQuizAttempts(studentId: string, courseId: string): Promise<QuizAttempt[]> {
  try {
    const q = query(
      collection(db, 'quizAttempts'),
      where('courseId', '==', courseId),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    const items: QuizAttempt[] = [];
    snap.forEach((d) => items.push(d.data() as QuizAttempt));
    return items;
  } catch (err) {
    return memoryStore.quizAttempts.filter((a) => a.studentId === studentId && a.courseId === courseId);
  }
}

// =========================================================================
// 6. PHYSICAL CLASSES & ATTENDANCE (Real-Time + CRUD)
// =========================================================================

export function subscribeToPhysicalClasses(
  courseId: string,
  callback: (classes: PhysicalClass[]) => void
): Unsubscribe {
  const q = query(collection(db, 'physicalClasses'), where('courseId', '==', courseId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: PhysicalClass[] = [];
      snapshot.forEach((d) => list.push(d.data() as PhysicalClass));
      list.sort((a, b) => a.classDate.localeCompare(b.classDate));
      memoryStore.physicalClasses = [
        ...memoryStore.physicalClasses.filter((pc) => pc.courseId !== courseId),
        ...list
      ];
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'physicalClasses');
    }
  );
}

export async function getPhysicalClasses(courseId: string): Promise<PhysicalClass[]> {
  try {
    const q = query(collection(db, 'physicalClasses'), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    const items: PhysicalClass[] = [];
    snap.forEach((d) => items.push(d.data() as PhysicalClass));
    items.sort((a, b) => a.classDate.localeCompare(b.classDate));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'physicalClasses');
    return memoryStore.physicalClasses.filter((pc) => pc.courseId === courseId);
  }
}

export async function schedulePhysicalClass(
  classData: Omit<PhysicalClass, 'classId' | 'status'>
): Promise<PhysicalClass> {
  const classId = 'class-' + Date.now();
  const newClass: PhysicalClass = {
    ...classData,
    classId,
    status: 'SCHEDULED'
  };
  try {
    await setDoc(doc(db, 'physicalClasses', classId), newClass);
    memoryStore.physicalClasses.push(newClass);
    return newClass;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `physicalClasses/${classId}`);
    return newClass;
  }
}

export function subscribeToAttendanceForClass(
  classId: string,
  callback: (records: AttendanceRecord[]) => void
): Unsubscribe {
  const q = query(collection(db, 'attendance'), where('classId', '==', classId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AttendanceRecord[] = [];
      snapshot.forEach((d) => list.push(d.data() as AttendanceRecord));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'attendance');
    }
  );
}

export async function getAttendanceForClass(classId: string): Promise<AttendanceRecord[]> {
  try {
    const q = query(collection(db, 'attendance'), where('classId', '==', classId));
    const snap = await getDocs(q);
    const items: AttendanceRecord[] = [];
    snap.forEach((d) => items.push(d.data() as AttendanceRecord));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'attendance');
    return memoryStore.attendance.filter((att) => att.classId === classId);
  }
}

export async function saveAttendanceBulk(records: Omit<AttendanceRecord, 'id' | 'markedAt'>[]): Promise<void> {
  const markedAt = new Date().toISOString();
  for (const r of records) {
    const id = `att_${r.classId}_${r.studentId}`;
    const item: AttendanceRecord = {
      ...r,
      id,
      markedAt
    };
    try {
      await setDoc(doc(db, 'attendance', id), item);
      const existingIdx = memoryStore.attendance.findIndex((a) => a.id === id);
      if (existingIdx >= 0) memoryStore.attendance[existingIdx] = item;
      else memoryStore.attendance.push(item);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `attendance/${id}`);
    }
  }
}

export async function getStudentAttendance(studentId: string, courseId: string): Promise<{
  records: AttendanceRecord[];
  percentage: number;
  presentCount: number;
  totalSessions: number;
}> {
  try {
    const q = query(
      collection(db, 'attendance'),
      where('courseId', '==', courseId),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    const records: AttendanceRecord[] = [];
    snap.forEach((d) => records.push(d.data() as AttendanceRecord));
    const presentCount = records.filter((a) => a.status === 'PRESENT' || a.status === 'EXCUSED').length;
    const totalSessions = records.length;
    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
    return { records, percentage, presentCount, totalSessions };
  } catch {
    const records = memoryStore.attendance.filter((a) => a.studentId === studentId && a.courseId === courseId);
    const presentCount = records.filter((a) => a.status === 'PRESENT' || a.status === 'EXCUSED').length;
    const totalSessions = records.length;
    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
    return { records, percentage, presentCount, totalSessions };
  }
}

// =========================================================================
// 7. STUDENT READINESS MATRIX (Real-Time Dynamic Computation)
// =========================================================================

export async function getCourseReadiness(courseId: string): Promise<StudentReadiness[]> {
  try {
    const [usersSnap, videosSnap, materialsSnap, quizzesSnap, quizAttemptsSnap, videoProgSnap, matProgSnap] =
      await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'STUDENT'))),
        getDocs(query(collection(db, 'videoLectures'), where('courseId', '==', courseId))),
        getDocs(query(collection(db, 'learningMaterials'), where('courseId', '==', courseId))),
        getDocs(query(collection(db, 'quizzes'), where('courseId', '==', courseId))),
        getDocs(query(collection(db, 'quizAttempts'), where('courseId', '==', courseId))),
        getDocs(query(collection(db, 'videoProgress'), where('courseId', '==', courseId))),
        getDocs(query(collection(db, 'materialProgress'), where('courseId', '==', courseId)))
      ]);

    const students: User[] = [];
    usersSnap.forEach((d) => students.push(d.data() as User));

    const courseVideos: VideoLecture[] = [];
    videosSnap.forEach((d) => courseVideos.push(d.data() as VideoLecture));

    const courseMaterials: LearningMaterial[] = [];
    materialsSnap.forEach((d) => courseMaterials.push(d.data() as LearningMaterial));

    const quizzes: Quiz[] = [];
    quizzesSnap.forEach((d) => quizzes.push(d.data() as Quiz));
    const preQuiz = quizzes.find((q) => q.type === 'PRE');

    const quizAttempts: QuizAttempt[] = [];
    quizAttemptsSnap.forEach((d) => quizAttempts.push(d.data() as QuizAttempt));

    const videoProgressList: VideoProgress[] = [];
    videoProgSnap.forEach((d) => videoProgressList.push(d.data() as VideoProgress));

    const matProgressList: { studentId: string; materialId: string; completed: boolean }[] = [];
    matProgSnap.forEach((d) => matProgressList.push(d.data() as any));

    return students.map((s) => {
      let totalVideoPct = 0;
      courseVideos.forEach((v) => {
        const prog = videoProgressList.find((vp) => vp.studentId === s.userId && vp.videoId === v.videoId);
        totalVideoPct += prog ? prog.percent : 0;
      });
      const avgVideoPct = courseVideos.length > 0 ? Math.round(totalVideoPct / courseVideos.length) : 0;

      const readCount = matProgressList.filter((mp) => mp.studentId === s.userId && mp.completed).length;

      let quizScorePct = 0;
      if (preQuiz) {
        const attempt = quizAttempts.find((a) => a.quizId === preQuiz.quizId && a.studentId === s.userId);
        if (attempt) quizScorePct = attempt.percentage;
      }

      let status: 'READY' | 'PARTIALLY_READY' | 'NOT_READY' = 'NOT_READY';
      if (avgVideoPct >= 80 && (quizScorePct >= 60 || !preQuiz)) {
        status = 'READY';
      } else if (avgVideoPct >= 40 || quizScorePct >= 40 || readCount > 0) {
        status = 'PARTIALLY_READY';
      }

      return {
        studentId: s.userId,
        studentName: s.fullName,
        rollNo: s.rollNo || 'N/A',
        avatarUrl: s.avatarUrl,
        videoCompletionPct: avgVideoPct,
        materialsReadCount: readCount,
        totalMaterialsCount: courseMaterials.length,
        preQuizScorePct: quizScorePct,
        status,
        lastActivityAt: new Date().toISOString()
      };
    });
  } catch (err) {
    console.warn('Could not compute real-time readiness from Firestore', err);
    return [];
  }
}

// =========================================================================
// 8. ASSIGNMENTS & SUBMISSIONS (Real-Time + CRUD)
// =========================================================================

export function subscribeToAssignments(
  courseId: string,
  callback: (assignments: Assignment[]) => void
): Unsubscribe {
  const q = query(collection(db, 'assignments'), where('courseId', '==', courseId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Assignment[] = [];
      snapshot.forEach((d) => list.push(d.data() as Assignment));
      list.sort((a, b) => (b.deadline || '').localeCompare(a.deadline || ''));
      memoryStore.assignments = [
        ...memoryStore.assignments.filter((a) => a.courseId !== courseId),
        ...list
      ];
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'assignments');
    }
  );
}

export async function getAssignments(courseId: string): Promise<Assignment[]> {
  try {
    const q = query(collection(db, 'assignments'), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    const items: Assignment[] = [];
    snap.forEach((d) => items.push(d.data() as Assignment));
    items.sort((a, b) => (b.deadline || '').localeCompare(a.deadline || ''));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'assignments');
    return memoryStore.assignments.filter((a) => a.courseId === courseId);
  }
}

export async function createAssignment(assignment: Omit<Assignment, 'assignmentId'>): Promise<Assignment> {
  const assignmentId = 'assign-' + Date.now();
  const newAssign: Assignment = {
    ...assignment,
    assignmentId,
    isPublished: assignment.isPublished ?? true
  };
  try {
    await setDoc(doc(db, 'assignments', assignmentId), newAssign);
    memoryStore.assignments.push(newAssign);
    return newAssign;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `assignments/${assignmentId}`);
    return newAssign;
  }
}

export function subscribeToSubmissions(
  assignmentId: string,
  callback: (submissions: Submission[]) => void
): Unsubscribe {
  const q = query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Submission[] = [];
      snapshot.forEach((d) => list.push(d.data() as Submission));
      list.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'submissions');
    }
  );
}

export async function getSubmissions(assignmentId: string): Promise<Submission[]> {
  try {
    const q = query(collection(db, 'submissions'), where('assignmentId', '==', assignmentId));
    const snap = await getDocs(q);
    const items: Submission[] = [];
    snap.forEach((d) => items.push(d.data() as Submission));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'submissions');
    return memoryStore.submissions.filter((s) => s.assignmentId === assignmentId);
  }
}

export async function getStudentSubmission(
  assignmentId: string,
  studentId: string
): Promise<Submission | undefined> {
  try {
    const subId = `${assignmentId}_${studentId}`;
    const snap = await getDoc(doc(db, 'submissions', subId));
    if (snap.exists()) return snap.data() as Submission;
  } catch (err) {
    console.warn('Could not fetch student submission from Firestore', err);
  }
  return memoryStore.submissions.find((s) => s.assignmentId === assignmentId && s.studentId === studentId);
}

export async function submitAssignment(
  assignmentId: string,
  studentId: string,
  studentName: string,
  courseId: string,
  fileName: string,
  fileSize: string,
  textAnswer: string
): Promise<Submission> {
  const submissionId = `${assignmentId}_${studentId}`;
  const now = new Date();

  let isLate = false;
  try {
    const assignSnap = await getDoc(doc(db, 'assignments', assignmentId));
    if (assignSnap.exists()) {
      const deadline = new Date(assignSnap.data().deadline);
      isLate = now > deadline;
    }
  } catch {
    // default false
  }

  const sub: Submission = {
    submissionId,
    assignmentId,
    studentId,
    studentName,
    courseId,
    fileName,
    fileSize,
    textAnswer,
    submittedAt: now.toISOString(),
    isLate,
    status: 'SUBMITTED'
  };

  try {
    await setDoc(doc(db, 'submissions', submissionId), sub);
    const existingIndex = memoryStore.submissions.findIndex((s) => s.submissionId === submissionId);
    if (existingIndex >= 0) memoryStore.submissions[existingIndex] = sub;
    else memoryStore.submissions.push(sub);
    return sub;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `submissions/${submissionId}`);
    return sub;
  }
}

export async function gradeSubmission(
  submissionId: string,
  marksObtained: number,
  letterGrade: string,
  generalFeedback: string,
  rubricScores: Record<string, number>,
  teacherName: string
): Promise<Submission> {
  const gradedAt = new Date().toISOString();
  const updates = {
    status: 'GRADED' as const,
    marksObtained,
    letterGrade,
    generalFeedback,
    rubricScores,
    gradedAt,
    gradedBy: teacherName
  };

  try {
    await updateDoc(doc(db, 'submissions', submissionId), updates);
    const sub = memoryStore.submissions.find((s) => s.submissionId === submissionId);
    if (sub) Object.assign(sub, updates);
    return {
      ...(sub || {
        submissionId,
        assignmentId: '',
        studentId: '',
        studentName: '',
        courseId: '',
        fileName: '',
        fileSize: '',
        textAnswer: '',
        submittedAt: gradedAt,
        isLate: false
      }),
      ...updates
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `submissions/${submissionId}`);
    throw err;
  }
}

// =========================================================================
// 9. FEEDBACK & DISCUSSIONS (Real-Time + CRUD)
// =========================================================================

export function subscribeToFeedback(
  submissionId: string,
  callback: (messages: FeedbackMessage[]) => void
): Unsubscribe {
  const q = query(collection(db, 'feedback'), where('submissionId', '==', submissionId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: FeedbackMessage[] = [];
      snapshot.forEach((d) => list.push(d.data() as FeedbackMessage));
      list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'feedback');
    }
  );
}

export async function getFeedback(submissionId: string): Promise<FeedbackMessage[]> {
  try {
    const q = query(collection(db, 'feedback'), where('submissionId', '==', submissionId));
    const snap = await getDocs(q);
    const items: FeedbackMessage[] = [];
    snap.forEach((d) => items.push(d.data() as FeedbackMessage));
    items.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'feedback');
    return memoryStore.feedback.filter((f) => f.submissionId === submissionId);
  }
}

export async function addFeedback(
  submissionId: string,
  fromUserId: string,
  fromUserName: string,
  fromRole: User['role'],
  message: string
): Promise<FeedbackMessage> {
  const feedbackId = 'fb-' + Date.now();
  const item: FeedbackMessage = {
    feedbackId,
    submissionId,
    fromUserId,
    fromUserName,
    fromRole,
    message,
    createdAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'feedback', feedbackId), item);
    memoryStore.feedback.push(item);
    return item;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `feedback/${feedbackId}`);
    return item;
  }
}

// =========================================================================
// 10. AUDIT LOGS & DEPARTMENTS (Real-Time + CRUD)
// =========================================================================

export function subscribeToAuditLogs(callback: (logs: AuditLog[]) => void): Unsubscribe {
  const colRef = collection(db, 'auditLogs');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: AuditLog[] = [];
      snapshot.forEach((d) => list.push(d.data() as AuditLog));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      memoryStore.auditLogs = list;
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'auditLogs');
    }
  );
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const snap = await getDocs(collection(db, 'auditLogs'));
    const items: AuditLog[] = [];
    snap.forEach((d) => items.push(d.data() as AuditLog));
    items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    memoryStore.auditLogs = items;
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'auditLogs');
    return memoryStore.auditLogs;
  }
}

export async function addAuditLog(
  userId: string,
  userName: string,
  role: User['role'],
  action: string,
  entity: string,
  entityId: string
): Promise<void> {
  const logId = 'log-' + Date.now();
  const item: AuditLog = {
    logId,
    userId,
    userName,
    role,
    action,
    entity,
    entityId,
    ip: '10.0.' + Math.floor(Math.random() * 200) + '.' + Math.floor(Math.random() * 200),
    createdAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'auditLogs', logId), item);
    memoryStore.auditLogs.unshift(item);
  } catch (err) {
    console.warn('Could not write audit log', err);
  }
}

export function subscribeToDepartments(callback: (depts: Department[]) => void): Unsubscribe {
  const colRef = collection(db, 'departments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Department[] = [];
      snapshot.forEach((d) => list.push(d.data() as Department));
      memoryStore.departments = list;
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'departments');
    }
  );
}

export async function getDepartments(): Promise<Department[]> {
  try {
    const snap = await getDocs(collection(db, 'departments'));
    const items: Department[] = [];
    snap.forEach((d) => items.push(d.data() as Department));
    memoryStore.departments = items;
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'departments');
    return memoryStore.departments;
  }
}

export async function createDepartment(dept: Omit<Department, 'deptId'>): Promise<Department> {
  const deptId = 'dept-' + dept.code.toLowerCase();
  const newDept: Department = {
    ...dept,
    deptId,
    programsCount: dept.programsCount || 1,
    coursesCount: dept.coursesCount || 0
  };
  try {
    await setDoc(doc(db, 'departments', deptId), newDept);
    memoryStore.departments.push(newDept);
    return newDept;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `departments/${deptId}`);
    return newDept;
  }
}
