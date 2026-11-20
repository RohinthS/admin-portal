import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  Plus,
  Calendar,
  CheckCircle2,
  FileText,
  X,
  MessageSquare,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

export const StudentDailyProcessPage: React.FC = () => {
  const { user, activeCompanyId } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoursSpent, setHoursSpent] = useState<number>(8);
  const [workDescription, setWorkDescription] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/student-dashboard', {
        params: { company_id: activeCompanyId },
      });
      setReports(res.data?.daily_reports || []);
    } catch (err) {
      console.error('Failed to load daily reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeCompanyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDescription.trim()) return;

    try {
      setSubmitting(true);
      await api.post('/daily-reports', {
        company_id: activeCompanyId,
        user_type: 'student',
        entity_id: user?.id,
        report_date: reportDate,
        work_description: workDescription.trim(),
        hours_spent: Number(hoursSpent),
      });
      setShowModal(false);
      setWorkDescription('');
      fetchReports();
    } catch (err) {
      console.error('Failed to submit daily report', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Daily Process & Work Reports</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              {reports.length} Logs
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log your daily learning activities, practical coding exercises, and submit process updates to your trainer
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-xs flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Report Daily Process</span>
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No daily logs submitted yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
            Record what you practiced today to keep track of your learning curve and maintain attendance credit.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Today's Log</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((rep, idx) => (
            <div
              key={rep._id || idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    {rep.report_date ? new Date(rep.report_date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }) : 'Today'}
                  </span>

                  <span className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {rep.hours_spent || 8} Hours Spent
                  </span>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      rep.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {rep.status === 'verified' ? 'Verified by Trainer' : 'Submitted'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {rep.work_description}
                </p>

                {rep.feedback && (
                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
                    <span className="font-extrabold text-indigo-900 block mb-0.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Trainer Feedback
                    </span>
                    <p className="text-indigo-800">{rep.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Daily Process Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Report Daily Process</h3>
                <p className="text-xs text-slate-500">Record your practical tasks & learning progress for today</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Report Date *</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    required
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hours Dedicated *</label>
                  <select
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(Number(e.target.value))}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value={2}>2 Hours</option>
                    <option value={4}>4 Hours</option>
                    <option value={6}>6 Hours</option>
                    <option value={8}>8 Hours (Full Day)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  What did you learn / accomplish today? *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the modules covered, code written, bugs debugged, or assignments completed..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !workDescription.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Daily Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
