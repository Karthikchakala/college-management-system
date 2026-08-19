import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen } from 'lucide-react';
import { Course } from '../../types';

export default function FacultyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/faculty/courses');
        if (res.data.success) {
          setCourses(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Assigned Courses</h1>
        <p className="text-sm text-slate-500 font-medium">Verify your registered syllabi, credit maps, and descriptions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.code}</span>
              <h3 className="text-base font-bold text-slate-800 leading-snug">{c.name}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{c.description || 'No description provided.'}</p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>Credits: {c.credits}</span>
              <span className="text-primary-600">Assigned Instructor</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
