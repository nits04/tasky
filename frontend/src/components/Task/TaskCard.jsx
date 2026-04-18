import { useState } from 'react';
import { formatDueDate, isOverdue, PRIORITY_CONFIG, CATEGORY_ICONS } from '../../utils/helpers';

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export default function TaskCard({ task, onUpdate, onDelete, onTaskClick, isDragging }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const overdue = isOverdue(task.dueDate, task.status);
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const subtaskProgress = task.subtasks?.length
    ? { done: task.subtasks.filter((s) => s.completed).length, total: task.subtasks.length }
    : null;

  const handleStatusChange = (e) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    onUpdate?.(task._id, { status: newStatus });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete?.(task._id);
  };

  return (
    <div
      onClick={() => !isDragging && onTaskClick?.(task)}
      className={`card p-3 cursor-pointer group hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 ${
        isDragging ? 'shadow-xl cursor-grabbing' : ''
      } ${task.status === 'done' ? 'opacity-70' : ''}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-2 mb-2">
        {/* Completion checkbox */}
        <button
          onClick={handleStatusChange}
          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            task.status === 'done'
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
          }`}
        >
          {task.status === 'done' && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <span className={`flex-1 text-sm font-medium leading-snug ${task.status === 'done' ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}`}>
          {task.title}
        </span>

        {/* Menu button */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
              <div className="absolute right-0 top-6 z-20 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 animate-fade-in">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onTaskClick?.(task); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2 ml-6">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 ml-6">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Subtask progress */}
      {subtaskProgress && (
        <div className="mb-2 ml-6">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-0.5">
            <span>{subtaskProgress.done}/{subtaskProgress.total} subtasks</span>
            <span>{Math.round((subtaskProgress.done / subtaskProgress.total) * 100)}%</span>
          </div>
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${(subtaskProgress.done / subtaskProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 ml-6">
        <div className="flex items-center gap-2">
          {/* Priority dot */}
          <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority]}`} title={task.priority} />

          {/* Category */}
          <span className="text-xs" title={task.category}>{CATEGORY_ICONS[task.category]}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Comments count */}
          {task.comments?.length > 0 && (
            <div className="flex items-center gap-0.5 text-gray-400 dark:text-gray-500">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs">{task.comments.length}</span>
            </div>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {overdue && '⚠️ '}
              {formatDueDate(task.dueDate)}
            </span>
          )}

          {/* Assignee avatar */}
          {task.assignedTo?.avatar && (
            <img
              src={task.assignedTo.avatar}
              alt={task.assignedTo.name}
              className="w-5 h-5 rounded-full ring-1 ring-white dark:ring-gray-800"
              title={task.assignedTo.name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
