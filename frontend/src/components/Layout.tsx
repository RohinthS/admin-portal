import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../wegrow&Bschool.webp';
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Wallet,
  Receipt,
  DollarSign,
  Users,
  TrendingUp,
  UserCheck,
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
  CreditCard,
  Sun,
  Moon,
  CheckCircle2,
  Palette,
  Check,
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
  { name: 'Syllabus', path: '/student/syllabus', icon: BookOpen },
  { name: 'Tutorials', path: '/student/tutorials', icon: PlayCircle },
  { name: 'My Progress', path: '/student/progress', icon: TrendingUp },
  { name: 'My Credits & Badges', path: '/student/credits', icon: Award },
  { name: 'My Tests', path: '/student/tests', icon: HelpCircle },
  { name: 'Module Tests', path: '/student/module-tests', icon: CheckCircle2 },
  { name: 'My Test Results', path: '/student/test-results', icon: CheckSquare },
  { name: 'Feedback', path: '/student/feedback', icon: MessageSquare },
  { name: 'Profile', path: '/student/settings', icon: User },
];

export type SidebarTheme = 'light' | 'midnight' | 'indigo' | 'emerald' | 'charcoal';

interface SidebarThemeConfig {
  id: SidebarTheme;
  name: string;
  dotBg: string;
  wrapper: string;
  logoWrapper: string;
  logoBadge: string;
  erpBadge: string;
  itemActive: string;
  itemInactive: string;
  itemActiveIcon: string;
  itemInactiveIcon: string;
  groupHeaderOpen: string;
  submenuContainer: string;
  submenuActive: string;
  submenuInactive: string;
  footerWrapper: string;
  footerUserName: string;
  footerUserRole: string;
  footerLogoutBtn: string;
}

const SIDEBAR_THEMES: Record<SidebarTheme, SidebarThemeConfig> = {
  light: {
    id: 'light',
    name: 'Clean Light / Auto',
    dotBg: 'bg-white border-2 border-slate-300 dark:bg-slate-800',
    wrapper: 'bg-white dark:bg-[#0b101d] text-slate-800 dark:text-slate-100 border-r border-slate-200/90 dark:border-slate-800 shadow-sm',
    logoWrapper: 'bg-slate-50/90 dark:bg-slate-800/90 rounded-2xl p-2.5 shadow-xs border border-slate-200/80 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition',
    logoBadge: 'text-sky-600 dark:text-sky-400',
    erpBadge: 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    itemActive: 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-sm shadow-sky-500/25',
    itemInactive: 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60',
    itemActiveIcon: 'text-white',
    itemInactiveIcon: 'text-slate-500 dark:text-slate-400',
    groupHeaderOpen: 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-bold',
    submenuContainer: 'bg-slate-50/80 dark:bg-slate-800/50 rounded-xl my-1 border border-slate-200/80 dark:border-slate-800 pl-3 pr-1.5 py-1 space-y-0.5',
    submenuActive: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold border-l-2 border-sky-600 dark:border-sky-400',
    submenuInactive: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60',
    footerWrapper: 'p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#070a13]',
    footerUserName: 'text-slate-900 dark:text-white',
    footerUserRole: 'text-sky-600 dark:text-sky-400',
    footerLogoutBtn: 'border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Navy',
    dotBg: 'bg-[#0a0f1d] border-2 border-sky-500',
    wrapper: 'bg-gradient-to-b from-[#0a0f1d] via-[#0d1527] to-[#060913] text-white border-r border-slate-800/80',
    logoWrapper: 'bg-white/95 rounded-2xl p-2.5 shadow-md border border-white/20 flex items-center justify-center hover:opacity-100 transition',
    logoBadge: 'text-sky-400',
    erpBadge: 'bg-sky-950/70 text-sky-300 border-sky-800/40',
    itemActive: 'bg-gradient-to-r from-sky-500/25 via-sky-500/15 to-transparent text-sky-400 font-extrabold border-l-2 border-sky-400 shadow-xs',
    itemInactive: 'text-slate-300 hover:text-white hover:bg-white/[0.06]',
    itemActiveIcon: 'text-sky-400',
    itemInactiveIcon: 'text-slate-400',
    groupHeaderOpen: 'bg-white/[0.08] text-white',
    submenuContainer: 'pl-4 pr-1.5 py-1 space-y-0.5 bg-black/35 rounded-xl my-0.5 border border-white/[0.05]',
    submenuActive: 'bg-sky-500/20 text-sky-300 font-black border-l-2 border-sky-400 shadow-xs',
    submenuInactive: 'text-slate-400 hover:text-white hover:bg-white/[0.06]',
    footerWrapper: 'p-3 border-t border-white/[0.08] bg-[#060913]',
    footerUserName: 'text-white',
    footerUserRole: 'text-sky-400',
    footerLogoutBtn: 'border-rose-500/20 text-rose-300 hover:text-white hover:bg-rose-500/20',
  },
  indigo: {
    id: 'indigo',
    name: 'Royal Indigo',
    dotBg: 'bg-[#1e1b4b] border-2 border-indigo-400',
    wrapper: 'bg-gradient-to-b from-[#111827] via-[#1e1b4b] to-[#0f172a] text-white border-r border-indigo-950',
    logoWrapper: 'bg-white/95 rounded-2xl p-2.5 shadow-md border border-white/20 flex items-center justify-center hover:opacity-100 transition',
    logoBadge: 'text-indigo-400',
    erpBadge: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/40',
    itemActive: 'bg-gradient-to-r from-indigo-500/30 via-indigo-500/15 to-transparent text-indigo-300 font-extrabold border-l-2 border-indigo-400 shadow-xs',
    itemInactive: 'text-slate-300 hover:text-white hover:bg-white/[0.06]',
    itemActiveIcon: 'text-indigo-300',
    itemInactiveIcon: 'text-indigo-400/60',
    groupHeaderOpen: 'bg-white/[0.08] text-white',
    submenuContainer: 'pl-4 pr-1.5 py-1 space-y-0.5 bg-indigo-950/40 rounded-xl my-0.5 border border-indigo-800/20',
    submenuActive: 'bg-indigo-500/25 text-indigo-200 font-black border-l-2 border-indigo-400 shadow-xs',
    submenuInactive: 'text-indigo-200/70 hover:text-white hover:bg-white/[0.06]',
    footerWrapper: 'p-3 border-t border-indigo-900/40 bg-[#0f172a]',
    footerUserName: 'text-white',
    footerUserRole: 'text-indigo-300',
    footerLogoutBtn: 'border-rose-500/20 text-rose-300 hover:text-white hover:bg-rose-500/20',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Forest',
    dotBg: 'bg-[#064e3b] border-2 border-emerald-400',
    wrapper: 'bg-gradient-to-b from-[#064e3b] via-[#022c22] to-[#021d17] text-white border-r border-emerald-950',
    logoWrapper: 'bg-white/95 rounded-2xl p-2.5 shadow-md border border-white/20 flex items-center justify-center hover:opacity-100 transition',
    logoBadge: 'text-emerald-400',
    erpBadge: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/40',
    itemActive: 'bg-gradient-to-r from-emerald-500/30 via-emerald-500/15 to-transparent text-emerald-300 font-extrabold border-l-2 border-emerald-400 shadow-xs',
    itemInactive: 'text-emerald-100/80 hover:text-white hover:bg-white/[0.06]',
    itemActiveIcon: 'text-emerald-300',
    itemInactiveIcon: 'text-emerald-400/60',
    groupHeaderOpen: 'bg-white/[0.08] text-white',
    submenuContainer: 'pl-4 pr-1.5 py-1 space-y-0.5 bg-emerald-950/40 rounded-xl my-0.5 border border-emerald-800/20',
    submenuActive: 'bg-emerald-500/25 text-emerald-200 font-black border-l-2 border-emerald-400 shadow-xs',
    submenuInactive: 'text-emerald-200/70 hover:text-white hover:bg-white/[0.06]',
    footerWrapper: 'p-3 border-t border-emerald-900/40 bg-[#021d17]',
    footerUserName: 'text-white',
    footerUserRole: 'text-emerald-300',
    footerLogoutBtn: 'border-rose-500/20 text-rose-300 hover:text-white hover:bg-rose-500/20',
  },
  charcoal: {
    id: 'charcoal',
    name: 'Modern Charcoal',
    dotBg: 'bg-[#18181b] border-2 border-zinc-400',
    wrapper: 'bg-gradient-to-b from-[#18181b] via-[#27272a] to-[#09090b] text-white border-r border-zinc-800',
    logoWrapper: 'bg-white/95 rounded-2xl p-2.5 shadow-md border border-white/20 flex items-center justify-center hover:opacity-100 transition',
    logoBadge: 'text-zinc-400',
    erpBadge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    itemActive: 'bg-gradient-to-r from-zinc-700/60 via-zinc-700/30 to-transparent text-white font-extrabold border-l-2 border-white shadow-xs',
    itemInactive: 'text-zinc-300 hover:text-white hover:bg-white/[0.06]',
    itemActiveIcon: 'text-white',
    itemInactiveIcon: 'text-zinc-500',
    groupHeaderOpen: 'bg-white/[0.08] text-white',
    submenuContainer: 'pl-4 pr-1.5 py-1 space-y-0.5 bg-black/40 rounded-xl my-0.5 border border-white/[0.05]',
    submenuActive: 'bg-white/10 text-white font-black border-l-2 border-white shadow-xs',
    submenuInactive: 'text-zinc-400 hover:text-white hover:bg-white/[0.06]',
    footerWrapper: 'p-3 border-t border-zinc-800 bg-[#09090b]',
    footerUserName: 'text-white',
    footerUserRole: 'text-zinc-400',
    footerLogoutBtn: 'border-rose-500/20 text-rose-300 hover:text-white hover:bg-rose-500/20',
  },
};

const formatRoleLabel = (role?: string) => {
  if (!role) return 'USER';
  const r = role.toLowerCase();
  switch (r) {
    case 'admin': return 'ADMIN';
    case 'manager': return 'MANAGER';
    case 'gm': return 'GM';
    case 'md': return 'MD';
    case 'staff': return 'STAFF';
    case 'hr': return 'HR';
    case 'student': return 'STUDENT';
    default: return role.toUpperCase();
  }
};

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

  // Admin Sidebar Theme State with LocalStorage persistence
  const [sidebarTheme, setSidebarTheme] = useState<SidebarTheme>(() => {
    const saved = localStorage.getItem('wegrow_admin_sidebar_theme') as SidebarTheme;
    if (saved && SIDEBAR_THEMES[saved]) return saved;
    return 'light'; // Default to clean modern light
  });
  const [showPalettePopover, setShowPalettePopover] = useState(false);

  const changeSidebarTheme = (themeId: SidebarTheme) => {
    setSidebarTheme(themeId);
    localStorage.setItem('wegrow_admin_sidebar_theme', themeId);
  };

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

  // Active individual submenu item tracking (prevents sibling items sharing a route from all highlighting together)
  const [activeSubItem, setActiveSubItem] = useState<string>(() => {
    const fullPath = location.pathname + location.search;
    for (const group of ADMIN_MENU_STRUCTURE) {
      for (const child of group.children || []) {
        if (child.path === fullPath) return child.name;
      }
    }
    for (const group of ADMIN_MENU_STRUCTURE) {
      for (const child of group.children || []) {
        if (child.path.split('?')[0] === location.pathname) return child.name;
      }
    }
    return '';
  });

  // Synchronize activeSubItem when location changes if not already set to a matching child
  useEffect(() => {
    if (isStudent) return;
    const fullPath = location.pathname + location.search;
    let currentMatched = false;
    for (const group of ADMIN_MENU_STRUCTURE) {
      for (const child of group.children || []) {
        if (child.name === activeSubItem && child.path.split('?')[0] === location.pathname) {
          currentMatched = true;
          break;
        }
      }
      if (currentMatched) break;
    }
    if (!currentMatched) {
      for (const group of ADMIN_MENU_STRUCTURE) {
        for (const child of group.children || []) {
          if (child.path === fullPath || child.path.split('?')[0] === location.pathname) {
            setActiveSubItem(child.name);
            currentMatched = true;
            break;
          }
        }
        if (currentMatched) break;
      }
    }
  }, [location.pathname, location.search, isStudent]);

  // Auto-expand menu group that contains current route
  useEffect(() => {
    if (isStudent) return;
    const currentPath = location.pathname;
    ADMIN_MENU_STRUCTURE.forEach((group) => {
      if (group.isDropdown && group.children) {
        const matchesChild = group.children.some((c) => {
          if (activeSubItem) return c.name === activeSubItem;
          if (c.path === '/') return currentPath === '/';
          return currentPath.startsWith(c.path.split('?')[0]);
        });
        if (matchesChild) {
          setOpenGroups((prev) => ({ ...prev, [group.title]: true }));
        }
      }
    });
  }, [location.pathname, activeSubItem, isStudent]);

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

    // Admin / Staff / Manager Sidebar with Dynamic Color Theme
    const currentTheme = SIDEBAR_THEMES[sidebarTheme] || SIDEBAR_THEMES.light;

    return (
      <div className={`flex flex-col h-full ${currentTheme.wrapper}`}>
        {/* Brand Logo Header */}
        <div className="px-4 py-4 border-b border-white/10 dark:border-white/[0.08] border-slate-200/80">
          <Link to="/" className="block">
            <div className={currentTheme.logoWrapper}>
              <img
                src={logoImg}
                alt="WeGrow Skill Campus & B School"
                className="h-9 w-auto object-contain max-w-full"
              />
            </div>
          </Link>
          <div className="flex items-center justify-between mt-2.5 px-1">
            <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${currentTheme.logoBadge}`}>
              {formatRoleLabel(user?.user_type)} Portal
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${currentTheme.erpBadge}`}>
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
                    isActive ? currentTheme.itemActive : currentTheme.itemInactive
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? currentTheme.itemActiveIcon : currentTheme.itemInactiveIcon}`} />
                  <span className="truncate flex-1">{group.title}</span>
                </Link>
              );
            }

            // Dropdown Group with Children (like Creation, Payroll, Expense, etc.)
            const isOpen = !!openGroups[group.title];
            const hasActiveChild = (group.children || []).some((child) => {
              if (activeSubItem) return child.name === activeSubItem;
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
                      ? currentTheme.groupHeaderOpen
                      : currentTheme.itemInactive
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${hasActiveChild ? currentTheme.itemActiveIcon : currentTheme.itemInactiveIcon}`} />
                    <span className="truncate">{group.title}</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-90 ' + currentTheme.itemActiveIcon : currentTheme.itemInactiveIcon
                    }`}
                  />
                </button>

                {/* Submenu Accordion */}
                {isOpen && group.children && (
                  <div className={currentTheme.submenuContainer}>
                    {group.children.map((child) => {
                      const isActive = activeSubItem
                        ? child.name === activeSubItem
                        : location.pathname === child.path.split('?')[0];

                      return (
                        <Link
                          key={child.name + child.path}
                          to={child.path}
                          onClick={() => {
                            setActiveSubItem(child.name);
                            setMobileMenuOpen(false);
                          }}
                          className={`flex items-center px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                            isActive ? currentTheme.submenuActive : currentTheme.submenuInactive
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
        <div className={currentTheme.footerWrapper}>
          <div className="flex items-center justify-between mb-2 px-1">
            <Link to="/settings" className="flex items-center gap-2.5 truncate hover:opacity-85 transition cursor-pointer" title="Profile Settings">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs shrink-0">
                {user?.name?.[0] || user?.username?.[0] || 'U'}
              </div>
              <div className="truncate">
                <p className={`text-xs font-bold truncate leading-tight ${currentTheme.footerUserName}`}>{user?.name || user?.username}</p>
                <p className={`text-[10px] uppercase tracking-wider font-mono ${currentTheme.footerUserRole}`}>{formatRoleLabel(user?.user_type)}</p>
              </div>
            </Link>

            {/* Dark / Light Mode quick icon in sidebar */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-500" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${currentTheme.footerLogoutBtn}`}
          >
            <LogOut className="w-3.5 h-3.5" />
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
            {/* Sidebar Theme Quick Palette Switcher (for Admin/Staff) */}
            {!isStudent && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPalettePopover(!showPalettePopover)}
                  title="Customize Sidebar Color"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span className="hidden sm:inline text-[11px] capitalize">{SIDEBAR_THEMES[sidebarTheme]?.name || 'Sidebar'}</span>
                </button>

                {showPalettePopover && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 space-y-1"
                    onMouseLeave={() => setShowPalettePopover(false)}
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Sidebar Color</p>
                    {(Object.keys(SIDEBAR_THEMES) as SidebarTheme[]).map((tKey) => {
                      const t = SIDEBAR_THEMES[tKey];
                      const isSelected = sidebarTheme === tKey;
                      return (
                        <button
                          key={tKey}
                          type="button"
                          onClick={() => {
                            changeSidebarTheme(tKey);
                            setShowPalettePopover(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded-full ${t.dotBg}`} />
                            <span>{t.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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

