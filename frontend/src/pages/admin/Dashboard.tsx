import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  GraduationCap,
  BookOpen,
  Building,
  Calendar,
  ShieldCheck,
  PlusCircle,
  FileSpreadsheet,
  History,
} from 'lucide-react';
import { Announcement } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminStats {
  students: number;
  faculty: number;
  courses: number;
  departments: number;
  activeEvents: number;
  recentAnnouncements: Announcement[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard-stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err: any) {
        setError('Failed to fetch admin stats. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
        {error || 'Database is currently unreachable.'}
      </div>
    );
  }

  const chartData = [
    { name: 'Departments', count: stats.departments },
    { name: 'Courses', count: stats.courses },
    { name: 'Faculty', count: stats.faculty },
    { name: 'Students', count: stats.students },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-primary-500/20 text-primary-400 px-2.5 py-1 rounded-full border border-primary-500/20">
            System Administrator
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-1">Console Dashboard</h1>
          <p className="text-sm text-slate-400 font-medium">Manage students, departments, course enrollments, and campus audits.</p>
        </div>
        <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 md:block hidden">
          <ShieldCheck className="w-8 h-8 text-primary-400" />
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-primary-50 text-primary-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Students</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.students}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Faculty</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.faculty}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Courses</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.courses}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departments</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.departments}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Recharts, Right quick actions & announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Distribution Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-black text-slate-800 text-lg">📊 Campus Metrics Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} fontWeight={600} tickLine={false} />
                <YAxis fontSize={11} fontWeight={600} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Quick Action Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-md">⚙️ Administrative Utilities</h3>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => navigate('/admin/students')}
                className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 border border-slate-200/60 rounded-xl text-left transition"
              >
                <PlusCircle className="w-5 h-5 text-primary-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">Add Student Account</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">Configure profile and link credentials</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/enrollments')}
                className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 border border-slate-200/60 rounded-xl text-left transition"
              >
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">Enroll Student</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">Map students to academic course catalogs</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/reports')}
                className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 border border-slate-200/60 rounded-xl text-left transition"
              >
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">Run CSV Reports</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">Generate and export database audits</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
