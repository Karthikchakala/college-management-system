import React, { useState } from 'react';
import api from '../../services/api';
import { FileSpreadsheet, Download, ShieldAlert, FileText } from 'lucide-react';

export default function AdminReports() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (reportType: string, path: string) => {
    setDownloading(reportType);
    try {
      // Axios call with responseType: blob is critical for downloading files via AJAX!
      const res = await api.get(path, { responseType: 'blob' });
      
      // Create local URL for download trigger
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report', err);
      alert('Error: Failed to compile report from database.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Database Auditing & Reports</h1>
        <p className="text-sm text-slate-500 font-medium">Export system tables and operational audit trails to CSV files.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core Roster Reports */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Academic Rosters
          </h3>
          <p className="text-xs text-slate-400 font-medium">Download complete student/faculty accounts mapping data.</p>
          
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/40">
              <div>
                <p className="text-xs font-bold text-slate-800">Students Enrollment Report</p>
                <p className="text-[10px] text-slate-400 font-semibold">Lists admission dates, departments, and user statuses</p>
              </div>
              <button
                disabled={downloading !== null}
                onClick={() => handleDownload('students_roster', '/admin/reports/students')}
                className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                {downloading === 'students_roster' ? 'Compiling...' : 'Export'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/40">
              <div>
                <p className="text-xs font-bold text-slate-800">Faculty Members Report</p>
                <p className="text-[10px] text-slate-400 font-semibold">Lists designations, employee IDs, and joining records</p>
              </div>
              <button
                disabled={downloading !== null}
                onClick={() => handleDownload('faculty_roster', '/admin/reports/faculty')}
                className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                {downloading === 'faculty_roster' ? 'Compiling...' : 'Export'}
              </button>
            </div>
          </div>
        </div>

        {/* Operational logs Reports */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" /> Activity Logs & Logs
          </h3>
          <p className="text-xs text-slate-400 font-medium">Download campus operations data and administrator audit trails.</p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/40">
              <div>
                <p className="text-xs font-bold text-slate-800">Class Attendance Audit Logs</p>
                <p className="text-[10px] text-slate-400 font-semibold">Track daily lectures, check-in statuses, and teacher comments</p>
              </div>
              <button
                disabled={downloading !== null}
                onClick={() => handleDownload('attendance_log', '/admin/reports/attendance')}
                className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                {downloading === 'attendance_log' ? 'Compiling...' : 'Export'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/40">
              <div>
                <p className="text-xs font-bold text-slate-800">System Audit Trail Logs</p>
                <p className="text-[10px] text-slate-400 font-semibold">Logs actions, user IPs, methods, and targets</p>
              </div>
              <button
                disabled={downloading !== null}
                onClick={() => handleDownload('system_audit_logs', '/admin/reports/logs')}
                className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                {downloading === 'system_audit_logs' ? 'Compiling...' : 'Export'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
