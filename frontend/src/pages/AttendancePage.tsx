import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck, Save, CheckCircle2, Sparkles, UserCheck, AlertCircle } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { activeCompanyId } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [userType, setUserType] = useState<'staff' | 'student'>('staff');
  const [members, setMembers] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchMembersAndAttendance = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      const endpoint = userType === 'staff' ? '/payroll' : '/enrollments';
      const [membersRes, attendanceRes] = await Promise.all([
        api.get(endpoint, { params: { company_id: activeCompanyId } }).catch(() => ({ data: [] })),
        api.get('/attendance', {
          params: { company_id: activeCompanyId, date, user_type: userType },
        }).catch(() => ({ data: [] })),
      ]);

      let list = membersRes.data || [];
      // Fallback: If payroll has not been generated for the month yet, list staff from registered staff users
      if (userType === 'staff' && list.length === 0) {
        try {
          const usersRes = await api.get('/users', { params: { company_id: activeCompanyId } });
          const uList = usersRes.data || [];
          list = uList.filter((u: any) => u.user_type !== 'student');
        } catch {
          // ignore
        }
      }

      setMembers(list);

      const existingMap: Record<string, string> = {};
      attendanceRes.data?.forEach((a: any) => {
        existingMap[a.entity_id] = a.status;
      });

      // Default unmarked members to 'present'
      list.forEach((m: any) => {
        const id = m.staff_id?._id || m._id;
        if (!existingMap[id]) {
          existingMap[id] = 'present';
        }
      });

      setAttendanceMap(existingMap);
    } catch (err) {
      console.error('Failed to load attendance records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersAndAttendance();
  }, [activeCompanyId, date, userType]);

  const handleStatusChange = (id: string, status: string) => {
    setAttendanceMap((prev) => ({ ...prev, [id]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendanceMap).map(([entity_id, status]) => ({
        entity_id,
        status,
      }));

      const res = await api.post('/attendance/mark', {
        company_id: activeCompanyId,
        user_type: userType,
        attendance_date: date,
        records,
      });

      const awarded = res.data?.autoAwardedCount || 0;
      if (awarded > 0) {
        setSuccessMsg(
          `Attendance saved! ${awarded} student(s) reached the required threshold (≥85%) and automatically unlocked their monthly attendance bonus credits.`,
        );
      } else {
        setSuccessMsg('Attendance saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save attendance', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Daily Attendance Register</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mark daily attendance for staff employees and enrolled students
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Register'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Control Bar: Date Selector & Staff/Student Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 glass-card rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Date:</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setUserType('staff')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
              userType === 'staff'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Staff Members
          </button>
          <button
            onClick={() => setUserType('student')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
              userType === 'student'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Students
          </button>
        </div>
      </div>

      {/* Attendance Register Table */}
      <div className="p-5 sm:p-6 glass-card rounded-2xl space-y-4">
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 touch-scroll">
          <table className="w-full text-left text-xs min-w-[700px] border-collapse">
            <thead className="text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-slate-50/90 dark:bg-slate-800/90">
              <tr>
                <th className="py-2.5 px-3 text-center w-14 border-b border-r border-slate-200 dark:border-slate-700">S.NO</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Name</th>
                <th className="py-2.5 px-3 border-b border-r border-slate-200 dark:border-slate-700">Designation / Course</th>
                <th className="py-2.5 px-3 text-center border-b border-r border-slate-200 dark:border-slate-700">Present</th>
                <th className="py-2.5 px-3 text-center border-b border-r border-slate-200 dark:border-slate-700">Absent</th>
                <th className="py-2.5 px-3 text-center border-b border-r border-slate-200 dark:border-slate-700">Late</th>
                <th className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">Status Badge</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/50">
              {members.length > 0 ? (
                members.map((m, idx) => {
                  const id = m.staff_id?._id || m._id;
                  const name = m.staff_id?.staff_name || m.student_name || 'Member';
                  const subtitle = m.staff_id?.designation || m.course_id?.course_name || 'General';
                  const currentStatus = attendanceMap[id] || 'present';

                  return (
                    <tr key={id} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/50 transition">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white border-b border-r border-slate-200 dark:border-slate-700">{name}</td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700">{subtitle}</td>

                      {/* Present Radio */}
                      <td className="py-2.5 px-3 text-center border-b border-r border-slate-200 dark:border-slate-700">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${id}`}
                            value="present"
                            checked={currentStatus === 'present'}
                            onChange={() => handleStatusChange(id, 'present')}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* Absent Radio */}
                      <td className="py-2.5 px-3 text-center border-b border-r border-slate-200 dark:border-slate-700">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${id}`}
                            value="absent"
                            checked={currentStatus === 'absent'}
                            onChange={() => handleStatusChange(id, 'absent')}
                            className="w-4 h-4 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* Late Radio */}
                      <td className="py-2.5 px-3 text-center border-b border-r border-slate-200 dark:border-slate-700">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${id}`}
                            value="late"
                            checked={currentStatus === 'late'}
                            onChange={() => handleStatusChange(id, 'late')}
                            className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-3 text-center border-b border-slate-200 dark:border-slate-700">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                            currentStatus === 'present'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                              : currentStatus === 'absent'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    No members found for this category.
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
