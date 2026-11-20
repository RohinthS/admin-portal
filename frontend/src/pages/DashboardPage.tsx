import React, { useState, useEffect } from 'react';
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
  Award,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, activeCompanyId } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState<any>(null);

  const isStudent = user?.user_type?.toLowerCase() === 'student';

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
  }, [activeCompanyId, isStudent]);

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
  // 2. MANAGER & ADMIN DASHBOARD SECTIONS (MATCHING IMAGE 1 & PHP)
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
    </div>
  );
};
