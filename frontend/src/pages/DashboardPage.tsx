import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  HelpCircle,
  IndianRupee,
  TrendingUp,
  CreditCard,
  Building,
  ArrowUpRight,
  Sparkles,
  CalendarCheck,
  CheckSquare,
  Clock,
  BookOpen,
  PlayCircle,
  UserCheck,
  ChevronRight,
  Receipt,
  FileSpreadsheet,
  X,
  Filter,
  Search,
  Download,
  AlertTriangle,
  AlertCircle,
  Calendar,
  User,
  Eye,
  RefreshCw,
  ChevronLeft,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, activeCompanyId } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState<any>(null);

  // Fee Analytics & Pending Fees State (for Admin & Manager)
  const [feeAnalytics, setFeeAnalytics] = useState<any>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  // Filters for Pending Fees & Analytics
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterMentor, setFilterMentor] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterFy, setFilterFy] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Table pagination
  const [tablePage, setTablePage] = useState<number>(1);
  const [tablePageSize, setTablePageSize] = useState<number>(10);

  // Modal for individual student payment history
  const [viewHistoryStudent, setViewHistoryStudent] = useState<any | null>(null);

  const isStudent = user?.user_type?.toLowerCase() === 'student';

  const fetchFeeAnalytics = useCallback(async () => {
    if (isStudent) return;
    try {
      setFeeLoading(true);
      const res = await api.get('/reports/fee-analytics', {
        params: {
          company_id: activeCompanyId,
          financial_year: filterFy !== 'all' ? filterFy : undefined,
          month: filterMonth !== 'all' ? filterMonth : undefined,
        },
      });
      setFeeAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load fee analytics', err);
    } finally {
      setFeeLoading(false);
    }
  }, [activeCompanyId, isStudent, filterFy, filterMonth]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        if (isStudent) {
          const res = await api.get('/reports/student-dashboard', {
            params: { company_id: activeCompanyId },
          });
          setStats(res.data);
        } else {
          const res = await api.get('/reports/dashboard', {
            params: { company_id: activeCompanyId },
          });
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    fetchFeeAnalytics();

    // Automatic real-time updates when payments or assessments are recorded
    const handlePaymentUpdate = () => {
      fetchDashboard();
      fetchFeeAnalytics();
    };

    window.addEventListener('wegrow_payment_recorded', handlePaymentUpdate);
    window.addEventListener('wegrow_assessments_updated', handlePaymentUpdate);
    return () => {
      window.removeEventListener('wegrow_payment_recorded', handlePaymentUpdate);
      window.removeEventListener('wegrow_assessments_updated', handlePaymentUpdate);
    };
  }, [activeCompanyId, isStudent, fetchFeeAnalytics]);

  // ----------------------------------------------------
  // Dynamic Fee & Revenue Analytics Calculations
  // ----------------------------------------------------
  const summaryEnrolled = feeAnalytics?.summaryCards?.totalEnrolled ?? stats?.totalEnrollments ?? 0;
  const summaryCollected = feeAnalytics?.summaryCards?.totalFeesCollected ?? stats?.totalCollection ?? 0;
  const summaryPending = feeAnalytics?.summaryCards?.totalPendingFees ?? Math.max(0, (stats?.totalEnrollments || 0) * 30000 - summaryCollected);
  const summaryCurrentMonth = feeAnalytics?.summaryCards?.currentMonthCollection ?? 0;

  // Filtered Pending Students
  const filteredStudents = useMemo(() => {
    if (!feeAnalytics?.pendingStudents) return [];
    return feeAnalytics.pendingStudents.filter((student: any) => {
      if (filterCourse !== 'all' && student.course_name?.toLowerCase() !== filterCourse.toLowerCase()) {
        return false;
      }
      if (filterMentor !== 'all' && student.mentor_name?.toLowerCase() !== filterMentor.toLowerCase()) {
        return false;
      }
      if (filterBatch !== 'all' && !student.batch?.toLowerCase().includes(filterBatch.toLowerCase())) {
        return false;
      }
      if (filterMonth !== 'all' && student.due_date) {
        const d = new Date(student.due_date);
        const monthNum = String(d.getMonth() + 1).padStart(2, '0');
        const monthKey = `${d.getFullYear()}-${monthNum}`;
        if (filterMonth.includes('-')) {
          if (monthKey !== filterMonth) return false;
        } else {
          if (monthNum !== filterMonth) return false;
        }
      }
      if (filterStatus !== 'all' && student.payment_status?.toLowerCase() !== filterStatus.toLowerCase()) {
        return false;
      }
      if (searchStudent.trim()) {
        const q = searchStudent.toLowerCase().trim();
        const matchesName = student.student_name?.toLowerCase().includes(q);
        const matchesId = student.student_id?.toLowerCase().includes(q);
        const matchesPhone = student.phone?.includes(q);
        if (!matchesName && !matchesId && !matchesPhone) return false;
      }
      return true;
    });
  }, [feeAnalytics, filterCourse, filterMentor, filterBatch, filterMonth, filterStatus, searchStudent]);

  const overdueCount = useMemo(() => {
    return filteredStudents.filter((s: any) => s.payment_status === 'overdue').length;
  }, [filteredStudents]);

  const totalTableEntries = filteredStudents.length;
  const totalTablePages = Math.ceil(totalTableEntries / tablePageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return filteredStudents.slice(start, start + tablePageSize);
  }, [filteredStudents, tablePage, tablePageSize]);

  const filteredMonthlyData = useMemo(() => {
    if (!feeAnalytics?.monthlyData) return [];
    let list = feeAnalytics.monthlyData;
    if (filterFy === 'FY 2026-2027') {
      list = list.filter((m: any) => {
        const [y, mon] = m.month.split('-').map(Number);
        return (y === 2026 && mon >= 4) || (y === 2027 && mon <= 3);
      });
    } else if (filterFy === 'FY 2025-2026') {
      list = list.filter((m: any) => {
        const [y, mon] = m.month.split('-').map(Number);
        return (y === 2025 && mon >= 4) || (y === 2026 && mon <= 3);
      });
    }

    if (filterMonth !== 'all') {
      list = list.filter((m: any) => {
        if (filterMonth.includes('-')) return m.month === filterMonth;
        return String(m.monthNumber).padStart(2, '0') === filterMonth;
      });
    }
    return list;
  }, [feeAnalytics, filterFy, filterMonth]);

  const maxGraphValue = useMemo(() => {
    let max = 50000;
    filteredMonthlyData.forEach((d: any) => {
      if (d.collected > max) max = d.collected;
      if (d.pending > max) max = d.pending;
    });
    return max;
  }, [filteredMonthlyData]);

  const exportPendingFeesToExcel = () => {
    if (filteredStudents.length === 0) {
      alert('No pending fee records match the selected filters to export.');
      return;
    }

    const headers = [
      'S.No',
      'Student ID',
      'Student Name',
      'Course',
      'Batch',
      'Assigned Mentor',
      'Total Fees (INR)',
      'Paid Amount (INR)',
      'Pending Amount (INR)',
      'Due Date',
      'Payment Status',
      'Contact Phone',
    ];

    const rows = filteredStudents.map((s: any, idx: number) => [
      idx + 1,
      `"${s.student_id}"`,
      `"${s.student_name}"`,
      `"${s.course_name}"`,
      `"${s.batch}"`,
      `"${s.mentor_name}"`,
      s.total_fees,
      s.paid_amount,
      s.pending_amount,
      `"${new Date(s.due_date).toLocaleDateString('en-GB')}"`,
      `"${s.payment_status.toUpperCase()}"`,
      `"${s.phone || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `WeGrow_Pending_Fees_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // ==========================================
  // STUDENT DASHBOARD (MATCHING OLD PHP SITE & IMAGE 2)
  // ==========================================
  if (isStudent) {
    const student = stats?.student || {};
    const attendancePct = stats?.attendance_percentage || 0;
    const pendingTasks = stats?.pending_tasks_count || 0;
    const reportsCount = stats?.reports_submitted_count || 0;
    const todayTasks = stats?.today_tasks || [];
    const totalFees = student.total_fees || 0;
    const paidAmount = student.paid_amount || 0;
    const balanceAmount = student.balance_amount || Math.max(0, totalFees - paidAmount);
    const feeProgress = totalFees > 0 ? Math.min(100, Math.round((paidAmount / totalFees) * 100)) : 0;

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header (Matching Image 2: Welcome, Udhayakumar / Role: Student / WGF26012) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome, {student.name || user?.name || 'Student'}
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Role: Student</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
              {student.enrollment_no || user?.username}
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-xs uppercase">
              {user?.name?.[0] || user?.username?.[0] || 'W'}
            </div>
          </div>
        </div>

        {/* 3 Metric Cards Grid (Matching Image 2) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Attendance Percentage */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-sky-500 rounded-l-xl" />
            <div className="pl-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-600 tracking-wider">
                ATTENDANCE PERCENTAGE
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {attendancePct}%
              </p>
            </div>
          </div>

          {/* Card 2: Pending Student Tasks */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-sky-500 rounded-l-xl" />
            <div className="pl-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-600 tracking-wider">
                PENDING STUDENT TASKS
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {pendingTasks}
              </p>
            </div>
          </div>

          {/* Card 3: Daily Reports Submitted */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-sky-500 rounded-l-xl" />
            <div className="pl-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-600 tracking-wider">
                DAILY REPORTS SUBMITTED
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {reportsCount}
              </p>
            </div>
          </div>
        </div>

        {/* Main Panel: My Assigned Student Tasks (Today) (Matching Image 2) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <h2 className="text-sm sm:text-base font-extrabold text-sky-600 tracking-tight">
              My Assigned Student Tasks (Today)
            </h2>
            <Link
              to="/student/tasks"
              className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition shadow-xs"
            >
              View All
            </Link>
          </div>

          <div className="overflow-x-auto touch-scroll rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs min-w-[550px] border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-3.5 py-3 w-16 text-center border-r border-slate-200 dark:border-slate-700">S.NO</th>
                  <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">TASK TITLE</th>
                  <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">ASSIGNED TO</th>
                  <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">DUE DATE</th>
                  <th className="px-4 py-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                {todayTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-xs">
                      No tasks found today.
                    </td>
                  </tr>
                ) : (
                  todayTasks.map((t: any, idx: number) => {
                    const isDone = t.status === 'completed' || t.status === 'Completed';
                    const isInProg = t.status === 'in_progress' || t.status === 'In Progress';
                    return (
                      <tr key={t._id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="px-3.5 py-3 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">{t.title}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                          Me ({student.enrollment_no || user?.username})
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono border-r border-slate-200 dark:border-slate-700">
                          {t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                              isDone
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                                : isInProg
                                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                            }`}
                          >
                            {t.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic Overview & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enrolled Course Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Enrolled Program
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {student.course_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {student.branch} • {student.company_name}
                </p>
              </div>

              <Link
                to="/student/profile"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Fee Progress */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Total Course Fee:</span>
                <span className="font-black text-slate-900">₹{totalFees.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-emerald-700">Amount Paid:</span>
                <span className="font-black text-emerald-700">₹{paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-amber-700">Balance Due:</span>
                <span className="font-black text-amber-700">₹{balanceAmount.toLocaleString()}</span>
              </div>

              <div className="pt-1">
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${feeProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <h3 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider mb-3">
              Quick Shortcuts
            </h3>
            <div className="space-y-2 text-xs font-bold">
              <Link
                to="/student/daily-process"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition border border-slate-200/60"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Daily Process Log</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                to="/student/syllabus"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition border border-slate-200/60"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  <span>Course Syllabus</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                to="/student/tutorials"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition border border-slate-200/60"
              >
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-emerald-600" />
                  <span>Video Tutorials</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>

              <Link
                to="/student/tests"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition border border-slate-200/60"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  <span>Online Assessment</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MANAGER & ADMIN DASHBOARD SECTIONS (MATCHING IMAGE 1 & PHP)
  // ==========================================
  const isManager = user?.user_type === 'manager' || user?.user_type === 'director';
  const isAdmin = user?.user_type === 'admin';

  const pendingReminders = stats?.pending_reminders || [];
  const actionRequiredCount = stats?.action_required_count || pendingReminders.length;
  const managerStats = stats?.manager_stats || {
    pending_tasks: stats?.pendingTasks || 0,
    tasks_completed: 0,
    reports_submitted: 0,
    pending_leaves: 0,
  };
  const todayTasks = stats?.today_tasks || [];

  const kpis = [
    {
      title: 'Total Enrollments',
      value: stats?.totalEnrollments || 0,
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      badge: '+12% this month',
    },
    {
      title: 'Course Enquiries',
      value: stats?.totalEnquiries || 0,
      icon: HelpCircle,
      color: 'from-purple-600 to-pink-600',
      badge: 'Active Leads',
    },
    {
      title: 'Total Collections',
      value: `₹${(stats?.totalCollection || 0).toLocaleString()}`,
      icon: IndianRupee,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Fees Received',
    },
    {
      title: 'Net Profit Margin',
      value: `₹${(stats?.netProfit || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      badge: 'Operating Balance',
    },
  ];


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Welcome Bar (Matching Image 1: Welcome, Vignesh A / Role: Manager) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome, {user?.name || user?.username || 'Administrator'}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5 capitalize">
            Role: {user?.user_type || 'Manager'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              {user?.username}
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center uppercase shadow-2xs">
              {user?.name?.[0] || user?.username?.[0] || 'V'}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. INSTALLMENT PAYMENT REMINDERS (MATCHING IMAGE 1) */}
      {/* ======================================================== */}
      {(isManager || isAdmin) && pendingReminders.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          {/* Top orange gradient bar */}
          <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />

          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🔔</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  Installment Payment Reminders
                </h3>
              </div>
              <span className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                {actionRequiredCount} Action Required
              </span>
            </div>

            {/* Scrollable list of reminders */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 touch-scroll">
              {pendingReminders.map((rem: any, idx: number) => {
                const isOverdue = rem.priority === 'overdue';
                const formattedDueDate = rem.due_date
                  ? new Date(rem.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : 'N/A';
                const formattedDoj = rem.doj
                  ? new Date(rem.doj).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : 'N/A';

                return (
                  <div
                    key={rem._id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-sky-300 hover:shadow-xs transition duration-150 gap-3"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0 ${
                        isOverdue ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        💰
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setSelectedReminder(rem)}
                            className="font-bold text-sky-600 hover:text-sky-800 hover:underline text-sm text-left cursor-pointer"
                          >
                            {rem.student_name}
                          </button>
                          <span className="text-xs text-slate-500 font-normal">
                            (ID: {rem.enrollment_no || 'N/A'})
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Course: <strong className="text-slate-700">{rem.course_name}</strong> | DOJ: {formattedDoj}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                      <div className="text-left sm:text-right">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {isOverdue ? 'Overdue' : 'Due Soon'}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          Due Date: <strong className="text-slate-700">{formattedDueDate}</strong>
                        </p>
                      </div>

                      <div className="sm:border-l sm:border-slate-200 sm:pl-5 text-right min-w-[130px]">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          INSTALLMENT DUE
                        </p>
                        <p className={`text-base font-black ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                          ₹{Number(rem.due_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[11px] text-slate-400 font-semibold">
                          Bal: ₹{Number(rem.balance_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. FOUR MANAGER STATS CARDS (MATCHING IMAGE 1) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Tasks */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
            PENDING TASKS
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {managerStats.pending_tasks}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500" />
        </div>

        {/* Tasks Completed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
            TASKS COMPLETED
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {managerStats.tasks_completed}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
        </div>

        {/* Reports Submitted */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
            REPORTS SUBMITTED
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {managerStats.reports_submitted}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
        </div>

        {/* Pending Leave Approvals */}
        <Link
          to="/leaves"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden hover:border-amber-400 transition cursor-pointer block"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
            PENDING LEAVE APPROVALS
          </div>
          <div className="text-3xl font-black text-amber-500 mt-2">
            {managerStats.pending_leaves}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
        </Link>
      </div>

      {/* ======================================================== */}
      {/* 3. MY ASSIGNED STUDENT TASKS (TODAY) (MATCHING IMAGE 1) */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-sky-600">
            My Assigned Student Tasks (Today)
          </h3>
          <Link
            to="/tasks"
            className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-2xs transition"
          >
            View All
          </Link>
        </div>

        <div className="overflow-x-auto touch-scroll rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <table className="w-full text-left text-xs min-w-[600px] border-collapse">
            <thead className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center border-r border-slate-200 dark:border-slate-700">S.NO</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">TASK TITLE</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">ASSIGNED TO</th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">DUE DATE</th>
                <th className="py-2.5 px-3 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
              {todayTasks.length > 0 ? (
                todayTasks.map((t: any, idx: number) => {
                  const formattedDue = t.due_date
                    ? new Date(t.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : 'Today';

                  const isCompleted = t.status === 'completed';

                  return (
                    <tr key={t._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">{t.title}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">{t.assigned_to}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">{formattedDue}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          isCompleted
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 font-semibold">
                    No tasks found today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. ADMIN EXECUTIVE KPI METRICS (FOR ADMIN ROLE) */}
      {/* ======================================================== */}
      {isAdmin && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Executive Management Analytics</span>
                <Sparkles className="w-4 h-4 text-sky-500" />
              </h2>
              <p className="text-xs text-slate-500">
                Live branch collections, active leads, and operating profit
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-sky-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {kpi.title}
                    </span>
                    <div className={`p-2 rounded-xl bg-gradient-to-tr ${kpi.color} text-white shadow-md`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-black text-slate-900">{kpi.value}</h3>
                    <p className="text-[11px] font-semibold text-sky-600 mt-1 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{kpi.badge}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Splits & Recent Enrollments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Collection Split */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs lg:col-span-1">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-500" />
                <span>Payment Collection Split</span>
              </h4>

              <div className="space-y-2.5">
                {Object.entries(stats?.modeBreakdown || {}).map(([mode, amount]: [string, any]) => (
                  <div
                    key={mode}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <span className="text-xs font-bold capitalize text-slate-700">
                      {mode.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-black text-emerald-600">
                      ₹{Number(amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Enrollments */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs lg:col-span-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-500" />
                <span>Recent Student Enrollments</span>
              </h4>

              <div className="overflow-x-auto touch-scroll rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs min-w-[550px] border-collapse">
                  <thead className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 font-semibold">
                    <tr>
                      <th className="px-3 py-3 w-14 text-center border-r border-slate-200 dark:border-slate-700">S.NO</th>
                      <th className="px-3.5 py-3 border-r border-slate-200 dark:border-slate-700">Enrollment No</th>
                      <th className="px-3.5 py-3 border-r border-slate-200 dark:border-slate-700">Student Name</th>
                      <th className="px-3.5 py-3 border-r border-slate-200 dark:border-slate-700">Course</th>
                      <th className="px-3.5 py-3 border-r border-slate-200 dark:border-slate-700">Type</th>
                      <th className="px-3.5 py-3 text-right">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                    {stats?.recentEnrollments?.length > 0 ? (
                      stats.recentEnrollments.map((enr: any, idx: number) => (
                        <tr key={enr._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                          <td className="px-3 py-3 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                            {idx + 1}
                          </td>
                          <td className="px-3.5 py-3 font-mono font-bold text-sky-600 dark:text-sky-400 border-r border-slate-200 dark:border-slate-700">
                            {enr.enrollment_no}
                          </td>
                          <td className="px-3.5 py-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                            {enr.student_name}
                          </td>
                          <td className="px-3.5 py-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                            {enr.course_id?.course_name || 'N/A'}
                          </td>
                          <td className="px-3.5 py-3 border-r border-slate-200 dark:border-slate-700">
                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {enr.course_type}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                            ₹{(enr.paid_amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          No enrollments found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 1. FEE COLLECTION & REVENUE SUMMARY CARDS */}
          {/* ======================================================== */}
          <div className="space-y-3 pt-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Fee Collection & Outstanding Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </h3>
                <p className="text-xs text-slate-500">
                  Live accounting summary across all enrolled programs and payment modes
                </p>
              </div>
              <button
                type="button"
                onClick={fetchFeeAnalytics}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${feeLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Live Data</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Enrolled Students */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Enrolled Students
                  </span>
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white shadow-sm">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-slate-900">{summaryEnrolled}</h3>
                  <p className="text-[11px] font-semibold text-indigo-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Total active admissions</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Total Fees Collected */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Fees Collected
                  </span>
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-sm">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-emerald-600">
                    ₹{summaryCollected.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Successful receipt transactions</span>
                  </p>
                </div>
              </div>

              {/* Card 3: Total Pending Fees */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-rose-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Pending Fees
                  </span>
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-600 text-white shadow-sm">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-rose-600">
                    ₹{summaryPending.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Total Course Fees - Total Collections</span>
                  </p>
                </div>
              </div>

              {/* Card 4: Current Month's Fee Collection */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-purple-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Current Month Collection
                  </span>
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-500 to-violet-600 text-white shadow-sm">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-purple-600">
                    ₹{summaryCurrentMonth.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[11px] font-semibold text-purple-600 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })} collections</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. MONTHLY COLLECTION & PENDING FEES GRAPH */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Monthly Collection vs Pending Fees Analysis</span>
                  <TrendingUp className="w-4 h-4 text-sky-500" />
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Actual month-wise comparison of fees collected and pending scheduled installments
                </p>
              </div>

              {/* Filters for Graph */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Financial Year Filter */}
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span className="font-semibold text-slate-500">FY:</span>
                  <select
                    value={filterFy}
                    onChange={(e) => {
                      setFilterFy(e.target.value);
                      setTablePage(1);
                    }}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Financial Years</option>
                    <option value="FY 2026-2027">FY 2026-2027</option>
                    <option value="FY 2025-2026">FY 2025-2026</option>
                  </select>
                </div>

                {/* Month Filter */}
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span className="font-semibold text-slate-500">Month:</span>
                  <select
                    value={filterMonth}
                    onChange={(e) => {
                      setFilterMonth(e.target.value);
                      setTablePage(1);
                    }}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Months</option>
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200 text-[11px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-500" />
                    <span className="text-slate-600">Collected Fees</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-rose-500" />
                    <span className="text-slate-600">Pending Fees</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Bar Graph Visualizer */}
            {filteredMonthlyData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium text-xs">
                No monthly collection records found for the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto touch-scroll pt-4 pb-2">
                <div className="min-w-[700px] flex items-end justify-between gap-3 h-64 px-2 pb-6 border-b border-slate-200 relative">
                  {/* Subtle horizontal grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                  </div>

                  {filteredMonthlyData.map((d: any, idx: number) => {
                    const colH = Math.max(4, Math.round((d.collected / maxGraphValue) * 180));
                    const penH = Math.max(4, Math.round((d.pending / maxGraphValue) * 180));

                    return (
                      <div
                        key={d.month || idx}
                        className="flex-1 flex flex-col items-center group relative z-10"
                      >
                        {/* Hover Tooltip Popup */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 bg-slate-900 text-white text-[10px] rounded-xl py-1.5 px-3 shadow-xl pointer-events-none whitespace-nowrap z-30">
                          <p className="font-bold text-sky-400">{d.label}</p>
                          <p className="text-emerald-300">Collected: ₹{d.collected.toLocaleString('en-IN')}</p>
                          <p className="text-rose-300">Pending: ₹{d.pending.toLocaleString('en-IN')}</p>
                        </div>

                        {/* Dual Bar Column */}
                        <div className="w-full flex items-end justify-center gap-1.5 h-[190px]">
                          {/* Collected Bar (Emerald) */}
                          <div
                            style={{ height: `${colH}px` }}
                            className="w-4 sm:w-5 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md hover:brightness-110 transition shadow-xs cursor-pointer relative"
                            title={`Collected: ₹${d.collected.toLocaleString('en-IN')}`}
                          />
                          {/* Pending Bar (Rose/Amber) */}
                          <div
                            style={{ height: `${penH}px` }}
                            className="w-4 sm:w-5 bg-gradient-to-t from-rose-600 to-amber-500 rounded-t-md hover:brightness-110 transition shadow-xs cursor-pointer relative"
                            title={`Pending: ₹${d.pending.toLocaleString('en-IN')}`}
                          />
                        </div>

                        {/* Month Label */}
                        <span className="text-[10px] font-bold text-slate-500 mt-2 truncate max-w-[50px] text-center">
                          {d.label.split(' ')[0]}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {d.label.split(' ')[1] || ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 3. PENDING FEES STUDENTS TABLE & MULTI-FILTERS */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Pending Fees Student Directory</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                    {filteredStudents.length} Students Pending
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track student-wise course fee balances, assigned mentors, batches, due dates, and payment history
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportPendingFeesToExcel}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to Excel (.xlsx/.csv)</span>
                </button>
              </div>
            </div>

            {/* Overdue Payments Alert Banner */}
            {overdueCount > 0 && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Attention:</strong> {overdueCount} student{overdueCount > 1 ? 's have' : ' has'} overdue fee payments past the scheduled installment due date.
                </span>
              </div>
            )}

            {/* Multi-Filters & Search Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              {/* Search by Name/ID */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student name, ID or phone..."
                  value={searchStudent}
                  onChange={(e) => {
                    setSearchStudent(e.target.value);
                    setTablePage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Course Filter */}
              <div>
                <select
                  value={filterCourse}
                  onChange={(e) => {
                    setFilterCourse(e.target.value);
                    setTablePage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
                >
                  <option value="all">All Courses</option>
                  {(feeAnalytics?.filters?.courses || []).map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Mentor Filter */}
              <div>
                <select
                  value={filterMentor}
                  onChange={(e) => {
                    setFilterMentor(e.target.value);
                    setTablePage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
                >
                  <option value="all">All Mentors</option>
                  {(feeAnalytics?.filters?.mentors || []).map((m: string) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Batch Filter */}
              <div>
                <select
                  value={filterBatch}
                  onChange={(e) => {
                    setFilterBatch(e.target.value);
                    setTablePage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
                >
                  <option value="all">All Batches</option>
                  <option value="Morning">Morning Batch</option>
                  <option value="Afternoon">Afternoon Batch</option>
                  <option value="Evening">Evening Batch</option>
                </select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setTablePage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="overdue">🔴 Overdue</option>
                  <option value="partially_paid">🟡 Partially Paid</option>
                  <option value="pending">🔵 Pending</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto touch-scroll rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs min-w-[950px] border-collapse">
                <thead className="text-[11px] font-black uppercase tracking-wider text-slate-600 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 text-center w-12 border-r border-slate-200">S.No</th>
                    <th className="py-3 px-3 border-r border-slate-200">Student ID & Name</th>
                    <th className="py-3 px-3 border-r border-slate-200">Course & Batch</th>
                    <th className="py-3 px-3 border-r border-slate-200">Assigned Mentor</th>
                    <th className="py-3 px-3 text-right border-r border-slate-200">Total Fees</th>
                    <th className="py-3 px-3 text-right border-r border-slate-200">Paid Amount</th>
                    <th className="py-3 px-3 text-right border-r border-slate-200">Pending Amount</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200">Due Date</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200">Payment Status</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 font-semibold">
                        No pending fee records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s: any, idx: number) => {
                      const isOverdue = s.payment_status === 'overdue';
                      const isPartiallyPaid = s.payment_status === 'partially_paid';
                      const formattedDueDate = s.due_date
                        ? new Date(s.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '-';

                      return (
                        <tr
                          key={s._id || idx}
                          className={`hover:bg-slate-50/80 transition ${
                            isOverdue ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                            {(tablePage - 1) * tablePageSize + idx + 1}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200">
                            <div className="font-bold text-slate-900">{s.student_name}</div>
                            <div className="text-[11px] font-mono text-sky-600 font-semibold">
                              {s.student_id}
                            </div>
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200">
                            <div className="font-semibold text-slate-800">{s.course_name}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{s.batch}</div>
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                              <span>👨‍🏫</span>
                              <span>{s.mentor_name}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-700 border-r border-slate-200">
                            ₹{s.total_fees.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600 border-r border-slate-200">
                            ₹{s.paid_amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-rose-600 border-r border-slate-200">
                            ₹{s.pending_amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-[11px] font-semibold border-r border-slate-200">
                            <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                              {formattedDueDate}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center border-r border-slate-200">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                isOverdue
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : isPartiallyPaid
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-sky-50 text-sky-700 border-sky-200'
                              }`}
                            >
                              {isOverdue ? 'Overdue' : isPartiallyPaid ? 'Partially Paid' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setViewHistoryStudent(s)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200 transition cursor-pointer"
                            >
                              View History
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Counter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={tablePageSize}
                  onChange={(e) => {
                    setTablePageSize(Number(e.target.value));
                    setTablePage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>students per page</span>
                <span className="text-slate-300">|</span>
                <span>
                  Showing {totalTableEntries === 0 ? 0 : (tablePage - 1) * tablePageSize + 1} to{' '}
                  {Math.min(tablePage * tablePageSize, totalTableEntries)} of {totalTableEntries} students
                </span>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={tablePage <= 1}
                  onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-xs font-mono font-bold text-slate-700">
                  {tablePage} / {totalTablePages}
                </span>
                <button
                  type="button"
                  disabled={tablePage >= totalTablePages}
                  onClick={() => setTablePage((p) => Math.min(totalTablePages, p + 1))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: STUDENT INSTALLMENT DETAILS */}
      {/* ======================================================== */}
      {selectedReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Student Installment Details</h3>
              <button
                onClick={() => setSelectedReminder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="font-bold text-slate-900 text-sm">{selectedReminder.student_name}</p>
                <p className="text-slate-500 font-mono">ID: {selectedReminder.enrollment_no}</p>
                <p className="text-slate-600 font-medium">Course: {selectedReminder.course_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Installment Due</span>
                  <p className="text-base font-black text-red-600 mt-0.5">
                    ₹{Number(selectedReminder.due_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Due: {new Date(selectedReminder.due_date).toLocaleDateString('en-GB')}
                  </p>
                </div>

                <div className="p-3 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total Balance</span>
                  <p className="text-base font-black text-slate-800 mt-0.5">
                    ₹{Number(selectedReminder.balance_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Paid: ₹{Number(selectedReminder.paid_amount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReminder(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <Link
                to="/receipts"
                className="px-4 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-xs transition"
              >
                Go to Receipts & Collections
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: INDIVIDUAL STUDENT PAYMENT HISTORY */}
      {/* ======================================================== */}
      {viewHistoryStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto touch-scroll">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Student Fee & Payment History</h3>
                <p className="text-xs text-slate-500">
                  Ledger of verified fee receipts and payment modes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewHistoryStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Profile Card */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{viewHistoryStudent.student_name}</h4>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: <strong className="text-sky-600">{viewHistoryStudent.student_id}</strong> | Phone: {viewHistoryStudent.phone || 'N/A'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                    {viewHistoryStudent.batch}
                  </span>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    Mentor: {viewHistoryStudent.mentor_name}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-500">Fee Payment Progress</span>
                  <span className="text-indigo-600">
                    {viewHistoryStudent.total_fees > 0
                      ? Math.min(100, Math.round((viewHistoryStudent.paid_amount / viewHistoryStudent.total_fees) * 100))
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        viewHistoryStudent.total_fees > 0
                          ? Math.min(100, Math.round((viewHistoryStudent.paid_amount / viewHistoryStudent.total_fees) * 100))
                          : 0
                      }%`,
                    }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Financial Quick Cards */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Fee</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">
                  ₹{viewHistoryStudent.total_fees.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 uppercase font-bold block">Paid Amount</span>
                <span className="text-sm font-black text-emerald-700 mt-1 block">
                  ₹{viewHistoryStudent.paid_amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[10px] text-rose-700 uppercase font-bold block">Pending Balance</span>
                <span className="text-sm font-black text-rose-700 mt-1 block">
                  ₹{viewHistoryStudent.pending_amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Receipt Transactions Table */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Payment Transactions ({viewHistoryStudent.receipts?.length || 0})
              </h5>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs min-w-[500px] border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Receipt No</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Mode Split</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {!viewHistoryStudent.receipts || viewHistoryStudent.receipts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                          No payment receipts recorded yet for this student.
                        </td>
                      </tr>
                    ) : (
                      viewHistoryStudent.receipts.map((r: any, idx: number) => {
                        const rDate = r.date ? new Date(r.date).toLocaleDateString('en-GB') : '-';
                        const modes = (r.payment_splits || [])
                          .map((s: any) => `${s.mode?.toUpperCase()}: ₹${s.amount}`)
                          .join(', ');

                        return (
                          <tr key={r._id || idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-sky-600">
                              {r.receipt_no || `REC-${idx + 1}`}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{rDate}</td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">{modes || 'Standard'}</td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-600">
                              ₹{(r.amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">{r.remarks || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewHistoryStudent(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <Link
                to="/receipts"
                className="px-4 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-xs transition"
              >
                Record New Payment
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
