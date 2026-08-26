import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buildCognitoLoginUrl } from '../services/cognito';

export default function Login() {
  console.log('[DEBUG] Login.tsx mounted', typeof window !== 'undefined' ? window.location.href : '');
  console.log('[DEBUG] /login route rendered');
  const { user, login, loading: authLoading, authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCognitoRedirecting, setIsCognitoRedirecting] = useState(false);

  // Check if page loaded with authorization code from Cognito redirect
  const hasAuthCode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('code');

  // If user is already authenticated, redirect to their role dashboard
  useEffect(() => {
    if (user && !authLoading) {
      console.info('[Login] User already authenticated. Redirecting to role dashboard:', user.role);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'FACULTY') {
        navigate('/faculty/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const handleCognitoLogin = async () => {
    try {
      setIsCognitoRedirecting(true);
      setError(null);
      const hostedUiUrl = await buildCognitoLoginUrl();
      window.location.href = hostedUiUrl;
    } catch (err: any) {
      setIsCognitoRedirecting(false);
      setError(err.message || 'Failed to initialize Cognito SSO redirect.');
    }
  };

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

  // Show authenticating overlay during active code exchange
  if (hasAuthCode && authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] font-sans antialiased text-slate-200 px-4">
        <div className="w-full max-w-md p-8 bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin mx-auto"></div>
          <h3 className="text-lg font-bold text-white">Authenticating with AWS Cognito</h3>
          <p className="text-xs text-slate-400">Exchanging authorization code and verifying identity...</p>
        </div>
      </div>
    );
  }

  const displayedError = error || authError;

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] font-sans antialiased text-slate-200 px-4">
      <div className="w-full max-w-md p-8 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Title branding */}
        <div className="text-center space-y-2 mb-6">
          <span className="text-4xl">🎓</span>
          <h2 className="text-3xl font-black tracking-tight text-white bg-gradient-to-r from-primary-400 to-sky-400 bg-clip-text text-transparent">
            CloudCampus
          </h2>
          <p className="text-xs text-slate-500 font-medium">College Campus Management System</p>
        </div>

        {/* Error Alert panel */}
        {displayedError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-800/40 text-red-400 text-xs font-semibold leading-normal">
            ⚠️ {displayedError}
          </div>
        )}

        {/* AWS Cognito Hosted UI Login Option */}
        <button
          type="button"
          onClick={handleCognitoLogin}
          disabled={isCognitoRedirecting}
          className="w-full mb-5 py-3.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-sm shadow-md transition duration-150 flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {isCognitoRedirecting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Redirecting to AWS Cognito...
            </span>
          ) : (
            <>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.88c.61-.75 1.04-1.8 0.92-2.88-.91.04-2 .61-2.65 1.37-.58.67-.99 1.74-.86 2.78 1.02.08 2-.54 2.59-1.27z" />
              </svg>
              Sign In with AWS Cognito SSO
            </>
          )}
        </button>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">or sign in with credentials</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Form elements */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="mt-6 pt-5 border-t border-slate-900 space-y-2">
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
