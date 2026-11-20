import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  creditService,
  DynamicCategoryGroup,
  DynamicCreditItem,
  CreditTransaction,
} from '../services/creditService';
import { ActionConfirmModal } from '../components/ActionConfirmModal';
import {
  Award,
  Settings,
  PlusCircle,
  History,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  FileCheck,
  Video,
  Presentation,
  Briefcase,
  Trash2,
  Search,
  Plus,
  Edit2,
  X,
  Layers,
  UploadCloud,
  Eye,
  ShieldCheck,
  FileText,
  ChevronDown,
  AlertTriangle,
  Lock,
  Share2,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  Send,
  FileSpreadsheet,
  Table,
  LayoutGrid,
  ArrowUpDown,
  ChevronUp,
} from 'lucide-react';

export const CreditManagementPage: React.FC = () => {
  const { user, activeCompanyId, companies } = useAuth();
  const [activeTab, setActiveTab] = useState<'rules' | 'award' | 'ledger' | 'summary'>('rules');

  // Dynamic Categories state
  const [categories, setCategories] = useState<DynamicCategoryGroup[]>(() =>
    creditService.getDynamicCategories(),
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Adding new item modal / inline state
  const [addingToCategoryId, setAddingToCategoryId] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCredits, setNewItemCredits] = useState<number>(10);
  const [newItemHasThreshold, setNewItemHasThreshold] = useState(false);
  const [newItemThresholdLabel, setNewItemThresholdLabel] = useState('Target %');
  const [newItemThresholdValue, setNewItemThresholdValue] = useState<number>(75);

  // Adding new category modal state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

  // Native/WhatsApp Action & Confirmation Dialog States
  const [deleteItemTarget, setDeleteItemTarget] = useState<{ catId: string; itemId: string; title: string } | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<{ catId: string; title: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [revokeTxTarget, setRevokeTxTarget] = useState<{ id: string; studentId: string; credits: number; studentName: string } | null>(null);
  const [editingItemTarget, setEditingItemTarget] = useState<{ catId: string; item: DynamicCreditItem } | null>(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemCredits, setEditItemCredits] = useState<number>(10);
  const [editItemHasThreshold, setEditItemHasThreshold] = useState(false);
  const [editItemThresholdLabel, setEditItemThresholdLabel] = useState('Target %');
  const [editItemThresholdValue, setEditItemThresholdValue] = useState<number>(75);

  // Award State
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const studentDropdownRef = React.useRef<HTMLDivElement>(null);
  const [selectedItemKey, setSelectedItemKey] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<number>(20);
  const [customTitle, setCustomTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [awardSuccess, setAwardSuccess] = useState('');
  const [awardError, setAwardError] = useState('');

  // Certificate Verification State
  const [isCertVerified, setIsCertVerified] = useState(false);
  const [certTitle, setCertTitle] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [certDate, setCertDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [certFileUrl, setCertFileUrl] = useState<string | null>(null);
  const [certFileName, setCertFileName] = useState('');
  const [viewingCertModal, setViewingCertModal] = useState<CreditTransaction | null>(null);

  // Ledger state
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [backendLedger, setBackendLedger] = useState<any[]>([]);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const txs = await creditService.getLedgerApi(activeCompanyId);
        if (Array.isArray(txs)) {
          setBackendLedger(txs);
        }
      } catch (e) {
        console.warn('Could not load backend ledger:', e);
      }
    };

    fetchLedger();

    // 1. Same-window credit change listener
    const handleCreditChange = () => fetchLedger();
    window.addEventListener('wegrow_credits_changed', handleCreditChange);

    // 2. Cross-tab BroadcastChannel listener
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        broadcastChannel = new BroadcastChannel('wegrow_credits_sync');
        broadcastChannel.onmessage = () => {
          fetchLedger();
        };
      }
    } catch (_) {}

    // 3. Tab visibility / window focus listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLedger();
      }
    };
    window.addEventListener('focus', fetchLedger);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Background real-time polling every 3 seconds to keep Admin & Student portals 100% in sync
    const pollInterval = setInterval(() => {
      fetchLedger();
    }, 3000);

    return () => {
      window.removeEventListener('wegrow_credits_changed', handleCreditChange);
      window.removeEventListener('focus', fetchLedger);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(pollInterval);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [activeCompanyId, refreshTrigger]);

  // Available items list for dropdown (Excludes automated items: attendance & video)
  const allCreditItems = React.useMemo(() => {
    const list: Array<{ id: string; title: string; credits: number; categoryTitle: string }> = [];
    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        // Exclude automated system milestones from manual staff allocation
        if (
          item.id === 'attendance_bonus' ||
          item.id.toLowerCase().includes('attendance') ||
          item.id === 'video'
        ) {
          return;
        }
        list.push({
          id: item.id,
          title: item.title,
          credits: item.credits,
          categoryTitle: cat.title,
        });
      });
    });
    return list;
  }, [categories]);

  // Set initial selected item in award tab
  useEffect(() => {
    if (allCreditItems.length > 0 && !selectedItemKey) {
      setSelectedItemKey(allCreditItems[0].id);
      setCreditAmount(allCreditItems[0].credits);
      setCustomTitle(allCreditItems[0].title);
    }
  }, [allCreditItems, selectedItemKey]);

  // Load students from backend
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        let list: any[] = [];
        try {
          const res = await api.get('/enrollments', {
            params: activeCompanyId ? { company_id: activeCompanyId } : {},
          });
          const raw = res.data?.data || res.data;
          if (Array.isArray(raw) && raw.length > 0) list = raw;
        } catch (e) {
          console.warn('Filtered enrollments call failed, trying without company filter', e);
        }

        if (list.length === 0) {
          const resAll = await api.get('/enrollments');
          const rawAll = resAll.data?.data || resAll.data;
          if (Array.isArray(rawAll) && rawAll.length > 0) list = rawAll;
        }

        if (list.length > 0) {
          setStudents(list);
        } else {
          // Fallback to registered student users
          const userRes = await api.get('/users', { params: { user_type: 'student' } });
          const uList = userRes.data?.data || userRes.data;
          if (Array.isArray(uList) && uList.length > 0) {
            setStudents(
              uList.map((u: any) => ({
                _id: u._id,
                student_name: u.name,
                enrollment_no: u.username || u.phone,
                email: u.email,
                phone: u.phone,
              })),
            );
          }
        }
      } catch (err) {
        console.warn('Could not fetch enrollment list, using local fallback students', err);
      }
    };
    fetchStudents();
  }, [activeCompanyId]);

  // Click outside to close student autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        studentDropdownRef.current &&
        !studentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter students based on typed starting letter or any substring in name/roll
  const filteredStudents = React.useMemo(() => {
    if (!studentSearchQuery.trim()) return students;
    const query = studentSearchQuery.toLowerCase().trim();
    const matched = students.filter((stu) => {
      const name = (stu.student_name || stu.name || '').toLowerCase();
      const roll = (stu.enrollment_no || stu.phone || '').toLowerCase();
      return name.includes(query) || roll.includes(query);
    });
    // Sort so starting-letter matches appear at the top immediately
    return matched.sort((a, b) => {
      const aName = (a.student_name || a.name || '').toLowerCase();
      const bName = (b.student_name || b.name || '').toLowerCase();
      const aStarts = aName.startsWith(query);
      const bStarts = bName.startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return aName.localeCompare(bName);
    });
  }, [students, studentSearchQuery]);

  const handleStudentSearchChange = (val: string) => {
    setStudentSearchQuery(val);
    setIsStudentDropdownOpen(true);
    // Check if typed value matches an exact student
    const matched = students.find((s) => {
      const name = s.student_name || s.name || '';
      const roll = s.enrollment_no || s.phone || '';
      const full = `${name}${roll ? ` (${roll})` : ''}`;
      return name.toLowerCase() === val.trim().toLowerCase() || full.toLowerCase() === val.trim().toLowerCase();
    });
    if (matched) {
      setSelectedStudentId(matched._id || matched.id);
      setSelectedStudentName(matched.student_name || matched.name || 'Student');
    } else if (selectedStudentId) {
      setSelectedStudentId('');
      setSelectedStudentName('');
    }
  };

  const handleClearStudent = () => {
    setStudentSearchQuery('');
    setSelectedStudentId('');
    setSelectedStudentName('');
    setIsStudentDropdownOpen(true);
  };

  const handleSelectStudent = (stu: any) => {
    const sId = stu._id || stu.id;
    const sName = stu.student_name || stu.name || 'Student';
    const sRoll = stu.enrollment_no || stu.phone || '';
    setSelectedStudentId(sId);
    setSelectedStudentName(sName);
    setStudentSearchQuery(`${sName}${sRoll ? ` (${sRoll})` : ''}`);
    setIsStudentDropdownOpen(false);
  };

  // When selected activity changes in award tab
  const handleItemSelectChange = (itemId: string) => {
    setSelectedItemKey(itemId);
    const found = allCreditItems.find((i) => i.id === itemId);
    if (found) {
      setCreditAmount(found.credits);
      setCustomTitle(found.title);

      const isLikelyCertificate =
        found.id.toLowerCase().includes('workshop') ||
        found.id.toLowerCase().includes('hackathon') ||
        found.id.toLowerCase().includes('presentation') ||
        found.title.toLowerCase().includes('workshop') ||
        found.title.toLowerCase().includes('hackathon') ||
        found.title.toLowerCase().includes('presentation') ||
        found.categoryTitle.toLowerCase().includes('co-curricular');

      if (isLikelyCertificate) {
        setIsCertVerified(true);
        if (!certTitle || certTitle.toLowerCase().includes('certificate')) {
          setCertTitle(`${found.title} Certificate`);
        }
      }
    }
  };

  const selectCertificatePreset = (keyword: string, defaultName: string, defaultPts: number) => {
    const found = allCreditItems.find(
      (i) =>
        i.id.toLowerCase().includes(keyword.toLowerCase()) ||
        i.title.toLowerCase().includes(keyword.toLowerCase()),
    );
    if (found) {
      setSelectedItemKey(found.id);
      setCreditAmount(found.credits);
      setCustomTitle(found.title);
      setCertTitle(`${found.title} - ${defaultName}`);
    } else {
      setCustomTitle(defaultName);
      setCreditAmount(defaultPts);
      setCertTitle(defaultName);
    }
    setIsCertVerified(true);
  };

  const selectCertificateActivity = (item: { id: string; title: string; credits: number }) => {
    setSelectedItemKey(item.id);
    setCreditAmount(item.credits);
    setCustomTitle(item.title);
    setIsCertVerified(true);
    setCertTitle(`${item.title} Certificate`);
  };

  // Fetch selected student's personal credits & transactions when student changes
  const [selectedStudentCredits, setSelectedStudentCredits] = useState<{
    totalCredits: number;
    transactions: CreditTransaction[];
  } | null>(null);

  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedStudentCredits(null);
      return;
    }
    creditService
      .getStudentCreditsApi(selectedStudentId)
      .then((res) => {
        setSelectedStudentCredits(res);
      })
      .catch(() => {
        setSelectedStudentCredits(null);
      });
  }, [selectedStudentId, refreshTrigger]);

  // Match currently selected activity to configured rules
  const currentConfiguredItem = React.useMemo(() => {
    return allCreditItems.find(
      (it) =>
        (selectedItemKey && it.id.toLowerCase() === selectedItemKey.toLowerCase()) ||
        (customTitle && it.title.toLowerCase() === customTitle.trim().toLowerCase()),
    );
  }, [allCreditItems, selectedItemKey, customTitle]);

  // Compute how many credits this specific student has already earned for this activity
  const activityEarnedCredits = React.useMemo(() => {
    if (!selectedStudentId || !currentConfiguredItem) return 0;
    const txs = selectedStudentCredits?.transactions || [];
    const allTxs = [...txs];
    if (Array.isArray(backendLedger)) {
      backendLedger.forEach((bTx) => {
        const student = bTx.student_id;
        const sId = typeof student === 'object' && student !== null ? (student._id || student.id) : student;
        if (
          String(sId) === String(selectedStudentId) ||
          (selectedStudentName && (bTx.student_name === selectedStudentName || student?.name === selectedStudentName))
        ) {
          if (!allTxs.some((t) => (t._id && t._id === bTx._id) || (t.id && t.id === bTx._id))) {
            allTxs.push(bTx);
          }
        }
      });
    }

    const itId = (currentConfiguredItem.id || '').toLowerCase();
    const itTitle = (currentConfiguredItem.title || '').toLowerCase();
    const selKey = (selectedItemKey || '').toLowerCase();
    const customT = (customTitle || '').toLowerCase();

    const matchedTxs = allTxs.filter((tx: any) => {
      const cat = (tx.category || '').toLowerCase();
      const title = (tx.title || '').toLowerCase();

      return (
        cat === itId ||
        cat === selKey ||
        title === itTitle ||
        title === customT ||
        (itId && cat.includes(itId)) ||
        (itTitle && title.includes(itTitle)) ||
        (customT && title.includes(customT))
      );
    });

    return matchedTxs.reduce((sum, tx) => sum + (Number(tx.credits) || 0), 0);
  }, [selectedStudentCredits, backendLedger, selectedStudentId, selectedStudentName, currentConfiguredItem, selectedItemKey, customTitle]);

  const configuredCap = currentConfiguredItem?.credits || 0;
  const isCapReached = Boolean(
    selectedStudentId &&
    configuredCap > 0 &&
    activityEarnedCredits >= configuredCap,
  );
  const remainingAllowedCredits = Math.max(0, configuredCap - activityEarnedCredits);

  // Helper to check earned credits for quick certificate activity presets
  const getPresetEarnedCredits = (act: any) => {
    if (!selectedStudentId) return 0;
    const txs = selectedStudentCredits?.transactions || [];
    const allTxs = [...txs];
    if (Array.isArray(backendLedger)) {
      backendLedger.forEach((bTx) => {
        const student = bTx.student_id;
        const sId = typeof student === 'object' && student !== null ? (student._id || student.id) : student;
        if (
          String(sId) === String(selectedStudentId) ||
          (selectedStudentName && (bTx.student_name === selectedStudentName || student?.name === selectedStudentName))
        ) {
          if (!allTxs.some((t) => (t._id && t._id === bTx._id) || (t.id && t.id === bTx._id))) {
            allTxs.push(bTx);
          }
        }
      });
    }
    const actId = (act.id || '').toLowerCase();
    const actTitle = (act.title || '').toLowerCase();
    const matched = allTxs.filter((tx: any) => {
      const cat = (tx.category || '').toLowerCase();
      const title = (tx.title || '').toLowerCase();
      return cat === actId || title === actTitle || cat.includes(actId) || title.includes(actTitle);
    });
    return matched.reduce((sum, tx) => sum + (Number(tx.credits) || 0), 0);
  };

  // 4. Student Credit Audit (Finished vs Pending Credits by Category)
  const [summarySearch, setSummarySearch] = useState('');
  const [summaryFilter, setSummaryFilter] = useState<'all' | 'earned' | 'placement' | 'zero'>('all');
  const [copiedReportStudentId, setCopiedReportStudentId] = useState<string | null>(null);
  const [viewingStudentAudit, setViewingStudentAudit] = useState<any | null>(null);
  const [auditViewMode, setAuditViewMode] = useState<'table' | 'cards'>(() => {
    if (typeof window !== 'undefined') {
      try {
        return (localStorage.getItem('wegrow_audit_view_mode') as 'table' | 'cards') || 'table';
      } catch (e) {
        return 'table';
      }
    }
    return 'table';
  });
  const [auditSortKey, setAuditSortKey] = useState<'credits' | 'name' | 'regNo' | 'percentage'>('credits');
  const [auditSortDir, setAuditSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSetAuditViewMode = (mode: 'table' | 'cards') => {
    setAuditViewMode(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('wegrow_audit_view_mode', mode);
      } catch (e) {
        // ignore storage errors
      }
    }
  };

  const handleAuditSort = (key: 'credits' | 'name' | 'regNo' | 'percentage') => {
    if (auditSortKey === key) {
      setAuditSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setAuditSortKey(key);
      setAuditSortDir(key === 'name' || key === 'regNo' ? 'asc' : 'desc');
    }
  };

  const totalConfiguredPool = React.useMemo(() => {
    return (
      categories.reduce(
        (sum, cat) => sum + (cat.items?.reduce((s, it) => s + (it.credits || 0), 0) || 0),
        0,
      ) || 300
    );
  }, [categories]);

  // Strict Campus Branch Resolver: returns strictly 'Sivakasi' or 'Srivilliputhur' based on enrollment & company
  const resolveStudentBranch = (
    stu: any,
    companiesList: any[] = [],
    currentActiveCompanyId?: string | null,
  ): 'Sivakasi' | 'Srivilliputhur' => {
    // 1. Direct branch property on student / enrollment
    const directBranch = String(stu?.branch || '').toLowerCase();
    if (
      directBranch.includes('srivilliputhur') ||
      directBranch.includes('srivilliputtur') ||
      directBranch.includes('svpr') ||
      directBranch.includes('srivi')
    ) {
      return 'Srivilliputhur';
    }
    if (
      directBranch.includes('sivakasi') ||
      directBranch.includes('svks') ||
      directBranch.includes('siva')
    ) {
      return 'Sivakasi';
    }

    // 2. Populated company object or company_id
    const compObj = typeof stu?.company_id === 'object' && stu?.company_id !== null ? stu.company_id : null;
    const compId = compObj?._id || stu?.company_id;

    if (compObj) {
      const bStr = String(compObj.branch || compObj.company_name || '').toLowerCase();
      if (bStr.includes('srivilliputhur') || bStr.includes('srivilliputtur') || bStr.includes('svpr') || bStr.includes('srivi')) {
        return 'Srivilliputhur';
      }
      if (bStr.includes('sivakasi') || bStr.includes('svks') || bStr.includes('siva')) {
        return 'Sivakasi';
      }
    }

    // 3. Match against companies loaded in AuthContext
    if (compId && Array.isArray(companiesList)) {
      const matchedComp = companiesList.find((c) => String(c._id) === String(compId));
      if (matchedComp) {
        const bStr = String(matchedComp.branch || matchedComp.company_name || '').toLowerCase();
        if (bStr.includes('srivilliputhur') || bStr.includes('srivilliputtur') || bStr.includes('svpr') || bStr.includes('srivi')) {
          return 'Srivilliputhur';
        }
        if (bStr.includes('sivakasi') || bStr.includes('svks') || bStr.includes('siva')) {
          return 'Sivakasi';
        }
      }
    }

    // 4. Check enrollment address, center, joining place, college, notes, course
    const textPool = [
      stu?.joining_place,
      stu?.course_joining_place,
      stu?.center,
      stu?.location,
      stu?.address,
      stu?.college_name,
      stu?.city,
      stu?.notes,
      stu?.enrollment_no,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (
      textPool.includes('srivilliputhur') ||
      textPool.includes('srivilliputtur') ||
      textPool.includes('svpr') ||
      textPool.includes('srivi')
    ) {
      return 'Srivilliputhur';
    }
    if (
      textPool.includes('sivakasi') ||
      textPool.includes('svks') ||
      textPool.includes('siva')
    ) {
      return 'Sivakasi';
    }

    // 5. Current active company in session
    if (currentActiveCompanyId && Array.isArray(companiesList)) {
      const activeComp = companiesList.find((c) => String(c._id) === String(currentActiveCompanyId));
      if (activeComp) {
        const bStr = String(activeComp.branch || activeComp.company_name || '').toLowerCase();
        if (bStr.includes('srivilliputhur') || bStr.includes('srivilliputtur') || bStr.includes('svpr') || bStr.includes('srivi')) {
          return 'Srivilliputhur';
        }
        if (bStr.includes('sivakasi') || bStr.includes('svks') || bStr.includes('siva')) {
          return 'Sivakasi';
        }
      }
    }

    // 6. Default to Sivakasi (Headquarters)
    return 'Sivakasi';
  };

  // Reliable multi-environment clipboard copy utility (handles insecure HTTP, iframes, mobile)
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    // 1. Try modern navigator.clipboard if available
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        console.warn('navigator.clipboard.writeText failed, using fallback:', e);
      }
    }

    // 2. Reliable fallback using hidden textarea and execCommand('copy')
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) return true;
    } catch (err) {
      console.warn('execCommand copy fallback failed:', err);
    }

    return false;
  };

  const studentCreditReports = React.useMemo(() => {
    if (!Array.isArray(students) || students.length === 0) return [];

    return students.map((stu, idx) => {
      const sId = stu._id || stu.id || `STU_${idx}`;
      const sName = stu.student_name || stu.name || 'Student';
      const sRoll = stu.enrollment_no || stu.phone || stu.username || `ENT${String(idx + 1).padStart(3, '0')}`;
      const sCourse = stu.course_name || (typeof stu.course_id === 'object' && stu.course_id?.course_name) || 'Professional Certification';
      const sBranch = resolveStudentBranch(stu, companies, activeCompanyId);

      // Find all transactions for this student
      const stuTxs = (backendLedger || []).filter((tx: any) => {
        const student = tx.student_id;
        const txStudentId = typeof student === 'object' && student !== null ? (student._id || student.id) : student;
        return (
          String(txStudentId) === String(sId) ||
          (tx.student_name && tx.student_name.toLowerCase() === sName.toLowerCase()) ||
          (student?.name && student.name.toLowerCase() === sName.toLowerCase())
        );
      });

      // Calculate finished & pending for each configured category
      const categoryBreakdown = categories.map((cat) => {
        const catPool = cat.items?.reduce((s, it) => s + (it.credits || 0), 0) || 0;
        const itIds = (cat.items || []).map((it) => (it.id || '').toLowerCase());
        const itTitles = (cat.items || []).map((it) => (it.title || '').toLowerCase());
        const catId = (cat.id || '').toLowerCase();
        const catTitle = (cat.title || '').toLowerCase();

        const catTxs = stuTxs.filter((tx: any) => {
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

        return {
          id: cat.id,
          title: cat.title,
          pool: catPool,
          finished,
          pending,
          iconName: cat.iconName,
          txCount: catTxs.length,
        };
      });

      const finishedCredits = Number(
        stuTxs.reduce((sum, tx) => sum + (Number(tx.credits) || 0), 0).toFixed(2),
      );
      const pendingCredits = Math.max(0, Number((totalConfiguredPool - finishedCredits).toFixed(2)));
      const percentage = Math.min(100, Math.round((finishedCredits / totalConfiguredPool) * 100));

      let tierName = 'Getting Started';
      let tierColor = 'text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800';

      if (finishedCredits >= 250) {
        tierName = 'Platinum Master';
        tierColor = 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200';
      } else if (finishedCredits >= 200) {
        tierName = 'Diamond Master';
        tierColor = 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 border-sky-200';
      } else if (finishedCredits >= 140) {
        tierName = 'Gold Scholar';
        tierColor = 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/60 border-yellow-200';
      } else if (finishedCredits >= 75) {
        tierName = 'Silver Scholar';
        tierColor = 'text-slate-700 bg-slate-100 dark:bg-slate-800 border-slate-300';
      } else if (finishedCredits >= 25) {
        tierName = 'Bronze Scholar';
        tierColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 border-amber-200';
      } else if (finishedCredits > 0) {
        tierName = 'Learner';
        tierColor = 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800';
      }

      const isPlacementReady = finishedCredits >= 150;

      return {
        id: sId,
        rawStudent: stu,
        name: sName,
        regNo: sRoll,
        course: sCourse,
        branch: sBranch,
        totalPool: totalConfiguredPool,
        finishedCredits,
        pendingCredits,
        percentage,
        tierName,
        tierColor,
        isPlacementReady,
        categories: categoryBreakdown,
        txCount: stuTxs.length,
        transactions: stuTxs,
      };
    });
  }, [students, backendLedger, categories, totalConfiguredPool, companies, activeCompanyId]);

  // Filtered and sorted reports for search and quick status tabs
  const filteredReports = React.useMemo(() => {
    const list = studentCreditReports.filter((rep) => {
      const q = summarySearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        rep.name.toLowerCase().includes(q) ||
        rep.regNo.toLowerCase().includes(q) ||
        rep.course.toLowerCase().includes(q) ||
        rep.branch.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (summaryFilter === 'earned') return rep.finishedCredits > 0;
      if (summaryFilter === 'placement') return rep.isPlacementReady;
      if (summaryFilter === 'zero') return rep.finishedCredits === 0;
      return true;
    });

    return list.sort((a, b) => {
      let comparison = 0;
      if (auditSortKey === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (auditSortKey === 'regNo') {
        comparison = a.regNo.localeCompare(b.regNo);
      } else if (auditSortKey === 'credits') {
        comparison = a.finishedCredits - b.finishedCredits;
      } else if (auditSortKey === 'percentage') {
        comparison = a.percentage - b.percentage;
      }
      return auditSortDir === 'asc' ? comparison : -comparison;
    });
  }, [studentCreditReports, summarySearch, summaryFilter, auditSortKey, auditSortDir]);

  const generateMentorReportText = (rep: any) => {
    const lines = [
      `🎓 *WeGrow Skill Campus - Student Credit & Placement Audit*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Student:* ${rep.name} (${rep.regNo})`,
      `📚 *Course:* ${rep.course}`,
      `🏢 *Campus:* ${rep.branch}`,
      ``,
      `📊 *Overall Performance:*`,
      `• Total Configured Target: ${rep.totalPool} pts`,
      `• ✅ Finished Credits: ${rep.finishedCredits} pts (${rep.percentage}%)`,
      `• ⏳ Pending Credits: ${rep.pendingCredits} pts`,
      `• Standing: ${rep.tierName} (${rep.isPlacementReady ? 'Placement Ready: YES ✅' : 'Placement: Training Phase ⏳'})`,
      ``,
      `📌 *Category-wise Finished vs Pending:*`,
      ...rep.categories.map((c: any) => {
        const isFull = c.finished >= c.pool && c.pool > 0;
        return `• ${c.title}: ${c.finished} / ${c.pool} pts (${isFull ? '✅ Finished' : `⏳ ${c.pending} pts Pending`})`;
      }),
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Generated by Admin from WeGrow Portal on ${new Date().toLocaleDateString('en-IN')}`,
    ];
    return lines.join('\n');
  };

  // WhatsApp Mentor Phone State
  const [mentorPhoneNumber, setMentorPhoneNumber] = useState<string>(() => {
    return localStorage.getItem('last_mentor_phone') || '';
  });
  const [copiedAllExcel, setCopiedAllExcel] = useState(false);

  const cleanPhoneForWhatsApp = (raw: string): string => {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return `91${digits}`;
    return digits;
  };

  // Generate Tab-Separated Values (TSV) for direct paste into Excel columns & rows
  const generateExcelTsv = (list: any[]) => {
    if (!list || list.length === 0) return '';
    const catCols = categories.flatMap((c) => [`${c.title} Finished (Pts)`, `${c.title} Pending (Pts)`]);
    const headers = [
      'Student Name',
      'Roll No',
      'Course',
      'Campus',
      'Target Pool (Pts)',
      'Finished Credits',
      'Pending Credits',
      'Completion %',
      'Standing Tier',
      'Placement Ready',
      ...catCols,
    ];

    const rows = list.map((rep) => {
      const catVals = rep.categories.flatMap((c: any) => [c.finished, c.pending]);
      return [
        rep.name,
        rep.regNo,
        rep.course,
        rep.branch,
        rep.totalPool,
        rep.finishedCredits,
        rep.pendingCredits,
        `${rep.percentage}%`,
        rep.tierName,
        rep.isPlacementReady ? 'YES' : 'NO',
        ...catVals,
      ].join('\t');
    });

    return [headers.join('\t'), ...rows].join('\n');
  };

  // Generate styled HTML Table so Excel parses rich cells, borders & colors on Ctrl+V
  const generateExcelHtml = (list: any[]) => {
    if (!list || list.length === 0) return '';
    const catHeaderHtml = categories
      .map(
        (c) =>
          `<th style="border:1px solid #cbd5e1;padding:8px 10px;background:#e0e7ff;color:#3730a3;">${c.title} Finished</th><th style="border:1px solid #cbd5e1;padding:8px 10px;background:#fef3c7;color:#92400e;">${c.title} Pending</th>`,
      )
      .join('');

    const bodyRows = list
      .map(
        (rep, idx) => `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="border:1px solid #cbd5e1;padding:6px 10px;font-weight:bold;">${rep.name}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;">${rep.regNo}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;">${rep.course}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;font-weight:bold;">${rep.branch}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">${rep.totalPool}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;font-weight:bold;color:#059669;">+${rep.finishedCredits}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;font-weight:bold;color:#d97706;">${rep.pendingCredits}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:center;">${rep.percentage}%</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;">${rep.tierName}</td>
          <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:center;font-weight:bold;color:${rep.isPlacementReady ? '#059669' : '#64748b'};">${rep.isPlacementReady ? 'YES' : 'NO'}</td>
          ${rep.categories
            .map(
              (c: any) =>
                `<td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;color:#059669;">+${c.finished}</td><td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;color:#d97706;">${c.pending}</td>`,
            )
            .join('')}
        </tr>`,
      )
      .join('');

    return `
      <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">
        <thead>
          <tr style="background:#4338ca;color:#ffffff;text-align:left;">
            <th style="border:1px solid #cbd5e1;padding:8px 10px;">Student Name</th>
            <th style="border:1px solid #cbd5e1;padding:8px 10px;">Roll No</th>
            <th style="border:1px solid #cbd5e1;padding:8px 10px;">Course</th>
            <th style="border:1px solid #cbd5e1;padding:8px 10px;">Campus</th>
            <th style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;">Target Pool</th>
            <th style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;">Finished</th>
            <th style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;">Pending</th>
            <th style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;">Completion %</th>
            <th style="border:1px solid #cbd5e1;padding:8px 10px;">Standing</th>
            <th style="border:1px solid #cbd5e1;padding:8px 10px;text-align:center;">Placement Ready</th>
            ${catHeaderHtml}
          </tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    `;
  };

  const copyExcelToClipboard = async (tsvText: string, htmlTable: string): Promise<boolean> => {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      window.isSecureContext &&
      typeof ClipboardItem !== 'undefined'
    ) {
      try {
        const textBlob = new Blob([tsvText], { type: 'text/plain' });
        const htmlBlob = new Blob([htmlTable], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': textBlob,
            'text/html': htmlBlob,
          }),
        ]);
        return true;
      } catch (e) {
        console.warn('ClipboardItem HTML copy failed, falling back to TSV text copy:', e);
      }
    }
    return copyTextToClipboard(tsvText);
  };

  const handleCopyForExcel = async (rep: any) => {
    const tsv = generateExcelTsv([rep]);
    const html = generateExcelHtml([rep]);
    const ok = await copyExcelToClipboard(tsv, html);
    if (ok) {
      setCopiedReportStudentId(rep.id);
      setTimeout(() => setCopiedReportStudentId(null), 2500);
    } else {
      window.prompt('Copy Row for Excel (Ctrl+C, Enter):', tsv);
    }
  };

  const handleCopyAllForExcel = async () => {
    const tsv = generateExcelTsv(filteredReports);
    const html = generateExcelHtml(filteredReports);
    const ok = await copyExcelToClipboard(tsv, html);
    if (ok) {
      setCopiedAllExcel(true);
      setTimeout(() => setCopiedAllExcel(false), 2500);
    } else {
      window.prompt('Copy All Rows for Excel (Ctrl+C, Enter):', tsv);
    }
  };

  const handleShareToWhatsApp = (rep: any, phoneOverride?: string) => {
    const text = generateMentorReportText(rep);
    let targetPhone = phoneOverride !== undefined ? phoneOverride : mentorPhoneNumber;

    if (!targetPhone) {
      const prompted = window.prompt(
        `Enter Mentor's WhatsApp Phone Number for ${rep.name}:\n(e.g., 9876543210. Leave blank to choose contact inside WhatsApp)`,
        mentorPhoneNumber,
      );
      if (prompted === null) return; // User cancelled
      targetPhone = prompted.trim();
    }

    const clean = cleanPhoneForWhatsApp(targetPhone);
    if (clean) {
      setMentorPhoneNumber(targetPhone);
      localStorage.setItem('last_mentor_phone', targetPhone);
      window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Dynamically derive quick certificate buttons from Co-Curricular category + any certificate items
  const quickCertificateActivities = React.useMemo(() => {
    const colorPalettes = [
      {
        border: 'border-amber-200 dark:border-amber-900/60',
        bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-950/30',
        textHover: 'group-hover:text-amber-700 dark:group-hover:text-amber-400',
        ptsBadge: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
      },
      {
        border: 'border-indigo-200 dark:border-indigo-900/60',
        bgHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
        textHover: 'group-hover:text-indigo-700 dark:group-hover:text-indigo-400',
        ptsBadge: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
      },
      {
        border: 'border-emerald-200 dark:border-emerald-900/60',
        bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
        textHover: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-400',
        ptsBadge: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
      },
      {
        border: 'border-purple-200 dark:border-purple-900/60',
        bgHover: 'hover:bg-purple-50 dark:hover:bg-purple-950/30',
        textHover: 'group-hover:text-purple-700 dark:group-hover:text-purple-400',
        ptsBadge: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
      },
      {
        border: 'border-sky-200 dark:border-sky-900/60',
        bgHover: 'hover:bg-sky-50 dark:hover:bg-sky-950/30',
        textHover: 'group-hover:text-sky-700 dark:group-hover:text-sky-400',
        ptsBadge: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60',
      },
      {
        border: 'border-rose-200 dark:border-rose-900/60',
        bgHover: 'hover:bg-rose-50 dark:hover:bg-rose-950/30',
        textHover: 'group-hover:text-rose-700 dark:group-hover:text-rose-400',
        ptsBadge: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60',
      },
    ];

    const coCurricularCat = categories.find(
      (c) => c.id === 'co_curricular' || c.title.toLowerCase().includes('co-curricular'),
    );

    let itemsToInclude: DynamicCreditItem[] = [];

    if (coCurricularCat && coCurricularCat.items.length > 0) {
      // Exclude non-certificate skills like "Communication"
      itemsToInclude = coCurricularCat.items.filter(
        (it) => it.id !== 'communication' && !it.title.toLowerCase().includes('communication'),
      );
    }

    // Also include any activity from any category that explicitly has "certificate" in title/id
    categories.forEach((cat) => {
      if (cat.id !== 'co_curricular' && !cat.title.toLowerCase().includes('co-curricular')) {
        cat.items.forEach((item) => {
          if (
            (item.title.toLowerCase().includes('certificate') ||
              item.id.toLowerCase().includes('certificate')) &&
            item.id !== 'communication' &&
            !item.title.toLowerCase().includes('communication')
          ) {
            if (!itemsToInclude.some((it) => it.id === item.id)) {
              itemsToInclude.push(item);
            }
          }
        });
      }
    });

    if (itemsToInclude.length === 0) {
      itemsToInclude = [
        { id: 'workshop', title: 'Workshop', credits: 20 },
        { id: 'hackathon', title: 'Hackathon', credits: 40 },
        { id: 'presentation', title: 'Presentation', credits: 15 },
      ];
    }

    return itemsToInclude.map((item, index) => ({
      id: item.id,
      title: item.title,
      credits: item.credits,
      colorTheme: colorPalettes[index % colorPalettes.length],
    }));
  }, [categories]);

  const handleCertificateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCertFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 1. Update Title / Credits / Threshold of any existing item
  // Helper to update categories and immediately auto-save to localStorage & backend
  const updateAndSaveCategories = (updater: (prev: DynamicCategoryGroup[]) => DynamicCategoryGroup[]) => {
    setCategories((prev) => {
      const next = updater(prev);
      creditService.saveDynamicCategories(next);
      creditService.saveRulesApi(next, activeCompanyId).catch((err) => {
        console.warn('Auto-save rules to backend skipped:', err);
      });
      return next;
    });
  };

  const handleUpdateItem = (
    catId: string,
    itemId: string,
    field: keyof DynamicCreditItem,
    value: any,
  ) => {
    updateAndSaveCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.map((item) => {
            if (item.id !== itemId) return item;
            return { ...item, [field]: value };
          }),
        };
      }),
    );
  };

  // 2. Delete an individual item/title
  const handleDeleteItem = (catId: string, itemId: string, itemTitle: string) => {
    setDeleteItemTarget({ catId, itemId, title: itemTitle });
  };

  const confirmDeleteItem = () => {
    if (!deleteItemTarget) return;
    const { catId, itemId } = deleteItemTarget;
    updateAndSaveCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.filter((item) => item.id !== itemId),
        };
      }),
    );
    setDeleteItemTarget(null);
  };

  // 3. Add a new item to a category card
  const handleAddNewItemSubmit = (catId: string) => {
    if (!newItemTitle.trim()) {
      return;
    }
    const newItem: DynamicCreditItem = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: newItemTitle.trim(),
      credits: Number(newItemCredits) || 10,
      hasThreshold: newItemHasThreshold,
      thresholdLabel: newItemHasThreshold ? newItemThresholdLabel.trim() || 'Target %' : undefined,
      thresholdValue: newItemHasThreshold ? Number(newItemThresholdValue) || 75 : undefined,
    };

    updateAndSaveCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: [...cat.items, newItem],
        };
      }),
    );

    // Reset inline form
    setAddingToCategoryId(null);
    setNewItemTitle('');
    setNewItemCredits(10);
    setNewItemHasThreshold(false);
  };

  // 4. Add a new category card
  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryTitle.trim()) return;

    const newCat: DynamicCategoryGroup = {
      id: 'cat_' + Date.now(),
      title: newCategoryTitle.trim(),
      iconName: 'Sparkles',
      items: [],
    };

    updateAndSaveCategories((prev) => [...prev, newCat]);
    setNewCategoryTitle('');
    setShowAddCategoryModal(false);
  };

  // 5. Delete an entire category card
  const handleDeleteCategory = (catId: string, catTitle: string) => {
    setDeleteCategoryTarget({ catId, title: catTitle });
  };

  const confirmDeleteCategory = () => {
    if (!deleteCategoryTarget) return;
    updateAndSaveCategories((prev) => prev.filter((cat) => cat.id !== deleteCategoryTarget.catId));
    setDeleteCategoryTarget(null);
  };

  // 5b. Save Edited Activity Item
  const handleSaveEditedItem = () => {
    if (!editingItemTarget || !editItemTitle.trim()) return;
    const { catId, item } = editingItemTarget;
    updateAndSaveCategories((prev) =>
      prev.map((c) => {
        if (c.id !== catId) return c;
        return {
          ...c,
          items: c.items.map((it) => {
            if (it.id !== item.id) return it;
            return {
              ...it,
              title: editItemTitle.trim(),
              credits: Number(editItemCredits) || 10,
              hasThreshold: editItemHasThreshold,
              thresholdLabel: editItemHasThreshold ? editItemThresholdLabel.trim() || 'Target %' : undefined,
              thresholdValue: editItemHasThreshold ? Number(editItemThresholdValue) || 75 : undefined,
            };
          }),
        };
      }),
    );
    setEditingItemTarget(null);
  };

  // Load rules from backend on mount or branch switch
  useEffect(() => {
    creditService.fetchRulesApi(activeCompanyId).then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setCategories(data);
      }
    });
  }, [activeCompanyId]);

  // Save all changes to backend & localStorage
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    await creditService.saveRulesApi(categories, activeCompanyId);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Reset to original defaults on backend & localStorage
  const handleReset = async () => {
    setShowResetConfirm(true);
  };

  const confirmResetToDefaults = async () => {
    const def = await creditService.resetRulesApi(activeCompanyId);
    setCategories(def);
    setSaveSuccess(true);
    setShowResetConfirm(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Direct Award Submit
  const handleAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAwardSuccess('');
    setAwardError('');

    if (!selectedStudentId) {
      setAwardError('Please select or specify a student.');
      return;
    }
    if (creditAmount <= 0) {
      setAwardError('Credits must be greater than zero.');
      return;
    }

    const activityTitle = customTitle.trim() || 'Custom Activity';

    if (isCapReached) {
      setAwardError(
        `Maximum limit reached: ${selectedStudentName || 'Student'} has already earned all ${configuredCap} credits for "${currentConfiguredItem?.title || activityTitle}". Further allocation is locked.`,
      );
      return;
    }

    if (configuredCap > 0 && creditAmount > remainingAllowedCredits) {
      setAwardError(
        `Cannot allocate ${creditAmount} credits: Maximum limit is ${configuredCap} pts and student already has ${activityEarnedCredits} pts. You can only allocate up to ${remainingAllowedCredits} pts.`,
      );
      return;
    }

    try {
      await creditService.awardCreditsApi(
        selectedStudentId,
        {
          student_name: selectedStudentName,
          category: selectedItemKey || 'custom',
          title: activityTitle,
          credits: Number(creditAmount),
          awarded_by: user?.name || user?.username || 'Staff / Admin',
          notes: notes.trim() || undefined,
          certificateVerified: isCertVerified,
          certificateTitle: isCertVerified ? (certTitle.trim() || `${activityTitle} Certificate`) : undefined,
          certificateNumber: isCertVerified ? (certNumber.trim() || undefined) : undefined,
          certificateDate: isCertVerified ? certDate : undefined,
          certificateFileUrl: isCertVerified ? (certFileUrl || undefined) : undefined,
        },
        activeCompanyId,
      );

      setAwardSuccess(
        isCertVerified
          ? `Successfully verified certificate & allocated ${creditAmount} credits to ${selectedStudentName}!`
          : `Successfully allocated ${creditAmount} credits to ${selectedStudentName}!`,
      );
      setNotes('');
      setSelectedStudentId('');
      setSelectedStudentName('');
      setStudentSearchQuery('');
      setIsCertVerified(false);
      setCertTitle('');
      setCertNumber('');
      setCertFileUrl(null);
      setCertFileName('');
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => setAwardSuccess(''), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to award credits on backend database';
      setAwardError(`Error awarding credits: ${msg}`);
    }
  };

  // Aggregate all transactions for ledger view
  const allLedgerEntries = React.useMemo(() => {
    if (backendLedger.length > 0) {
      return backendLedger.map((tx: any) => {
        const student = tx.student_id;
        const studentName =
          typeof student === 'object' && student !== null
            ? (student.name || student.student_name || 'Student')
            : (students.find((s) => (s._id || s.id) === student)?.student_name || 'Student');
        const sId = typeof student === 'object' && student !== null ? (student._id || student.id) : student;
        return {
          studentId: sId,
          studentName,
          tx: {
            id: tx._id || tx.id,
            _id: tx._id,
            category: tx.category,
            title: tx.title,
            credits: tx.credits,
            awarded_by: tx.awarded_by,
            date: tx.createdAt || tx.date || new Date().toISOString(),
            notes: tx.notes,
            certificateVerified: tx.certificateVerified,
            certificateTitle: tx.certificateTitle,
            certificateNumber: tx.certificateNumber,
            certificateDate: tx.certificateDate,
            certificateFileUrl: tx.certificateFileUrl,
          },
        };
      });
    }

    const list: Array<{ studentId: string; studentName: string; tx: CreditTransaction }> = [];
    students.forEach((stu) => {
      const sId = stu._id || stu.id;
      const sName = stu.student_name || stu.name || sId;
      const txs = creditService.getStudentTransactions(sId);
      txs.forEach((tx) => {
        list.push({ studentId: sId, studentName: sName, tx });
      });
    });
    return list.sort((a, b) => new Date(b.tx.date).getTime() - new Date(a.tx.date).getTime());
  }, [backendLedger, students, refreshTrigger]);

  const filteredLedger = allLedgerEntries.filter(
    (item) =>
      item.studentName.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.tx.title.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.tx.awarded_by.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (item.tx.notes && item.tx.notes.toLowerCase().includes(ledgerSearch.toLowerCase())),
  );

  const getCategoryTheme = (iconName?: string) => {
    switch (iconName) {
      case 'FileCheck':
        return {
          topBorder: 'border-t-4 border-t-indigo-600',
          iconBg: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
          badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
          dotColor: 'bg-indigo-600 shadow-xs shadow-indigo-500/50',
          headingColor: 'text-indigo-950 dark:text-indigo-100',
        };
      case 'Video':
        return {
          topBorder: 'border-t-4 border-t-sky-500',
          iconBg: 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
          badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
          dotColor: 'bg-sky-500 shadow-xs shadow-sky-500/50',
          headingColor: 'text-sky-950 dark:text-sky-100',
        };
      case 'Presentation':
        return {
          topBorder: 'border-t-4 border-t-amber-500',
          iconBg: 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
          badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
          dotColor: 'bg-amber-500 shadow-xs shadow-amber-500/50',
          headingColor: 'text-amber-950 dark:text-amber-100',
        };
      case 'Briefcase':
        return {
          topBorder: 'border-t-4 border-t-rose-500',
          iconBg: 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
          badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
          dotColor: 'bg-rose-500 shadow-xs shadow-rose-500/50',
          headingColor: 'text-rose-950 dark:text-rose-100',
        };
      default:
        return {
          topBorder: 'border-t-4 border-t-purple-600',
          iconBg: 'bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
          badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
          dotColor: 'bg-purple-600 shadow-xs shadow-purple-500/50',
          headingColor: 'text-purple-950 dark:text-purple-100',
        };
    }
  };

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'FileCheck':
        return <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'Video':
        return <Video className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case 'Presentation':
        return <Presentation className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
  };

  // Balanced columns distribution - removes any vertical gap or empty space
  const columnGroups = React.useMemo(() => {
    const cols: DynamicCategoryGroup[][] = [[], [], []];

    categories.forEach((cat) => {
      // Co-Curricular or any card with >= 4 items placed in Col 2 (Right Column)
      if ((cat.id === 'co_curricular' || cat.items.length >= 4) && cols[2].length === 0) {
        cols[2].push(cat);
      } else {
        const count0 = cols[0].reduce((s, c) => s + c.items.length + 1, 0);
        const count1 = cols[1].reduce((s, c) => s + c.items.length + 1, 0);
        const count2 = cols[2].reduce((s, c) => s + c.items.length + 1, 0);

        if (count0 <= count1 && count0 <= count2) {
          cols[0].push(cat);
        } else if (count1 <= count0 && count1 <= count2) {
          cols[1].push(cat);
        } else {
          cols[2].push(cat);
        }
      }
    });
    return cols;
  }, [categories]);

  const renderCategoryCard = (cat: DynamicCategoryGroup) => {
    const theme = getCategoryTheme(cat.iconName || cat.id);

    return (
      <div
        key={cat.id}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3.5 hover:border-slate-300 transition ${theme.topBorder}`}
      >
        {/* Category Header */}
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
          {/* Top action row with Icon, Badge & Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Colorful Icon Pill */}
              <div className={`p-2 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-2xs ${theme.iconBg}`}>
                {getCategoryIcon(cat.iconName)}
              </div>

              {/* Count Badge */}
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${theme.badgeBg}`}>
                {cat.items.length} {cat.items.length === 1 ? 'Activity' : 'Activities'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setAddingToCategoryId(cat.id);
                  setNewItemTitle('');
                  setNewItemCredits(10);
                  setNewItemHasThreshold(false);
                }}
                className="px-2.5 py-1 text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-black flex items-center gap-1 transition shadow-2xs"
                title="Add new activity to this category"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id, cat.title)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                title="Delete category card"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Highlighted Full-Width Category Heading - 100% VISIBLE */}
          <div>
            <input
              type="text"
              value={cat.title}
              onChange={(e) => {
                const val = e.target.value;
                setCategories((prev) =>
                  prev.map((c) => (c.id === cat.id ? { ...c, title: val } : c)),
                );
              }}
              onBlur={() => {
                creditService.saveDynamicCategories(categories);
                creditService.saveRulesApi(categories, activeCompanyId).catch(() => {});
              }}
              className="w-full font-black text-slate-900 dark:text-white text-base tracking-tight bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 rounded px-1.5 py-0.5 border border-transparent focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 outline-none transition"
              title="Click to rename category"
            />
          </div>
        </div>

        {/* List of items inside this card */}
        <div className="space-y-3">
          {cat.items.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No activities yet. Click "+ Add" above.
            </div>
          )}

          {cat.items.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 rounded-xl space-y-2 relative group hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              {/* Title & Delete Row - Highlighted Heading */}
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${theme.dotColor}`} />
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      handleUpdateItem(cat.id, item.id, 'title', e.target.value)
                    }
                    placeholder="Activity Title"
                    className="w-full text-xs sm:text-sm font-black text-slate-900 dark:text-white bg-transparent hover:bg-white dark:hover:bg-slate-700 rounded px-1.5 py-0.5 border border-transparent focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-700 outline-none transition truncate"
                    title="Click to edit activity title"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItemTarget({ catId: cat.id, item });
                      setEditItemTitle(item.title);
                      setEditItemCredits(item.credits);
                      setEditItemHasThreshold(Boolean(item.hasThreshold));
                      setEditItemThresholdLabel(item.thresholdLabel || 'Target %');
                      setEditItemThresholdValue(item.thresholdValue || 75);
                    }}
                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-md transition"
                    title="Edit activity details in modal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(cat.id, item.id, item.title)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition"
                    title="Delete this title and allocation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Credits & Threshold / Direct Allocation Row */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Credits
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={item.credits}
                    onChange={(e) =>
                      handleUpdateItem(cat.id, item.id, 'credits', Number(e.target.value))
                    }
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-indigo-700 dark:text-indigo-400 font-black text-sm focus:border-indigo-500 focus:outline-none transition shadow-2xs"
                  />
                </div>

                {item.hasThreshold ? (
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1 truncate">
                      {item.thresholdLabel || 'Target %'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.thresholdValue || 0}
                      onChange={(e) =>
                        handleUpdateItem(
                          cat.id,
                          item.id,
                          'thresholdValue',
                          Number(e.target.value),
                        )
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-black text-sm focus:border-indigo-500 focus:outline-none transition shadow-2xs"
                    />
                  </div>
                ) : (
                  <div className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 pt-5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      Direct Allocation
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Inline Add Item Form if active for this category */}
          {addingToCategoryId === cat.id && (
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                <span>+ Add New Activity to {cat.title}</span>
                <button
                  type="button"
                  onClick={() => setAddingToCategoryId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Activity Title (e.g. Industry Visit, GD)"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-semibold focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                    Credits
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={newItemCredits}
                    onChange={(e) => setNewItemCredits(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                    Has Threshold %?
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newItemHasThreshold}
                      onChange={(e) => setNewItemHasThreshold(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>Add % Target</span>
                  </label>
                </div>
              </div>

              {newItemHasThreshold && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Label (e.g. Min %)"
                    value={newItemThresholdLabel}
                    onChange={(e) => setNewItemThresholdLabel(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Target Value"
                    value={newItemThresholdValue}
                    onChange={(e) => setNewItemThresholdValue(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAddingToCategoryId(null)}
                  className="px-2.5 py-1 rounded-lg text-xs text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAddNewItemSubmit(cat.id)}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs"
                >
                  Add Activity
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Student Credits</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Add Category Card</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            1. Credit Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('award')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'award'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            2. Allocate / Award Credits to Student
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'ledger'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            3. Credit Audit Ledger ({allLedgerEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'summary'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            4. Student Credit Audit
          </button>
        </div>
      </div>

      {/* Tab 1: Dynamic Edit, Add & Delete Rules */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveAll} className="space-y-6">
          {saveSuccess && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-semibold shadow-xs">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>All changes saved successfully! Updated titles and credit allocations are now active across the portal.</span>
            </div>
          )}

          {/* Balanced Columns Grid - Completely removes empty vertical space */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {columnGroups.map((colCards, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-4">
                {colCards.map((cat) => renderCategoryCard(cat))}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Reset to Defaults
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
            >
              <Save className="w-4 h-4" /> Save All Rule Changes
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Allocate / Award Credits to Student */}
      {activeTab === 'award' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl shadow-xs space-y-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Allocate Credits to Student
            </h2>
          </div>

          {/* Dynamic 1-Click Quick Certificate Selection Presets (Auto-syncs from Co-Curricular) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Certificate Quick Allocation</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {quickCertificateActivities.map((act) => {
                const isSelected = selectedItemKey === act.id;
                const earnedForPreset = getPresetEarnedCredits(act);
                const isPresetFull = Boolean(selectedStudentId && act.credits > 0 && earnedForPreset >= act.credits);

                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => selectCertificateActivity(act)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition text-left group shadow-2xs ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/80 ring-2 ring-indigo-500/20'
                        : isPresetFull
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 opacity-80'
                        : `${act.colorTheme.border} bg-white dark:bg-slate-800 ${act.colorTheme.bgHover}`
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div
                        className={`text-xs font-bold text-slate-800 dark:text-slate-200 truncate ${act.colorTheme.textHover}`}
                      >
                        {act.title}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        {isPresetFull ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Full ({earnedForPreset}/{act.credits} pts)
                          </span>
                        ) : selectedStudentId && earnedForPreset > 0 ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            Earned: {earnedForPreset}/{act.credits} pts
                          </span>
                        ) : (
                          <span>Certificate Verified</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded flex-shrink-0 ${
                        isPresetFull
                          ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          : act.colorTheme.ptsBadge
                      }`}
                    >
                      +{act.credits} pts
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleAwardSubmit} className="space-y-4">
            {/* Searchable Student Autocomplete Combobox */}
            <div className="relative" ref={studentDropdownRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Student{' '}
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                    (Type any letter to search & suggest)
                  </span>
                </label>
                {selectedStudentId && (
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    Selected: {selectedStudentName}
                  </span>
                )}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => handleStudentSearchChange(e.target.value)}
                  onFocus={() => setIsStudentDropdownOpen(true)}
                  placeholder="Search student by name or roll no..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-16 py-2.5 text-slate-900 dark:text-white font-semibold text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition shadow-inner"
                />

                <div className="absolute right-2.5 top-2 flex items-center gap-1">
                  {studentSearchQuery && (
                    <button
                      type="button"
                      onClick={handleClearStudent}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsStudentDropdownOpen((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg transition"
                    title="Toggle suggestions list"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isStudentDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Suggestions Dropdown Box */}
              {isStudentDropdownOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                      No students found matching "
                      <strong className="text-slate-700 dark:text-slate-200">{studentSearchQuery}</strong>"
                    </div>
                  ) : (
                    filteredStudents.map((stu) => {
                      const id = stu._id || stu.id;
                      const name = stu.student_name || stu.name || id;
                      const roll = stu.enrollment_no || stu.phone || '';
                      const isSelected = selectedStudentId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleSelectStudent(stu)}
                          className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div>
                            <span className="font-bold">{name}</span>
                            {roll && (
                              <span className="ml-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                ({roll})
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                              ✓ Selected
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Choose Configured Activity
              </label>
              <select
                value={selectedItemKey}
                onChange={(e) => handleItemSelectChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-semibold text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition shadow-inner"
              >
                {allCreditItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.categoryTitle}] {item.title} ({item.credits} pts)
                  </option>
                ))}
              </select>
            </div>

            {/* Dedicated Certificate Verification Option */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isCertVerified
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCertVerified}
                    onChange={(e) => setIsCertVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Student Presented Certificate (Workshop / Hackathon / Presentation)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal">
                      Enable to officially verify and attach the student's certificate proof
                    </span>
                  </div>
                </label>
                {isCertVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 self-start sm:self-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Staff Verified
                  </span>
                )}
              </div>

              {isCertVerified && (
                <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/60 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Certificate Name / Event
                      </label>
                      <input
                        type="text"
                        value={certTitle}
                        onChange={(e) => setCertTitle(e.target.value)}
                        placeholder="e.g. Fullstack AI Workshop / IIT Hackathon"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Certificate / Credential ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={certNumber}
                        onChange={(e) => setCertNumber(e.target.value)}
                        placeholder="e.g. CERT-2026-0982 or Issuer Org"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Certificate Date
                      </label>
                      <input
                        type="date"
                        value={certDate}
                        onChange={(e) => setCertDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Attach Certificate Copy (Optional)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleCertificateFileUpload}
                          id="cert-upload-input"
                          className="hidden"
                        />
                        <label
                          htmlFor="cert-upload-input"
                          className="cursor-pointer flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                          <span>{certFileName ? 'Change Proof' : 'Upload Proof / Photo'}</span>
                        </label>
                        {certFileName && (
                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                            <span className="truncate">{certFileName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCertFileUrl(null);
                                setCertFileName('');
                              }}
                              className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                              title="Remove proof"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {certFileUrl && certFileUrl.startsWith('data:image') && (
                    <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                      <span className="text-[10px] text-slate-500 block mb-1 font-semibold">Attached Certificate Preview:</span>
                      <img
                        src={certFileUrl}
                        alt="Certificate Preview"
                        className="h-24 w-auto rounded border border-slate-200 object-cover shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Activity Title (Editable)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Activity Title"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-semibold text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition shadow-inner"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Credits to Allocate {configuredCap > 0 && `(Admin Cap: ${configuredCap} pts)`}
                </label>
                {selectedStudentId && currentConfiguredItem && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                      isCapReached
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                        : activityEarnedCredits > 0
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                    }`}
                  >
                    {isCapReached ? (
                      <>
                        <Lock className="w-3 h-3 text-rose-600" />
                        <span>Cap Reached: {activityEarnedCredits} / {configuredCap} pts</span>
                      </>
                    ) : (
                      <span>Earned: {activityEarnedCredits} / {configuredCap} pts (Remaining: {remainingAllowedCredits} pts)</span>
                    )}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                max={configuredCap > 0 ? remainingAllowedCredits : undefined}
                disabled={isCapReached}
                value={creditAmount}
                onChange={(e) => setCreditAmount(Number(e.target.value))}
                className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 py-2.5 font-extrabold text-base focus:bg-white focus:outline-none transition shadow-inner ${
                  isCapReached
                    ? 'border-rose-300 text-slate-400 bg-slate-100 dark:bg-slate-900 cursor-not-allowed'
                    : 'border-slate-300 dark:border-slate-700 text-indigo-700 dark:text-indigo-400 focus:border-indigo-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Notes / Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Verified 1st prize certificate from National Hackathon 2026"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isCapReached}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-medium text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Warning Banner When Activity Limit Is Reached */}
            {isCapReached && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold flex items-center gap-1.5">
                    <span>Maximum Activity Limit Reached ({configuredCap} / {configuredCap} pts)</span>
                  </p>
                  <p className="text-xs opacity-90 mt-0.5 leading-relaxed font-normal">
                    <strong>{selectedStudentName || 'This student'}</strong> has already earned all <strong>{configuredCap} credits</strong> configured by Admin for <strong>"{currentConfiguredItem?.title}"</strong>. Further credit allocation for this activity is locked.
                  </p>
                </div>
              </div>
            )}

            {awardSuccess && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-semibold shadow-xs animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <span>{awardSuccess}</span>
              </div>
            )}

            {awardError && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm font-semibold shadow-xs animate-in fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{awardError}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isCapReached}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isCapReached
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none border border-slate-300 dark:border-slate-700'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20 active:scale-[0.98]'
                }`}
              >
                {isCapReached ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Activity Credit Limit Reached (Allocation Locked)
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    Approve & Grant Credits
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Credit Ledger Audit */}
      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Student Credit Transaction History
              </h2>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, certificate, staff..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:border-indigo-500 focus:outline-none w-64 shadow-inner"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Activity & Certificate</th>
                  <th className="py-3 px-4">Category Key</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Awarded By</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                      No credit transactions recorded yet. Use the "Allocate / Award Credits" tab or watch videos to generate transactions.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map(({ studentId, studentName, tx }) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{studentName}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{tx.title}</div>
                        {tx.notes && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tx.notes}</div>}
                        {tx.certificateVerified && (
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              <FileCheck className="w-3 h-3 text-amber-600" />
                              <span>Verified: {tx.certificateTitle || 'Certificate Proof'}</span>
                              {tx.certificateNumber && <span className="opacity-75 font-mono">({tx.certificateNumber})</span>}
                            </span>
                            {tx.certificateFileUrl && (
                              <button
                                type="button"
                                onClick={() => setViewingCertModal(tx)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[11px] font-bold hover:bg-indigo-100 transition-colors"
                              >
                                <Eye className="w-3 h-3" /> View Proof
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
                          {tx.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-black text-emerald-600 dark:text-emerald-400">+{tx.credits} pts</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">{tx.awarded_by}</td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setRevokeTxTarget({
                              id: tx.id || tx._id || '',
                              studentId,
                              credits: Number(tx.credits) || 0,
                              studentName,
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Revoke / Delete credit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Viewing Certificate Details & Document Modal */}
      {viewingCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-600" />
                  <span>Verified Student Certificate</span>
                </h3>
                <p className="text-xs text-slate-500">{viewingCertModal.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingCertModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Certificate Title</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {viewingCertModal.certificateTitle || viewingCertModal.title}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Credits Awarded</span>
                  <span className="font-bold text-emerald-600">+{viewingCertModal.credits} pts</span>
                </div>
                {viewingCertModal.certificateNumber && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Credential ID / Issuer</span>
                    <span className="font-mono">{viewingCertModal.certificateNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Verified By</span>
                  <span>{viewingCertModal.awarded_by}</span>
                </div>
                {viewingCertModal.certificateDate && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Issue / Event Date</span>
                    <span>{viewingCertModal.certificateDate}</span>
                  </div>
                )}
              </div>

              {viewingCertModal.certificateFileUrl && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Attached Certificate Proof:</span>
                  {viewingCertModal.certificateFileUrl.startsWith('data:image') ? (
                    <img
                      src={viewingCertModal.certificateFileUrl}
                      alt="Certificate Document Proof"
                      className="w-full max-h-96 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                    />
                  ) : (
                    <a
                      href={viewingCertModal.certificateFileUrl}
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
                onClick={() => setViewingCertModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Student Credit Audit & Mentor Reports (Finished vs Pending by Category) */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Header & Metric Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Student Credit Audit</span>
                </h2>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Total Target Pool: {totalConfiguredPool} pts
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Students</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{studentCreditReports.length}</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Active Learners</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {studentCreditReports.filter((r) => r.finishedCredits > 0).length}
                </span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">Placement Ready</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {studentCreditReports.filter((r) => r.isPlacementReady).length}
                </span>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">Pending All Credits</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {studentCreditReports.filter((r) => r.finishedCredits === 0).length}
                </span>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student, enrollment no, or course..."
                    value={summarySearch}
                    onChange={(e) => setSummarySearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setSummaryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      summaryFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    All ({studentCreditReports.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryFilter('earned')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      summaryFilter === 'earned'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    With Credits ({studentCreditReports.filter((r) => r.finishedCredits > 0).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryFilter('placement')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      summaryFilter === 'placement'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    Placement Ready ({studentCreditReports.filter((r) => r.isPlacementReady).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryFilter('zero')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      summaryFilter === 'zero'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    Pending All ({studentCreditReports.filter((r) => r.finishedCredits === 0).length})
                  </button>
                </div>
              </div>

              {/* View Switcher: Table View vs Cards View */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSetAuditViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    auditViewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Switch to Compact Table View"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAuditViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    auditViewMode === 'cards'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Switch to Visual Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards View</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Data Display: Table View vs Cards View */}
          {filteredReports.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
              No students found matching your search or filter.
            </div>
          ) : auditViewMode === 'table' ? (
            /* Table View */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                      <th
                        className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        onClick={() => handleAuditSort('name')}
                        title="Click to sort by student name"
                      >
                        <span>Student Details</span>
                      </th>
                      <th className="py-3.5 px-3">Campus</th>
                      <th
                        className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        onClick={() => handleAuditSort('credits')}
                        title="Click to sort by credits"
                      >
                        <span>Total Score</span>
                      </th>
                      {/* Dynamic Categories Columns */}
                      {categories.map((cat) => {
                        const pool = cat.items?.reduce((s, it) => s + (it.credits || 0), 0) || 0;
                        return (
                          <th key={cat.id} className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="font-extrabold text-slate-700 dark:text-slate-300 normal-case">{cat.title}</div>
                            <div className="text-[10px] font-medium text-slate-400 lowercase">{pool} pts max</div>
                          </th>
                        );
                      })}
                      <th className="py-3.5 px-3 text-center">Milestone Tier</th>
                      <th className="py-3.5 px-3 text-center">Placement</th>
                      <th className="py-3.5 px-4 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredReports.map((rep) => (
                      <tr
                        key={rep.id}
                        onClick={() => setViewingStudentAudit(rep)}
                        className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition cursor-pointer group"
                      >
                        {/* Student Details */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800 group-hover:scale-105 transition-transform">
                              {rep.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {rep.name}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {rep.regNo}
                                </span>
                                <span>•</span>
                                <span className="truncate max-w-[140px]">{rep.course}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Campus */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {rep.branch}
                          </span>
                        </td>

                        {/* Total Score */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="min-w-[80px]">
                              <div className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                                +{rep.finishedCredits} <span className="text-[10px] text-slate-400 font-normal">/ {rep.totalPool}</span>
                              </div>
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                Pending: {rep.pendingCredits} pts
                              </div>
                            </div>
                            <div className="w-16">
                              <div className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 text-right">
                                {rep.percentage}%
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-0.5">
                                <div
                                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full"
                                  style={{ width: `${rep.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Dynamic Category Columns */}
                        {categories.map((cat) => {
                          const catRep = rep.categories.find((c: any) => c.id === cat.id) || {
                            finished: 0,
                            pool: cat.items?.reduce((s, it) => s + (it.credits || 0), 0) || 0,
                            pending: cat.items?.reduce((s, it) => s + (it.credits || 0), 0) || 0,
                          };
                          const isFull = catRep.finished >= catRep.pool && catRep.pool > 0;
                          const hasPartial = catRep.finished > 0;

                          return (
                            <td key={cat.id} className="py-3.5 px-3 text-center whitespace-nowrap">
                              {isFull ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                                  +{catRep.finished} pts
                                  <span className="font-black text-emerald-600">✓</span>
                                </span>
                              ) : hasPartial ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
                                    +{catRep.finished} <span className="text-[10px] text-slate-400 font-normal">/ {catRep.pool}</span>
                                  </span>
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                    -{catRep.pending} pts
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex flex-col items-center opacity-50">
                                  <span className="text-slate-400 font-semibold text-xs">
                                    0 / {catRep.pool}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    -{catRep.pool} pts
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Milestone Tier */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${rep.tierColor}`}>
                            {rep.tierName}
                          </span>
                        </td>

                        {/* Placement Ready */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {rep.isPlacementReady ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800">
                              Ready ✅
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                              Training ⏳
                            </span>
                          )}
                        </td>

                        {/* Action Column */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingStudentAudit(rep);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition border border-slate-200 dark:border-slate-700"
                          >
                            <span>Audit</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="space-y-4">
              {filteredReports.map((rep) => {
                return (
                  <div
                    key={rep.id}
                    onClick={() => setViewingStudentAudit(rep)}
                    className="w-full max-w-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition space-y-4 cursor-pointer"
                  >
                    {/* Top Row: Identity + Progress */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {rep.name}
                          </h3>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {rep.regNo}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${rep.tierColor}`}>
                            {rep.tierName}
                          </span>
                          {rep.isPlacementReady && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              Placement Ready: YES
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {rep.course} • Campus: {rep.branch}
                        </p>
                      </div>

                      {/* Finished vs Pending Overall Scores */}
                      <div className="flex items-center gap-5 flex-wrap">
                        <div className="text-right">
                          <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Finished Credits</div>
                          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            +{rep.finishedCredits} <span className="text-xs text-slate-400 font-semibold">/ {rep.totalPool} pts</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Pending Credits</div>
                          <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                            {rep.pendingCredits} <span className="text-xs text-slate-400 font-semibold">pts</span>
                          </div>
                        </div>

                        {/* Progress Bar & Percentage */}
                        <div className="w-24 sm:w-28 text-right">
                          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                            {rep.percentage}% Done
                          </span>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-1 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${rep.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category-by-Category Finished vs Pending Grid */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                        <span>Category Breakdown (Finished / Pending)</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {rep.categories.length} Categories Configured
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
                        {rep.categories.map((cat: any) => {
                          const isFull = cat.finished >= cat.pool && cat.pool > 0;
                          const pct = cat.pool > 0 ? Math.min(100, Math.round((cat.finished / cat.pool) * 100)) : 0;

                          return (
                            <div
                              key={cat.id}
                              className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition min-w-0 ${
                                isFull
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                                  : cat.finished > 0
                                  ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                                  {cat.title}
                                </span>
                                {isFull && (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black">
                                    ✓ Full
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-baseline justify-between text-[11px]">
                                  <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                                    +{cat.finished} pts
                                  </span>
                                  <span className="text-slate-400 text-[10px] font-semibold">
                                    / {cat.pool} pts
                                  </span>
                                </div>

                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isFull ? 'bg-emerald-500' : cat.finished > 0 ? 'bg-indigo-500' : 'bg-slate-300'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>

                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-0.5">
                                  <span>Pending:</span>
                                  <strong className={cat.pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}>
                                    {cat.pending} pts
                                  </strong>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Full Student Category Breakdown & Mentor Share Dialog */}
      {viewingStudentAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span>{viewingStudentAudit.name}</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border">
                    {viewingStudentAudit.regNo}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {viewingStudentAudit.course} • {viewingStudentAudit.branch}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingStudentAudit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overall Score Meter */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Credit Status</span>
                <div className="text-2xl font-black mt-0.5">
                  {viewingStudentAudit.finishedCredits} <span className="text-sm font-semibold text-amber-400">/ {viewingStudentAudit.totalPool} pts</span>
                </div>
                <span className="text-xs text-slate-300">
                  Pending: <strong className="text-amber-300">{viewingStudentAudit.pendingCredits} pts</strong> ({viewingStudentAudit.percentage}% Completed)
                </span>
              </div>
              <div className="text-right">
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${viewingStudentAudit.tierColor}`}>
                  {viewingStudentAudit.tierName}
                </span>
              </div>
            </div>

            {/* Category Detailed List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Detailed Category Breakdown:
              </h4>
              <div className="space-y-2">
                {viewingStudentAudit.categories.map((c: any) => {
                  const isFull = c.finished >= c.pool && c.pool > 0;
                  return (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{c.title}</span>
                        <span className="text-[11px] text-slate-500">
                          Target Cap: {c.pool} pts
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">
                          Finished: +{c.finished} pts {isFull && '✓'}
                        </span>
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                          Pending: {c.pending} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* WhatsApp to Mentor Number & Excel Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mentor WhatsApp Number:</span>
                </label>
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="e.g. 9876543210 (10 digits)"
                    value={mentorPhoneNumber}
                    onChange={(e) => {
                      setMentorPhoneNumber(e.target.value);
                      localStorage.setItem('last_mentor_phone', e.target.value);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleShareToWhatsApp(viewingStudentAudit, mentorPhoneNumber)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-2xs transition whitespace-nowrap"
                    title="Send performance breakdown directly to this mentor on WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to Mentor</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Copy formatted row to paste directly into your Excel master sheet:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyForExcel(viewingStudentAudit)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs ${
                    copiedReportStudentId === viewingStudentAudit.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {copiedReportStudentId === viewingStudentAudit.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied for Excel!</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Copy for Excel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>Add New Category Card</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sports & Cultural, Industry Bootcamps"
                  value={newCategoryTitle}
                  onChange={(e) => setNewCategoryTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm font-semibold focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  Create Category Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Delete Activity Item Modal (WhatsApp Dialog Style) */}
      <ActionConfirmModal
        isOpen={Boolean(deleteItemTarget)}
        onClose={() => setDeleteItemTarget(null)}
        title="Delete activity?"
        description={`Are you sure you want to delete "${deleteItemTarget?.title}"? This activity will be removed from this category group.`}
        type="delete"
        options={[
          {
            label: 'Delete activity',
            variant: 'danger',
            onClick: confirmDeleteItem,
          },
        ]}
        cancelText="Cancel"
      />

      {/* 2. Delete Category Group Modal (WhatsApp Dialog Style) */}
      <ActionConfirmModal
        isOpen={Boolean(deleteCategoryTarget)}
        onClose={() => setDeleteCategoryTarget(null)}
        title="Delete category group?"
        description={`Are you sure you want to delete "${deleteCategoryTarget?.title}" and all its activities?`}
        type="delete"
        options={[
          {
            label: 'Delete for everyone',
            variant: 'danger',
            onClick: confirmDeleteCategory,
          },
        ]}
        cancelText="Cancel"
      />

      {/* 3. Reset Rules to Defaults Modal */}
      <ActionConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset rules to defaults?"
        description="Are you sure you want to reset all credit categories and matrix activities back to original campus defaults? Custom activities will be cleared."
        type="warning"
        options={[
          {
            label: 'Reset all rules',
            variant: 'danger',
            onClick: confirmResetToDefaults,
          },
        ]}
        cancelText="Cancel"
      />

      {/* 4. Revoke Ledger Credits Modal */}
      <ActionConfirmModal
        isOpen={Boolean(revokeTxTarget)}
        onClose={() => setRevokeTxTarget(null)}
        title="Revoke credits?"
        description={`Are you sure you want to revoke ${revokeTxTarget?.credits} credits from ${revokeTxTarget?.studentName}? This transaction will be permanently removed from the ledger.`}
        type="delete"
        options={[
          {
            label: `Revoke ${revokeTxTarget?.credits} credits`,
            variant: 'danger',
            onClick: async () => {
              if (revokeTxTarget) {
                await creditService.deleteTransactionApi(revokeTxTarget.id, revokeTxTarget.studentId);
                setRefreshTrigger((p) => p + 1);
                setRevokeTxTarget(null);
              }
            },
          },
        ]}
        cancelText="Cancel"
      />

      {/* 5. Edit Activity Item Modal */}
      <ActionConfirmModal
        isOpen={Boolean(editingItemTarget)}
        onClose={() => setEditingItemTarget(null)}
        title="Edit activity"
        type="edit"
        options={[
          {
            label: 'Save changes',
            variant: 'primary',
            onClick: handleSaveEditedItem,
          },
        ]}
        cancelText="Cancel"
      >
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Activity Title
            </label>
            <input
              type="text"
              value={editItemTitle}
              onChange={(e) => setEditItemTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Credits (Points)
              </label>
              <input
                type="number"
                min="1"
                value={editItemCredits}
                onChange={(e) => setEditItemCredits(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Threshold Requirement
              </label>
              <button
                type="button"
                onClick={() => setEditItemHasThreshold(!editItemHasThreshold)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  editItemHasThreshold
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
                }`}
              >
                {editItemHasThreshold ? 'Yes (Has %)' : 'No Threshold'}
              </button>
            </div>
          </div>

          {editItemHasThreshold && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Threshold Label
                </label>
                <input
                  type="text"
                  value={editItemThresholdLabel}
                  onChange={(e) => setEditItemThresholdLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Value (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editItemThresholdValue}
                  onChange={(e) => setEditItemThresholdValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </ActionConfirmModal>
    </div>
  );
};
export default CreditManagementPage;
