import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, PlusCircle } from 'lucide-react';
import { Course, Faculty } from '../../types';

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [credits, setCredits] = useState('4');
  const [departmentId, setDepartmentId] = useState('');
  const [facultyId, setFacultyId] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortalData = async () => {
    try {
      const [coursesRes, deptsRes, facultyRes] = await Promise.all([
        api.get('/admin/courses'),
        api.get('/admin/departments'),
        api.get('/admin/faculty'),
      ]);
      if (coursesRes.data.success) setCourses(coursesRes.data.data);
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data);
        if (deptsRes.data.data.length > 0) setDepartmentId(deptsRes.data.data[0].id);
      }
      if (facultyRes.data.success) {
        setFaculty(facultyRes.data.data);
        if (facultyRes.data.data.length > 0) setFacultyId(facultyRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load courses data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await api.post('/admin/courses', {
        code,
        name,
        description,
        credits: parseInt(credits),
        departmentId,
        facultyId: facultyId || null,
      });

      if (res.data.success) {
        setSuccess(true);
        setCreateModalOpen(false);
        setCode('');
        setName('');
        setDescription('');
        await fetchPortalData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create course.');
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
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Course Catalogs</h1>
          <p className="text-sm text-slate-500 font-medium">Configure syllabus parameters, credit values, and assign course instructors.</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-primary-900/10"
        >
          <PlusCircle className="w-4 h-4" /> Create Course
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
          ✅ Course created and faculty instructor linked successfully!
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {courses.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">No courses defined in the catalog.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 font-semibold">Course Code</th>
                  <th className="p-4 font-semibold">Course Name</th>
                  <th className="p-4 font-semibold">Credits</th>
                  <th className="p-4 font-semibold">Department</th>
                  <th className="p-4 font-semibold">Faculty Instructor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map(course => (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-800">{course.code}</td>
                    <td className="p-4 font-semibold">{course.name}</td>
                    <td className="p-4 font-bold text-slate-500">{course.credits}</td>
                    <td className="p-4 font-medium">{course.department?.name}</td>
                    <td className="p-4 font-semibold text-primary-600">
                      {course.faculty ? `${course.faculty.firstName} ${course.faculty.lastName}` : 'Not Assigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xl relative">
            <h3 className="font-black text-slate-800 text-lg">📚 Create Catalog Course</h3>
            
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="CS-101"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credits</label>
                  <input
                    type="number"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Introduction to Programming"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide syllabus overview..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Faculty Instructor</label>
                  <select
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  >
                    <option value="">Select Instructor</option>
                    {faculty.map(f => (
                      <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-6 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  {submitting ? 'Creating course...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
