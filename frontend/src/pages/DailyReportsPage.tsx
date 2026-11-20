import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FileSpreadsheet, Plus, CheckCircle2, Sparkles, X } from 'lucide-react';

export const DailyReportsPage: React.FC = () => {
  const { activeCompanyId, user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/daily-reports', { params: { company_id: activeCompanyId } });
      setReports(res.data || []);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeCompanyId]);

  const totalEntries = reports.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedReports = reports.slice((page - 1) * pageSize, page * pageSize);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/daily-reports', {
        company_id: activeCompanyId,
        user_type: user?.user_type === 'student' ? 'student' : 'staff',
        entity_id: user?.id,
        report_date: new Date().toISOString().slice(0, 10),
        work_description: description,
        hours_spent: hours,
      });
      setShowAddModal(false);
      setDescription('');
      fetchReports();
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Daily Work Logs & Reports</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit and verify daily staff tasks and student learning activities
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Work Log</span>
        </button>
      </div>

      <div className="p-5 sm:p-6 glass-card rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 touch-scroll">
          <table className="w-full text-left text-xs min-w-[700px] border-collapse">
            <thead className="text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-slate-50/90 dark:bg-slate-800/90">
              <tr>
                <th className="py-2.5 px-3 text-center w-14 border-b border-r border-slate-200 dark:border-slate-700">S.NO</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Date</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">User Type</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Work Summary</th>
                <th className="py-2.5 px-3 text-right border-b border-r border-slate-200 dark:border-slate-700">Hours</th>
                <th className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/50">
              {paginatedReports.length > 0 ? (
                paginatedReports.map((r, idx) => {
                  const serialNo = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr key={r._id} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/50 transition">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                        {serialNo}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-sky-600 dark:text-sky-400 border-b border-r border-slate-200 dark:border-slate-700">{r.report_date}</td>
                      <td className="py-2.5 px-3 capitalize text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-700">{r.user_type}</td>
                      <td className="py-2.5 px-3 max-w-md text-slate-700 dark:text-slate-300 leading-relaxed border-b border-r border-slate-200 dark:border-slate-700">{r.work_description}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white border-b border-r border-slate-200 dark:border-slate-700">{r.hours_spent}h</td>
                      <td className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                          {r.status || 'Verified'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    No daily reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {totalEntries > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(page * pageSize, totalEntries)} of {totalEntries} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(1)}
              title="First Page"
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-bold"
            >
              «
            </button>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              title="Previous Page"
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-bold"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-md font-bold text-xs transition cursor-pointer ${
                    page === p
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              title="Next Page"
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-bold"
            >
              ›
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              title="Last Page"
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-bold"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto touch-scroll">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Submit Work Log</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hours Logged</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Work Description / Milestones *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail tasks completed today, modules practiced or bugs fixed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-md hover:from-indigo-500 hover:to-violet-500 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
