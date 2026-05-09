import React, { useState } from 'react';
import { api } from './api';
import { PawPrint, LogIn, Loader2 } from 'lucide-react';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.login(token);
      onLogin();
    } catch {
      setError('Invalid token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-xl dark:shadow-none">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mb-4">
            <PawPrint size={32} />
          </div>
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-brand-600 to-pink-500 dark:from-brand-400 dark:to-pink-400 bg-clip-text text-transparent">
            Kawaii Tracker
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              placeholder="Enter your secret token..."
              value={token}
              onChange={e => setToken(e.target.value)}
              autoFocus
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            {loading ? 'Authenticating...' : 'Enter Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
