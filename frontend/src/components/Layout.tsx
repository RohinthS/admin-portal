import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../wegrow&Bschool.webp';
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  GraduationCap,
  Wallet,
  Receipt,
  DollarSign,
  Users,
  TrendingUp,
  UserCheck,
  ClipboardList,
  FileSpreadsheet,
  CalendarCheck,
  User,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Building,
  BookOpen,
  PlayCircle,
  HelpCircle,
  Award,
  MessageSquare,
  Clock,
  CreditCard,
  Sun,
  Moon,
} from 'lucide-react';

interface SubMenuItem {
  name: string;
  path: string;
  page: string;
}

interface MenuGroup {
  title: string;
  icon: React.ElementType;
  isDropdown: boolean;
  path?: string;
  page?: string;
  children?: SubMenuItem[];
}

// Defined Menu Structure matching exact PHP sidebar.php Categories
const ADMIN_MENU_STRUCTURE: MenuGroup[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    isDropdown: false,
    path: '/',
    page: 'dashboard',
  },
  {
    title: 'Creation',
    icon: Building2,
    isDropdown: true,
    children: [
      { name: 'Company Details', path: '/companies', page: 'company' },
      { name: 'Role Management', path: '/roles', page: 'roles' },
      { name: 'User Management', path: '/roles', page: 'users' },
      { name: 'Staff Management', path: '/roles', page: 'staff' },
    ],
  },
  {
    title: 'Management',
    icon: CheckSquare,
    isDropdown: true,
    children: [
      { name: 'Courses', path: '/courses', page: 'course' },
      { name: 'Tasks', path: '/tasks', page: 'tasks' },
      { name: 'Events', path: '/courses', page: 'event' },
      { name: 'Offer', path: '/courses', page: 'offer' },
    ],
  },
  {
    title: 'Students',
    icon: GraduationCap,
    isDropdown: true,
    children: [
      { name: 'Student Directory & Accounts', path: '/students', page: 'students' },
      { name: 'Course Enquiry', path: '/enquiries', page: 'course_enquiry' },
      { name: 'Enquiry Follow-up', path: '/enquiries', page: 'enquiry_followup' },
      { name: 'Training Enrollment', path: '/enrollment/training', page: 'enrollment' },
      { name: 'Internship Enrollment', path: '/enrollment/internship', page: 'enrollment_internship' },
      { name: 'Enrollment Closure', path: '/enrollment/training', page: 'course_closure' },
    ],
  },
  {
    title: 'Exam & Credits',
    icon: Award,
    isDropdown: true,
    children: [
      { name: 'Exam Portal & Tests', path: '/tests', page: 'tests' },
      { name: 'Central Question Bank', path: '/tests?tab=bank', page: 'tests' },
      { name: 'Live Exam Proctoring', path: '/tests?tab=proctoring', page: 'tests' },
      { name: 'Credit & Badge Management', path: '/credit-management', page: 'credit_management' },
    ],
  },
  {
    title: 'Payroll',
    icon: Wallet,
    isDropdown: true,
    children: [
      { name: 'Attendance', path: '/attendance', page: 'attendance' },
      { name: 'Process Payroll', path: '/payroll', page: 'payroll' },
    ],
  },
  {
    title: 'Payments',
    icon: CreditCard,
    isDropdown: true,
    children: [
      { name: 'Receipts', path: '/receipts', page: 'receipt' },
      { name: 'Payment Modes', path: '/receipts', page: 'payment_mode' },
      { name: 'Banks', path: '/receipts', page: 'bank' },
    ],
  },
  {
    title: 'Fees Management',
    icon: DollarSign,
    isDropdown: true,
    children: [
      { name: 'Installment Follow-up', path: '/receipts', page: 'installment_followup' },
      { name: 'Installment Report', path: '/daily-reports', page: 'installment_followup_report' },
      { name: 'Staff Collection Report', path: '/daily-reports', page: 'staff_collection_report' },
    ],
  },
  {
    title: 'Expense',
    icon: Wallet,
    isDropdown: true,
    children: [
      { name: 'Expense Category', path: '/expenses?tab=category', page: 'expense_category' },
      { name: 'Expense Entry', path: '/expenses', page: 'expense_entry' },
    ],
  },
  {
    title: 'HR Management',
    icon: Users,
    isDropdown: true,
    children: [
      { name: 'Leave Approval', path: '/leaves', page: 'leave_approval' },
      { name: 'Leave Report', path: '/leaves', page: 'leave_report' },
    ],
  },
  {
    title: 'Reports',
    icon: TrendingUp,
    isDropdown: true,
    children: [
      { name: 'Daily Work Report', path: '/daily-reports', page: 'report_daily_work' },
      { name: 'Enrollment Report', path: '/daily-reports', page: 'report_enrollment' },
      { name: 'Enrollment Tracker Report', path: '/daily-reports', page: 'report_enrollment_tracker' },
      { name: 'Payments Report', path: '/receipts', page: 'report_payments' },
      { name: 'Expense Report', path: '/expenses', page: 'report_expense' },
      { name: 'Attendance Report', path: '/attendance', page: 'report_attendance' },
      { name: 'Student Attendance Report', path: '/attendance', page: 'report_student_attendance' },
      { name: 'Installment Report', path: '/receipts', page: 'report_installments' },
    ],
  },
  {
    title: 'Student Attendance',
    icon: UserCheck,
    isDropdown: false,
    path: '/attendance',
    page: 'student_attendance',
  },
  {
    title: 'Student Tasks',
    icon: CheckSquare,
    isDropdown: false,
    path: '/tasks',
    page: 'student_tasks',
  },
  {
    title: 'Student Daily Report',
    icon: FileSpreadsheet,
    isDropdown: false,
    path: '/daily-reports',
    page: 'student_reports',
  },
  {
    title: 'Daily Report',
    icon: CalendarCheck,
    isDropdown: false,
    path: '/daily-reports',
    page: 'daily_report',
  },
  {
    title: 'My Account',
    icon: User,
    isDropdown: true,
    children: [
      { name: 'Profile Settings', path: '/settings', page: 'profile_update' },
      { name: 'Apply Leave', path: '/leaves', page: 'apply_leave' },
      { name: 'Leave History', path: '/leaves', page: 'leave_history' },
      { name: 'My Payslips', path: '/payroll', page: 'my_payslips' },
    ],
  },
];

const STUDENT_NAV_ITEMS: { name: string; path: string; icon: React.ElementType }[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'My Profile', path: '/student/profile', icon: UserCheck },
  { name: 'Tasks', path: '/student/tasks', icon: CheckSquare },
  { name: 'Task Update', path: '/student/task-update', icon: ClipboardList },
  { name: 'Syllabus', path: '/student/syllabus', icon: BookOpen },
  { name: 'Daily Process', path: '/student/daily-process', icon: Clock },
  { name: 'Tutorials', path: '/student/tutorials', icon: PlayCircle },
  { name: 'My Progress', path: '/student/progress', icon: TrendingUp },
  { name: 'My Credits & Badges', path: '/student/credits', icon: Award },
  { name: 'My Tests', path: '/student/tests', icon: HelpCircle },
  { name: 'My Test Results', path: '/student/test-results', icon: CheckSquare },
  { name: 'Feedback', path: '/student/feedback', icon: MessageSquare },
  { name: 'Profile', path: '/student/settings', icon: User },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, companies, activeCompanyId, switchCompany, logout, checkPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isStudent = user?.user_type?.toLowerCase() === 'student';

  // Dark Mode Theme State & Persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('wegrow_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('wegrow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('wegrow_theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Auto-expand menu group that contains current route
  useEffect(() => {
    if (isStudent) return;
    const currentPath = location.pathname;
    ADMIN_MENU_STRUCTURE.forEach((group) => {
      if (group.isDropdown && group.children) {
        const matchesChild = group.children.some((c) => {
          if (c.path === '/') return currentPath === '/';
          return currentPath.startsWith(c.path.split('?')[0]);
        });
        if (matchesChild) {
          setOpenGroups((prev) => ({ ...prev, [group.title]: true }));
        }
      }
    });
  }, [location.pathname, isStudent]);

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter admin menu structure based on permissions
  const filteredAdminMenu = ADMIN_MENU_STRUCTURE.map((group) => {
    if (!group.isDropdown) {
      const allowed = checkPermission(group.page || '', 'V');
      return allowed ? group : null;
    }
    const allowedChildren = (group.children || []).filter((child) =>
      checkPermission(child.page, 'V')
    );
    if (allowedChildren.length > 0) {
      return {
        ...group,
        children: allowedChildren,
      };
    }
    return null;
  }).filter(Boolean) as MenuGroup[];

  const SidebarContent = () => {
    // If student, render student portal sidebar
    if (isStudent) {
      return (
        <div className="flex flex-col h-full bg-white">
          {/* Brand Logo Header */}
          <div className="px-5 py-4 border-b border-slate-200/80">
            <Link to="/" className="block">
              <div className="bg-slate-50/80 rounded-2xl p-2.5 shadow-xs border border-slate-200/80 flex items-center justify-center hover:bg-slate-100 transition">
                <img
                  src={logoImg}
                  alt="WeGrow Skill Campus & B School"
                  className="h-9 w-auto object-contain max-w-full"
                />
              </div>
            </Link>
            <div className="flex items-center justify-between mt-2.5 px-1">
              <span className="text-[11px] font-extrabold text-slate-800 tracking-tight">
                Student Portal
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">
                Campus ERP
              </span>
            </div>
          </div>

          {/* Student Links */}
          <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 touch-scroll">
            {STUDENT_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm shadow-sky-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-90" />}
                </Link>
              );
            })}
          </div>

          {/* User Card */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 truncate">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm bg-gradient-to-br from-sky-500 to-indigo-600">
                  {user?.name?.[0] || user?.username?.[0] || 'S'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name || user?.username}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Student</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Admin / Staff / Manager Sidebar (Ultra-Premium Midnight Obsidian & Royal Navy)
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-[#0a0f1d] via-[#0d1527] to-[#060913] text-white border-r border-slate-800/80">
        {/* Brand Logo Header */}
        <div className="px-4 py-4 border-b border-white/[0.08]">
          <Link to="/" className="block">
            <div className="bg-white/95 rounded-2xl p-2.5 shadow-md border border-white/20 flex items-center justify-center hover:opacity-100 transition">
              <img
                src={logoImg}
                alt="WeGrow Skill Campus & B School"
                className="h-9 w-auto object-contain max-w-full"
              />
            </div>
          </Link>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono">
              Admin Portal
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-950/70 text-sky-300 border border-sky-800/40">
              ERP v2.6
            </span>
          </div>
        </div>

        {/* Categorized Collapsible Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 touch-scroll">
          {filteredAdminMenu.map((group) => {
            const Icon = group.icon;

            // Direct single link (like Dashboard, Daily Report, Student Attendance)
            if (!group.isDropdown && group.path) {
              const isActive = location.pathname === group.path;
              return (
                <Link
                  key={group.title}
                  to={group.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-transparent text-sky-400 font-extrabold border-l-2 border-sky-400 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className="truncate flex-1">{group.title}</span>
                </Link>
              );
            }

            // Dropdown Group with Children (like Management, Students, Expense, etc.)
            const isOpen = !!openGroups[group.title];
            const hasActiveChild = (group.children || []).some((child) => {
              if (child.path === '/') return location.pathname === '/';
              return location.pathname === child.path.split('?')[0];
            });

            return (
              <div key={group.title} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    hasActiveChild || isOpen
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${hasActiveChild ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span className="truncate">{group.title}</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-90 text-sky-400' : ''
                    }`}
                  />
                </button>

                {/* Submenu Accordion */}
                {isOpen && group.children && (
                  <div className="pl-4 pr-1.5 py-1 space-y-0.5 bg-black/35 rounded-xl my-0.5 border border-white/[0.05]">
                    {group.children.map((child) => {
                      const childBase = child.path.split('?')[0];
                      const currentBase = location.pathname;
                      const hasQuery = child.path.includes('?');
                      const isActive = hasQuery
                        ? location.pathname + location.search === child.path ||
                          (child.path === '/tests?tab=bank' && (location.search === '?tab=bank' || location.search === '?view=bank' || location.search === '?tab=question-bank'))
                        : currentBase === childBase && !location.search;

                      return (
                        <Link
                          key={child.name + child.path}
                          to={child.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                            isActive
                              ? 'bg-sky-500/20 text-sky-300 font-black border-l-2 border-sky-400 shadow-xs'
                              : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          <span className="truncate">{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom User Info, Theme Toggle & Logout */}
        <div className="p-3 border-t border-white/[0.08] bg-[#060913]">
          <div className="flex items-center justify-between mb-2 px-1">
            <Link to="/settings" className="flex items-center gap-2.5 truncate hover:opacity-85 transition cursor-pointer" title="Profile Settings">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs shrink-0">
                {user?.name?.[0] || user?.username?.[0] || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate leading-tight">{user?.name || user?.username}</p>
                <p className="text-[10px] text-sky-400 uppercase tracking-wider font-mono">{user?.user_type}</p>
              </div>
            </Link>

            {/* Dark / Light Mode quick icon in sidebar */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-300" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-500/20 transition cursor-pointer border border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] dark:bg-[#070a13] text-slate-900 dark:text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 shadow-xl shrink-0 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer (Responsive Slide-over) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Drawer panel */}
        <div
          className={`absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-2xl transition-transform duration-300 ease-out overflow-hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 z-10 bg-white dark:bg-[#0b101d] border-b border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-4 truncate">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Brand Title */}
            <Link to="/" className="lg:hidden flex items-center gap-2">
              <div className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center">
                <img src={logoImg} alt="WeGrow" className="h-6 w-auto object-contain" />
              </div>
            </Link>

            {/* Active Branch Selector (Company Switcher) */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 dark:bg-slate-800/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 max-w-[200px] sm:max-w-xs truncate">
              <Building className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <select
                value={activeCompanyId || ''}
                onChange={(e) => switchCompany(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer truncate"
              >
                {companies.map((c) => (
                  <option key={c._id} value={c._id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                    {c.branch} ({c.company_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-[11px]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-sky-600" />
                  <span className="hidden sm:inline text-[11px]">Dark</span>
                </>
              )}
            </button>

            {isStudent && (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  {user?.username}
                </span>
                <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.name?.[0] || user?.username?.[0] || 'S'}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Scrollable Body with Theme Support */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f1f5f9] dark:bg-[#070a13] touch-scroll">
          {children}
        </main>
      </div>
    </div>
  );
};

