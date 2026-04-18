import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Board from './pages/Board';
import ListView from './pages/ListView';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected */}
      <Route element={<ProtectedRoute><SocketProvider><AppLayout /></SocketProvider></ProtectedRoute>}>
        <Route index element={<Board />} />
        <Route path="/list" element={<ListView />} />
        <Route path="/stats" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '10px',
                background: 'var(--toast-bg, #1f2937)',
                color: '#f9fafb',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
