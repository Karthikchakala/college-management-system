import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, FileText, CheckCircle } from 'lucide-react';
import { Result } from '../../types';

export default function StudentResults() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get('/student/results');
        if (res.data.success) {
          setResults(res.data.data);
        }
      } catch (err: any) {
        setError('Failed to fetch exam results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
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
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Academic Results</h1>
        <p className="text-sm text-slate-500 font-medium">View letter grades and comments from your evaluated examinations.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-md">Semester Report Card</h3>
            <p className="text-xs text-slate-400 font-medium">Only published exam results are reflected here.</p>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 font-medium">
            No exam results published for your profile.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Course Code</th>
                  <th className="pb-3 font-semibold">Course Name</th>
                  <th className="pb-3 font-semibold">Examination</th>
                  <th className="pb-3 font-semibold">Marks</th>
                  <th className="pb-3 font-semibold">Grade</th>
                  <th className="pb-3 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map(res => (
                  <tr key={res.id} className="text-slate-700 hover:bg-slate-50/50 transition">
                    <td className="py-4 font-bold text-slate-800">{res.exam?.course?.code}</td>
                    <td className="py-4 font-semibold">{res.exam?.course?.name}</td>
                    <td className="py-4 font-medium text-slate-500">{res.exam?.name}</td>
                    <td className="py-4 font-bold">{res.marksObtained} / {res.exam?.maxMarks}</td>
                    <td className="py-4">
                      <span className="inline-block font-black text-[10px] text-primary-700 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded">
                        {res.grade}
                      </span>
                    </td>
                    <td className="py-4 text-slate-400 italic">{res.remarks || '—'}</td>
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
