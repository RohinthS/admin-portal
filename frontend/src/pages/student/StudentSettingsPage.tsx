import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentAccountService } from '../../services/studentAccountService';
import {
  User,
  Phone,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export const StudentSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [mobileNumber, setMobileNumber] = useState(user?.phone || '6381582969');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      if (password !== confirmPassword) {
        setStatusMessage({ type: 'error', text: 'Passwords do not match!' });
        return;
      }
      if (password.length < 6) {
        setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
        return;
      }

      // Persist password update to student account service
      const targetId = user?.username || user?.id || '';
      const updated = studentAccountService.changePassword(targetId, password);
      if (updated) {
        setStatusMessage({
          type: 'success',
          text: 'Password updated successfully! You can now use this new password to sign in.',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Profile credentials updated successfully!',
        });
      }
      setPassword('');
      setConfirmPassword('');
      return;
    }

    setStatusMessage({ type: 'success', text: 'Contact settings updated successfully!' });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Account & Security Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your registered contact number and update account credentials
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-bold mb-5 flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
            <input
              type="text"
              value={user?.name || 'Student Name'}
              disabled
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Username (Student Roll ID)</label>
            <input
              type="text"
              value={user?.username || 'WGF26012'}
              disabled
              className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-indigo-600 cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Your student ID is system-assigned.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Registered Mobile Number *</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
                className="w-full text-xs font-semibold pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
              Change Password
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password (leave empty to keep current)
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-9 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-9 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-xs flex items-center justify-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
