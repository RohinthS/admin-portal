import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  Plus,
  Check,
  Eye,
  Layers,
  CheckSquare,
  Square,
  X,
  Shuffle,
  HelpCircle,
  Search,
  Filter,
  CheckCheck,
  ChevronRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { ExamQuestion, AssessmentConfig, CreditTier, QuestionType, QuestionDifficulty } from '../types';
import { examService } from '../services/examService';
import {
  syllabusProgressService,
  CourseModuleDef,
} from '../services/syllabusProgressService';

interface ConductModuleTestModalProps {
  courseName?: string;
  initialSelectedModules?: CourseModuleDef[];
  onClose: () => void;
  onPublished?: (newAssessment: AssessmentConfig) => void;
}

export const ConductModuleTestModal: React.FC<ConductModuleTestModalProps> = ({
  courseName,
  initialSelectedModules,
  onClose,
  onPublished,
}) => {
  // Courses catalog for the Course selector dropdown
  const [coursesCatalog, setCoursesCatalog] = useState<any[]>([]);

  // Current active course
  const [currentCourse, setCurrentCourse] = useState<string>(
    courseName || 'AI Java Full Stack Program'
  );

  useEffect(() => {
    syllabusProgressService.getAllCoursesSyllabusAsync().then((list) => {
      setCoursesCatalog(list);
      if (!courseName && list.length > 0) {
        setCurrentCourse(list[0].course_name);
      }
    });
  }, [courseName]);

  // All modules available for current course
  const courseModules = useMemo(() => {
    return syllabusProgressService.getModulesForCourse(currentCourse);
  }, [currentCourse]);

  // Current syllabus file if attached
  const currentSyllabusFile = useMemo(() => {
    const found = coursesCatalog.find((c) => c.course_name === currentCourse);
    return found?.syllabus_file || syllabusProgressService.getCourseSyllabusFile(currentCourse);
  }, [coursesCatalog, currentCourse]);

  // Selected module IDs
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>(() => {
    if (initialSelectedModules && initialSelectedModules.length > 0) {
      return initialSelectedModules.map((m) => m.id);
    }
    const initialMods = syllabusProgressService.getModulesForCourse(courseName || 'AI Java Full Stack Program');
    return [initialMods[0]?.id || ''];
  });

  // When course changes, reset selected modules to module 1 of the new course
  useEffect(() => {
    const mods = syllabusProgressService.getModulesForCourse(currentCourse);
    if (initialSelectedModules && initialSelectedModules.length > 0 && currentCourse === courseName) {
      setSelectedModuleIds(initialSelectedModules.map((m) => m.id));
    } else if (mods.length > 0) {
      setSelectedModuleIds([mods[0].id]);
    } else {
      setSelectedModuleIds([]);
    }
  }, [currentCourse]);

  // Toggle selection of a module
  const handleToggleModule = (modId: string) => {
    setSelectedModuleIds((prev) => {
      if (prev.includes(modId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((id) => id !== modId);
      } else {
        return [...prev, modId];
      }
    });
  };

  // Active module definitions
  const activeModules = useMemo(() => {
    return courseModules.filter((m) => selectedModuleIds.includes(m.id));
  }, [courseModules, selectedModuleIds]);

  // Questions suggested from Question Bank
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Record<string, boolean>>({});

  // Question Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedSubtopicFilter, setSelectedSubtopicFilter] = useState<string>('all');

  // Question Count Config
  const [targetCount, setTargetCount] = useState<number>(10);

  const [testTitle, setTestTitle] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [passingPercentage, setPassingPercentage] = useState<number>(60);

  // Inline "Add New Question" form state
  const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [newQType, setNewQType] = useState<QuestionType>('mcq');
  const [newQOptions, setNewQOptions] = useState<string[]>(['', '', '', '']);
  const [newQCorrectAnswer, setNewQCorrectAnswer] = useState<number>(0);
  const [newQDifficulty, setNewQDifficulty] = useState<QuestionDifficulty>('medium');
  const [newQMarks, setNewQMarks] = useState<number>(5);
  const [newQTopic, setNewQTopic] = useState<string>('');
  const [newQExplanation, setNewQExplanation] = useState('');

  // Publishing / Success State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedTest, setPublishedTest] = useState<AssessmentConfig | null>(null);

  // Load questions when selected modules change
  useEffect(() => {
    if (activeModules.length === 0) {
      setQuestions([]);
      setSelectedQuestionIds({});
      return;
    }

    const allBank = examService.getQuestionBank();
    const modulePool = syllabusProgressService.getQuestionsForMultipleModules(activeModules, allBank);
    setQuestions(modulePool);

    // Default test title
    const modNumbers = activeModules.map((m) => `Mod ${m.moduleNumber}`).join(' & ');
    setTestTitle(`${currentCourse} - ${modNumbers} Assessment`);

    // Default target count
    const suggested = Math.min(Math.max(activeModules.length * 10, 10), modulePool.length || 10);
    setTargetCount(suggested);

    // Auto-select targetCount questions
    const sel: Record<string, boolean> = {};
    modulePool.slice(0, suggested).forEach((q) => {
      sel[q.id] = true;
    });
    setSelectedQuestionIds(sel);

    // Duration: 2 minutes per question (minimum 15 mins)
    setDurationMinutes(Math.max(15, suggested * 2));

    // Reset subtopic filter
    setSelectedSubtopicFilter('all');

    // Prefill topic for inline question creation
    if (activeModules[0]?.topic) {
      setNewQTopic(activeModules[0].topic);
    }
  }, [activeModules, currentCourse]);

  // Unique available subtopics for filter chips
  const availableSubtopics = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((q) => {
      const st = q.subtopic || (q as any).matchedSubtopic;
      if (st) {
        counts[st] = (counts[st] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [questions]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSubtopicFilter !== 'all') {
        const st = q.subtopic || (q as any).matchedSubtopic;
        if (st !== selectedSubtopicFilter) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesPrompt = q.question_text.toLowerCase().includes(query);
        const matchesTopic = (q.topic || '').toLowerCase().includes(query);
        const matchesSub = ((q.subtopic || '') as string).toLowerCase().includes(query);
        if (!matchesPrompt && !matchesTopic && !matchesSub) return false;
      }
      if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) {
        return false;
      }
      if (filterType !== 'all' && q.type !== filterType) {
        return false;
      }
      return true;
    });
  }, [questions, searchQuery, filterDifficulty, filterType, selectedSubtopicFilter]);

  // Selected questions
  const selectedQuestions = useMemo(() => {
    return questions.filter((q) => selectedQuestionIds[q.id]);
  }, [questions, selectedQuestionIds]);

  const totalMarks = useMemo(() => {
    return selectedQuestions.reduce((sum, q) => sum + (q.marks || 5), 0);
  }, [selectedQuestions]);

  // Toggle single question
  const handleToggleQuestion = (id: string) => {
    setSelectedQuestionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Quick Preset Selection (Pick N questions randomly)
  const handlePickRandom = (count: number) => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const chosen = new Set(shuffled.slice(0, count).map((q) => q.id));
    const updated: Record<string, boolean> = {};
    questions.forEach((q) => {
      updated[q.id] = chosen.has(q.id);
    });
    setSelectedQuestionIds(updated);
    setTargetCount(count);
    setDurationMinutes(Math.max(15, count * 2));
  };

  // Select / Deselect All
  const handleSelectAll = (select: boolean) => {
    const updated: Record<string, boolean> = {};
    questions.forEach((q) => {
      updated[q.id] = select;
    });
    setSelectedQuestionIds(updated);
  };

  // Save New Custom Question to Bank & Immediately Select It
  const handleSaveNewQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim()) {
      alert('Please enter the question text.');
      return;
    }

    let finalOptions: string[] | undefined = undefined;
    if (newQType === 'mcq' || newQType === 'multiple_correct') {
      if (newQOptions.some((o) => !o.trim())) {
        alert('Please fill out all 4 option choices.');
        return;
      }
      finalOptions = newQOptions.map((o) => o.trim());
    } else if (newQType === 'true_false') {
      finalOptions = ['True', 'False'];
    }

    const newQuestion: ExamQuestion = {
      id: `custom-bank-${Date.now()}`,
      type: newQType,
      question_text: newQText.trim(),
      options: finalOptions,
      correct_answer: newQCorrectAnswer,
      marks: newQMarks,
      difficulty: newQDifficulty,
      topic: newQTopic || activeModules[0]?.topic || 'Technical Assessment',
      explanation: newQExplanation.trim() || `Classroom module question for ${courseName}.`,
      created_at: new Date().toISOString(),
    };

    // 1. Save to Central Question Bank
    examService.saveQuestionToBank(newQuestion);

    // 2. Prepend to questions list and auto-select
    setQuestions((prev) => [newQuestion, ...prev]);
    setSelectedQuestionIds((prev) => ({
      ...prev,
      [newQuestion.id]: true,
    }));

    // Reset Form
    setNewQText('');
    setNewQOptions(['', '', '', '']);
    setNewQCorrectAnswer(0);
    setNewQExplanation('');
    setShowAddQuestionForm(false);
  };

  // Publish Test
  const handlePublishTest = async () => {
    if (selectedQuestions.length === 0) {
      alert('Please select at least 1 question for the test.');
      return;
    }

    setIsPublishing(true);

    try {
      const creditTiers: CreditTier[] = [
        { min_percentage: 90, max_percentage: 100, credits: 50 },
        { min_percentage: 80, max_percentage: 89, credits: 40 },
        { min_percentage: 70, max_percentage: 79, credits: 30 },
        { min_percentage: 60, max_percentage: 69, credits: 20 },
        { min_percentage: 0, max_percentage: 59, credits: 0 },
      ];

      const assessmentConfig: AssessmentConfig = {
        id: `mod_test_${Date.now()}`,
        title: testTitle || `${currentCourse} Module Test`,
        description: `Official Module Assessment for ${currentCourse} covering: ${activeModules.map((m) => m.moduleName).join(', ')}.`,
        course_id: currentCourse.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        course_name: currentCourse,
        batch: 'All Batches',
        category: 'internal',
        month_number: activeModules[0]?.moduleNumber || 1,
        credit_category_id: 'monthly_test',
        duration_minutes: durationMinutes,
        passing_percentage: passingPercentage,
        negative_marking_per_question: 0,
        total_marks: totalMarks,
        total_questions: selectedQuestions.length,
        credit_tiers: creditTiers,
        publishing_mode: 'instant',
        is_secret_key_required: false,
        shuffle_questions: true,
        shuffle_options: true,
        auto_submit_on_timeout: true,
        max_attempts: 3,
        max_violations: 3,
        result_visibility: 'immediate',
        is_answer_key_released: true,
        is_retake_allowed: true,
        created_by: 'Instructor / Admin',
        creator_role: 'admin',
        created_at: new Date().toISOString(),
        status: 'published',
        unlocked_student_ids: ['all_students'],
        questions: selectedQuestions,
      };

      const saved = await examService.saveAssessmentApi(assessmentConfig);

      // Mark module as completed and test conducted
      activeModules.forEach((mod) => {
        syllabusProgressService.markCourseModuleCompleted(currentCourse, mod.id, 'Faculty Mentor');
        syllabusProgressService.recordTestConducted(currentCourse, 'Main', mod.id, assessmentConfig.id);
      });

      setPublishedTest(saved || assessmentConfig);
      setIsPublishing(false);

      if (onPublished) {
        onPublished(saved || assessmentConfig);
      }
    } catch (err: any) {
      console.error('Failed to publish module test:', err);
      alert('Failed to publish test. Please try again.');
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[95vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-600/20 text-white shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  ⚡ Conduct Module Test & Question Selection
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {currentCourse}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select course, completed syllabus modules, pick suggested questions from Question Bank, configure question count, and publish for students.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {publishedTest ? (
          // Success Screen
          <div className="p-8 text-center space-y-6 max-w-lg mx-auto my-auto animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                🎉 Assessment Published Successfully!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                The test is now active in the Student Portal for all enrolled students.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Test Title:</span>
                <span className="font-bold text-slate-900 dark:text-white">{publishedTest.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Course:</span>
                <span className="font-bold text-slate-900 dark:text-white">{publishedTest.course_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Questions:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{publishedTest.total_questions} Questions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Marks:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{publishedTest.total_marks} Marks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-bold text-slate-900 dark:text-white">{publishedTest.duration_minutes} Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Passing Score:</span>
                <span className="font-bold text-slate-900 dark:text-white">{publishedTest.passing_percentage}%</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            
            {/* 1. Step 1: Course & Module Selection */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>1. Course & Module Selection</span>
                </label>
                {currentSyllabusFile && (
                  <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 bg-white/90 dark:bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 shadow-2xs self-start sm:self-auto" title={currentSyllabusFile}>
                    <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate max-w-[280px]">{currentSyllabusFile}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Course *
                </label>
                <select
                  value={currentCourse}
                  onChange={(e) => setCurrentCourse(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                >
                  {coursesCatalog.map((c) => (
                    <option key={c.id || c.course_name} value={c.course_name}>
                      {c.course_name} ({ (c.modules || []).length || syllabusProgressService.getModulesForCourse(c.course_name).length } Modules)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Module Selector Section */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>2. Select Modules to Include in Test ({activeModules.length} Selected)</span>
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click to include or exclude modules
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {courseModules.map((mod) => {
                  const isSelected = selectedModuleIds.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleToggleModule(mod.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5 opacity-40" />
                      )}
                      <span>Mod {mod.moduleNumber}: {mod.moduleName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Question Count & Selection Presets Toolbar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    2. Question Selection ({selectedQuestions.length} Selected &bull; {totalMarks} Marks)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Available suggested questions from Central Question Bank: <strong>{questions.length}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowAddQuestionForm(!showAddQuestionForm)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add New Question to Bank & Test</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-500 text-[11px]">Quick Select:</span>
                <button
                  type="button"
                  onClick={() => handlePickRandom(5)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition"
                >
                  Pick 5
                </button>
                <button
                  type="button"
                  onClick={() => handlePickRandom(10)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition"
                >
                  Pick 10
                </button>
                <button
                  type="button"
                  onClick={() => handlePickRandom(15)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition"
                >
                  Pick 15
                </button>
                <button
                  type="button"
                  onClick={() => handlePickRandom(20)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition"
                >
                  Pick 20
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
                >
                  Select All ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Clear All
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Subtopic Filter Chips */}
              {availableSubtopics.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100 dark:border-slate-800 touch-scroll">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                    Filter Subtopic:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSubtopicFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition cursor-pointer ${
                      selectedSubtopicFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    All Subtopics ({questions.length})
                  </button>
                  {availableSubtopics.map((st) => (
                    <button
                      key={st.name}
                      type="button"
                      onClick={() => setSelectedSubtopicFilter(st.name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1 cursor-pointer ${
                        selectedSubtopicFilter === st.name
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span>{st.name}</span>
                      <span className="text-[10px] opacity-75">({st.count})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Inline Add Question Form */}
              {showAddQuestionForm && (
                <form
                  onSubmit={handleSaveNewQuestion}
                  className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-3 mt-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60 dark:border-indigo-800/60">
                    <h5 className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Add New Question to Central Question Bank & Select for Test</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowAddQuestionForm(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Question Prompt *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Which HTML5 tag is used to specify a footer for a document or section?"
                      value={newQText}
                      onChange={(e) => setNewQText(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {newQOptions.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOpt"
                          checked={newQCorrectAnswer === oIdx}
                          onChange={() => setNewQCorrectAnswer(oIdx)}
                          className="text-indigo-600 cursor-pointer"
                          title="Mark as correct answer"
                        />
                        <input
                          type="text"
                          required
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newQOptions];
                            updated[oIdx] = e.target.value;
                            setNewQOptions(updated);
                          }}
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Difficulty</label>
                      <select
                        value={newQDifficulty}
                        onChange={(e) => setNewQDifficulty(e.target.value as QuestionDifficulty)}
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Marks</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={newQMarks}
                        onChange={(e) => setNewQMarks(Number(e.target.value))}
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Topic</label>
                      <input
                        type="text"
                        value={newQTopic}
                        onChange={(e) => setNewQTopic(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddQuestionForm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                    >
                      Save to Bank & Select
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 3. Question Cards List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredQuestions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">No questions found matching criteria. Click "+ Add New Question" to add one.</p>
                </div>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const isChecked = !!selectedQuestionIds[q.id];
                  return (
                    <div
                      key={q.id || idx}
                      onClick={() => handleToggleQuestion(q.id)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-2xs'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                            Q{idx + 1}
                          </span>
                          {q.topic && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                              {q.topic}
                            </span>
                          )}
                          {q.subtopic && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              {q.subtopic}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                              q.difficulty === 'easy'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : q.difficulty === 'hard'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 ml-auto">
                            {q.marks || 5} Marks
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                          {q.question_text}
                        </p>

                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-2 gap-1.5 mt-2">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect =
                                Array.isArray(q.correct_answer)
                                  ? q.correct_answer.includes(oIdx)
                                  : q.correct_answer === oIdx || String(q.correct_answer).trim().toLowerCase() === opt.trim().toLowerCase();
                              return (
                                <div
                                  key={oIdx}
                                  className={`text-[11px] px-2 py-1 rounded-lg border ${
                                    isCorrect
                                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold'
                                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <span className="font-mono mr-1 text-[10px]">{String.fromCharCode(65 + oIdx)}.</span>
                                  {opt}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(!q.options || q.options.length === 0) && q.correct_answer && (
                          <div className="mt-2 text-[11px] p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                            <span>Answer:</span>
                            <span className="font-mono font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                              {String(q.correct_answer)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 4. Test Publishing Configuration */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>4. Test Delivery & Classroom Settings</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Test Title
                  </label>
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Duration (Mins)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Passing %
                    </label>
                    <input
                      type="number"
                      min={35}
                      max={100}
                      value={passingPercentage}
                      onChange={(e) => setPassingPercentage(Number(e.target.value))}
                      className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        {!publishedTest && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Selected: <strong className="text-indigo-600 dark:text-indigo-400">{selectedQuestions.length} Questions</strong> ({totalMarks} Marks)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isPublishing || selectedQuestions.length === 0}
                onClick={handlePublishTest}
                className="px-5 py-2 text-xs font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 active:scale-98 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>{isPublishing ? 'Publishing...' : '🚀 Publish Test for Students'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
