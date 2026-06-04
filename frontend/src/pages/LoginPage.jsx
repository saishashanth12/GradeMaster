import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Assuming backend is running on 5000 or proxy is configured. We will use localhost:5000 directly if needed, or relative path if Vite proxies.
      // Let's use direct localhost:5000 for safety, as configured in previous steps, or check what RegisterPage does.
      // Let's assume 
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      // Save token and user info
      localStorage.setItem('gm_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-white)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-grey)] p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--primary-navy)] mb-2 font-['Outfit']">Welcome Back</h1>
          <p className="text-gray-500">Log in to GradeMaster to view your dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--primary-navy)] mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--electric-blue)] focus:border-transparent transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-[var(--primary-navy)]">Password</label>
            </div>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--electric-blue)] focus:border-transparent transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-[var(--electric-blue)] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--electric-blue)] font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
