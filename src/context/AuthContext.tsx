import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { User, UserRole, Course, NotificationItem } from '../types';
import {
  subscribeToUsers,
  subscribeToCourses,
  createUser,
  initializeFirestoreData,
  addAuditLog,
  getCourseRegistrations
} from '../services/dataService';
import { parseSemester, formatSemesterLabel } from '../utils/semester';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  viewMode: 'dashboard' | 'landing';
  setViewMode: (mode: 'dashboard' | 'landing') => void;
  selectedCourse: Course | null;
  courses: Course[];
  allCourses: Course[];
  activeSemester: number;
  setActiveSemester: (sem: number) => void;
  users: User[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  toasts: Toast[];
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  initialSignUpRole: UserRole;
  isCreateCourseOpen: boolean;
  openCreateCourseModal: () => void;
  closeCreateCourseModal: () => void;
  openAuthModal: (mode?: 'signin' | 'signup', role?: UserRole) => void;
  closeAuthModal: () => void;
  login: (user: User, preferredSemester?: number) => void;
  loginWithEmail: (email: string, role?: UserRole, preferredSemester?: number) => Promise<User | null>;
  signUp: (userData: Omit<User, 'userId' | 'createdAt'>) => Promise<User>;
  logout: () => void;
  switchUserRole: (role: UserRole) => void;
  setSelectedCourse: (course: Course | null) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourseState] = useState<Course | null>(null);

  // Persistence check - defaults to null for first-time visitors
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const isAuth = localStorage.getItem('edublend_is_auth');
      const saved = localStorage.getItem('edublend_current_user');
      if (isAuth === 'true' && saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('edublend_is_auth');
    return saved === 'true';
  });

  const [viewMode, setViewMode] = useState<'dashboard' | 'landing'>(() => {
    const saved = localStorage.getItem('edublend_is_auth');
    return saved === 'true' ? 'dashboard' : 'landing';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [initialSignUpRole, setInitialSignUpRole] = useState<UserRole>('STUDENT');
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [activeSemester, setActiveSemesterState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('edublend_active_semester');
      if (saved) return Number(saved) || 6;
      if (currentUser?.semester) {
        return parseSemester(currentUser.semester);
      }
    } catch {
      // ignore
    }
    return 6;
  });

  const setActiveSemester = (sem: number) => {
    setActiveSemesterState(sem);
    localStorage.setItem('edublend_active_semester', sem.toString());
  };

  const role: UserRole = currentUser?.role || 'STUDENT';

  // Semester-based visibility filter
  // Student strictly only sees courses matching their enrolled semester
  // Teacher sees courses for their selected teaching semester
  const visibleCourses = useMemo(() => {
    if (role === 'STUDENT') {
      const studentSemester = parseSemester(currentUser?.semester) || activeSemester || 6;
      return courses.filter((c) => parseSemester(c.semester) === studentSemester);
    }
    if (role === 'TEACHER') {
      const teacherSemester = activeSemester || (currentUser?.semester ? parseSemester(currentUser.semester) : 6);
      const semesterCourses = courses.filter((c) => parseSemester(c.semester) === teacherSemester);
      return semesterCourses.length > 0 ? semesterCourses : courses.filter((c) => parseSemester(c.semester) === teacherSemester);
    }
    return courses;
  }, [courses, role, currentUser?.semester, activeSemester]);

  // Keep selectedCourse aligned with visibleCourses
  useEffect(() => {
    setSelectedCourseState((current) => {
      if (visibleCourses.length === 0) return null;
      if (!current) return visibleCourses[0];
      const match = visibleCourses.find((c) => c.courseId === current.courseId);
      return match || visibleCourses[0];
    });
  }, [visibleCourses]);

  // Auto-register enrolled semester students for new courses in background
  useEffect(() => {
    if (selectedCourse?.courseId) {
      getCourseRegistrations(selectedCourse.courseId).catch(() => {});
    }
  }, [selectedCourse?.courseId]);

  // 1. Initialize Firestore & Subscribe to Real-Time Collections
  useEffect(() => {
    initializeFirestoreData();

    // Real-Time subscription to Courses
    const unsubCourses = subscribeToCourses((updatedCourses) => {
      setCourses(updatedCourses);
      setSelectedCourseState((current) => {
        if (!current && updatedCourses.length > 0) {
          return updatedCourses[0];
        }
        if (current) {
          const fresh = updatedCourses.find((c) => c.courseId === current.courseId);
          return fresh || (updatedCourses.length > 0 ? updatedCourses[0] : null);
        }
        return null;
      });
    });

    // Real-Time subscription to Users
    const unsubUsers = subscribeToUsers((updatedUsers) => {
      setUsers(updatedUsers);
      // Keep currentUser in sync if updated by another admin/session
      setCurrentUser((prev) => {
        if (!prev) return null;
        const fresh = updatedUsers.find((u) => u.userId === prev.userId || u.email.toLowerCase() === prev.email.toLowerCase());
        return fresh || prev;
      });
    });

    return () => {
      unsubCourses();
      unsubUsers();
    };
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast-' + Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin', role: UserRole = 'STUDENT') => {
    setAuthModalMode(mode);
    setInitialSignUpRole(role);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openCreateCourseModal = () => {
    setIsCreateCourseOpen(true);
  };

  const closeCreateCourseModal = () => {
    setIsCreateCourseOpen(false);
  };

  const login = (user: User, preferredSemester?: number) => {
    let effectiveUser = user;
    if (preferredSemester) {
      effectiveUser = {
        ...user,
        semester: formatSemesterLabel(preferredSemester)
      };
      setActiveSemester(preferredSemester);
    } else if (user.semester) {
      const parsed = parseSemester(user.semester);
      if (parsed) setActiveSemester(parsed);
    }
    setCurrentUser(effectiveUser);
    setIsAuthenticated(true);
    setViewMode('dashboard');
    setIsAuthModalOpen(false);
    localStorage.setItem('edublend_current_user', JSON.stringify(effectiveUser));
    localStorage.setItem('edublend_is_auth', 'true');
    addToast(`Signed in as ${effectiveUser.fullName} (${effectiveUser.role})`, 'success');
  };

  const loginWithEmail = async (email: string, role?: UserRole, preferredSemester?: number): Promise<User | null> => {
    const cleanEmail = email.trim().toLowerCase();
    let matched = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && (!role || u.role === role)
    );

    if (!matched) {
      matched = users.find((u) => u.email.toLowerCase() === cleanEmail);
    }

    if (matched) {
      if (preferredSemester) {
        matched = { ...matched, semester: formatSemesterLabel(preferredSemester) };
      }
      login(matched, preferredSemester);
      return matched;
    }

    // Provision user directly in Firestore in real-time
    const isSpecialAdmin = cleanEmail.includes('ayesha0001@std.uftb.ac.bd') || cleanEmail.includes('admin');
    const assignedRole: UserRole = role || (isSpecialAdmin ? 'ADMIN' : 'STUDENT');

    const newUser = await createUser({
      email: cleanEmail,
      fullName: cleanEmail === 'ayesha0001@std.uftb.ac.bd' ? 'Dr. Ayesha Rahman' : cleanEmail.split('@')[0],
      role: assignedRole,
      department: 'Educational Technology and Engineering',
      status: 'ACTIVE',
      semester: preferredSemester ? formatSemesterLabel(preferredSemester) : (assignedRole === 'STUDENT' ? '6th Semester' : undefined),
      employeeId: assignedRole === 'ADMIN' ? 'EMP-ADM-01' : assignedRole === 'TEACHER' ? 'EMP-FAC-01' : undefined,
      rollNo: assignedRole === 'STUDENT' ? `CS-2026-${Math.floor(100 + Math.random() * 900)}` : undefined
    });

    await addAuditLog(
      newUser.userId,
      newUser.fullName,
      assignedRole,
      'USER_SIGN_IN_REGISTER',
      'User',
      newUser.userId
    );

    login(newUser, preferredSemester);
    return newUser;
  };

  const signUp = async (userData: Omit<User, 'userId' | 'createdAt'>): Promise<User> => {
    const created = await createUser(userData);
    await addAuditLog(
      created.userId,
      created.fullName,
      created.role,
      'USER_REGISTER',
      'User',
      created.userId
    );
    login(created);
    addToast(`Account created in real time! Welcome, ${created.fullName}`, 'success');
    return created;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setViewMode('landing');
    localStorage.setItem('edublend_is_auth', 'false');
    localStorage.removeItem('edublend_current_user');
    addToast('You have logged out. Returning to home landing page.', 'info');
  };

  const switchUserRole = async (targetRole: UserRole) => {
    // Look for existing user in real-time Firestore list
    const targetUser = users.find((u) => u.role === targetRole);
    if (targetUser) {
      login(targetUser);
      addToast(`Switched account to ${targetRole}: ${targetUser.fullName}`, 'info');
      return;
    }

    // If no user exists for that role, open the authentication modal
    openAuthModal('signup', targetRole);
    addToast(`No registered ${targetRole.toLowerCase()} account found. Please register or sign in.`, 'info');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast('All notifications marked as read', 'info');
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        viewMode,
        setViewMode,
        selectedCourse,
        courses: visibleCourses,
        allCourses: courses,
        activeSemester,
        setActiveSemester,
        users,
        notifications,
        unreadNotificationCount,
        toasts,
        isAuthModalOpen,
        authModalMode,
        initialSignUpRole,
        isCreateCourseOpen,
        openCreateCourseModal,
        closeCreateCourseModal,
        openAuthModal,
        closeAuthModal,
        login,
        loginWithEmail,
        signUp,
        logout,
        switchUserRole,
        setSelectedCourse: setSelectedCourseState,
        markNotificationRead,
        markAllNotificationsRead,
        addToast,
        removeToast
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
