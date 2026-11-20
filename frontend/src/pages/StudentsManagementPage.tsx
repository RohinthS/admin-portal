import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  studentAccountService,
  StudentAccount,
} from '../services/studentAccountService';
import {
  GraduationCap,
  User,
  UserPlus,
  FileSpreadsheet,
  Download,
  Table,
  ArrowLeft,
  Search,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Building,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  X,
  RotateCcw,
  Sparkles,
  Trash2,
  Lock,
  ExternalLink,
  Award,
  Filter,
  Upload,
  Plus,
} from 'lucide-react';

export const AVAILABLE_COURSES = [
  'AI Java Program',
  'AI Python Full Stack Program',
  'AI Video',
  'Accounting Software Tally PRIME',
  'Advanced Java',
  'Advanced Python',
  'Basic Python',
  'C Programming',
  'Core Java',
  'Core PHP',
  'Cybersecurity Ethical Hacking Basic',
  'Cybersecurity Ethical Hacking Intermediate',
  'Cybersecurity Ethical Hacking Expert',
  'Data Analytics',
  'Data Science',
  'Digital Marketing Basic SMM',
  'Digital Marketing Intermediate',
  'Digital Marketing Expert',
  'Flutter Basic',
  'Flutter Intermediate',
  'Flutter Expert',
  'Full Stack AI',
  'Intern AI Python',
  'Intern Digital Marketing',
  'Intern Java',
  'Intern PHP Full Stack',
  'LLM Generative AI Basics',
  'LLM Generative AI Advanced',
  'LLM Generative AI Basics to Advanced',
  'LLM Prompt Engineering Basics',
  'LLM Prompt Engineering Intermediate',
  'MERN Stack Development',
  'Medical Coding',
  'Office Automation (MS Office & Tally)',
  'Photoshop, CorelDraw & Illustrator',
  'Professional English Communication Skills',
  'Software Testing (Manual & Automation)',
  'UI / UX Design',
  'Video Creation',
  'Web Tech',
];

export const DEFAULT_CAMPUS_PLACES = [
  'Srivilliputhur (WeGrow Skill Campus)',
  'WeGrow B School – Sivakasi Branch 3.0 (WeGrow B School)',
  'Sivakasi (WeGrow Skill Campus)',
];

const StudentsManagementPageContent: React.FC = () => {
  const { activeCompanyId, companies } = useAuth();
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStudentForView, setSelectedStudentForView] = useState<StudentAccount | null>(null);
  const [selectedStudentForReset, setSelectedStudentForReset] = useState<StudentAccount | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Export & Google Sheets Modal State
  const [isExportChoiceModalOpen, setIsExportChoiceModalOpen] = useState(false);
  const [sheetModalView, setSheetModalView] = useState<'choice' | 'preview'>('choice');
  const [sheetPreviewSearch, setSheetPreviewSearch] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ coord: string; val: string } | null>({
    coord: 'A1',
    val: 'Student Roll ID',
  });
  const [copiedSheetTsv, setCopiedSheetTsv] = useState(false);

  // Form State for Student Creation
  const [formStudentId, setFormStudentId] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('Student@123');
  const [formShowPassword, setFormShowPassword] = useState(false);
  const [formCourseId, setFormCourseId] = useState('');
  const [formCourseName, setFormCourseName] = useState(AVAILABLE_COURSES[0]);
  const [formCourseType, setFormCourseType] = useState<'training' | 'internship'>('training');
  const [formCompanyId, setFormCompanyId] = useState('');
  const [availablePlaces, setAvailablePlaces] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wegrow_available_places');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const customExtra = parsed.filter(
            (p: string) =>
              p !== 'Sivakasi' &&
              p !== 'Srivilliputhur' &&
              p.toLowerCase() !== 'chennai' &&
              !DEFAULT_CAMPUS_PLACES.includes(p)
          );
          return [...DEFAULT_CAMPUS_PLACES, ...customExtra];
        }
      }
    } catch (e) {}
    return DEFAULT_CAMPUS_PLACES;
  });
  const [formBranch, setFormBranch] = useState(DEFAULT_CAMPUS_PLACES[0]);

  // Keep campus places synced with registered companies & clean legacy entries
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wegrow_available_places');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (p: string) =>
              p !== 'Sivakasi' &&
              p !== 'Srivilliputhur' &&
              p.toLowerCase() !== 'chennai'
          );
          localStorage.setItem('wegrow_available_places', JSON.stringify(cleaned));
        }
      }
    } catch (e) {}

    if (companies && companies.length > 0) {
      const companyLabels = companies.map((c) => `${c.branch} (${c.company_name})`);
      setAvailablePlaces((prev) => {
        const combined = [...companyLabels];
        prev.forEach((p) => {
          if (
            !combined.includes(p) &&
            p !== 'Sivakasi' &&
            p !== 'Srivilliputhur' &&
            p.toLowerCase() !== 'chennai'
          ) {
            combined.push(p);
          }
        });
        return combined;
      });
    }
  }, [companies]);

  const handleAddNewPlace = () => {
    const newPlace = window.prompt('Enter new place / branch name (e.g. Madurai (WeGrow Skill Campus)):');
    if (newPlace && newPlace.trim()) {
      const trimmed = newPlace.trim();
      if (!availablePlaces.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
        const updated = [...availablePlaces, trimmed];
        setAvailablePlaces(updated);
        localStorage.setItem('wegrow_available_places', JSON.stringify(updated));
        setFormBranch(trimmed);
        setSuccessMessage(`New place "${trimmed}" added successfully!`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setFormBranch(trimmed);
      }
    }
  };
  const [formCollege, setFormCollege] = useState('');
  const [formQualification, setFormQualification] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [formTotalFees, setFormTotalFees] = useState<number>(35000);
  const [formPaidAmount, setFormPaidAmount] = useState<number>(10000);

  // Status & Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load initial data
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('CSV file is empty');
        const res = studentAccountService.importFromCsv(text);
        const updated = studentAccountService.getStudents();
        setStudents(updated);
        setIsExportChoiceModalOpen(false);
        setSuccessMessage(
          `Method 2 Import Successful! ${res.added} new students added, ${res.updated} updated from CSV.`,
        );
        setTimeout(() => setSuccessMessage(null), 6000);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to import CSV file.');
        setTimeout(() => setErrorMessage(null), 6000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSyncDatabaseRoster = async () => {
    try {
      setLoading(true);
      const synced = await studentAccountService.syncWithImportedRoster();
      setStudents(synced);
      setIsExportChoiceModalOpen(false);
      setSuccessMessage(`Successfully synchronized ${synced.length} student records from database!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      setErrorMessage('Failed to sync roster.');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Auto-sync with existing database records
      const studentList = await studentAccountService.syncWithImportedRoster();
      setStudents(studentList);

      // Load courses from backend if available
      try {
        const coursesRes = await api.get('/courses');
        if (coursesRes.data && Array.isArray(coursesRes.data)) {
          setCourses(coursesRes.data);
          const firstMatched = coursesRes.data.find(
            (c: any) => c.course_name?.toLowerCase() === AVAILABLE_COURSES[0].toLowerCase()
          );
          if (firstMatched) {
            setFormCourseId(firstMatched._id || firstMatched.id);
            if (firstMatched.fees) setFormTotalFees(firstMatched.fees);
          }
        }
      } catch (e) {
        console.warn('Courses endpoint offline, using defaults', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId]);

  // Handle opening create modal: automatically generate next ID in database order
  const handleOpenCreateModal = () => {
    const nextId = studentAccountService.getNextStudentId();
    setFormStudentId(nextId);
    setFormPassword('Student@123');
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCollege('');
    setFormQualification('');
    const activeComp = companies.find((c) => c._id === activeCompanyId);
    const defaultBranch = activeComp
      ? `${activeComp.branch} (${activeComp.company_name})`
      : (availablePlaces[0] || DEFAULT_CAMPUS_PLACES[0]);
    setFormBranch(defaultBranch);
    setFormCompanyId(activeComp ? activeComp._id : '');
    setFormCourseName(AVAILABLE_COURSES[0]);
    const matched = courses.find(
      (c) => c.course_name?.toLowerCase() === AVAILABLE_COURSES[0].toLowerCase()
    );
    if (matched) {
      setFormCourseId(matched._id || matched.id || '');
      if (matched.fees) setFormTotalFees(matched.fees);
    } else {
      setFormCourseId('');
    }
    setFormJoiningDate(new Date().toISOString().slice(0, 10));
    setErrorMessage(null);
    setIsCreateModalOpen(true);
  };

  // Generate random strong password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(`Wg#${result}`);
  };

  // Submit Student Account Creation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formName.trim()) {
      setErrorMessage('Student full name is required.');
      return;
    }
    if (!formPhone.trim()) {
      setErrorMessage('Valid phone number is required.');
      return;
    }

    try {
      const created = await studentAccountService.createStudentAccount({
        student_id: formStudentId,
        student_name: formName,
        email: formEmail || `${formStudentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@wegrowcampus.in`,
        phone: formPhone,
        password: formPassword,
        course_id: formCourseId,
        course_name: formCourseName,
        course_type: formCourseType,
        company_id: formCompanyId || activeCompanyId || undefined,
        company_name: 'WeGrow Skill Campus',
        branch: formBranch,
        college_name: formCollege,
        qualification: formQualification,
        joining_date: formJoiningDate,
        total_fees: Number(formTotalFees) || 0,
        paid_amount: Number(formPaidAmount) || 0,
      });

      setStudents(studentAccountService.getStudents());
      setIsCreateModalOpen(false);
      setSuccessMessage(
        `Student Account Created Successfully! ID: ${created.student_id} | Password: ${created.password}`,
      );
      setTimeout(() => setSuccessMessage(null), 8000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create student account.');
    }
  };

  // Admin Reset Password Submission
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForReset || !resetNewPassword.trim()) return;

    studentAccountService.changePassword(
      selectedStudentForReset.student_id,
      resetNewPassword.trim(),
    );
    setStudents(studentAccountService.getStudents());
    setSelectedStudentForReset(null);
    setResetNewPassword('');
    setSuccessMessage(
      `Password successfully reset for ${selectedStudentForReset.student_name} (${selectedStudentForReset.student_id})!`,
    );
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Delete student
  const handleDeleteStudent = (stu: StudentAccount) => {
    if (
      window.confirm(
        `Are you sure you want to delete student ${stu.student_name} (${stu.student_id})? This will revoke portal access.`,
      )
    ) {
      studentAccountService.deleteStudent(stu.id);
      setStudents(studentAccountService.getStudents());
      setSuccessMessage(`Student ${stu.student_name} deleted.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // 1-Click Copy credentials to clipboard
  const handleCopyCredentials = (stu: StudentAccount) => {
    const text = `🎓 *WeGrow Student Portal Access*\nStudent ID: ${stu.student_id}\nPassword: ${stu.password || stu.initial_password || 'Student@123'}\nPortal URL: ${window.location.origin}/login\nName: ${stu.student_name}`;
    navigator.clipboard.writeText(text);
    setCopiedId(stu.student_id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Export button clicked -> Open choice dialog
  const handleExportButtonClick = () => {
    setSheetModalView('choice');
    setSheetPreviewSearch('');
    setIsExportChoiceModalOpen(true);
  };

  // Direct download
  const handleExecuteDownload = () => {
    studentAccountService.exportToExcel(filteredStudents);
    setIsExportChoiceModalOpen(false);
    setSuccessMessage('Student directory spreadsheet downloaded successfully!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Copy TSV to clipboard for Google Sheets
  const handleCopyForGoogleSheets = () => {
    const tsv = studentAccountService.getTsvData(filteredStudents);
    navigator.clipboard.writeText(tsv);
    setCopiedSheetTsv(true);
    setTimeout(() => setCopiedSheetTsv(false), 2500);
  };

  // 1-Click Launch Google Sheets in new tab with data copied
  const handleLaunchGoogleSheets = () => {
    handleCopyForGoogleSheets();
    window.open('https://sheets.new', '_blank');
  };

  // Filter and search students
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.filter((stu) => {
      if (!stu) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sId = String(stu.student_id || '').toLowerCase();
        const sName = String(stu.student_name || '').toLowerCase();
        const sEmail = String(stu.email || '').toLowerCase();
        const sPhone = String(stu.phone || '').toLowerCase();
        const sCourse = String(stu.course_name || '').toLowerCase();
        const matches =
          sId.includes(q) ||
          sName.includes(q) ||
          sEmail.includes(q) ||
          sPhone.includes(q) ||
          sCourse.includes(q);
        if (!matches) return false;
      }
      // Course Type
      if (filterType !== 'all' && (stu.course_type || '') !== filterType) {
        return false;
      }
      // Branch
      if (filterBranch !== 'all' && (stu.branch || '') !== filterBranch) {
        return false;
      }
      // Status
      if (filterStatus !== 'all' && (stu.status || '') !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [students, searchQuery, filterType, filterBranch, filterStatus]);

  // Statistics (null-safe)
  const totalCount = students?.length || 0;
  const trainingCount = (students || []).filter((s) => s?.course_type === 'training').length;
  const internshipCount = (students || []).filter((s) => s?.course_type === 'internship').length;
  const activeCount = (students || []).filter((s) => s?.status === 'active').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ================= TOP HERO & ACTION HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Students Directory & Accounts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Create student login credentials, auto-generate sequential student IDs from database, and export records to Excel.
          </p>
        </div>

        <div className="flex flex-row items-center gap-2 shrink-0 flex-nowrap">
          {/* Export to Excel Button */}
          <button
            type="button"
            onClick={handleExportButtonClick}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-semibold transition shadow-xs cursor-pointer whitespace-nowrap"
            title="Download or preview student directory in Google Sheets / Excel format"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Export to Excel (.xlsx / .csv)</span>
          </button>

          {/* Create Student Account Button */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-xs shadow-indigo-600/20 active:scale-[0.98] transition cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>Create Student Account</span>
          </button>
        </div>
      </div>

      {/* ================= SUCCESS / ERROR NOTIFICATIONS ================= */}
      {successMessage && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= SUMMARY METRIC TILES ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Students in directory</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Logins</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Can sign into student portal</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Training Programs</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{trainingCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Skill campus batches</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Internships</div>
          <div className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">{internshipCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Live project interns</div>
        </div>
      </div>

      {/* ================= SEARCH & FILTER CONTROL BAR ================= */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input with live filter */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, ID, email, course..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Program Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="training">Training</option>
            <option value="internship">Internship</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Logins</option>
            <option value="inactive">Inactive</option>
          </select>

          {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterStatus('all');
              }}
              className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= FULL STUDENT DETAILS TABLE ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student ID (Order)</th>
                <th className="py-3.5 px-4">Student Name & Contact</th>
                <th className="py-3.5 px-4">Course & Program</th>
                <th className="py-3.5 px-4">Branch / Campus</th>
                <th className="py-3.5 px-4">College & Qualification</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 px-4">Login Access</th>
                <th className="py-3.5 px-4 text-center">Share Credentials</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No students found matching your criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or click "Create Student Account".</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => {
                  const isCopied = copiedId === stu.student_id;
                  return (
                    <tr
                      key={stu.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Order-Based Student ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg text-xs">
                          {stu.student_id}
                        </span>
                      </td>

                      {/* Student Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {(stu?.student_name?.[0] || 'S').toUpperCase()}
                          </div>
                          <span>{stu?.student_name || 'Student'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 ml-9">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{stu?.email || '—'}</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{stu?.phone || '—'}</span>
                        </div>
                      </td>

                      {/* Course & Type */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {stu?.course_name || 'Professional Certification'}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              stu?.course_type === 'internship'
                                ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {stu?.course_type || 'training'}
                          </span>
                        </div>
                      </td>

                      {/* Campus / Branch */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{stu.branch || 'Sivakasi'}</span>
                        </div>
                      </td>

                      {/* College & Qualification */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {stu.college_name || '—'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {stu.qualification || '—'}
                        </div>
                      </td>

                      {/* Joining Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-mono text-slate-600 dark:text-slate-400">
                        {stu.joining_date || '2026-01-15'}
                      </td>

                      {/* Login Access Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active Login</span>
                        </span>
                      </td>

                      {/* Share Credentials (1-Click Copy) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(stu)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                          }`}
                          title="Copy student ID & password to share via WhatsApp or Email"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copy Login</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForView(stu)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                            title="View all details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentForReset(stu);
                              setResetNewPassword('Student@123');
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition"
                            title="Reset password for this student"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(stu)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                            title="Delete student account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with counts and Excel export */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredStudents.length}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> students in database
          </div>
          <button
            type="button"
            onClick={handleExportButtonClick}
            className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:underline font-bold"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download or preview student roster spreadsheet (.xlsx / .csv)</span>
          </button>
        </div>
      </div>

      {/* ================= MODAL: CREATE STUDENT ACCOUNT ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                    <UserPlus className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Create Student Account
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Generates sequential Student ID in database order and assigns initial portal login credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Account Credentials Card (Order-Based ID & Password) */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Portal Credentials (Ordered Sequence)</span>
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/70 px-2 py-0.5 rounded-full">
                    Auto-Ordered from Database
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Student ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Student ID (Order-Based) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formStudentId}
                      onChange={(e) => setFormStudentId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl px-3.5 py-2 font-mono font-bold text-indigo-700 dark:text-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Sequence order from existing student records.
                    </span>
                  </div>

                  {/* Initial Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Initial Password *
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-0.5"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generate</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={formShowPassword ? 'text' : 'password'}
                        required
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 pr-10 font-mono text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setFormShowPassword(!formShowPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {formShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Student can change this in student portal settings.
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kavya Sundaram"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile / Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email Address & Campus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. kavya@gmail.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Campus / Branch *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddNewPlace}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Add a new place or campus location for future use"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add New Place</span>
                    </button>
                  </div>
                  <select
                    value={formBranch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormBranch(val);
                      const matched = companies.find(
                        (c) => `${c.branch} (${c.company_name})` === val || c.branch === val
                      );
                      if (matched) {
                        setFormCompanyId(matched._id);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {availablePlaces.map((place) => (
                      <option key={place} value={place}>
                        {place}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Course & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Course / Program *
                  </label>
                  <select
                    value={formCourseName}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setFormCourseName(selectedName);
                      const c = courses.find(
                        (item) => item.course_name?.toLowerCase() === selectedName.toLowerCase()
                      );
                      if (c) {
                        setFormCourseId(c._id || c.id || '');
                        if (c.fees) setFormTotalFees(c.fees);
                      } else {
                        setFormCourseId('');
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {AVAILABLE_COURSES.map((cName) => (
                      <option key={cName} value={cName}>
                        {cName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Program Type *
                  </label>
                  <select
                    value={formCourseType}
                    onChange={(e) => setFormCourseType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="training">Training (Skill Campus)</option>
                    <option value="internship">Internship (Live Projects)</option>
                  </select>
                </div>
              </div>

              {/* College & Qualification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    College / University
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anna University / CIT"
                    value={formCollege}
                    onChange={(e) => setFormCollege(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Degree / Qualification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.E. CSE / B.Sc / BCA"
                    value={formQualification}
                    onChange={(e) => setFormQualification(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Joining Date & Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formJoiningDate}
                    onChange={(e) => setFormJoiningDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Fees (₹)
                  </label>
                  <input
                    type="number"
                    value={formTotalFees}
                    onChange={(e) => setFormTotalFees(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Paid Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formPaidAmount}
                    onChange={(e) => setFormPaidAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-[0.98] transition flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW STUDENT DETAILS ================= */}
      {selectedStudentForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white font-black text-lg flex items-center justify-center">
                  {(selectedStudentForView?.student_name?.[0] || 'S').toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedStudentForView.student_name}
                  </h2>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    ID: {selectedStudentForView.student_id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForView(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block mb-0.5">Email Address</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudentForView.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block mb-0.5">Mobile Phone</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudentForView.phone}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block mb-0.5">Course / Program</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudentForView.course_name}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block mb-0.5">Program Type</span>
                <span className="font-bold uppercase text-indigo-600">{selectedStudentForView.course_type}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block mb-0.5">Campus Branch</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudentForView.branch}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block mb-0.5">College</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudentForView.college_name || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block mb-0.5">Qualification</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudentForView.qualification || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block mb-0.5">Joining Date</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{selectedStudentForView.joining_date}</span>
              </div>
            </div>

            {/* Login Credentials Box */}
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                  Active Student Login Credentials
                </span>
                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  ID: <span className="text-indigo-600 font-extrabold">{selectedStudentForView.student_id}</span> | Password: <span className="text-slate-900 dark:text-white font-extrabold">{selectedStudentForView.password || selectedStudentForView.initial_password || 'Student@123'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCredentials(selectedStudentForView)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedStudentForView(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADMIN RESET PASSWORD ================= */}
      {selectedStudentForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Reset Student Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedStudentForReset(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Set a new login password for <strong>{selectedStudentForReset.student_name}</strong> ({selectedStudentForReset.student_id}).
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForReset(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EXPORT CHOICE & GOOGLE SHEETS PREVIEW ================= */}
      {isExportChoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          {sheetModalView === 'choice' ? (
            /* ================= VIEW 1: CHOICE DIALOG (Download vs Preview) ================= */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
                      Student Spreadsheet Export
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Would you like to download the Excel file or preview the Google Sheet?
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExportChoiceModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* The 2 Main Choice Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Direct Download */}
                <div
                  onClick={handleExecuteDownload}
                  className="group relative p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                      <Download className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                      Save to Device
                    </span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-2">
                      Download Excel File
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Download formatted .csv spreadsheet compatible with Microsoft Excel & Numbers.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <span>Download Now</span>
                    <span>&rarr;</span>
                  </div>
                </div>

                {/* Option 2: Preview Google Sheet */}
                <div
                  onClick={() => setSheetModalView('preview')}
                  className="group relative p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-500 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                      <Table className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                      In-Browser View
                    </span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-2">
                      Preview Google Sheet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Preview all columns A-O, formulas, cell coordinates, and rows in interactive sheet viewer.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/60 flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <span>Open Sheet Preview</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              </div>

              {/* Method 2: Import from Excel / CSV Section */}
              <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileUpload}
                  className="hidden"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-600 text-white">
                      <Upload className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                        Method 2: Import from Excel / CSV
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Upload any .csv file to bulk import existing student records into the directory.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload CSV File</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncDatabaseRoster}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Sync 149 Database Students</span>
                  </button>
                </div>
              </div>

              {/* Direct Open in Google Sheets Cloud */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">
                    Open directly in Google Sheets online:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLaunchGoogleSheets}
                  className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Launch sheets.new</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* ================= VIEW 2: INTERACTIVE GOOGLE SHEETS VIEWER ================= */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in">
              {/* Google Sheets Header & Toolbar */}
              <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSheetModalView('choice')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold transition shadow-2xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Options</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
                      <FileSpreadsheet className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          WeGrow_Student_Directory_2026.xlsx
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          Google Sheet Preview
                        </span>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        <span className="hover:text-slate-700 cursor-pointer">File</span>
                        <span className="hover:text-slate-700 cursor-pointer">Edit</span>
                        <span className="hover:text-slate-700 cursor-pointer">View</span>
                        <span className="hover:text-slate-700 cursor-pointer">Insert</span>
                        <span className="hover:text-slate-700 cursor-pointer">Format</span>
                        <span className="hover:text-slate-700 cursor-pointer">Data</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Tools */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyForGoogleSheets}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
                    title="Copy TSV data to paste into Google Sheets"
                  >
                    {copiedSheetTsv ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied for Sheets!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy for Sheets</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleLaunchGoogleSheets}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition"
                    title="Open Google Sheets in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in sheets.new</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteDownload}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
                    title="Download Excel File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExportChoiceModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Google Sheets Formula Bar & Search Filter */}
              <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-mono font-black text-slate-400 dark:text-slate-500 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-w-12 text-center">
                    {selectedCell ? selectedCell.coord : 'A1'}
                  </span>
                  <span className="font-mono text-slate-400 font-bold italic">fx</span>
                  <input
                    type="text"
                    readOnly
                    value={selectedCell ? selectedCell.val : 'Student Roll ID'}
                    className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-mono text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="relative w-48 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search inside sheet..."
                    value={sheetPreviewSearch}
                    onChange={(e) => setSheetPreviewSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Google Sheets Real Grid View */}
              <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 p-2">
                <div className="inline-block min-w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm rounded-lg overflow-hidden">
                  <table className="w-full border-collapse text-left text-xs font-mono select-none">
                    <thead>
                      {/* Top Row: Column Letters A to O */}
                      <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-center font-bold text-slate-500 dark:text-slate-400 text-[11px]">
                        <th className="w-10 py-1.5 px-2 bg-slate-200/80 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700"></th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-32">A [ID]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-44">B [Full Name]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-48">C [Email]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-32">D [Phone]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-52">E [Course]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-28">F [Type]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-40">G [Branch]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-40">H [College]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-32">I [Degree]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-32">J [Join Date]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-28">K [Total Fees]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-28">L [Paid Amount]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-28">M [Balance]</th>
                        <th className="py-1.5 px-3 border-r border-slate-300 dark:border-slate-700 min-w-28">N [Status]</th>
                        <th className="py-1.5 px-3 min-w-32">O [Login Access]</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredStudents
                        .filter((s) => {
                          if (!s) return false;
                          if (!sheetPreviewSearch.trim()) return true;
                          const q = sheetPreviewSearch.toLowerCase().trim();
                          const sId = String(s?.student_id || '').toLowerCase();
                          const sName = String(s?.student_name || '').toLowerCase();
                          const sEmail = String(s?.email || '').toLowerCase();
                          const sCourse = String(s?.course_name || '').toLowerCase();
                          const sPhone = String(s?.phone || '').toLowerCase();
                          return (
                            sId.includes(q) ||
                            sName.includes(q) ||
                            sEmail.includes(q) ||
                            sCourse.includes(q) ||
                            sPhone.includes(q)
                          );
                        })
                        .map((stu, rowIdx) => {
                          const rowNum = rowIdx + 1;
                          const isSelectedRow = selectedCell?.coord?.endsWith(String(rowNum));
                          return (
                            <tr
                              key={stu.id}
                              className={`transition-colors ${
                                isSelectedRow
                                  ? 'bg-indigo-50/60 dark:bg-indigo-950/40'
                                  : rowIdx % 2 === 0
                                  ? 'bg-white dark:bg-slate-900'
                                  : 'bg-slate-50/50 dark:bg-slate-800/30'
                              }`}
                            >
                              {/* Row Number Header */}
                              <td className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800 text-center font-bold text-slate-400 border-r border-slate-300 dark:border-slate-700">
                                {rowNum}
                              </td>

                              {/* A: Student ID */}
                              <td
                                onClick={() => setSelectedCell({ coord: `A${rowNum}`, val: stu.student_id })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell font-bold text-indigo-700 dark:text-indigo-300 ${
                                  selectedCell?.coord === `A${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                {stu.student_id}
                              </td>

                              {/* B: Full Name */}
                              <td
                                onClick={() => setSelectedCell({ coord: `B${rowNum}`, val: stu.student_name })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell font-semibold text-slate-900 dark:text-white ${
                                  selectedCell?.coord === `B${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                {stu.student_name}
                              </td>

                              {/* C: Email */}
                              <td
                                onClick={() => setSelectedCell({ coord: `C${rowNum}`, val: stu.email })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell text-slate-600 dark:text-slate-300 ${
                                  selectedCell?.coord === `C${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                {stu.email}
                              </td>

                              {/* D: Phone */}
                              <td
                                onClick={() => setSelectedCell({ coord: `D${rowNum}`, val: stu.phone })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell text-slate-600 dark:text-slate-300 ${
                                  selectedCell?.coord === `D${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                {stu.phone}
                              </td>

                              {/* E: Course */}
                              <td
                                onClick={() => setSelectedCell({ coord: `E${rowNum}`, val: stu.course_name })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell text-slate-700 dark:text-slate-300 ${
                                  selectedCell?.coord === `E${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                {stu.course_name}
                              </td>

                              {/* F: Course Type */}
                              <td
                                onClick={() => setSelectedCell({ coord: `F${rowNum}`, val: (stu?.course_type || 'training').toUpperCase() })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell font-bold uppercase text-[11px] ${
                                  stu?.course_type === 'internship' ? 'text-violet-600' : 'text-emerald-600'
                                } ${selectedCell?.coord === `F${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''}`}
                              >
                                {stu?.course_type || 'training'}
                              </td>

                              {/* G: Campus */}
                              <td
                                onClick={() => setSelectedCell({ coord: `G${rowNum}`, val: stu.branch || 'Main Campus' })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell text-slate-600 dark:text-slate-400 ${
                                  selectedCell?.coord === `G${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                {stu.branch || 'Sivakasi'}
                              </td>

                              {/* H: College */}
                              <td
                                onClick={() => setSelectedCell({ coord: `H${rowNum}`, val: stu.college_name || 'N/A' })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell text-slate-600 dark:text-slate-400 ${
                                  selectedCell?.coord === `H${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                {stu.college_name || '—'}
                              </td>

                              {/* I: Qualification */}
                              <td
                                onClick={() => setSelectedCell({ coord: `I${rowNum}`, val: stu.qualification || 'N/A' })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell text-slate-600 dark:text-slate-400 ${
                                  selectedCell?.coord === `I${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                {stu.qualification || '—'}
                              </td>

                              {/* J: Joining Date */}
                              <td
                                onClick={() => setSelectedCell({ coord: `J${rowNum}`, val: stu.joining_date })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell text-slate-600 dark:text-slate-400 ${
                                  selectedCell?.coord === `J${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                {stu.joining_date}
                              </td>

                              {/* K: Total Fees */}
                              <td
                                onClick={() => setSelectedCell({ coord: `K${rowNum}`, val: String(stu.total_fees || 0) })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell text-right ${
                                  selectedCell?.coord === `K${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                ₹{(stu.total_fees || 0).toLocaleString()}
                              </td>

                              {/* L: Paid Amount */}
                              <td
                                onClick={() => setSelectedCell({ coord: `L${rowNum}`, val: String(stu.paid_amount || 0) })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell text-right text-emerald-600 font-bold ${
                                  selectedCell?.coord === `L${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                ₹{(stu.paid_amount || 0).toLocaleString()}
                              </td>

                              {/* M: Balance */}
                              <td
                                onClick={() => setSelectedCell({ coord: `M${rowNum}`, val: String(stu.balance_amount || 0) })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell text-right font-bold ${
                                  (stu.balance_amount || 0) > 0 ? 'text-amber-600' : 'text-slate-400'
                                } ${selectedCell?.coord === `M${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''}`}
                              >
                                ₹{(stu.balance_amount || 0).toLocaleString()}
                              </td>

                              {/* N: Status */}
                              <td
                                onClick={() => setSelectedCell({ coord: `N${rowNum}`, val: (stu?.status || 'active').toUpperCase() })}
                                className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-800 cursor-cell text-center font-bold text-[11px] text-emerald-600 ${
                                  selectedCell?.coord === `N${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                {(stu?.status || 'active').toUpperCase()}
                              </td>

                              {/* O: Login Access */}
                              <td
                                onClick={() => setSelectedCell({ coord: `O${rowNum}`, val: 'ACTIVE LOGIN READY' })}
                                className={`py-1.5 px-3 cursor-cell text-center font-bold text-[11px] text-indigo-600 ${
                                  selectedCell?.coord === `O${rowNum}` ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                                }`}
                              >
                                ACTIVE
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Google Sheets Tab Bar & Bottom Info */}
              <div className="p-2 sm:px-4 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 border-b-2 border-b-emerald-600 rounded-t-lg font-bold text-slate-800 dark:text-slate-200 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Sheet1</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {filteredStudents.length} rows &bull; 15 columns &bull; Ready for Google Sheets & Excel
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

class SafeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error: any, info: any) {
    console.error('SafeErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
            <X className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Unable to display Student Directory</h2>
          <p className="text-xs text-slate-500">{this.state.errorMsg}</p>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('wegrow_student_accounts_v1');
              window.location.reload();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            Clear Local Cache & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const StudentsManagementPage: React.FC = () => (
  <SafeErrorBoundary>
    <StudentsManagementPageContent />
  </SafeErrorBoundary>
);

export default StudentsManagementPage;

