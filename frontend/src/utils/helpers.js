import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';

export const formatDueDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'MMM d, yyyy');
};

export const formatRelative = (date) =>
  date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '';

export const isOverdue = (dueDate, status) =>
  dueDate && status !== 'done' && isPast(new Date(dueDate));

export const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', dot: 'bg-yellow-500' },
  low: { label: 'Low', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', dot: 'bg-green-500' },
};

export const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-300 dark:border-gray-700' },
  'in-progress': { label: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700' },
  review: { label: 'Review', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-700' },
  done: { label: 'Done', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700' },
};

export const CATEGORY_ICONS = {
  work: '💼',
  personal: '👤',
  shopping: '🛒',
  health: '❤️',
  finance: '💰',
  education: '📚',
  other: '📌',
};

export const KANBAN_COLUMNS = [
  { id: 'todo', label: 'To Do', description: 'Tasks not yet started' },
  { id: 'in-progress', label: 'In Progress', description: 'Currently working on' },
  { id: 'review', label: 'Review', description: 'Awaiting review' },
  { id: 'done', label: 'Done', description: 'Completed tasks' },
];
