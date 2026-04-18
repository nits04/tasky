import { useEffect, useState } from 'react';
import { tasksApi } from '../api/tasks';
import { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_ICONS } from '../utils/helpers';

const StatCard = ({ label, value, sub, color = 'text-primary-600 dark:text-primary-400' }) => (
  <div className="card p-5">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const BarChart = ({ data, labelKey, valueKey, colorFn, total }) => {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item[labelKey]} className="flex items-center gap-3">
          <div className="w-24 text-xs text-gray-600 dark:text-gray-400 capitalize truncate">{item[labelKey]}</div>
          <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colorFn(item[labelKey])}`}
              style={{ width: `${(item[valueKey] / max) * 100}%` }}
            />
          </div>
          <div className="w-10 text-xs text-right font-medium text-gray-700 dark:text-gray-300">{item[valueKey]}</div>
          {total > 0 && (
            <div className="w-10 text-xs text-right text-gray-400">{Math.round((item[valueKey] / total) * 100)}%</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksApi.getStats().then(({ data }) => {
      setStats(data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const total = stats.byStatus.reduce((s, i) => s + i.count, 0);
  const done = stats.byStatus.find((s) => s._id === 'done')?.count || 0;
  const inProgress = stats.byStatus.find((s) => s._id === 'in-progress')?.count || 0;

  const statusColors = {
    todo: 'bg-gray-400',
    'in-progress': 'bg-blue-500',
    review: 'bg-purple-500',
    done: 'bg-green-500',
  };

  const priorityColors = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return (
    <div className="max-w-5xl animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tasks" value={total} />
        <StatCard label="Completed" value={done} sub={total ? `${Math.round((done / total) * 100)}% completion rate` : ''} color="text-green-600 dark:text-green-400" />
        <StatCard label="In Progress" value={inProgress} color="text-blue-600 dark:text-blue-400" />
        <StatCard label="Overdue" value={stats.overdue} color={stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'} sub={stats.overdue > 0 ? 'Needs attention' : 'All on track!'} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* By status */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Tasks by Status</h3>
          <BarChart
            data={stats.byStatus.map((s) => ({ ...s, label: STATUS_CONFIG[s._id]?.label || s._id }))}
            labelKey="label"
            valueKey="count"
            colorFn={(label) => {
              const key = Object.keys(STATUS_CONFIG).find((k) => STATUS_CONFIG[k].label === label);
              return statusColors[key] || 'bg-gray-400';
            }}
            total={total}
          />
        </div>

        {/* By priority */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Tasks by Priority</h3>
          <BarChart
            data={['urgent', 'high', 'medium', 'low'].map((p) => ({
              _id: p,
              label: PRIORITY_CONFIG[p]?.label || p,
              count: stats.byPriority.find((s) => s._id === p)?.count || 0,
            }))}
            labelKey="label"
            valueKey="count"
            colorFn={(label) => {
              const key = Object.keys(PRIORITY_CONFIG).find((k) => PRIORITY_CONFIG[k].label === label);
              return priorityColors[key] || 'bg-gray-400';
            }}
            total={total}
          />
        </div>
      </div>

      {/* By category */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Tasks by Category</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {stats.byCategory.map((cat) => (
            <div key={cat._id} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="text-2xl mb-1">{CATEGORY_ICONS[cat._id] || '📌'}</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{cat.count}</div>
              <div className="text-xs text-gray-500 capitalize">{cat._id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
