import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileCheck, PlusCircle } from 'lucide-react';
import { Course, Student } from '../../types';

export default function AdminEnrollments() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortalData = async () => {
    try {
      const [coursesRes, studentsRes, enrollRes] = await Promise.all([
        api.get('/admin/courses'),
        api.get('/admin/students'),
        api.get('/admin/reports/attendance'), // using reports or fetching log context. Let's do standard:
      ]);
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.data);
        if (coursesRes.data.data.length > 0) setCourseId(coursesRes.data.data[0].id);
      }
      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data);
        if (studentsRes.data.data.length > 0) setStudentId(studentsRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load catalog data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await api.post('/admin/enrollments', {
        studentId,
        courseId,
      });

      if (res.data.success) {
        setSuccess(true);
        // Clear
        alert('Student successfully enrolled in course!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll student.');
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
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Course Enrollments</h1>
        <p className="text-sm text-slate-500 font-medium">Link student profiles directly to active courses catalog sheets.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
          ✅ Student successfully mapped to course!
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl">
        <h3 className="font-bold text-slate-800 text-md border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
          <FileCheck className="w-5 h-5 text-primary-600" /> Map Student to Course Catalog
        </h3>

        <form onSubmit={handleEnroll} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Student</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.enrollmentNumber})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-primary-900/10"
          >
            {submitting ? 'Mapping enrollment...' : 'Enroll Student'}
          </button>
        </form>
      </div>
    </div>
  );
}
