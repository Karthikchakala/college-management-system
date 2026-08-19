import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Proactively fetch updated profile from backend to ensure token is valid
          const res = await api.get('/auth/profile');
          if (res.data.success) {
            const freshUser = {
              id: res.data.data.user.id,
              email: res.data.data.user.email,
              role: res.data.data.user.role,
              name: res.data.data.user.role === 'STUDENT'
                ? `${res.data.data.user.student.firstName} ${res.data.data.user.student.lastName}`
                : res.data.data.user.role === 'FACULTY'
                ? `${res.data.data.user.faculty.firstName} ${res.data.data.user.faculty.lastName}`
                : 'Admin User',
              profileId: res.data.data.user.role === 'STUDENT'
                ? res.data.data.user.student.id
                : res.data.data.user.role === 'FACULTY'
                ? res.data.data.user.faculty.id
                : undefined,
            };
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
        
        // Redirect based on role
        if (loggedUser.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (loggedUser.role === 'FACULTY') {
          navigate('/faculty/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (error: any) {
      setUser(null);
      throw new Error(error.response?.data?.message || 'Login failed. Please check credentials.');
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
        const freshUser = {
          id: res.data.data.user.id,
          email: res.data.data.user.email,
          role: res.data.data.user.role,
          name: res.data.data.user.role === 'STUDENT'
            ? `${res.data.data.user.student.firstName} ${res.data.data.user.student.lastName}`
            : res.data.data.user.role === 'FACULTY'
            ? `${res.data.data.user.faculty.firstName} ${res.data.data.user.faculty.lastName}`
            : 'Admin User',
          profileId: res.data.data.user.role === 'STUDENT'
            ? res.data.data.user.student.id
            : res.data.data.user.role === 'FACULTY'
            ? res.data.data.user.faculty.id
            : undefined,
        };
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      }
    } catch (error) {
      console.error('[AuthContext] Refreshing user data failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
