import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  BookOpen,
  Calendar,
  AlertTriangle,
  Clock,
  ChevronRight,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { Announcement, Assignment, Exam } from '../../types';

interface StudentDashboardData {
  profile: {
    firstName: string;
    lastName: string;
    enrollmentNumber: string;
  };
  coursesCount: number;
  attendancePercentage: number;
  pendingAssignments: Assignment[];
  upcomingExams: Exam[];
  upcomingEvents: any[];
  announcements: Announcement[];
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/student/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err: any) {
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
        {error || 'Dashboard data is unavailable.'}
      </div>
    );
  }

  const {
    profile,
    coursesCount,
    attendancePercentage,
    pendingAssignments,
    upcomingExams,
    upcomingEvents,
    announcements,
  } = data;

  return (
    <div className="space-y-6">
      {/* Welcoming Banner */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-2xl p-6 shadow-md shadow-slate-900/10">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-primary-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-primary-500/20 text-primary-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border border-primary-500/20">
              <Sparkles className="w-3 h-3" /> Active Semester
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome Back, {profile.firstName}!
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Student Enrollment: <span className="text-white font-bold">{profile.enrollmentNumber}</span>
          </p>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-primary-50 text-primary-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enrolled Courses</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{coursesCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className={`p-3.5 rounded-xl ${attendancePercentage >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{attendancePercentage}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Tasks</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{pendingAssignments.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Exams</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{upcomingExams.length}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Side Assignments & Notices, Right Side Schedule & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Assignments */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                📝 Pending Assignments ({pendingAssignments.length})
              </h3>
              <button
                onClick={() => navigate('/student/assignments')}
                className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-0.5"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingAssignments.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400 font-medium">
                🎉 All caught up! No pending assignments.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingAssignments.map(assign => (
                  <div key={assign.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">{assign.title}</p>
                      <p className="text-xs text-slate-400 font-medium">
                        Course: <span className="text-slate-600 font-semibold">{assign.course?.name}</span> • Max Points: <span className="font-bold text-primary-600">{assign.points}</span>
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        Due: {new Date(assign.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Announcements Noticeboard */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                📢 Noticeboard & Announcements
              </h3>
            </div>

            {announcements.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400 font-medium">
                No recent announcements posted.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map(notice => (
                  <div key={notice.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border ${
                        notice.type === 'URGENT'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : notice.type === 'EXAM'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-primary-50 text-primary-700 border-primary-200'
                      }`}>
                        {notice.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">{notice.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{notice.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: 1 Column (Schedules, registered events) */}
        <div className="space-y-6">
          {/* Exam Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-md flex items-center gap-2">
                📅 Upcoming Exams
              </h3>
            </div>

            {upcomingExams.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No scheduled exams in this semester.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingExams.map(exam => (
                  <div key={exam.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 flex gap-3 items-center">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{exam.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{exam.course?.name}</p>
                      <p className="text-[9px] text-primary-600 font-semibold mt-1">
                        {new Date(exam.examDate).toLocaleDateString()} • {exam.startTime} @ {exam.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campus Events Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-md flex items-center gap-2">
                🎉 Campus Events
              </h3>
              <button
                onClick={() => navigate('/student/events')}
                className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-0.5"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No upcoming events.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map(event => {
                  const registered = event.registrations.length > 0;
                  return (
                    <div key={event.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 truncate">{event.title}</p>
                        {registered && (
                          <span className="text-[8px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                            Registered
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium">
                        {new Date(event.eventDate).toLocaleDateString()} @ {event.location}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
