import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Send,
  X,
  Search,
  Filter,
  Sliders,
  ChevronRight
} from 'lucide-react';

export const StudentTasksPage: React.FC = () => {
  const { user, activeCompanyId } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [taskStatus, setTaskStatus] = useState<string>('pending');
  const [updating, setUpdating] = useState(false);

  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks/my-student-tasks', {
        params: { company_id: activeCompanyId },
      });
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to load student tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeCompanyId]);

  const handleOpenProgress = (t: any) => {
    setSelectedTask(t);
    setTaskStatus(t.status || 'pending');
    setProgressPercent(t.completion_percentage || (t.status === 'completed' ? 100 : 0));
    setShowProgressModal(true);
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      setUpdating(true);
      await api.put(`/tasks/${selectedTask._id}`, {
        status: taskStatus,
        completion_percentage: Number(progressPercent),
      });
      setShowProgressModal(false);
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task progress', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenComments = (t: any) => {
    setSelectedTask(t);
    setNewComment('');
    setShowCommentsModal(true);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;
    try {
      setPostingComment(true);
      const res = await api.post(`/tasks/${selectedTask._id}/comments`, {
        comment: newComment.trim(),
      });
      setSelectedTask(res.data);
      setNewComment('');
      fetchTasks();
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setPostingComment(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesFilter = filterStatus === 'all' || t.status === filterStatus;
    const matchesSearch =
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
      case 'In Progress':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'delayed':
      case 'Delayed':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>My Assigned Tasks</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              {tasks.length} Total
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review assignment instructions, update completion status, and coordinate with your mentor
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            {['all', 'pending', 'in_progress', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {st === 'all' ? 'All' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No tasks found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You do not have any tasks matching this filter. Great job staying on top of your work!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed' || task.status === 'Completed';
            const dueDate = task.due_date ? new Date(task.due_date) : null;
            const isOverdue = dueDate && dueDate < new Date() && !isCompleted;

            return (
              <div
                key={task._id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        task.status
                      )}`}
                    >
                      {task.status || 'Pending'}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Priority: {task.priority || 'Medium'}
                    </span>
                    {task.assigned_by?.name && (
                      <span className="text-xs text-slate-500">
                        Assigned by <strong className="text-slate-700">{task.assigned_by.name}</strong>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{task.title}</h3>

                  {task.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-600 font-bold' : ''}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {dueDate ? dueDate.toLocaleDateString('en-IN') : 'No due date'}
                      {isOverdue && ' (Overdue)'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-indigo-600">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {task.comments?.length || 0} Comments
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    onClick={() => handleOpenComments(task)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Discuss</span>
                  </button>

                  <button
                    onClick={() => handleOpenProgress(task)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-xs flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Update Status</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Update Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-slate-900">Update Task Progress</h3>
              <button
                onClick={() => setShowProgressModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task</label>
                <p className="text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {selectedTask?.title}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Completion Percentage</span>
                  <span className="font-mono text-indigo-600">{progressPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProgressModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discussion / Comments Modal */}
      {showCommentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Task Discussion</h3>
                <p className="text-xs text-slate-500 truncate max-w-sm">{selectedTask?.title}</p>
              </div>
              <button
                onClick={() => setShowCommentsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 touch-scroll border-y border-slate-100 my-2">
              {!selectedTask?.comments || selectedTask.comments.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-6">
                  No comments yet. Post a question or update below!
                </p>
              ) : (
                selectedTask.comments.map((c: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <p className="text-slate-800 font-medium">{c.comment}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {c.created_at ? new Date(c.created_at).toLocaleString('en-IN') : 'Just now'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleSendComment} className="pt-2 flex gap-2">
              <input
                type="text"
                placeholder="Write a message or update..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 bg-white"
              />
              <button
                type="submit"
                disabled={postingComment || !newComment.trim()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
