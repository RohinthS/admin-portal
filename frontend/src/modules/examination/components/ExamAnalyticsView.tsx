import React, { useState } from 'react';
import { AssessmentConfig, StudentAttempt, TopicAnalysis } from '../types';
import { examService } from '../services/examService';
import { syllabusProgressService } from '../services/syllabusProgressService';
import { studentAccountService, StudentAccount } from '../../../services/studentAccountService';
import {
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  Download,
  BarChart3,
  Sparkles,
  Layers,
  ArrowUpRight,
  Filter,
  Key,
  Clock,
  BookOpen,
  Search,
  CheckSquare,
  UserCheck,
} from 'lucide-react';

interface ExamAnalyticsViewProps {
  testId?: string;
}

export const ExamAnalyticsView: React.FC<ExamAnalyticsViewProps> = ({ testId }) => {
  const [reportTab, setReportTab] = useState<'progression' | 'exam'>('progression');
  const [assessments, setAssessments] = useState<AssessmentConfig[]>(() => examService.getAssessments());
  const [selectedTestId, setSelectedTestId] = useState<string>(testId || assessments[0]?.id || '');
  const allAttempts = examService.getAllAttempts();

  // Course Filter & Search
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allStudents = studentAccountService.getStudents();
  const courseCategories = syllabusProgressService.getCoursesByCategory();
  const coursesList = courseCategories.flatMap((cat) =>
    cat.courses.map((courseName) => ({
      courseName,
      category: cat.category,
      studentIds: allStudents
        .filter((s) => (s.course_id || '').toLowerCase() === courseName.toLowerCase())
        .map((s) => s.id),
    }))
  );

  const currentTest = assessments.find((a) => a.id === selectedTestId) || assessments[0];
  const testAttempts = selectedTestId
    ? allAttempts.filter((a) => a.test_id === selectedTestId)
    : allAttempts;

  const handleToggleAnswerKey = () => {
    if (!currentTest) return;
    examService.toggleAnswerKeyRelease(currentTest.id);
    setAssessments(examService.getAssessments());
  };

  // Aggregate Stats for Selected Exam
  const totalCandidates = testAttempts.length;
  const completedAttempts = testAttempts.filter((a) => a.status === 'submitted' || a.status === 'disqualified');
  const passedCandidates = completedAttempts.filter((a) => a.is_passed);
  const failedCandidates = completedAttempts.filter((a) => !a.is_passed);

  const avgScore =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((acc, a) => acc + (a.score_percentage || 0), 0) / completedAttempts.length,
        )
      : 0;

  const passRate =
    completedAttempts.length > 0
      ? Math.round((passedCandidates.length / completedAttempts.length) * 100)
      : 0;

  const totalCreditsAwarded = completedAttempts.reduce((acc, a) => acc + (a.earned_credits || 0), 0);

  // Leaderboard / Rankings for Single Exam
  const rankings = [...completedAttempts].sort((a, b) => (b.score_percentage || 0) - (a.score_percentage || 0));

  // Export Single Exam to CSV
  const handleExportCsv = () => {
    const header = 'Rank,Student Name,Course,Marks Obtained,Total Marks,Percentage,Passed,Credits Earned,Violations,Status\n';
    const rows = rankings.map((att, idx) => {
      return `${idx + 1},"${att.student_name}","${att.course_name}",${att.marks_obtained},${att.total_marks},${att.score_percentage}%,${att.is_passed ? 'YES' : 'NO'},${att.earned_credits},${att.violations_count || 0},${att.status}`;
    });
    const csvContent = header + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentTest?.title || 'Exam'}_Results_Analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Courses for Progression Tab
  const filteredCourses = coursesList.filter((c) => {
    if (selectedCourseFilter !== 'all' && c.courseName !== selectedCourseFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.courseName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Export Course Progression to CSV
  const handleExportCourseProgressionCsv = () => {
    const header = 'Course Name,Category,Enrolled Students,Total Modules,Completed Modules,Progression %,Published Tests\n';
    const rows = filteredCourses.map((c) => {
      const summary = syllabusProgressService.getCourseProgressionSummary(c.courseName);
      const tests = assessments.filter((t) => t.course_name?.toLowerCase() === c.courseName.toLowerCase());
      return `"${c.courseName}","${c.category}",${c.studentIds.length},${summary.totalModules},${summary.completedModules},${summary.percentage}%,${tests.length}`;
    });
    const csvContent = header + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Admin_Course_Progression_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <span>Admin Reports & Course Progression Audits</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Live Monitoring
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor course-wise module completion, student marks and assessment readiness.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportTab('progression')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              reportTab === 'progression'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Course Progression Reports</span>
          </button>

          <button
            onClick={() => setReportTab('exam')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              reportTab === 'exam'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Exam Deep Dive</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: COURSE PROGRESSION & STUDENT AUDIT ================= */}
      {reportTab === 'progression' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap flex-1">
              {/* Course Filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Course:</span>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="all">All Courses</option>
                  {coursesList.map((c) => (
                    <option key={c.courseName} value={c.courseName}>
                      {c.courseName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleExportCourseProgressionCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start md:self-auto shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report CSV</span>
            </button>
          </div>

          {/* Course-wise Progression Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((c) => {
              const summary = syllabusProgressService.getCourseProgressionSummary(c.courseName);
              const courseTests = assessments.filter(
                (t) => t.course_name?.toLowerCase() === c.courseName.toLowerCase()
              );
              const publishedCount = courseTests.length;

              return (
                <div
                  key={c.courseName}
                  className="p-5 rounded-2xl glass-card space-y-4 hover:border-indigo-400 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {c.category}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1 line-clamp-1">
                        {c.courseName}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      👥 {c.studentIds.length} Enrolled
                    </span>
                  </div>

                  {/* Module Completion Progress */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-600 dark:text-slate-400">Classroom Modules Finished:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {summary.completedModules} of {summary.totalModules} ({summary.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${summary.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Published Assessments:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">
                      {publishedCount} Available
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Student Milestone & Marks Progression Audit Table */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>Student Curriculum Progression & Assessment Audit</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed view of individual student enrollment, syllabus status, and test performance.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Roll No</th>
                    <th className="py-2.5 px-3">Enrolled Course</th>
                    <th className="py-2.5 px-3 text-center">Modules Finished</th>
                    <th className="py-2.5 px-3 text-center">Assessments Passed</th>
                    <th className="py-2.5 px-3 text-right">Overall Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {allStudents.map((s) => {
                    const studentCourseName = s.course_id || 'AI Java Program';
                    const summary = syllabusProgressService.getCourseProgressionSummary(studentCourseName);
                    const studentAttempts = allAttempts.filter(
                      (a) =>
                        (a.student_id === s.id || a.student_id === s.student_id) &&
                        (a.status === 'submitted' || a.status === 'disqualified')
                    );
                    const passedCount = studentAttempts.filter((a) => a.is_passed).length;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {s.student_name}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {s.student_id}
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {studentCourseName}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="font-bold text-slate-900 dark:text-white">{summary.completedModules}</span>
                          <span className="text-slate-400">/{summary.totalModules}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {passedCount} Passed
                        </td>
                        <td className="py-3 px-3 text-right">
                          {passedCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              On Track
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Enrolled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: SINGLE EXAM DEEP DIVE ================= */}
      {reportTab === 'exam' && (
        <div className="space-y-6">
          {/* Test Selector & Export Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Select Exam:</span>
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold cursor-pointer"
              >
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2.5">
              {currentTest && currentTest.result_visibility === 'scheduled' && (
                <button
                  onClick={handleToggleAnswerKey}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer ${
                    currentTest.is_answer_key_released
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  }`}
                  title="Grant or revoke examinee access to question answers"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>
                    {currentTest.is_answer_key_released ? 'Answer Key: Released (Click to Lock)' : 'Answer Key: Locked (Click to Release)'}
                  </span>
                </button>
              )}

              <button
                onClick={handleExportCsv}
                disabled={rankings.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* 4 Performance Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl glass-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {totalCandidates}
                </div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Total Candidates
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {passRate}%
                </div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Passed ({passedCandidates.length}/{completedAttempts.length || 1})
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {avgScore}%
                </div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Average Score
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                  +{totalCreditsAwarded} pts
                </div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Credits Awarded
                </div>
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="p-5 rounded-2xl glass-card">
            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Student Submissions & Scorecards ({rankings.length})</span>
            </h4>

            {rankings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No students have submitted attempts for this exam yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Candidate</th>
                      <th className="py-2.5 px-3">Course</th>
                      <th className="py-2.5 px-3 text-center">Score</th>
                      <th className="py-2.5 px-3 text-center">Percentage</th>
                      <th className="py-2.5 px-3 text-center">Result</th>
                      <th className="py-2.5 px-3 text-right">Credits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {rankings.map((att, rIdx) => (
                      <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-bold text-slate-500">#{rIdx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{att.student_name}</div>
                          <div className="text-[10px] text-slate-400">{att.student_id}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{att.course_name}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                          {att.marks_obtained}/{att.total_marks}
                        </td>
                        <td className="py-3 px-3 text-center font-black text-indigo-600 dark:text-indigo-400">
                          {att.score_percentage}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          {att.is_passed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              PASS
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              FAIL
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          +{att.earned_credits} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
