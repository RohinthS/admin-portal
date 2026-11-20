import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Plus, X, Search, Edit3, Printer, Trash2, Tag, FileText, Calendar, RotateCcw } from 'lucide-react';

// Date range helpers
const getThisMonthRange = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    from: `${y}-${m}-01`,
    to: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  };
};

const getLastMonthRange = () => {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const y = prev.getFullYear();
  const m = String(prev.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, prev.getMonth() + 1, 0).getDate();
  return {
    from: `${y}-${m}-01`,
    to: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  };
};

const getTodayRange = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const str = `${y}-${m}-${d}`;
  return { from: str, to: str };
};

export const ExpensesPage: React.FC = () => {
  const { activeCompanyId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'category' ? 'category' : 'entry';

  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Date & Filter states
  const initialRange = getThisMonthRange();
  const [activePreset, setActivePreset] = useState<'this_month' | 'last_month' | 'today' | 'all' | 'custom'>('this_month');
  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);
  const [selectedCatId, setSelectedCatId] = useState('');

  // Add Expense Entry Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [paymentLines, setPaymentLines] = useState<Array<{ mode: string; bank: string; amount: number }>>([
    { mode: 'cash', bank: '', amount: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  // Add Category Form State
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/expenses/categories');
      setCategories(res.data || []);
      if (res.data?.length > 0 && !categoryId) {
        setCategoryId(res.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params: any = { company_id: activeCompanyId };
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (selectedCatId) params.category_id = selectedCatId;
      const res = await api.get('/expenses', { params });
      setExpenses(res.data || []);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [activeCompanyId, fromDate, toDate, selectedCatId]);

  useEffect(() => {
    fetchCategories();
  }, [activeCompanyId]);

  const handlePresetChange = (preset: 'this_month' | 'last_month' | 'today' | 'all') => {
    setActivePreset(preset);
    setPage(1);
    if (preset === 'this_month') {
      const r = getThisMonthRange();
      setFromDate(r.from);
      setToDate(r.to);
    } else if (preset === 'last_month') {
      const r = getLastMonthRange();
      setFromDate(r.from);
      setToDate(r.to);
    } else if (preset === 'today') {
      const r = getTodayRange();
      setFromDate(r.from);
      setToDate(r.to);
    } else if (preset === 'all') {
      setFromDate('');
      setToDate('');
    }
  };

  const handleResetFilters = () => {
    handlePresetChange('this_month');
    setSelectedCatId('');
    setSearchQuery('');
  };

  const handleAddPaymentLine = () => {
    setPaymentLines([...paymentLines, { mode: 'cash', bank: '', amount: 0 }]);
  };

  const handleRemovePaymentLine = (idx: number) => {
    if (paymentLines.length > 1) {
      setPaymentLines(paymentLines.filter((_, i) => i !== idx));
    }
  };

  const totalModalAmount = paymentLines.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalModalAmount <= 0) {
      alert('Total expense amount must be greater than 0');
      return;
    }
    try {
      setSaving(true);
      await api.post('/expenses', {
        expense_date: expenseDate,
        category_id: categoryId,
        description,
        amount: totalModalAmount,
        payment_mode: paymentLines[0]?.mode || 'cash',
        payment_lines: paymentLines,
        company_id: activeCompanyId,
        reference_no: `EXP${Date.now().toString().slice(-6)}`,
      });
      setShowAddModal(false);
      setDescription('');
      setPaymentLines([{ mode: 'cash', bank: '', amount: 0 }]);
      fetchExpenses();
    } catch (err) {
      console.error('Failed to record expense', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/expenses/categories', {
        category_name: catName,
        description: catDesc,
        status: 1,
      });
      setShowCatModal(false);
      setCatName('');
      setCatDesc('');
      fetchCategories();
    } catch (err) {
      console.error('Failed to create category', err);
    } finally {
      setSaving(false);
    }
  };

  // Filtered entries
  const filteredEntries = expenses.filter((e) => {
    const q = searchQuery.toLowerCase();
    const entryNo = (e.reference_no || e.entry_number || (e._id ? `${e._id.slice(-6)}/26-27` : '')).toLowerCase();
    const desc = (e.description || e.title || '').toLowerCase();
    const cat = (e.category_id?.category_name || e.category || '').toLowerCase();
    const matchesSearch = entryNo.includes(q) || desc.includes(q) || cat.includes(q);

    // Client-side date safety filter
    const entryDateStr = e.expense_date ? e.expense_date.slice(0, 10) : '';
    let matchesDate = true;
    if (fromDate && entryDateStr) {
      matchesDate = matchesDate && entryDateStr >= fromDate;
    }
    if (toDate && entryDateStr) {
      matchesDate = matchesDate && entryDateStr <= toDate;
    }

    let matchesCategory = true;
    if (selectedCatId) {
      const catId = typeof e.category_id === 'object' ? e.category_id?._id : e.category_id;
      matchesCategory = catId === selectedCatId;
    }

    return matchesSearch && matchesDate && matchesCategory;
  });

  const totalFilteredAmount = filteredEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalEntries = filteredEntries.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedEntries = filteredEntries.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      {/* Tab Switcher & Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-sky-600 tracking-tight">
            {currentTab === 'category' ? 'Active Expense Categories' : 'Active Expense Entries'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentTab === 'category'
              ? 'Define expense classification categories'
              : 'Submit and manage operating vouchers and branch disbursements'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSearchParams({ tab: 'entry' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentTab === 'entry'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Expense Entry</span>
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'category' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentTab === 'category'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Expense Category</span>
            </button>
          </div>

          {currentTab === 'entry' ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Expense Entry</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCatModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Category</span>
            </button>
          )}
        </div>
      </div>

      {currentTab === 'entry' ? (
        /* =================== TAB 1: EXPENSE ENTRIES (MATCHING IMAGE 1) =================== */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          {/* Top Filter Bar: Date Range, Presets & Total Amount */}
          <div className="bg-gradient-to-r from-sky-50/70 via-slate-50 to-slate-50/80 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/80 border border-sky-100 dark:border-slate-700/80 rounded-xl p-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 shadow-2xs">
            {/* Left Controls: Presets & Date Inputs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 mr-0.5">
                <Calendar className="w-4 h-4 text-sky-500" />
                <span>Date:</span>
              </div>

              {/* Quick Presets */}
              <div className="inline-flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handlePresetChange('this_month')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    activePreset === 'this_month'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('last_month')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    activePreset === 'last_month'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('today')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    activePreset === 'today'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    activePreset === 'all'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  All
                </button>
              </div>

              {/* Custom Date Pickers */}
              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400">From</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setActivePreset('custom');
                      setPage(1);
                    }}
                    className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>
                <span className="text-slate-400 font-semibold text-xs">to</span>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400">To</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setActivePreset('custom');
                      setPage(1);
                    }}
                    className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 shadow-2xs">
                <select
                  value={selectedCatId}
                  onChange={(e) => {
                    setSelectedCatId(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Button */}
              {(fromDate !== initialRange.from || toDate !== initialRange.to || selectedCatId || activePreset !== 'this_month') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  title="Reset to This Month"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Right Summary: Total Expenses */}
            <div className="flex items-center gap-2 self-start xl:self-auto shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {activePreset === 'this_month'
                  ? 'This Month Total:'
                  : activePreset === 'last_month'
                  ? 'Last Month Total:'
                  : activePreset === 'today'
                  ? "Today's Total:"
                  : 'Filtered Total:'}
              </span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                ₹{totalFilteredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                ({filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'})
              </span>
            </div>
          </div>
          {/* Controls: Page size & Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
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
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search expense entry..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl focus:outline-none focus:border-sky-500 w-64"
              />
            </div>
          </div>

          {/* Table (Matching Image 1 + S.No + Full Borders) */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 touch-scroll">
            <table className="w-full text-left text-xs min-w-[800px] border-collapse">
              <thead className="text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-slate-50/90 dark:bg-slate-800/90">
                <tr>
                  <th className="py-3 px-3 text-center w-14 border-b border-r border-slate-200 dark:border-slate-700">S.NO</th>
                  <th className="py-3 px-3 border-b border-r border-slate-200 dark:border-slate-700">EXPENSE ENTRY NO</th>
                  <th className="py-3 px-3 border-b border-r border-slate-200 dark:border-slate-700">EXPENSE ENTRY DATE</th>
                  <th className="py-3 px-3 border-b border-r border-slate-200 dark:border-slate-700">EXPENSE CATEGORY NAME</th>
                  <th className="py-3 px-3 border-b border-r border-slate-200 dark:border-slate-700">TOTAL AMOUNT</th>
                  <th className="py-3 px-3 border-b border-r border-slate-200 dark:border-slate-700">ATTACHMENTS</th>
                  <th className="py-3 px-3 text-center border-b border-slate-200 dark:border-slate-700">ACTION</th>
                </tr>
              </thead>
              <tbody className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      Loading expense entries...
                    </td>
                  </tr>
                ) : paginatedEntries.length > 0 ? (
                  paginatedEntries.map((e, idx) => {
                    const serialNo = (page - 1) * pageSize + idx + 1;
                    const entryNo = e.reference_no || e.entry_number || (e._id ? `${e._id.slice(-6)}/26-27` : 'N/A');
                    const categoryName = e.category_id?.category_name || e.category || 'General';
                    const amount = Number(e.amount || 0);
                    const formattedDate = e.expense_date
                      ? new Date(e.expense_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : 'N/A';

                    return (
                      <tr key={e._id} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/60 transition">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                          {serialNo}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-sky-600 dark:text-sky-400 border-b border-r border-slate-200 dark:border-slate-700">
                          {entryNo}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-700">
                          {formattedDate}
                        </td>
                        <td className="py-2.5 px-3 capitalize text-slate-800 dark:text-slate-200 font-medium border-b border-r border-slate-200 dark:border-slate-700">
                          {categoryName}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 border-b border-r border-slate-200 dark:border-slate-700">
                          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 border-b border-r border-slate-200 dark:border-slate-700">
                          -
                        </td>
                        <td className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => alert(`Edit entry: ${entryNo}`)}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-md shadow-2xs transition cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-cyan-500 hover:bg-cyan-600 rounded-md shadow-2xs transition cursor-pointer"
                            >
                              Print
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${entryNo}?`)) {
                                  // delete callback
                                }
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-md shadow-2xs transition cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      No expense entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
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
                let p = i + 1;
                if (totalPages > 5 && page > 3) {
                  p = Math.min(page - 3 + i, totalPages - 4 + i);
                }
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
      ) : (
        /* =================== TAB 2: EXPENSE CATEGORIES =================== */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 touch-scroll">
            <table className="w-full text-left text-xs min-w-[650px] border-collapse">
              <thead className="text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-slate-50/90 dark:bg-slate-800/90">
                <tr>
                  <th className="py-3 px-3 text-center w-14 border-b border-r border-slate-200 dark:border-slate-700">S.NO</th>
                  <th className="py-3 px-3 border-b border-r border-slate-200 dark:border-slate-700">CATEGORY NAME</th>
                  <th className="py-3 px-3 border-b border-r border-slate-200 dark:border-slate-700">DESCRIPTION</th>
                  <th className="py-3 px-3 border-b border-slate-200 dark:border-slate-700">STATUS</th>
                </tr>
              </thead>
              <tbody className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/50">
                {categories.length > 0 ? (
                  categories.map((c, idx) => (
                    <tr key={c._id} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/60 transition">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold capitalize text-slate-900 dark:text-slate-100 border-b border-r border-slate-200 dark:border-slate-700">
                        {c.category_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-700">
                        {c.description || '-'}
                      </td>
                      <td className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================== MODAL: ADD EXPENSE ENTRY (MATCHING IMAGE 2) =================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-h-[92vh] overflow-y-auto touch-scroll">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">New expense_entry</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    expense_entry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Type *
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter details of expense voucher..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Attachments Dropzone (Matching Image 2) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attachments</label>
                <div className="border-2 border-dashed border-sky-300 rounded-xl p-4 text-center bg-sky-50/40 hover:bg-sky-50 transition cursor-pointer">
                  <div className="text-sky-500 text-2xl mb-1">☁</div>
                  <p className="text-xs font-semibold text-slate-700">Click to browse or drag & drop files here</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Allowed: jpg, jpeg, png, webp, pdf, doc, docx</p>
                </div>
              </div>

              {/* Payment Details Table (Matching Image 2) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-600">Payment Details *</label>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">S.NO</th>
                        <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">PAYMENT MODE</th>
                        <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">BANK</th>
                        <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">AMOUNT</th>
                        <th className="py-2 px-3 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paymentLines.map((line, idx) => (
                        <tr key={idx} className="bg-white dark:bg-slate-900">
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-bold border-r border-slate-200 dark:border-slate-700">{idx + 1}</td>
                          <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">
                            <select
                              value={line.mode}
                              onChange={(e) => {
                                const updated = [...paymentLines];
                                updated[idx].mode = e.target.value;
                                setPaymentLines(updated);
                              }}
                              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                            >
                              <option value="cash">Cash</option>
                              <option value="bank">Bank / Cheque</option>
                              <option value="upi">UPI / Online</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">
                            <input
                              type="text"
                              placeholder="-"
                              value={line.bank}
                              onChange={(e) => {
                                const updated = [...paymentLines];
                                updated[idx].bank = e.target.value;
                                setPaymentLines(updated);
                              }}
                              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200 w-28 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">
                            <input
                              type="number"
                              min="0"
                              value={line.amount || ''}
                              onChange={(e) => {
                                const updated = [...paymentLines];
                                updated[idx].amount = Number(e.target.value);
                                setPaymentLines(updated);
                              }}
                              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200 w-28 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePaymentLine(idx)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-[10px] font-bold hover:bg-red-600 transition cursor-pointer"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center text-xs font-bold border-t border-slate-200 dark:border-slate-700 px-4 text-slate-900 dark:text-slate-100">
                    <span>Total Amount</span>
                    <span className="text-sky-600 font-black">₹{totalModalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddPaymentLine}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    Add Payment Line
                  </button>
                </div>
              </div>

              <div className="flex justify-start gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Add expense entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== MODAL: ADD CATEGORY =================== */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add New Category</h3>
              <button onClick={() => setShowCatModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. advertisement, office rent"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional description..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-xs transition"
                >
                  {saving ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
