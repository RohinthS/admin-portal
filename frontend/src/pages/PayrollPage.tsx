import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Wallet, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { activeCompanyId } = useAuth();
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payroll', {
        params: { company_id: activeCompanyId, month, year },
      });
      setPayroll(res.data || []);
    } catch (err) {
      console.error('Failed to load payroll', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [activeCompanyId, month, year]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setSuccessMsg(null);
      await api.post('/payroll/generate', {
        company_id: activeCompanyId,
        month,
        year,
      });
      setSuccessMsg(`Payroll calculation processed for ${month}/${year}!`);
      fetchPayroll();
    } catch (err) {
      console.error('Failed to calculate payroll', err);
    } finally {
      setGenerating(false);
    }
  };

  const totalPayout = payroll.reduce((acc, curr) => acc + (Number(curr.net_salary) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Staff Payroll & Salaries</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated monthly salary computations based on attendance and deductions
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition disabled:opacity-50"
        >
          <Wallet className="w-4 h-4" />
          <span>{generating ? 'Processing...' : 'Run Month Payroll'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and stats */}
      <div className="p-4 glass-card rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Period:</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>Month {m}</option>
            ))}
          </select>

          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold mr-2">Disbursement Total:</span>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{totalPayout.toLocaleString()}</span>
        </div>
      </div>

      {/* Table */}
      <div className="p-5 sm:p-6 glass-card rounded-2xl space-y-4">
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 touch-scroll">
          <table className="w-full text-left text-xs min-w-[700px] border-collapse">
            <thead className="text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-slate-50/90 dark:bg-slate-800/90">
              <tr>
                <th className="py-2.5 px-3 text-center w-14 border-b border-r border-slate-200 dark:border-slate-700">S.NO</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Staff Member</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Designation</th>
                <th className="py-2.5 px-3 text-right border-b border-r border-slate-200 dark:border-slate-700">Basic Pay</th>
                <th className="py-2.5 px-3 text-right border-b border-r border-slate-200 dark:border-slate-700">Deductions</th>
                <th className="py-2.5 px-3 text-right border-b border-r border-slate-200 dark:border-slate-700">Net Salary</th>
                <th className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/50">
              {payroll.length > 0 ? (
                payroll.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white border-b border-r border-slate-200 dark:border-slate-700">{p.staff_id?.staff_name || 'Staff Employee'}</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700">{p.staff_id?.designation || 'Instructor'}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-700 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-700">₹{Number(p.basic_salary || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-600 dark:text-rose-400 border-b border-r border-slate-200 dark:border-slate-700">₹{Number(p.deductions || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 border-b border-r border-slate-200 dark:border-slate-700">₹{Number(p.net_salary || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                        {p.status || 'Generated'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    No payroll records computed for this period. Click "Run Month Payroll" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
