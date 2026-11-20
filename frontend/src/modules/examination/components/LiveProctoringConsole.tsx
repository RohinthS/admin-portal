import React, { useState, useEffect } from 'react';
import { StudentAttempt, AssessmentConfig } from '../types';
import { examService } from '../services/examService';
import { ActionConfirmModal } from '../../../components/ActionConfirmModal';
import {
  ShieldAlert,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';

interface LiveProctoringConsoleProps {
  onRefresh?: () => void;
}

export const LiveProctoringConsole: React.FC<LiveProctoringConsoleProps> = () => {
  const [attempts, setAttempts] = useState<StudentAttempt[]>(() => examService.getAllAttempts());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'submitted' | 'disqualified'>('all');
  const [selectedAttemptLogs, setSelectedAttemptLogs] = useState<StudentAttempt | null>(null);
  const [forceSubmitTarget, setForceSubmitTarget] = useState<string | null>(null);
  const [retakeTarget, setRetakeTarget] = useState<{ studentId: string; testId: string; studentName: string } | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const refreshData = () => {
    setAttempts(examService.getAllAttempts());
  };

  useEffect(() => {
    const handleViolation = () => refreshData();
    const handleSubmit = () => refreshData();
    window.addEventListener('wegrow_exam_violation', handleViolation);
    window.addEventListener('wegrow_attempt_submitted', handleSubmit);
    window.addEventListener('wegrow_retake_granted', refreshData);

    const interval = setInterval(refreshData, 5000);

    return () => {
      window.removeEventListener('wegrow_exam_violation', handleViolation);
      window.removeEventListener('wegrow_attempt_submitted', handleSubmit);
      window.removeEventListener('wegrow_retake_granted', refreshData);
      clearInterval(interval);
    };
  }, []);

  const handleForceSubmit = (attemptId: string) => {
    setForceSubmitTarget(attemptId);
  };

  const handleGrantRetake = (studentId: string, testId: string, studentName?: string) => {
    setRetakeTarget({ studentId, testId, studentName: studentName || 'Student' });
  };

  const filteredAttempts = attempts.filter((a) => {
    const matchesSearch =
      a.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.test_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.batch || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const inProgressCount = attempts.filter((a) => a.status === 'in_progress').length;
  const violationExceededCount = attempts.filter((a) => a.violations_count >= 3).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl glass-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Active Examinees
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{inProgressCount}</div>
            <span className="text-[11px] text-indigo-600 font-bold">Currently in Exam Room</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Flagged Violations
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{violationExceededCount}</div>
            <span className="text-[11px] text-amber-600 font-bold">Reached 3+ Tab Switches</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-card flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Proctor Engine
            </span>
            <div className="text-sm font-black text-emerald-600 flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Active</span>
            </div>
            <span className="text-[11px] text-slate-400">Syncs every 5 seconds</span>
          </div>

          <button
            onClick={refreshData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student, test, or batch..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
          >
            <option value="all">All Examinees ({attempts.length})</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="disqualified">Disqualified</option>
          </select>
        </div>
      </div>

      {/* Examinees Proctor Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Student & Cohort</th>
                <th className="p-4">Assessment</th>
                <th className="p-4">Status</th>
                <th className="p-4">Score & %</th>
                <th className="p-4">Tab Violations</th>
                <th className="p-4">Credits</th>
                <th className="p-4 text-right">Proctor Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No active examinations matching filters.
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{att.student_name}</div>
                      <div className="text-[11px] text-slate-400">
                        {att.batch || 'Batch Alpha'} &bull; {att.course_name}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{att.test_title}</div>
                      <div className="text-[11px] text-slate-400 uppercase font-bold">{att.category} Assessment</div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                          att.status === 'in_progress'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200'
                            : att.status === 'disqualified'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                        }`}
                      >
                        {att.status === 'in_progress' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                        )}
                        <span>{att.status.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="p-4">
                      {att.status === 'in_progress' ? (
                        <span className="text-slate-400 italic">Testing in progress...</span>
                      ) : (
                        <div>
                          <strong className="text-slate-900 dark:text-white text-sm">{att.score_percentage}%</strong>
                          <span className="text-[11px] text-slate-400 block">
                            {att.marks_obtained} / {att.total_marks} Marks
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            att.violations_count === 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                              : att.violations_count === 1
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-black'
                          }`}
                        >
                          {att.violations_count || 0} Incident(s)
                        </span>

                        {att.violations_log && att.violations_log.length > 0 && (
                          <button
                            onClick={() => setSelectedAttemptLogs(att)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 transition"
                            title="View Incident Audit Trail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-black text-indigo-600 dark:text-indigo-400">
                        +{att.earned_credits || 0} pts
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {att.status === 'in_progress' && (
                          <button
                            onClick={() => handleForceSubmit(att.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 text-[11px] font-bold transition"
                          >
                            Force Submit
                          </button>
                        )}

                        {att.status !== 'in_progress' && (
                          <button
                            onClick={() => handleGrantRetake(att.student_id, att.test_id, att.student_name)}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 border border-purple-200 text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Grant Retake</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Audit Trail Modal */}
      {selectedAttemptLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">Security Incident Log</h4>
                <p className="text-xs text-slate-500">{selectedAttemptLogs.student_name} &bull; {selectedAttemptLogs.test_title}</p>
              </div>
              <button
                onClick={() => setSelectedAttemptLogs(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedAttemptLogs.violations_log?.map((log, lIdx) => (
                <div key={lIdx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="font-bold text-rose-500 uppercase">{log.type.replace('_', ' ')}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{log.description}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAttemptLogs(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Submit Modal (WhatsApp Dialog Style) */}
      <ActionConfirmModal
        isOpen={Boolean(forceSubmitTarget)}
        onClose={() => setForceSubmitTarget(null)}
        title="Force submit examination?"
        description="Are you sure you want to force submit this student's examination? Their current answers will be evaluated and finalized."
        type="warning"
        options={[
          {
            label: 'Force Submit Now',
            variant: 'danger',
            onClick: () => {
              if (forceSubmitTarget) {
                examService.forceSubmit(forceSubmitTarget);
                refreshData();
                setForceSubmitTarget(null);
              }
            },
          },
        ]}
        cancelText="Cancel"
      />

      {/* Grant Retake Modal (WhatsApp Dialog Style) */}
      <ActionConfirmModal
        isOpen={Boolean(retakeTarget)}
        onClose={() => setRetakeTarget(null)}
        title="Grant official retake?"
        description={`Grant an official assessment retake for ${retakeTarget?.studentName}? Their current attempt and violation logs will be reset, allowing them to re-attend.`}
        type="edit"
        options={[
          {
            label: 'Grant Retake Permission',
            variant: 'primary',
            onClick: () => {
              if (retakeTarget) {
                examService.grantRetake(retakeTarget.studentId, retakeTarget.testId, 'Mentor / Admin');
                refreshData();
                setRetakeTarget(null);
              }
            },
          },
        ]}
        cancelText="Cancel"
      />
    </div>
  );
};
