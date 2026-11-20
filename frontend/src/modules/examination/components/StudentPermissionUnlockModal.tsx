import React, { useState, useMemo } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Users,
  Sparkles,
  Filter,
  X,
  AlertCircle,
  Clock,
  Check,
} from 'lucide-react';
import { AssessmentConfig } from '../types';
import { examService } from '../services/examService';
import {
  studentAccountService,
  StudentAccount,
} from '../../../services/studentAccountService';

interface StudentPermissionUnlockModalProps {
  test: AssessmentConfig;
  onClose: () => void;
  onUpdate?: () => void;
}

export const StudentPermissionUnlockModal: React.FC<StudentPermissionUnlockModalProps> = ({
  test,
  onClose,
  onUpdate,
}) => {
  const [currentTest, setCurrentTest] = useState<AssessmentConfig>(test);
  const [students, setStudents] = useState<StudentAccount[]>(() =>
    studentAccountService.getStudents()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'morning' | 'evening' | 'unlocked'>('all');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  const unlockedIds = useMemo(() => {
    return new Set(currentTest.unlocked_student_ids || []);
  }, [currentTest.unlocked_student_ids]);

  const isGlobalUnlocked = unlockedIds.has('all_students') || unlockedIds.has('*');

  const checkIsStudentUnlocked = (s: StudentAccount): boolean => {
    if (isGlobalUnlocked) return true;
    if (unlockedIds.has(s.id) || unlockedIds.has(s.student_id)) return true;
    const batchLower = (s.batch || '').toLowerCase();
    if (batchLower.includes('morning') && (unlockedIds.has('morning_batch') || unlockedIds.has('morning'))) {
      return true;
    }
    if (batchLower.includes('evening') && (unlockedIds.has('evening_batch') || unlockedIds.has('evening'))) {
      return true;
    }
    return false;
  };

  const showFeedback = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackBanner({ text, type });
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  // Toggle individual student permission
  const handleToggleStudent = (student: StudentAccount) => {
    const isUnlocked = checkIsStudentUnlocked(student);
    const targetId = student.id || student.student_id;

    if (isUnlocked) {
      examService.lockExamForStudent(currentTest.id, targetId);
      examService.lockExamForStudent(currentTest.id, student.student_id);
      showFeedback(`🔒 Revoked permission for ${student.student_name}.`, 'info');
    } else {
      examService.unlockExamForStudent(currentTest.id, targetId);
      if (student.student_id && student.student_id !== targetId) {
        examService.unlockExamForStudent(currentTest.id, student.student_id);
      }
      showFeedback(`🔓 Granted permission to ${student.student_name}! They can now write the test.`, 'success');
    }

    const updated = examService.getAssessmentById(currentTest.id);
    if (updated) setCurrentTest(updated);
    if (onUpdate) onUpdate();
  };

  // Bulk: Unlock for all Morning Batch students
  const handleUnlockMorningBatch = () => {
    const morningStudents = students.filter(
      (s) => (s.batch || '').toLowerCase().includes('morning') || !s.batch
    );
    const idsToUnlock = ['morning_batch'];
    morningStudents.forEach((s) => {
      if (s.id) idsToUnlock.push(s.id);
      if (s.student_id) idsToUnlock.push(s.student_id);
    });

    examService.unlockExamForStudents(currentTest.id, idsToUnlock);
    const updated = examService.getAssessmentById(currentTest.id);
    if (updated) setCurrentTest(updated);
    if (onUpdate) onUpdate();

    showFeedback(
      `⚡ Successfully UNLOCKED test for ALL ${morningStudents.length} Morning Batch students!`,
      'success'
    );
  };

  // Bulk: Unlock for all Evening Batch students
  const handleUnlockEveningBatch = () => {
    const eveningStudents = students.filter((s) =>
      (s.batch || '').toLowerCase().includes('evening')
    );
    const idsToUnlock = ['evening_batch'];
    eveningStudents.forEach((s) => {
      if (s.id) idsToUnlock.push(s.id);
      if (s.student_id) idsToUnlock.push(s.student_id);
    });

    examService.unlockExamForStudents(currentTest.id, idsToUnlock);
    const updated = examService.getAssessmentById(currentTest.id);
    if (updated) setCurrentTest(updated);
    if (onUpdate) onUpdate();

    showFeedback(
      `⚡ Successfully UNLOCKED test for ALL ${eveningStudents.length} Evening Batch students!`,
      'success'
    );
  };

  // Bulk: Unlock for all students enrolled in this course
  const handleUnlockCourseStudents = () => {
    const testCourseLower = (currentTest.course_id || currentTest.title || '').toLowerCase();
    const courseStudents = students.filter((s) => {
      const stuCourse = (s.course_name || '').toLowerCase();
      return (
        stuCourse.includes(testCourseLower) ||
        testCourseLower.includes(stuCourse) ||
        stuCourse.includes('python') && testCourseLower.includes('python') ||
        stuCourse.includes('java') && testCourseLower.includes('java')
      );
    });

    const idsToUnlock: string[] = [];
    courseStudents.forEach((s) => {
      if (s.id) idsToUnlock.push(s.id);
      if (s.student_id) idsToUnlock.push(s.student_id);
    });

    if (idsToUnlock.length === 0) {
      students.forEach((s) => {
        if (s.id) idsToUnlock.push(s.id);
      });
    }

    examService.unlockExamForStudents(currentTest.id, idsToUnlock);
    const updated = examService.getAssessmentById(currentTest.id);
    if (updated) setCurrentTest(updated);
    if (onUpdate) onUpdate();

    showFeedback(
      `⚡ Successfully UNLOCKED test for ${courseStudents.length || students.length} students enrolled in this course!`,
      'success'
    );
  };

  // Bulk: Global Open Access (Permit all students anywhere)
  const handleUnlockGlobally = () => {
    examService.unlockExamGlobally(currentTest.id);
    const updated = examService.getAssessmentById(currentTest.id);
    if (updated) setCurrentTest(updated);
    if (onUpdate) onUpdate();

    showFeedback(
      `🌐 GLOBAL PERMISSION ENABLED: Any registered student can now attend this test!`,
      'success'
    );
  };

  // Bulk: Reset / Lock all
  const handleResetPermissions = () => {
    if (window.confirm('Are you sure you want to reset all manual permissions for this examination?')) {
      examService.resetExamPermissions(currentTest.id);
      const updated = examService.getAssessmentById(currentTest.id);
      if (updated) setCurrentTest(updated);
      if (onUpdate) onUpdate();

      showFeedback('🔒 Permissions reset to default batch rules.', 'info');
    }
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Tab filter
      if (activeTab === 'morning') {
        const b = (s.batch || '').toLowerCase();
        if (!b.includes('morning') && b !== '') return false;
      } else if (activeTab === 'evening') {
        const b = (s.batch || '').toLowerCase();
        if (!b.includes('evening')) return false;
      } else if (activeTab === 'unlocked') {
        if (!checkIsStudentUnlocked(s)) return false;
      }

      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = s.student_name?.toLowerCase().includes(query);
        const matchesRoll = s.student_id?.toLowerCase().includes(query);
        const matchesEmail = s.email?.toLowerCase().includes(query);
        const matchesCourse = s.course_name?.toLowerCase().includes(query);
        const matchesBatch = s.batch?.toLowerCase().includes(query);
        return matchesName || matchesRoll || matchesEmail || matchesCourse || matchesBatch;
      }

      return true;
    });
  }, [students, activeTab, searchTerm, unlockedIds, isGlobalUnlocked]);

  const morningCount = students.filter((s) => (s.batch || '').toLowerCase().includes('morning') || !s.batch).length;
  const eveningCount = students.filter((s) => (s.batch || '').toLowerCase().includes('evening')).length;
  const permittedCount = students.filter((s) => checkIsStudentUnlocked(s)).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Student Permission & Batch Unlock Portal
                </h3>
                {isGlobalUnlocked && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                    Open Access
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Assessment: <strong className="text-slate-800 dark:text-slate-200">{currentTest.title}</strong>{' '}
                &bull; Batch: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{currentTest.batch || 'All Batches'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Toast */}
        {feedbackBanner && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between transition-all ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-indigo-600 text-white'
            }`}
          >
            <span>{feedbackBanner.text}</span>
            <button onClick={() => setFeedbackBanner(null)} className="opacity-80 hover:opacity-100">
              &times;
            </button>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
            <div className="flex items-center gap-1.5 font-black text-indigo-800 dark:text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>How Student Permission Works:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              When students see <em>"Designated for Morning Batch. Contact Admin to unlock"</em>, they need permission.
              Click <strong>"Unlock for ALL Morning Batch"</strong> or grant individual permission below. Permitted students can attend immediately without batch or prerequisite locks.
            </p>
          </div>

          {/* Quick 1-Click Action Buttons */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              ⚡ 1-Click Quick Batch Permissions:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleUnlockMorningBatch}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Grant permission to all morning batch students"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Unlock All Morning ({morningCount})</span>
              </button>

              <button
                type="button"
                onClick={handleUnlockEveningBatch}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Grant permission to all evening batch students"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Unlock All Evening ({eveningCount})</span>
              </button>

              <button
                type="button"
                onClick={handleUnlockGlobally}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Enable open access for every registered student"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Global Open Access</span>
              </button>

              <button
                type="button"
                onClick={handleResetPermissions}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Reset manual overrides back to default batch checks"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Permissions</span>
              </button>
            </div>
          </div>

          {/* Search & Tabs */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Batch Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('morning')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'morning'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Morning ({morningCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('evening')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'evening'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Evening ({eveningCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('unlocked')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === 'unlocked'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Permitted ({permittedCount})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or roll ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Students List */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No students found matching your criteria.
                </div>
              ) : (
                filteredStudents.map((stu) => {
                  const isPermitted = checkIsStudentUnlocked(stu);
                  const isMorning = (stu.batch || '').toLowerCase().includes('morning');

                  return (
                    <div
                      key={stu.id || stu.student_id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isPermitted
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {stu.student_name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                            {stu.student_id}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              isMorning
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                            }`}
                          >
                            {stu.batch || 'Morning Batch (9:30 AM - 12:30 PM)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {stu.course_name} &bull; {stu.branch || 'Campus'} &bull; {stu.email}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isPermitted ? (
                          <div className="flex items-center gap-2">
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Permitted</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleStudent(stu)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 dark:border-rose-800 transition flex items-center gap-1 cursor-pointer"
                              title="Revoke access"
                            >
                              <Lock className="w-3 h-3 text-rose-500" />
                              <span>Revoke</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStudent(stu)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-xs shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
                            title="Grant permission to write this test"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Give Permission</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>
              <strong>{permittedCount}</strong> of {students.length} students have permission
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
