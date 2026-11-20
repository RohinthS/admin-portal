import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { syllabusProgressService, CourseModuleDef } from '../modules/examination/services/syllabusProgressService';
import { ConductModuleTestModal } from '../modules/examination/components/ConductModuleTestModal';
import {
  BookOpen,
  Plus,
  Clock,
  IndianRupee,
  FileText,
  Search,
  Sparkles,
  X,
  Download,
  Layers,
  CheckCircle,
  ExternalLink,
  Award,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Upload,
} from 'lucide-react';

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSyllabusCourse, setSelectedSyllabusCourse] = useState<any | null>(null);

  // Module Test Modal State
  const [activeTestModalCourse, setActiveTestModalCourse] = useState<{
    courseName: string;
    selectedModules?: CourseModuleDef[];
  } | null>(null);

  // Selected module IDs for multi-module test
  const [selectedModuleIdsForTest, setSelectedModuleIdsForTest] = useState<string[]>([]);

  // Future Syllabus Additions: Attach document file
  const [showAttachSyllabusModal, setShowAttachSyllabusModal] = useState(false);
  const [syllabusInputFileName, setSyllabusInputFileName] = useState('');

  // Future Syllabus Additions: Add new module
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [newModNumber, setNewModNumber] = useState(1);
  const [newModName, setNewModName] = useState('');
  const [newModTopic, setNewModTopic] = useState('HTML');
  const [newModDesc, setNewModDesc] = useState('');
  const [newModActivity, setNewModActivity] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // New Course Form
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [durationDays, setDurationDays] = useState(60);
  const [fees, setFees] = useState(15000);
  const [syllabus, setSyllabus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const syllabusCatalog = await syllabusProgressService.getAllCoursesSyllabusAsync();

      let backendCourses: any[] = [];
      try {
        const res = await api.get('/courses');
        backendCourses = res.data || [];
      } catch {
        // Backend fallback
      }

      // Merge backend courses with rich syllabus catalog
      const mergedMap = new Map<string, any>();

      // 1. Put all rich syllabus courses first
      syllabusCatalog.forEach((sc) => {
        mergedMap.set(sc.course_name.toLowerCase(), {
          _id: sc.id,
          course_name: sc.course_name,
          course_code: sc.id.toUpperCase(),
          duration_days: (sc.duration_months || 3) * 30,
          fees: sc.course_fee || 25000,
          syllabus: sc.description,
          modules: sc.modules,
          syllabus_file: sc.syllabus_file,
          category: sc.category,
        });
      });

      // 2. Add or merge any backend courses
      backendCourses.forEach((bc) => {
        const key = (bc.course_name || '').toLowerCase();
        if (mergedMap.has(key)) {
          const existing = mergedMap.get(key);
          mergedMap.set(key, {
            ...existing,
            _id: bc._id || bc.id || existing._id,
            fees: bc.fees || existing.fees,
            duration_days: bc.duration_days || existing.duration_days,
            course_code: bc.course_code || existing.course_code,
          });
        } else {
          const matchedModules = syllabusProgressService.getModulesForCourse(bc.course_name || '');
          mergedMap.set(key, {
            ...bc,
            modules: matchedModules,
          });
        }
      });

      setCourses(Array.from(mergedMap.values()));
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/courses', {
        course_name: courseName,
        course_code: courseCode,
        duration_days: durationDays,
        fees,
        syllabus,
      });
      setShowAddModal(false);
      setCourseName('');
      setCourseCode('');
      setSyllabus('');
      fetchCourses();
    } catch (err) {
      console.error('Failed to create course', err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = courses.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.course_name?.toLowerCase().includes(term) ||
      c.course_code?.toLowerCase().includes(term)
    );
  });

  const handleDownloadSyllabus = (course: any) => {
    if (course.syllabus_file) {
      window.open(`/syllabus/${course.syllabus_file}`, '_blank');
    } else {
      alert(`Official document for "${course.course_name}" is currently being updated.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Courses & Academy Syllabus</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official curriculum, module structures, categorized questions, and offline classroom assessments
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 active:scale-98 transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Courses Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or add a new training program to the catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => {
            const modulesCount = course.modules?.length || 4;
            return (
              <div
                key={course._id || course.course_name}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider">
                      {course.course_code || 'COURSE'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {course.duration_days ? `${course.duration_days} Days` : '90 Days'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 line-clamp-1">
                    {course.course_name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {course.syllabus || 'Comprehensive industry-aligned curriculum and hands-on assignments.'}
                  </p>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Curriculum</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {modulesCount} Detailed Modules
                      </span>
                    </div>
                    {course.syllabus_file && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Doc Ready
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      ₹{Number(course.fees || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                      Active
                    </span>
                  </div>

                  {/* View Syllabus CTA Button */}
                  <button
                    onClick={() => setSelectedSyllabusCourse(course)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40 dark:hover:from-indigo-900/60 dark:hover:to-purple-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>📖 View Detailed Syllabus & Conduct Tests</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Course Syllabus Modal */}
      {selectedSyllabusCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto touch-scroll space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {selectedSyllabusCourse.course_code || 'SYLLABUS'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {selectedSyllabusCourse.course_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedSyllabusCourse.duration_days ? `${selectedSyllabusCourse.duration_days} Days Course` : '3-6 Months'} &bull; Standard Fees: ₹{Number(selectedSyllabusCourse.fees || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <button
                onClick={() => setSelectedSyllabusCourse(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Download & Quick Actions */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Official Document Syllabus
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedSyllabusCourse.syllabus_file || syllabusProgressService.getCourseSyllabusFile(selectedSyllabusCourse.course_name)
                      ? `File attached: ${selectedSyllabusCourse.syllabus_file || syllabusProgressService.getCourseSyllabusFile(selectedSyllabusCourse.course_name)}`
                      : 'Digital syllabus catalog active'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {(selectedSyllabusCourse.syllabus_file || syllabusProgressService.getCourseSyllabusFile(selectedSyllabusCourse.course_name)) && (
                  <button
                    onClick={() => handleDownloadSyllabus(selectedSyllabusCourse)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                )}

                {/* Option to Attach/Add Syllabus File in future */}
                <button
                  type="button"
                  onClick={() => {
                    setSyllabusInputFileName(selectedSyllabusCourse.syllabus_file || '');
                    setShowAttachSyllabusModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="Attach or update syllabus document file in future"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Attach Syllabus File</span>
                </button>

                {/* Option to Add New Module in future */}
                <button
                  type="button"
                  onClick={() => {
                    setNewModNumber((selectedSyllabusCourse.modules || []).length + 1);
                    setNewModName('');
                    setNewModTopic(selectedSyllabusCourse.modules?.[0]?.topic || 'HTML');
                    setNewModDesc('');
                    setNewModActivity('');
                    setShowAddModuleModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="Add a new module to syllabus in future"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Module</span>
                </button>
              </div>
            </div>

            {/* Modules Breakdown & Module Test Selection */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                    Syllabus Modules ({(selectedSyllabusCourse.modules || []).length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Select one or more completed modules to conduct a test with suggested questions from the Question Bank.
                  </p>
                </div>

                {selectedModuleIdsForTest.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const chosen = (selectedSyllabusCourse.modules || []).filter((m: any) =>
                          selectedModuleIdsForTest.includes(m.id)
                        );
                        setActiveTestModalCourse({
                          courseName: selectedSyllabusCourse.course_name,
                          selectedModules: chosen,
                        });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                      <span>⚡ Conduct Test on Selected ({selectedModuleIdsForTest.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedModuleIdsForTest([])}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {(selectedSyllabusCourse.modules || []).map((mod: any, mIdx: number) => {
                const isChecked = selectedModuleIdsForTest.includes(mod.id);
                return (
                  <div
                    key={mod.id || mIdx}
                    className={`p-4 rounded-2xl border transition space-y-2.5 ${
                      isChecked
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModuleIdsForTest((prev) =>
                              prev.includes(mod.id)
                                ? prev.filter((id) => id !== mod.id)
                                : [...prev, mod.id]
                            );
                          }}
                          className="text-indigo-600 dark:text-indigo-400 cursor-pointer"
                          title="Select module for test"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {mod.moduleNumber || mIdx + 1}
                        </span>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                          {mod.moduleName}
                        </h5>
                      </div>

                      <div className="flex items-center gap-2">
                        {mod.topic && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {mod.topic}
                          </span>
                        )}

                        {/* Direct Conduct Test for this module */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTestModalCourse({
                              courseName: selectedSyllabusCourse.course_name,
                              selectedModules: [mod],
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1 cursor-pointer"
                          title="Conduct test for this completed module immediately"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>⚡ Conduct Test</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                      {mod.description}
                    </p>

                    {mod.practicalActivity && (
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-300 italic pl-6 flex items-center gap-1">
                        <span>🛠️ Practical Activity:</span>
                        <span>{mod.practicalActivity}</span>
                      </p>
                    )}

                    {mod.subtopics && mod.subtopics.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 pl-6">
                        {mod.subtopics.map((st: string, sIdx: number) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedSyllabusCourse(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto touch-scroll">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Add New Course</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Stack Web Development"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="FSWD-01"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Standard Fees (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={fees}
                  onChange={(e) => setFees(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Syllabus Overview</label>
                <textarea
                  rows={3}
                  placeholder="Outline key topics and tools taught..."
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach / Update Syllabus File Modal (Future Syllabus Addition) */}
      {showAttachSyllabusModal && selectedSyllabusCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Attach Syllabus Document
                </h3>
              </div>
              <button
                onClick={() => setShowAttachSyllabusModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Attach or update the official syllabus file (.pdf or .docx) for <span className="font-bold text-slate-800 dark:text-slate-200">{selectedSyllabusCourse.course_name}</span>.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!syllabusInputFileName.trim()) return;
                syllabusProgressService.saveCourseSyllabusFile(
                  selectedSyllabusCourse.course_name,
                  syllabusInputFileName.trim()
                );
                setSelectedSyllabusCourse((prev: any) =>
                  prev ? { ...prev, syllabus_file: syllabusInputFileName.trim() } : null
                );
                showToast(`✅ Attached syllabus "${syllabusInputFileName.trim()}" successfully!`);
                setShowAttachSyllabusModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Syllabus Document File Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1783595095_HTML_Course_Syllabus.pdf"
                  value={syllabusInputFileName}
                  onChange={(e) => setSyllabusInputFileName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  Or select from uploaded syllabus library:
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {[
                    '1783595095_HTML_Course_Syllabus.pdf',
                    '1781774690_Basic_Python_Course_Syllabus.docx',
                    '1781850679__MERN__Full_Stack_Development_Syllabus.docx',
                    '1786009045_Data_Science_Syllabus.docx',
                    '1785497529_Video_Creation_Course_Syllabus.docx',
                    '1783595120_Java_Full_Stack_Syllabus.pdf',
                  ].map((fn) => (
                    <button
                      key={fn}
                      type="button"
                      onClick={() => setSyllabusInputFileName(fn)}
                      className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 font-mono truncate transition flex items-center justify-between"
                    >
                      <span className="truncate">{fn}</span>
                      {syllabusInputFileName === fn && (
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAttachSyllabusModal(false)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Syllabus File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Module Modal (Future Curriculum Expansion) */}
      {showAddModuleModal && selectedSyllabusCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Add New Module to Syllabus
                </h3>
              </div>
              <button
                onClick={() => setShowAddModuleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Adding module to <span className="font-bold text-slate-800 dark:text-slate-200">{selectedSyllabusCourse.course_name}</span>. This module will immediately become eligible for test conduction and question generation.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newModName.trim()) return;

                const newMod: CourseModuleDef = {
                  id: `custom-mod-${Date.now()}`,
                  moduleNumber: Number(newModNumber) || (selectedSyllabusCourse.modules?.length || 0) + 1,
                  moduleName: newModName.trim(),
                  topic: newModTopic.trim() || 'General',
                  description: newModDesc.trim() || 'Topics and core concepts covered in this module.',
                  practicalActivity: newModActivity.trim() || undefined,
                  subtopics: newModDesc
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                  durationDays: 1,
                  suggestedDuration: 25,
                  suggestedQuestions: 15,
                };

                syllabusProgressService.saveCustomModule(
                  selectedSyllabusCourse.course_name,
                  newMod
                );

                const updatedModules = syllabusProgressService.getModulesForCourse(
                  selectedSyllabusCourse.course_name
                );

                setSelectedSyllabusCourse((prev: any) =>
                  prev ? { ...prev, modules: updatedModules } : null
                );

                showToast(`✅ Added Module ${newMod.moduleNumber}: "${newMod.moduleName}" to syllabus!`);
                setShowAddModuleModal(false);
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Module # *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newModNumber}
                    onChange={(e) => setNewModNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Question Bank Topic *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HTML, CSS, JavaScript, Python"
                    value={newModTopic}
                    onChange={(e) => setNewModTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Module Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 11: Web Components & Custom Elements"
                  value={newModName}
                  onChange={(e) => setNewModName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topics Covered (comma separated or description)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Custom elements, Shadow DOM, HTML templates, lifecycle callbacks"
                  value={newModDesc}
                  onChange={(e) => setNewModDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Practical Activity
                </label>
                <input
                  type="text"
                  placeholder="e.g. Create a reusable custom navigation bar with Shadow DOM."
                  value={newModActivity}
                  onChange={(e) => setNewModActivity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModuleModal(false)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Add Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conduct Module Test Modal */}
      {activeTestModalCourse && (
        <ConductModuleTestModal
          courseName={activeTestModalCourse.courseName}
          initialSelectedModules={activeTestModalCourse.selectedModules}
          onClose={() => setActiveTestModalCourse(null)}
          onPublished={(newAssessment) => {
            setActiveTestModalCourse(null);
            setSelectedSyllabusCourse(null);
            showToast(`🎉 Module Test "${newAssessment.title}" created & published successfully!`);
            navigate('/tests');
          }}
        />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 text-xs font-bold">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
