import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
  user?: {
    username: string;
    role: string;
  };
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/audit-logs');
        if (res.data.success) {
          const logList = Array.isArray(res.data.data)
            ? res.data.data
            : (res.data.data?.logs || []);
          setLogs(logList);
        }
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
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
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Audit Trails</h1>
        <p className="text-sm text-slate-500 font-medium">Verify system actions, metadata logs, and user login sources.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">No actions logged in the system audit database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Action</th>
                  <th className="p-4 font-semibold">Details</th>
                  <th className="p-4 font-semibold">IP Address</th>
                  <th className="p-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition text-slate-700">
                    <td className="p-4 font-bold text-slate-800">
                      {log.user?.username} <span className="text-[9px] font-bold text-slate-400">({log.user?.role})</span>
                    </td>
                    <td className="p-4 font-bold text-primary-600 uppercase tracking-wide">{log.action}</td>
                    <td className="p-4 font-medium text-slate-500">{log.details}</td>
                    <td className="p-4 text-slate-400 font-mono font-medium">{log.ipAddress || '—'}</td>
                    <td className="p-4 text-slate-400 font-medium">{new Date(log.createdAt).toLocaleString()}</td>
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
