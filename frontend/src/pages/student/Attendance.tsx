import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { AlertCircle, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';

interface AttendanceSummary {
  courseId: string;
  courseCode: string;
  courseName: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  records: any[];
}

export default function StudentAttendance() {
  const [data, setData] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get('/student/attendance');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err: any) {
        setError('Failed to fetch attendance records.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Class Attendance</h1>
        <p className="text-sm text-slate-500 font-medium">Verify your lecture presence. Minimum requirement is 75% per course.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map(course => {
          const belowThreshold = course.percentage < 75;
          return (
            <div key={course.courseId} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider block">{course.courseCode}</span>
                  <h3 className="font-bold text-slate-800 text-sm">{course.courseName}</h3>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${belowThreshold ? 'text-red-500' : 'text-emerald-500'}`}>
                    {course.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      belowThreshold ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${course.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Present: {course.present} lectures</span>
                  <span>Absent: {course.absent} lectures</span>
                </div>
              </div>

              {/* Low Attendance Warning */}
              {belowThreshold && (
                <div className="p-3.5 bg-red-50 rounded-xl border border-red-200/50 flex items-start gap-2 text-[11px] text-red-700 leading-normal font-medium">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  Warning: Attendance is currently below 75%. Please contact your course instructor to avoid sem-end block list.
                </div>
              )}

              {/* Attendance Log History (Show last 5 records) */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> Recent Attendance History
                </h4>
                {course.records.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No lectures recorded yet.</p>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {course.records.slice(0, 10).map(rec => (
                      <div
                        key={rec.id}
                        className={`p-2 rounded-lg border text-center text-[10px] font-bold flex flex-col gap-0.5 ${
                          rec.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rec.status === 'LATE'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                        title={rec.remarks || rec.status}
                      >
                        <span>{new Date(rec.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                        <span className="text-[8px] font-extrabold">{rec.status.substring(0, 3)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
