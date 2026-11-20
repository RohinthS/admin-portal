import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Clock, Check, X, Plus, Sparkles, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const LeavesPage: React.FC = () => {
  const { activeCompanyId, user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Apply Leave Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState('casual');
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalDays, setTotalDays] = useState(1);
  const [reason, setReason] = useState('');
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaves', { params: { company_id: activeCompanyId } });
      setLeaves(res.data || []);
    } catch (err) {
      console.error('Failed to load leaves', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [activeCompanyId]);

  const handleOpenApplyModal = async () => {
    setShowApplyModal(true);
    try {
      const res = await api.get('/users', { params: { company_id: activeCompanyId } });
      const list = (res.data || []).filter((u: any) => u.user_type !== 'student');
      setStaffMembers(list);
      setSelectedStaffId(user?.id || (list.length > 0 ? list[0]._id : ''));
    } catch {
      setSelectedStaffId(user?.id || '');
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/leaves/apply', {
        company_id: activeCompanyId,
        staff_id: selectedStaffId || user?.id,
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
        total_days: Number(totalDays) || 1,
        reason,
      });
      setShowApplyModal(false);
      setReason('');
      fetchLeaves();
    } catch (err) {
      console.error('Failed to submit leave', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/leaves/${id}/review`, { status });
      fetchLeaves();
    } catch (err) {
      console.error('Review failed', err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(leaves.length / pageSize));
  const paginated = leaves.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Staff Leave Requests</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review, approve, or submit employee leave applications
          </p>
        </div>

        <button
          onClick={handleOpenApplyModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply Leave</span>
        </button>
      </div>

      <div className="p-5 sm:p-6 glass-card rounded-2xl">
        <div className="overflow-x-auto touch-scroll rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <table className="w-full text-left text-xs min-w-[700px] border-collapse">
            <thead className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-3.5 py-3 font-bold w-16 text-center border-r border-slate-200 dark:border-slate-700">S.NO</th>
                <th className="px-3.5 py-3 font-semibold border-r border-slate-200 dark:border-slate-700">Staff Name</th>
                <th className="px-3.5 py-3 font-semibold border-r border-slate-200 dark:border-slate-700">Leave Type</th>
                <th className="px-3.5 py-3 font-semibold border-r border-slate-200 dark:border-slate-700">From Date</th>
                <th className="px-3.5 py-3 font-semibold border-r border-slate-200 dark:border-slate-700">To Date</th>
                <th className="px-3.5 py-3 font-semibold border-r border-slate-200 dark:border-slate-700">Days</th>
                <th className="px-3.5 py-3 font-semibold border-r border-slate-200 dark:border-slate-700">Reason</th>
                <th className="px-3.5 py-3 font-semibold border-r border-slate-200 dark:border-slate-700">Status</th>
                <th className="px-3.5 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
              {paginated.length > 0 ? (
                paginated.map((l, idx) => (
                  <tr key={l._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-3.5 py-3 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="px-3.5 py-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                      {l.staff_id?.staff_name || l.staff_id?.name || 'Staff Member'}
                    </td>
                    <td className="px-3.5 py-3 capitalize text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                      {l.leave_type}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                      {l.from_date}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                      {l.to_date}
                    </td>
                    <td className="px-3.5 py-3 font-bold text-indigo-600 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-700">
                      {l.total_days}
                    </td>
                    <td className="px-3.5 py-3 max-w-xs truncate text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                      {l.reason || 'None provided'}
                    </td>
                    <td className="px-3.5 py-3 border-r border-slate-200 dark:border-slate-700">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                          l.status === 'approved'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : l.status === 'rejected'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      {l.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleReview(l._id, 'approved')}
                            className="p-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition cursor-pointer shadow-xs"
                            title="Approve"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReview(l._id, 'rejected')}
                            className="p-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition cursor-pointer shadow-xs"
                            title="Reject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium italic">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 italic">
                    {loading ? 'Loading leave applications...' : 'No leave records found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, leaves.length)} of {leaves.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                    if (acc.length > 0 && typeof acc[acc.length - 1] === 'number' && (p as number) - (acc[acc.length - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                  }
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`min-w-[28px] h-7 px-2 text-xs font-bold rounded-lg border transition ${
                        page === p
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Apply for Leave</span>
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              {staffMembers.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Staff Member
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    {staffMembers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.username || s.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="casual">Casual Leave (CL)</option>
                  <option value="sick">Medical / Sick Leave (SL)</option>
                  <option value="privilege">Privilege Leave (PL)</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Total Days
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={totalDays}
                  onChange={(e) => setTotalDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the reason for leave..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-normal resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
