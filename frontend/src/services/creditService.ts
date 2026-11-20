import api from '../api/client';

export interface DynamicCreditItem {
  id: string;
  title: string;
  credits: number;
  hasThreshold?: boolean;
  thresholdLabel?: string;
  thresholdValue?: number;
}

export interface DynamicCategoryGroup {
  id: string;
  title: string;
  iconName?: string;
  items: DynamicCreditItem[];
}

export interface CreditRuleConfig {
  monthly_internal_test: { credits: number; min_score_pct: number };
  fourth_month_test: { credits: number; min_score_pct: number };
  video_completion: { credits: number; required_watch_pct: number };
  workshop: { credits: number };
  hackathon: { credits: number };
  presentation: { credits: number };
  communication: { credits: number };
  capstone_project: { credits: number };
  event_volunteer: { credits: number };
  interview_attended: { credits: number };
  saturday_special_program: { credits: number };
  attendance_milestone: { credits: number; required_attendance_pct: number };
}

export const DEFAULT_DYNAMIC_CATEGORIES: DynamicCategoryGroup[] = [
  {
    id: 'academics',
    title: 'Academics & Tests',
    iconName: 'FileCheck',
    items: [
      {
        id: 'month_1_test',
        title: 'Month 1 Internal Test Credits',
        credits: 15,
        hasThreshold: true,
        thresholdLabel: 'Min Score %',
        thresholdValue: 60,
      },
      {
        id: 'month_2_test',
        title: 'Month 2 Internal Test Credits',
        credits: 15,
        hasThreshold: true,
        thresholdLabel: 'Min Score %',
        thresholdValue: 60,
      },
      {
        id: 'month_3_test',
        title: 'Month 3 Internal Test Credits',
        credits: 20,
        hasThreshold: true,
        thresholdLabel: 'Min Score %',
        thresholdValue: 60,
      },
      {
        id: 'fourth_month_test',
        title: 'Month 4 Overall Semester Assessment Credits',
        credits: 50,
        hasThreshold: true,
        thresholdLabel: 'Min Score %',
        thresholdValue: 65,
      },
      {
        id: 'month_5_test',
        title: 'Month 5 Internal Test Credits',
        credits: 20,
        hasThreshold: true,
        thresholdLabel: 'Min Score %',
        thresholdValue: 60,
      },
      {
        id: 'month_6_test',
        title: 'Month 6 Final Capstone Assessment Credits',
        credits: 50,
        hasThreshold: true,
        thresholdLabel: 'Min Score %',
        thresholdValue: 65,
      },
    ],
  },
  {
    id: 'video_attendance',
    title: 'Portal Video & Attendance',
    iconName: 'Video',
    items: [
      {
        id: 'video',
        title: 'Video Watch Level Milestone',
        credits: 10,
        hasThreshold: true,
        thresholdLabel: 'Required Watch %',
        thresholdValue: 80,
      },
      {
        id: 'attendance_bonus',
        title: 'Staff Attendance Percentage Bonus',
        credits: 25,
        hasThreshold: true,
        thresholdLabel: 'Staff Target %',
        thresholdValue: 85,
      },
    ],
  },
  {
    id: 'co_curricular',
    title: 'Co-Curricular Activities',
    iconName: 'Presentation',
    items: [
      { id: 'workshop', title: 'Workshop', credits: 20 },
      { id: 'hackathon', title: 'Hackathon', credits: 40 },
      { id: 'presentation', title: 'Presentation', credits: 15 },
      { id: 'communication', title: 'Communication', credits: 10 },
    ],
  },
  {
    id: 'capstone',
    title: 'Capstone & Programs',
    iconName: 'Sparkles',
    items: [
      { id: 'capstone_project', title: 'Capstone Project Done Credits', credits: 50 },
      { id: 'saturday_program', title: 'Saturday & Special Program Attendance', credits: 20 },
    ],
  },
  {
    id: 'events_placement',
    title: 'Events & Placement',
    iconName: 'Briefcase',
    items: [
      { id: 'event_volunteer', title: 'Event Volunteering & Willingness', credits: 15 },
      { id: 'interview_attended', title: 'Applied & Attended Job Interview', credits: 30 },
    ],
  },
];

export const DEFAULT_CREDIT_RULES: CreditRuleConfig = {
  monthly_internal_test: { credits: 15, min_score_pct: 60 },
  fourth_month_test: { credits: 50, min_score_pct: 65 },
  video_completion: { credits: 10, required_watch_pct: 80 },
  workshop: { credits: 20 },
  hackathon: { credits: 40 },
  presentation: { credits: 15 },
  communication: { credits: 10 },
  capstone_project: { credits: 50 },
  event_volunteer: { credits: 15 },
  interview_attended: { credits: 30 },
  saturday_special_program: { credits: 20 },
  attendance_milestone: { credits: 25, required_attendance_pct: 85 },
};

export interface CreditTransaction {
  id: string;
  _id?: string;
  student_id?: any;
  student_name?: string;
  category: string;
  title: string;
  credits: number;
  awarded_by: string;
  date: string;
  createdAt?: string;
  notes?: string;
  source_id?: string;
  certificateVerified?: boolean;
  certificateTitle?: string;
  certificateNumber?: string;
  certificateDate?: string;
  certificateFileUrl?: string;
}

const DYNAMIC_CATEGORIES_KEY = 'wegrow_dynamic_credit_categories';
const CREDITS_STORAGE_PREFIX = 'wegrow_student_credits_';
const VIDEO_PROGRESS_PREFIX = 'wegrow_video_progress_';

const memoryStorage: Record<string, string> = {};

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback to in-memory storage
    }
    return memoryStorage[key] ?? null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Fallback to in-memory storage
    }
    memoryStorage[key] = value;
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Fallback to in-memory storage
    }
    delete memoryStorage[key];
  },
};

const safeDispatchEvent = (name: string, detail?: any) => {
  try {
    if (typeof window !== 'undefined') {
      if (detail !== undefined) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
      } else {
        window.dispatchEvent(new Event(name));
      }
    }
  } catch {
    // Ignore when window is not available
  }
};

export const creditService = {
  // 1. Dynamic Category & Item CRUD
  getDynamicCategories(): DynamicCategoryGroup[] {
    try {
      const stored = safeStorage.getItem(DYNAMIC_CATEGORIES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If stored categories only have the old single 'monthly_test', enrich with monthly items
          const acad = parsed.find((c: any) => c.id === 'academics');
          if (acad && Array.isArray(acad.items)) {
            const hasMonthlyNumbered = acad.items.some((it: any) => it.id && it.id.startsWith('month_'));
            if (!hasMonthlyNumbered) {
              const defaultAcad = DEFAULT_DYNAMIC_CATEGORIES.find((c) => c.id === 'academics');
              if (defaultAcad) {
                acad.items = defaultAcad.items;
                this.saveDynamicCategories(parsed);
              }
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse dynamic categories', e);
    }
    return DEFAULT_DYNAMIC_CATEGORIES;
  },

  saveDynamicCategories(categories: DynamicCategoryGroup[]): void {
    try {
      safeStorage.setItem(DYNAMIC_CATEGORIES_KEY, JSON.stringify(categories));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
    safeDispatchEvent('wegrow_credit_rules_updated');
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('wegrow_credits_sync');
        channel.postMessage({ type: 'RULES_UPDATED', categories });
        channel.close();
      }
    } catch (_) {}
  },

  resetDynamicCategories(): DynamicCategoryGroup[] {
    try {
      safeStorage.removeItem(DYNAMIC_CATEGORIES_KEY);
    } catch (e) {
      console.warn('Storage remove failed', e);
    }
    safeDispatchEvent('wegrow_credit_rules_updated');
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('wegrow_credits_sync');
        channel.postMessage({ type: 'RULES_UPDATED', categories: DEFAULT_DYNAMIC_CATEGORIES });
        channel.close();
      }
    } catch (_) {}
    return DEFAULT_DYNAMIC_CATEGORIES;
  },

  // Flattened list of all available credit items for dropdowns
  getAllCreditItems(): Array<{ id: string; title: string; credits: number; categoryGroup: string; thresholdValue?: number }> {
    const categories = this.getDynamicCategories();
    const result: Array<{ id: string; title: string; credits: number; categoryGroup: string; thresholdValue?: number }> = [];
    if (Array.isArray(categories)) {
      categories.forEach((cat) => {
        if (Array.isArray(cat?.items)) {
          cat.items.forEach((item) => {
            if (item) {
              result.push({
                id: item.id || '',
                title: item.title || 'Untitled',
                credits: Number(item.credits) || 0,
                categoryGroup: cat.title || 'General',
                thresholdValue: item.thresholdValue,
              });
            }
          });
        }
      });
    }
    return result;
  },

  getCreditItemById(itemId: string): { id: string; title: string; credits: number; categoryGroup: string; thresholdValue?: number } | null {
    const items = this.getAllCreditItems();
    const found = items.find((i) => i.id === itemId || i.id.toLowerCase() === itemId.toLowerCase());
    if (found) return found;

    // Fallback for monthly tests if not matched by exact ID
    const match = itemId.match(/month_(\d+)_test/);
    if (match) {
      const mNum = parseInt(match[1], 10);
      const defaultCredits = mNum === 4 || mNum === 6 ? 50 : mNum === 3 || mNum === 5 ? 20 : 15;
      const defaultThreshold = mNum === 4 || mNum === 6 ? 65 : 60;
      return {
        id: itemId,
        title: `Month ${mNum} Internal Test Credits`,
        credits: defaultCredits,
        categoryGroup: 'Academics & Tests',
        thresholdValue: defaultThreshold,
      };
    }

    if (itemId === 'monthly_test' || itemId === 'monthly_internal_test') {
      return {
        id: 'monthly_test',
        title: 'Monthly Internal Test Credits',
        credits: 15,
        categoryGroup: 'Academics & Tests',
        thresholdValue: 60,
      };
    }

    if (itemId === 'fourth_month_test' || itemId === 'month_4_test') {
      return {
        id: 'fourth_month_test',
        title: 'Month 4 Overall Semester Assessment Credits',
        credits: 50,
        categoryGroup: 'Academics & Tests',
        thresholdValue: 65,
      };
    }

    return null;
  },

  // Backward-compatible rules extractor for video & attendance
  getRules(): CreditRuleConfig {
    try {
      const cats = this.getDynamicCategories();
      let videoCredits = 10;
      let videoWatchPct = 80;
      let attendanceCredits = 25;
      let attendanceTargetPct = 85;

      if (Array.isArray(cats)) {
        cats.forEach((cat) => {
          if (Array.isArray(cat?.items)) {
            cat.items.forEach((item) => {
              if (item?.id === 'video' || (item?.hasThreshold && item?.title && item.title.toLowerCase().includes('video'))) {
                videoCredits = Number(item.credits) || 10;
                if (item.thresholdValue) videoWatchPct = Number(item.thresholdValue) || 80;
              }
              if (item?.id === 'attendance_bonus' || (item?.hasThreshold && item?.title && item.title.toLowerCase().includes('attendance'))) {
                attendanceCredits = Number(item.credits) || 25;
                if (item.thresholdValue) attendanceTargetPct = Number(item.thresholdValue) || 85;
              }
            });
          }
        });
      }

      return {
        ...DEFAULT_CREDIT_RULES,
        video_completion: { credits: videoCredits, required_watch_pct: videoWatchPct },
        attendance_milestone: { credits: attendanceCredits, required_attendance_pct: attendanceTargetPct },
      };
    } catch (e) {
      console.warn('Error reading credit rules, using defaults', e);
      return DEFAULT_CREDIT_RULES;
    }
  },

  // 2. Student Credit Ledger Operations (Local Storage Cache)
  getStudentTransactions(studentId: string): CreditTransaction[] {
    if (!studentId) return [];
    try {
      const stored = safeStorage.getItem(`${CREDITS_STORAGE_PREFIX}${studentId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse student transactions', e);
    }
    return [];
  },

  getStudentTotalCredits(studentId: string): number {
    const transactions = this.getStudentTransactions(studentId);
    if (!Array.isArray(transactions)) return 0;
    return Number(transactions.reduce((acc, curr) => acc + (Number(curr?.credits) || 0), 0).toFixed(2));
  },

  awardCredits(studentId: string, transaction: Omit<CreditTransaction, 'id' | 'date'>): CreditTransaction {
    const transactions = this.getStudentTransactions(studentId);
    const newTx: CreditTransaction = {
      ...transaction,
      id: 'TX_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      date: new Date().toISOString(),
    };
    transactions.unshift(newTx);
    try {
      safeStorage.setItem(`${CREDITS_STORAGE_PREFIX}${studentId}`, JSON.stringify(transactions));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
    safeDispatchEvent('wegrow_credits_changed', { studentId });
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('wegrow_credits_sync');
        bc.postMessage({ type: 'CREDITS_AWARDED', studentId });
        bc.close();
      }
    } catch (_) {}
    return newTx;
  },

  deleteCreditTransaction(studentId: string, transactionId: string): void {
    let transactions = this.getStudentTransactions(studentId);
    if (Array.isArray(transactions)) {
      transactions = transactions.filter((tx) => tx.id !== transactionId && tx._id !== transactionId);
      try {
        safeStorage.setItem(`${CREDITS_STORAGE_PREFIX}${studentId}`, JSON.stringify(transactions));
      } catch (e) {
        console.warn('Storage save failed', e);
      }
      safeDispatchEvent('wegrow_credits_changed', { studentId });
    }
  },

  // 3. Video Watch Progress & Credit Trigger (Proportional Pool Split & Resume Timestamp)
  getVideoWatchProgress(studentId: string, videoId: string): {
    percentage: number;
    isCredited: boolean;
    lastStoppedTime: number;
    duration?: number;
  } {
    try {
      const key = `${VIDEO_PROGRESS_PREFIX}${studentId}_${videoId}`;
      const stored = safeStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          percentage: Number(parsed?.percentage) || 0,
          isCredited: Boolean(parsed?.isCredited),
          lastStoppedTime: Number(parsed?.lastStoppedTime) || 0,
          duration: Number(parsed?.duration) || 0,
        };
      }
    } catch (e) {
      console.error('Error reading video progress', e);
    }
    return { percentage: 0, isCredited: false, lastStoppedTime: 0, duration: 0 };
  },

  // Persist current stopped position when paused, seeking, or modal closed
  saveVideoPlaybackPosition(
    studentId: string,
    videoId: string,
    currentTime: number,
    duration?: number,
  ): void {
    if (!studentId || !videoId) return;
    try {
      const key = `${VIDEO_PROGRESS_PREFIX}${studentId}_${videoId}`;
      const current = this.getVideoWatchProgress(studentId, videoId);
      const stoppedSecs = Math.max(0, Math.round(currentTime));
      const calcPct = duration && duration > 0 ? Math.round((stoppedSecs / duration) * 100) : current.percentage;
      const highestPercentage = Math.max(current.percentage, calcPct);

      safeStorage.setItem(
        key,
        JSON.stringify({
          percentage: highestPercentage,
          isCredited: current.isCredited,
          lastStoppedTime: stoppedSecs,
          duration: duration ? Math.round(duration) : (current.duration || 0),
        }),
      );
    } catch (e) {
      console.warn('Storage save playback position failed', e);
    }
  },

  // Calculate proportional credit per video based on Admin's pool setting
  calculateCreditPerVideo(totalVideosCount: number): number {
    try {
      const rules = this.getRules();
      const totalPool = rules?.video_completion?.credits ?? 10;
      if (!totalVideosCount || totalVideosCount <= 0) return totalPool;
      return Number((totalPool / totalVideosCount).toFixed(2));
    } catch {
      return 1.67;
    }
  },

  updateVideoProgress(
    studentId: string,
    videoId: string,
    videoTitle: string,
    percentage: number,
    currentTime?: number,
    duration?: number,
    customCreditPerVideo?: number,
  ): { awarded: boolean; credits: number; newPercentage: number; lastStoppedTime: number } {
    const key = `${VIDEO_PROGRESS_PREFIX}${studentId}_${videoId}`;
    const current = this.getVideoWatchProgress(studentId, videoId);
    const rules = this.getRules();
    const threshold = rules?.video_completion?.required_watch_pct ?? 80;
    const creditPoints = customCreditPerVideo !== undefined 
      ? customCreditPerVideo 
      : (rules?.video_completion?.credits ?? 10);

    const highestPercentage = Math.max(current.percentage, Math.round(percentage));
    const lastStopped = currentTime !== undefined ? Math.round(currentTime) : current.lastStoppedTime;
    let justAwarded = false;

    // Check if ALREADY credited in record OR in student transaction history:
    const txs = this.getStudentTransactions(studentId);
    const alreadyCreditedInTx = Array.isArray(txs) && txs.some(
      (tx) => tx.source_id === videoId || (tx.category === 'video' && tx.title?.includes(videoTitle)),
    );
    const isAlreadyAwarded = Boolean(current.isCredited || alreadyCreditedInTx);

    // Only award IF NOT ALREADY AWARDED! Once credits are given, never award again when rewatching.
    if (!isAlreadyAwarded && highestPercentage >= threshold) {
      void this.awardCreditsApi(
        studentId,
        {
          category: 'video',
          title: `Video Completed: ${videoTitle}`,
          credits: creditPoints,
          awarded_by: 'Auto (Video System)',
          notes: `Reached ${highestPercentage}% watch threshold (Required: ${threshold}%) • Proportional Pool Award`,
          source_id: videoId,
        },
      ).catch((err) => {
        console.warn('Backend sync for video credits skipped:', err?.message || err);
      });

      justAwarded = true;
    }

    try {
      safeStorage.setItem(
        key,
        JSON.stringify({
          percentage: highestPercentage,
          isCredited: isAlreadyAwarded || justAwarded,
          lastStoppedTime: lastStopped,
          duration: duration ? Math.round(duration) : (current.duration || 0),
        }),
      );
    } catch (e) {
      console.warn('Storage save failed', e);
    }

    return {
      awarded: justAwarded,
      credits: justAwarded ? creditPoints : 0,
      newPercentage: highestPercentage,
      lastStoppedTime: lastStopped,
    };
  },

  // 4. Automated Staff Attendance Milestone Bonus
  checkAndAwardAttendanceBonus(studentId: string, currentAttendancePct: number, staffName: string = 'Staff'): boolean {
    const rules = this.getRules();
    const threshold = rules?.attendance_milestone?.required_attendance_pct ?? 85;
    const bonusCredits = rules?.attendance_milestone?.credits ?? 25;

    if (currentAttendancePct < threshold) {
      return false;
    }

    const transactions = this.getStudentTransactions(studentId);
    const currentMonthKey = new Date().toISOString().substring(0, 7);
    const alreadyAwardedThisMonth = Array.isArray(transactions) && transactions.some(
      (tx) => tx.category === 'attendance_bonus' && (tx.date || tx.createdAt || '').startsWith(currentMonthKey),
    );

    if (alreadyAwardedThisMonth) {
      return false;
    }

    this.awardCredits(studentId, {
      category: 'attendance_bonus',
      title: `Attendance Milestone (${currentAttendancePct}% Achieved)`,
      credits: bonusCredits,
      awarded_by: `${staffName} / Auto-System`,
      notes: `Exceeded staff target of ${threshold}% for cycle ${currentMonthKey}`,
    });

    return true;
  },

  // 5. Backend REST API Integrations (Dual Online / Local Sync)
  async fetchRulesApi(companyId?: string): Promise<DynamicCategoryGroup[]> {
    try {
      const res = await api.get('/credits/rules', {
        params: companyId ? { company_id: companyId } : {},
      });
      if (res.data?.success && Array.isArray(res.data.data?.categories)) {
        const categories = res.data.data.categories;
        this.saveDynamicCategories(categories);
        return categories;
      }
    } catch (err) {
      console.warn('Backend /credits/rules unreachable, using cached rules:', err);
    }
    return this.getDynamicCategories();
  },

  async saveRulesApi(categories: DynamicCategoryGroup[], companyId?: string): Promise<boolean> {
    // 1. Immediately save locally for instantaneous UI response
    this.saveDynamicCategories(categories);

    // 2. Persist to MongoDB backend
    try {
      const res = await api.put(
        '/credits/rules',
        { categories },
        { params: companyId ? { company_id: companyId } : {} },
      );
      return res.data?.success ?? true;
    } catch (err) {
      console.warn('Backend save to MongoDB failed, saved locally:', err);
      return true;
    }
  },

  async resetRulesApi(companyId?: string): Promise<DynamicCategoryGroup[]> {
    try {
      const res = await api.post(
        '/credits/rules/reset',
        {},
        { params: companyId ? { company_id: companyId } : {} },
      );
      if (res.data?.success && Array.isArray(res.data.data?.categories)) {
        const categories = res.data.data.categories;
        this.saveDynamicCategories(categories);
        return categories;
      }
    } catch (err) {
      console.warn('Backend reset failed, resetting local:', err);
    }
    return this.resetDynamicCategories();
  },

  async awardCreditsApi(
    studentId: string,
    transaction: Omit<CreditTransaction, 'id' | 'date'>,
    companyId?: string,
  ): Promise<any> {
    // 1. Save to local ledger
    const localTx = this.awardCredits(studentId, transaction);

    // 2. Transmit to backend
    try {
      const payload = {
        student_id: studentId,
        student_name: (transaction as any).student_name,
        category: transaction.category,
        title: transaction.title,
        credits: transaction.credits,
        notes: transaction.notes,
        source_id: transaction.source_id,
        certificateVerified: transaction.certificateVerified,
        certificateTitle: transaction.certificateTitle,
        certificateNumber: transaction.certificateNumber,
        certificateDate: transaction.certificateDate,
        certificateFileUrl: transaction.certificateFileUrl,
      };

      const res = await api.post('/credits/award', payload, {
        params: companyId ? { company_id: companyId } : {},
      });
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('wegrow_credits_sync');
          bc.postMessage({ type: 'CREDITS_AWARDED', studentId });
          bc.close();
        }
      } catch (_) {}
      return res.data?.data || res.data || localTx;
    } catch (err: any) {
      console.error('Backend award credit API failed:', err);
      throw err;
    }
  },

  async getStudentCreditsApi(studentId: string): Promise<{ totalCredits: number; transactions: CreditTransaction[] }> {
    try {
      const res = await api.get(`/credits/student/${studentId}`);
      const payload = res.data?.data || res.data;
      if (payload && (Array.isArray(payload.transactions) || payload.totalCredits !== undefined)) {
        const rawTxs = Array.isArray(payload.transactions) ? payload.transactions : [];
        const normalizedBackendTxs = rawTxs.map((t: any) => ({
          ...t,
          id: t.id || t._id || `tx_${Math.random().toString(36).substring(2, 9)}`,
          date: t.date || t.createdAt || t.created_at || t.certificateDate || new Date().toISOString(),
        }));
        // Exam submissions historically wrote awards to browser storage only. Merge
        // those local awards into the server response so the Credits page does not
        // hide them just because the server has not received that transaction yet.
        const localTxs = this.getStudentTransactions(studentId);
        const backendKeys = new Set(normalizedBackendTxs.flatMap((t: any) => [
          t.id && `id:${t.id}`,
          t._id && `id:${t._id}`,
          t.source_id && `source:${t.category}:${t.source_id}`,
          `entry:${t.category}:${t.title}:${Number(t.credits) || 0}`,
        ].filter(Boolean)));
        const missingLocalTxs = localTxs.filter((t: any) => {
          const keys = [
            t.id && `id:${t.id}`,
            t._id && `id:${t._id}`,
            t.source_id && `source:${t.category}:${t.source_id}`,
            `entry:${t.category}:${t.title}:${Number(t.credits) || 0}`,
          ].filter(Boolean);
          if (keys.some((key) => backendKeys.has(key))) return false;
          keys.forEach((key) => backendKeys.add(key));
          return true;
        });
        const normalizedTxs = [...normalizedBackendTxs, ...missingLocalTxs];
        return {
          totalCredits: Number(normalizedTxs.reduce((sum: number, tx: any) => sum + (Number(tx.credits) || 0), 0).toFixed(2)),
          transactions: normalizedTxs,
        };
      }
    } catch (err) {
      console.warn('Could not fetch student credits from backend, using local:', err);
    }
    return {
      totalCredits: this.getStudentTotalCredits(studentId),
      transactions: this.getStudentTransactions(studentId),
    };
  },

  async getLedgerApi(companyId?: string, search?: string): Promise<CreditTransaction[]> {
    try {
      const res = await api.get('/credits/ledger', {
        params: {
          ...(companyId ? { company_id: companyId } : {}),
          ...(search ? { search } : {}),
        },
      });
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        return data;
      }
    } catch (err) {
      console.warn('Could not fetch global ledger from backend:', err);
    }
    return [];
  },

  async deleteTransactionApi(transactionId: string, studentId?: string): Promise<boolean> {
    if (studentId) {
      this.deleteCreditTransaction(studentId, transactionId);
    }
    try {
      const res = await api.delete(`/credits/transaction/${transactionId}`);
      return res.data?.success ?? true;
    } catch (err) {
      console.warn('Backend delete transaction failed:', err);
      return true;
    }
  },
};

export default creditService;
