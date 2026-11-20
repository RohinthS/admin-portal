import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ReceiptModal, ReceiptInitialData } from '../components/ReceiptModal';
import { UserPlus, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const EnrollmentPage: React.FC<{ type?: 'training' | 'internship' }> = ({ type }) => {
  const { activeCompanyId } = useAuth();
  const [courseType, setCourseType] = useState<'training' | 'internship'>(type || 'training');

  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [courseId, setCourseId] = useState('');
  const [totalFees, setTotalFees] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [collegeName, setCollegeName] = useState('');
  const [qualification, setQualification] = useState('');

  // Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptInitialData | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (type) setCourseType(type);
  }, [type]);

  const loadData = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/enrollments', {
          params: { company_id: activeCompanyId, course_type: courseType },
        }),
      ]);
      setCourses(coursesRes.data || []);
      setEnrollments(enrollmentsRes.data || []);
    } catch (err) {
      console.error('Error loading data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId, courseType]);

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    const selected = courses.find((c) => c._id === id);
    if (selected) {
      setTotalFees(selected.fees || 0);
    }
  };

  const netFees = Math.max(0, totalFees - discount);
  const balance = Math.max(0, netFees - paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.post('/enrollments', {
        student_name: studentName,
        phone,
        email,
        course_type: courseType,
        course_id: courseId,
        company_id: activeCompanyId,
        total_fees: totalFees,
        discount,
        net_fees: netFees,
        paid_amount: paidAmount,
        college_name: collegeName,
        qualification,
      });

      setSuccessMsg('Enrollment registered successfully!');
      setStudentName('');
      setPhone('');
      setEmail('');
      setPaidAmount(0);
      setDiscount(0);

      if (res.data.auto_open_receipt && res.data.receipt_initial_data) {
        setReceiptData(res.data.receipt_initial_data);
        setReceiptModalOpen(true);
      }

      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit enrollment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Responsive Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight capitalize flex items-center gap-2">
            <span>{courseType} Enrollment</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Register students and record payment splits
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setCourseType('training')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
              courseType === 'training'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Training
          </button>
          <button
            onClick={() => setCourseType('internship')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
              courseType === 'internship'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Internship
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Enrollment Form */}
      <div className="p-5 sm:p-6 glass-card rounded-2xl">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-indigo-500" />
          <span>New {courseType.toUpperCase()} Candidate Registration</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Student Full Name *</label>
              <input
                type="text"
                required
                placeholder="Candidate name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Phone *</label>
              <input
                type="tel"
                required
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Course *</label>
              <select
                required
                value={courseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.course_name} (₹{c.fees})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">College / University</label>
              <input
                type="text"
                placeholder="College name"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Qualification</label>
              <input
                type="text"
                placeholder="Degree / Qualification"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Fee Calculation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Total Course Fee</label>
              <input
                type="number"
                min="0"
                value={totalFees || ''}
                onChange={(e) => setTotalFees(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-amber-600 dark:text-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Net Payable</label>
              <div className="px-3 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-indigo-600 dark:text-indigo-400">
                ₹{netFees.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Paid Amount (Advance) *</label>
              <input
                type="number"
                min="0"
                max={netFees}
                value={paidAmount || ''}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-xl text-sm font-black text-emerald-600 dark:text-emerald-400 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                Balance: ₹{balance.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {paidAmount > 0 ? (
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  ⚡ Auto Receipt Modal will open upon submitting to record payment split (Cash/UPI/Bank).
                </span>
              ) : (
                <span>No advance payment entered.</span>
              )}
            </p>

            <button
              type="submit"
              disabled={loading || !courseId}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/25 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Register Candidate'}
            </button>
          </div>
        </form>
      </div>

      {/* Enrollments Table with S.No, Borders & Pagination */}
      <div className="p-5 sm:p-6 glass-card rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Enrolled Candidates ({courseType})
          </h3>
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
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Enrollment No</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Student Name</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Phone</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Course</th>
                <th className="py-2.5 px-3 text-right border-b border-r border-slate-200 dark:border-slate-700">Net Fees</th>
                <th className="py-2.5 px-3 text-right border-b border-r border-slate-200 dark:border-slate-700">Paid</th>
                <th className="py-2.5 px-3 text-right border-b border-r border-slate-200 dark:border-slate-700">Balance</th>
                <th className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/50">
              {enrollments.slice((page - 1) * pageSize, page * pageSize).map((enr, idx) => {
                const serialNo = (page - 1) * pageSize + idx + 1;
                return (
                  <tr key={enr._id} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                      {serialNo}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-600 dark:text-sky-400 border-b border-r border-slate-200 dark:border-slate-700">
                      {enr.enrollment_no}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white border-b border-r border-slate-200 dark:border-slate-700">
                      {enr.student_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700">
                      {enr.phone || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-700">
                      {enr.course_id?.course_name || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold border-b border-r border-slate-200 dark:border-slate-700">
                      ₹{(enr.net_fees || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 border-b border-r border-slate-200 dark:border-slate-700">
                      ₹{(enr.paid_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-600 dark:text-amber-400 border-b border-r border-slate-200 dark:border-slate-700">
                      ₹{(enr.balance_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                        {enr.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    No enrolled candidates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {enrollments.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(page * pageSize, enrollments.length)} of {enrollments.length} entries
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
            {Array.from({ length: Math.min(5, Math.ceil(enrollments.length / pageSize) || 1) }, (_, i) => {
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
              disabled={page >= Math.ceil(enrollments.length / pageSize)}
              onClick={() => setPage(page + 1)}
              title="Next Page"
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-bold"
            >
              ›
            </button>
            <button
              disabled={page >= Math.ceil(enrollments.length / pageSize)}
              onClick={() => setPage(Math.ceil(enrollments.length / pageSize) || 1)}
              title="Last Page"
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-bold"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Auto Opened Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        initialData={receiptData}
        onClose={() => setReceiptModalOpen(false)}
        onSuccess={() => {
          setSuccessMsg('Receipt successfully generated & reconciled!');
          loadData();
        }}
      />
    </div>
  );
};
