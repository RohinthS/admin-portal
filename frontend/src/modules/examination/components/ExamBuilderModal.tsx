import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  AssessmentConfig,
  ExamQuestion,
  QuestionType,
  QuestionDifficulty,
  CreditTier,
  PublishingMode,
  TestCategory,
} from '../types';
import {
  examService,
  DEFAULT_CREDIT_TIERS,
  calculateTiersFromPool,
  CATEGORIZED_COURSES,
} from '../services/examService';
import { creditService } from '../../../services/creditService';
import {
  Sparkles,
  Plus,
  Trash2,
  Download,
  Upload,
  Clock,
  KeyRound,
  Calendar,
  Layers,
  Award,
  ShieldAlert,
  Code,
  CheckCircle2,
  X,
  FileSpreadsheet,
  FileText,
  Loader2,
  Shuffle,
  BookOpen,
  HelpCircle,
  FileUp,
  Copy,
  Radio,
  Lock,
  Search,
  Maximize2,
} from 'lucide-react';
import { QuestionBankModal } from './QuestionBankModal';

interface ExamBuilderModalProps {
  initialConfig?: AssessmentConfig | null;
  onClose: () => void;
  onSave: (config: AssessmentConfig) => void;
}

export const ExamBuilderModal: React.FC<ExamBuilderModalProps> = ({
  initialConfig,
  onClose,
  onSave,
}) => {
  // Available Credit Categories from creditService
  const dynamicCategories = creditService.getDynamicCategories();
  const flatCreditItems = creditService.getAllCreditItems();

  // Helper to fetch current configured credits from Credit Management
  const getLinkedCreditItem = (catId: string) => {
    const found = creditService.getCreditItemById(catId);
    if (found) return found;
    if (catId === 'fourth_month_test') {
      return {
        id: 'fourth_month_test',
        title: '4th Month Overall Test Credits',
        credits: 50,
        categoryGroup: 'Academics & Tests',
        thresholdValue: 65,
      };
    }
    return {
      id: 'monthly_test',
      title: 'Monthly Internal Test Credits',
      credits: 15,
      categoryGroup: 'Academics & Tests',
      thresholdValue: 60,
    };
  };

  const initialCat = initialConfig?.category || 'internal';
  const initialMonth = initialConfig?.month_number ?? (initialCat === 'overall' ? 4 : 1);
  const initialCreditId = initialConfig?.credit_category_id || (initialCat === 'overall' ? 'fourth_month_test' : initialCat === 'aptitude' || initialCat === 'practice' ? 'practice_test' : `month_${initialMonth}_test`);
  const initialItem = getLinkedCreditItem(initialCreditId);
  const initialPassPct = initialConfig?.passing_percentage ?? (initialItem.thresholdValue ?? (initialCat === 'overall' ? 65 : 60));

  // Basic Info
  const [title, setTitle] = useState(initialConfig?.title || '');
  const [description, setDescription] = useState(initialConfig?.description || '');
  const [courseName, setCourseName] = useState(initialConfig?.course_name || 'All Courses (Global Assessment)');
  const [batch, setBatch] = useState(initialConfig?.batch || 'All Batches (Global - All Students)');
  const [category, setCategory] = useState<TestCategory>(initialCat);
  const [monthNumber, setMonthNumber] = useState<number>(initialMonth);
  const [creditCategoryId, setCreditCategoryId] = useState(initialCreditId);
  const [durationMinutes, setDurationMinutes] = useState(initialConfig?.duration_minutes || 30);
  const [passingPercentage, setPassingPercentage] = useState(initialPassPct);
  const [negativeMarking, setNegativeMarking] = useState(initialConfig?.negative_marking_per_question || 0);

  // Pool Credits State (defaulted from Credit Mgmt, editable per test)
  const [customPoolCredits, setCustomPoolCredits] = useState<number>(() => {
    if (initialConfig?.credit_tiers?.[0]?.credits !== undefined) {
      return initialConfig.credit_tiers[0].credits;
    }
    return initialCat === 'practice' || initialCat === 'aptitude' ? 0 : initialItem.credits;
  });

  // Security & Publishing
  const [publishingMode, setPublishingMode] = useState<PublishingMode>(initialConfig?.publishing_mode || 'instant');
  const [secretKey, setSecretKey] = useState(initialConfig?.secret_key || `PIN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [pinExpiryOption, setPinExpiryOption] = useState<'2hours' | 'today' | '48hours' | 'none'>('2hours');
  const [isSecretKeyRequired, setIsSecretKeyRequired] = useState(
    initialConfig?.is_secret_key_required !== undefined ? initialConfig.is_secret_key_required : (initialConfig?.publishing_mode === 'pin_protected'),
  );
  const [startDate, setStartDate] = useState(
    initialConfig?.start_date ? initialConfig.start_date.substring(0, 16) : new Date().toISOString().substring(0, 16),
  );
  const [endDate, setEndDate] = useState(
    initialConfig?.end_date
      ? initialConfig.end_date.substring(0, 16)
      : new Date(Date.now() + 86400000 * 7).toISOString().substring(0, 16),
  );
  const [resultReleaseDate, setResultReleaseDate] = useState(
    initialConfig?.result_release_date
      ? initialConfig.result_release_date.substring(0, 16)
      : new Date(Date.now() + 86400000 * 8).toISOString().substring(0, 16),
  );
  const [maxAttempts, setMaxAttempts] = useState(initialConfig?.max_attempts || (initialCat === 'practice' ? 10 : 1));
  const [maxViolations, setMaxViolations] = useState(initialConfig?.max_violations || 3);
  const [shuffleQuestions, setShuffleQuestions] = useState(initialConfig?.shuffle_questions ?? true);
  const [shuffleOptions, setShuffleOptions] = useState(initialConfig?.shuffle_options ?? true);
  const [resultVisibility, setResultVisibility] = useState<'immediate' | 'scheduled'>(
    initialConfig?.result_visibility || 'immediate',
  );

  // Configurable Tiered Credit Rubric - calculated dynamically from Credit Management pool!
  const [creditTiers, setCreditTiers] = useState<CreditTier[]>(() => {
    if (initialConfig?.credit_tiers && initialConfig.credit_tiers.length > 0) {
      return initialConfig.credit_tiers;
    }
    const pool = initialCat === 'practice' || initialCat === 'aptitude' ? 0 : initialItem.credits;
    return calculateTiersFromPool(pool, initialPassPct);
  });

  // Handler for switching test & credit category with automatic tier recalibration from Credit Management
  const handleTestCategorySelect = (selectedId: string) => {
    if (selectedId === 'aptitude') {
      setCategory('aptitude');
      setCreditCategoryId('practice_test');
      setMaxAttempts(1);
      setPassingPercentage(60);
      setCustomPoolCredits(0);
      setCreditTiers(calculateTiersFromPool(0, 60));
      setQuestionTab('aptitude_matrix');
    } else if (selectedId === 'practice' || selectedId === 'practice_test') {
      setCategory('practice');
      setCreditCategoryId('practice_test');
      setMaxAttempts(10);
      setCustomPoolCredits(0);
      setCreditTiers(calculateTiersFromPool(0, 50));
    } else if (selectedId === 'overall' || selectedId === 'fourth_month_test' || selectedId === 'month_4_test') {
      setCategory('overall');
      setMonthNumber(4);
      setCreditCategoryId('fourth_month_test');
      setMaxAttempts(1);
      const item = getLinkedCreditItem('fourth_month_test');
      const threshold = item.thresholdValue ?? 65;
      setPassingPercentage(threshold);
      setCustomPoolCredits(item.credits);
      setCreditTiers(calculateTiersFromPool(item.credits, threshold));
    } else {
      const match = selectedId.match(/month_(\d+)_test/);
      const mNum = match ? parseInt(match[1], 10) : monthNumber || 1;
      setCategory(mNum === 4 ? 'overall' : 'internal');
      setMonthNumber(mNum);
      const targetId = mNum === 4 ? 'fourth_month_test' : `month_${mNum}_test`;
      setCreditCategoryId(targetId);
      setMaxAttempts(1);
      const item = getLinkedCreditItem(targetId);
      const threshold = item.thresholdValue ?? (mNum === 4 ? 65 : 60);
      setPassingPercentage(threshold);
      setCustomPoolCredits(item.credits);
      setCreditTiers(calculateTiersFromPool(item.credits, threshold));
    }
  };

  const handlePoolCreditsChange = (newPool: number) => {
    const val = Math.max(0, newPool);
    setCustomPoolCredits(val);
    setCreditTiers(calculateTiersFromPool(val, passingPercentage));
  };

  const handleCategoryChange = (newCat: TestCategory) => handleTestCategorySelect(newCat);
  const handleCreditCategoryChange = (newCatId: string) => handleTestCategorySelect(newCatId);

  // Questions State
  const [questions, setQuestions] = useState<ExamQuestion[]>(initialConfig?.questions || []);
  const [questionTab, setQuestionTab] = useState<'interactive' | 'excel_upload' | 'bank' | 'aptitude_matrix'>(
    initialCat === 'aptitude' ? 'aptitude_matrix' : 'excel_upload'
  );
  const [customRandomCount, setCustomRandomCount] = useState<number>(10);
  const [aptitudeMatrix, setAptitudeMatrix] = useState({
    quants: { easy: 4, medium: 4, hard: 2 },
    logical: { easy: 4, medium: 4, hard: 2 },
    verbal: { easy: 4, medium: 4, hard: 2 },
  });

  // Excel / CSV File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ExamQuestion[]>([]);
  const [csvTextMode, setCsvTextMode] = useState(false);
  const [csvInput, setCsvInput] = useState('');

  // Interactive Question Form State
  const [newQType, setNewQType] = useState<QuestionType>('mcq');
  const [newQText, setNewQText] = useState('');
  const [newQMarks, setNewQMarks] = useState(5);
  const [newQTopic, setNewQTopic] = useState('Python Core');
  const [newQDifficulty, setNewQDifficulty] = useState<QuestionDifficulty>('medium');
  const [newQExplanation, setNewQExplanation] = useState('');
  const [newQCodeSnippet, setNewQCodeSnippet] = useState('');
  const [newQOptions, setNewQOptions] = useState<string[]>(['', '', '', '']);
  const [newQCorrectSingle, setNewQCorrectSingle] = useState(0);
  const [newQCorrectMultiple, setNewQCorrectMultiple] = useState<number[]>([0]);
  const [newQCorrectText, setNewQCorrectText] = useState('');

  // Question Bank Picker State
  const [showFullScreenBankModal, setShowFullScreenBankModal] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<ExamQuestion[]>(() => examService.getQuestionBank());

  useEffect(() => {
    setBankQuestions(examService.getQuestionBank());
  }, []);
  const [bankSearch, setBankSearch] = useState('');
  const [bankTopic, setBankTopic] = useState('all');
  const [bankDifficulty, setBankDifficulty] = useState('all');
  const [selectedBankIds, setSelectedBankIds] = useState<Record<string, boolean>>({});

  // Multi-Subject Question Bank Selector State
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>({});
  const [subjectQuestionCounts, setSubjectQuestionCounts] = useState<Record<string, number>>({});

  // Extract all available subjects/topics with question counts
  const availableSubjects = useMemo(() => {
    const topicMap: Record<string, number> = {};
    bankQuestions.forEach((q) => {
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
  }, [bankQuestions]);

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

  // 1. Document & Excel File Upload Handler (.xlsx, .xls, .csv, .docx, .doc, .pdf)
  const [isParsingDoc, setIsParsingDoc] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setUploadError('');
    setParsedPreview([]);
    setIsParsingDoc(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const ext = file.name.split('.').pop()?.toLowerCase();
        let parsed: ExamQuestion[] = [];

        if (ext === 'docx' || ext === 'doc') {
          parsed = await examService.parseQuestionsFromDocxBuffer(buffer);
        } else if (ext === 'pdf') {
          parsed = await examService.parseQuestionsFromPdfBuffer(buffer);
        } else {
          // Excel / CSV
          parsed = examService.parseQuestionsFromExcelBuffer(buffer);
        }

        if (parsed.length === 0) {
          setUploadError(`No valid questions could be detected in "${file.name}". Please ensure questions are numbered (e.g. 1. or Q1:) with options A), B), C), D) and Answer: A, or check the template.`);
          setIsParsingDoc(false);
          return;
        }
        setParsedPreview(parsed);
      } catch (err: any) {
        setUploadError(`Failed to parse file: ${err.message || 'Invalid or unreadable document format'}`);
      } finally {
        setIsParsingDoc(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file from disk.');
      setIsParsingDoc(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmDocumentImport = () => {
    if (parsedPreview.length === 0) return;
    setQuestions((prev) => [...prev, ...parsedPreview]);
    alert(`Successfully imported ${parsedPreview.length} questions from ${uploadFileName}!`);
    setParsedPreview([]);
    setUploadFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // CSV Text paste parse
  const handleParseCsvText = () => {
    try {
      setUploadError('');
      if (!csvInput.trim()) {
        setUploadError('Please paste valid CSV contents');
        return;
      }
      const parsed = examService.parseQuestionsFromCsv(csvInput);
      if (parsed.length === 0) {
        setUploadError('No valid questions could be parsed from text.');
        return;
      }
      setQuestions((prev) => [...prev, ...parsed]);
      setCsvInput('');
      setCsvTextMode(false);
      alert(`Imported ${parsed.length} questions!`);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse CSV');
    }
  };

  // Download official Excel Template (.xlsx)
  const handleDownloadExcelTemplate = () => {
    examService.generateExcelWorkbook();
  };

  // Download official Word Docx Template (.docx)
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);
  const handleDownloadWordTemplate = async () => {
    try {
      setIsDownloadingWord(true);
      await examService.generateWordDocxTemplate();
    } catch (err: any) {
      alert(`Failed to generate Word template: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDownloadingWord(false);
    }
  };

  // 2. Interactive Add Question
  const handleAddInteractiveQuestion = () => {
    if (!newQText.trim()) {
      alert('Please enter the question prompt');
      return;
    }

    let correctAnswer: any = newQCorrectSingle;
    let cleanOptions = newQOptions.map((o) => o.trim()).filter((o) => o.length > 0);

    if (newQType === 'multiple_correct') {
      correctAnswer = newQCorrectMultiple;
    } else if (newQType === 'true_false') {
      cleanOptions = ['True', 'False'];
      correctAnswer = newQCorrectSingle;
    } else if (newQType === 'fill_blanks' || newQType === 'short_answer' || newQType === 'coding') {
      correctAnswer = newQCorrectText.trim();
    }

    const created: ExamQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: newQType,
      question_text: newQText,
      options: cleanOptions.length > 0 ? cleanOptions : undefined,
      correct_answer: correctAnswer,
      marks: newQMarks,
      negative_marks: negativeMarking,
      code_snippet: newQCodeSnippet.trim() ? newQCodeSnippet : undefined,
      topic: newQTopic,
      difficulty: newQDifficulty,
      explanation: newQExplanation,
    };

    setQuestions((prev) => [...prev, created]);
    setNewQText('');
    setNewQCodeSnippet('');
    setNewQExplanation('');
    setNewQCorrectText('');
    setNewQOptions(['', '', '', '']);
  };

  // 3. Question Bank Picker
  const filteredBank = bankQuestions.filter((q) => {
    const matchesSearch =
      q.question_text.toLowerCase().includes(bankSearch.toLowerCase()) ||
      (q.topic || '').toLowerCase().includes(bankSearch.toLowerCase());
    const matchesTopic = bankTopic === 'all' || q.topic === bankTopic;
    const matchesDiff = bankDifficulty === 'all' || q.difficulty === bankDifficulty;
    return matchesSearch && matchesTopic && matchesDiff;
  });

  const handleInsertSelectedFromBank = () => {
    const chosen = bankQuestions.filter((q) => selectedBankIds[q.id]);
    if (chosen.length === 0) return;
    const cleaned = chosen.map((q) => ({
      ...q,
      question_text: q.question_text?.replace(/\s*\([Vv]ariation\s*\d+\)/gi, '').trim(),
    }));
    setQuestions((prev) => [...prev, ...cleaned]);
    setSelectedBankIds({});
    alert(`Added ${chosen.length} questions from Question Bank to this exam!`);
  };

  const handleRandomFromBank = (count = 5) => {
    const randoms = examService.getRandomQuestionsFromBank({
      count,
      topic: bankTopic !== 'all' ? bankTopic : undefined,
      difficulty: bankDifficulty !== 'all' ? bankDifficulty : undefined,
    });
    setQuestions((prev) => [...prev, ...randoms]);
    alert(`Added ${randoms.length} random questions from Question Bank!`);
  };

  const handleAddAptitudeSection = (subtopic: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability', count = 10) => {
    const randoms = examService.getRandomQuestionsFromBank({
      count,
      topic: 'Aptitude',
      subtopic,
      difficulty: bankDifficulty !== 'all' ? bankDifficulty : undefined,
    });
    setQuestions((prev) => [...prev, ...randoms]);
    alert(`Added ${randoms.length} questions from ${subtopic} to this assessment!`);
  };

  const handleAddAptitudeFullMock = () => {
    const qQuants = examService.getRandomQuestionsFromBank({ count: 10, topic: 'Aptitude', subtopic: 'Quantitative Aptitude' });
    const qLogical = examService.getRandomQuestionsFromBank({ count: 10, topic: 'Aptitude', subtopic: 'Logical Reasoning' });
    const qVerbal = examService.getRandomQuestionsFromBank({ count: 10, topic: 'Aptitude', subtopic: 'Verbal Ability' });
    const total30 = [...qQuants, ...qLogical, ...qVerbal];
    setQuestions((prev) => [...prev, ...total30]);
    alert(`Added 30 questions (10 Quants + 10 Logical + 10 Verbal) to this assessment!`);
  };

  const handleAddCustomAptitude = () => {
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

    const added: ExamQuestion[] = [];
    const existingIds = new Set(questions.map((q) => q.id));

    specs.forEach((s) => {
      if (s.count > 0) {
        const picked = examService.getRandomQuestionsFromBank({
          topic: 'Aptitude',
          subtopic: s.subtopic,
          difficulty: s.diff,
          count: s.count,
        });
        picked.forEach((q) => {
          if (!existingIds.has(q.id)) {
            existingIds.add(q.id);
            added.push(q);
          } else {
            added.push(q);
          }
        });
      }
    });

    if (added.length === 0) {
      alert('Please specify at least 1 question in the matrix to add.');
      return;
    }

    setQuestions((prev) => [...prev, ...added]);
    alert(`Added ${added.length} Aptitude questions matching your exact Quants, Logical, and Verbal distribution!`);
  };

  // Multi-Subject Question Handlers
  const handleToggleSubject = (subjectName: string) => {
    setSelectedSubjects((prev) => {
      const isCurrentlySelected = !!prev[subjectName];
      const next = { ...prev, [subjectName]: !isCurrentlySelected };
      if (!isCurrentlySelected && !subjectQuestionCounts[subjectName]) {
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

  const handleAddSelectedSubjectsQuestions = () => {
    const activeSubjects = availableSubjects.filter((s) => selectedSubjects[s.name]);
    if (activeSubjects.length === 0) {
      alert('Please check at least one subject to add questions.');
      return;
    }

    const existingIds = new Set(questions.map((q) => q.id));
    const addedList: ExamQuestion[] = [];
    const report: string[] = [];

    activeSubjects.forEach((sub) => {
      const targetCount = subjectQuestionCounts[sub.name] || 5;
      const pool = bankQuestions.filter(
        (q) => (q.topic || 'General').toLowerCase() === sub.name.toLowerCase()
      );

      // Prefer questions not yet added to exam
      const unpicked = pool.filter((q) => !existingIds.has(q.id));
      const candidates = unpicked.length >= targetCount ? unpicked : pool;

      // Random shuffle
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, targetCount);

      chosen.forEach((q) => {
        existingIds.add(q.id);
        addedList.push({
          ...q,
          question_text: q.question_text?.replace(/\s*\([Vv]ariation\s*\d+\)/gi, '').trim(),
        });
      });

      report.push(`${sub.name}: ${chosen.length}`);
    });

    if (addedList.length === 0) {
      alert('No questions could be added.');
      return;
    }

    setQuestions((prev) => [...prev, ...addedList]);
    alert(
      `✅ Added ${addedList.length} questions across ${activeSubjects.length} subjects to the exam!\n\n${report.join(', ')}`
    );
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Final Save Handler
  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter an assessment title');
      return;
    }
    if (questions.length === 0) {
      alert('Please add at least one question to the assessment (via Excel, Question Bank, or Manual)');
      return;
    }

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const config: AssessmentConfig = {
      id: initialConfig?.id || `exam-${Date.now()}`,
      title,
      description,
      course_id: `course-${courseName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      course_name: courseName,
      batch,
      category,
      month_number: Number(monthNumber) || 1,
      credit_category_id: creditCategoryId,
      duration_minutes: Number(durationMinutes),
      passing_percentage: Number(passingPercentage),
      negative_marking_per_question: Number(negativeMarking),
      total_marks: totalMarks,
      total_questions: questions.length,
      credit_tiers: creditTiers,
      publishing_mode: publishingMode,
      secret_key: publishingMode === 'pin_protected' ? secretKey : undefined,
      is_secret_key_required: publishingMode === 'pin_protected',
      start_date: publishingMode === 'scheduled' ? new Date(startDate).toISOString() : new Date().toISOString(),
      end_date: publishingMode === 'scheduled' ? new Date(endDate).toISOString() : new Date(Date.now() + 86400000 * 30).toISOString(),
      result_release_date: resultVisibility === 'scheduled' ? new Date(resultReleaseDate).toISOString() : undefined,
      shuffle_questions: shuffleQuestions,
      shuffle_options: shuffleOptions,
      auto_submit_on_timeout: true,
      max_attempts: Number(maxAttempts),
      max_violations: Number(maxViolations),
      result_visibility: resultVisibility,
      is_answer_key_released:
        resultVisibility === 'immediate'
          ? true
          : initialConfig?.is_answer_key_released !== undefined
          ? initialConfig.is_answer_key_released
          : false,
      is_retake_allowed: category === 'practice',
      created_by: 'Administrator / Mentor',
      creator_role: 'admin',
      created_at: initialConfig?.created_at || new Date().toISOString(),
      status: 'published',
      questions,
    };

    examService.saveAssessment(config);
    void examService.saveAssessmentApi(config);
    onSave(config);
  };

  // Aptitude Matrix Totals
  const totalQuants = aptitudeMatrix.quants.easy + aptitudeMatrix.quants.medium + aptitudeMatrix.quants.hard;
  const totalLogical = aptitudeMatrix.logical.easy + aptitudeMatrix.logical.medium + aptitudeMatrix.logical.hard;
  const totalVerbal = aptitudeMatrix.verbal.easy + aptitudeMatrix.verbal.medium + aptitudeMatrix.verbal.hard;
  const totalEasy = aptitudeMatrix.quants.easy + aptitudeMatrix.logical.easy + aptitudeMatrix.verbal.easy;
  const totalMedium = aptitudeMatrix.quants.medium + aptitudeMatrix.logical.medium + aptitudeMatrix.verbal.medium;
  const totalHard = aptitudeMatrix.quants.hard + aptitudeMatrix.logical.hard + aptitudeMatrix.verbal.hard;
  const grandTotal = totalQuants + totalLogical + totalVerbal;

  const renderAptitudeMatrix = () => (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 via-purple-500/5 to-slate-50 dark:to-slate-900 border border-amber-300 dark:border-amber-700/60 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200 dark:border-amber-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-base shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-black text-slate-900 dark:text-white text-sm">
              Aptitude Section & Difficulty Breakdown
            </h5>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manually specify exact question counts for Quants, Logical Reasoning, and Verbal Ability by difficulty level.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
          <button
            type="button"
            onClick={() =>
              setAptitudeMatrix({
                quants: { easy: 4, medium: 4, hard: 2 },
                logical: { easy: 4, medium: 4, hard: 2 },
                verbal: { easy: 4, medium: 4, hard: 2 },
              })
            }
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-bold text-xs hover:bg-amber-50 transition shadow-2xs"
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
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition shadow-2xs"
          >
            5 Each (15 Quick)
          </button>
          <button
            type="button"
            onClick={() =>
              setAptitudeMatrix({
                quants: { easy: 5, medium: 6, hard: 4 },
                logical: { easy: 5, medium: 6, hard: 4 },
                verbal: { easy: 5, medium: 6, hard: 4 },
              })
            }
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition shadow-2xs"
          >
            15 Each (45 Standard)
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
            className="px-2 py-1 rounded-lg text-slate-400 hover:text-rose-500 font-bold text-xs"
          >
            Clear (0)
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold">
              <th className="py-2.5 px-3">Aptitude Section</th>
              <th className="py-2.5 px-3 text-center">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Easy (2 Marks)</span>
              </th>
              <th className="py-2.5 px-3 text-center">
                <span className="text-amber-600 dark:text-amber-400 font-bold">Medium (3 Marks)</span>
              </th>
              <th className="py-2.5 px-3 text-center">
                <span className="text-rose-600 dark:text-rose-400 font-bold">Difficult (5 Marks)</span>
              </th>
              <th className="py-2.5 px-3 text-center">Section Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {/* Row 1: Quants */}
            <tr className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20">
              <td className="py-3 px-3">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>📐 Quantitative Aptitude (Quants)</span>
                </div>
                <span className="text-[11px] text-slate-400">Numbers, Percentages, Profit/Loss, Time & Work (200 in bank)</span>
              </td>
              <td className="py-3 px-3 text-center">
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
                  className="w-16 px-2 py-1.5 text-center font-bold border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                />
              </td>
              <td className="py-3 px-3 text-center">
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
                  className="w-16 px-2 py-1.5 text-center font-bold border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 focus:ring-2 focus:ring-amber-500"
                />
              </td>
              <td className="py-3 px-3 text-center">
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
                  className="w-16 px-2 py-1.5 text-center font-bold border border-rose-300 dark:border-rose-700 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 focus:ring-2 focus:ring-rose-500"
                />
              </td>
              <td className="py-3 px-3 text-center">
                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  {totalQuants} Qs
                </span>
              </td>
            </tr>

            {/* Row 2: Logical Reasoning */}
            <tr className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20">
              <td className="py-3 px-3">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>🧩 Logical Reasoning</span>
                </div>
                <span className="text-[11px] text-slate-400">Coding-Decoding, Series, Syllogisms, Blood Relations (200 in bank)</span>
              </td>
              <td className="py-3 px-3 text-center">
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
                  className="w-16 px-2 py-1.5 text-center font-bold border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                />
              </td>
              <td className="py-3 px-3 text-center">
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
                  className="w-16 px-2 py-1.5 text-center font-bold border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 focus:ring-2 focus:ring-amber-500"
                />
              </td>
              <td className="py-3 px-3 text-center">
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
                  className="w-16 px-2 py-1.5 text-center font-bold border border-rose-300 dark:border-rose-700 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 focus:ring-2 focus:ring-rose-500"
                />
              </td>
              <td className="py-3 px-3 text-center">
                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  {totalLogical} Qs
                </span>
              </td>
            </tr>

            {/* Row 3: Verbal Ability */}
            <tr className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20">
              <td className="py-3 px-3">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>📖 Verbal Ability</span>
                </div>
                <span className="text-[11px] text-slate-400">Reading Comprehension, Grammar, Vocabulary (200 in bank)</span>
              </td>
              <td className="py-3 px-3 text-center">
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
                  className="w-16 px-2 py-1.5 text-center font-bold border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                />
              </td>
              <td className="py-3 px-3 text-center">
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
                  className="w-16 px-2 py-1.5 text-center font-bold border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 focus:ring-2 focus:ring-amber-500"
                />
              </td>
              <td className="py-3 px-3 text-center">
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
                  className="w-16 px-2 py-1.5 text-center font-bold border border-rose-300 dark:border-rose-700 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 focus:ring-2 focus:ring-rose-500"
                />
              </td>
              <td className="py-3 px-3 text-center">
                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  {totalVerbal} Qs
                </span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/70 dark:bg-slate-800/70 font-bold border-t-2 border-slate-300 dark:border-slate-700">
              <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-extrabold">Total Distribution</td>
              <td className="py-2.5 px-3 text-center text-emerald-700 dark:text-emerald-400 font-extrabold">
                {totalEasy} Easy
              </td>
              <td className="py-2.5 px-3 text-center text-amber-700 dark:text-amber-400 font-extrabold">
                {totalMedium} Medium
              </td>
              <td className="py-2.5 px-3 text-center text-rose-700 dark:text-rose-400 font-extrabold">
                {totalHard} Hard
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className="px-3 py-1 rounded-lg bg-amber-600 text-white font-black text-xs">
                  {grandTotal} Total
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Pulling from 600 verified Aptitude questions (200 Quants, 200 Logical, 200 Verbal).
        </div>
        <button
          type="button"
          onClick={handleAddCustomAptitude}
          disabled={grandTotal === 0}
          className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition ${
            grandTotal > 0
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/30'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate & Add {grandTotal} Aptitude Questions</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {initialConfig ? 'Edit Examination Assessment' : 'Create & Publish New Assessment'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSaveAssessment} className="p-5 sm:p-6 overflow-y-auto space-y-8 flex-1 text-xs">
          {/* SECTION 1: Assessment Details & Course / Batch Selection */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>1. Assessment Details & Passing Rules</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Python Full-Stack & Algorithm Evaluation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* TARGET COURSE DROPDOWN */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Course *</label>
                <select
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="All Courses (Global Assessment)">All Courses (Global Assessment - All Batches)</option>
                  {CATEGORIZED_COURSES.map((group) => (
                    <optgroup key={group.category} label={`📂 ${group.category}`}>
                      {group.courses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* TARGET BATCH DROPDOWN (Morning, Afternoon, Evening, Weekend) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Batch / Cohort *</label>
                <select
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="All Batches (Global - All Students)">All Batches (Global - All Students)</option>
                  <option value="Morning Batch">Morning Batch</option>
                  <option value="Afternoon Batch">Afternoon Batch</option>
                  <option value="Evening Batch">Evening Batch</option>
                  <option value="Weekend Batch">Weekend Batch</option>
                </select>
              </div>

              {/* UNIFIED TEST & CREDIT CATEGORY / MONTH SELECTOR */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assessment Month & Category *
                </label>
                <select
                  value={category === 'aptitude' ? 'aptitude' : category === 'practice' ? 'practice' : creditCategoryId}
                  onChange={(e) => handleTestCategorySelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <optgroup label="Monthly Academic Tests (Points change per month)">
                    <option value="month_1_test">
                      Month 1 Internal Assessment (+{getLinkedCreditItem('month_1_test').credits} pts pool)
                    </option>
                    <option value="month_2_test">
                      Month 2 Internal Assessment (+{getLinkedCreditItem('month_2_test').credits} pts pool)
                    </option>
                    <option value="month_3_test">
                      Month 3 Internal Assessment (+{getLinkedCreditItem('month_3_test').credits} pts pool)
                    </option>
                    <option value="fourth_month_test">
                      Month 4 Overall Semester Assessment (+{getLinkedCreditItem('fourth_month_test').credits} pts pool)
                    </option>
                    <option value="month_5_test">
                      Month 5 Internal Assessment (+{getLinkedCreditItem('month_5_test').credits} pts pool)
                    </option>
                    <option value="month_6_test">
                      Month 6 Final Capstone Assessment (+{getLinkedCreditItem('month_6_test').credits} pts pool)
                    </option>
                  </optgroup>
                  <optgroup label="Placement & Aptitude (Screening & Prep)">
                    <option value="aptitude">
                      Aptitude & Placement Test (0 Credits • Placement Screening & Benchmarking)
                    </option>
                  </optgroup>
                  <optgroup label="Practice Tests (Self-Assessment)">
                    <option value="practice">
                      Practice Sandbox (0 Credits • Unlimited Attempts)
                    </option>
                  </optgroup>
                </select>
              </div>

              {/* CREDITS REWARD (MAX SCORE POOL) - Editable with automatic tier recalibration */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Credits Reward (Max Score Pool) *
                </label>
                {category === 'practice' || category === 'aptitude' ? (
                  <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 font-bold text-sm flex items-center justify-between">
                    <span>0 pts (Placement Prep / Practice Sandbox)</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">0 Credits</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={customPoolCredits}
                        onChange={(e) => handlePoolCreditsChange(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 pr-20 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-black text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                      <span className="absolute right-3.5 text-xs font-black text-indigo-600 dark:text-indigo-400">
                        pts pool
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Month {monthNumber} default: {getLinkedCreditItem(creditCategoryId).credits} pts</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Tiers update automatically</span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (Minutes) *</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Passing Threshold (%) *</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  required
                  value={passingPercentage}
                  onChange={(e) => {
                    const newPct = Number(e.target.value);
                    setPassingPercentage(newPct);
                    const curPool = creditTiers[0]?.credits ?? 15;
                    setCreditTiers(calculateTiersFromPool(curPool, newPct));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Negative Marking / Question</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="5"
                  value={negativeMarking}
                  onChange={(e) => setNegativeMarking(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DYNAMIC PUBLISHING MODE & ANTI-CHEATING PROTOCOL */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>2. Publishing Mode & Anti-Cheating Protocol</span>
            </h4>

            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Choose Publishing Mode *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setPublishingMode('instant')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3 ${
                    publishingMode === 'instant'
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Radio className={`w-5 h-5 ${publishingMode === 'instant' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <h5 className="font-black text-xs text-slate-900 dark:text-white">Instant Broadcast</h5>
                    <p className="text-[10px] text-slate-500">Goes live immediately for students</p>
                  </div>
                </div>

                <div
                  onClick={() => setPublishingMode('pin_protected')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3 ${
                    publishingMode === 'pin_protected'
                      ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-600 dark:border-purple-400 text-slate-900 dark:text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <KeyRound className={`w-5 h-5 ${publishingMode === 'pin_protected' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <div>
                    <h5 className="font-black text-xs text-slate-900 dark:text-white">Classroom PIN Protected</h5>
                    <p className="text-[10px] text-slate-500">Requires secret PIN to unlock</p>
                  </div>
                </div>

                <div
                  onClick={() => setPublishingMode('scheduled')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3 ${
                    publishingMode === 'scheduled'
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-600 dark:border-amber-400 text-slate-900 dark:text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Calendar className={`w-5 h-5 ${publishingMode === 'scheduled' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <div>
                    <h5 className="font-black text-xs text-slate-900 dark:text-white">Scheduled Time Window</h5>
                    <p className="text-[10px] text-slate-500">Opens at designated date/time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* DYNAMIC FORM FIELDS BASED ON SELECTED PUBLISHING MODE */}

            {/* CASE 1: Instant Broadcast */}
            {publishingMode === 'instant' && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2.5 text-xs text-indigo-900 dark:text-indigo-200 font-medium">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    <strong>Instant Broadcast Mode:</strong> The assessment is published immediately to students' dashboards without requiring an access key. Students can start immediately.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Violation Limit (Allowed Tab Switches)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={maxViolations}
                      onChange={(e) => setMaxViolations(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Result Visibility</label>
                    <select
                      value={resultVisibility}
                      onChange={(e) => setResultVisibility(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="immediate">Immediate Scorecard & Answers Upon Submission</option>
                      <option value="scheduled">Hidden Answers (Sealed until mentor reveals)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 2: Classroom PIN Protected */}
            {publishingMode === 'pin_protected' && (
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2.5 text-xs text-purple-900 dark:text-purple-200 font-medium">
                  <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>
                    <strong>Classroom PIN Mode:</strong> The exam is locked. Students will see the test card, but MUST enter this exact secret key in class before the test interface launches.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Secret Access Key / Classroom PIN *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value.toUpperCase())}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-wider uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => setSecretKey(`PIN-${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="px-3 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-200 transition"
                      >
                        Regen
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">PIN Expiry Window</label>
                    <select
                      value={pinExpiryOption}
                      onChange={(e) => setPinExpiryOption(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="2hours">Valid for 2 Hours (Classroom Session)</option>
                      <option value="today">Valid Today Only (Closes at Midnight)</option>
                      <option value="48hours">Valid for 48 Hours</option>
                      <option value="none">No Expiry (Until Disabled)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Violation Limit (Tab Switches)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={maxViolations}
                      onChange={(e) => setMaxViolations(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Result Visibility</label>
                    <select
                      value={resultVisibility}
                      onChange={(e) => setResultVisibility(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="immediate">Immediate Scorecard & Answers Upon Submission</option>
                      <option value="scheduled">Hidden Answers (Sealed until mentor reveals)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 3: Scheduled Time Window */}
            {publishingMode === 'scheduled' && (
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 font-medium">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    <strong>Scheduled Time Window Mode:</strong> The assessment will remain locked until the designated Opening Date & Time, and closes automatically at Closing Date & Time.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Opening Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Closing Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Result Visibility</label>
                    <select
                      value={resultVisibility}
                      onChange={(e) => setResultVisibility(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="immediate">Immediate Scorecard & Answers Upon Submission</option>
                      <option value="scheduled">Hidden Answers (Sealed until mentor reveals)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Result Release Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={resultReleaseDate}
                      onChange={(e) => setResultReleaseDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Shuffling & Proctor Controls */}
            <div className="flex flex-wrap gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Shuffle Question Order for each student
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Shuffle Multiple Choice Option order
                </span>
              </label>
            </div>
          </div>

          {/* SECTION 3: TIERED CREDIT RUBRIC (DERIVED & CALCULATED FROM CREDIT MANAGEMENT) */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500" />
                  <span>3. CONFIGURABLE TIERED CREDIT ALLOCATION (PERCENTAGE BRACKETS)</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Credits awarded automatically to the student's portfolio based on their score percentage.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const item = getLinkedCreditItem(creditCategoryId);
                    setCreditTiers(calculateTiersFromPool(item.credits, passingPercentage));
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-100 transition text-[11px] flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                  title="Recalculate tiers based on Credit Management configuration"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sync from Credit Mgmt ({getLinkedCreditItem(creditCategoryId).credits} pts)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const item = getLinkedCreditItem(creditCategoryId);
                    setCreditTiers([
                      { min_percentage: 90, max_percentage: 100, credits: item.credits },
                      { min_percentage: 80, max_percentage: 89, credits: passingPercentage <= 80 ? item.credits : 0 },
                      { min_percentage: 70, max_percentage: 79, credits: passingPercentage <= 70 ? item.credits : 0 },
                      { min_percentage: 60, max_percentage: 69, credits: passingPercentage <= 60 ? item.credits : 0 },
                      { min_percentage: 50, max_percentage: 59, credits: passingPercentage <= 50 ? item.credits : 0 },
                    ]);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition text-[11px]"
                >
                  Flat Reward
                </button>
              </div>
            </div>

            {/* Linked Source Information Banner from Credit Management (Image 2) */}
            {(() => {
              if (category === 'aptitude') {
                return (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-200 dark:border-amber-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-amber-950 dark:text-amber-200 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        <strong>Placement Aptitude Screening Mode:</strong>{' '}
                        <span className="font-bold text-amber-600 dark:text-amber-300">
                          0 Credits Awarded &bull; Placement Benchmarking & Interview Prep Only
                        </span>
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                      Credit Impact: 0 pts
                    </span>
                  </div>
                );
              }
              const currentItem = getLinkedCreditItem(creditCategoryId);
              return (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200 dark:border-indigo-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-indigo-950 dark:text-indigo-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>
                      <strong>Sourced from Credit Management:</strong>{' '}
                      <span className="font-bold text-indigo-600 dark:text-indigo-300">
                        {currentItem.categoryGroup} &rarr; {currentItem.title}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-semibold text-[11px]">
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      Admin Configured Pool:{' '}
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {currentItem.credits} Credits
                      </strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      Min Passing Threshold:{' '}
                      <strong className="text-purple-600 dark:text-purple-400">{passingPercentage}%</strong>
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 5 Percentage Bracket Cards (Matching Image 1) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {creditTiers.map((tier, tIdx) => {
                const isPassingTier = tier.min_percentage >= passingPercentage || (tier.max_percentage >= passingPercentage && tier.credits > 0);
                const tierGradeNames = ['Grade Tier 1', 'Grade Tier 2', 'Grade Tier 3', 'Grade Tier 4', 'Grade Tier 5'];
                const tierFormulas = ['100% of Pool (A+)', '80% of Pool (A)', '65% of Pool (B)', '50% of Pool (C)', `Below ${passingPercentage}% Cutoff`];

                return (
                  <div
                    key={tIdx}
                    className={`p-3.5 rounded-2xl border text-center space-y-1.5 transition ${
                      isPassingTier
                        ? 'bg-slate-50 dark:bg-slate-800/60 border-indigo-200 dark:border-indigo-900/60'
                        : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-75'
                    }`}
                  >
                    <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      {tier.min_percentage}% – {tier.max_percentage}%
                    </span>

                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={tier.credits}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCreditTiers((prev) => {
                            const updated = [...prev];
                            updated[tIdx] = { ...tier, credits: val };
                            return updated;
                          });
                        }}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-center font-bold text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-500">pts</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                        {tierGradeNames[tIdx]}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block">
                        {tier.credits === 0 ? '0 pts (Threshold)' : tierFormulas[tIdx]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: ADD QUESTIONS (EXCEL UPLOAD, QUESTION BANK, INTERACTIVE) */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>4. Examination Questions ({questions.length} Items Configured)</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload via Excel (.xlsx), select from Question Bank, or author manually
                </p>
              </div>

              {/* Sub-tab selection */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 flex-wrap gap-1">
                {category === 'aptitude' ? (
                  <button
                    type="button"
                    onClick={() => setQuestionTab('aptitude_matrix')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      questionTab === 'aptitude_matrix'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-amber-800 dark:text-amber-300 hover:bg-amber-100/50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Aptitude Matrix</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setQuestionTab('aptitude_matrix')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      questionTab === 'aptitude_matrix'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Aptitude Matrix</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setQuestionTab('excel_upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    questionTab === 'excel_upload'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Upload Doc / Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuestionTab('bank')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    questionTab === 'bank'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Question Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuestionTab('interactive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    questionTab === 'interactive'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Interactive Builder</span>
                </button>
              </div>
            </div>

            {/* TAB: APTITUDE SECTION & DIFFICULTY MATRIX */}
            {questionTab === 'aptitude_matrix' && renderAptitudeMatrix()}

            {/* TAB 1: DOCUMENT / EXCEL FILE UPLOAD (.xlsx, .docx, .pdf, .csv) */}
            {questionTab === 'excel_upload' && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <span>Upload Questions from Document (Excel, Word Doc, PDF)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        Multi-Format
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Upload an Excel workbook (.xlsx, .xls, .csv), Word document (.docx, .doc), or PDF question paper (.pdf).
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Excel Template Button */}
                    <button
                      type="button"
                      onClick={handleDownloadExcelTemplate}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition shadow-xs"
                      title="Download standardized Excel worksheet template with sample questions"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Excel Template (.xlsx)</span>
                    </button>

                    {/* Word Template Button */}
                    <button
                      type="button"
                      onClick={handleDownloadWordTemplate}
                      disabled={isDownloadingWord}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 font-bold text-xs flex items-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition shadow-xs disabled:opacity-50"
                      title="Download standardized Word document template with sample questions"
                    >
                      {isDownloadingWord ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>Download Word Template (.docx)</span>
                    </button>
                  </div>
                </div>

                {/* Format Badges */}
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="text-slate-400 font-semibold">Accepted Formats:</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                    Excel (.xlsx, .xls, .csv)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100/70 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                    <FileText className="w-3 h-3 text-blue-600" />
                    Word Doc (.docx, .doc)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100/70 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
                    <BookOpen className="w-3 h-3 text-rose-600" />
                    PDF (.pdf)
                  </span>
                </div>

                {/* File Dropzone */}
                {!csvTextMode ? (
                  <div className="space-y-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 rounded-2xl p-6 sm:p-8 text-center cursor-pointer bg-white dark:bg-slate-900 transition flex flex-col items-center justify-center gap-2 group shadow-xs"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls, .csv, .docx, .doc, .pdf, .txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                        {isParsingDoc ? (
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        ) : (
                          <FileUp className="w-6 h-6" />
                        )}
                      </div>
                      <h6 className="font-black text-slate-900 dark:text-white text-xs">
                        {isParsingDoc
                          ? `Extracting questions from ${uploadFileName}...`
                          : uploadFileName
                          ? uploadFileName
                          : 'Click to Browse or Drag & Drop Document'}
                      </h6>
                      <p className="text-[11px] text-slate-400">
                        Supports Excel (.xlsx, .xls, .csv), Word Docs (.docx, .doc), and PDF (.pdf) formats
                      </p>
                    </div>

                    {uploadError && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        ⚠️ {uploadError}
                      </div>
                    )}

                    {/* Preview of Extracted Questions */}
                    {parsedPreview.length > 0 && (
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-emerald-800 dark:text-emerald-300 text-xs block">
                              ✓ {parsedPreview.length} Questions Ready to Import from "{uploadFileName}"
                            </span>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              Questions, options, and answer keys were successfully identified and verified.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleConfirmDocumentImport}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm & Add {parsedPreview.length} Questions</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCsvTextMode(true)}
                        className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:underline"
                      >
                        Or paste raw CSV text instead
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      rows={5}
                      value={csvInput}
                      onChange={(e) => setCsvInput(e.target.value)}
                      placeholder="Paste CSV rows here: Type,Question_Text,Options,Correct_Answer,Marks..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCsvTextMode(false)}
                        className="text-slate-500 hover:underline text-xs"
                      >
                        Back to file upload
                      </button>
                      <button
                        type="button"
                        onClick={handleParseCsvText}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
                      >
                        Parse & Add Questions
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CENTRALIZED QUESTION BANK PICKER */}
            {questionTab === 'bank' && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/60">
                  <div>
                    <h5 className="font-black text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span>Select Questions from Centralized Question Bank ({bankQuestions.length.toLocaleString()} Available)</span>
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Select questions using the subject checkboxes below, or launch Full Screen for the edge-to-edge question bank browser.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFullScreenBankModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98] shrink-0"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Open Full-Screen Question Bank</span>
                  </button>
                </div>

                {/* ================= SUBJECT CHECKBOX & QUESTION COUNT BUILDER ================= */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800/60 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h6 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                          Add Questions by Subject / Topic
                        </h6>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {availableSubjects.length} Subjects
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Select subject checkboxes and specify question counts to automatically add questions into the exam.
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
                          className="px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Master Controls Header */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {availableSubjects.map((sub) => {
                      const isSelected = !!selectedSubjects[sub.name];
                      const countVal = subjectQuestionCounts[sub.name] ?? 5;
                      return (
                        <div
                          key={sub.name}
                          className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {/* Checkbox in front of subject name */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              id={`subj-chk-${sub.name}`}
                              checked={isSelected}
                              onChange={() => handleToggleSubject(sub.name)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                            />
                            <label
                              htmlFor={`subj-chk-${sub.name}`}
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

                  {/* Action Button to Add Questions from Selected Subjects */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {selectedSubjectsCount > 0 ? (
                        <>
                          Selected <strong className="text-indigo-600 dark:text-indigo-400">{selectedSubjectsCount}</strong> subjects with{' '}
                          <strong className="text-indigo-600 dark:text-indigo-400">{totalSubjectQuestionsToSelect}</strong> total questions.
                        </>
                      ) : (
                        'Check the box next to any subject above and set question counts.'
                      )}
                    </span>

                    <button
                      type="button"
                      disabled={selectedSubjectsCount === 0 || totalSubjectQuestionsToSelect === 0}
                      onClick={handleAddSelectedSubjectsQuestions}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        Add {totalSubjectQuestionsToSelect > 0 ? `${totalSubjectQuestionsToSelect} Questions` : 'Questions'} from Selected Subjects to Exam
                      </span>
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      placeholder="Search question bank or code..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <select
                      value={bankTopic}
                      onChange={(e) => setBankTopic(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="all">All Topics ({bankQuestions.length} Questions)</option>
                      {Array.from(new Set(bankQuestions.map((q) => q.topic || 'General'))).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={bankDifficulty}
                      onChange={(e) => setBankDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="all">All Difficulties</option>
                      <option value="easy">🟢 Easy (2 Marks)</option>
                      <option value="medium">🟡 Medium (3 Marks)</option>
                      <option value="hard">🔴 Difficult (5 Marks)</option>
                    </select>
                  </div>
                </div>

                {/* Dedicated Aptitude Section Breakdown if Aptitude is selected */}
                {bankTopic.toLowerCase().includes('aptitude') && renderAptitudeMatrix()}

                {/* Bank Questions List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredBank.slice(0, 100).map((q) => {
                    const isSelected = Boolean(selectedBankIds[q.id]);
                    return (
                      <div
                        key={q.id}
                        onClick={() => setSelectedBankIds((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 rounded text-indigo-600 shrink-0"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {q.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">{q.topic}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                q.difficulty === 'easy'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : q.difficulty === 'medium'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-rose-50 text-rose-600'
                              }`}
                            >
                              {q.difficulty}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600">+{q.marks} Marks</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                            {q.question_text?.replace(/\s*\([Vv]ariation\s*\d+\)/gi, '')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={Object.values(selectedBankIds).filter(Boolean).length === 0}
                    onClick={handleInsertSelectedFromBank}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Insert Selected ({Object.values(selectedBankIds).filter(Boolean).length}) Questions</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: INTERACTIVE MANUAL BUILDER */}
            {questionTab === 'interactive' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Question Type</label>
                    <select
                      value={newQType}
                      onChange={(e) => setNewQType(e.target.value as QuestionType)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="mcq">Single Correct (MCQ)</option>
                      <option value="multiple_correct">Multiple Correct (MSQ)</option>
                      <option value="find_output">Find the Output (Code)</option>
                      <option value="true_false">True / False</option>
                      <option value="fill_blanks">Fill in the Blanks</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="coding">Coding Problem (Test Cases)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Topic / Domain</label>
                    <input
                      type="text"
                      value={newQTopic}
                      onChange={(e) => setNewQTopic(e.target.value)}
                      placeholder="e.g. Python Core"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                    <select
                      value={newQDifficulty}
                      onChange={(e) => setNewQDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Marks</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={newQMarks}
                      onChange={(e) => setNewQMarks(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Question Prompt *</label>
                  <textarea
                    rows={2}
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    placeholder="Enter question text..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                {(newQType === 'find_output' || newQType === 'coding') && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Code Snippet / Starter Template
                    </label>
                    <textarea
                      rows={3}
                      value={newQCodeSnippet}
                      onChange={(e) => setNewQCodeSnippet(e.target.value)}
                      placeholder="def example(): ..."
                      className="w-full p-3 rounded-xl font-mono text-xs border border-slate-200 dark:border-slate-700 bg-slate-950 text-emerald-400"
                    />
                  </div>
                )}

                {(newQType === 'mcq' || newQType === 'find_output' || newQType === 'multiple_correct') && (
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Options & Correct Answer Selection:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {newQOptions.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type={newQType === 'multiple_correct' ? 'checkbox' : 'radio'}
                            name="interactive_correct"
                            checked={
                              newQType === 'multiple_correct'
                                ? newQCorrectMultiple.includes(oIdx)
                                : newQCorrectSingle === oIdx
                            }
                            onChange={() => {
                              if (newQType === 'multiple_correct') {
                                setNewQCorrectMultiple((prev) =>
                                  prev.includes(oIdx) ? prev.filter((i) => i !== oIdx) : [...prev, oIdx],
                                );
                              } else {
                                setNewQCorrectSingle(oIdx);
                              }
                            }}
                            className="w-4 h-4 text-indigo-600"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const copy = [...newQOptions];
                              copy[oIdx] = e.target.value;
                              setNewQOptions(copy);
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(newQType === 'fill_blanks' || newQType === 'short_answer' || newQType === 'coding') && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Expected Correct Answer:
                    </label>
                    <input
                      type="text"
                      value={newQCorrectText}
                      onChange={(e) => setNewQCorrectText(e.target.value)}
                      placeholder="Expected answer key..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Solution Explanation (Displayed in student answer key):
                  </label>
                  <input
                    type="text"
                    value={newQExplanation}
                    onChange={(e) => setNewQExplanation(e.target.value)}
                    placeholder="Solution walk-through..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddInteractiveQuestion}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of Configured Questions */}
            <div className="space-y-2 pt-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Current Question Queue ({questions.length} Total Configured):
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          Q{idx + 1} &bull; {q.type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {q.subtopic ? `${q.topic} • ${q.subtopic}` : q.topic || 'General'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+{q.marks} Marks</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">{q.question_text?.replace(/\s*\([Vv]ariation\s*\d+\)/gi, '')}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-slate-500 font-medium">
              Total Marks: <strong>{questions.reduce((sum, q) => sum + (q.marks || 1), 0)}</strong> &bull; Total Questions: <strong>{questions.length}</strong> &bull; Max Reward: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">+{creditTiers[0]?.credits || 0} Credits</strong>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/25 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{initialConfig ? 'Update Assessment' : '🚀 Publish Assessment'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Full-Screen Central Question Bank Modal (Edge-to-Edge Portal) */}
      {showFullScreenBankModal && (
        <QuestionBankModal
          onClose={() => setShowFullScreenBankModal(false)}
          onSelectQuestions={(selectedBankQuestions) => {
            const cleaned = selectedBankQuestions.map((q) => ({
              ...q,
              question_text: q.question_text?.replace(/\s*\([Vv]ariation\s*\d+\)/gi, '').trim(),
            }));
            setQuestions((prev) => [...prev, ...cleaned]);
            setShowFullScreenBankModal(false);
            alert(`Added ${cleaned.length} questions from Central Question Bank to this assessment!`);
          }}
        />
      )}
    </div>
  );
};
