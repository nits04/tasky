import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { tasksApi } from '../../api/tasks';
import { formatRelative } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Header({ onSearch, onNewTask, title = 'Board' }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { connected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    tasksApi.getNotifications().then(({ data }) => {
      setNotifications(data.data.notifications || []);
    }).catch(() => {});
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await tasksApi.markNotificationsRead().catch(() => {});
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
  };

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const themeIcon = theme === 'light'
    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    : theme === 'dark'
    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" /></svg>;

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-4 flex-shrink-0">
      <h1 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h1>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks…"
            className="input pl-9 py-1.5 text-sm"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Socket connection indicator */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400" title={connected ? 'Real-time connected' : 'Disconnected'}>
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        </div>

        {/* Theme toggle */}
        <button onClick={cycleTheme} className="btn-ghost p-2" title={`Theme: ${theme}`}>
          {themeIcon}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((p) => !p); setUserOpen(false); }}
            className="btn-ghost p-2 relative"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-10 z-40 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl animate-fade-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map((n, i) => (
                      <div key={i} className={`px-4 py-3 ${n.read ? '' : 'bg-primary-50 dark:bg-primary-900/20'}`}>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatRelative(n.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setUserOpen((p) => !p); setNotifOpen(false); }}
            className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-sm font-semibold text-primary-700 dark:text-primary-300 overflow-hidden hover:ring-2 hover:ring-primary-500 transition"
          >
            {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase()}
          </button>
          {userOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setUserOpen(false)} />
              <div className="absolute right-0 top-10 z-40 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-1 animate-fade-in">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
