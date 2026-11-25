import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  X,
  Building,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Briefcase,
  ShieldCheck,
  Edit3,
  User,
  Users,
} from 'lucide-react';

interface StaffData {
  _id?: string;
  staff_name: string;
  emp_code?: string;
  designation?: string;
  department?: string;
  role_id?: any;
  role_name?: string;
  email?: string;
  phone?: string;
  salary?: number;
  doj?: string;
}

export const PayrollPage: React.FC = () => {
  const { activeCompanyId } = useAuth();
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available Roles for dropdown
  const [roles, setRoles] = useState<any[]>([]);

  // Add Staff Modal state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    staff_name: '',
    emp_code: '',
    role_id: '',
    role_name: 'Instructor',
    designation: 'Instructor',
    department: 'Academics',
    salary: '',
    email: '',
    phone: '',
    doj: new Date().toISOString().split('T')[0],
  });

  // Edit Payroll Modal state
  const [editingPayroll, setEditingPayroll] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    deductions: 0,
    allowances: 0,
    payment_status: 'unpaid',
    payment_mode: 'Bank Transfer',
  });
  const [updatingPayroll, setUpdatingPayroll] = useState(false);

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

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data || []);
    } catch (err) {
      console.warn('Could not fetch roles for staff modal', err);
    }
  };

  useEffect(() => {
    fetchPayroll();
    fetchRoles();
  }, [activeCompanyId, month, year]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setSuccessMsg(null);
      setErrorMsg(null);
      await api.post('/payroll/generate', {
        company_id: activeCompanyId,
        month,
        year,
      });
      setSuccessMsg(`Payroll calculation processed for ${month}/${year}!`);
      fetchPayroll();
    } catch (err: any) {
      console.error('Failed to calculate payroll', err);
      setErrorMsg(err.response?.data?.message || 'Failed to calculate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.staff_name.trim()) return;

    try {
      setSubmittingStaff(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      await api.post('/staff', {
        company_id: activeCompanyId,
        staff_name: newStaff.staff_name.trim(),
        emp_code: newStaff.emp_code.trim() || `EMP-${Date.now().toString().slice(-4)}`,
        role_id: newStaff.role_id || undefined,
        role_name: newStaff.role_name,
        designation: newStaff.designation.trim() || 'Instructor',
        department: newStaff.department.trim() || 'Academics',
        salary: Number(newStaff.salary) || 0,
        email: newStaff.email.trim(),
        phone: newStaff.phone.trim(),
        doj: newStaff.doj,
      });

      setSuccessMsg(`Staff member "${newStaff.staff_name}" added and enrolled into payroll!`);
      setShowAddStaffModal(false);
      setNewStaff({
        staff_name: '',
        emp_code: '',
        role_id: '',
        role_name: 'Instructor',
        designation: 'Instructor',
        department: 'Academics',
        salary: '',
        email: '',
        phone: '',
        doj: new Date().toISOString().split('T')[0],
      });
      fetchPayroll();
    } catch (err: any) {
      console.error('Failed to create staff member', err);
      setErrorMsg(err.response?.data?.message || 'Failed to create staff member');
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleOpenEdit = (p: any) => {
    setEditingPayroll(p);
    setEditForm({
      deductions: Number(p.deductions) || 0,
      allowances: Number(p.allowances) || 0,
      payment_status: p.payment_status || 'unpaid',
      payment_mode: p.payment_mode || 'Bank Transfer',
    });
  };

  const handleUpdatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll) return;

    try {
      setUpdatingPayroll(true);
      await api.put(`/payroll/${editingPayroll._id}`, editForm);
      setSuccessMsg('Payroll salary & deductions updated successfully!');
      setEditingPayroll(null);
      fetchPayroll();
    } catch (err: any) {
      console.error('Failed to update payroll', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update payroll item');
    } finally {
      setUpdatingPayroll(false);
    }
  };

  const totalPayout = payroll.reduce((acc, curr) => acc + (Number(curr.net_salary) || 0), 0);
  const totalDeductions = payroll.reduce((acc, curr) => acc + (Number(curr.deductions) || 0), 0);

  const getRoleBadgeColor = (roleName: string) => {
    const r = roleName.toLowerCase();
    if (r.includes('admin') || r.includes('director')) return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
    if (r.includes('manager')) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
    if (r.includes('lead') || r.includes('senior')) return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60';
    if (r.includes('instructor') || r.includes('faculty') || r.includes('trainer')) return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60';
  };

  return (
    <div className="space-y-6">
      {/* Header and Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Staff Payroll & Salaries</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated monthly salary computations with full staff role & designation management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 active:scale-[0.98] transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>{generating ? 'Processing...' : 'Run Month Payroll'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between p-3.5 text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between p-3.5 text-xs text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Period Selector */}
        <div className="p-4 glass-card rounded-2xl flex items-center justify-between col-span-1 md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Period:</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {[
                'January (1)', 'February (2)', 'March (3)', 'April (4)', 'May (5)', 'June (6)',
                'July (7)', 'August (8)', 'September (9)', 'October (10)', 'November (11)', 'December (12)',
              ].map((mName, idx) => (
                <option key={idx + 1} value={idx + 1}>{mName}</option>
              ))}
            </select>

            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Staff</span>
            <span className="text-base font-black text-slate-800 dark:text-slate-100">{payroll.length} Members</span>
          </div>
        </div>

        {/* Total Deductions */}
        <div className="p-4 glass-card rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Deductions</span>
            <span className="text-base font-black text-rose-500">₹{totalDeductions.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center font-bold">
            ₹
          </div>
        </div>

        {/* Disbursement Total */}
        <div className="p-4 glass-card rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Disbursement Total</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{totalPayout.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table with Complete Staff Details & Role */}
      <div className="p-5 sm:p-6 glass-card rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-500" />
            <span>Staff Payroll Records with Role & Designation</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold font-mono">
            {month}/{year} Computations
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 touch-scroll">
          <table className="w-full text-left text-xs min-w-[850px] border-collapse">
            <thead className="text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-slate-50/90 dark:bg-slate-800/90">
              <tr>
                <th className="py-3 px-3 text-center w-14 border-b border-r border-slate-200 dark:border-slate-700">S.NO</th>
                <th className="py-3 px-3 border-b border-r border-slate-200 dark:border-slate-700">Staff Member</th>
                <th className="py-3 px-3 border-b border-r border-slate-200 dark:border-slate-700">Role & Designation</th>
                <th className="py-3 px-3 border-b border-r border-slate-200 dark:border-slate-700">Department</th>
                <th className="py-3 px-3 text-right border-b border-r border-slate-200 dark:border-slate-700">Basic Pay</th>
                <th className="py-3 px-3 text-right border-b border-r border-slate-200 dark:border-slate-700">Deductions</th>
                <th className="py-3 px-3 text-right border-b border-r border-slate-200 dark:border-slate-700">Net Salary</th>
                <th className="py-3 px-3 text-center border-b border-r border-slate-200 dark:border-slate-700">Status</th>
                <th className="py-3 px-3 text-center border-b border-slate-200 dark:border-slate-700 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/50">
              {payroll.length > 0 ? (
                payroll.map((p, idx) => {
                  const staff = p.staff_id || {};
                  const staffName = staff.staff_name || 'Staff Employee';
                  const empCode = staff.emp_code || `EMP-${String(idx + 1).padStart(3, '0')}`;
                  const roleName = staff.role_id?.role_name || staff.role_name || 'Faculty / Instructor';
                  const designation = staff.designation || 'Instructor';
                  const department = staff.department || 'Academics';
                  const basic = Number(p.basic_salary || staff.salary || 0);
                  const deductions = Number(p.deductions || 0);
                  const net = Number(p.net_salary || basic - deductions);

                  return (
                    <tr key={p._id} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-3 text-center font-bold text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                        {idx + 1}
                      </td>

                      {/* Staff Member with Avatar and Emp Code */}
                      <td className="py-3 px-3 border-b border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                            {staffName[0]}
                          </div>
                          <div className="truncate">
                            <p className="font-extrabold text-slate-900 dark:text-white truncate">{staffName}</p>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                              {empCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role and Designation */}
                      <td className="py-3 px-3 border-b border-r border-slate-200 dark:border-slate-700">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getRoleBadgeColor(roleName)}`}>
                            {roleName}
                          </span>
                          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                            {designation}
                          </p>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700">
                        <span className="font-semibold">{department}</span>
                        {staff.email && (
                          <p className="text-[10px] text-slate-400 truncate font-mono">{staff.email}</p>
                        )}
                      </td>

                      {/* Basic Pay */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-700">
                        ₹{basic.toLocaleString()}
                      </td>

                      {/* Deductions */}
                      <td className="py-3 px-3 text-right font-semibold text-rose-600 dark:text-rose-400 border-b border-r border-slate-200 dark:border-slate-700">
                        ₹{deductions.toLocaleString()}
                      </td>

                      {/* Net Salary */}
                      <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 border-b border-r border-slate-200 dark:border-slate-700">
                        ₹{net.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center border-b border-r border-slate-200 dark:border-slate-700">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                          p.payment_status === 'paid'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-600/40'
                            : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-600/40'
                        }`}>
                          {p.payment_status === 'paid' ? 'PAID' : (p.status || 'GENERATED')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center border-b border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Salary / Deductions"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <p className="font-semibold">No payroll records computed for this period.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Click "Run Month Payroll" above or click "Add Staff Member" to add a staff profile.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Member Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Staff Member & Enroll to Payroll</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Creates staff record with role and assigns basic salary</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddStaffSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Staff Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Staff Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Kumar"
                    value={newStaff.staff_name}
                    onChange={(e) => setNewStaff({ ...newStaff, staff_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Employee Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Employee Code / ID</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-101 (optional)"
                    value={newStaff.emp_code}
                    onChange={(e) => setNewStaff({ ...newStaff, emp_code: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Role *</label>
                  <select
                    value={newStaff.role_name}
                    onChange={(e) => {
                      const selectedRole = roles.find((r) => r.role_name === e.target.value);
                      setNewStaff({
                        ...newStaff,
                        role_name: e.target.value,
                        role_id: selectedRole?._id || '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Instructor">Instructor / Faculty</option>
                    <option value="Senior Faculty">Senior Faculty</option>
                    <option value="Academic Staff">Academic Staff</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Super Administrator">Super Administrator</option>
                    <option value="Staff Member">Staff Member</option>
                    {roles.map((r) => (
                      <option key={r._id} value={r.role_name}>
                        {r.role_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Instructor / Assistant Professor"
                    value={newStaff.designation}
                    onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science / Academics"
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Monthly Basic Salary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Monthly Basic Salary (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 25000"
                    value={newStaff.salary}
                    onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Date of Joining */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date of Joining</label>
                  <input
                    type="date"
                    value={newStaff.doj}
                    onChange={(e) => setNewStaff({ ...newStaff, doj: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. staff@wegrow.edu"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                >
                  {submittingStaff ? 'Enrolling...' : 'Save & Enroll into Payroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payroll Modal */}
      {editingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Update Payroll: {editingPayroll.staff_id?.staff_name || 'Staff Employee'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Adjust deductions, allowances & payment status for {month}/{year}
                </p>
              </div>
              <button
                onClick={() => setEditingPayroll(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePayroll} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Basic Pay (Read-only)</label>
                <input
                  type="text"
                  disabled
                  value={`₹${Number(editingPayroll.basic_salary || 0).toLocaleString()}`}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Allowances / Bonus (₹)</label>
                  <input
                    type="number"
                    value={editForm.allowances}
                    onChange={(e) => setEditForm({ ...editForm, allowances: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deductions (₹)</label>
                  <input
                    type="number"
                    value={editForm.deductions}
                    onChange={(e) => setEditForm({ ...editForm, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Status</label>
                <select
                  value={editForm.payment_status}
                  onChange={(e) => setEditForm({ ...editForm, payment_status: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="unpaid">Unpaid / Generated</option>
                  <option value="paid">Paid / Disbursed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Mode</label>
                <select
                  value={editForm.payment_mode}
                  onChange={(e) => setEditForm({ ...editForm, payment_mode: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI / GooglePay</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              {/* Net Salary Preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500">Calculated Net Pay:</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  ₹{Math.max(0, Number(editingPayroll.basic_salary || 0) + editForm.allowances - editForm.deductions).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPayroll(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPayroll}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                >
                  {updatingPayroll ? 'Saving...' : 'Update Payroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
