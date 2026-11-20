import React, { useState } from 'react';
import { AssessmentConfig, StudentAttempt } from '../types';
import { useAuth } from '../../../context/AuthContext';
import { examService } from '../services/examService';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Sparkles,
  X,
  ChevronDown,
  HelpCircle,
  Code,
  FileText,
  ShieldCheck,
  Unlock,
  Key,
  Lock,
} from 'lucide-react';

interface ExamResultsViewModalProps {
  test: AssessmentConfig;
  attempt: StudentAttempt;
  onClose: () => void;
}

export const ExamResultsViewModal: React.FC<ExamResultsViewModalProps> = ({
  test,
  attempt,
  onClose,
}) => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student' || (user as any)?.user_type === 'student';
  const isAdminOrMentor = !isStudent;

  const [currentTest, setCurrentTest] = useState<AssessmentConfig>(() => {
    return examService.getAssessmentById(test.id) || test;
  });

  const isPractice = currentTest.category === 'practice';
  const isAptitude = currentTest.category === 'aptitude';
  const isHiddenAnswersMode = currentTest.result_visibility === 'scheduled';
  const isAnswerKeyReleased = Boolean(currentTest.is_answer_key_released);

  // Requirement 4:
  // - Never reveal correct answers or explanations before the student passes.
  // - After failure, display obtained marks and pass/fail status, but hide correct answers.
  // - After passing, allow students to view correct answers and explanations.
  // - Admins/Mentors can always inspect answers for auditing.
  const isPassed = Boolean(attempt.is_passed);
  const canViewAnswers = isAdminOrMentor || (isPassed && (!isHiddenAnswersMode || isAnswerKeyReleased));
  const questions = currentTest.questions || test.questions || [];

  const handleToggleRelease = () => {
    const updated = examService.toggleAnswerKeyRelease(
      currentTest.id,
      !currentTest.is_answer_key_released,
      user?.name || 'Admin / Mentor'
    );
    if (updated) {
      setCurrentTest(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                attempt.is_passed
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}
            >
              {attempt.is_passed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Examination Scorecard</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{test.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300">
          {/* Main Score Banner */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span
                  className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                    attempt.is_passed
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-600'
                  }`}
                >
                  {attempt.status === 'disqualified'
                    ? 'Disqualified (Tab Violation)'
                    : attempt.is_passed
                    ? 'Examination Passed'
                    : 'Examination Failed'}
                </span>
                <span className="text-xs text-slate-400">Pass Threshold: {test.passing_percentage}%</span>
              </div>
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {attempt.score_percentage}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Marks Obtained: <strong className="text-slate-900 dark:text-white">{attempt.marks_obtained}</strong> / {attempt.total_marks} Marks
              </p>
            </div>

            {/* Credit Reward Box */}
            <div className={`p-4 rounded-2xl ${isPractice || isAptitude ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700' : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-500/30'} border flex items-center gap-4`}>
              <div className={`w-12 h-12 rounded-xl ${isPractice || isAptitude ? 'bg-slate-600 text-white' : 'bg-indigo-600 text-white'} flex items-center justify-center shadow-lg ${isPractice || isAptitude ? '' : 'shadow-indigo-600/30'}`}>
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {isAptitude ? 'Placement Aptitude' : isPractice ? 'Practice Sandbox' : 'Earned Credits'}
                </span>
                <div className={`text-2xl font-black ${isPractice || isAptitude ? 'text-slate-700 dark:text-slate-300' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {isPractice || isAptitude ? '0 pts' : `+${attempt.earned_credits} pts`}
                </div>
                <span className={`text-[10px] font-bold ${isAptitude ? 'text-amber-600 dark:text-amber-400' : isPractice ? 'text-slate-500 dark:text-slate-400' : attempt.earned_credits > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {isAptitude
                    ? 'Placement Screening Mode (0 Credits • Benchmarking Only)'
                    : isPractice
                    ? 'Practice Mode (Self-Assessment Only • 0 Credits)'
                    : attempt.earned_credits > 0
                    ? '✓ Credited to Portfolio'
                    : 'Below Passing Range'}
                </span>
              </div>
            </div>
          </div>

          {/* Audit & Proctoring Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-400 font-bold block">Test Category</span>
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase mt-0.5 block">
                {test.category}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-400 font-bold block">Tab Violations</span>
              <span className="text-xs font-black text-amber-500 mt-0.5 block">
                {attempt.violations_count || 0} Incident(s)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-400 font-bold block">Total Questions</span>
              <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">
                {questions.length} Questions
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-400 font-bold block">Retakes</span>
              <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">
                {isPractice ? 'Unlimited' : test.is_retake_allowed ? 'Mentor Granted' : 'Locked (1 Attempt)'}
              </span>
            </div>
          </div>

          {/* Answer Review Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Question-by-Question Analysis & Review</span>
              </h4>
              <div className="flex items-center gap-2">
                {isAdminOrMentor && isHiddenAnswersMode && (
                  <button
                    type="button"
                    onClick={handleToggleRelease}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                      currentTest.is_answer_key_released
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                        : 'bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-600 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                    }`}
                    title="Control whether examinees can see solutions"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>
                      {currentTest.is_answer_key_released
                        ? '✓ Key Released (Click to Lock)'
                        : 'Release Key to Students'}
                    </span>
                  </button>
                )}
                <span className="text-xs text-slate-400 font-semibold">
                  {canViewAnswers ? 'Complete Solutions Visible' : 'Protected Official Exam'}
                </span>
              </div>
            </div>

            {!canViewAnswers ? (
              <div className="p-8 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center space-y-3">
                <ShieldAlert className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                  {!isPassed ? 'Answers & Explanations Sealed (Failed Attempt)' : 'Official Exam Answers Sealed'}
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {!isPassed
                    ? `In accordance with Rule 4, correct answers and detailed explanations remain sealed because this attempt did not achieve the required pass mark (${currentTest.passing_percentage}%). You may retake the test to pass and unlock complete solutions.`
                    : 'Question-level answers and detailed solution walkthroughs are protected until your Admin or Mentor releases the answer key.'}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-300 dark:border-amber-700">
                  <Lock className="w-3 h-3" />
                  <span>{!isPassed ? 'Pass Test to Unlock Solutions & Explanations' : 'Awaiting Admin / Mentor Release Permission'}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const studentAns = attempt.answers?.[q.id];
                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          Question {idx + 1} &bull; {q.topic || 'General'}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{q.marks} Marks</span>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {q.question_text?.replace(/\s*\([Vv]ariation\s*\d+\)/gi, '')}
                      </p>

                      {q.code_snippet && (
                        <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                          {q.code_snippet}
                        </pre>
                      )}

                      {/* Display Choices if MCQ / True False */}
                      {q.options && (
                        <div className="space-y-1.5 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isSelected =
                              studentAns === optIdx || (Array.isArray(studentAns) && studentAns.includes(optIdx));
                            const isCorrectOpt =
                              q.correct_answer === optIdx ||
                              (Array.isArray(q.correct_answer) && q.correct_answer.includes(optIdx));

                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                                  isCorrectOpt
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600 text-emerald-900 dark:text-emerald-300 font-bold'
                                    : isSelected
                                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-600 text-rose-900 dark:text-rose-300 font-semibold'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                <span>
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </span>
                                {isCorrectOpt && (
                                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                    ✓ Correct Answer
                                  </span>
                                )}
                                {isSelected && !isCorrectOpt && (
                                  <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400">
                                    ✗ Your Selection
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Text Answers */}
                      {!q.options && (
                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                          <div>
                            <span className="text-slate-400">Your Answer: </span>
                            <strong className="text-slate-900 dark:text-white font-mono">{String(studentAns ?? 'None')}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Correct Answer: </span>
                            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                              {String(q.correct_answer)}
                            </strong>
                          </div>
                        </div>
                      )}

                      {/* Solution / Mentor Explanation */}
                      {q.explanation && (
                        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-950 dark:text-indigo-200">
                          <strong className="block font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">
                            Solution Explanation:
                          </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
          >
            Close & Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
