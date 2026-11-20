import React, { useState, useEffect } from 'react';
import { AssessmentConfig, StudentAttempt } from '../../modules/examination/types';
import { examService } from '../../modules/examination/services/examService';
import { studentAccountService } from '../../services/studentAccountService';
import { PreExamInstructionsModal } from '../../modules/examination/components/PreExamInstructionsModal';
import { StudentExamInterface } from '../../modules/examination/components/StudentExamInterface';
import { ExamResultsViewModal } from '../../modules/examination/components/ExamResultsViewModal';
import { useAuth } from '../../context/AuthContext';
import {
  HelpCircle,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  Sparkles,
  Calendar,
  Lock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Eye,
} from 'lucide-react';

export const StudentTestsPage: React.FC = () => {
  const { user } = useAuth();
  const loggedInStudent = studentAccountService.getCurrentStudent();

  const currentStudent = {
    id: loggedInStudent?.id || loggedInStudent?.student_id || user?.id || (user as any)?._id || 'student-demo-1',
    name: loggedInStudent?.student_name || user?.name || user?.username || 'Student Candidate',
    email: loggedInStudent?.email || user?.email || 'student@wegrow.edu',
    batch: (loggedInStudent as any)?.batch || 'Batch 2026-Alpha',
    joining_date: loggedInStudent?.joining_date || '2026-01-15',
  };

  const [activeTab, setActiveTab] = useState<'available' | 'upcoming' | 'completed'>('available');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'aptitude' | 'internal' | 'overall' | 'practice'>('all');
  const [assessments, setAssessments] = useState<AssessmentConfig[]>(() => examService.getAssessments());
  const [studentAttempts, setStudentAttempts] = useState<StudentAttempt[]>(() =>
    examService.getStudentAttempts(currentStudent.id),
  );

  // Modals
  const [selectedTestForInstructions, setSelectedTestForInstructions] = useState<AssessmentConfig | null>(null);
  const [activeExamTest, setActiveExamTest] = useState<AssessmentConfig | null>(null);
  const [viewResultAttempt, setViewResultAttempt] = useState<{ test: AssessmentConfig; attempt: StudentAttempt } | null>(
    null,
  );

  const refreshData = () => {
    setAssessments(examService.getAssessments());
    setStudentAttempts(examService.getStudentAttempts(currentStudent.id));
  };

  useEffect(() => {
    const handleUpdate = () => refreshData();
    window.addEventListener('wegrow_assessments_updated', handleUpdate);
    window.addEventListener('wegrow_attempt_submitted', handleUpdate);
    window.addEventListener('wegrow_retake_granted', handleUpdate);
    return () => {
      window.removeEventListener('wegrow_assessments_updated', handleUpdate);
      window.removeEventListener('wegrow_attempt_submitted', handleUpdate);
      window.removeEventListener('wegrow_retake_granted', handleUpdate);
    };
  }, [currentStudent.id]);

  // Partition Assessments into Available, Upcoming, Completed
  const now = new Date();

  // Completed Test IDs and Completed Month Numbers
  const completedAttempts = studentAttempts.filter(
    (a) => a.status === 'submitted' || a.status === 'disqualified'
  );
  const completedTestIds = new Set(completedAttempts.map((a) => a.test_id));

  // Determine which months the student has already completed
  const completedMonths = new Set<number>();
  assessments.forEach((test) => {
    if (completedTestIds.has(test.id) && test.month_number) {
      completedMonths.add(Number(test.month_number));
    }
  });

  // Calculate Sequential & Batch Eligibility for any assessment
  const checkExamEligibility = (test: AssessmentConfig): { isEligible: boolean; isLocked: boolean; reason?: string } => {
    // 1. Admin/Mentor Manual Override check
    const isManuallyUnlocked = (test.unlocked_student_ids || []).includes(currentStudent.id) ||
      (test.unlocked_student_ids || []).includes((currentStudent as any).student_id);
    if (isManuallyUnlocked) {
      return { isEligible: true, isLocked: false };
    }

    // 2. Practice and Aptitude sandbox exams are always unlocked
    if (test.category === 'practice' || test.category === 'aptitude') {
      return { isEligible: true, isLocked: false };
    }

    // 3. Batch matching (if specified)
    if (test.batch && !test.batch.toLowerCase().includes('all batches')) {
      const studentBatchNorm = (currentStudent.batch || '').toLowerCase();
      const testBatchNorm = test.batch.toLowerCase();
      if (!testBatchNorm.includes(studentBatchNorm) && !studentBatchNorm.includes(testBatchNorm)) {
        return {
          isEligible: false,
          isLocked: true,
          reason: `Designated for ${test.batch}. Contact Admin to unlock.`
        };
      }
    }

    // 4. Sequential Month-Wise Prerequisites
    const currentMonthNum = Number(test.month_number || 1);

    if (test.category === 'overall') {
      // Overall Exam requires completing prior monthly assessments (Month 1, 2, 3...)
      const requiredMonths = [1, 2, 3];
      const missingMonths = requiredMonths.filter((m) => !completedMonths.has(m));
      if (missingMonths.length > 0) {
        return {
          isEligible: false,
          isLocked: true,
          reason: `Locked: Complete Month ${missingMonths.join(', ')} Assessment(s) first.`
        };
      }
    } else if (currentMonthNum > 1) {
      // For Month 2, student MUST have completed Month 1
      const previousMonth = currentMonthNum - 1;
      if (!completedMonths.has(previousMonth)) {
        return {
          isEligible: false,
          isLocked: true,
          reason: `Locked: Complete Month ${previousMonth} Assessment to unlock Month ${currentMonthNum}.`
        };
      }
    }

    return { isEligible: true, isLocked: false };
  };

  const availableTests = assessments.filter((t) => {
    // Scheduled for future?
    if (t.start_date && new Date(t.start_date) > now) return false;
    // Expired?
    if (t.end_date && new Date(t.end_date) < now) return false;
    // Already submitted official test without retake?
    if (completedTestIds.has(t.id) && t.category !== 'practice' && !t.is_retake_allowed) return false;
    return true;
  });

  const upcomingTests = assessments.filter((t) => {
    return t.start_date && new Date(t.start_date) > now;
  });

  const completedAttemptsList = completedAttempts;

  const handleStartExamClick = (test: AssessmentConfig) => {
    setSelectedTestForInstructions(test);
  };

  const handleLaunchExam = () => {
    if (!selectedTestForInstructions) return;
    const testToTake = selectedTestForInstructions;
    setSelectedTestForInstructions(null);
    setActiveExamTest(testToTake);
  };

  const handleExamSubmitted = (attempt: StudentAttempt) => {
    const test = examService.getAssessmentById(attempt.test_id);
    setActiveExamTest(null);
    refreshData();
    if (test) {
      setViewResultAttempt({ test, attempt });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Student Examination Portal</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Take official academic assessments and practice tests to earn accredited curriculum credits
          </p>
        </div>

        {/* Total Earned Exam Credits Badge */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Official Exam Credits Earned</span>
            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
              +{completedAttemptsList.reduce((acc, a) => {
                const t = examService.getAssessmentById(a.test_id);
                if (t?.category === 'practice' || t?.category === 'aptitude') return acc;
                return acc + (a.earned_credits || 0);
              }, 0)} pts
            </span>
          </div>
        </div>
      </div>

      {/* 3 Main Tabs: Available, Upcoming, Completed */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'available'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Available Examinations ({availableTests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Upcoming Schedule ({upcomingTests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Completed Examinations ({completedAttemptsList.length})</span>
        </button>
      </div>

      {/* Tab 1: Available Examinations */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-xs font-bold text-slate-400 mr-1">Filter:</span>
            {[
              { id: 'all', label: `All (${availableTests.length})` },
              { id: 'aptitude', label: `🎯 Placement Aptitude (${availableTests.filter((t) => t.category === 'aptitude').length})` },
              { id: 'internal', label: `Internal Monthly (${availableTests.filter((t) => t.category === 'internal').length})` },
              { id: 'overall', label: `Overall Semester (${availableTests.filter((t) => t.category === 'overall').length})` },
              { id: 'practice', label: `Practice Sandbox (${availableTests.filter((t) => t.category === 'practice').length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 ${
                  categoryFilter === f.id
                    ? f.id === 'aptitude'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {availableTests.filter((t) => categoryFilter === 'all' || t.category === categoryFilter).length === 0 ? (
            <div className="py-16 text-center text-slate-400 glass-card dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Tests Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active examinations match the selected category. Switch back to "All" or check upcoming tests.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {availableTests
                .filter((t) => categoryFilter === 'all' || t.category === categoryFilter)
                .map((t) => {
                  const eligibility = checkExamEligibility(t);
                  const isLocked = eligibility.isLocked;

                  return (
                    <div
                      key={t.id}
                      className={`p-5 sm:p-6 glass-card dark:bg-slate-900 rounded-2xl border flex flex-col justify-between transition-all ${
                        isLocked
                          ? 'border-slate-200 dark:border-slate-800 opacity-80 bg-slate-50/60 dark:bg-slate-900/60'
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 hover:shadow-lg'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                              t.category === 'aptitude'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-2xs'
                                : t.category === 'overall'
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                : t.category === 'practice'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            }`}
                          >
                            {t.category === 'aptitude' ? (
                              <>
                                <span>🎯</span>
                                <span>Aptitude Assessment</span>
                              </>
                            ) : t.category === 'practice' ? (
                              <>
                                <span>🧪</span>
                                <span>Practice Sandbox</span>
                              </>
                            ) : t.category === 'overall' || t.month_number === 4 ? (
                              <>
                                <span>🎯</span>
                                <span>Month 4 Overall Semester</span>
                              </>
                            ) : (
                              <>
                                <span>📅</span>
                                <span>Month {t.month_number || 1} Internal Test</span>
                              </>
                            )}
                          </span>

                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            {t.duration_minutes} Mins
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                            {t.title}
                          </h3>
                          {isLocked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                              <Lock className="w-2.5 h-2.5" /> Locked
                            </span>
                          )}
                          {!isLocked && (t.unlocked_student_ids || []).includes(currentStudent.id) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                              <ShieldCheck className="w-2.5 h-2.5" /> Admin Unlocked
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                          {t.description}
                        </p>

                        {isLocked && eligibility.reason && (
                          <div className="mb-3 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                            <span>{eligibility.reason}</span>
                          </div>
                        )}

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Total Questions:</span>
                            <strong className="text-slate-900 dark:text-white">
                              {t.total_questions || t.questions?.length || 0} Items
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Pass Mark:</span>
                            <strong className="text-slate-900 dark:text-white">{t.passing_percentage}%</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Max Credits:</span>
                            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                              {t.category === 'aptitude'
                                ? '0 pts (Placement Prep)'
                                : t.category === 'practice'
                                ? '0 pts (Practice Mode)'
                                : `+${t.credit_tiers?.[0]?.credits || 25} pts`}
                            </strong>
                          </div>
                          {t.is_secret_key_required && (
                            <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                              <span>Security:</span>
                              <span className="flex items-center gap-1 font-bold">
                                <Lock className="w-3 h-3" /> PIN Required
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                        {isLocked ? (
                          <button
                            disabled
                            className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2 border border-slate-300/60 dark:border-slate-700"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Prerequisites Locked</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartExamClick(t)}
                            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start Assessment</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Upcoming Schedule */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingTests.length === 0 ? (
            <div className="py-16 text-center text-slate-400 glass-card dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
              <Calendar className="w-10 h-10 text-indigo-400 mx-auto" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Upcoming Examinations</h4>
              <p className="text-xs text-slate-500">There are no future tests scheduled at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingTests.map((t) => (
                <div key={t.id} className="p-5 sm:p-6 glass-card dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between opacity-95">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        Scheduled
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.duration_minutes} Mins</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{t.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{t.description}</p>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Opens At:</span>
                        <strong className="text-slate-900 dark:text-white">
                          {t.start_date ? new Date(t.start_date).toLocaleString() : 'TBA'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Closes At:</span>
                        <strong className="text-slate-900 dark:text-white">
                          {t.end_date ? new Date(t.end_date).toLocaleString() : 'TBA'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Opens on Schedule</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Completed Examinations */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedAttemptsList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 glass-card dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Tests Submitted Yet</h4>
              <p className="text-xs text-slate-500">Completed examinations will appear here with your scores, earned credits, and review keys.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {completedAttemptsList.map((att) => {
                const test = examService.getAssessmentById(att.test_id);
                return (
                  <div
                    key={att.id}
                    className="p-5 sm:p-6 glass-card dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-indigo-400/40 dark:hover:border-indigo-500/40 transition shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                            att.status === 'disqualified'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : att.is_passed
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {att.status === 'disqualified' ? 'Disqualified' : att.is_passed ? 'Passed' : 'Failed'}
                        </span>

                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {(() => {
                            const test = examService.getAssessmentById(att.test_id);
                            if (test?.category === 'aptitude') return '0 Credits (Placement Prep)';
                            if (test?.category === 'practice') return '0 Credits (Practice)';
                            const mNum = test?.month_number || (test?.category === 'overall' ? 4 : 1);
                            return `+${att.earned_credits} Credits (Month ${mNum})`;
                          })()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                        {att.test_title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        Submitted: {att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : 'Recent'}
                      </p>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-400 block font-bold">Your Score</span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {att.score_percentage}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 dark:text-slate-400 block font-bold">Marks</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {att.marks_obtained} / {att.total_marks}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span>Answer Key:</span>
                        <span
                          className={`flex items-center gap-1 font-bold ${
                            test?.result_visibility !== 'scheduled' || test?.is_answer_key_released
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {test?.result_visibility !== 'scheduled' || test?.is_answer_key_released ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                              <span>Solutions Available</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                              <span>Sealed by Mentor</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          if (test) setViewResultAttempt({ test, attempt: att });
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                          test?.result_visibility !== 'scheduled' || test?.is_answer_key_released
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-300/80 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>
                          {test?.result_visibility !== 'scheduled' || test?.is_answer_key_released
                            ? 'View Scorecard & Solutions'
                            : 'View Scorecard (Answers Sealed)'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pre-Exam Instructions Modal */}
      {selectedTestForInstructions && (
        <PreExamInstructionsModal
          test={selectedTestForInstructions}
          onClose={() => setSelectedTestForInstructions(null)}
          onStartExam={handleLaunchExam}
        />
      )}

      {/* Fullscreen Examination Interface */}
      {activeExamTest && (
        <StudentExamInterface
          test={activeExamTest}
          student={currentStudent}
          onExamSubmitted={handleExamSubmitted}
          onExit={() => setActiveExamTest(null)}
        />
      )}

      {/* Scorecard & Answer Review Modal */}
      {viewResultAttempt && (
        <ExamResultsViewModal
          test={viewResultAttempt.test}
          attempt={viewResultAttempt.attempt}
          onClose={() => setViewResultAttempt(null)}
        />
      )}
    </div>
  );
};
