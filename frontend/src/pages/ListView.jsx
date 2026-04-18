import { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import TaskModal from '../components/Task/TaskModal';
import { useTasks } from '../hooks/useTasks';
import { formatDueDate, isOverdue, PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_ICONS } from '../utils/helpers';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: 'dueDate', label: 'Due date' },
  { value: '-priority', label: 'Priority' },
  { value: 'title', label: 'Title A→Z' },
];

export default function ListView() {
  const { searchQuery } = useOutletContext();
  const [selectedTask, setSelectedTask] = useState(null);
  const [sort, setSort] = useState('-createdAt');
  const [statusFilter, setStatusFilter] = useState('');

  const { tasks, loading, fetchTasks, updateTask, deleteTask } = useTasks({
    search: searchQuery || undefined,
    status: statusFilter || undefined,
    sort,
  });

  const handleSaveTask = useCallback(async (data) => {
    await updateTask(selectedTask._id, data);
    toast.success('Task updated!');
    setSelectedTask(null);
    fetchTasks();
  }, [selectedTask, updateTask, fetchTasks]);

  const handleDelete = useCallback(async (id) => {
    await deleteTask(id);
    toast.success('Task deleted');
    setSelectedTask(null);
  }, [deleteTask]);

  const toggleDone = async (task) => {
    await updateTask(task._id, { status: task.status === 'done' ? 'todo' : 'done' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1">
          {['', 'todo', 'in-progress', 'review', 'done'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {s ? STATUS_CONFIG[s]?.label : 'All'}
            </button>
          ))}
        </div>

        <select
          className="input py-1 text-sm ml-auto w-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Task list */}
      <div className="card overflow-hidden">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No tasks found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {tasks.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status);
              const priority = PRIORITY_CONFIG[task.priority];
              const status = STATUS_CONFIG[task.status];
              return (
                <div
                  key={task._id}
                  onClick={() => setSelectedTask(task)}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer group transition"
                >
                  {/* Checkbox */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleDone(task); }}
                    className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition ${
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

                  {/* Title + tags */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {task.title}
                    </span>
                    {task.tags?.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {task.tags.slice(0, 3).map((t) => (
                          <span key={t} className="text-xs text-gray-400">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <span className="text-sm" title={task.category}>{CATEGORY_ICONS[task.category]}</span>

                  {/* Status */}
                  <span className={`badge hidden sm:flex ${status.bg} ${status.color}`}>{status.label}</span>

                  {/* Priority */}
                  <span className={`badge hidden md:flex ${priority.bg} ${priority.color}`}>{priority.label}</span>

                  {/* Due date */}
                  {task.dueDate && (
                    <span className={`text-xs font-medium hidden lg:block ${overdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {overdue && '⚠️ '}
                      {formatDueDate(task.dueDate)}
                    </span>
                  )}

                  {/* Assignee */}
                  {task.assignedTo?.avatar && (
                    <img src={task.assignedTo.avatar} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          mode="edit"
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
