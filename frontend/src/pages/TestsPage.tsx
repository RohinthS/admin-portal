import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AssessmentConfig, ExamQuestion } from '../modules/examination/types';
import { examService } from '../modules/examination/services/examService';
import { studentAccountService, StudentAccount } from '../services/studentAccountService';
import { ExamBuilderModal } from '../modules/examination/components/ExamBuilderModal';
import { QuestionBankModal } from '../modules/examination/components/QuestionBankModal';
import { LiveProctoringConsole } from '../modules/examination/components/LiveProctoringConsole';
import { ExamAnalyticsView } from '../modules/examination/components/ExamAnalyticsView';
import { StudentPermissionUnlockModal } from '../modules/examination/components/StudentPermissionUnlockModal';
import { ConductModuleTestModal } from '../modules/examination/components/ConductModuleTestModal';
import { syllabusProgressService, CourseModuleDef } from '../modules/examination/services/syllabusProgressService';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Plus,
  Layers,
  BookOpen,
  Clock,
  Award,
  ShieldAlert,
  Edit2,
  Trash2,
  Eye,
  Radio,
  BarChart3,
  Users,
  Calendar,
  Lock,
  Unlock,
  Key,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  X,
  Search,
  FileText,
} from 'lucide-react';

export const TestsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assessments' | 'bank' | 'proctoring' | 'analytics'>('assessments');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'aptitude' | 'internal' | 'overall' | 'practice'>('all');
  const [assessments, setAssessments] = useState<AssessmentConfig[]>(() => examService.getAssessments());
  const [selectedAssessmentForEdit, setSelectedAssessmentForEdit] = useState<AssessmentConfig | null>(null);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const viewParam = searchParams.get('view');
    if (tabParam === 'proctoring') {
      setActiveTab('proctoring');
    } else if (tabParam === 'analytics') {
      setActiveTab('analytics');
    } else if (tabParam === 'bank' || tabParam === 'question-bank' || viewParam === 'bank' || viewParam === 'question-bank') {
      setActiveTab('bank');
    } else {
      setActiveTab('assessments');
    }
  }, [searchParams]);
  const [previewTest, setPreviewTest] = useState<AssessmentConfig | null>(null);
  const [unlockModalTest, setUnlockModalTest] = useState<AssessmentConfig | null>(null);
  const [studentsList, setStudentsList] = useState<StudentAccount[]>(() => studentAccountService.getStudents());
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [actionBanner, setActionBanner] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Unified Module Test Modal State
  const [showConductModuleTestModal, setShowConductModuleTestModal] = useState(false);
  const [conductCourseName, setConductCourseName] = useState<string | undefined>();
  const [conductSelectedModules, setConductSelectedModules] = useState<CourseModuleDef[] | undefined>();

  const refreshAssessments = () => {
    setAssessments(examService.getAssessments());
    setStudentsList(studentAccountService.getStudents());
  };

  const handleToggleStudentUnlock = (testId: string, studentId: string, studentName: string, currentlyUnlocked: boolean) => {
    if (currentlyUnlocked) {
      examService.lockExamForStudent(testId, studentId);
      setActionBanner({
        text: `🔒 Prerequisite Lock restored for ${studentName}.`,
        type: 'info',
      });
    } else {
      examService.unlockExamForStudent(testId, studentId);
      setActionBanner({
        text: `🔓 Successfully UNLOCKED exam for ${studentName}! They can now attend directly.`,
        type: 'success',
      });
    }
    refreshAssessments();
    // Update local state for modal if open
    setUnlockModalTest((prev) => (prev && prev.id === testId ? examService.getAssessmentById(testId) || null : prev));
    setTimeout(() => setActionBanner(null), 4000);
  };

  const handleToggleAnswerKeyRelease = async (test: AssessmentConfig) => {
    const updated = await examService.toggleAnswerKeyReleaseApi(test.id);
    refreshAssessments();
    if (updated?.is_answer_key_released) {
      setActionBanner({
        text: `✓ Answer key released for "${test.title}". Examinees can now review solutions & answer keys.`,
        type: 'success',
      });
    } else {
      setActionBanner({
        text: `🔒 Answer key locked/sealed for "${test.title}". Students cannot view solutions until permission is given.`,
        type: 'info',
      });
    }
    setTimeout(() => setActionBanner(null), 4000);
  };

  useEffect(() => {
    examService
      .fetchAssessmentsApi()
      .then((backendList) => {
        if (Array.isArray(backendList) && backendList.length > 0) {
          setAssessments(backendList);
        }
      })
      .catch(() => {});

    const handleUpdate = () => refreshAssessments();
    window.addEventListener('wegrow_assessments_updated', handleUpdate);
    return () => window.removeEventListener('wegrow_assessments_updated', handleUpdate);
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      await examService.deleteAssessmentApi(id);
      refreshAssessments();
      setActionBanner({
        text: `Assessment "${title}" deleted successfully.`,
        type: 'info',
      });
      setTimeout(() => setActionBanner(null), 4000);
    }
  };

  const handleEdit = (test: AssessmentConfig) => {
    setSelectedAssessmentForEdit(test);
    setShowBuilderModal(true);
  };

  const handleCreateNew = () => {
    setSelectedAssessmentForEdit(null);
    setShowBuilderModal(true);
  };

  const handleCreateTestFromBank = (selectedQuestions: any[]) => {
    setShowBankModal(false);
    const primaryTopic = selectedQuestions[0]?.topic || 'Technical Assessment';
    setSelectedAssessmentForEdit({
      id: '',
      title: `${primaryTopic} Assessment`,
      description: `Assessment created with ${selectedQuestions.length} questions from Central Question Bank.`,
      course_id: '',
      course_name: primaryTopic,
      batch: 'All Batches',
      category: 'internal',
      credit_category_id: 'monthly_test',
      duration_minutes: Math.max(15, selectedQuestions.length * 2),
      passing_percentage: 60,
      negative_marking_per_question: 1,
      total_marks: selectedQuestions.reduce((acc, q) => acc + (q.marks || 5), 0),
      total_questions: selectedQuestions.length,
      credit_tiers: [],
      publishing_mode: 'instant',
      is_secret_key_required: false,
      shuffle_questions: true,
      shuffle_options: true,
      auto_submit_on_timeout: true,
      max_attempts: 1,
      max_violations: 3,
      result_visibility: 'immediate',
      is_retake_allowed: false,
      created_by: 'Admin / Mentor',
      creator_role: 'admin',
      created_at: new Date().toISOString(),
      status: 'draft',
      questions: selectedQuestions,
    });
    setShowBuilderModal(true);
  };

  const activeAttempts = examService.getAllAttempts().filter((a) => a.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Exam Portal & Assessments</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h2>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setConductCourseName(undefined);
              setConductSelectedModules(undefined);
              setShowConductModuleTestModal(true);
            }}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition cursor-pointer"
            title="Conduct syllabus-based test for completed modules"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>⚡ Conduct Module Test</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('bank');
              setSearchParams({ tab: 'bank' });
            }}
            className={`flex items-center justify-center gap-2 px-3.5 py-2.5 border font-bold text-xs rounded-xl shadow-xs transition cursor-pointer ${
              activeTab === 'bank'
                ? 'bg-purple-600 text-white border-purple-600 shadow-purple-600/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Question Bank</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assessment</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner for Answer Key Permissions */}
      {actionBanner && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 border ${
            actionBanner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{actionBanner.text}</span>
          </div>
          <button
            onClick={() => setActionBanner(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-4 font-black"
          >
            &times;
          </button>
        </div>
      )}


      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap">
        <button
          onClick={() => {
            setActiveTab('assessments');
            setSearchParams({});
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'assessments'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>All Published Assessments ({assessments.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('bank');
            setSearchParams({ tab: 'bank' });
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'bank'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          <span>Central Question Bank (7,400)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('proctoring');
            setSearchParams({ tab: 'proctoring' });
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'proctoring'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>Live Exam Proctoring ({activeAttempts})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('analytics');
            setSearchParams({ tab: 'analytics' });
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Results & Credit Analytics</span>
        </button>
      </div>

      {/* Tab 1: Published Assessments Grid */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-xs font-bold text-slate-400 mr-1">Filter:</span>
            {[
              { id: 'all', label: `All (${assessments.length})` },
              { id: 'aptitude', label: `Placement Aptitude (${assessments.filter((t) => t.category === 'aptitude').length})` },
              { id: 'internal', label: `Internal Monthly (${assessments.filter((t) => t.category === 'internal').length})` },
              { id: 'overall', label: `Overall Semester (${assessments.filter((t) => t.category === 'overall').length})` },
              { id: 'practice', label: `Practice Sandbox (${assessments.filter((t) => t.category === 'practice').length})` },
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {assessments
              .filter((t) => categoryFilter === 'all' || t.category === categoryFilter)
              .map((t) => (
              <div
                key={t.id}
                className="p-5 sm:p-6 glass-card dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-200 group"
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
                        <span>Aptitude Assessment</span>
                      ) : t.category === 'practice' ? (
                        <span>Practice Sandbox</span>
                      ) : t.category === 'overall' || t.month_number === 4 ? (
                        <span>Month 4 Overall Semester</span>
                      ) : (
                        <span>Month {t.month_number || 1} Internal Test</span>
                      )}
                    </span>

                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {t.duration_minutes} Mins
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                    {t.description || t.course_name}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Questions:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {t.total_questions || t.questions?.length || 0} Questions
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Pass Mark / Threshold:</span>
                      <strong className="text-slate-900 dark:text-white">{t.passing_percentage}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Credits:</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {t.category === 'aptitude' || t.category === 'practice'
                          ? '0 pts (Placement Prep)'
                          : `+${t.credit_tiers?.[0]?.credits || 25} pts`}
                      </strong>
                    </div>
                    {t.is_secret_key_required && (
                      <div className="flex justify-between text-amber-600 dark:text-amber-400 font-mono font-bold">
                        <span>PIN Protected:</span>
                        <span>{t.secret_key}</span>
                      </div>
                    )}
                    {/* Answer Key Release Status Row */}
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-750 text-[11px] text-slate-600 dark:text-slate-400">
                      <span>Answer Key:</span>
                      {t.result_visibility === 'scheduled' ? (
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            t.is_answer_key_released
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          }`}
                        >
                          {t.is_answer_key_released ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Released to Students</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>Sealed until Revealed</span>
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Immediate on Submit</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls for Admin/Mentor */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  {/* ONLY show the Release Answer Key button when the test is posted with "Hidden Answers (Sealed until mentor reveals)" */}
                  {t.result_visibility === 'scheduled' && (
                    <button
                      onClick={() => handleToggleAnswerKeyRelease(t)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99] ${
                        t.is_answer_key_released
                          ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                      }`}
                      title={t.is_answer_key_released ? 'Click to revoke student access and seal answer key' : 'Click to grant students permission to view answers'}
                    >
                      <Key className="w-3.5 h-3.5 text-current" />
                      <span>
                        {t.is_answer_key_released
                          ? '✓ Answer Key Opened (Click to Seal)'
                          : 'Release Answer Key to Students'}
                      </span>
                    </button>
                  )}

                  {/* Admin Give Permission / Unlock Button */}
                  <button
                    onClick={() => {
                      setUnlockModalTest(t);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm shadow-emerald-600/20 active:scale-[0.99] cursor-pointer"
                    title="Give students permission to write this test or unlock morning/evening batch"
                  >
                    <Unlock className="w-4 h-4 text-white" />
                    <span>
                      🔓 Give Permission / Unlock Students {(t.unlocked_student_ids || []).length > 0 ? `(${t.unlocked_student_ids?.length} Permitted)` : ''}
                    </span>
                  </button>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setPreviewTest(t)}
                      className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Questions</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit Assessment"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id, t.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete Assessment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Central Question Bank (Inline View with Admin Sidebar Visible!) */}
      {activeTab === 'bank' && (
        <QuestionBankModal
          isInline={true}
          onClose={() => {
            setActiveTab('assessments');
            setSearchParams({});
          }}
          onSelectQuestions={handleCreateTestFromBank}
        />
      )}

      {/* Tab 3: Live Proctoring Console */}
      {activeTab === 'proctoring' && <LiveProctoringConsole />}

      {/* Tab 4: Analytics & Rankings */}
      {activeTab === 'analytics' && <ExamAnalyticsView />}

      {/* Builder Modal */}
      {showBuilderModal && (
        <ExamBuilderModal
          initialConfig={selectedAssessmentForEdit}
          onClose={() => {
            setShowBuilderModal(false);
            setSelectedAssessmentForEdit(null);
          }}
          onSave={() => {
            setShowBuilderModal(false);
            setSelectedAssessmentForEdit(null);
            refreshAssessments();
          }}
        />
      )}

      {/* Standalone Question Bank Modal Popup (Fallback / explicit trigger) */}
      {showBankModal && (
        <QuestionBankModal
          isInline={false}
          onClose={() => {
            setShowBankModal(false);
            if (searchParams.get('view') || searchParams.get('tab') === 'bank' || searchParams.get('tab') === 'question-bank') {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('view');
                if (next.get('tab') === 'bank' || next.get('tab') === 'question-bank') {
                  next.delete('tab');
                }
                return next;
              });
            }
          }}
          onSelectQuestions={handleCreateTestFromBank}
        />
      )}

      {/* Question Preview Modal (For Admin & Mentor to see questions & answer keys) */}
      {previewTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Assessment Question Preview & Key
                </h3>
                <p className="text-xs text-slate-500">{previewTest.title} &bull; {previewTest.questions?.length || 0} Questions</p>
              </div>
              <div className="flex items-center gap-3">
                {previewTest.result_visibility === 'scheduled' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = examService.toggleAnswerKeyRelease(previewTest.id);
                      refreshAssessments();
                      if (updated) {
                        setPreviewTest(updated);
                        setActionBanner({
                          text: updated.is_answer_key_released
                            ? `✓ Answer key released to students for "${updated.title}".`
                            : `🔒 Answer key sealed for "${updated.title}".`,
                          type: updated.is_answer_key_released ? 'success' : 'info',
                        });
                        setTimeout(() => setActionBanner(null), 4000);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                      previewTest.is_answer_key_released
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                    title="Control whether students can see solutions"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>
                      {previewTest.is_answer_key_released
                        ? '✓ Key Released (Click to Lock)'
                        : 'Release Answer Key to Students'}
                    </span>
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Immediate Upon Submission</span>
                  </span>
                )}
                <button
                  onClick={() => setPreviewTest(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {previewTest.questions?.map((q, qIdx) => (
                <div key={q.id || qIdx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-500">
                    <span>Q{qIdx + 1} &bull; {q.type}</span>
                    <span className="text-emerald-600 font-bold">+{q.marks} Marks</span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{q.question_text}</p>
                  {q.code_snippet && (
                    <pre className="p-2 rounded bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                      {q.code_snippet}
                    </pre>
                  )}
                  {q.options && (
                    <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-1.5 rounded ${
                            q.correct_answer === oIdx || (Array.isArray(q.correct_answer) && q.correct_answer.includes(oIdx))
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.explanation && (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded">
                      <strong>Solution Note:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewTest(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Student Lock / Unlock Permission Modal */}
      {unlockModalTest && (
        <StudentPermissionUnlockModal
          test={unlockModalTest}
          onClose={() => setUnlockModalTest(null)}
          onUpdate={() => refreshAssessments()}
        />
      )}

      {/* Unified All-in-One Module Test Modal (Option 1) */}
      {showConductModuleTestModal && (
        <ConductModuleTestModal
          courseName={conductCourseName}
          initialSelectedModules={conductSelectedModules}
          onClose={() => {
            setShowConductModuleTestModal(false);
            setConductCourseName(undefined);
            setConductSelectedModules(undefined);
          }}
          onPublished={(newAssessment) => {
            setShowConductModuleTestModal(false);
            setConductCourseName(undefined);
            setConductSelectedModules(undefined);
            refreshAssessments();
            setActionBanner({
              text: `🎉 Module Test "${newAssessment.title}" created & published successfully!`,
              type: 'success',
            });
            setTimeout(() => setActionBanner(null), 5000);
          }}
        />
      )}

    </div>
  );
};
