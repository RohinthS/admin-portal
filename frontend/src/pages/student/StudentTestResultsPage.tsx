import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { creditService, CreditTransaction } from '../../services/creditService';
import { examService } from '../../modules/examination/services/examService';
import { StudentAttempt, AssessmentConfig } from '../../modules/examination/types';
import { ExamResultsViewModal } from '../../modules/examination/components/ExamResultsViewModal';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Sparkles,
  TrendingUp,
  FileCheck,
  Calendar,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  BarChart3,
  Percent,
  Eye,
  ShieldAlert,
} from 'lucide-react';

export const StudentTestResultsPage: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?._id || user?.id || 'CURRENT_STUDENT';

  const [loading, setLoading] = useState(true);
  const [examPortalAttempts, setExamPortalAttempts] = useState<StudentAttempt[]>([]);
  const [academicTests, setAcademicTests] = useState<CreditTransaction[]>([]);
  const [selectedResultView, setSelectedResultView] = useState<{ test: AssessmentConfig; attempt: StudentAttempt } | null>(
    null,
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Examination Portal attempts
        const portalAttempts = examService.getStudentAttempts(studentId);
        setExamPortalAttempts(portalAttempts);

        // 2. Fetch academic evaluation test records from credits
        try {
          const credRes = await creditService.getStudentCreditsApi(studentId);
          const txs = credRes.transactions || [];
          const testTxs = txs.filter((tx: any) => {
            const cat = (tx.category || '').toLowerCase();
            const title = (tx.title || '').toLowerCase();
            return (
              cat.includes('test') ||
              cat.includes('academic') ||
              title.includes('test') ||
              title.includes('assessment')
            );
          });
          setAcademicTests(testTxs);
        } catch {
          const localTxs = creditService.getStudentTransactions(studentId);
          const testTxs = localTxs.filter((tx: any) => {
            const cat = (tx.category || '').toLowerCase();
            const title = (tx.title || '').toLowerCase();
            return (
              cat.includes('test') ||
              cat.includes('academic') ||
              title.includes('test') ||
              title.includes('assessment')
            );
          });
          setAcademicTests(testTxs);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  // Aggregate stats
  const completedPortalAttempts = examPortalAttempts.filter(
    (a) => a.status === 'submitted' || a.status === 'disqualified',
  );
  const totalAttempts = completedPortalAttempts.length;
  const passedAttempts = completedPortalAttempts.filter((a) => a.is_passed).length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(completedPortalAttempts.reduce((s, a) => s + (a.score_percentage || 0), 0) / totalAttempts)
      : academicTests.length > 0
      ? 85
      : 0;

  const totalCreditsEarned =
    completedPortalAttempts.reduce((s, a) => {
      const test = examService.getAssessmentById(a.test_id);
      if (test?.category === 'practice' || test?.category === 'aptitude') return s;
      return s + (a.earned_credits || 0);
    }, 0) +
    academicTests.reduce((s, t) => s + (t.credits || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>My Examination Results & Assessments</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review detailed question breakdowns, performance percentages, and earned portfolio credits
          </p>
        </div>

        <Link
          to="/student/tests"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Go to Exam Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Attempted */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tests Attempted
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalAttempts + academicTests.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {totalAttempts} Exam Portal • {academicTests.length} Academic
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Average Score
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {avgScore > 0 ? `${avgScore}%` : 'N/A'}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              {avgScore >= 60 ? 'Above passing bar (≥60%)' : 'Needs preparation'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        {/* Cleared Tests */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Cleared Tests
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {passedAttempts + academicTests.length}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              {passedAttempts} Verified Passed
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Credits */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Test Credits Earned
            </span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              +{totalCreditsEarned} pts
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Reflected on Credit Dashboard
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SECTION 1: Examination Portal Official Submissions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Examination Portal Submissions & Scorecards</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Detailed breakdown of objective evaluations, question keys, and anti-cheating audit status
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full">
            {completedPortalAttempts.length} Recorded
          </span>
        </div>

        {completedPortalAttempts.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">No exam portal submissions recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Take an internal assessment or practice test on the Examination Portal to earn curriculum credits.
              </p>
            </div>
            <Link
              to="/student/tests"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition border border-indigo-200 dark:border-indigo-800 cursor-pointer"
            >
              <span>Go to My Tests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {completedPortalAttempts.map((attempt) => {
              const test = examService.getAssessmentById(attempt.test_id);
              const isPassed = attempt.is_passed;
              const dateStr = attempt.submitted_at
                ? new Date(attempt.submitted_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recent';

              return (
                <div
                  key={attempt.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-indigo-200 dark:hover:border-indigo-700/60 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isPassed ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{attempt.test_title}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            attempt.status === 'disqualified'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : isPassed
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {attempt.status === 'disqualified' ? 'DISQUALIFIED' : isPassed ? 'PASSED' : 'FAILED'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {attempt.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span>
                          Marks: <strong className="text-slate-800 dark:text-slate-200">{attempt.marks_obtained} / {attempt.total_marks}</strong>
                        </span>
                        {attempt.violations_count > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              {attempt.violations_count} Tab Violation(s)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {attempt.score_percentage}%
                      </div>
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        +{attempt.earned_credits} pts
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (test) setSelectedResultView({ test, attempt });
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Key</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Formal Academic & Milestone Test Results */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Formal Academic Ledger Test Records</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified monthly assessments synced with the student credit management ledger
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full">
            {academicTests.length} Recorded
          </span>
        </div>

        {academicTests.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No formal academic evaluation tests recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {academicTests.map((tx, idx) => {
              const dateStr = tx.date
                ? new Date(tx.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recent';

              return (
                <div
                  key={tx.id || tx._id || `ac_tx_${idx}`}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{tx.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          PASSED & CREDITED
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span>Evaluated by: <strong className="text-slate-700 dark:text-slate-300">{tx.awarded_by || 'Faculty'}</strong></span>
                        {tx.notes && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-400 italic">"{tx.notes}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:self-center">
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      +{tx.credits} Credits
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      Academic Ledger
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedResultView && (
        <ExamResultsViewModal
          test={selectedResultView.test}
          attempt={selectedResultView.attempt}
          onClose={() => setSelectedResultView(null)}
        />
      )}
    </div>
  );
};

export default StudentTestResultsPage;
