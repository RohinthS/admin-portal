import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Search, Printer, Sparkles } from 'lucide-react';

export const ReceiptsPage: React.FC = () => {
  const { activeCompanyId } = useAuth();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const res = await api.get('/receipts', {
          params: { company_id: activeCompanyId },
        });
        setReceipts(res.data || []);
      } catch (err) {
        console.error('Failed to load receipts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, [activeCompanyId]);

  const filtered = receipts.filter((r) => {
    const term = searchTerm.toLowerCase();
    const studentName = r.enrollment_id?.student_name?.toLowerCase() || '';
    const receiptNo = r.receipt_no?.toLowerCase() || '';
    return studentName.includes(term) || receiptNo.includes(term);
  });

  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Receipts & Payments</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View student fee collections and multi-mode payment splits
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or receipt no..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
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
          <table className="w-full text-left text-xs min-w-[750px] border-collapse">
            <thead className="text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-slate-50/90 dark:bg-slate-800/90">
              <tr>
                <th className="py-2.5 px-3 text-center w-14 border-b border-r border-slate-200 dark:border-slate-700">S.NO</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Receipt No</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Date</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Student Name</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Type</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Payment Split Modes</th>
                <th className="py-2.5 px-3 text-right border-b border-r border-slate-200 dark:border-slate-700">Total Amount</th>
                <th className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/50">
              {paginated.map((r, idx) => {
                const serialNo = (page - 1) * pageSize + idx + 1;
                return (
                  <tr key={r._id} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                      {serialNo}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-600 dark:text-sky-400 border-b border-r border-slate-200 dark:border-slate-700">
                      {r.receipt_no}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700">
                      {new Date(r.receipt_date).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white border-b border-r border-slate-200 dark:border-slate-700">
                      {r.enrollment_id?.student_name || 'Direct / Walk-in'}
                    </td>
                    <td className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {r.course_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">
                      <div className="flex flex-wrap gap-1.5">
                        {r.payment_splits?.map((split: any, sIdx: number) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {split.mode.toUpperCase()}: ₹{split.amount}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm border-b border-r border-slate-200 dark:border-slate-700">
                      ₹{r.total_amount?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => window.print()}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Print A5 Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    No receipts found.
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
    </div>
  );
};
