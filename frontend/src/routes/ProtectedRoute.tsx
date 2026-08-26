import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-200 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-400">Verifying session token...</span>
        </div>
      </div>
    );
  }

  // Resolve user from state or synchronous localStorage backup to prevent navigation race
  let activeUser = user;
  if (!activeUser) {
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      try {
        activeUser = JSON.parse(storedUserStr);
      } catch (_) {}
    }
  }

  // Redirect to login if user is not authenticated
  if (!activeUser) {
    console.info('[ProtectedRoute] No authenticated user found. Redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Redirect to home/unauthorized default if user role is not allowed
  if (allowedRoles && !allowedRoles.includes(activeUser.role)) {
    console.info('[ProtectedRoute] User role not permitted for route:', activeUser.role);
    if (activeUser.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (activeUser.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
