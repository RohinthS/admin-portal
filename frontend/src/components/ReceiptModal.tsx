import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import api from '../api/client';

export interface ReceiptInitialData {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  course_type: 'training' | 'internship';
  paid_amount: number;
  total_amount: number;
  company_id: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData: ReceiptInitialData | null;
}

interface SplitRow {
  mode: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque';
  amount: number;
  reference_no?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  if (!isOpen || !initialData) return null;

  const [splits, setSplits] = useState<SplitRow[]>([
    { mode: 'cash', amount: initialData.paid_amount, reference_no: '' },
  ]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setSplits([
        { mode: 'cash', amount: initialData.paid_amount, reference_no: '' },
      ]);
      setError(null);
    }
  }, [initialData]);

  const currentTotal = splits.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const targetTotal = Number(initialData.total_amount) || 0;
  const isMatch = Math.abs(currentTotal - targetTotal) < 0.01;

  const handleAddSplit = () => {
    setSplits([...splits, { mode: 'upi', amount: 0, reference_no: '' }]);
  };

  const handleRemoveSplit = (index: number) => {
    if (splits.length <= 1) return;
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSplitChange = (index: number, field: keyof SplitRow, value: any) => {
    const next = [...splits];
    next[index] = { ...next[index], [field]: value };
    setSplits(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) {
      setError(`Split total (₹${currentTotal}) must exactly equal required amount (₹${targetTotal})`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/receipts', {
        enrollment_id: initialData.enrollment_id,
        company_id: initialData.company_id,
        course_type: initialData.course_type,
        total_amount: targetTotal,
        payment_splits: splits,
        remarks,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto touch-scroll">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Create Receipt</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Candidate: <span className="font-bold text-indigo-600 dark:text-indigo-400">{initialData.student_name}</span> ({initialData.course_type})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mt-4 text-xs text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/50 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Enrollment ID</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{initialData.enrollment_id}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Required Amount</span>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{targetTotal.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Modes Split</label>
              <button
                type="button"
                onClick={handleAddSplit}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Mode
              </button>
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 touch-scroll">
              {splits.map((s, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 sm:p-0 bg-slate-50 sm:bg-transparent dark:bg-slate-800/40 sm:dark:bg-transparent rounded-xl">
                  <select
                    value={s.mode}
                    onChange={(e) => handleSplitChange(idx, 'mode', e.target.value)}
                    className="w-full sm:w-1/3 px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="card">Card (Debit/Credit)</option>
                    <option value="bank_transfer">Net Banking / NEFT</option>
                    <option value="cheque">Cheque</option>
                  </select>

                  <div className="flex items-center gap-2 w-full sm:w-2/3">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Amount"
                      value={s.amount || ''}
                      onChange={(e) => handleSplitChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-1/2 px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      required
                    />

                    <input
                      type="text"
                      placeholder="Txn / Ref ID"
                      value={s.reference_no || ''}
                      onChange={(e) => handleSplitChange(idx, 'reference_no', e.target.value)}
                      className="w-1/2 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />

                    {splits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSplit(idx)}
                        className="p-2 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Banner */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold ${
              isMatch
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isMatch ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
              <span>Split Total: ₹{currentTotal.toLocaleString()} / ₹{targetTotal.toLocaleString()}</span>
            </div>
            <span>{isMatch ? 'Exact Match Valid' : `Diff: ₹${Math.abs(targetTotal - currentTotal).toLocaleString()}`}</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Remarks (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Initial advance payment at enrollment"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatch || loading}
              className={`px-5 py-2 text-xs font-bold rounded-xl text-white transition shadow-md ${
                isMatch && !loading
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/25'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Saving...' : 'Save & Print Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
