import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck, UserCheck, Briefcase, Award, GraduationCap } from 'lucide-react';
import logoImg from '../wegrow&Bschool.webp';
import mascotImg from '../bdt_asset_3.webp';

interface RoleOption {
  id: string;
  name: string;
  badge: string;
  userVal: string;
  passVal: string;
  iconBg: string;
  color: string;
}

const AVAILABLE_ROLES: RoleOption[] = [
  { id: 'admin', name: 'Admin', badge: 'Superuser', userVal: 'admin', passVal: 'admin123', iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800', color: 'indigo' },
  { id: 'manager', name: 'Manager', badge: 'Operations', userVal: 'manager', passVal: 'Manager@123', iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800', color: 'blue' },
  { id: 'gm', name: 'GM', badge: 'General Mgr', userVal: 'gm', passVal: 'GM@123', iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800', color: 'violet' },
  { id: 'md', name: 'MD', badge: 'Director', userVal: 'md', passVal: 'MD@123', iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800', color: 'purple' },
  { id: 'staff', name: 'Staff', badge: 'Faculty', userVal: 'staff', passVal: 'Staff@123', iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', color: 'emerald' },
  { id: 'hr', name: 'HR', badge: 'Human Res', userVal: 'hr', passVal: 'HR@123', iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800', color: 'amber' },
  { id: 'student', name: 'Student', badge: 'Learner', userVal: 'student', passVal: 'Student@123', iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800', color: 'sky' },
];

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
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

  const handleSelectRole = (role: RoleOption) => {
    setSelectedRole(role.id);
    setUsername(role.userVal);
    setPassword(role.passVal);
    setError(null);
  };

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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white dark:bg-[#0c1222] min-h-[500px]">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign In to Your Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Choose your role and enter credentials to continue.
            </p>
          </div>

          {/* Role Selection Tabs for 7 Roles */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Your Role:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              {AVAILABLE_ROLES.map((r) => {
                const isActive = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`py-2 px-1.5 rounded-xl text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-extrabold border border-slate-200 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <span className="block text-xs leading-none">{r.name}</span>
                    <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 scale-90 origin-center truncate">
                      {r.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3.5 mb-5 text-xs text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 rounded-xl animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: Username / ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Username / Role ID</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-mono font-bold">
                  {selectedRole.toUpperCase()} LOGIN
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username or ID"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition font-medium"
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
                  className="w-full px-4 py-2.5 pr-11 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options Row: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
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
              className="w-full mt-1 py-3 px-4 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 active:scale-[0.99] transition duration-150 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Signing in...' : `Sign In as ${selectedRole.toUpperCase()}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials for Fast 1-Click Testing */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-2 tracking-wider">
              1-Click Quick Fill ({AVAILABLE_ROLES.length} Roles Supported):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              {AVAILABLE_ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectRole(r)}
                  className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                    selectedRole === r.id
                      ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 ring-1 ring-orange-400/40'
                      : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="block font-bold text-slate-900 dark:text-white text-xs">{r.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate block">{r.userVal}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleQuickFill('ENT036/26-27', 'Student@123')}
                className="p-2 rounded-xl text-left bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/60 border border-pink-200 dark:border-pink-800 transition cursor-pointer"
              >
                <span className="block font-bold text-pink-900 dark:text-pink-200 text-xs">Meena (Std)</span>
                <span className="text-[10px] text-pink-600 dark:text-pink-400 font-mono truncate block">ENT036/26-27</span>
              </button>
            </div>
          </div>

          {/* Security Notice Footer */}
          <div className="mt-5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Campus portal access — secure role-based authentication for Admin, Manager, GM, MD, Staff, HR, and Students.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
