import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] font-sans antialiased text-slate-200 px-4">
      <div className="w-full max-w-md p-8 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Title branding */}
        <div className="text-center space-y-2 mb-8">
          <span className="text-4xl">🎓</span>
          <h2 className="text-3xl font-black tracking-tight text-white bg-gradient-to-r from-primary-400 to-sky-400 bg-clip-text text-transparent">
            CloudCampus
          </h2>
          <p className="text-xs text-slate-500 font-medium">College Campus Management System Console</p>
        </div>

        {/* Error Alert panel */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-800/40 text-red-400 text-xs font-semibold leading-normal">
            ⚠️ {error}
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@campus.local"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all placeholder-slate-600 text-sm text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all placeholder-slate-600 text-sm text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-sky-600 hover:from-primary-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-primary-950/20 hover:scale-[1.01] active:scale-[0.99] transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying Profile...
              </span>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>

        {/* Demo Helper box */}
        <div className="mt-8 pt-6 border-t border-slate-900 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Development Demo Accounts</p>
          <div className="grid grid-cols-3 gap-2 text-[9px] text-slate-500 font-semibold text-center leading-normal">
            <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/30">
              <span className="text-white block font-bold">Admin</span>
              admin@campus.local
            </div>
            <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/30">
              <span className="text-white block font-bold">Faculty</span>
              faculty@campus.local
            </div>
            <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/30">
              <span className="text-white block font-bold">Student</span>
              student@campus.local
            </div>
          </div>
          <p className="text-[9px] text-slate-600 text-center italic mt-1">Default password for all accounts: password123</p>
        </div>
      </div>
    </div>
  );
}
