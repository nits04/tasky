import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import KanbanBoard from '../components/Board/KanbanBoard';
import TaskModal from '../components/Task/TaskModal';
import { useTasks } from '../hooks/useTasks';
import { useSocket } from '../context/SocketContext';
import { PRIORITY_CONFIG, CATEGORY_ICONS } from '../utils/helpers';
import toast from 'react-hot-toast';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const CATEGORIES = ['work', 'personal', 'shopping', 'health', 'finance', 'education', 'other'];

export default function Board() {
  const { searchQuery } = useOutletContext();
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({ priority: '', category: '', archived: 'false' });
  const { socket } = useSocket();

  const { tasks, loading, fetchTasks, updateTask, deleteTask, reorderTasks, applySocketUpdate } = useTasks({
    search: searchQuery || undefined,
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
  });

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;
    const events = ['task:created', 'task:updated', 'task:deleted', 'task:reordered'];
    events.forEach((ev) => socket.on(ev, (payload) => applySocketUpdate(ev, payload)));
    return () => events.forEach((ev) => socket.off(ev));
  }, [socket, applySocketUpdate]);

  const handleUpdate = useCallback(async (id, updates, bulkUpdates) => {
    try {
      if (bulkUpdates) {
        await reorderTasks(bulkUpdates);
      } else {
        await updateTask(id, updates);
      }
    } catch {
      toast.error('Failed to update task');
    }
  }, [updateTask, reorderTasks]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteTask(id);
      toast.success('Task deleted');
      setSelectedTask(null);
    } catch {
      toast.error('Failed to delete task');
    }
  }, [deleteTask]);

  const handleSaveTask = useCallback(async (data) => {
    if (!selectedTask) return;
    await updateTask(selectedTask._id, data);
    toast.success('Task updated!');
    setSelectedTask(null);
    fetchTasks();
  }, [selectedTask, updateTask, fetchTasks]);

  const setFilter = (key, value) =>
    setFilters((p) => ({ ...p, [key]: p[key] === value ? '' : value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Filter:</span>

        {PRIORITIES.map((p) => (
          <button
            key={p}
            onClick={() => setFilter('priority', p)}
            className={`badge transition cursor-pointer ${
              filters.priority === p
                ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} ring-1 ring-current`
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {PRIORITY_CONFIG[p].label}
          </button>
        ))}

        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter('category', c)}
            className={`badge transition cursor-pointer ${
              filters.category === c
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-1 ring-primary-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {CATEGORY_ICONS[c]}
          </button>
        ))}

        {(filters.priority || filters.category) && (
          <button
            onClick={() => setFilters({ priority: '', category: '', archived: 'false' })}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            Clear
          </button>
        )}

        <div className="ml-auto text-xs text-gray-400">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      <KanbanBoard
        tasks={tasks}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onTaskClick={setSelectedTask}
      />

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
