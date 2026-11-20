import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExamQuestion, QuestionDifficulty, QuestionType } from '../types';
import {
  examService,
  CATEGORIZED_COURSES,
  COURSE_TO_TOPICS_MAP,
  TOPIC_COUNTS,
} from '../services/examService';
import {
  Layers,
  Search,
  Plus,
  Trash2,
  X,
  Code,
  CheckCircle2,
  Shuffle,
  Filter,
  RotateCcw,
  HelpCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Info,
  List,
  LayoutGrid,
  Download,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ActionConfirmModal } from '../../../components/ActionConfirmModal';

interface QuestionBankModalProps {
  onClose?: () => void;
  onSelectQuestions?: (selected: ExamQuestion[]) => void;
  isInline?: boolean;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  onClose,
  onSelectQuestions,
  isInline = false,
}) => {
  const [bank, setBank] = useState<ExamQuestion[]>(() => examService.getQuestionBank());

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [selectedAptitudeSection, setSelectedAptitudeSection] = useState<'all' | 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Full Page view mode toggle (false by default when isInline so sidebar is visible, true when standalone modal)
  const [isFullScreen, setIsFullScreen] = useState(!isInline);

  useEffect(() => {
    setBank(examService.getQuestionBank());
  }, []);

  useEffect(() => {
    if (isInline) {
      setIsFullScreen(false);
    }
  }, [isInline]);

  // View Mode: 'compact' (dense fast rows) vs 'expanded' (full question cards)
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});

  const toggleExpandQuestion = (id: string) => {
    setExpandedQuestionIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleExpandAll = () => {
    const allExpanded = paginatedQuestions.every((q) => expandedQuestionIds[q.id]);
    if (allExpanded) {
      setExpandedQuestionIds({});
    } else {
      const next: Record<string, boolean> = {};
      paginatedQuestions.forEach((q) => {
        next[q.id] = true;
      });
      setExpandedQuestionIds(next);
    }
  };

  const handleExportToExcel = () => {
    if (filteredQuestions.length === 0) {
      alert('No questions to export with current filters.');
      return;
    }
    const rows = filteredQuestions.map((q, idx) => ({
      'S.No': idx + 1,
      'Question ID': q.id,
      'Topic': q.topic || 'General',
      'Subtopic': q.subtopic || '',
      'Type': q.type,
      'Difficulty': q.difficulty,
      'Marks': q.marks,
      'Negative Marks': q.negative_marks || 0,
      'Question Prompt': q.question_text?.replace(/\s*\([Vv]ariation\s*\d+\)/gi, ''),
      'Option A': q.options?.[0] || '',
      'Option B': q.options?.[1] || '',
      'Option C': q.options?.[2] || '',
      'Option D': q.options?.[3] || '',
      'Correct Answer':
        typeof q.correct_answer === 'number'
          ? `Option ${String.fromCharCode(65 + q.correct_answer)}`
          : String(q.correct_answer),
      'Code Snippet': q.code_snippet || '',
      'Explanation': q.explanation || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Question_Bank');
    const topicTag = selectedTopic !== 'all' ? selectedTopic.replace(/[^a-zA-Z0-9]/g, '_') : 'All_Topics';
    XLSX.writeFile(workbook, `WeGrow_Question_Bank_${topicTag}.xlsx`);
  };

  // Add Question to Bank State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState<QuestionType>('mcq');
  const [newTopic, setNewTopic] = useState('HTML');
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [newDiff, setNewDiff] = useState<QuestionDifficulty>('medium');
  const [newMarks, setNewMarks] = useState(3);
  const [newText, setNewText] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrectSingle, setNewCorrectSingle] = useState(0);
  const [newCorrectMultiple, setNewCorrectMultiple] = useState<number[]>([0]);
  const [newCorrectText, setNewCorrectText] = useState('');
  const [newExplanation, setNewExplanation] = useState('');
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshBanner, setRefreshBanner] = useState<string | null>(null);

  // Random picker & Manual count state
  const [manualPickCount, setManualPickCount] = useState<number>(10);
  const [showAptitudeMatrix, setShowAptitudeMatrix] = useState(false);
  const [aptitudeMatrix, setAptitudeMatrix] = useState({
    quants: { easy: 4, medium: 4, hard: 2 },
    logical: { easy: 4, medium: 4, hard: 2 },
    verbal: { easy: 4, medium: 4, hard: 2 },
  });
  const [showRandomGen, setShowRandomGen] = useState(false);
  const [genCount, setGenCount] = useState(10);
  const [genDifficulty, setGenDifficulty] = useState('all');
  const [genTopic, setGenTopic] = useState('all');
  const [genCourse, setGenCourse] = useState('all');

  // Multi-Subject Question Selector state
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>({});
  const [subjectQuestionCounts, setSubjectQuestionCounts] = useState<Record<string, number>>({});

  const availableSubjects = useMemo(() => {
    const topicMap: Record<string, number> = {};
    bank.forEach((q) => {
      const topic = q.topic || 'General';
      topicMap[topic] = (topicMap[topic] || 0) + 1;
    });

    const standardOrder = [
      'HTML',
      'CSS',
      'JavaScript',
      'React',
      'Python',
      'Java',
      'Data Science',
      'Flutter',
      'Cybersecurity',
      'UI / UX Design',
      'Tally PRIME',
      'Software Testing & C',
      'Aptitude',
      'Quantitative Aptitude',
      'Logical Reasoning',
      'Verbal Ability',
    ];

    const sortedNames = Object.keys(topicMap).sort((a, b) => {
      const indexA = standardOrder.indexOf(a);
      const indexB = standardOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    return sortedNames.map((name) => ({
      name,
      count: topicMap[name],
    }));
  }, [bank]);

  const handleToggleSubject = (subjectName: string) => {
    setSelectedSubjects((prev) => {
      const isCurrentlySelected = !prev[subjectName];
      const next = { ...prev, [subjectName]: isCurrentlySelected };
      if (isCurrentlySelected && !subjectQuestionCounts[subjectName]) {
        setSubjectQuestionCounts((c) => ({ ...c, [subjectName]: 5 }));
      }
      return next;
    });
  };

  const handleSelectAllSubjects = (selectAll: boolean) => {
    const updatedSelected: Record<string, boolean> = {};
    const updatedCounts = { ...subjectQuestionCounts };
    availableSubjects.forEach((sub) => {
      updatedSelected[sub.name] = selectAll;
      if (selectAll && !updatedCounts[sub.name]) {
        updatedCounts[sub.name] = 5;
      }
    });
    setSelectedSubjects(updatedSelected);
    setSubjectQuestionCounts(updatedCounts);
  };

  const handleSubjectCountChange = (subjectName: string, count: number, maxCount: number) => {
    const cleanCount = Math.max(1, Math.min(maxCount, count || 1));
    setSubjectQuestionCounts((prev) => ({
      ...prev,
      [subjectName]: cleanCount,
    }));
  };

  const handleSetGlobalCountForSelected = (count: number) => {
    const updated = { ...subjectQuestionCounts };
    availableSubjects.forEach((sub) => {
      updated[sub.name] = Math.min(count, sub.count);
    });
    setSubjectQuestionCounts(updated);
  };

  const handleApplySubjectSelection = () => {
    const activeSubjects = availableSubjects.filter((s) => selectedSubjects[s.name]);
    if (activeSubjects.length === 0) {
      alert('Please check at least one subject to select questions.');
      return;
    }

    const newSelectedIds = { ...selectedIds };
    let totalAdded = 0;
    const summary: string[] = [];

    activeSubjects.forEach((sub) => {
      const targetCount = subjectQuestionCounts[sub.name] || 5;
      const pool = bank.filter(
        (q) => (q.topic || 'General').toLowerCase() === sub.name.toLowerCase()
      );

      // Prefer unselected
      const unselected = pool.filter((q) => !newSelectedIds[q.id]);
      const candidates = unselected.length >= targetCount ? unselected : pool;

      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, targetCount);

      chosen.forEach((q) => {
        newSelectedIds[q.id] = true;
        totalAdded++;
      });

      summary.push(`${sub.name}: ${chosen.length}`);
    });

    setSelectedIds(newSelectedIds);
    alert(
      `✅ Selected ${totalAdded} questions across ${activeSubjects.length} subjects!\n\n${summary.join(', ')}`
    );
  };

  const selectedSubjectsCount = useMemo(() => {
    return availableSubjects.filter((s) => selectedSubjects[s.name]).length;
  }, [availableSubjects, selectedSubjects]);

  const totalSubjectQuestionsToSelect = useMemo(() => {
    return availableSubjects
      .filter((s) => selectedSubjects[s.name])
      .reduce((acc, s) => acc + (subjectQuestionCounts[s.name] || 5), 0);
  }, [availableSubjects, selectedSubjects, subjectQuestionCounts]);

  const isAllSubjectsChecked = useMemo(() => {
    return (
      availableSubjects.length > 0 &&
      availableSubjects.every((s) => selectedSubjects[s.name])
    );
  }, [availableSubjects, selectedSubjects]);

  // Core topics list
  const coreTopics = [
    { name: 'HTML', count: '1,000', easy: 350, med: 400, hard: 250 },
    { name: 'CSS', count: '1,000', easy: 350, med: 400, hard: 250 },
    { name: 'JavaScript', count: '1,000', easy: 350, med: 400, hard: 250 },
    { name: 'React', count: '1,000', easy: 350, med: 400, hard: 250 },
    { name: 'Python', count: '1,000', easy: 350, med: 400, hard: 250 },
    { name: 'Java', count: '1,000', easy: 350, med: 400, hard: 250 },
    { name: 'Data Science', count: '150', easy: 50, med: 60, hard: 40 },
    { name: 'Flutter', count: '150', easy: 50, med: 60, hard: 40 },
    { name: 'Cybersecurity', count: '150', easy: 50, med: 60, hard: 40 },
    { name: 'UI / UX Design', count: '150', easy: 50, med: 60, hard: 40 },
    { name: 'Tally PRIME', count: '100', easy: 40, med: 40, hard: 20 },
    { name: 'Software Testing & C', count: '100', easy: 40, med: 40, hard: 20 },
    { name: 'Aptitude', count: '600', easy: 210, med: 240, hard: 150 },
  ];

  // Filtered Questions Computation
  const filteredQuestions = useMemo(() => {
    return bank.filter((q) => {
      // 1. Course Filter
      if (selectedCourse !== 'all') {
        const matchingTopics = COURSE_TO_TOPICS_MAP[selectedCourse] || [];
        if (matchingTopics.length > 0 && !matchingTopics.includes(q.topic || '')) {
          return false;
        }
      }

      // 2. Topic Filter
      if (selectedTopic !== 'all' && (q.topic || '').toLowerCase() !== selectedTopic.toLowerCase()) {
        return false;
      }

      // 2b. Aptitude Subtopic Filter
      if (selectedTopic.toLowerCase() === 'aptitude' && selectedAptitudeSection !== 'all') {
        if (q.subtopic !== selectedAptitudeSection) {
          return false;
        }
      }

      // 3. Difficulty Filter
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) {
        return false;
      }

      // 4. Type Filter
      if (selectedType !== 'all' && q.type !== selectedType) {
        return false;
      }

      // 5. Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const inText = q.question_text.toLowerCase().includes(term);
        const inTopic = (q.topic || '').toLowerCase().includes(term);
        const inCode = (q.code_snippet || '').toLowerCase().includes(term);
        const inExp = (q.explanation || '').toLowerCase().includes(term);
        const inOpts = (q.options || []).some((opt) => opt.toLowerCase().includes(term));
        if (!inText && !inTopic && !inCode && !inExp && !inOpts) {
          return false;
        }
      }

      return true;
    });
  }, [bank, selectedCourse, selectedTopic, selectedDifficulty, selectedType, searchTerm]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, selectedTopic, selectedDifficulty, selectedType, searchTerm, pageSize]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Counts by difficulty in current filtered view
  const difficultyCounts = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    filteredQuestions.forEach((q) => {
      if (q.difficulty === 'easy') easy++;
      else if (q.difficulty === 'medium') medium++;
      else if (q.difficulty === 'hard') hard++;
    });
    return { easy, medium, hard, total: filteredQuestions.length };
  }, [filteredQuestions]);

  const handleDelete = (id: string) => {
    setDeleteQuestionTarget(id);
  };

  const handleResetSeedBank = () => {
    setIsRefreshing(true);
    const reseeded = examService.resetQuestionBank();
    setBank(reseeded);
    setSelectedCourse('all');
    setSelectedTopic('all');
    setSelectedDifficulty('all');
    setSelectedType('all');
    setSearchTerm('');
    setCurrentPage(1);
    setSelectedIds({});

    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshBanner('✓ Question Bank successfully refreshed & reloaded (7,400+ standard questions)!');
      setTimeout(() => setRefreshBanner(null), 3500);
    }, 300);
  };

  const handleToggleSelect = (qId: string) => {
    setSelectedIds((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSelectPage = () => {
    const next = { ...selectedIds };
    paginatedQuestions.forEach((q) => {
      next[q.id] = true;
    });
    setSelectedIds(next);
  };

  const handleSelectAllFiltered = () => {
    const next = { ...selectedIds };
    filteredQuestions.forEach((q) => {
      next[q.id] = true;
    });
    setSelectedIds(next);
  };

  const handlePickRandomN = (n: number) => {
    const unselected = filteredQuestions.filter((q) => !selectedIds[q.id]);
    const pool = unselected.length > 0 ? unselected : filteredQuestions;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(n, pool.length));
    const next = { ...selectedIds };
    picked.forEach((q) => {
      next[q.id] = true;
    });
    setSelectedIds(next);
  };

  const handlePickAptitudeSubtopic = (subtopic: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability', count = 10) => {
    const unselected = bank.filter((q) => q.topic === 'Aptitude' && q.subtopic === subtopic && !selectedIds[q.id]);
    const pool = unselected.length >= count ? unselected : bank.filter((q) => q.topic === 'Aptitude' && q.subtopic === subtopic);
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(count, pool.length));
    const next = { ...selectedIds };
    picked.forEach((q) => {
      next[q.id] = true;
    });
    setSelectedIds(next);
  };

  const handlePickAptitudeFullMock = () => {
    const next = { ...selectedIds };
    const sections: Array<'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability'> = [
      'Quantitative Aptitude',
      'Logical Reasoning',
      'Verbal Ability',
    ];
    sections.forEach((sec) => {
      const unselected = bank.filter((q) => q.topic === 'Aptitude' && q.subtopic === sec && !next[q.id]);
      const pool = unselected.length >= 10 ? unselected : bank.filter((q) => q.topic === 'Aptitude' && q.subtopic === sec);
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      shuffled.slice(0, Math.min(10, pool.length)).forEach((q) => {
        next[q.id] = true;
      });
    });
    setSelectedIds(next);
  };

  const handlePickCustomAptitude = () => {
    const specs: { subtopic: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability'; diff: QuestionDifficulty; count: number }[] = [
      { subtopic: 'Quantitative Aptitude', diff: 'easy', count: aptitudeMatrix.quants.easy },
      { subtopic: 'Quantitative Aptitude', diff: 'medium', count: aptitudeMatrix.quants.medium },
      { subtopic: 'Quantitative Aptitude', diff: 'hard', count: aptitudeMatrix.quants.hard },
      { subtopic: 'Logical Reasoning', diff: 'easy', count: aptitudeMatrix.logical.easy },
      { subtopic: 'Logical Reasoning', diff: 'medium', count: aptitudeMatrix.logical.medium },
      { subtopic: 'Logical Reasoning', diff: 'hard', count: aptitudeMatrix.logical.hard },
      { subtopic: 'Verbal Ability', diff: 'easy', count: aptitudeMatrix.verbal.easy },
      { subtopic: 'Verbal Ability', diff: 'medium', count: aptitudeMatrix.verbal.medium },
      { subtopic: 'Verbal Ability', diff: 'hard', count: aptitudeMatrix.verbal.hard },
    ];

    const next = { ...selectedIds };
    let totalAdded = 0;
    specs.forEach((s) => {
      if (s.count > 0) {
        const matching = bank.filter(
          (q) => q.topic === 'Aptitude' && q.subtopic === s.subtopic && q.difficulty === s.diff && !next[q.id]
        );
        const pool = matching.length >= s.count ? matching : bank.filter(
          (q) => q.topic === 'Aptitude' && q.subtopic === s.subtopic && q.difficulty === s.diff
        );
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const picked = shuffled.slice(0, Math.min(s.count, pool.length));
        picked.forEach((q) => {
          next[q.id] = true;
          totalAdded++;
        });
      }
    });

    setSelectedIds(next);
    alert(`Selected ${totalAdded} Aptitude questions matching your exact matrix distribution!`);
  };

  const handleClearSelection = () => {
    setSelectedIds({});
  };

  const handleConfirmImport = () => {
    if (!onSelectQuestions) return;
    const chosen = bank.filter((q) => selectedIds[q.id]);
    onSelectQuestions(chosen);
    onClose();
  };

  const handleRunRandomGen = () => {
    const randoms = examService.getRandomQuestionsFromBank({
      count: genCount,
      topic: genTopic,
      course: genCourse,
      difficulty: genDifficulty,
    });
    const next = { ...selectedIds };
    randoms.forEach((q) => {
      next[q.id] = true;
    });
    setSelectedIds(next);
    setShowRandomGen(false);
    alert(`Selected ${randoms.length} random questions matching your criteria!`);
  };

  const handleSaveNewQuestionToBank = () => {
    if (!newText.trim()) {
      alert('Please enter question prompt');
      return;
    }

    let correctAnswer: any = newCorrectSingle;
    let cleanOptions = newOptions.map((o) => o.trim()).filter((o) => o.length > 0);

    if (newType === 'multiple_correct') {
      correctAnswer = newCorrectMultiple;
    } else if (newType === 'true_false') {
      cleanOptions = ['True', 'False'];
      correctAnswer = newCorrectSingle;
    } else if (newType === 'fill_blanks' || newType === 'short_answer' || newType === 'coding') {
      correctAnswer = newCorrectText.trim();
    }

    const created: ExamQuestion = {
      id: `qb-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: newType,
      question_text: newText,
      options: cleanOptions.length > 0 ? cleanOptions : undefined,
      correct_answer: correctAnswer,
      marks: newMarks,
      negative_marks: 0,
      code_snippet: newCode.trim() ? newCode : undefined,
      topic: newTopic.trim() || 'General',
      difficulty: newDiff,
      explanation: newExplanation,
    };

    examService.saveQuestionToBank(created);
    setBank(examService.getQuestionBank());
    setShowAddForm(false);
    setNewText('');
    setNewCode('');
    setNewExplanation('');
    setNewCorrectText('');
    setNewOptions(['', '', '', '']);
    setRefreshBanner('✓ Question successfully added to Central Question Bank!');
    setTimeout(() => setRefreshBanner(null), 3500);
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const modalInnerContent = (
    <>
      {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Central Question Bank ({bank.length.toLocaleString()} Questions)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                  40 Courses
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                1,000 Questions per core topic (HTML, CSS, JavaScript, React, Python, Java) across Easy, Medium, and Difficult tiers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportToExcel}
              title="Export filtered questions to Excel (.xlsx)"
              className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export (.xlsx)</span>
            </button>

            <button
              onClick={() => setShowSubjectPicker(!showSubjectPicker)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                showSubjectPicker
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Subject Multi-Select</span>
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showAddForm ? 'Hide Form' : 'New Question'}</span>
            </button>

            <button
              onClick={() => setShowRandomGen(true)}
              className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-100 transition cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Random Generator</span>
            </button>

            <button
              onClick={handleResetSeedBank}
              title="Reseed 6,800+ standard question bank"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? 'Exit Full Screen (Show Sidebar)' : 'Distraction-Free Full Screen'}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                title={isInline ? 'Back to Assessments' : 'Close'}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ================= SUBJECT CHECKBOX & QUESTION COUNT BUILDER ================= */}
        {showSubjectPicker && (
          <div className="p-4 sm:p-5 bg-slate-50/90 dark:bg-slate-900/90 border-b-2 border-indigo-200 dark:border-indigo-800/80 shadow-inner space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h6 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                    Select Questions by Subject / Domain
                  </h6>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {availableSubjects.length} Subjects
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select subject checkboxes and specify question counts to automatically select questions from each subject.
                </p>
              </div>

              {/* Quick Count Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Set all counts to:</span>
                {[5, 10, 15, 20, 25].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handleSetGlobalCountForSelected(cnt)}
                    className="px-2 py-1 rounded-md text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Master Controls Header */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSubjectsChecked}
                  onChange={(e) => handleSelectAllSubjects(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isAllSubjectsChecked ? 'Deselect All Subjects' : 'Select All Subjects'}
                </span>
              </label>

              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {selectedSubjectsCount} of {availableSubjects.length} Subjects Selected
                {selectedSubjectsCount > 0 && ` (${totalSubjectQuestionsToSelect} Total Questions)`}
              </div>
            </div>

            {/* Grid of Subjects with Checkbox in front + Subject Name + Count Textbox after */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {availableSubjects.map((sub) => {
                const isSelected = !!selectedSubjects[sub.name];
                const countVal = subjectQuestionCounts[sub.name] ?? 5;
                return (
                  <div
                    key={sub.name}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {/* Checkbox in front of subject name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        id={`qb-subj-chk-${sub.name}`}
                        checked={isSelected}
                        onChange={() => handleToggleSubject(sub.name)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                      />
                      <label
                        htmlFor={`qb-subj-chk-${sub.name}`}
                        className="text-xs font-bold text-slate-900 dark:text-white truncate cursor-pointer select-none"
                        title={sub.name}
                      >
                        {sub.name}
                      </label>
                    </div>

                    {/* Question Count Textbox after subject name */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
                        ({sub.count.toLocaleString()})
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Qty:
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={sub.count}
                        value={countVal}
                        onChange={(e) =>
                          handleSubjectCountChange(
                            sub.name,
                            parseInt(e.target.value) || 0,
                            sub.count
                          )
                        }
                        disabled={!isSelected}
                        className="w-16 px-2 py-1 text-xs font-bold text-center border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-30 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="5"
                        title={`Enter number of questions to select from ${sub.name}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Button to Select Questions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {selectedSubjectsCount > 0 ? (
                  <>
                    Selected <strong className="text-indigo-600 dark:text-indigo-400">{selectedSubjectsCount}</strong> subjects with{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400">{totalSubjectQuestionsToSelect}</strong> questions ready to select.
                  </>
                ) : (
                  'Check the box next to any subject above and set question counts.'
                )}
              </span>

              <button
                type="button"
                disabled={selectedSubjectsCount === 0 || totalSubjectQuestionsToSelect === 0}
                onClick={handleApplySubjectSelection}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  Select {totalSubjectQuestionsToSelect > 0 ? `${totalSubjectQuestionsToSelect} Questions` : 'Questions'} from Selected Subjects
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Add Question Expandable Panel (Arranged Cleanly & Properly) */}
        {showAddForm && (
          <div className="p-5 sm:p-6 border-b border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/50 via-white to-white dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-900 shadow-sm space-y-4 animate-in fade-in shrink-0 overflow-y-auto max-h-[70vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                    Add New Question to Permanent Central Bank
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Question will be permanently saved to the repository and available for all assessments.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Row 1: Metadata Grid (Type, Topic, Difficulty, Marks) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
              {/* Question Type */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Question Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  <option value="mcq">Single Correct (MCQ)</option>
                  <option value="multiple_correct">Multiple Correct (MSQ)</option>
                  <option value="find_output">Find the Output (Code)</option>
                  <option value="true_false">True / False</option>
                  <option value="fill_blanks">Fill in Blanks</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="coding">Coding Challenge</option>
                </select>
              </div>

              {/* Topic / Subject Selection (Image 3: Dropdown + Custom Topic) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Topic / Domain
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTopic(!isCustomTopic);
                      if (isCustomTopic) {
                        setNewTopic(availableSubjects[0]?.name || 'HTML');
                      } else {
                        setNewTopic('');
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {isCustomTopic ? 'Choose from List' : '+ Custom Topic'}
                  </button>
                </div>

                {isCustomTopic ? (
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Enter custom topic name..."
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                ) : (
                  <select
                    value={newTopic}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomTopic(true);
                        setNewTopic('');
                      } else {
                        setNewTopic(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} ({s.count})
                      </option>
                    ))}
                    <option value="__custom__">➕ + Custom Topic (Type New)</option>
                  </select>
                )}
              </div>

              {/* Difficulty Level */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Difficulty Level
                </label>
                <select
                  value={newDiff}
                  onChange={(e) => {
                    const diff = e.target.value as QuestionDifficulty;
                    setNewDiff(diff);
                    if (diff === 'easy') setNewMarks(2);
                    else if (diff === 'medium') setNewMarks(3);
                    else if (diff === 'hard') setNewMarks(5);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  <option value="easy">🟢 Easy Tier (Standard: 2 Marks)</option>
                  <option value="medium">🟡 Medium Tier (Standard: 3 Marks)</option>
                  <option value="hard">🔴 Difficult Tier (Standard: 5 Marks)</option>
                </select>
              </div>

              {/* Marks Allocation */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Marks Allocation
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={newMarks}
                      onChange={(e) => setNewMarks(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs text-center"
                    />
                    <span className="absolute right-2.5 top-2.5 text-[11px] font-bold text-slate-400">Pts</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shrink-0">
                    +{newMarks} Marks
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Question Prompt */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Question Prompt / Problem Statement <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">Clear & unambiguous statement</span>
              </div>
              <textarea
                rows={3}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Type the complete question prompt here..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition leading-relaxed"
              />
            </div>

            {/* Row 3 (Conditional): Code Snippet */}
            {(newType === 'find_output' || newType === 'coding') && (
              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Code Snippet / Implementation Block</span>
                </label>
                <textarea
                  rows={4}
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="// Paste or write the code snippet here..."
                  className="w-full p-3 font-mono text-xs border border-slate-700 bg-slate-950 text-emerald-400 rounded-xl leading-relaxed shadow-inner"
                />
              </div>
            )}

            {/* Row 4: Options Layout (Arranged Cleanly & Properly - Image 2) */}
            {(newType === 'mcq' || newType === 'find_output') && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Answer Options (Click radio button to select the correct answer):
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Selected Answer: Option {String.fromCharCode(65 + newCorrectSingle)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {newOptions.map((opt, oIdx) => {
                    const isCorrect = newCorrectSingle === oIdx;
                    const letter = String.fromCharCode(65 + oIdx);
                    return (
                      <div
                        key={oIdx}
                        onClick={() => setNewCorrectSingle(oIdx)}
                        className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${
                          isCorrect
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition ${
                            isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {letter}
                        </div>

                        <input
                          type="text"
                          value={opt}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const copy = [...newOptions];
                            copy[oIdx] = e.target.value;
                            setNewOptions(copy);
                          }}
                          placeholder={`Enter text for Option ${letter}...`}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:border-indigo-500 focus:outline-none"
                        />

                        <label
                          className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-bold shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewCorrectSingle(oIdx);
                          }}
                        >
                          <input
                            type="radio"
                            name="qb_correct_single"
                            checked={isCorrect}
                            onChange={() => setNewCorrectSingle(oIdx)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                          />
                          <span
                            className={
                              isCorrect
                                ? 'text-emerald-700 dark:text-emerald-300 font-black'
                                : 'text-slate-400 font-semibold'
                            }
                          >
                            {isCorrect ? '✓ Correct' : 'Select'}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Multiple Correct MSQ */}
            {newType === 'multiple_correct' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Answer Options (Check all options that are correct):
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {newCorrectMultiple.length} Correct Option(s) Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {newOptions.map((opt, oIdx) => {
                    const isCorrect = newCorrectMultiple.includes(oIdx);
                    const letter = String.fromCharCode(65 + oIdx);
                    const toggle = () => {
                      if (isCorrect) {
                        if (newCorrectMultiple.length > 1) {
                          setNewCorrectMultiple(newCorrectMultiple.filter((i) => i !== oIdx));
                        }
                      } else {
                        setNewCorrectMultiple([...newCorrectMultiple, oIdx]);
                      }
                    };
                    return (
                      <div
                        key={oIdx}
                        onClick={toggle}
                        className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${
                          isCorrect
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-xs'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition ${
                            isCorrect
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {letter}
                        </div>

                        <input
                          type="text"
                          value={opt}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const copy = [...newOptions];
                            copy[oIdx] = e.target.value;
                            setNewOptions(copy);
                          }}
                          placeholder={`Enter text for Option ${letter}...`}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:border-indigo-500 focus:outline-none"
                        />

                        <label
                          className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-bold shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle();
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isCorrect}
                            onChange={toggle}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                          <span
                            className={
                              isCorrect
                                ? 'text-indigo-700 dark:text-indigo-300 font-black'
                                : 'text-slate-400 font-semibold'
                            }
                          >
                            {isCorrect ? '✓ Correct' : 'Select'}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* True / False */}
            {newType === 'true_false' && (
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Select Correct Answer:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'True', val: 0 },
                    { label: 'False', val: 1 },
                  ].map((tf) => {
                    const isSelected = newCorrectSingle === tf.val;
                    return (
                      <button
                        key={tf.label}
                        type="button"
                        onClick={() => setNewCorrectSingle(tf.val)}
                        className={`p-4 rounded-2xl border-2 font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <CheckCircle2 className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-slate-300'}`} />
                        <span>{tf.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fill in Blanks / Short Answer / Coding Challenge */}
            {(newType === 'fill_blanks' || newType === 'short_answer' || newType === 'coding') && (
              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Expected Correct Text / Output Answer:
                </label>
                <input
                  type="text"
                  value={newCorrectText}
                  onChange={(e) => setNewCorrectText(e.target.value)}
                  placeholder="Enter the expected answer key or output string..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs shadow-xs"
                />
              </div>
            )}

            {/* Row 5: Explanation */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span>Explanation & Solution Rationale (Optional)</span>
              </label>
              <textarea
                rows={2}
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                placeholder="Explain why the answer is correct. Examinees can review this explanation in their results solution key."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition leading-relaxed"
              />
            </div>

            {/* Row 6: Actions Toolbar */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewQuestionToBank}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Question to Bank</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TWO-COLUMN SPLIT BODY ================= */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar: Topics & Difficulty Breakdown */}
          <div className="w-56 sm:w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/70 dark:bg-slate-900/60 shrink-0 overflow-y-auto">
            {/* Sidebar Topics */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Topics / Domains
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {availableSubjects.length}
                </span>
              </div>

              {/* All Topics button */}
              <button
                onClick={() => {
                  setSelectedTopic('all');
                  setSelectedCourse('all');
                }}
                className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between mb-1 cursor-pointer ${
                  selectedTopic === 'all' && selectedCourse === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <span>All Topics</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedTopic === 'all' && selectedCourse === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {bank.length.toLocaleString()}
                </span>
              </button>

              {/* Core Topics & Subject list */}
              <div className="space-y-0.5">
                {availableSubjects.map((sub) => {
                  const isSelected = selectedTopic.toLowerCase() === sub.name.toLowerCase();
                  return (
                    <div key={sub.name}>
                      <button
                        onClick={() => {
                          setSelectedTopic(sub.name);
                          setSelectedCourse('all');
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{sub.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {sub.count.toLocaleString()}
                        </span>
                      </button>

                      {/* If Aptitude is selected and this is Aptitude, show sub-sections indented */}
                      {sub.name === 'Aptitude' && isSelected && (
                        <div className="pl-3 pr-1 py-1 space-y-1 my-1 border-l-2 border-indigo-400 dark:border-indigo-600 ml-2">
                          {(['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability'] as const).map((sec) => (
                            <button
                              key={sec}
                              onClick={() => setSelectedAptitudeSection(sec === selectedAptitudeSection ? 'all' : sec)}
                              className={`w-full px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center justify-between transition cursor-pointer ${
                                selectedAptitudeSection === sec
                                  ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200 font-bold'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="truncate">
                                {sec === 'Quantitative Aptitude' ? '📐 Quants' : sec === 'Logical Reasoning' ? '🧩 Logical' : '📖 Verbal'}
                              </span>
                              <span className="text-[10px] opacity-75">200</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Difficulty Filter */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Difficulty Level
              </span>
              <div className="space-y-1">
                {[
                  { id: 'all', label: 'All Difficulties', color: 'text-slate-700 dark:text-slate-300', count: difficultyCounts.total },
                  { id: 'easy', label: 'Easy (2 Marks)', color: 'text-emerald-600 dark:text-emerald-400', count: difficultyCounts.easy },
                  { id: 'medium', label: 'Medium (3 Marks)', color: 'text-amber-600 dark:text-amber-400', count: difficultyCounts.medium },
                  { id: 'hard', label: 'Hard (5 Marks)', color: 'text-rose-600 dark:text-rose-400', count: difficultyCounts.hard },
                ].map((diff) => {
                  const isDiffActive = selectedDifficulty === diff.id;
                  return (
                    <button
                      key={diff.id}
                      onClick={() => setSelectedDifficulty(diff.id)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        isDiffActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                          : `${diff.color} hover:bg-slate-200/60 dark:hover:bg-slate-800`
                      }`}
                    >
                      <span>{diff.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isDiffActive
                            ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-900'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        {diff.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900">
            {/* Top Toolbar: Search, Course dropdown, Type, View switcher */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center gap-2.5 text-xs shrink-0">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by keywords, code, concepts..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Course Dropdown */}
              <div className="w-48 sm:w-56">
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setSelectedTopic('all');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium truncate"
                >
                  <option value="all">Filter by Course (All 40 Courses)</option>
                  {CATEGORIZED_COURSES.map((grp) => (
                    <optgroup key={grp.category} label={`📂 ${grp.category}`}>
                      {grp.courses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Type Dropdown */}
              <div className="w-36">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="all">All Types</option>
                  <option value="mcq">Single Correct (MCQ)</option>
                  <option value="find_output">Find Output</option>
                  <option value="multiple_correct">Multiple Correct</option>
                  <option value="true_false">True / False</option>
                  <option value="fill_blanks">Fill Blanks</option>
                  <option value="coding">Coding</option>
                </select>
              </div>

              {/* View Mode Toggle Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  title="Compact List View (high density)"
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    viewMode === 'compact'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Compact</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('expanded')}
                  title="Expanded Cards View"
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    viewMode === 'expanded'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Expanded</span>
                </button>
              </div>

              {/* Expand All / Collapse All button (only in compact view) */}
              {viewMode === 'compact' && paginatedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleExpandAll}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
                >
                  {paginatedQuestions.every((q) => expandedQuestionIds[q.id]) ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">Collapse All</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">Expand All</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Dedicated Aptitude Section Fast-Add Toolbar if Aptitude is selected */}
            {selectedTopic.toLowerCase() === 'aptitude' && (
              <div className="border-b border-amber-200 dark:border-amber-800/80 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 animate-in fade-in shrink-0">
                <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-800 dark:text-amber-200 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Aptitude Sections:</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedAptitudeSection('all')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                          selectedAptitudeSection === 'all'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50'
                        }`}
                      >
                        All (600)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAptitudeSection('Quantitative Aptitude')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          selectedAptitudeSection === 'Quantitative Aptitude'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50'
                        }`}
                      >
                        <span>📐 Quants</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedAptitudeSection === 'Quantitative Aptitude' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'}`}>
                          200
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAptitudeSection('Logical Reasoning')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          selectedAptitudeSection === 'Logical Reasoning'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50'
                        }`}
                      >
                        <span>🧩 Logical</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedAptitudeSection === 'Logical Reasoning' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'}`}>
                          200
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAptitudeSection('Verbal Ability')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          selectedAptitudeSection === 'Verbal Ability'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50'
                        }`}
                      >
                        <span>📖 Verbal</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedAptitudeSection === 'Verbal Ability' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'}`}>
                          200
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowAptitudeMatrix(!showAptitudeMatrix)}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                        showAptitudeMatrix
                          ? 'bg-amber-600 text-white shadow-amber-600/30'
                          : 'bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{showAptitudeMatrix ? 'Hide Custom Matrix' : '📐 Custom Matrix'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePickAptitudeFullMock}
                      className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-600/30 cursor-pointer"
                    >
                      <span>⚡ 10 Quants + 10 Logical + 10 Verbal (30 Mock)</span>
                    </button>
                  </div>
                </div>

                {/* Expandable Matrix Table */}
                {showAptitudeMatrix && (
                  <div className="px-4 pb-3 pt-1 space-y-2">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-amber-300 dark:border-amber-700/80 shadow-md space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200 dark:border-amber-800/60">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                          Configure Questions by Section & Difficulty (Easy / Medium / Hard):
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-400">Presets:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setAptitudeMatrix({
                                quants: { easy: 4, medium: 4, hard: 2 },
                                logical: { easy: 4, medium: 4, hard: 2 },
                                verbal: { easy: 4, medium: 4, hard: 2 },
                              })
                            }
                            className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 text-xs font-bold cursor-pointer"
                          >
                            10 Each (30 Mock)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setAptitudeMatrix({
                                quants: { easy: 2, medium: 2, hard: 1 },
                                logical: { easy: 2, medium: 2, hard: 1 },
                                verbal: { easy: 2, medium: 2, hard: 1 },
                              })
                            }
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                          >
                            5 Each (15 Quick)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setAptitudeMatrix({
                                quants: { easy: 0, medium: 0, hard: 0 },
                                logical: { easy: 0, medium: 0, hard: 0 },
                                verbal: { easy: 0, medium: 0, hard: 0 },
                              })
                            }
                            className="px-2 py-0.5 rounded-md text-slate-400 hover:text-rose-500 text-xs font-bold cursor-pointer"
                          >
                            Clear (0)
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold">
                              <th className="py-1.5 px-3">Section</th>
                              <th className="py-1.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">Easy (2 Marks)</th>
                              <th className="py-1.5 px-3 text-center text-amber-600 dark:text-amber-400 font-bold">Medium (3 Marks)</th>
                              <th className="py-1.5 px-3 text-center text-rose-600 dark:text-rose-400 font-bold">Difficult (5 Marks)</th>
                              <th className="py-1.5 px-3 text-center font-bold">Section Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                            {/* Quants */}
                            <tr>
                              <td className="py-2 px-3">
                                <span className="font-bold text-slate-900 dark:text-white">📐 Quants</span>
                                <span className="text-[10px] text-slate-400 block">200 available</span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={70}
                                  value={aptitudeMatrix.quants.easy}
                                  onChange={(e) =>
                                    setAptitudeMatrix((prev) => ({
                                      ...prev,
                                      quants: { ...prev.quants, easy: Math.max(0, parseInt(e.target.value) || 0) },
                                    }))
                                  }
                                  className="w-14 px-1.5 py-1 text-center font-bold border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={80}
                                  value={aptitudeMatrix.quants.medium}
                                  onChange={(e) =>
                                    setAptitudeMatrix((prev) => ({
                                      ...prev,
                                      quants: { ...prev.quants, medium: Math.max(0, parseInt(e.target.value) || 0) },
                                    }))
                                  }
                                  className="w-14 px-1.5 py-1 text-center font-bold border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={50}
                                  value={aptitudeMatrix.quants.hard}
                                  onChange={(e) =>
                                    setAptitudeMatrix((prev) => ({
                                      ...prev,
                                      quants: { ...prev.quants, hard: Math.max(0, parseInt(e.target.value) || 0) },
                                    }))
                                  }
                                  className="w-14 px-1.5 py-1 text-center font-bold border border-rose-300 dark:border-rose-700 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                                {aptitudeMatrix.quants.easy + aptitudeMatrix.quants.medium + aptitudeMatrix.quants.hard} Qs
                              </td>
                            </tr>
                            {/* Logical */}
                            <tr>
                              <td className="py-2 px-3">
                                <span className="font-bold text-slate-900 dark:text-white">🧩 Logical</span>
                                <span className="text-[10px] text-slate-400 block">200 available</span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={70}
                                  value={aptitudeMatrix.logical.easy}
                                  onChange={(e) =>
                                    setAptitudeMatrix((prev) => ({
                                      ...prev,
                                      logical: { ...prev.logical, easy: Math.max(0, parseInt(e.target.value) || 0) },
                                    }))
                                  }
                                  className="w-14 px-1.5 py-1 text-center font-bold border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={80}
                                  value={aptitudeMatrix.logical.medium}
                                  onChange={(e) =>
                                    setAptitudeMatrix((prev) => ({
                                      ...prev,
                                      logical: { ...prev.logical, medium: Math.max(0, parseInt(e.target.value) || 0) },
                                    }))
                                  }
                                  className="w-14 px-1.5 py-1 text-center font-bold border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={50}
                                  value={aptitudeMatrix.logical.hard}
                                  onChange={(e) =>
                                    setAptitudeMatrix((prev) => ({
                                      ...prev,
                                      logical: { ...prev.logical, hard: Math.max(0, parseInt(e.target.value) || 0) },
                                    }))
                                  }
                                  className="w-14 px-1.5 py-1 text-center font-bold border border-rose-300 dark:border-rose-700 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                                {aptitudeMatrix.logical.easy + aptitudeMatrix.logical.medium + aptitudeMatrix.logical.hard} Qs
                              </td>
                            </tr>
                            {/* Verbal */}
                            <tr>
                              <td className="py-2 px-3">
                                <span className="font-bold text-slate-900 dark:text-white">📖 Verbal</span>
                                <span className="text-[10px] text-slate-400 block">200 available</span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={70}
                                  value={aptitudeMatrix.verbal.easy}
                                  onChange={(e) =>
                                    setAptitudeMatrix((prev) => ({
                                      ...prev,
                                      verbal: { ...prev.verbal, easy: Math.max(0, parseInt(e.target.value) || 0) },
                                    }))
                                  }
                                  className="w-14 px-1.5 py-1 text-center font-bold border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={80}
                                  value={aptitudeMatrix.verbal.medium}
                                  onChange={(e) =>
                                    setAptitudeMatrix((prev) => ({
                                      ...prev,
                                      verbal: { ...prev.verbal, medium: Math.max(0, parseInt(e.target.value) || 0) },
                                    }))
                                  }
                                  className="w-14 px-1.5 py-1 text-center font-bold border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={50}
                                  value={aptitudeMatrix.verbal.hard}
                                  onChange={(e) =>
                                    setAptitudeMatrix((prev) => ({
                                      ...prev,
                                      verbal: { ...prev.verbal, hard: Math.max(0, parseInt(e.target.value) || 0) },
                                    }))
                                  }
                                  className="w-14 px-1.5 py-1 text-center font-bold border border-rose-300 dark:border-rose-700 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                                {aptitudeMatrix.verbal.easy + aptitudeMatrix.verbal.medium + aptitudeMatrix.verbal.hard} Qs
                              </td>
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-100/70 dark:bg-slate-700/60 font-bold border-t border-slate-200 dark:border-slate-700">
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">Total</td>
                              <td className="py-2 px-3 text-center text-emerald-700 dark:text-emerald-400">
                                {aptitudeMatrix.quants.easy + aptitudeMatrix.logical.easy + aptitudeMatrix.verbal.easy} Easy
                              </td>
                              <td className="py-2 px-3 text-center text-amber-700 dark:text-amber-400">
                                {aptitudeMatrix.quants.medium + aptitudeMatrix.logical.medium + aptitudeMatrix.verbal.medium} Medium
                              </td>
                              <td className="py-2 px-3 text-center text-rose-700 dark:text-rose-400">
                                {aptitudeMatrix.quants.hard + aptitudeMatrix.logical.hard + aptitudeMatrix.verbal.hard} Hard
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-black text-xs">
                                  {aptitudeMatrix.quants.easy +
                                    aptitudeMatrix.quants.medium +
                                    aptitudeMatrix.quants.hard +
                                    aptitudeMatrix.logical.easy +
                                    aptitudeMatrix.logical.medium +
                                    aptitudeMatrix.logical.hard +
                                    aptitudeMatrix.verbal.easy +
                                    aptitudeMatrix.verbal.medium +
                                    aptitudeMatrix.verbal.hard}{' '}
                                  Total
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handlePickCustomAptitude}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            Select{' '}
                            {aptitudeMatrix.quants.easy +
                              aptitudeMatrix.quants.medium +
                              aptitudeMatrix.quants.hard +
                              aptitudeMatrix.logical.easy +
                              aptitudeMatrix.logical.medium +
                              aptitudeMatrix.logical.hard +
                              aptitudeMatrix.verbal.easy +
                              aptitudeMatrix.verbal.medium +
                              aptitudeMatrix.verbal.hard}{' '}
                            Questions Matching Matrix
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bulk Action & Quick Select Bar */}
            <div className="px-4 py-2 bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  Showing {(currentPage - 1) * pageSize + 1} -{' '}
                  {Math.min(currentPage * pageSize, filteredQuestions.length)} of{' '}
                  {filteredQuestions.length.toLocaleString()} Questions
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-emerald-600 font-bold">Easy: {difficultyCounts.easy}</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-amber-600 font-bold">Med: {difficultyCounts.medium}</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-rose-600 font-bold">Hard: {difficultyCounts.hard}</span>
              </div>

              {/* Quick Selection Shortcuts */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-semibold mr-1">Quick Select:</span>
                {/* Manual Count Selector */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg p-0.5 shadow-xs">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 px-1.5">Count:</span>
                  <input
                    type="number"
                    min={1}
                    max={filteredQuestions.length || 100}
                    value={manualPickCount}
                    onChange={(e) => setManualPickCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 px-1 py-0.5 text-xs font-bold text-center border border-purple-200 dark:border-purple-700 rounded bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handlePickRandomN(manualPickCount)}
                    className="ml-1 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>+ Add {manualPickCount} Random</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {[5, 10, 25].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setManualPickCount(num);
                        handlePickRandomN(num);
                      }}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer text-xs"
                    >
                      +{num}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSelectPage}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 transition cursor-pointer text-xs"
                >
                  Select Page ({paginatedQuestions.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (filteredQuestions.length > 200) {
                      if (
                        !window.confirm(
                          `You are about to select ${filteredQuestions.length} questions. Selecting a very large batch may impact performance. Do you want to proceed?`
                        )
                      ) {
                        return;
                      }
                    }
                    handleSelectAllFiltered();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition cursor-pointer text-xs"
                >
                  Select All ({filteredQuestions.length})
                </button>

                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold transition cursor-pointer text-xs"
                  >
                    Clear ({selectedCount})
                  </button>
                )}
              </div>
            </div>

            {/* Questions Feed (Compact vs Expanded) */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1 bg-slate-50/30 dark:bg-slate-900/30">
              {paginatedQuestions.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                  <HelpCircle className="w-10 h-10 mx-auto text-slate-400" />
                  <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                    No questions found matching your filter criteria.
                  </p>
                  <p className="text-slate-400">
                    Try selecting "All Topics" or clearing the search query.
                  </p>
                  <button
                    onClick={handleResetSeedBank}
                    className="mt-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition cursor-pointer"
                  >
                    Reset Filters & Question Bank
                  </button>
                </div>
              ) : (
                paginatedQuestions.map((q) => {
                  const isSelected = Boolean(selectedIds[q.id]);
                  const isExpanded = Boolean(expandedQuestionIds[q.id]);

                  // Compact View Row
                  if (viewMode === 'compact') {
                    return (
                      <div
                        key={q.id}
                        className={`rounded-xl border transition ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {/* Compact Row Header */}
                        <div className="p-2.5 sm:p-3 flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(q.id)}
                            className="w-4 h-4 rounded text-indigo-600 cursor-pointer shrink-0"
                          />

                          <span className="font-mono text-[10px] text-slate-400 font-bold shrink-0 hidden sm:inline">
                            #{q.id}
                          </span>

                          <span className="font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] shrink-0">
                            {q.subtopic ? `${q.topic} • ${q.subtopic}` : q.topic || 'General'}
                          </span>

                          <span className="font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] shrink-0 hidden md:inline">
                            {q.type.replace('_', ' ')}
                          </span>

                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded capitalize shrink-0 ${
                              q.difficulty === 'easy'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : q.difficulty === 'medium'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                            }`}
                          >
                            {q.difficulty}
                          </span>

                          <span className="text-slate-400 font-bold text-[10px] shrink-0">
                            +{q.marks}M
                          </span>

                          {/* Question prompt (clickable to toggle preview) */}
                          <div
                            onClick={() => toggleExpandQuestion(q.id)}
                            className="flex-1 font-semibold text-xs text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:text-indigo-600 transition"
                            title={q.question_text?.replace(/\s*\([Vv]ariation\s*\d+\)/gi, '')}
                          >
                            {q.question_text?.replace(/\s*\([Vv]ariation\s*\d+\)/gi, '')}
                          </div>

                          {q.id.startsWith('qb-custom-') && (
                            <button
                              onClick={() => handleDelete(q.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded transition shrink-0"
                              title="Delete custom question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleExpandQuestion(q.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition shrink-0 cursor-pointer"
                            title={isExpanded ? 'Collapse options' : 'Expand options'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Expandable Options & Explanation preview */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs bg-slate-50/50 dark:bg-slate-900/30 animate-in fade-in">
                            {/* Code Snippet */}
                            {q.code_snippet && (
                              <pre className="p-2.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                                {q.code_snippet}
                              </pre>
                            )}

                            {/* Options */}
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                {q.options.map((opt, oIdx) => {
                                  const isCorrect =
                                    Array.isArray(q.correct_answer)
                                      ? q.correct_answer.includes(oIdx)
                                      : q.correct_answer === oIdx || String(q.correct_answer).trim().toLowerCase() === opt.trim().toLowerCase();
                                  return (
                                    <div
                                      key={oIdx}
                                      className={`p-2 rounded-lg border flex items-center gap-2 ${
                                        isCorrect
                                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                                          : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      <span
                                        className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${
                                          isCorrect
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}
                                      >
                                        {isCorrect ? '✓' : String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span className="flex-1">{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Fill Blanks Expected Value */}
                            {q.type === 'fill_blanks' && (
                              <div className="p-2 rounded-lg border bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold text-[11px] inline-flex items-center gap-2">
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">Correct Blank Value:</span>
                                <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold">
                                  {String(q.correct_answer)}
                                </span>
                              </div>
                            )}

                            {/* Coding Solution Preview */}
                            {q.type === 'coding' && (
                              <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                                <div className="flex items-center justify-between text-emerald-400 font-bold">
                                  <span>Solution / Verification Target:</span>
                                  <span className="uppercase font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300">{q.coding_language || 'code'}</span>
                                </div>
                                <pre className="font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                                  {String(q.correct_answer)}
                                </pre>
                              </div>
                            )}

                            {/* Explanation */}
                            {q.explanation && (
                              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-1.5">
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-600" />
                                <div>
                                  <strong className="font-bold">Explanation:</strong> {q.explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Expanded Full Card View
                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border transition flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(q.id)}
                        className="mt-1 w-4 h-4 rounded text-indigo-600 cursor-pointer shrink-0"
                      />

                      <div className="flex-1 space-y-2 text-xs">
                        {/* Meta Header */}
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] text-slate-400 font-bold">
                              #{q.id}
                            </span>
                            <span className="font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px]">
                              {q.subtopic ? `${q.topic} • ${q.subtopic}` : q.topic || 'General'}
                            </span>
                            <span className="font-bold uppercase px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">
                              {q.type.replace('_', ' ')}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md capitalize ${
                                q.difficulty === 'easy'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                                  : q.difficulty === 'medium'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                              }`}
                            >
                              {q.difficulty}
                            </span>
                            <span className="text-slate-400 font-bold">
                              &bull; +{q.marks} Marks {q.negative_marks ? `(-${q.negative_marks})` : ''}
                            </span>
                          </div>

                          {q.id.startsWith('qb-custom-') && (
                            <button
                              onClick={() => handleDelete(q.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                              title="Delete custom question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Question Prompt */}
                        <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                          {q.question_text?.replace(/\s*\([Vv]ariation\s*\d+\)/gi, '')}
                        </p>

                        {/* Code Snippet */}
                        {q.code_snippet && (
                          <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                            {q.code_snippet}
                          </pre>
                        )}

                        {/* Options Preview */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect =
                                Array.isArray(q.correct_answer)
                                  ? q.correct_answer.includes(oIdx)
                                  : q.correct_answer === oIdx || String(q.correct_answer).trim().toLowerCase() === opt.trim().toLowerCase();
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2 rounded-lg border flex items-center gap-2 ${
                                    isCorrect
                                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                                      : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}
                                  >
                                    {isCorrect ? '✓' : String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Fill Blanks Expected Value */}
                        {q.type === 'fill_blanks' && (
                          <div className="p-2.5 rounded-xl border bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold text-xs inline-flex items-center gap-2">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">Correct Blank Value:</span>
                            <span className="font-mono bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold">
                              {String(q.correct_answer)}
                            </span>
                          </div>
                        )}

                        {/* Coding Solution Preview */}
                        {q.type === 'coding' && (
                          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                            <div className="flex items-center justify-between text-emerald-400 font-bold">
                              <span>Solution / Reference Implementation:</span>
                              <span className="uppercase font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300">{q.coding_language || 'code'}</span>
                            </div>
                            <pre className="font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                              {String(q.correct_answer)}
                            </pre>
                          </div>
                        )}

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-600" />
                            <div>
                              <strong className="font-bold">Explanation:</strong> {q.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination & Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Pagination Controls */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <span className="text-slate-400 mx-1">|</span>

                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <span className="text-xs font-bold text-slate-500">
                  {selectedCount} Selected
                </span>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    {isInline ? 'Back to Assessments' : 'Close'}
                  </button>
                )}

                {onSelectQuestions && (
                  <button
                    disabled={selectedCount === 0}
                    onClick={handleConfirmImport}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Add Selected Questions ({selectedCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
  );

  if (typeof document === 'undefined') return null;

  if (isInline && !isFullScreen) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-140px)] min-h-[640px] font-['Plus_Jakarta_Sans',sans-serif]">
        {modalInnerContent}

        {/* Random Question Generator Sub-Modal */}
        {showRandomGen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-purple-500" />
                  <span>Random Question Generator</span>
                </h4>
                <button
                  onClick={() => setShowRandomGen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Select questions randomly from the 7,400+ question bank filtered by course, topic, and difficulty.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Number of Questions to Select
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[5, 10, 20, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGenCount(num)}
                        className={`py-2 rounded-xl font-bold border transition ${
                          genCount === num
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-semibold text-xs">Custom count:</span>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={genCount}
                      onChange={(e) => setGenCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-2.5 py-1 text-xs font-bold text-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRandomGen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRunRandomGen}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Generate & Select ({genCount})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Question Confirmation Modal (WhatsApp Style) */}
        <ActionConfirmModal
          isOpen={Boolean(deleteQuestionTarget)}
          onClose={() => setDeleteQuestionTarget(null)}
          title="Delete question?"
          description="Are you sure you want to delete this question from Central Question Bank? It will no longer be available for new assessments."
          type="delete"
          options={[
            {
              label: 'Delete question',
              variant: 'danger',
              onClick: () => {
                if (deleteQuestionTarget) {
                  examService.deleteQuestionFromBank(deleteQuestionTarget);
                  setBank(examService.getQuestionBank());
                  setDeleteQuestionTarget(null);
                }
              },
            },
          ]}
          cancelText="Cancel"
        />
      </div>
    );
  }

  return createPortal(
    <>
      {isFullScreen ? (
        <div className="fixed inset-0 z-[99999] w-screen h-screen bg-white dark:bg-slate-900 flex flex-col overflow-hidden m-0 p-0 rounded-none border-none font-['Plus_Jakarta_Sans',sans-serif]">
          {modalInnerContent}
        </div>
      ) : (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="bg-white dark:bg-slate-900 flex flex-col overflow-hidden rounded-3xl max-w-7xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl h-[95vh]">
            {modalInnerContent}
          </div>
        </div>
      )}

      {/* Random Question Generator Sub-Modal */}
      {showRandomGen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-purple-500" />
                <span>Random Question Generator</span>
              </h4>
              <button
                onClick={() => setShowRandomGen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select questions randomly from the 6,800+ question bank filtered by course, topic, and difficulty.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Course
                </label>
                <select
                  value={genCourse}
                  onChange={(e) => setGenCourse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">Any Course (All 40 Courses)</option>
                  {CATEGORIZED_COURSES.map((grp) => (
                    <optgroup key={grp.category} label={`📂 ${grp.category}`}>
                      {grp.courses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic
                </label>
                <select
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="all">Any Topic</option>
                  {coreTopics.map((ct) => (
                    <option key={ct.name} value={ct.name}>
                      {ct.name} ({ct.count} Questions)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">Any Difficulty</option>
                  <option value="easy">Easy (2 Marks)</option>
                  <option value="medium">Medium (3 Marks)</option>
                  <option value="hard">Difficult (5 Marks)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Number of Questions to Select
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[5, 10, 20, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGenCount(num)}
                      className={`py-2 rounded-xl font-bold border transition ${
                        genCount === num
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold text-xs">Custom count:</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={genCount}
                    onChange={(e) => setGenCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-2.5 py-1 text-xs font-bold text-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRandomGen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunRandomGen}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Generate & Select ({genCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Question Confirmation Modal (WhatsApp Style) */}
      <ActionConfirmModal
        isOpen={Boolean(deleteQuestionTarget)}
        onClose={() => setDeleteQuestionTarget(null)}
        title="Delete question?"
        description="Are you sure you want to delete this question from Central Question Bank? It will no longer be available for new assessments."
        type="delete"
        options={[
          {
            label: 'Delete question',
            variant: 'danger',
            onClick: () => {
              if (deleteQuestionTarget) {
                examService.deleteQuestionFromBank(deleteQuestionTarget);
                setBank(examService.getQuestionBank());
                setDeleteQuestionTarget(null);
              }
            },
          },
        ]}
        cancelText="Cancel"
      />
    </>,
    document.body
  );
};
