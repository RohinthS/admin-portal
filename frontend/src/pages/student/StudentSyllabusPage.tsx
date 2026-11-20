import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { syllabusProgressService } from '../../modules/examination/services/syllabusProgressService';
import {
  BookOpen,
  Download,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  Award,
  Calendar,
  DollarSign,
  Tag,
  ShieldCheck,
} from 'lucide-react';

export const StudentSyllabusPage: React.FC = () => {
  const { user, activeCompanyId } = useAuth();
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [dashboardStudent, setDashboardStudent] = useState<any>(null);

  useEffect(() => {
    const fetchSyllabusData = async () => {
      try {
        setLoading(true);

        // 1. Fetch all courses with full syllabus
        const allCourses = await syllabusProgressService.getAllCoursesSyllabusAsync();
        setCoursesList(allCourses);

        // 2. Fetch student profile if available
        try {
          const res = await api.get('/reports/student-dashboard', {
            params: { company_id: activeCompanyId },
          });
          if (res.data?.student) {
            setDashboardStudent(res.data.student);
            // Default to enrolled course if matched
            const matched = allCourses.find((c: any) =>
              c.course_name.toLowerCase().includes((res.data.student.course_name || '').toLowerCase())
            );
            if (matched) {
              setSelectedCourseId(matched.id);
            } else if (allCourses.length > 0) {
              setSelectedCourseId(allCourses[0].id);
            }
          } else if (allCourses.length > 0) {
            setSelectedCourseId(allCourses[0].id);
          }
        } catch {
          if (allCourses.length > 0) {
            setSelectedCourseId(allCourses[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load syllabus', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSyllabusData();
  }, [activeCompanyId]);

  const currentCourse = coursesList.find((c) => c.id === selectedCourseId) || coursesList[0];
  const modules = currentCourse?.modules || [];

  const handleDownloadDocument = () => {
    if (currentCourse?.syllabus_file) {
      window.open(`/syllabus/${currentCourse.syllabus_file}`, '_blank');
    } else {
      alert(`Official document for ${currentCourse?.course_name || 'this course'} is being prepared by academic administration.`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Course Switcher & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">
              Official Database Curriculum
            </span>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Course Syllabus Explorer
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">Select Course:</label>
          <select
            value={currentCourse?.id || ''}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setExpandedModule(0);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-xs"
          >
            {coursesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_name} ({c.duration_months || 3} Mos)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Master Card */}
      {currentCourse && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {currentCourse.category || 'Vocational Academy'}
                </span>
                {currentCourse.syllabus_file && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified Document</span>
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentCourse.course_name}
              </h1>

              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {currentCourse.description}
              </p>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Duration: {currentCourse.duration_months} Months
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Layers className="w-4 h-4 text-purple-500" />
                  {modules.length} Modules & Tests
                </span>
                {currentCourse.course_fee && (
                  <>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      Fee: ₹{Number(currentCourse.course_fee).toLocaleString('en-IN')}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-stretch sm:self-auto">
              <button
                onClick={handleDownloadDocument}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Syllabus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modules List Accordion */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Module Breakdown & Learning Objectives ({modules.length})
          </h3>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            Click module to expand topics
          </span>
        </div>

        {modules.map((mod: any, idx: number) => {
          const isExpanded = expandedModule === idx;
          return (
            <div
              key={mod.id || idx}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all ${
                isExpanded
                  ? 'border-indigo-300 dark:border-indigo-800 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <button
                onClick={() => setExpandedModule(isExpanded ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                      isExpanded
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {mod.moduleNumber || idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {mod.moduleName}
                      </h4>
                      {mod.topic && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {mod.topic}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                      Suggested Assessment: {mod.suggestedDuration || 30} mins &bull; {mod.suggestedQuestions || 20} questions
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {mod.description}
                  </p>

                  {/* Subtopics Covered */}
                  {mod.subtopics && mod.subtopics.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">
                        Topics Covered & Classroom Competencies
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {mod.subtopics.map((t: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Takeaways */}
                  {mod.keyTakeaways && mod.keyTakeaways.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                      <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block mb-1">
                        Key Learning Takeaways
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {mod.keyTakeaways.map((takeaway: string, kIdx: number) => (
                          <span
                            key={kIdx}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 shadow-2xs"
                          >
                            ✓ {takeaway}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
