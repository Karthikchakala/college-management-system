import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buildCognitoLoginUrl } from '../services/cognito';

export default function Login() {
  console.log('[DEBUG] Login.tsx mounted', typeof window !== 'undefined' ? window.location.href : '');
  console.log('[DEBUG] /login route rendered');
  const { user, loading: authLoading, authError } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
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

        {/* AWS Cognito Cloud Authentication Entry Point */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleCognitoLogin}
            disabled={isCognitoRedirecting}
            className="w-full py-4 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-amber-950/30 transition-all duration-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isCognitoRedirecting ? (
              <span className="flex items-center gap-2 text-slate-950 font-bold">
                <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting to AWS Cognito...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 fill-current text-slate-950" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.88c.61-.75 1.04-1.8 0.92-2.88-.91.04-2 .61-2.65 1.37-.58.67-.99 1.74-.86 2.78 1.02.08 2-.54 2.59-1.27z" />
                </svg>
                Sign In to CloudCampus (AWS Cognito SSO)
              </>
            )}
          </button>

          {/* Secure Cloud Authentication Badges & Note */}
          <div className="pt-4 border-t border-slate-800/80 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Amazon Cognito Managed Login &bull; OAuth 2.0 PKCE</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
              Role-based single sign-on for <span className="text-slate-300 font-medium">Students</span>, <span className="text-slate-300 font-medium">Faculty</span>, and <span className="text-slate-300 font-medium">Administrators</span> via Amazon Web Services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
