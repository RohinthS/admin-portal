import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  CalendarCheck,
  CheckSquare,
  Briefcase,
  Sparkles,
  Clock,
  AlertCircle,
  ChevronRight,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';

export const StudentProgressPage: React.FC = () => {
  const { user, activeCompanyId } = useAuth();
  const studentId = user?._id || user?.id || 'CURRENT_STUDENT';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const dashRes = await api.get('/reports/student-dashboard', {
          params: { company_id: activeCompanyId },
        });
        setData(dashRes.data);
      } catch (err) {
        console.error('Failed to load academic progress', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [activeCompanyId, studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const attendance = Number(data?.attendance_percentage) || 0;
  const allTasks = Array.isArray(data?.all_tasks) ? data.all_tasks : [];
  const completedTasks = allTasks.filter(
    (t: any) => t?.status === 'completed' || t?.status === 'Completed',
  ).length;
  const inProgressTasks = allTasks.filter(
    (t: any) => t?.status === 'in_progress' || t?.status === 'In Progress',
  ).length;
  const pendingTasks = Math.max(0, allTasks.length - completedTasks - inProgressTasks);
  const taskRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;
  const reportsCount = Number(data?.reports_submitted_count) || 0;

  // Derive academic grade: Attendance (40%) + Task Completion (40%) + Daily Reports (20%)
  const overallScore = Math.round(attendance * 0.4 + taskRate * 0.4 + Math.min(100, reportsCount * 10) * 0.2);
  let grade = 'A';
  let gradeDesc = 'Exceptional Standing';
  let gradeColor = 'text-emerald-600';
  let gradeBg = 'bg-emerald-50 border-emerald-200';

  if (overallScore >= 90) {
    grade = 'A+';
    gradeDesc = 'Outstanding Academic Standing';
    gradeColor = 'text-emerald-600';
    gradeBg = 'bg-emerald-50 border-emerald-200';
  } else if (overallScore >= 80) {
    grade = 'A';
    gradeDesc = 'Excellent Academic Standing';
    gradeColor = 'text-indigo-600';
    gradeBg = 'bg-indigo-50 border-indigo-200';
  } else if (overallScore >= 70) {
    grade = 'B+';
    gradeDesc = 'Very Good Standing';
    gradeColor = 'text-blue-600';
    gradeBg = 'bg-blue-50 border-blue-200';
  } else if (overallScore >= 60) {
    grade = 'B';
    gradeDesc = 'Good Standing — Keep Improving';
    gradeColor = 'text-amber-600';
    gradeBg = 'bg-amber-50 border-amber-200';
  } else {
    grade = 'In Progress';
    gradeDesc = 'Needs Continued Submission Effort';
    gradeColor = 'text-slate-600';
    gradeBg = 'bg-slate-50 border-slate-200';
  }

  const isPlacementReady = overallScore >= 75 && attendance >= 75;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>My Learning Curve & Academic Progress</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 border shadow-xs ${
              isPlacementReady
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            {isPlacementReady ? 'Placement Ready: YES' : 'Placement: Training Phase'}
          </span>
        </div>
      </div>

      {/* 4 Standard Academic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Attendance</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{attendance}%</p>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  attendance >= 75 ? 'bg-sky-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, attendance)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 block">
              Required Threshold: ≥75% {attendance >= 75 ? '✓ Maintained' : '⚠ Below Target'}
            </span>
          </div>
        </div>

        {/* Task Completion */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Tasks Completed</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{taskRate}%</p>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, taskRate)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 block">
              {completedTasks} of {allTasks.length} tasks cleared
            </span>
          </div>
        </div>

        {/* Daily Reports / Logs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Daily Process Logs</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{reportsCount}</p>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, reportsCount * 5)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 block">
              Regularity: {reportsCount >= 10 ? 'Consistent Standing' : 'Building Habit'}
            </span>
          </div>
        </div>

        {/* Academic Performance Grade */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">Overall Grade</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-black ${gradeColor}`}>{grade}</p>
              <span className="text-xs font-bold text-slate-500 font-mono">({overallScore}/100)</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, overallScore)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 block truncate">{gradeDesc}</span>
          </div>
        </div>
      </div>

      {/* Grade Computation & Performance Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>Academic Evaluation Criteria & Score Distribution</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-sky-900">Attendance Weightage</span>
                <span className="text-xs font-black text-sky-700">40% Max</span>
              </div>
              <p className="text-[11px] text-sky-800/80">Regularity in physical and online sessions</p>
            </div>
            <div className="mt-3 pt-2 border-t border-sky-200/60 flex items-baseline justify-between">
              <span className="text-xs text-sky-700">Calculated Points:</span>
              <span className="text-base font-black text-sky-900">
                {Math.round(attendance * 0.4)} / 40 pts
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-indigo-900">Assignment Completion</span>
                <span className="text-xs font-black text-indigo-700">40% Max</span>
              </div>
              <p className="text-[11px] text-indigo-800/80">Clearing practical coding tasks and milestones</p>
            </div>
            <div className="mt-3 pt-2 border-t border-indigo-200/60 flex items-baseline justify-between">
              <span className="text-xs text-indigo-700">Calculated Points:</span>
              <span className="text-base font-black text-indigo-900">
                {Math.round(taskRate * 0.4)} / 40 pts
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-emerald-900">Daily Process Reporting</span>
                <span className="text-xs font-black text-emerald-700">20% Max</span>
              </div>
              <p className="text-[11px] text-emerald-800/80">Routine daily updates and process documentation</p>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-baseline justify-between">
              <span className="text-xs text-emerald-700">Calculated Points:</span>
              <span className="text-base font-black text-emerald-900">
                {Math.min(20, Math.round(reportsCount * 2))} / 20 pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Tasks Breakdown Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>Assigned Practical Tasks & Submissions ({allTasks.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review assignment status, submission timelines, and completion records
            </p>
          </div>

          <Link
            to="/student/tasks"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
          >
            <span>View All Tasks</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {allTasks.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No academic tasks currently assigned. Keep working through your course syllabus!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Task Title</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Due / Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allTasks.slice(0, 8).map((t: any, idx: number) => {
                  const isDone = t?.status === 'completed' || t?.status === 'Completed';
                  const isInProg = t?.status === 'in_progress' || t?.status === 'In Progress';

                  return (
                    <tr key={t?._id || idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{t?.title || 'Course Practical Task'}</div>
                        {t?.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{t.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isInProg
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                            </>
                          ) : isInProg ? (
                            <>
                              <Clock className="w-3 h-3 text-indigo-500" /> In Progress
                            </>
                          ) : (
                            'Pending'
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize text-slate-700 font-medium">
                          {t?.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {t?.due_date ? new Date(t.due_date).toLocaleDateString() : 'Self-Paced'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Helpful Banner to Gamification / Credits */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-500/20 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Looking for your Gamification Tiers & Reward Points?</h3>
          </div>
          <p className="text-xs text-slate-300">
            Check your earned skill badges, 7-category credit breakdown, and verified certificates in the Credits portal.
          </p>
        </div>
        <Link
          to="/student/credits"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs flex-shrink-0"
        >
          <span>Open My Credits & Badges</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default StudentProgressPage;
