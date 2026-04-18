import { useState, useEffect } from 'react';
import { tasksApi } from '../../api/tasks';
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_ICONS, formatRelative } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['work', 'personal', 'shopping', 'health', 'finance', 'education', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['todo', 'in-progress', 'review', 'done'];

export default function TaskModal({ task, onClose, onSave, onDelete, mode = 'edit' }) {
  const { user } = useAuth();
  const isNew = mode === 'create';

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    category: task?.category || 'other',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    reminderDate: task?.reminderDate ? new Date(task.reminderDate).toISOString().split('T')[0] : '',
    tags: task?.tags?.join(', ') || '',
    subtasks: task?.subtasks || [],
  });
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(task?.comments || []);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        dueDate: form.dueDate || null,
        reminderDate: form.reminderDate || null,
        subtasks: form.subtasks,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setForm((p) => ({ ...p, subtasks: [...p.subtasks, { title: newSubtask.trim(), completed: false }] }));
    setNewSubtask('');
  };

  const toggleSubtask = (idx) => {
    setForm((p) => ({
      ...p,
      subtasks: p.subtasks.map((s, i) => i === idx ? { ...s, completed: !s.completed } : s),
    }));
  };

  const removeSubtask = (idx) => {
    setForm((p) => ({ ...p, subtasks: p.subtasks.filter((_, i) => i !== idx) }));
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const { data } = await tasksApi.addComment(task._id, newComment.trim());
      setComments((p) => [...p, data.data.comment]);
      setNewComment('');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(task._id);
      onClose();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isNew ? 'New Task' : 'Edit Task'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs (only for existing tasks) */}
          {!isNew && (
            <div className="flex gap-1 px-6 pt-3">
              {['details', 'subtasks', 'comments'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition ${
                    activeTab === tab
                      ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                  {tab === 'comments' && comments.length > 0 && (
                    <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full px-1.5">{comments.length}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="task-form" onSubmit={handleSubmit}>
              {(isNew || activeTab === 'details') && (
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      className="input text-base font-medium"
                      placeholder="What needs to be done?"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      rows={3}
                      className="input resize-none"
                      placeholder="Add details, notes, or context…"
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    />
                  </div>

                  {/* Status + Priority */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <select
                        className="input"
                        value={form.status}
                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                      <select
                        className="input"
                        value={form.priority}
                        onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, category: cat }))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                            form.category === cat
                              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-1 ring-primary-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {CATEGORY_ICONS[cat]} <span className="capitalize">{cat}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Due date + Reminder */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                      <input
                        type="date"
                        className="input"
                        value={form.dueDate}
                        onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reminder</label>
                      <input
                        type="date"
                        className="input"
                        value={form.reminderDate}
                        onChange={(e) => setForm((p) => ({ ...p, reminderDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="design, frontend, urgent (comma-separated)"
                      value={form.tags}
                      onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                    />
                  </div>

                  {/* Inline subtasks for new task */}
                  {isNew && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtasks</label>
                      <div className="space-y-1 mb-2">
                        {form.subtasks.map((s, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <button type="button" onClick={() => toggleSubtask(i)} className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${s.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                              {s.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </button>
                            <span className={`text-sm flex-1 ${s.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{s.title}</span>
                            <button type="button" onClick={() => removeSubtask(i)} className="text-gray-400 hover:text-red-500">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input flex-1 text-sm"
                          placeholder="Add subtask…"
                          value={newSubtask}
                          onChange={(e) => setNewSubtask(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                        />
                        <button type="button" onClick={addSubtask} className="btn-secondary btn-sm">Add</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subtasks tab */}
              {!isNew && activeTab === 'subtasks' && (
                <div>
                  <div className="space-y-2 mb-4">
                    {form.subtasks.length === 0 && (
                      <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-4">No subtasks yet</p>
                    )}
                    {form.subtasks.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <button type="button" onClick={() => toggleSubtask(i)} className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${s.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                          {s.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <span className={`text-sm flex-1 ${s.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{s.title}</span>
                        <button type="button" onClick={() => removeSubtask(i)} className="text-gray-400 hover:text-red-500">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input flex-1 text-sm"
                      placeholder="Add subtask…"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                    />
                    <button type="button" onClick={addSubtask} className="btn-secondary btn-sm">Add</button>
                  </div>
                </div>
              )}

              {/* Comments tab */}
              {!isNew && activeTab === 'comments' && (
                <div>
                  <div className="space-y-3 mb-4">
                    {comments.length === 0 && (
                      <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-4">No comments yet. Start the conversation!</p>
                    )}
                    {comments.map((c) => (
                      <div key={c._id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0 text-sm font-medium text-primary-700 dark:text-primary-300">
                          {c.user?.avatar ? <img src={c.user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : c.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.user?.name}</span>
                            <span className="text-xs text-gray-400">{formatRelative(c.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={submitComment} className="flex gap-2">
                    <input
                      type="text"
                      className="input flex-1 text-sm"
                      placeholder="Write a comment…"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="btn-primary btn-sm">Post</button>
                  </form>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <div>
              {!isNew && (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Are you sure?</span>
                    <button onClick={handleDelete} className="btn-danger btn-sm">Delete</button>
                    <button onClick={() => setConfirmDelete(false)} className="btn-ghost btn-sm">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    Delete task
                  </button>
                )
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary btn-sm">Cancel</button>
              <button
                type="submit"
                form="task-form"
                disabled={submitting}
                className="btn-primary btn-sm"
              >
                {submitting ? 'Saving…' : isNew ? 'Create Task' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
