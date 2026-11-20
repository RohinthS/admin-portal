import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { creditService, CreditTransaction, DynamicCategoryGroup } from '../../services/creditService';
import {
  Award,
  Zap,
  Star,
  FileCheck,
  Eye,
  X,
  FileText,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
  Layers,
  Briefcase,
  Presentation,
  Video,
  ListFilter,
  Check,
  LayoutGrid,
  List,
} from 'lucide-react';

export function formatTransactionDate(rawDate?: string | Date | null) {
  if (!rawDate) return <span className="text-slate-400 font-medium">Recent</span>;
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return <span className="text-slate-400 font-medium">Recent</span>;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffTime = today.getTime() - txDay.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const exactDateStr = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (diffDays === 0) {
    return (
      <div className="flex flex-col">
        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">Today</span>
        <span className="text-[10px] text-slate-400 font-medium">{exactDateStr}</span>
      </div>
    );
  }

  if (diffDays === 1) {
    return (
      <div className="flex flex-col">
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Yesterday</span>
        <span className="text-[10px] text-slate-400 font-medium">{exactDateStr}</span>
      </div>
    );
  }

  if (diffDays < 0) {
    return (
      <div className="flex flex-col">
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{exactDateStr}</span>
      </div>
    );
  }

  let relative = '';
  if (diffDays < 7) {
    relative = `${diffDays} days ago`;
  } else if (diffDays < 14) {
    relative = '1 week ago';
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    relative = `${weeks} weeks ago`;
  } else if (diffDays < 60) {
    relative = '1 month ago';
  } else {
    const months = Math.floor(diffDays / 30);
    relative = `${months} months ago`;
  }

  return (
    <div className="flex flex-col">
      <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{exactDateStr}</span>
      <span className="text-[10px] text-slate-400 font-medium">{relative}</span>
    </div>
  );
}

export const StudentCreditsPage: React.FC = () => {
  const { user, activeCompanyId } = useAuth();
  const studentId = user?._id || user?.id || 'CURRENT_STUDENT';

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [viewingCert, setViewingCert] = useState<CreditTransaction | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Dynamic categories in React state for instant synchronization with Admin Portal
  const [dynamicCategories, setDynamicCategories] = useState<DynamicCategoryGroup[]>(() =>
    creditService.getDynamicCategories(),
  );

  const totalConfiguredCredits = React.useMemo(() => {
    try {
      return (
        dynamicCategories.reduce(
          (sum, cat) => sum + (cat?.items?.reduce((s, it) => s + (it?.credits || 0), 0) || 0),
          0,
        ) || 300
      );
    } catch {
      return 300;
    }
  }, [dynamicCategories]);

  // Load backend credits and sync
  const syncCredits = async () => {
    try {
      const res = await creditService.getStudentCreditsApi(studentId);
      setTransactions(res.transactions);
      setTotalCredits(res.totalCredits);
    } catch {
      const txs = creditService.getStudentTransactions(studentId);
      setTransactions(txs);
      setTotalCredits(creditService.getStudentTotalCredits(studentId));
    } finally {
      setLoading(false);
    }
  };

  const reloadCategories = () => {
    const cats = creditService.getDynamicCategories();
    if (cats && Array.isArray(cats) && cats.length > 0) {
      setDynamicCategories(cats);
    }
  };

  // 1. Fetch latest rules from MongoDB / API on mount
  useEffect(() => {
    creditService.fetchRulesApi(activeCompanyId).then((cats) => {
      if (cats && Array.isArray(cats) && cats.length > 0) {
        setDynamicCategories(cats);
      }
    });
  }, [activeCompanyId]);

  useEffect(() => {
    syncCredits();
    reloadCategories();

    // 1. Same-window credit & rules change listener
    const handleCreditChange = () => syncCredits();
    const handleRulesChange = () => reloadCategories();
    window.addEventListener('wegrow_credits_changed', handleCreditChange);
    window.addEventListener('wegrow_credit_rules_updated', handleRulesChange);
    window.addEventListener('storage', reloadCategories);

    // 2. Cross-tab BroadcastChannel listener
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        broadcastChannel = new BroadcastChannel('wegrow_credits_sync');
        broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'RULES_UPDATED' && Array.isArray(event.data.categories)) {
            setDynamicCategories(event.data.categories);
          }
          syncCredits();
        };
      }
    } catch (_) {}

    // 3. Tab visibility / window focus listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncCredits();
        reloadCategories();
      }
    };
    window.addEventListener('focus', syncCredits);
    window.addEventListener('focus', reloadCategories);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Background real-time polling every 3 seconds
    const pollInterval = setInterval(() => {
      syncCredits();
      reloadCategories();
    }, 3000);

    return () => {
      window.removeEventListener('wegrow_credits_changed', handleCreditChange);
      window.removeEventListener('wegrow_credit_rules_updated', handleRulesChange);
      window.removeEventListener('storage', reloadCategories);
      window.removeEventListener('focus', syncCredits);
      window.removeEventListener('focus', reloadCategories);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(pollInterval);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [studentId]);

  // Helper to format credits cleanly to at most 2 decimal places
  const formatCredits = (val: number | string | undefined | null): string => {
    const n = Number(val) || 0;
    return Number(n.toFixed(2)).toString();
  };

  // Determine Gamification Tier according to credit thresholds
  let tier = {
    name: 'Getting Started',
    badgeGradient: 'from-slate-700 via-slate-800 to-slate-900',
    badgeShadow: 'shadow-slate-800/40 border-slate-700 ring-white/10',
    pillClass: 'bg-slate-800/80 text-slate-300 border-slate-700',
    accentColor: 'text-slate-400',
    nextTarget: 25,
  };

  if (totalCredits >= 250) {
    tier = {
      name: 'Platinum Master',
      badgeGradient: 'from-[#00A3FF] via-[#0284C7] to-[#2563EB]',
      badgeShadow: 'shadow-cyan-500/50 border-cyan-300/40 ring-cyan-200/40',
      pillClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-400/50 shadow-cyan-500/20',
      accentColor: 'text-cyan-400',
      nextTarget: 500,
    };
  } else if (totalCredits >= 200) {
    tier = {
      name: 'Diamond Master',
      badgeGradient: 'from-[#38BDF8] via-[#6366F1] to-[#A855F7]',
      badgeShadow: 'shadow-indigo-500/50 border-sky-200/50 ring-white/50',
      pillClass: 'bg-indigo-950/80 text-sky-200 border-indigo-400/50 shadow-indigo-500/20',
      accentColor: 'text-sky-300',
      nextTarget: 250,
    };
  } else if (totalCredits >= 140) {
    tier = {
      name: 'Gold Scholar',
      badgeGradient: 'from-amber-400 via-yellow-400 to-amber-600',
      badgeShadow: 'shadow-amber-500/50 border-yellow-200/50 ring-yellow-300/40',
      pillClass: 'bg-amber-950/80 text-amber-300 border-amber-400/50 shadow-amber-500/20',
      accentColor: 'text-amber-400',
      nextTarget: 200,
    };
  } else if (totalCredits >= 75) {
    tier = {
      name: 'Silver Scholar',
      badgeGradient: 'from-slate-300 via-slate-400 to-zinc-600',
      badgeShadow: 'shadow-slate-400/40 border-slate-200/60 ring-white/60',
      pillClass: 'bg-slate-800/90 text-slate-100 border-slate-300/50 shadow-slate-400/20',
      accentColor: 'text-slate-200',
      nextTarget: 140,
    };
  } else if (totalCredits >= 25) {
    tier = {
      name: 'Bronze Scholar',
      badgeGradient: 'from-amber-600 via-orange-600 to-amber-800',
      badgeShadow: 'shadow-orange-700/40 border-amber-500/40 ring-amber-400/30',
      pillClass: 'bg-amber-950/80 text-amber-400 border-amber-600/40 shadow-amber-600/20',
      accentColor: 'text-amber-400',
      nextTarget: 75,
    };
  } else if (totalCredits > 0) {
    tier = {
      name: 'Learner',
      badgeGradient: 'from-indigo-500 via-indigo-600 to-purple-700',
      badgeShadow: 'shadow-indigo-500/40 border-indigo-400/40 ring-indigo-300/30',
      pillClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
      accentColor: 'text-indigo-400',
      nextTarget: 25,
    };
  }

  // Calculate points earned per category with keyword matching
  const pointsByCategory = (...cats: string[]) =>
    Array.isArray(transactions)
      ? transactions
          .filter((tx) => {
            const cat = (tx?.category || '').toLowerCase();
            const title = (tx?.title || '').toLowerCase();
            return cats.some(
              (c) =>
                cat === c.toLowerCase() ||
                cat.includes(c.toLowerCase()) ||
                title.includes(c.toLowerCase()),
            );
          })
          .reduce((acc, curr) => acc + (curr?.credits || 0), 0)
      : 0;

  const academicPoints = pointsByCategory('monthly_internal_test', 'monthly_test', 'fourth_month_test', 'academic');
  const videoPoints = pointsByCategory('video');
  const coCurricularPoints = pointsByCategory('workshop', 'hackathon', 'presentation', 'communication', 'co_curricular');
  const capstonePoints = pointsByCategory('capstone_project', 'capstone');
  const eventPoints = pointsByCategory('event_volunteer', 'volunteer', 'saturday_program', 'saturday_special_program');
  const interviewPoints = pointsByCategory('interview_attended', 'interview');
  const attendancePoints = pointsByCategory('attendance_bonus', 'attendance_milestone', 'attendance');

  // Category Breakdown matching Admin Portal 5 categories with finished, pending & activity checklist
  const categoryBreakdown = React.useMemo(() => {
    return dynamicCategories.map((cat) => {
      const catPool = cat.items?.reduce((s, it) => s + (it.credits || 0), 0) || 0;
      const itIds = (cat.items || []).map((it) => (it.id || '').toLowerCase());
      const itTitles = (cat.items || []).map((it) => (it.title || '').toLowerCase());
      const catId = (cat.id || '').toLowerCase();
      const catTitle = (cat.title || '').toLowerCase();

      const catTxs = (transactions || []).filter((tx: any) => {
        const tCat = (tx.category || '').toLowerCase();
        const tTitle = (tx.title || '').toLowerCase();
        return (
          tCat === catId ||
          tTitle === catTitle ||
          itIds.includes(tCat) ||
          itTitles.includes(tTitle) ||
          (catId && tCat.includes(catId)) ||
          (catTitle && tTitle.includes(catTitle))
        );
      });

      const finished = Number(
        catTxs.reduce((sum, tx) => sum + (Number(tx.credits) || 0), 0).toFixed(2),
      );
      const pending = Math.max(0, Number((catPool - finished).toFixed(2)));
      const percentage = catPool > 0 ? Math.min(100, Math.round((finished / catPool) * 100)) : 0;
      const isFull = finished >= catPool && catPool > 0;

      const itemsWithStatus = (cat.items || []).map((item) => {
        const iId = (item.id || '').toLowerCase();
        const iTitle = (item.title || '').toLowerCase();
        const matchingTxs = catTxs.filter((tx: any) => {
          const tCat = (tx.category || '').toLowerCase();
          const tTitle = (tx.title || '').toLowerCase();
          return (
            tCat === iId ||
            tTitle === iTitle ||
            (iId && tCat.includes(iId)) ||
            (iTitle && tTitle.includes(iTitle))
          );
        });
        const earned = Number(matchingTxs.reduce((s, tx) => s + (Number(tx.credits) || 0), 0).toFixed(2));
        const isDone = earned >= item.credits;
        const itemPending = Math.max(0, Number((item.credits - earned).toFixed(2)));
        return {
          ...item,
          earned,
          itemPending,
          isDone,
        };
      });

      return {
        id: cat.id,
        title: cat.title,
        iconName: cat.iconName,
        items: itemsWithStatus,
        pool: catPool,
        finished,
        pending,
        percentage,
        isFull,
        txCount: catTxs.length,
      };
    });
  }, [dynamicCategories, transactions]);

  // Identify any custom admin-created category cards (like SPORTS) beyond the 5 default categories
  const customCategories = React.useMemo(() => {
    const defaultIds = new Set(['academics', 'video_attendance', 'co_curricular', 'capstone', 'events_placement']);
    return categoryBreakdown.filter((cat) => !defaultIds.has(cat.id));
  }, [categoryBreakdown]);

  const totalCreditsNum = Number(Number(totalCredits).toFixed(2));
  const totalConfiguredNum = Math.max(1, Number(totalConfiguredCredits) || 300);
  const earnedPercentage = Math.min(
    100,
    Math.round((totalCreditsNum / totalConfiguredNum) * 100),
  );
  const remainingCredits = Math.max(0, Number((totalConfiguredNum - totalCreditsNum).toFixed(2)));

  // 1. Flatten all dynamic categories & items into unified activities list with status
  const allActivities = React.useMemo(() => {
    const list: any[] = [];
    const matchedTxIds = new Set<string>();

    (dynamicCategories || []).forEach((cat) => {
      const itIds = (cat.items || []).map((it) => (it.id || '').toLowerCase());
      const itTitles = (cat.items || []).map((it) => (it.title || '').toLowerCase());
      const catId = (cat.id || '').toLowerCase();
      const catTitle = (cat.title || '').toLowerCase();

      (cat.items || []).forEach((item) => {
        const iId = (item.id || '').toLowerCase();
        const iTitle = (item.title || '').toLowerCase();

        // Match transactions for this item
        const matchingTxs = (transactions || []).filter((tx: any) => {
          const tCat = (tx.category || '').toLowerCase();
          const tTitle = (tx.title || '').toLowerCase();
          const isMatch =
            tCat === iId ||
            tTitle === iTitle ||
            (iId && tCat.includes(iId)) ||
            (iTitle && tTitle.includes(iTitle)) ||
            (iTitle && tCat.includes(iTitle)) ||
            (iId && tTitle.includes(iId)) ||
            ((tCat === catId || (catId && tCat.includes(catId))) && (tTitle === iTitle || (iTitle && tTitle.includes(iTitle)))) ||
            (iId === 'video' && (tCat.includes('video') || tTitle.includes('video'))) ||
            ((iId === 'monthly_test' || iId === 'monthly_internal_test') &&
              (tCat.includes('monthly') || tTitle.includes('monthly internal') || tTitle.includes('monthly test'))) ||
            (iId === 'fourth_month_test' &&
              (tCat.includes('fourth') || tCat.includes('4th') || tCat.includes('month_4') || tTitle.includes('4th') || tTitle.includes('fourth') || tTitle.includes('month 4'))) ||
            (iId.startsWith('month_') &&
              (tCat === iId || tCat.includes(iId) || tTitle.toLowerCase().includes(iId.replace(/_/g, ' ')) || (iTitle && tTitle.toLowerCase().includes(iTitle.toLowerCase())))) ||
            (iId === 'attendance_bonus' && (tCat.includes('attendance') || tTitle.includes('attendance')));

          if (isMatch) {
            matchedTxIds.add(tx.id || tx._id);
          }
          return isMatch;
        });

        const earned = Number(
          matchingTxs.reduce((sum, tx) => sum + (Number(tx.credits) || 0), 0).toFixed(2),
        );
        const pending = Math.max(0, Number((item.credits - earned).toFixed(2)));
        let status: 'completed' | 'in_progress' | 'pending' = 'pending';
        if (earned >= item.credits || (earned > 0 && Math.abs(earned - item.credits) < 0.01)) {
          status = 'completed';
        } else if (earned > 0) {
          status = 'in_progress';
        } else {
          status = 'pending';
        }

        const percentage = item.credits > 0 ? Math.min(100, Math.round((earned / item.credits) * 100)) : 0;
        const verifiedCertificates = matchingTxs.filter((tx) => tx.certificateVerified);

        list.push({
          id: item.id,
          title: item.title,
          credits: item.credits,
          earned,
          pending,
          status,
          categoryId: cat.id,
          categoryTitle: cat.title,
          percentage,
          hasThreshold: item.hasThreshold,
          thresholdLabel: item.thresholdLabel,
          thresholdValue: item.thresholdValue,
          matchingTxs,
          verifiedCertificates,
        });
      });
    });

    // Also include custom awards
    (transactions || []).forEach((tx) => {
      const txId = tx.id || tx._id;
      if (txId && !matchedTxIds.has(txId)) {
        list.push({
          id: txId,
          title: tx.title || 'Special Credential Award',
          credits: tx.credits,
          earned: tx.credits,
          pending: 0,
          status: 'completed',
          categoryId: tx.category || 'general',
          categoryTitle: (tx.category || 'General').replace(/_/g, ' '),
          percentage: 100,
          matchingTxs: [tx],
          verifiedCertificates: tx.certificateVerified ? [tx] : [],
        });
      }
    });

    return list;
  }, [dynamicCategories, transactions]);

  const countAll = allActivities.length;
  const countPending = allActivities.filter((a) => a.status === 'pending').length;
  const countInProgress = allActivities.filter((a) => a.status === 'in_progress').length;
  const countCompleted = allActivities.filter((a) => a.status === 'completed').length;

  const filteredActivities = React.useMemo(() => {
    return allActivities.filter((activity) => {
      if (statusFilter === 'pending' && activity.status !== 'pending') return false;
      if (statusFilter === 'in_progress' && activity.status !== 'in_progress') return false;
      if (statusFilter === 'completed' && activity.status !== 'completed') return false;
      if (selectedCategory !== 'all' && activity.categoryId !== selectedCategory) return false;
      return true;
    });
  }, [allActivities, statusFilter, selectedCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>My Credits & Badges Portfolio</span>
          <Sparkles className="w-5 h-5 text-indigo-500" />
        </h1>
      </div>

      {/* GAMIFICATION & CREDITS PORTFOLIO CARD */}
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left Side: Current Tier & Points */}
          <div className="flex items-center gap-5">
            {/* Attractive 3D Glowing Tier Badge Card */}
            <div
              className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br ${tier.badgeGradient} shadow-xl ${tier.badgeShadow} ring-1 border text-white flex flex-col items-center justify-center relative overflow-hidden flex-shrink-0 transition-all duration-300 hover:scale-105`}
            >
              {/* Glossy Glass Reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/25 pointer-events-none" />

              <Award className="w-9 h-9 text-white stroke-[2.2] drop-shadow-md mb-0.5 relative z-10" />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white drop-shadow-sm relative z-10">
                Badge
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg border backdrop-blur-md shadow-xs ${tier.pillClass}`}>
                  {tier.name}
                </span>
                <span className="text-xs text-slate-400 font-medium">Total Credits Score</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1.5 flex items-baseline gap-2.5">
                <span>{formatCredits(totalCredits)}</span>
                <span className="text-sm sm:text-base font-extrabold text-amber-400 drop-shadow-xs">Credits Earned</span>
              </div>
              <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                <span>
                  Target for Next Tier: <strong className="text-white font-bold">{tier.nextTarget} credits</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Total Credits Benchmark & Progress */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col justify-center min-w-[280px] sm:min-w-[360px] lg:min-w-[420px] shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
                  Total Credits Benchmark
                </span>
                <span className="text-[11px] text-slate-400">Progress towards target graduation pool</span>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-baseline justify-end gap-1">
                  <span>{formatCredits(totalCredits)}</span>
                  <span className="text-slate-400 text-sm font-bold">/ {formatCredits(totalConfiguredCredits)} pts</span>
                </div>
                <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  {earnedPercentage}% Earned
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden p-0.5 border border-white/10 relative">
              <div
                className="bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${earnedPercentage}%` }}
              />
            </div>

            {/* Breakdown Indicators: Earned, Remaining, Total */}
            <div className="flex items-center justify-between text-[11px] text-slate-300 mt-2.5 pt-2 border-t border-white/10 font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Earned: <strong className="text-white">+{formatCredits(totalCredits)} pts</strong>
              </span>
              <span className="text-slate-300">
                Remaining: <strong className="text-amber-300">{formatCredits(remainingCredits)} pts</strong>
              </span>
              <span className="text-cyan-300">
                Total Pool: <strong className="text-white">{formatCredits(totalConfiguredCredits)} pts</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Category Credit Breakdown Chips (Image 2) */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 ${customCategories.length > 0 ? 'lg:grid-cols-8 xl:grid-cols-9' : 'lg:grid-cols-7'} gap-3 mt-6 pt-6 border-t border-white/10 text-xs`}>
          <div
            onClick={() => setSelectedCategory(selectedCategory === 'academics' ? 'all' : 'academics')}
            className={`bg-white/5 p-3 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
              selectedCategory === 'academics' ? 'border-indigo-400 bg-white/10 ring-1 ring-indigo-400/50' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold uppercase truncate">Tests (Mo/4th)</span>
            <div className="mt-1">
              <span className="text-sm font-extrabold text-indigo-400 block">+{formatCredits(academicPoints)} pts</span>
              <span className="text-[10px] text-amber-300 font-semibold">{65 - academicPoints > 0 ? `${65 - academicPoints}p pending` : '✓ Full'}</span>
            </div>
          </div>

          <div
            onClick={() => setSelectedCategory(selectedCategory === 'video_attendance' ? 'all' : 'video_attendance')}
            className={`bg-white/5 p-3 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
              selectedCategory === 'video_attendance' ? 'border-indigo-400 bg-white/10 ring-1 ring-indigo-400/50' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold uppercase truncate">Video Learning</span>
            <div className="mt-1">
              <span className="text-sm font-extrabold text-cyan-400 block">+{formatCredits(videoPoints)} pts</span>
              <span className="text-[10px] text-amber-300 font-semibold">{10 - videoPoints > 0 ? `${(10 - videoPoints).toFixed(2)}p pending` : '✓ Full'}</span>
            </div>
          </div>

          <div
            onClick={() => setSelectedCategory(selectedCategory === 'co_curricular' ? 'all' : 'co_curricular')}
            className={`bg-white/5 p-3 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
              selectedCategory === 'co_curricular' ? 'border-indigo-400 bg-white/10 ring-1 ring-indigo-400/50' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold uppercase truncate">Co-Curricular</span>
            <div className="mt-1">
              <span className="text-sm font-extrabold text-amber-400 block">+{formatCredits(coCurricularPoints)} pts</span>
              <span className="text-[10px] text-amber-300 font-semibold">{85 - coCurricularPoints > 0 ? `${85 - coCurricularPoints}p pending` : '✓ Full'}</span>
            </div>
          </div>

          <div
            onClick={() => setSelectedCategory(selectedCategory === 'capstone' ? 'all' : 'capstone')}
            className={`bg-white/5 p-3 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
              selectedCategory === 'capstone' ? 'border-indigo-400 bg-white/10 ring-1 ring-indigo-400/50' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold uppercase truncate">Capstone</span>
            <div className="mt-1">
              <span className="text-sm font-extrabold text-purple-400 block">+{formatCredits(capstonePoints)} pts</span>
              <span className="text-[10px] text-amber-300 font-semibold">{70 - capstonePoints > 0 ? `${70 - capstonePoints}p pending` : '✓ Full'}</span>
            </div>
          </div>

          <div
            onClick={() => setSelectedCategory(selectedCategory === 'events_placement' ? 'all' : 'events_placement')}
            className={`bg-white/5 p-3 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
              selectedCategory === 'events_placement' ? 'border-indigo-400 bg-white/10 ring-1 ring-indigo-400/50' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold uppercase truncate">Volunteering/Sat</span>
            <div className="mt-1">
              <span className="text-sm font-extrabold text-emerald-400 block">+{formatCredits(eventPoints)} pts</span>
              <span className="text-[10px] text-emerald-400 font-semibold">Active Contributor</span>
            </div>
          </div>

          <div
            onClick={() => setSelectedCategory(selectedCategory === 'events_placement' ? 'all' : 'events_placement')}
            className={`bg-white/5 p-3 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
              selectedCategory === 'events_placement' ? 'border-indigo-400 bg-white/10 ring-1 ring-indigo-400/50' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold uppercase truncate">Interviews</span>
            <div className="mt-1">
              <span className="text-sm font-extrabold text-rose-400 block">+{formatCredits(interviewPoints)} pts</span>
              <span className="text-[10px] text-emerald-400 font-semibold">✓ Completed</span>
            </div>
          </div>

          <div
            onClick={() => setSelectedCategory(selectedCategory === 'video_attendance' ? 'all' : 'video_attendance')}
            className={`bg-white/5 p-3 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
              selectedCategory === 'video_attendance' ? 'border-indigo-400 bg-white/10 ring-1 ring-indigo-400/50' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-[10px] text-slate-400 block font-bold uppercase truncate">Attendance</span>
            <div className="mt-1">
              <span className="text-sm font-extrabold text-teal-400 block">+{formatCredits(attendancePoints)} pts</span>
              <span className="text-[10px] text-emerald-400 font-semibold">✓ Milestone Met</span>
            </div>
          </div>

          {/* ALL NEW ADMIN-ADDED CATEGORIES (e.g. SPORTS) APPEAR HERE DYNAMICALLY */}
          {customCategories.map((cat, idx) => {
            const isFull = cat.finished >= cat.pool && cat.pool > 0;
            const accentColors = [
              'text-orange-400',
              'text-pink-400',
              'text-violet-400',
              'text-lime-400',
              'text-amber-300',
            ];
            const accent = accentColors[idx % accentColors.length];

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
                className={`bg-white/5 p-3 rounded-xl border flex flex-col justify-between transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'border-indigo-400 bg-white/10 ring-1 ring-indigo-400/50'
                    : 'border-white/10 hover:border-white/25 hover:bg-white/8'
                }`}
              >
                <span className="text-[10px] text-slate-400 block font-bold uppercase truncate" title={cat.title}>
                  {cat.title}
                </span>
                <div className="mt-1">
                  <span className={`text-sm font-extrabold ${accent} block`}>
                    +{formatCredits(cat.finished)} pts
                  </span>
                  <span className="text-[10px] font-semibold truncate block">
                    {isFull ? (
                      <span className="text-emerald-400">✓ Full</span>
                    ) : cat.pool > 0 ? (
                      <span className="text-amber-300">{formatCredits(cat.pending)}p pending</span>
                    ) : (
                      <span className="text-slate-400">Direct Allocation</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CATEGORY PROGRESS OVERVIEW (5 CORE CATEGORIES) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Category Credit Progress</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Total Pending: <strong>{formatCredits(remainingCredits)} pts</strong></span>
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {dynamicCategories.length} Categories Configured
            </span>
          </div>
        </div>

        {/* Dynamic Category Cards - Auto-fit perfectly with 0 empty gaps on desktop */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${
          categoryBreakdown.length <= 4
            ? 'lg:grid-cols-4 xl:grid-cols-4'
            : categoryBreakdown.length === 5
            ? 'lg:grid-cols-5 xl:grid-cols-5'
            : 'lg:grid-cols-3 xl:grid-cols-6'
        } gap-3.5`}>
          {categoryBreakdown.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-500/25 shadow-sm'
                    : cat.isFull
                    ? 'bg-emerald-50/40 border-emerald-200/90 hover:border-emerald-300'
                    : 'bg-white border-slate-200/90 hover:border-indigo-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {cat.items?.length || 0} Activities
                  </span>
                  {cat.isFull ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Full
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                      {cat.percentage}%
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1 mb-2.5" title={cat.title}>
                  {cat.title}
                </h4>

                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm sm:text-base font-black text-slate-900">
                    +{cat.finished} <span className="text-xs text-slate-400 font-semibold">/ {cat.pool} pts</span>
                  </span>
                  <span className={`text-[11px] font-bold ${cat.isFull ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {cat.pending > 0 ? `${cat.pending}p pending` : '✓ 0p'}
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cat.isFull ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVITY STATUS FILTER SECTION (COMPACT & SPACE-EFFICIENT) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-indigo-600" />
              <span>Activity status filter</span>
            </h3>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Clean Filter Pills Track matching Image 2 */}
            <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All <span className="opacity-60 text-xs font-normal">({countAll})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'pending'
                    ? 'bg-white text-amber-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Pending</span>
                <span className="text-xs font-bold text-amber-700">({countPending})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'in_progress'
                    ? 'bg-white text-sky-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>In Progress</span>
                <span className="text-xs font-bold text-sky-700">({countInProgress})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'completed'
                    ? 'bg-white text-emerald-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Completed</span>
                <span className="text-xs font-bold text-emerald-700">({countCompleted})</span>
              </button>
            </div>

            {/* View Mode Toggle: 2-Col Grid vs Dense List */}
            <div className="hidden sm:inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="2-Column Grid View (50% Space Saver)"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Dense List View (65% Space Saver)"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Active Indicator */}
        {selectedCategory !== 'all' && (
          <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-200/80 px-3.5 py-2 rounded-xl text-xs">
            <span className="text-indigo-900 font-semibold flex items-center gap-2">
              <span>Category Filter:</span>
              <strong className="font-bold underline">
                {dynamicCategories.find((c) => c.id === selectedCategory)?.title || selectedCategory}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer hover:underline"
            >
              ✕ Clear Filter (Show All)
            </button>
          </div>
        )}

        {/* Pending Summary Callout */}
        {statusFilter === 'pending' && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>{countPending} Activities Pending:</strong> Clear these requirements to earn your remaining <strong>{formatCredits(remainingCredits)} credits</strong>.
              </span>
            </div>
            <span className="font-black text-amber-800 shrink-0 text-xs">
              {formatCredits(remainingCredits)} pts left
            </span>
          </div>
        )}

        {/* Space-Efficient Activities View */}
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No activities found for this filter.
          </div>
        ) : viewMode === 'grid' ? (
          /* OPTION 1: 2-COLUMN RESPONSIVE COMPACT GRID (Cuts vertical space by 50%) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {filteredActivities.map((act) => {
              const isCompleted = act.status === 'completed';
              const isInProgress = act.status === 'in_progress';

              return (
                <div
                  key={act.id}
                  className={`px-3.5 py-2.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                      : isInProgress
                      ? 'bg-sky-50/30 border-sky-200/80 hover:bg-sky-50/50'
                      : 'bg-white border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {/* Left: Status Icon, Title & Criteria */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : isInProgress
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isInProgress ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate" title={act.title}>
                          {act.title}
                        </h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
                          {act.categoryTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        {act.hasThreshold && act.thresholdLabel && (
                          <span>
                            {act.thresholdLabel} <strong className="text-slate-700 font-semibold">{act.thresholdValue}%</strong>
                          </span>
                        )}
                        {act.verifiedCertificates.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setViewingCert(act.verifiedCertificates[0])}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            <FileCheck className="w-3 h-3 text-amber-600" />
                            <span>Verified</span>
                          </button>
                        )}
                        {isInProgress && (
                          <span className="text-sky-700 font-medium">
                            {act.earned}/{act.credits} pts ({act.percentage}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Points & Status Pill aligned together */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      {isCompleted ? (
                        <span className="text-emerald-600 font-bold">+{act.earned} pts</span>
                      ) : isInProgress ? (
                        <span className="text-sky-600 font-bold">+{act.earned} / {act.credits} pts</span>
                      ) : (
                        <span className="text-slate-700 font-bold">{act.credits} pts</span>
                      )}
                    </span>

                    <span className="shrink-0">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                          <Clock className="w-3 h-3" /> In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* OPTION 2: DENSE TABLE LIST (Cuts vertical space by 65%) */
          <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
            {filteredActivities.map((act) => {
              const isCompleted = act.status === 'completed';
              const isInProgress = act.status === 'in_progress';

              return (
                <div
                  key={act.id}
                  className={`px-3 py-2 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/80 transition-all ${
                    isCompleted ? 'bg-slate-50/30' : isInProgress ? 'bg-sky-50/20' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isInProgress ? (
                      <Clock className="w-4 h-4 text-sky-500 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    )}

                    <span className="font-bold text-slate-800 truncate" title={act.title}>
                      {act.title}
                    </span>

                    <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600 shrink-0 hidden sm:inline-block">
                      {act.categoryTitle}
                    </span>

                    {act.hasThreshold && act.thresholdLabel && (
                      <span className="text-[10px] text-slate-400 hidden md:inline-block">
                        ({act.thresholdLabel} {act.thresholdValue}%)
                      </span>
                    )}

                    {act.verifiedCertificates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setViewingCert(act.verifiedCertificates[0])}
                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <FileCheck className="w-3 h-3 text-amber-600" />
                        <span>Verified</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-black text-xs text-slate-900">
                      {isCompleted ? (
                        <span className="text-emerald-600 font-bold">+{act.earned} pts</span>
                      ) : isInProgress ? (
                        <span className="text-sky-600 font-bold">+{act.earned} / {act.credits} pts</span>
                      ) : (
                        <span className="text-slate-700 font-bold">{act.credits} pts</span>
                      )}
                    </span>

                    <span className="shrink-0 min-w-[78px] text-right">
                      {isCompleted ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ Completed
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                          🔄 In Progress
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          ⏳ Pending
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Credit Transactions Ledger Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span>My Credit Rewards & Verified Certificates History ({transactions.length})</span>
          </div>
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No credits earned yet. Watch course video tutorials, attend Saturday sessions, or submit assignments to begin earning credits!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Activity</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Awarded By</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx, idx) => (
                  <tr key={tx.id || tx._id || `tx_${idx}`} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{tx.title}</div>
                      {tx.notes && <div className="text-[11px] text-slate-400 mt-0.5">{tx.notes}</div>}
                      {tx.certificateVerified && (
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <FileCheck className="w-3 h-3 text-amber-600" />
                            <span>Certificate Verified by Staff: {tx.certificateTitle || 'Certificate Proof'}</span>
                            {tx.certificateNumber && <span className="opacity-75 font-mono">({tx.certificateNumber})</span>}
                          </span>
                          {tx.certificateFileUrl && (
                            <button
                              type="button"
                              onClick={() => setViewingCert(tx)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              <Eye className="w-3 h-3" /> View Certificate
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium capitalize">
                        {(tx?.category || 'general').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-extrabold text-emerald-600">+{formatCredits(tx?.credits)} pts</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{tx?.awarded_by || 'Staff'}</td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatTransactionDate(tx?.date || tx?.createdAt || (tx as any)?.created_at || tx?.certificateDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student View Certificate Modal */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-600" />
                  <span>Verified Certificate Proof</span>
                </h3>
                <p className="text-xs text-slate-500">{viewingCert.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingCert(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Certificate Title</span>
                  <span className="font-semibold text-slate-900">{viewingCert.certificateTitle || viewingCert.title}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Credits Earned</span>
                  <span className="font-bold text-emerald-600">+{formatCredits(viewingCert.credits)} pts</span>
                </div>
                {viewingCert.certificateNumber && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Credential ID / Issuer</span>
                    <span className="font-mono">{viewingCert.certificateNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Verified By</span>
                  <span>{viewingCert.awarded_by}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Awarded Date</span>
                  <span className="font-semibold text-slate-800">
                    {viewingCert.certificateDate || (viewingCert.date ? new Date(viewingCert.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (viewingCert.createdAt ? new Date(viewingCert.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'))}
                  </span>
                </div>
              </div>

              {viewingCert.certificateFileUrl && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Attached Certificate Proof:</span>
                  {viewingCert.certificateFileUrl.startsWith('data:image') ? (
                    <img
                      src={viewingCert.certificateFileUrl}
                      alt="Certificate Document Proof"
                      className="w-full max-h-80 object-contain rounded-xl border border-slate-200 bg-slate-50"
                    />
                  ) : (
                    <a
                      href={viewingCert.certificateFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100"
                    >
                      <FileText className="w-4 h-4" /> Download / View Certificate Document
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingCert(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCreditsPage;

