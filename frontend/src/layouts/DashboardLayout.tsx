import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  FileSpreadsheet,
  LogOut,
  Bell,
  Menu,
  X,
  FileCheck,
  User,
  ClipboardList,
  MailCheck,
  Building,
  History,
  TrendingUp,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  // Navigation configurations based on role
  const navItems = {
    ADMIN: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Students', path: '/admin/students', icon: Users },
      { label: 'Faculty', path: '/admin/faculty', icon: GraduationCap },
      { label: 'Departments', path: '/admin/departments', icon: Building },
      { label: 'Courses', path: '/admin/courses', icon: BookOpen },
      { label: 'Enrollments', path: '/admin/enrollments', icon: FileCheck },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: History },
      { label: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
    ],
    FACULTY: [
      { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
      { label: 'My Courses', path: '/faculty/courses', icon: BookOpen },
      { label: 'Mark Attendance', path: '/faculty/attendance', icon: CalendarDays },
      { label: 'Assignments', path: '/faculty/assignments', icon: ClipboardList },
      { label: 'Grade Center', path: '/faculty/submissions', icon: FileSpreadsheet },
      { label: 'Post Notices', path: '/faculty/announcements', icon: MailCheck },
    ],
    STUDENT: [
      { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { label: 'My Courses', path: '/student/courses', icon: BookOpen },
      { label: 'Attendance', path: '/student/attendance', icon: CalendarDays },
      { label: 'Assignments', path: '/student/assignments', icon: ClipboardList },
      { label: 'Exam Results', path: '/student/results', icon: TrendingUp },
      { label: 'Campus Events', path: '/student/events', icon: CalendarDays },
      { label: 'Notifications', path: '/student/notifications', icon: Bell },
    ],
  };

  const currentNavItems = navItems[user.role] || [];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* 1. Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900 text-slate-300 border-r border-slate-800">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800 bg-slate-950">
          <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            🎓 <span className="bg-gradient-to-r from-primary-400 to-sky-500 bg-clip-text text-transparent text-xl font-black">CloudCampus</span>
          </span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {currentNavItems.map(item => {
            const active = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-900/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Panel */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full mt-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-950/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* 2. Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden bg-slate-950/60 backdrop-blur-sm transition-opacity">
          <div className="relative flex flex-col w-72 max-w-xs bg-slate-900 text-slate-300">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-950">
              <span className="text-xl font-bold text-white flex items-center gap-2">🎓 CloudCampus</span>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {currentNavItems.map(item => {
                const active = location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      active ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-2">
              <p className="text-sm font-semibold text-white truncate px-2">{user.name}</p>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-950/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Body Frame */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header/Navbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 -ml-1 text-slate-500 rounded-md md:hidden hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-slate-500 capitalize md:inline-block hidden">
              System Console / <span className="text-slate-800">{location.pathname.split('/').pop()}</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Panel */}
              {notifOpen && (
                <div className="absolute right-0 z-30 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 divide-y divide-slate-100 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-semibold text-primary-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No recent alerts</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3 text-left transition hover:bg-slate-50 flex flex-col gap-0.5 ${
                            !n.isRead ? 'bg-sky-50/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-800">{n.title}</span>
                            {!n.isRead && (
                              <button
                                onClick={() => markAsRead(n.id)}
                                className="text-[9px] font-bold text-primary-600 hover:underline"
                              >
                                Read
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">{n.message}</p>
                          <span className="text-[8px] text-slate-400 mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Panel */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-sm hover:scale-105 transition duration-150">
                  {user.name?.charAt(0) || 'U'}
                </div>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 z-30 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    to={user.role === 'STUDENT' ? '/student/profile' : '#'}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 transition"
                  >
                    <User className="w-3.5 h-3.5" />
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Viewer viewport */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
