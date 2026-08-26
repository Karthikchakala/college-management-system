import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithCognitoToken: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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

  const redirectByRole = (role: string) => {
    if (role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else if (role === 'FACULTY') {
      navigate('/faculty/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for OAuth hash parameters from Cognito Hosted UI redirect
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token=') || hash.includes('id_token='))) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const idToken = params.get('id_token');
        const token = accessToken || idToken;

        if (token) {
          try {
            localStorage.setItem('token', token);
            // Clear hash from URL cleanly
            window.history.replaceState(null, '', window.location.pathname);

            // If an ID token is present, perform secure account linking
            if (idToken) {
              try {
                await api.post('/auth/cognito/link', { idToken });
              } catch (linkErr) {
                // Info log if already linked or non-blocking
                console.info('[AuthContext] Cognito linking status checked');
              }
            }

            const res = await api.get('/auth/profile');
            if (res.data.success) {
              const freshUser = handleProfileResponse(res.data.data);
              setUser(freshUser);
              localStorage.setItem('user', JSON.stringify(freshUser));
              redirectByRole(freshUser.role);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('[AuthContext] Cognito token verification failed:', error);
            logout();
          }
        }
      }

      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          const res = await api.get('/auth/profile');
          if (res.data.success) {
            const freshUser = handleProfileResponse(res.data.data);
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (error) {
          console.error('[AuthContext] Session verification failed, logging out...', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
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

  const loginWithCognitoToken = async (token: string) => {
    setLoading(true);
    try {
      localStorage.setItem('token', token);
      const res = await api.get('/auth/profile');
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
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/profile');
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
    <AuthContext.Provider value={{ user, loading, login, loginWithCognitoToken, logout, refreshUser }}>
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
