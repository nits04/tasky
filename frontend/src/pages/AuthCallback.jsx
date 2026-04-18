import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      toast.error('Google sign-in failed. Please try again.');
      navigate('/login');
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      fetchUser().then(() => {
        toast.success('Signed in with Google!');
        navigate('/');
      });
    } else {
      navigate('/login');
    }
  }, [params, fetchUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Completing sign-in…</p>
      </div>
    </div>
  );
}
