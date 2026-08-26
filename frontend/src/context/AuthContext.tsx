import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { exchangeCodeForTokens, refreshCognitoSession } from '../services/cognito';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithCognitoCode: (code: string) => Promise<void>;
  loginWithCognitoToken: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Track processed codes to prevent double-execution in React 18 StrictMode
const processedCodes = new Set<string>();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[DEBUG] AuthContext mounted', window.location.pathname, window.location.search);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(() => {
    return sessionStorage.getItem('cognito_auth_error') || null;
  });
  const navigate = useNavigate();

  const handleProfileResponse = (userData: any): User => {
    const rawUser = userData.user;
    const role = rawUser.role;
    let name = 'Admin User';
    let profileId: string | undefined = undefined;

    if (role === 'STUDENT' && rawUser.student) {
      name = `${rawUser.student.firstName} ${rawUser.student.lastName}`;
      profileId = rawUser.student.id;
    } else if (role === 'FACULTY' && rawUser.faculty) {
      name = `${rawUser.faculty.firstName} ${rawUser.faculty.lastName}`;
      profileId = rawUser.faculty.id;
    }

    return {
      id: rawUser.id,
      email: rawUser.email,
      role,
      name,
      profileId,
    };
  };

  const redirectByRole = useCallback((role: string) => {
    console.info('[AuthContext] 7. Redirecting to dashboard. Role:', role, 'Current pathname:', window.location.pathname);
    if (role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'FACULTY') {
      navigate('/faculty/dashboard', { replace: true });
    } else {
      navigate('/student/dashboard', { replace: true });
    }
  }, [navigate]);

  const logout = useCallback(() => {
    console.info('[AuthContext] Clearing tokens and resetting session');
    localStorage.removeItem('token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const loginWithCognitoCode = useCallback(async (code: string) => {
    if (processedCodes.has(code)) {
      console.info('[AuthContext] Code already processed or in-flight. Skipping duplicate exchange.');
      return;
    }
    processedCodes.add(code);

    setLoading(true);
    setAuthError(null);
    sessionStorage.removeItem('cognito_auth_error');

    try {
      console.info('[AuthContext] 1. Cognito callback detected');
      console.info('[AuthContext] 2. Starting code exchange');

      // 1. Exchange authorization code with Cognito /oauth2/token
      const tokens = await exchangeCodeForTokens(code);
      console.info('[AuthContext] 3. Code exchange succeeded');

      // Store tokens synchronously
      localStorage.setItem('token', tokens.access_token);
      if (tokens.id_token) {
        localStorage.setItem('id_token', tokens.id_token);
      }
      if (tokens.refresh_token) {
        localStorage.setItem('refresh_token', tokens.refresh_token);
      }

      // 2. Perform verified identity linking if id_token is available
      if (tokens.id_token) {
        try {
          console.info('[AuthContext] Linking account identity if needed...');
          const linkRes = await api.post('/auth/cognito/link', { idToken: tokens.id_token }, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          console.info('[AuthContext] Account linking status:', linkRes.data?.message || 'OK');
        } catch (linkErr: any) {
          console.info('[AuthContext] Account linking check:', linkErr.response?.data?.message || linkErr.message);
        }
      }

      // 3. Fetch application profile explicitly passing Bearer token
      console.info('[AuthContext] 4. Profile request started');
      const res = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      console.info('[AuthContext] 5. Profile HTTP status:', res.status);

      if (res.data.success && res.data.data?.user) {
        const freshUser = handleProfileResponse(res.data.data);
        console.info('[AuthContext] 6. Profile role:', freshUser.role);

        // Store user state synchronously
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
        setLoading(false);

        // Clean URL query parameters cleanly
        window.history.replaceState(null, '', window.location.pathname);

        redirectByRole(freshUser.role);
      } else {
        throw new Error(res.data?.message || 'Profile data missing in response');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Cognito authentication failed';
      console.error('[AuthContext] Authentication failed:', errorMsg);
      setAuthError(errorMsg);
      sessionStorage.setItem('cognito_auth_error', errorMsg);
      logout();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [logout, redirectByRole]);

  const loginWithCognitoToken = useCallback(async (token: string) => {
    setLoading(true);
    try {
      localStorage.setItem('token', token);
      const res = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const freshUser = handleProfileResponse(res.data.data);
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        redirectByRole(freshUser.role);
      }
    } catch (error: any) {
      logout();
      throw new Error(error.response?.data?.message || 'Cognito authentication failed.');
    } finally {
      setLoading(false);
    }
  }, [logout, redirectByRole]);

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Check for Authorization Code parameter in query string (?code=...)
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get('code');

      if (authCode) {
        console.info('[AuthContext] Callback authorization code found in URL. Processing SSO login...');
        try {
          await loginWithCognitoCode(authCode);
          return;
        } catch (codeErr: any) {
          console.error('[AuthContext] Code exchange failed:', codeErr.message || codeErr);
          setLoading(false);
          return;
        }
      }

      // 2. Check for Implicit Grant hash parameters if present (#access_token=...)
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token=') || hash.includes('id_token='))) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const idToken = params.get('id_token');
        const token = accessToken || idToken;

        if (token) {
          try {
            localStorage.setItem('token', token);
            if (idToken) {
              localStorage.setItem('id_token', idToken);
            }
            window.history.replaceState(null, '', window.location.pathname);

            if (idToken) {
              try {
                await api.post('/auth/cognito/link', { idToken }, {
                  headers: { Authorization: `Bearer ${token}` },
                });
              } catch (_) {}
            }

            const res = await api.get('/auth/profile', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) {
              const freshUser = handleProfileResponse(res.data.data);
              setUser(freshUser);
              localStorage.setItem('user', JSON.stringify(freshUser));
              redirectByRole(freshUser.role);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('[AuthContext] Implicit token verification failed:', error);
            logout();
          }
        }
      }

      // 3. Check for existing persisted session
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          const res = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data.success) {
            const freshUser = handleProfileResponse(res.data.data);
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (error: any) {
          // If 401, check if refresh token is available
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              console.info('[AuthContext] Access token expired, attempting refresh using refresh_token...');
              const refreshed = await refreshCognitoSession(refreshToken);
              localStorage.setItem('token', refreshed.access_token);
              if (refreshed.id_token) localStorage.setItem('id_token', refreshed.id_token);
              const res = await api.get('/auth/profile', {
                headers: { Authorization: `Bearer ${refreshed.access_token}` },
              });
              if (res.data.success) {
                const freshUser = handleProfileResponse(res.data.data);
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
                setLoading(false);
                return;
              }
            } catch (_) {
              logout();
            }
          } else {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [loginWithCognitoCode, logout, redirectByRole]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user: loggedUser } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        redirectByRole(loggedUser.role);
      }
    } catch (error: any) {
      setUser(null);
      throw new Error(error.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/auth/profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data.success) {
        const freshUser = handleProfileResponse(res.data.data);
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      }
    } catch (error) {
      console.error('[AuthContext] Refreshing user data failed', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        authError,
        login,
        loginWithCognitoCode,
        loginWithCognitoToken,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
