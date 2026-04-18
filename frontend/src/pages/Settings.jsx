import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authApi.updateProfile(profileForm);
      updateUser(data.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await authApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  const Section = ({ title, children }) => (
    <div className="card p-6 mb-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>

      {/* Profile */}
      <Section title="Profile">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-2xl font-bold text-primary-700 dark:text-primary-300 overflow-hidden flex-shrink-0">
            {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.googleId && <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mt-1">Google account</span>}
          </div>
        </div>

        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full name</label>
            <input
              type="text"
              className="input"
              value={profileForm.name}
              onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary btn-sm">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Choose your preferred theme</p>
          {[
            { value: 'light', label: 'Light', icon: '☀️', desc: 'Always light mode' },
            { value: 'dark', label: 'Dark', icon: '🌙', desc: 'Always dark mode' },
            { value: 'system', label: 'System', icon: '💻', desc: 'Follow system preference' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition text-left ${
                theme === t.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t.label}</p>
                <p className="text-xs text-gray-500">{t.desc}</p>
              </div>
              {theme === t.value && (
                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </Section>

      {/* Change Password */}
      {!user?.googleId && (
        <Section title="Change Password">
          <form onSubmit={handlePassword} className="space-y-4">
            {[
              { key: 'currentPassword', label: 'Current Password' },
              { key: 'newPassword', label: 'New Password' },
              { key: 'confirmPassword', label: 'Confirm New Password' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={passwordForm[key]}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <button type="submit" disabled={savingPw} className="btn-primary btn-sm">
              {savingPw ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </Section>
      )}

      {/* Danger Zone */}
      <Section title="Account">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Sign out</p>
            <p className="text-xs text-gray-500">Sign out from all devices</p>
          </div>
          <button onClick={logout} className="btn-danger btn-sm">Sign Out</button>
        </div>
      </Section>
    </div>
  );
}
