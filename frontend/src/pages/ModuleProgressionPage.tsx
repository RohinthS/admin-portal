import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  syllabusProgressService,
  CourseModuleDef,
  STANDARD_BATCHES,
  SYLLABUS_ZIP_COURSES,
  COURSE_SYLLABUS_REGISTRY,
} from '../modules/examination/services/syllabusProgressService';
import { examService } from '../modules/examination/services/examService';
import { studentAccountService, StudentAccount } from '../services/studentAccountService';
import api from '../api/client';
import {
  CheckCircle2,
  Clock,
  ChevronDown,
  RotateCcw,
  Unlock,
  Check,
  X,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';

export const ModuleProgressionPage: React.FC = () => {
  const { user } = useAuth();

  // All available courses in syllabus registry
  const availableCourses = useMemo(() => {
    const list = Object.keys(COURSE_SYLLABUS_REGISTRY);
    // Sort so Syllabus.zip courses come first
    return list.sort((a, b) => {
      const aInZip = SYLLABUS_ZIP_COURSES.some((z) => a.toLowerCase().includes(z.toLowerCase()));
      const bInZip = SYLLABUS_ZIP_COURSES.some((z) => b.toLowerCase().includes(z.toLowerCase()));
      if (aInZip && !bInZip) return -1;
      if (!aInZip && bInZip) return 1;
      return a.localeCompare(b);
    });
  }, []);

  const [selectedCourse, setSelectedCourse] = useState<string>(() => {
    return availableCourses[0] || 'Basic Python Course';
  });

  const [selectedBatch, setSelectedBatch] = useState<string>('Morning Batch');
  const [modules, setModules] = useState<CourseModuleDef[]>([]);
  const [batchProgress, setBatchProgress] = useState<Record<string, any>>({});
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pass mark configuration
  const [passMarkPercentage, setPassMarkPercentage] = useState<number>(60);

  // Admin action modal states
  const [actionModal, setActionModal] = useState<{
    type: 'reset' | 'unlock';
    student: StudentAccount;
    moduleDef: CourseModuleDef;
    testId?: string;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load modules and batch progress
  const loadCourseData = () => {
    const mods = syllabusProgressService.getModulesForCourse(selectedCourse);
    setModules(mods);

    const prog = syllabusProgressService.getBatchProgress(selectedCourse, selectedBatch);
    setBatchProgress(prog);

    const allStudents = studentAccountService.getStudents();
    setStudents(allStudents);
  };

  useEffect(() => {
    loadCourseData();
  }, [selectedCourse, selectedBatch]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter students for the current course and batch
  const batchStudents = useMemo(() => {
    return students.filter((s) => {
      const courseMatch =
        !s.course_name ||
        s.course_name.toLowerCase().includes(selectedCourse.toLowerCase()) ||
        selectedCourse.toLowerCase().includes(s.course_name.toLowerCase());

      const batchMatch =
        !s.batch ||
        s.batch.toLowerCase().includes(selectedBatch.toLowerCase()) ||
        selectedBatch.toLowerCase().includes(s.batch.toLowerCase());

      return courseMatch && batchMatch;
    });
  }, [students, selectedCourse, selectedBatch]);

  // Overall batch progression stats
  const progressionSummary = useMemo(() => {
    const total = modules.length;
    const completed = modules.filter((m) => batchProgress[m.id]?.status === 'completed').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [modules, batchProgress]);

  // Handle mentor ticking or unticking the module completion checkbox
  const handleToggleModule = async (mod: CourseModuleDef) => {
    const isCompleted = batchProgress[mod.id]?.status === 'completed';
    const newStatus = !isCompleted;

    const mentorName = user?.name || user?.username || 'Faculty Mentor';

    // 1. Update in local/shared service
    let updated: Record<string, any>;
    if (newStatus) {
      updated = syllabusProgressService.markModuleCompleted(
        selectedCourse,
        selectedBatch,
        mod.id,
        mentorName
      );
    } else {
      updated = syllabusProgressService.markModuleInProgress(
        selectedCourse,
        selectedBatch,
        mod.id
      );
    }
    setBatchProgress(updated);

    // 2. Also sync to backend API
    try {
      await api.post('/tests/syllabus/toggle-module', {
        courseName: selectedCourse,
        batchName: selectedBatch,
        moduleId: mod.id,
        moduleName: mod.moduleName,
        completed: newStatus,
        completedBy: mentorName,
      });
    } catch {
      // Offline fallback already updated in service
    }

    if (newStatus) {
      showToast(
        `✅ ${mod.moduleName} marked COMPLETED for ${selectedBatch}! Assessment automatically published in Student Portal.`
      );
    } else {
      showToast(`ℹ️ ${mod.moduleName} reverted to Pending for ${selectedBatch}.`);
    }

    // Trigger update event across tabs/windows
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wegrow_assessments_updated'));
    }
  };

  // Execute admin reset or unlock override
  const handleExecuteAction = async () => {
    if (!actionModal) return;
    try {
      setActionLoading(true);
      const performedBy = user?.name || user?.username || 'Super Administrator';
      const reason = actionReason.trim() || 'Admin manual management';

      if (actionModal.type === 'reset') {
        const testId = actionModal.testId || `mod-test-${actionModal.moduleDef.id}`;
        await syllabusProgressService.adminResetAttemptForStudent(
          actionModal.student.id,
          actionModal.student.student_name,
          testId,
          performedBy,
          reason
        );
        showToast(`🔄 Attempt reset successfully for ${actionModal.student.student_name}`);
      } else {
        await syllabusProgressService.adminUnlockModuleForStudent(
          actionModal.student.id,
          actionModal.student.student_name,
          selectedCourse,
          selectedBatch,
          actionModal.moduleDef.id,
          performedBy,
          reason
        );
        showToast(`🔓 Module unlocked successfully for ${actionModal.student.student_name}`);
      }

      setActionModal(null);
      setActionReason('');
      loadCourseData();
    } catch (err: any) {
      alert(`Action failed: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mentor Dashboard &bull; Offline Module Completion</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{selectedCourse}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Classes are conducted offline. When you finish a module, <strong>tick the checkbox beside it</strong> to immediately update its status to <strong>Completed</strong>. The test will automatically be published and enabled in the Student Portal for students in this batch.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[130px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Progress</span>
              <span className="text-xl font-black text-emerald-400">
                {progressionSummary.completed} / {progressionSummary.total}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">({progressionSummary.percent}% Completed)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Course & Batch Selector Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Course Select */}
        <div className="flex-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Assigned Course:
          </label>
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer transition"
            >
              {availableCourses.map((c) => (
                <option key={c} value={c}>
                  📘 {c} ({COURSE_SYLLABUS_REGISTRY[c]?.length || 0} Modules)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Batch Select Tabs */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Assigned Batch (Offline Sessions):
          </label>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            {STANDARD_BATCHES.map((batch) => {
              const active = selectedBatch === batch;
              return (
                <button
                  key={batch}
                  type="button"
                  onClick={() => setSelectedBatch(batch)}
                  className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span className="truncate">{batch.replace(' Batch', '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pass Mark Config */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Pass Mark (%):
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="30"
              max="90"
              value={passMarkPercentage}
              onChange={(e) => setPassMarkPercentage(Number(e.target.value) || 60)}
              className="w-16 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 text-center"
            />
            <span className="text-xs text-slate-500 font-bold">% required</span>
          </div>
        </div>
      </div>

      {/* Modules List with Checkboxes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>
              {selectedCourse} &bull; {selectedBatch} ({modules.length} Modules)
            </span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Tick the checkbox after completing the offline module
          </span>
        </div>

        {modules.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500">
            No modules configured for this course syllabus.
          </div>
        ) : (
          modules.map((mod, idx) => {
            const isCompleted = batchProgress[mod.id]?.status === 'completed';
            const completedAt = batchProgress[mod.id]?.completedAt;
            const completedBy = batchProgress[mod.id]?.completedBy;

            // Student metrics for this module
            const matchingTest = examService.getAssessments().find((t) =>
              t.course_name?.toLowerCase() === selectedCourse.toLowerCase() &&
              t.title?.toLowerCase().includes(mod.moduleName.toLowerCase())
            );

            const allAttempts = examService.getAllAttempts();
            const attemptsForTest = matchingTest
              ? allAttempts.filter((a) => a.test_id === matchingTest.id)
              : [];

            const passedStudents = batchStudents.filter((s) =>
              attemptsForTest.some((a) => (a.student_id === s.id || a.student_id === s.student_id) && a.is_passed)
            );
            const failedStudents = batchStudents.filter(
              (s) =>
                !passedStudents.includes(s) &&
                attemptsForTest.some((a) => a.student_id === s.id || a.student_id === s.student_id)
            );
            const notAttemptedStudents = batchStudents.filter(
              (s) => !passedStudents.includes(s) && !failedStudents.includes(s)
            );

            const isExpanded = expandedModuleId === mod.id;

            return (
              <div
                key={mod.id || idx}
                className={`p-5 rounded-3xl border transition-all duration-200 ${
                  isCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Checkbox + Module Title */}
                  <div className="flex items-start gap-3.5">
                    {/* The Checkbox */}
                    <label className="relative flex items-center justify-center cursor-pointer mt-0.5">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggleModule(mod)}
                        className="sr-only peer"
                      />
                      <div className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-600 peer-checked:border-emerald-600 peer-checked:bg-emerald-600 flex items-center justify-center transition shadow-2xs">
                        <Check className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition" />
                      </div>
                    </label>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {mod.moduleNumber || idx + 1}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {mod.moduleName}
                        </h4>
                        {mod.topic && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {mod.topic}
                          </span>
                        )}
                        {isCompleted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Completed &bull; Test Published</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Offline Class Pending</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        {mod.description}
                      </p>

                      {mod.practicalActivity && (
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-300 italic mt-1 flex items-center gap-1">
                          <span>🛠️ Practical Activity:</span>
                          <span>{mod.practicalActivity}</span>
                        </p>
                      )}

                      {mod.subtopics && mod.subtopics.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-2">
                          {mod.subtopics.map((st, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              {st}
                            </span>
                          ))}
                        </div>
                      )}

                      {isCompleted && completedAt && (
                        <p className="text-[10px] text-slate-400 mt-2 font-mono">
                          Completed on {new Date(completedAt).toLocaleDateString()} by {completedBy || 'Faculty Mentor'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Live Batch Student Metrics */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <span>Passed:</span>
                        <strong className="font-black text-xs">{passedStudents.length}</strong>
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                        <span>Failed:</span>
                        <strong className="font-black text-xs">{failedStudents.length}</strong>
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <span>Not Attempted:</span>
                        <strong className="font-black text-xs">{notAttemptedStudents.length}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Student Roster' : 'View Student Roster & Actions'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Collapsible Student Roster & Admin Actions */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2">
                      <h5 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        Batch Enrolled Students ({batchStudents.length})
                      </h5>
                      <span className="text-[11px] text-slate-400">
                        Pass mark threshold: {passMarkPercentage}%
                      </span>
                    </div>

                    {batchStudents.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 text-center">
                        No students currently enrolled under <strong>{selectedCourse}</strong> &bull; <strong>{selectedBatch}</strong>.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase">
                              <th className="py-2 px-3">Student Name & ID</th>
                              <th className="py-2 px-3">Batch</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3">Attempts</th>
                              <th className="py-2 px-3">Best Score</th>
                              <th className="py-2 px-3 text-right">Admin Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {batchStudents.map((stu) => {
                              const stuAttempts = attemptsForTest.filter(
                                (a) => a.student_id === stu.id || a.student_id === stu.student_id
                              );
                              const passed = stuAttempts.some((a) => a.is_passed);
                              const failed = stuAttempts.length > 0 && !passed;
                              const bestScore = stuAttempts.reduce(
                                (max, a) => Math.max(max, a.marks_obtained || 0),
                                0
                              );
                              const maxPossible = stuAttempts[0]?.total_marks || 15;

                              return (
                                <tr key={stu.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-slate-900 dark:text-white">
                                      {stu.student_name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {stu.student_id}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <select
                                      value={stu.batch || selectedBatch}
                                      onChange={(e) => {
                                        const newBatch = e.target.value;
                                        studentAccountService.updateStudentBatch(stu.id, newBatch);
                                        showToast(`Moved ${stu.student_name} to ${newBatch}`);
                                        loadCourseData();
                                      }}
                                      className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
                                      title="Reassign batch for this student"
                                    >
                                      {STANDARD_BATCHES.map((b) => (
                                        <option key={b} value={b}>
                                          {b}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {passed ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        Passed 🎉
                                      </span>
                                    ) : failed ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                        Failed ({stuAttempts.length} retakes)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                        Not Attempted
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono">{stuAttempts.length}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold">
                                    {stuAttempts.length > 0 ? `${bestScore} / ${maxPossible}` : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {stuAttempts.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setActionModal({
                                              type: 'reset',
                                              student: stu,
                                              moduleDef: mod,
                                              testId: matchingTest?.id,
                                            })
                                          }
                                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 cursor-pointer"
                                          title="Reset student's attempt to allow fresh retake"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          <span>Reset</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActionModal({
                                            type: 'unlock',
                                            student: stu,
                                            moduleDef: mod,
                                          })
                                        }
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1 cursor-pointer"
                                        title="Manually unlock this module test for this student"
                                      >
                                        <Unlock className="w-3 h-3" />
                                        <span>Unlock</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Admin Action Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-black">
                  {actionModal.type === 'reset' ? 'Reset Student Exam Attempt' : 'Manual Module Unlock Override'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {actionModal.type === 'reset'
                ? `Resetting attempt history for "${actionModal.student.student_name}" on ${actionModal.moduleDef.moduleName}.`
                : `Manually unlocking ${actionModal.moduleDef.moduleName} for "${actionModal.student.student_name}", bypassing prerequisites.`}
            </p>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                Reason / Activity Audit Note *
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Student faced network disconnect during exam / Approved by faculty mentor"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteAction}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm & Log Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
