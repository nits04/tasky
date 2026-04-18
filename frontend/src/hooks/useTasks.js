import { useState, useEffect, useCallback, useRef } from 'react';
import { tasksApi } from '../api/tasks';
import toast from 'react-hot-toast';

export const useTasks = (filters = {}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await tasksApi.getAll(filtersRef.current);
      setTasks(data.data.tasks);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await tasksApi.getStats();
      setStats(data.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, JSON.stringify(filters)]);

  const createTask = async (taskData) => {
    const { data } = await tasksApi.create(taskData);
    setTasks((prev) => [data.data.task, ...prev]);
    return data.data.task;
  };

  const updateTask = async (id, updates) => {
    const { data } = await tasksApi.update(id, updates);
    setTasks((prev) => prev.map((t) => (t._id === id ? data.data.task : t)));
    return data.data.task;
  };

  const deleteTask = async (id) => {
    await tasksApi.delete(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  const reorderTasks = async (updates) => {
    setTasks((prev) => {
      const map = new Map(updates.map((u) => [u.id, u]));
      return prev.map((t) => {
        const u = map.get(t._id);
        return u ? { ...t, status: u.status, position: u.position } : t;
      });
    });
    await tasksApi.reorder(updates);
  };

  // Real-time socket integration helper
  const applySocketUpdate = useCallback((type, payload) => {
    if (type === 'task:created') setTasks((prev) => [payload, ...prev]);
    if (type === 'task:updated') setTasks((prev) => prev.map((t) => (t._id === payload._id ? payload : t)));
    if (type === 'task:deleted') setTasks((prev) => prev.filter((t) => t._id !== payload.id));
    if (type === 'task:reordered') {
      const map = new Map(payload.map((u) => [u.id, u]));
      setTasks((prev) => prev.map((t) => {
        const u = map.get(t._id);
        return u ? { ...t, status: u.status, position: u.position } : t;
      }));
    }
  }, []);

  return { tasks, loading, stats, fetchTasks, fetchStats, createTask, updateTask, deleteTask, reorderTasks, applySocketUpdate, setTasks };
};
