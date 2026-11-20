import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  BookOpen,
  Calendar,
  CreditCard,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Download,
  Building,
  GraduationCap
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user, activeCompanyId } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports/student-dashboard', {
          params: { company_id: activeCompanyId },
        });
        setData(res.data);
      } catch (err) {
        console.error('Failed to load student profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [activeCompanyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const student = data?.student || {};
  const receipts = data?.receipts || [];
  const totalFees = student.total_fees || 0;
  const paidAmount = student.paid_amount || 0;
  const balanceAmount = student.balance_amount || Math.max(0, totalFees - paidAmount);
  const paymentPercentage = totalFees > 0 ? Math.min(100, Math.round((paidAmount / totalFees) * 100)) : 0;
  const isPaid = balanceAmount <= 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Profile Hero Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-600" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-2xl font-black text-white shadow-md">
              {student.name?.[0] || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {student.name || user?.name || 'Student Name'}
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {student.status || 'Active'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Role: Student</span>
                <span>•</span>
                <span className="font-mono text-indigo-600 font-bold">{student.enrollment_no || user?.username}</span>
              </p>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{student.branch} • {student.company_name}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 font-mono">
              ID: {user?.username}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Personal Info + Course Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-indigo-600" />
            <span>Personal Information</span>
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Full Name</span>
              <span className="font-bold text-slate-800">{student.name}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Student / Roll ID</span>
              <span className="font-mono font-bold text-indigo-600">{user?.username}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Enrollment Number</span>
              <span className="font-mono font-bold text-slate-800">{student.enrollment_no}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Mobile Number</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {student.phone || 'N/A'}
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Date of Joining</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {student.joining_date ? new Date(student.joining_date).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-start gap-4">
              <span className="text-slate-500 font-medium shrink-0">Address</span>
              <span className="font-semibold text-slate-800 text-right">{student.address || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Academic & Course Details */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-sky-600" />
            <span>Course & Academics</span>
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Enrolled Course</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                {student.course_name}
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Course Duration</span>
              <span className="font-bold text-slate-800">{student.course_duration}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Training Center</span>
              <span className="font-bold text-slate-800">{student.company_name}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Assigned Branch</span>
              <span className="font-bold text-slate-800">{student.branch}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Batch Schedule</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Regular Batch (Mon - Fri)
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-medium">Enrollment Status</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Student
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fee & Payment Summary Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Fee & Payment Status</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time ledger overview of tuition fees and payment receipts</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
            isPaid
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isPaid ? 'Fully Paid' : 'Payment Due'}
          </span>
        </div>

        {/* 3 Metric Sub-cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Course Fee</span>
            <p className="text-xl font-black text-slate-900 mt-1">₹{totalFees.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Amount Paid</span>
            <p className="text-xl font-black text-emerald-700 mt-1">₹{paidAmount.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Remaining Balance</span>
            <p className="text-xl font-black text-amber-700 mt-1">₹{balanceAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 mb-6">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Payment Progress</span>
            <span>{paymentPercentage}% Cleared</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/80">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${paymentPercentage}%` }}
            />
          </div>
        </div>

        {/* Payment Receipts History Table */}
        <div className="mt-6">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>Payment Receipts History</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-3 w-14 text-center border-r border-slate-200 dark:border-slate-700">S.NO</th>
                  <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">Receipt No</th>
                  <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">Date</th>
                  <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">Payment Mode</th>
                  <th className="px-4 py-3 text-right border-r border-slate-200 dark:border-slate-700">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400 font-medium">
                      No payment receipts recorded yet.
                    </td>
                  </tr>
                ) : (
                  receipts.map((r: any, idx: number) => (
                    <tr key={r._id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="px-3 py-3 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-700">{r.receipt_number || `REC-${idx + 1}`}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                        {r.receipt_date ? new Date(r.receipt_date).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 uppercase border-r border-slate-200 dark:border-slate-700">
                        {r.payment_mode || 'Cash / UPI'}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                        ₹{(r.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                          Confirmed
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
