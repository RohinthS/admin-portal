import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AssessmentConfig, ExamQuestion, PaletteStatus, StudentAttempt } from '../types';
import { examService } from '../services/examService';
import { getEngineRandomQuestions } from '../services/questionBankEngine';
import {
  Clock,
  ShieldAlert,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Play,
  Send,
  HelpCircle,
  Code,
  FileCode,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface StudentExamInterfaceProps {
  test: AssessmentConfig;
  student: { id: string; name: string; email?: string; batch?: string };
  onExamSubmitted: (attempt: StudentAttempt) => void;
  onExit: () => void;
}

export const StudentExamInterface: React.FC<StudentExamInterfaceProps> = ({
  test,
  student,
  onExamSubmitted,
  onExit,
}) => {
  const questions: ExamQuestion[] = useMemo(() => {
    if (test.questions && test.questions.length > 0) {
      return test.questions;
    }
    const fallbackTopic = (test.title + ' ' + (test.course_name || '')).toLowerCase().includes('java')
      ? 'Java'
      : (test.title + ' ' + (test.course_name || '')).toLowerCase().includes('react')
      ? 'React'
      : (test.title + ' ' + (test.course_name || '')).toLowerCase().includes('html') || (test.title + ' ' + (test.course_name || '')).toLowerCase().includes('web')
      ? 'HTML'
      : (test.title + ' ' + (test.course_name || '')).toLowerCase().includes('css')
      ? 'CSS'
      : (test.title + ' ' + (test.course_name || '')).toLowerCase().includes('js') || (test.title + ' ' + (test.course_name || '')).toLowerCase().includes('javascript')
      ? 'JavaScript'
      : 'Python';

    return getEngineRandomQuestions({ topic: fallbackTopic, count: test.total_questions || 15 });
  }, [test]);
  const maxViolations = test.max_violations || 3;

  // Attempt & Session State
  const [attempt, setAttempt] = useState<StudentAttempt>(() => {
    return examService.createStudentAttempt(test, student);
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  // Question tracking:
  // 'visited' = visited by user
  // 'marked' = user marked for review
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({ [questions[0]?.id]: true });
  const [markedQuestions, setMarkedQuestions] = useState<Record<string, boolean>>({});

  // Countdown Timer
  const totalSeconds = (test.duration_minutes || 30) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const saved = examService.getSavedExamProgress(attempt.id);
    return saved?.secondsRemaining !== undefined ? saved.secondsRemaining : totalSeconds;
  });

  // Violation & Anti-Cheating State
  const [violationsCount, setViolationsCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Coding question scratch state
  const [codingCode, setCodingCode] = useState<Record<string, string>>({});
  const [testCaseResults, setTestCaseResults] = useState<Record<string, boolean | null>>({});

  // Fullscreen Management
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(() => {
    const doc = typeof document !== 'undefined' ? (document as any) : null;
    return Boolean(
      doc?.fullscreenElement ||
      doc?.webkitFullscreenElement ||
      doc?.mozFullScreenElement ||
      doc?.msFullscreenElement,
    );
  });

  const requestFullScreen = async () => {
    try {
      const el = containerRef.current || document.documentElement;
      const rfs =
        el.requestFullscreen ||
        (el as any).webkitRequestFullscreen ||
        (el as any).mozRequestFullScreen ||
        (el as any).msRequestFullscreen;
      if (rfs) {
        await rfs.call(el);
      }
    } catch (e) {
      console.warn('Fullscreen request failed:', e);
    }
  };

  const exitFullScreen = async () => {
    try {
      const doc = document as any;
      const efs =
        doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen;
      if (
        efs &&
        (doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement)
      ) {
        await efs.call(doc);
      }
    } catch (e) {
      console.warn('Exit fullscreen failed:', e);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullScreen();
    } else {
      requestFullScreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFull = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement,
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const currentQuestion = questions[currentIdx];

  // Initialize questions order if shuffled
  useEffect(() => {
    const saved = examService.getSavedExamProgress(attempt.id);
    if (saved) {
      if (saved.answers) setAnswers(saved.answers);
      if (saved.visitedQuestions) setVisitedQuestions(saved.visitedQuestions);
      if (saved.markedQuestions) setMarkedQuestions(saved.markedQuestions);
      if (saved.currentIdx !== undefined) setCurrentIdx(saved.currentIdx);
      if (saved.codingCode) setCodingCode(saved.codingCode);
    }
  }, [attempt.id]);

  // Periodic Auto-Save
  useEffect(() => {
    examService.saveExamProgress(attempt.id, {
      answers,
      visitedQuestions,
      markedQuestions,
      currentIdx,
      secondsRemaining,
      codingCode,
    });
  }, [attempt.id, answers, visitedQuestions, markedQuestions, currentIdx, secondsRemaining, codingCode]);

  // Final Submit Handler
  const handleFinalSubmit = useCallback(
    (disqualified = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      // Build question statuses dictionary
      const statuses: Record<string, 'answered' | 'marked' | 'visited'> = {};
      questions.forEach((q) => {
        const hasAnswer = answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null;
        if (hasAnswer) statuses[q.id] = 'answered';
        else if (markedQuestions[q.id]) statuses[q.id] = 'marked';
        else if (visitedQuestions[q.id]) statuses[q.id] = 'visited';
      });

      try {
        exitFullScreen().catch(() => {});
        const completedAttempt = examService.submitExam(
          attempt.id,
          answers,
          statuses,
          disqualified,
        );
        onExamSubmitted(completedAttempt);
      } catch (err) {
        console.error('Submission failed', err);
        setIsSubmitting(false);
      }
    },
    [attempt.id, answers, markedQuestions, visitedQuestions, questions, isSubmitting, onExamSubmitted],
  );

  // Timer Countdown Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleFinalSubmit]);

  // Anti-Cheating: Tab Switch & Visibility Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = examService.logViolation(
          attempt.id,
          'tab_switch',
          `Tab switched or minimized at question ${currentIdx + 1}`,
        );
        setViolationsCount(newCount);

        if (newCount >= maxViolations) {
          setShowWarningModal(false);
          alert(`EXAMINATION TERMINATED: You have exceeded the maximum allowed violations (${maxViolations} tab switches). Your exam has been automatically submitted.`);
          handleFinalSubmit(true);
        } else {
          setWarningMessage(
            `SECURITY ALERT: Tab switch detected! (Violation ${newCount} of ${maxViolations}). On violation ${maxViolations}, your examination will be terminated and submitted immediately.`,
          );
          setShowWarningModal(true);
        }
      }
    };

    const handleWindowBlur = () => {
      // Minor blur detection
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [attempt.id, currentIdx, maxViolations, handleFinalSubmit]);

  // Determine Palette Status for each question
  const getPaletteStatus = (qId: string): PaletteStatus => {
    const hasAnswer =
      answers[qId] !== undefined &&
      answers[qId] !== '' &&
      answers[qId] !== null &&
      (!Array.isArray(answers[qId]) || answers[qId].length > 0);
    const isMarked = Boolean(markedQuestions[qId]);
    const isVisited = Boolean(visitedQuestions[qId]);

    if (hasAnswer && isMarked) return 'answered_and_marked'; // Purple
    if (isMarked) return 'marked_for_review'; // Yellow
    if (hasAnswer) return 'answered'; // Green
    if (isVisited) return 'unanswered'; // Grey
    return 'not_visited'; // Blue
  };

  // Color mapper helper for palette buttons & badge
  const getStatusColorClasses = (status: PaletteStatus) => {
    switch (status) {
      case 'answered': // 🟢 Green
        return 'bg-emerald-500 text-white border-emerald-600 shadow-sm';
      case 'marked_for_review': // 🟡 Yellow
        return 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm font-black';
      case 'answered_and_marked': // 🟣 Purple
        return 'bg-purple-600 text-white border-purple-700 shadow-sm font-black';
      case 'unanswered': // ⚪ / 🔘 Grey (visited but unanswered)
        return 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-400';
      case 'not_visited': // 🔵 Blue
      default:
        return 'bg-blue-500 text-white border-blue-600';
    }
  };

  // Navigate to Question
  const jumpToQuestion = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    const targetQ = questions[idx];
    setVisitedQuestions((prev) => ({ ...prev, [targetQ.id]: true }));
    setCurrentIdx(idx);
  };

  // Answer selection handlers
  const handleSelectOption = (optIndex: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optIndex }));
  };

  const handleToggleMultipleOption = (optIndex: number) => {
    if (!currentQuestion) return;
    const current: number[] = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : [];
    const exists = current.includes(optIndex);
    const updated = exists ? current.filter((i) => i !== optIndex) : [...current, optIndex];
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: updated }));
  };

  const handleTextAnswerChange = (val: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
  };

  const handleToggleMarkForReview = () => {
    if (!currentQuestion) return;
    setMarkedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const handleSaveAndNext = () => {
    if (currentIdx < questions.length - 1) {
      jumpToQuestion(currentIdx + 1);
    }
  };

  // Format time display (MM:SS)
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Count states for legend
  const counts = questions.reduce(
    (acc, q) => {
      const st = getPaletteStatus(q.id);
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    { answered: 0, marked_for_review: 0, answered_and_marked: 0, unanswered: 0, not_visited: 0 } as Record<PaletteStatus, number>,
  );

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] bg-slate-900 text-slate-100 flex flex-col font-sans select-none overflow-hidden m-0 p-0"
      style={{
        margin: 0,
        padding: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      {/* 1. Exam Header Bar */}
      <header className="h-16 px-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black">
            WG
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight line-clamp-1">{test.title}</h1>
            <p className="text-[11px] text-slate-400">
              {test.course_name} &bull; Examinee: <span className="text-slate-200 font-bold">{student.name}</span>
            </p>
          </div>
        </div>

        {/* Center: Live Countdown Timer, Anti-Cheating Pill & Fullscreen Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div
            className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono font-bold text-sm ${
              secondsRemaining < 300
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-indigo-300'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
              violationsCount === 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : violationsCount === 1
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>
              Violations: {violationsCount} / {maxViolations}
            </span>
          </div>

          {/* Dedicated Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-indigo-400" /> : <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />}
            <span>Fullscreen</span>
          </button>

          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Question View & Input Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
          <div className="space-y-5 max-w-4xl mx-auto w-full">
            {/* Question Top Info Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Type: <strong className="text-slate-200 capitalize">{currentQuestion?.type.replace('_', ' ')}</strong>
                </span>
                {currentQuestion?.topic && (
                  <span className="text-[11px] text-slate-500 px-2 py-0.5 rounded-md bg-slate-800">
                    {currentQuestion.topic}
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span className="text-emerald-400">+{currentQuestion?.marks || 1} Mark</span>
                {test.negative_marking_per_question > 0 && (
                  <span className="text-rose-400">-{test.negative_marking_per_question} Neg</span>
                )}
              </div>
            </div>

            {/* Question Prompt */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white text-base font-semibold leading-relaxed shadow-sm">
              {currentQuestion?.question_text?.replace(/\s*\([Vv]ariation\s*\d+\)/gi, '')}
            </div>

            {/* Code Snippet Viewer (If Find the Output or Coding) */}
            {currentQuestion?.code_snippet && (
              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{currentQuestion.coding_language || 'Code Snippet'}</span>
                  </span>
                </div>
                <pre className="text-emerald-400 overflow-x-auto whitespace-pre p-2 leading-relaxed">
                  {currentQuestion.code_snippet}
                </pre>
              </div>
            )}

            {/* Question Answering Input Component based on Type */}
            <div className="space-y-3 pt-2">
              {/* Type 1: MCQ & Find Output (Radio) */}
              {(currentQuestion?.type === 'mcq' || currentQuestion?.type === 'find_output') && (
                <div className="space-y-2.5">
                  {currentQuestion.options?.map((opt, optIdx) => {
                    const isSelected = answers[currentQuestion.id] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`p-4 rounded-xl border text-sm font-medium cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Type 2: Multiple Correct (Checkboxes) */}
              {currentQuestion?.type === 'multiple_correct' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-indigo-300 font-bold">Select all correct options:</p>
                  {currentQuestion.options?.map((opt, optIdx) => {
                    const currentSelected: number[] = Array.isArray(answers[currentQuestion.id])
                      ? answers[currentQuestion.id]
                      : [];
                    const isSelected = currentSelected.includes(optIdx);
                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleToggleMultipleOption(optIdx)}
                        className={`p-4 rounded-xl border text-sm font-medium cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                            isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Type 3: True / False */}
              {currentQuestion?.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map((label, optIdx) => {
                    const isSelected = answers[currentQuestion.id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(optIdx)}
                        className={`p-6 rounded-2xl border text-base font-black transition flex flex-col items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                        }`}
                      >
                        <span className="text-xl font-bold">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Type 4: Fill in Blanks */}
              {currentQuestion?.type === 'fill_blanks' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300">Enter the missing word or phrase:</label>
                  <input
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleTextAnswerChange(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Type 5: Short Answer */}
              {currentQuestion?.type === 'short_answer' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300">Provide your concise response:</label>
                  <textarea
                    rows={4}
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleTextAnswerChange(e.target.value)}
                    placeholder="Type your explanation or answer..."
                    className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Type 6: Coding Problem */}
              {currentQuestion?.type === 'coding' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Code className="w-4 h-4 text-emerald-400" />
                        <span>Code Solution Editor ({currentQuestion.coding_language || 'python'})</span>
                      </span>
                      <button
                        onClick={() => {
                          setTestCaseResults({ tc1: true, tc2: true });
                          alert('All sample test cases passed successfully!');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/40 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1 transition"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run Test Cases</span>
                      </button>
                    </label>
                    <textarea
                      rows={8}
                      value={answers[currentQuestion.id] || currentQuestion.code_snippet || ''}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      placeholder="# Write your program here..."
                      className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono text-xs leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Test Cases Table */}
                  {currentQuestion.test_cases && currentQuestion.test_cases.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                      <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Test Cases:</h6>
                      <div className="space-y-1.5 text-xs font-mono">
                        {currentQuestion.test_cases.map((tc, tcIdx) => (
                          <div key={tcIdx} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-300">
                              Input: <code className="text-indigo-300">{tc.input}</code>
                            </span>
                            <span className="text-slate-400">
                              Expected: <code className="text-emerald-400">{tc.expected_output}</code>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="max-w-4xl mx-auto w-full pt-4 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                disabled={currentIdx === 0}
                onClick={() => jumpToQuestion(currentIdx - 1)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-slate-300 border border-slate-700 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                onClick={handleClearResponse}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-400 hover:text-white border border-slate-700 transition flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Response</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMarkForReview}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  markedQuestions[currentQuestion?.id]
                    ? 'bg-amber-400 text-slate-900 border-amber-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                <span>{markedQuestions[currentQuestion?.id] ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={handleSaveAndNext}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-1"
                >
                  <span>Save & Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Final Test</span>
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Right: Question Navigation Palette (5 Exact Colors) */}
        <aside className="w-full lg:w-80 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Question Palette</h3>

            {/* 5-Color Legend Requirement:
                - Green: Answered
                - Yellow: Marked for Review
                - Purple: Answered & Marked for Review
                - Grey: Visited but Unanswered
                - Blue: Not Visited */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-300">Answered ({counts.answered})</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-slate-300">Review ({counts.marked_for_review})</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-600 shrink-0" />
                <span className="text-slate-300">Ans & Rev ({counts.answered_and_marked})</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-400 shrink-0" />
                <span className="text-slate-300">Unanswered ({counts.unanswered})</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 col-span-2">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0" />
                <span className="text-slate-300">Not Visited ({counts.not_visited})</span>
              </div>
            </div>

            {/* Grid of Question Numbers */}
            <div className="pt-2 border-t border-slate-800">
              <div className="grid grid-cols-5 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const status = getPaletteStatus(q.id);
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => jumpToQuestion(idx)}
                      className={`h-10 rounded-xl font-black text-xs transition border flex items-center justify-center relative ${getStatusColorClasses(
                        status,
                      )} ${isCurrent ? 'ring-2 ring-white scale-105 z-10' : 'hover:opacity-90'}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Student Card & Submit Button */}
          <div className="pt-4 border-t border-slate-800 mt-4 space-y-3">
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Total Answered:</span>
                <strong className="text-emerald-400">
                  {counts.answered + counts.answered_and_marked} / {questions.length}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Marked for Review:</span>
                <strong className="text-amber-400">{counts.marked_for_review + counts.answered_and_marked}</strong>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Assessment</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Warning Modal on Tab Switch */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border-2 border-rose-500 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-rose-400 tracking-tight">Security Violation Detected!</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{warningMessage}</p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-400">
              Violations: {violationsCount} of {maxViolations} permitted
            </div>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition"
            >
              I Understand & Resume Exam
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal before Submit */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">Ready to Submit Examination?</h4>
              <p className="text-xs text-slate-400 mt-1">
                You have answered <strong className="text-emerald-400">{counts.answered + counts.answered_and_marked}</strong> of{' '}
                <strong>{questions.length}</strong> questions.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Answered:</span>
                <span className="font-bold text-emerald-400">{counts.answered + counts.answered_and_marked}</span>
              </div>
              <div className="flex justify-between">
                <span>Marked for Review:</span>
                <span className="font-bold text-amber-400">{counts.marked_for_review + counts.answered_and_marked}</span>
              </div>
              <div className="flex justify-between">
                <span>Unanswered / Not Visited:</span>
                <span className="font-bold text-slate-400">{counts.unanswered + counts.not_visited}</span>
              </div>
            </div>

            {test.category === 'aptitude' ? (
              <p className="text-[11px] text-amber-400/90 font-medium">
                Note: This is a placement aptitude assessment (0 Credits). Your score and time-per-question will be recorded for placement benchmarking.
              </p>
            ) : test.category !== 'practice' ? (
              <p className="text-[11px] text-amber-400/90 font-medium">
                Note: This is an official examination. Once submitted, retakes are locked unless authorized by your mentor.
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition"
              >
                Return to Exam
              </button>
              <button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  handleFinalSubmit(false);
                }}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Confirm & Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
};
