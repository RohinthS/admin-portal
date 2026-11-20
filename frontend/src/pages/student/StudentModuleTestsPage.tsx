import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  syllabusProgressService,
  CourseModuleDef,
  STANDARD_BATCHES,
} from '../../modules/examination/services/syllabusProgressService';
import { examService } from '../../modules/examination/services/examService';
import { studentAccountService, StudentAccount } from '../../services/studentAccountService';
import { ExamQuestion } from '../../modules/examination/types';
import {
  BookOpen,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Play,
  Award,
  ChevronRight,
  Eye,
  X,
  Check,
  HelpCircle,
  FileText,
  ShieldAlert,
} from 'lucide-react';

export const StudentModuleTestsPage: React.FC = () => {
  const { user } = useAuth();

  // Find student profile (from logged-in session or mock student directory)
  const allStudents = useMemo(() => studentAccountService.getStudents(), []);
  const currentStudent = useMemo(() => {
    if (!user) return allStudents[0];
    const match = allStudents.find(
      (s) =>
        s.id === user.id ||
        s.student_id === user.username ||
        s.student_id === (user as any).student_id ||
        s.email?.toLowerCase() === user.email?.toLowerCase()
    );
    return match || allStudents[0];
  }, [user, allStudents]);

  // Course and Batch for student
  const courseName = currentStudent?.course_name || 'Basic Python Course';
  const batchName = currentStudent?.batch || 'Morning Batch';

  const [modules, setModules] = useState<CourseModuleDef[]>([]);
  const [progressionList, setProgressionList] = useState<any[]>([]);

  // Active Test State
  const [activeTestModule, setActiveTestModule] = useState<CourseModuleDef | null>(null);
  const [testQuestions, setTestQuestions] = useState<ExamQuestion[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(25 * 60);
  const [testSubmittedResult, setTestSubmittedResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    isPassed: boolean;
    passPercentage: number;
  } | null>(null);

  // Review Solutions Modal
  const [solutionReviewModule, setSolutionReviewModule] = useState<{
    moduleDef: CourseModuleDef;
    questions: ExamQuestion[];
    userAnswers: Record<string, number>;
  } | null>(null);

  // Check if all modules in course are completed & passed (Flowchart terminal state)
  const isAllModulesPassed = useMemo(() => {
    return (
      progressionList.length > 0 &&
      progressionList.every((item) => item.studentStatus === 'passed')
    );
  }, [progressionList]);

  const loadProgression = () => {
    if (!currentStudent) return;
    const mods = syllabusProgressService.getModulesForCourse(courseName);
    setModules(mods);

    const prog = syllabusProgressService.getStudentModuleProgression(
      currentStudent,
      courseName,
      batchName
    );
    setProgressionList(prog);
  };

  useEffect(() => {
    loadProgression();

    const handleUpdate = () => {
      loadProgression();
    };
    window.addEventListener('wegrow_assessments_updated', handleUpdate);
    window.addEventListener('wegrow_attempt_submitted', handleUpdate);
    return () => {
      window.removeEventListener('wegrow_assessments_updated', handleUpdate);
      window.removeEventListener('wegrow_attempt_submitted', handleUpdate);
    };
  }, [currentStudent, courseName, batchName]);

  // Countdown timer for active exam
  useEffect(() => {
    if (!activeTestModule || testSubmittedResult) return;
    if (timeLeftSeconds <= 0) {
      handleSubmitTest();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTestModule, timeLeftSeconds, testSubmittedResult]);

  // Launch test runner for a module with randomized questions and options
  const handleStartTest = (mod: CourseModuleDef) => {
    // Generate questions matching this module
    const baseQuestions = syllabusProgressService.generateQuestionsForModule({ moduleDef: mod, questionCount: 15 });

    // 1. Randomize options for each question while securely preserving correct answer
    const randomizedQuestions = baseQuestions.map((q) => {
      if (!q.options || q.options.length <= 1) return q;

      const originalCorrectIndex = q.correct_answer;
      const indexedOptions = q.options.map((opt, i) => ({ opt, originalIndex: i }));

      for (let i = indexedOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexedOptions[i], indexedOptions[j]] = [indexedOptions[j], indexedOptions[i]];
      }

      const newOptions = indexedOptions.map((item) => item.opt);
      const newCorrectIndex = indexedOptions.findIndex((item) => item.originalIndex === originalCorrectIndex);

      return {
        ...q,
        options: newOptions,
        correct_answer: newCorrectIndex !== -1 ? newCorrectIndex : originalCorrectIndex,
      };
    });

    // 2. Randomize question order for each attempt
    for (let i = randomizedQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [randomizedQuestions[i], randomizedQuestions[j]] = [randomizedQuestions[j], randomizedQuestions[i]];
    }

    setTestQuestions(randomizedQuestions);
    setSelectedAnswers({});
    setCurrentQIdx(0);
    setTimeLeftSeconds((mod.suggestedDuration || 25) * 60);
    setTestSubmittedResult(null);
    setActiveTestModule(mod);
  };

  // Submit test and calculate score
  const handleSubmitTest = () => {
    if (!activeTestModule) return;

    let correctCount = 0;
    testQuestions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (selected !== undefined && selected === q.correct_answer) {
        correctCount += 1;
      }
    });

    const total = testQuestions.length || 15;
    const percentage = Math.round((correctCount / total) * 100);
    const passPercentage = 60; // Standard pass mark
    const isPassed = percentage >= passPercentage;

    const result = {
      score: correctCount,
      total,
      percentage,
      isPassed,
      passPercentage,
    };
    setTestSubmittedResult(result);

    // Save attempt record
    examService.saveAttempt({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      test_id: `mod-test-${activeTestModule.id}`,
      test_title: `${activeTestModule.moduleName} Assessment`,
      student_id: currentStudent.student_id || currentStudent.id,
      student_name: currentStudent.student_name,
      student_email: currentStudent.email,
      course_name: courseName,
      batch: batchName,
      category: 'internal',
      start_time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      submitted_at: new Date().toISOString(),
      answers: selectedAnswers,
      question_statuses: Object.fromEntries(
        testQuestions.map((q) => [q.id, selectedAnswers[q.id] !== undefined ? 'answered' : 'unanswered'])
      ) as Record<string, 'answered' | 'marked' | 'visited'>,
      marks_obtained: correctCount,
      total_marks: total,
      score_percentage: percentage,
      is_passed: isPassed,
      earned_credits: isPassed ? 15 : 0,
      violations_count: 0,
      violations_log: [],
      status: 'submitted',
    });

    // Notify listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wegrow_attempt_submitted'));
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-800/80 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Student Offline Module Examinations</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>My Module Tests</span>
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl mt-1">
              Course: <strong className="text-white">{courseName}</strong> &bull; Batch: <strong className="text-white">{batchName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15 backdrop-blur-sm">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Student Roll</span>
              <span className="text-xs font-mono font-black text-white">{currentStudent?.student_name} ({currentStudent?.student_id})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Completed Celebration (Matches Flowchart Terminal State) */}
      {isAllModulesPassed && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 border border-emerald-400/40 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <Award className="w-9 h-9 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-300/40 text-emerald-200">
                Flowchart Terminal Milestone: Course Completed
              </span>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                🎉 Course Completed!
              </h2>
              <p className="text-xs text-emerald-100 mt-1 max-w-xl leading-relaxed">
                Congratulations! You have attended all offline classroom sessions and successfully passed all {modules.length} module examinations for <strong>{courseName}</strong> ({batchName}).
              </p>
            </div>
          </div>
          <div className="shrink-0 text-center sm:text-right bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-sm border border-white/20">
            <span className="text-[10px] uppercase font-bold text-emerald-200 block">Status</span>
            <span className="text-base font-black text-white">All Modules Passed (100%)</span>
          </div>
        </div>
      )}

      {/* Sequential Modules List */}
      <div className="space-y-4">
        {progressionList.map((item, idx) => {
          const {
            moduleDef,
            isMentorCompleted,
            studentStatus,
            isEligibleToStart,
            lockReason,
            latestAttempt,
            canViewSolutions,
          } = item;

          return (
            <div
              key={moduleDef.id || idx}
              className={`p-5 rounded-3xl border transition-all duration-200 ${
                studentStatus === 'passed'
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : studentStatus === 'failed'
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                  : studentStatus === 'available'
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <span
                    className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                      studentStatus === 'passed'
                        ? 'bg-emerald-600 text-white'
                        : studentStatus === 'failed'
                        ? 'bg-rose-600 text-white'
                        : studentStatus === 'available'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {moduleDef.moduleNumber || idx + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {moduleDef.moduleName}
                      </h3>

                      {/* Status Badge */}
                      {studentStatus === 'passed' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Passed ({latestAttempt?.percentage || 100}%)</span>
                        </span>
                      )}

                      {studentStatus === 'failed' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Failed ({latestAttempt?.percentage || 0}%) &bull; Retake Available</span>
                        </span>
                      )}

                      {studentStatus === 'available' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>Test Available &bull; Ready to Start</span>
                        </span>
                      )}

                      {studentStatus === 'locked' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                      {moduleDef.description}
                    </p>

                    {/* Test Specs Bar */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                      <span>⏱️ Duration: {moduleDef.suggestedDuration || 25} Mins</span>
                      <span>&bull;</span>
                      <span>📝 Questions: 15 MCQs</span>
                      <span>&bull;</span>
                      <span>🎯 Pass Mark: 60%</span>
                    </div>

                    {/* Lock Reason or Helper */}
                    {studentStatus === 'locked' && lockReason && (
                      <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{lockReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  {studentStatus === 'available' && (
                    <button
                      type="button"
                      onClick={() => handleStartTest(moduleDef)}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition active:scale-98"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Test</span>
                    </button>
                  )}

                  {studentStatus === 'failed' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartTest(moduleDef)}
                        className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition active:scale-98"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake Test</span>
                      </button>
                    </div>
                  )}

                  {studentStatus === 'passed' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const qs = syllabusProgressService.generateQuestionsForModule({ moduleDef, questionCount: 15 });
                          setSolutionReviewModule({
                            moduleDef,
                            questions: qs,
                            userAnswers: (latestAttempt?.answers as Record<string, number>) || {},
                          });
                        }}
                        className="px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 font-bold text-xs border border-emerald-300 flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review Answers & Explanations</span>
                      </button>
                    </div>
                  )}

                  {studentStatus === 'locked' && (
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Test Taking Modal */}
      {activeTestModule && !testSubmittedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col max-h-[92vh]">
            {/* Top Bar: Title + Timer */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                  {courseName} &bull; Module Evaluation
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {activeTestModule.moduleName}
                </h3>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-mono font-bold text-xs">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>
                  {Math.floor(timeLeftSeconds / 60)}:
                  {String(timeLeftSeconds % 60).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Question Card */}
            {testQuestions.length > 0 && (
              <div className="flex-1 overflow-y-auto py-5 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>
                    Question {currentQIdx + 1} of {testQuestions.length}
                  </span>
                  <span>1 Mark</span>
                </div>

                <div className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                  {testQuestions[currentQIdx]?.question_text}
                </div>

                {/* Options */}
                <div className="space-y-2.5 pt-2">
                  {testQuestions[currentQIdx]?.options.map((opt, oIdx) => {
                    const isSelected = selectedAnswers[testQuestions[currentQIdx].id] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() =>
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [testQuestions[currentQIdx].id]: oIdx,
                          }))
                        }
                        className={`w-full text-left p-3.5 rounded-2xl border text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                disabled={currentQIdx === 0}
                onClick={() => setCurrentQIdx((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentQIdx < testQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQIdx((prev) => prev + 1)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitTest}
                    className="px-5 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer"
                  >
                    Submit Test
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Immediate Evaluation Result Modal */}
      {testSubmittedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-center space-y-4">
            <div
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                testSubmittedResult.isPassed
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-600'
              }`}
            >
              {testSubmittedResult.isPassed ? (
                <Award className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {testSubmittedResult.isPassed ? 'Congratulations! You Passed! 🎉' : 'Test Not Cleared'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {testSubmittedResult.isPassed
                  ? 'Great job! You have satisfied the passing mark and unlocked eligibility for subsequent modules.'
                  : `You obtained ${testSubmittedResult.score} / ${testSubmittedResult.total} (${testSubmittedResult.percentage}%). Required pass mark is ${testSubmittedResult.passPercentage}%.`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-around">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Score</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {testSubmittedResult.score} / {testSubmittedResult.total}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Percentage</span>
                <span
                  className={`text-xl font-black ${
                    testSubmittedResult.isPassed ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {testSubmittedResult.percentage}%
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
                <span
                  className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${
                    testSubmittedResult.isPassed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {testSubmittedResult.isPassed ? 'Passed' : 'Failed'}
                </span>
              </div>
            </div>

            {!testSubmittedResult.isPassed && (
              <p className="text-[11px] text-slate-400 italic">
                🔒 Correct answers and explanations are protected until you pass. You can retake this test immediately as many times as needed!
              </p>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTestSubmittedResult(null);
                  setActiveTestModule(null);
                  loadProgression();
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
              >
                Back to Modules
              </button>

              {!testSubmittedResult.isPassed && activeTestModule && (
                <button
                  type="button"
                  onClick={() => handleStartTest(activeTestModule)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Test Now</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Solutions Modal (Only Available After Passing) */}
      {solutionReviewModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col max-h-[92vh] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600">
                  Verified Exam Solutions
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {solutionReviewModule.moduleDef.moduleName} &bull; Solutions & Explanations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSolutionReviewModule(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {solutionReviewModule.questions.map((q, idx) => {
                const userChoice = solutionReviewModule.userAnswers[q.id];
                const isCorrect = userChoice === q.correct_answer;

                return (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {idx + 1}. {q.question_text}
                      </span>
                      {isCorrect ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 shrink-0">
                          Correct
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 shrink-0">
                          Incorrect
                        </span>
                      )}
                    </div>

                    {/* Options list */}
                    <div className="space-y-1.5 pl-2">
                      {(q.options || []).map((opt, oIdx) => {
                        const isCorrectOption = oIdx === q.correct_answer;
                        const isStudentChoice = oIdx === userChoice;

                        let style = 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                        if (isCorrectOption) {
                          style = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                        } else if (isStudentChoice) {
                          style = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200';
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${style}`}
                          >
                            <span>
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </span>
                            {isCorrectOption && (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 text-xs text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900/50">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSolutionReviewModule(null)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close Solutions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
