import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import logoImg from '../wegrow&Bschool.webp';
import mascotImg from '../bdt_asset_3.webp';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, token, login } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to home
  useEffect(() => {
    if (token && user) {
      navigate('/', { replace: true });
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ username, password }, rememberMe);
      navigate('/');
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to backend server. Please make sure the backend is running on port 5000.');
      } else if (err.response.status === 500) {
        setError(err.response.data?.message || 'Database connection error. Please ensure MongoDB is running and reachable.');
      } else {
        setError(err.response.data?.message || 'Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-[#080c16] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ================= LEFT SIDE: BRANDED HERO WITH MASCOT ================= */}
      <div className="w-full lg:w-1/2 bg-[#07132b] text-white flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative overflow-hidden shrink-0">
        {/* Subtle dot matrix background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient glow effects */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-orange-600/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header: Official WeGrow Logo Badge */}
        <div className="relative z-10">
          <div className="inline-block bg-white p-2.5 sm:p-3 rounded-2xl shadow-lg border border-white/20">
            <img
              src={logoImg}
              alt="WeGrow Skill Campus & B School"
              className="h-9 sm:h-11 w-auto object-contain"
            />
          </div>
        </div>

        {/* Center: 3D Squirrel Mascot & Console Headline */}
        <div className="relative z-10 flex flex-col items-center text-center my-8 lg:my-auto max-w-lg mx-auto">
          {/* Mascot Image */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent rounded-full blur-2xl transform scale-90" />
            <img
              src={mascotImg}
              alt="WeGrow Mascot"
              className="w-48 sm:w-56 lg:w-64 h-auto object-contain drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Badge Pill */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-slate-700 bg-slate-800/80 backdrop-blur-sm text-[11px] font-extrabold tracking-widest text-slate-200 uppercase mb-4 shadow-sm">
            STUDENT & CAMPUS ERP CONSOLE
          </div>

          {/* Headline */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-snug tracking-tight">
            Courses, attendance, daily reports and performance — for every student and staff.
          </h1>

          {/* Descriptive Subtext */}
          <p className="text-xs sm:text-sm text-slate-400 mt-3.5 leading-relaxed max-w-md">
            Access training courses, submit daily work logs, take assessments, track fee payments, and manage campus operations in one place.
          </p>
        </div>

        {/* Footer info (Desktop only) */}
        <div className="relative z-10 hidden lg:flex items-center justify-between text-[11px] text-slate-500 pt-6 border-t border-slate-800/60">
          <span>&copy; {new Date().getFullYear()} WeGrow Skill Campus</span>
          <span className="font-mono">Enterprise Edition v2.0</span>
        </div>
      </div>

      {/* ================= RIGHT SIDE: SIGN IN MENU / FORM ================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white dark:bg-[#0c1222] min-h-[500px]">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Enter your student or staff credentials to continue.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3.5 mb-6 text-xs text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 rounded-xl animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field: Student ID / Work Email / Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Student ID / Work Email / Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your student ID, email or username"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition font-medium"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options Row: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 dark:border-slate-700"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setError('Password reset instructions sent to branch administrator.')}
                className="font-bold text-[#ea580c] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button (Vibrant Orange as in reference design) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 active:scale-[0.99] transition duration-150 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Notice Footer */}
          <div className="mt-8 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Campus portal access — secure login for students, faculty, and administrators.</span>
          </div>

          {/* Quick Demo Credentials for Fast Testing */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-2.5 tracking-wider">
              1-Click Quick Fill Credentials:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="p-2 rounded-xl text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 border border-slate-200 dark:border-slate-700 transition"
              >
                <span className="block font-bold text-slate-900 dark:text-white">Admin</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">admin123</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('ENT036/26-27', 'Student@123')}
                className="p-2 rounded-xl text-left bg-pink-50 dark:bg-pink-950/60 hover:bg-pink-100 dark:hover:bg-pink-900/60 border border-pink-200 dark:border-pink-800 transition"
              >
                <span className="block font-bold text-pink-900 dark:text-pink-200">Meena</span>
                <span className="text-[10px] text-pink-600 dark:text-pink-400 font-mono">ENT036/26-27</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('ENT011/26-27', 'Student@123')}
                className="p-2 rounded-xl text-left bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition"
              >
                <span className="block font-bold text-emerald-900 dark:text-emerald-200">Naresh</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">ENT011/26-27</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('WG-2026-001', 'Student@123')}
                className="p-2 rounded-xl text-left bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition"
              >
                <span className="block font-bold text-indigo-900 dark:text-indigo-200">Student 1</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">WG-2026-001</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
