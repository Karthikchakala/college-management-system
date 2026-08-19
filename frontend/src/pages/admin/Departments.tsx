import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Building } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function AdminDepartments() {
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/admin/departments');
        if (res.data.success) setDepts(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepts();
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
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">University Departments</h1>
        <p className="text-sm text-slate-500 font-medium">Verify registered departments and code definitions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {depts.map(d => (
          <div key={d.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">{d.code}</span>
              <h3 className="font-bold text-slate-800 text-sm mt-0.5">{d.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
