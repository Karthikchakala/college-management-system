import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { GraduationCap, ShieldAlert } from 'lucide-react';
import { Faculty } from '../../types';

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await api.get('/admin/reports/faculty'); // Fetch via reports or normal routes
        if (res.data) {
          // Parse CSV or load via standard route if available. Let's load via standard admin route first:
          const normalRes = await api.get('/admin/faculty');
          if (normalRes.data.success) {
            setFaculty(normalRes.data.data);
          }
        }
      } catch (err) {
        console.error('Failed to load faculty', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
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
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Faculty Directory</h1>
        <p className="text-sm text-slate-500 font-medium">Verify employee profiles, professional ranks, and department assignments.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {faculty.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">No faculty registered in the system database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 font-semibold">Faculty Name</th>
                  <th className="p-4 font-semibold">Employee ID</th>
                  <th className="p-4 font-semibold">Designation</th>
                  <th className="p-4 font-semibold">Department</th>
                  <th className="p-4 font-semibold">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {faculty.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-800">{f.firstName} {f.lastName}</td>
                    <td className="p-4 font-semibold text-slate-500">{f.employeeId}</td>
                    <td className="p-4 font-semibold text-primary-600">{f.designation}</td>
                    <td className="p-4 font-medium">{f.department?.name}</td>
                    <td className="p-4 text-slate-400 font-medium">{f.user?.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
