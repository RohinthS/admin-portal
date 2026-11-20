import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { studentAccountService } from '../services/studentAccountService';

export interface Company {
  _id: string;
  company_name: string;
  branch: string;
}

export interface User {
  id: string;
  _id?: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  user_type: string;
  role?: string;
  role_id?: string;
  company_id?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeCompanyId: string | null;
  companies: Company[];
  permissions: Record<string, string[]>;
  loading: boolean;
  login: (credentials: { username: string; password: string; company_id?: string }, remember?: boolean) => Promise<void>;
  logout: () => void;
  switchCompany: (companyId: string) => Promise<void>;
  checkPermission: (page: string, action: 'V' | 'A' | 'E' | 'D') => boolean;
  updateCurrentUser: (updated: Partial<User>) => void;
}

const getInitialToken = (): string | null => {
  const isRemembered = localStorage.getItem('wegrow_remember_me') === 'true';
  const sessionTok = sessionStorage.getItem('token');
  if (sessionTok) return sessionTok;
  if (isRemembered) {
    return localStorage.getItem('token');
  }
  // If not remembered and not in sessionStorage: purge stale persistent tokens
  // so that closing and reopening the website requires signing in fresh.
  localStorage.removeItem('token');
  localStorage.removeItem('active_company_id');
  localStorage.removeItem('wegrow_current_student_session');
  return null;
};

const getInitialCompanyId = (): string | null => {
  const isRemembered = localStorage.getItem('wegrow_remember_me') === 'true';
  return (
    sessionStorage.getItem('active_company_id') ||
    (isRemembered ? localStorage.getItem('active_company_id') : null)
  );
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(getInitialCompanyId);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      // Check if this is an active student session
      if (token.startsWith('student_token_')) {
        const currentStudent = studentAccountService.getCurrentStudent();
        if (currentStudent) {
          setUser({
            id: currentStudent.id,
            username: currentStudent.student_id,
            name: currentStudent.student_name,
            email: currentStudent.email,
            phone: currentStudent.phone,
            user_type: 'student',
            company_id: currentStudent.company_id || 'company_coimbatore',
          });
          setLoading(false);
          return;
        }
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        setCompanies(res.data.companies || []);
        setPermissions(res.data.permissions || {});
        if (res.data.active_company_id) {
          setActiveCompanyId(res.data.active_company_id);
          const isRemembered = localStorage.getItem('wegrow_remember_me') === 'true';
          const storage = isRemembered ? localStorage : sessionStorage;
          storage.setItem('active_company_id', res.data.active_company_id);
        }
      } catch (err) {
        console.error('Error fetching current session', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (
    credentials: { username: string; password: string; company_id?: string },
    remember = false,
  ) => {
    // 1. Purge all prior storage across both sessionStorage and localStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('active_company_id');
    sessionStorage.removeItem('wegrow_current_student_session');
    localStorage.removeItem('token');
    localStorage.removeItem('active_company_id');
    localStorage.removeItem('wegrow_remember_me');
    localStorage.removeItem('wegrow_current_student_session');
    localStorage.removeItem('user');

    // By default, sessions live in sessionStorage so that closing the website / browser
    // requires logging in again (unless the user explicitly chooses 'Remember me').
    const storage = remember ? localStorage : sessionStorage;
    if (remember) {
      localStorage.setItem('wegrow_remember_me', 'true');
    }

    try {
      const res = await api.post('/auth/login', credentials);
      const { access_token, user: loggedUser, companies: comps, permissions: perms } = res.data;

      storage.setItem('token', access_token);
      setToken(access_token);
      setUser(loggedUser);
      setCompanies(comps || []);
      setPermissions(perms || {});

      const companyId = loggedUser.company_id || (comps?.[0]?._id ?? null);
      if (companyId) {
        storage.setItem('active_company_id', companyId);
        setActiveCompanyId(companyId);
      }
    } catch (backendError) {
      // Check if student credentials match created student account
      const student = studentAccountService.authenticateStudent(
        credentials.username,
        credentials.password,
        remember,
      );
      if (student) {
        const studentUser: User = {
          id: student.id,
          username: student.student_id,
          name: student.student_name,
          email: student.email,
          phone: student.phone,
          user_type: 'student',
          company_id: student.company_id || 'company_coimbatore',
        };
        const studentToken = `student_token_${student.id}_${Date.now()}`;
        storage.setItem('token', studentToken);
        if (studentUser.company_id) {
          storage.setItem('active_company_id', studentUser.company_id);
          setActiveCompanyId(studentUser.company_id);
        }
        setToken(studentToken);
        setUser(studentUser);
        setPermissions({});
        return;
      }

      throw backendError;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('active_company_id');
    sessionStorage.removeItem('wegrow_current_student_session');
    localStorage.removeItem('token');
    localStorage.removeItem('active_company_id');
    localStorage.removeItem('wegrow_remember_me');
    localStorage.removeItem('wegrow_current_student_session');
    localStorage.removeItem('user');
    studentAccountService.clearStudentSession();
    setToken(null);
    setUser(null);
    setActiveCompanyId(null);
    setCompanies([]);
    setPermissions({});
  };

  const switchCompany = async (companyId: string) => {
    try {
      const res = await api.post('/auth/switch-company', { company_id: companyId });
      const { access_token, permissions: newPerms } = res.data;

      const isRemembered = localStorage.getItem('wegrow_remember_me') === 'true';
      const storage = isRemembered ? localStorage : sessionStorage;

      storage.setItem('token', access_token);
      storage.setItem('active_company_id', companyId);
      setToken(access_token);
      setActiveCompanyId(companyId);
      setPermissions(newPerms || {});
    } catch (err) {
      console.error('Failed to switch branch', err);
    }
  };

  const checkPermission = (page: string, action: 'V' | 'A' | 'E' | 'D'): boolean => {
    // Admin & Mentor have full unrestricted access to learning and exams
    if (user?.user_type === 'admin' || user?.user_type === 'mentor') return true;

    // Dashboard view is globally permitted to all authenticated users
    if (page === 'dashboard' && action === 'V') return true;

    // Profile and personal leaves permitted to all non-student users
    if (user?.user_type !== 'student') {
      if (['profile_update', 'my_payslips', 'apply_leave', 'leave_history', 'credit_management', 'tests', 'exam_portal'].includes(page)) {
        return true;
      }
    }

    // Manager / Director overrides matching PHP permission_helper.php
    if (user?.user_type === 'manager' || user?.user_type === 'director') {
      if ([
        'leave_approval',
        'leave_report',
        'installment_followup',
        'installment_followup_report',
        'staff_collection_report',
        'report_test_performance',
        'report_student_performance',
        'report_gst_invoice',
        'report_course_progress',
        'report_student_daily_log',
        'feedback_review',
        'student_attendance',
        'student_tasks',
        'student_reports',
      ].includes(page)) {
        return true;
      }
    }

    // Alias mapping between PHP modules, MongoDB role_permissions, and React routes
    const aliases: Record<string, string[]> = {
      dashboard: ['dashboard'],
      enrollment: ['enrollment', 'enrollment_training'],
      enrollment_training: ['enrollment', 'enrollment_training'],
      enrollment_internship: ['enrollment_internship'],
      tasks: ['tasks', 'task'],
      task: ['tasks', 'task'],
      expense: ['expense', 'expense_entry', 'expense_category'],
      expense_entry: ['expense_entry', 'expense', 'expense_category'],
      expense_category: ['expense_category', 'expense_entry', 'expense'],
      daily_report: ['daily_report', 'daily_reports'],
      daily_reports: ['daily_reports', 'daily_report'],
      receipt: ['receipt', 'receipts', 'payment', 'payments'],
      attendance: ['attendance', 'staff_attendance'],
      leave_approval: ['leave_approval', 'leaves'],
      leave_report: ['leave_report', 'leaves'],
      course: ['course', 'courses'],
      course_enquiry: ['course_enquiry', 'enquiry', 'enquiries'],
      enquiry_followup: ['enquiry_followup', 'course_enquiry'],
      course_closure: ['course_closure', 'enrollment'],
      payroll: ['payroll', 'attendance'],
      payment_mode: ['payment_mode', 'receipt'],
      bank: ['bank', 'receipt'],
      questions: ['questions', 'test', 'tests'],
      test: ['questions', 'test', 'tests'],
      student_attendance: ['student_attendance', 'attendance'],
      student_tasks: ['student_tasks', 'tasks'],
      student_reports: ['student_reports', 'daily_report'],
      company: ['company'],
      roles: ['roles', 'role'],
      role: ['roles', 'role'],
      users: ['users', 'user', 'staff'],
      staff: ['staff', 'users'],
      students: ['students', 'enrollment', 'users'],
    };

    const keysToCheck = aliases[page] || [page];
    for (const key of keysToCheck) {
      const pageActions = permissions[key];
      if (pageActions && pageActions.includes(action)) {
        return true;
      }
    }

    return false;
  };

  const updateCurrentUser = (updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeCompanyId,
        companies,
        permissions,
        loading,
        login,
        logout,
        switchCompany,
        checkPermission,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
