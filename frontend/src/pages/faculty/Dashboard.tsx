import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  BookOpen,
  Users,
  Clock,
  Calendar,
  Sparkles,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { Course, Announcement, Exam } from '../../types';

interface FacultyDashboardData {
  profile: {
    firstName: string;
    lastName: string;
    designation: string;
    employeeId: string;
  };
  courses: Course[];
  studentsCount: number;
  pendingSubmissionsCount: number;
  upcomingExams: Exam[];
  announcements: Announcement[];
}

export default function FacultyDashboard() {
  const [data, setData] = useState<FacultyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/faculty/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err: any) {
        setError('Failed to load faculty dashboard data. Please try again.');
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
    courses,
    studentsCount,
    pendingSubmissionsCount,
    upcomingExams,
    announcements,
  } = data;

  return (
    <div className="space-y-6">
      {/* Welcoming Banner */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-2xl p-6 shadow-md shadow-slate-900/10">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-sky-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border border-sky-500/20">
              <Sparkles className="w-3 h-3" /> Faculty Portal
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome Back, {profile.designation} {profile.firstName}!
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Employee ID: <span className="text-white font-bold">{profile.employeeId}</span>
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Courses</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{courses.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{studentsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Submissions</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{pendingSubmissionsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Exams</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{upcomingExams.length}</p>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left columns (My Assigned Courses) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                📚 Assigned Courses
              </h3>
            </div>

            {courses.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400 font-medium">
                No courses assigned to you in the system.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map(course => (
                  <div key={course.id} className="p-4 rounded-xl border border-slate-200 hover:border-primary-500 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider block">{course.code}</span>
                      <h4 className="text-sm font-bold text-slate-800 leading-snug">{course.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{course.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => navigate(`/faculty/attendance`)}
                        className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                      >
                        Attendance
                      </button>
                      <button
                        onClick={() => navigate(`/faculty/assignments`)}
                        className="flex-1 py-1.5 px-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg text-xs transition"
                      >
                        Assignments
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Posted Notice list */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                📢 My Posted Announcements
              </h3>
              <button
                onClick={() => navigate('/faculty/announcements')}
                className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Post Announcement
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400 font-medium">
                No announcements posted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map(notice => (
                  <div key={notice.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/40 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="font-extrabold text-primary-600">{notice.type}</span>
                      <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">{notice.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{notice.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column schedule */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-md flex items-center gap-2">
                📅 Scheduled Exams
              </h3>
            </div>

            {upcomingExams.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No upcoming exams scheduled.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingExams.map(exam => (
                  <div key={exam.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 flex gap-3 items-center">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{exam.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{exam.course?.name}</p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                        {new Date(exam.examDate).toLocaleDateString()} • {exam.startTime} @ {exam.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
