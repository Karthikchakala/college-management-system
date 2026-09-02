import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, Shield, Search, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  timestamp?: string;
  createdAt?: string;
  user?: {
    email: string;
    role: string;
    name?: string;
  };
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchLogs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/admin/audit-logs', {
        params: { search, limit: 50 }
      });
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Audit Trails</h1>
          <p className="text-sm text-slate-500 font-medium">Real-time AWS RDS immutable audit trail of campus actions and security events.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by action or entity..."
              className="pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-56"
            />
          </div>

          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
            title="Refresh logs from RDS"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary-600' : 'text-slate-500'}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 font-medium space-y-1">
            <p className="text-sm">📭 No audit logs matching criteria.</p>
            <p className="text-[11px] text-slate-400">Perform actions as Faculty, Student, or Admin to generate real-time audit records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 font-bold">User Identity</th>
                  <th className="p-4 font-bold">Action</th>
                  <th className="p-4 font-bold">Target Resource</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => {
                  const timestampStr = log.timestamp || log.createdAt;
                  const dateFormatted = timestampStr ? new Date(timestampStr).toLocaleString() : '—';
                  const userEmail = log.user?.email || log.userId || 'System Service';
                  const userRole = log.user?.role || 'SYSTEM';

                  let badgeColor = 'bg-slate-100 text-slate-700';
                  if (log.action.includes('CREATE') || log.action.includes('SUBMIT')) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
                  if (log.action.includes('UPDATE') || log.action.includes('MARK')) badgeColor = 'bg-sky-50 text-sky-700 border-sky-200/50';
                  if (log.action.includes('DELETE') || log.action.includes('FAIL')) badgeColor = 'bg-red-50 text-red-700 border-red-200/50';
                  if (log.action.includes('LOGIN') || log.action.includes('AUTH')) badgeColor = 'bg-purple-50 text-purple-700 border-purple-200/50';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition text-slate-700">
                      <td className="p-4 font-bold text-slate-800">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 break-all">{userEmail}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{userRole}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wide ${badgeColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-600">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700">{log.resource || 'Entity'}</span>
                          {log.resourceId && (
                            <span className="text-[10px] text-slate-400 font-mono break-all">{log.resourceId}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-emerald-600">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> VERIFIED
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-medium whitespace-nowrap">{dateFormatted}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
