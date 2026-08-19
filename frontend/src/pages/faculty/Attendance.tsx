import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, CheckCircle2, UserCheck, AlertCircle, History } from 'lucide-react';
import { Course, Student } from '../../types';

export default function FacultyAttendance() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceStates, setAttendanceStates] = useState<{ [studentId: string]: 'PRESENT' | 'ABSENT' | 'LATE' }>({});
  const [remarks, setRemarks] = useState<{ [studentId: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/faculty/courses');
        if (res.data.success) {
          setCourses(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedCourseId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const fetchStudentsAndHistory = async (courseId: string) => {
    if (!courseId) return;
    setStudentsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const [studentsRes, historyRes] = await Promise.all([
        api.get(`/faculty/courses/${courseId}/students`),
        api.get(`/faculty/attendance/${courseId}`),
      ]);
      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data);
        // Initialize all student attendance to PRESENT by default
        const initialStates: any = {};
        studentsRes.data.data.forEach((student: Student) => {
          initialStates[student.id] = 'PRESENT';
        });
        setAttendanceStates(initialStates);
      }
      if (historyRes.data.success) {
        setHistory(historyRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load class list', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsAndHistory(selectedCourseId);
  }, [selectedCourseId]);

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendanceStates(prev => ({ ...prev, [studentId]: status }));
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setRemarks(prev => ({ ...prev, [studentId]: remark }));
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    const records = Object.keys(attendanceStates).map(studentId => ({
      studentId,
      status: attendanceStates[studentId],
      remarks: remarks[studentId] || null,
    }));

    try {
      const res = await api.post('/faculty/attendance', {
        courseId: selectedCourseId,
        date,
        records,
      });
      if (res.data.success) {
        setSuccess(true);
        // Refresh history
        const historyRes = await api.get(`/faculty/attendance/${selectedCourseId}`);
        if (historyRes.data.success) setHistory(historyRes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Record Attendance</h1>
        <p className="text-sm text-slate-500 font-medium">Mark student presence for lectures. Upserts are supported if dates overlap.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
          ✅ Attendance recorded successfully for the date!
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* Configuration bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
          >
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.code} — {course.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lecture Date</label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Roll-call sheet */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary-600" /> Class Roll-Call Sheet
          </h3>

          {studentsLoading ? (
            <div className="text-center py-12 text-xs text-slate-400 font-medium">Loading roster...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 font-medium">No students enrolled in this course.</div>
          ) : (
            <form onSubmit={handleSaveAttendance} className="space-y-4">
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-2">
                {students.map(student => (
                  <div key={student.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800">{student.firstName} {student.lastName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{student.enrollmentNumber}</p>
                    </div>
                    
                    {/* Presence toggles */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          checked={attendanceStates[student.id] === 'PRESENT'}
                          onChange={() => handleStatusChange(student.id, 'PRESENT')}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <span className="font-semibold text-slate-700">Present</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          checked={attendanceStates[student.id] === 'LATE'}
                          onChange={() => handleStatusChange(student.id, 'LATE')}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-semibold text-slate-700">Late</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          checked={attendanceStates[student.id] === 'ABSENT'}
                          onChange={() => handleStatusChange(student.id, 'ABSENT')}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="font-semibold text-slate-700">Absent</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Remarks (optional)"
                        value={remarks[student.id] || ''}
                        onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700 font-medium placeholder-slate-400 focus:bg-white focus:outline-none max-w-[120px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-primary-900/10"
              >
                {submitting ? 'Recording sheet...' : 'Save Class Attendance'}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Log summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" /> Attendance Logs
          </h3>
          <div className="space-y-3 max-h-[450px] overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No previous logs for this course.</p>
            ) : (
              history.slice(0, 15).map(log => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 flex justify-between items-center gap-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">{log.student?.firstName} {log.student?.lastName}</p>
                    <p className="text-[9px] text-slate-400 font-medium">Date: {new Date(log.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${
                    log.status === 'PRESENT'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : log.status === 'LATE'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {log.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
