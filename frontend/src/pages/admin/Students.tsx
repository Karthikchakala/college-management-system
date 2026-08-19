import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { UserCheck, PlusCircle, Search, Trash2, Edit3, ShieldAlert } from 'lucide-react';
import { Student } from '../../types';

interface DepartmentSelect {
  id: string;
  name: string;
  code: string;
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<DepartmentSelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');

  // Create Student Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123'); // Demo default
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [deptId, setDeptId] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentsAndDepartments = async () => {
    try {
      const [studentsRes, deptsRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/departments'),
      ]);
      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data);
      }
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data);
        if (deptsRes.data.data.length > 0) setDeptId(deptsRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load roster data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsAndDepartments();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await api.post('/admin/students', {
        username,
        email,
        password,
        firstName,
        lastName,
        enrollmentNumber,
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        departmentId: deptId,
        admissionDate: new Date(admissionDate).toISOString(),
      });

      if (res.data.success) {
        setSuccess(true);
        setCreateModalOpen(false);
        // Clear fields
        setUsername('');
        setEmail('');
        setFirstName('');
        setLastName('');
        setEnrollmentNumber('');
        setDateOfBirth('');
        await fetchStudentsAndDepartments();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (studentId: string, currentStatus: string) => {
    if (!confirm('Are you sure you want to change this student\'s account status?')) return;
    try {
      const targetStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await api.put(`/admin/students/${studentId}/status`, { status: targetStatus });
      if (res.data.success) {
        await fetchStudentsAndDepartments();
      }
    } catch (err) {
      console.error('Failed to update student status', err);
    }
  };

  // Filter students based on search query and department selection
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || student.enrollmentNumber.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDeptId ? student.department?.id === selectedDeptId : true;
    return matchesSearch && matchesDept;
  });

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
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Student Accounts</h1>
          <p className="text-sm text-slate-500 font-medium">Manage student profiles, register new enrollments, and toggle academic statuses.</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-primary-900/10"
        >
          <PlusCircle className="w-4 h-4" /> Add Student
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
          ✅ Student account created and mapped successfully!
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 focus:outline-none transition"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">No students match current search filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 font-semibold">Student Name</th>
                  <th className="p-4 font-semibold">Roll Number</th>
                  <th className="p-4 font-semibold">Department</th>
                  <th className="p-4 font-semibold">Admission Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-800">{student.firstName} {student.lastName}</td>
                    <td className="p-4 font-semibold text-slate-500">{student.enrollmentNumber}</td>
                    <td className="p-4 font-medium">{student.department?.name} ({student.department?.code})</td>
                    <td className="p-4 text-slate-400 font-medium">{new Date(student.admissionDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`inline-block font-extrabold text-[9px] px-2 py-0.5 rounded ${
                        student.user?.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {student.user?.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(student.id, student.user?.status || 'ACTIVE')}
                        className="py-1 px-2.5 border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700 rounded-lg transition"
                      >
                        Toggle Lock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-slate-800 text-lg">🎓 Register New Student Account</h3>
            
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <h4 className="text-[10px] font-bold text-primary-600 uppercase tracking-widest border-b border-slate-100 pb-1">Auth Credentials</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="e.g. jdoe"
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="jdoe@campus.edu"
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Password</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  />
                </div>
              </div>

              <h4 className="text-[10px] font-bold text-primary-600 uppercase tracking-widest border-b border-slate-100 pb-1 pt-2">Personal Profiles</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Roll Number</label>
                  <input
                    type="text"
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                    required
                    placeholder="e.g. ROLL-001"
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Department</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admission Date</label>
                <input
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-semibold text-slate-700 transition"
                />
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
                  {submitting ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
