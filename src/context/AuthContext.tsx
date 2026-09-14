import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, Course, NotificationItem } from '../types';
import {
  subscribeToUsers,
  subscribeToCourses,
  createUser,
  initializeFirestoreData,
  addAuditLog
} from '../services/dataService';

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
  login: (user: User) => void;
  loginWithEmail: (email: string, role?: UserRole) => Promise<User | null>;
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

  const login = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setViewMode('dashboard');
    setIsAuthModalOpen(false);
    localStorage.setItem('edublend_current_user', JSON.stringify(user));
    localStorage.setItem('edublend_is_auth', 'true');
    addToast(`Signed in as ${user.fullName} (${user.role})`, 'success');
  };

  const loginWithEmail = async (email: string, role?: UserRole): Promise<User | null> => {
    const cleanEmail = email.trim().toLowerCase();
    let matched = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && (!role || u.role === role)
    );

    if (!matched) {
      matched = users.find((u) => u.email.toLowerCase() === cleanEmail);
    }

    if (matched) {
      login(matched);
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

    login(newUser);
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
      addToast(`Switched persona to ${targetRole}: ${targetUser.fullName}`, 'info');
      return;
    }

    // If no user exists for that role yet, create one in Firestore in real-time
    const names = {
      ADMIN: 'Dr. Ayesha Rahman (Admin)',
      TEACHER: 'Prof. Tariq Rahman (Faculty)',
      STUDENT: 'Ayesha Rahman (Student)'
    };
    const emails = {
      ADMIN: 'ayesha0001@std.uftb.ac.bd',
      TEACHER: 'faculty@edublend.edu',
      STUDENT: 'student@edublend.edu'
    };

    const created = await createUser({
      email: emails[targetRole],
      fullName: names[targetRole],
      role: targetRole,
      department: 'Educational Technology and Engineering',
      status: 'ACTIVE',
      employeeId: targetRole !== 'STUDENT' ? `EMP-${targetRole.slice(0, 3)}-01` : undefined,
      rollNo: targetRole === 'STUDENT' ? 'CS-2026-001' : undefined
    });

    login(created);
    addToast(`Created & switched persona to ${targetRole}: ${created.fullName}`, 'info');
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

  const role: UserRole = currentUser?.role || 'STUDENT';
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
        courses,
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
