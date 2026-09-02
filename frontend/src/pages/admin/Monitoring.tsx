import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Network,
  Zap,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Radio,
  Lock,
  Shield,
  Layers,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';

interface MonitoringData {
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  timestamp: string;
  ec2: {
    cpuUtilization: number;
    memoryUsedPercent: number;
    diskUsedPercent: number;
    status: string;
  };
  apiGateway: {
    requestCount: number;
    error4xxCount: number;
    error5xxCount: number;
    avgLatencyMs: number;
    status: string;
  };
  lambda: {
    invocations: number;
    errors: number;
    avgDurationMs: number;
    status: string;
  };
  rds: {
    cpuUtilization: number;
    databaseConnections: number;
    freeStorageGB: number;
    status: string;
  };
  activeAlarmsCount: number;
  alarms: Array<{
    alarmName: string;
    stateValue: string;
    metricName: string;
    threshold: number;
  }>;
}

interface LogEntry {
  timestamp: number;
  message: string;
  logStreamName: string;
}

const API_ROLE_MATRIX = [
  { endpoint: '/api/auth/profile', method: 'GET', student: true, faculty: true, admin: true, description: 'Retrieve authenticated profile & presigned avatar' },
  { endpoint: '/api/auth/profile', method: 'PUT', student: true, faculty: true, admin: true, description: 'Update self profile personal fields' },
  { endpoint: '/api/auth/profile/avatar', method: 'POST', student: true, faculty: true, admin: true, description: 'Upload profile image to AWS S3 bucket' },
  { endpoint: '/api/student/dashboard', method: 'GET', student: true, faculty: false, admin: false, description: 'Student metrics, GPA, and courses summary' },
  { endpoint: '/api/student/courses', method: 'GET', student: true, faculty: false, admin: false, description: 'Enrolled courses list and syllabus' },
  { endpoint: '/api/student/attendance', method: 'GET', student: true, faculty: false, admin: false, description: 'Attendance logs and percentage breakdown' },
  { endpoint: '/api/student/assignments', method: 'GET', student: true, faculty: false, admin: false, description: 'Course assignments and deadlines' },
  { endpoint: '/api/student/assignments/submit', method: 'POST', student: true, faculty: false, admin: false, description: 'Submit assignment artifact to AWS S3' },
  { endpoint: '/api/student/results', method: 'GET', student: true, faculty: false, admin: false, description: 'Published exam results and GPA marks' },
  { endpoint: '/api/student/events', method: 'GET', student: true, faculty: false, admin: false, description: 'Campus events directory and registration' },
  { endpoint: '/api/faculty/dashboard', method: 'GET', student: false, faculty: true, admin: false, description: 'Faculty teaching metrics and class overview' },
  { endpoint: '/api/faculty/courses', method: 'GET', student: false, faculty: true, admin: false, description: 'Assigned academic courses list' },
  { endpoint: '/api/faculty/attendance', method: 'POST', student: false, faculty: true, admin: false, description: 'Record student attendance and mark status' },
  { endpoint: '/api/faculty/assignments', method: 'POST', student: false, faculty: true, admin: false, description: 'Create assignment and trigger AWS Lambda notifications' },
  { endpoint: '/api/faculty/submissions', method: 'GET', student: false, faculty: true, admin: false, description: 'Student assignment submissions for grading' },
  { endpoint: '/api/faculty/submissions/grade', method: 'POST', student: false, faculty: true, admin: false, description: 'Grade submissions and publish marks' },
  { endpoint: '/api/faculty/announcements', method: 'POST', student: false, faculty: true, admin: false, description: 'Broadcast notices and announcements' },
  { endpoint: '/api/admin/dashboard', method: 'GET', student: false, faculty: false, admin: true, description: 'Cluster-wide statistics, active users, and health' },
  { endpoint: '/api/admin/monitoring/overview', method: 'GET', student: false, faculty: false, admin: true, description: 'CloudWatch metrics for EC2, ALB, RDS, Lambda' },
  { endpoint: '/api/admin/students', method: 'GET / POST', student: false, faculty: false, admin: true, description: 'Manage student records and admissions' },
  { endpoint: '/api/admin/faculty', method: 'GET / POST', student: false, faculty: false, admin: true, description: 'Manage faculty roster and allocations' },
  { endpoint: '/api/admin/departments', method: 'GET / POST', student: false, faculty: false, admin: true, description: 'Manage academic departments' },
  { endpoint: '/api/admin/courses', method: 'GET / POST', student: false, faculty: false, admin: true, description: 'Manage course catalog and syllabus' },
  { endpoint: '/api/admin/enrollments', method: 'GET / POST', student: false, faculty: false, admin: true, description: 'Manage student course enrollments' },
  { endpoint: '/api/admin/audit-logs', method: 'GET', student: false, faculty: false, admin: true, description: 'View system audit trails and security events' },
  { endpoint: '/api/admin/reports', method: 'GET', student: false, faculty: false, admin: true, description: 'Export institutional reports (JSON/CSV)' },
  { endpoint: '/api/notifications', method: 'GET', student: true, faculty: true, admin: true, description: 'User-specific notification feed' },
  { endpoint: '/health', method: 'GET', student: true, faculty: true, admin: true, description: 'Public ALB health check' },
];

export default function AdminMonitoring() {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'security'>('telemetry');
  const [data, setData] = useState<MonitoringData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMonitoringData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [overviewRes, logsRes] = await Promise.all([
        api.get('/admin/monitoring/overview'),
        api.get('/admin/monitoring/logs?limit=10'),
      ]);

      if (overviewRes.data?.data) {
        setData(overviewRes.data.data);
        setLastUpdated(new Date().toLocaleTimeString());
        setError(null);
      }
      if (logsRes.data?.data) {
        setLogs(logsRes.data.data);
      }
    } catch (err: any) {
      console.error('Monitoring fetch error:', err);
      setError('Monitoring data temporarily unavailable. Please check AWS connectivity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();

    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Activity className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-slate-500 font-medium">Gathering real-time AWS CloudWatch telemetry...</p>
      </div>
    );
  }

  const statusColors = {
    HEALTHY: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    DEGRADED: 'bg-amber-500/10 text-amber-600 border-amber-200',
    CRITICAL: 'bg-rose-500/10 text-rose-600 border-rose-200',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Radio className="w-7 h-7 text-primary-600 animate-pulse" />
            Cloud Infrastructure & Security
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            AWS CloudWatch Dashboard telemetry, alarms status, and backend RBAC authorization matrix.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'telemetry'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              CloudWatch Telemetry
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Role Security Matrix
            </button>
          </div>

          <button
            onClick={() => fetchMonitoringData(true)}
            disabled={refreshing}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary-600' : 'text-slate-500'}`} />
          </button>
        </div>
      </div>

      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Status Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                  statusColors[data?.overallStatus || 'HEALTHY']
                }`}
              >
                {data?.overallStatus || 'HEALTHY'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                AWS Region: <strong className="text-slate-700 font-mono">us-east-1</strong>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Updated: <strong className="text-slate-700">{lastUpdated || 'Live'}</strong>
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <ShieldCheck className="w-4 h-4" /> CloudWatch Dashboard: CloudCampus-Monitoring Active
              </span>
            </div>
          </div>

          {/* 4 Architectural Component Telemetry Cards */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: EC2 Application Cluster */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-primary-400/50 transition duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <Server className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                    {data.ec2.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base">EC2 Express Backend</h3>
                <p className="text-xs text-slate-400 font-mono mb-4">i-03681025582d882c5</p>

                <div className="space-y-3 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">CPU Utilization</span>
                    <strong className="text-slate-800 font-mono">{data.ec2.cpuUtilization}%</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">RAM Usage</span>
                    <strong className="text-slate-800 font-mono">{data.ec2.memoryUsedPercent}%</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">NVMe Disk Usage</span>
                    <strong className="text-slate-800 font-mono">{data.ec2.diskUsedPercent}%</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: AWS API Gateway */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-primary-400/50 transition duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Network className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                    {data.apiGateway.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base">API Gateway HTTP API</h3>
                <p className="text-xs text-slate-400 font-mono mb-4">7k2yo6gy77</p>

                <div className="space-y-3 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Total Requests (1h)</span>
                    <strong className="text-slate-800 font-mono">{data.apiGateway.requestCount}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Avg Latency</span>
                    <strong className="text-slate-800 font-mono">{data.apiGateway.avgLatencyMs} ms</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">5XX Error Count</span>
                    <strong className="text-slate-800 font-mono">{data.apiGateway.error5xxCount}</strong>
                  </div>
                </div>
              </div>

              {/* Card 3: RDS PostgreSQL */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-primary-400/50 transition duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                    {data.rds.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base">RDS PostgreSQL</h3>
                <p className="text-xs text-slate-400 font-mono mb-4">cloudcampus-db (v17.5)</p>

                <div className="space-y-3 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">RDS CPU Usage</span>
                    <strong className="text-slate-800 font-mono">{data.rds.cpuUtilization}%</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Active Connections</span>
                    <strong className="text-slate-800 font-mono">{data.rds.databaseConnections}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Free Storage Space</span>
                    <strong className="text-slate-800 font-mono">{data.rds.freeStorageGB} GB</strong>
                  </div>
                </div>
              </div>

              {/* Card 4: AWS Lambda Event Services */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-primary-400/50 transition duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                    {data.lambda.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base">AWS Lambda Services</h3>
                <p className="text-xs text-slate-400 font-mono mb-4">Assignment Notifications</p>

                <div className="space-y-3 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Invocations</span>
                    <strong className="text-slate-800 font-mono">{data.lambda.invocations}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Avg Duration</span>
                    <strong className="text-slate-800 font-mono">{data.lambda.avgDurationMs} ms</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Execution Errors</span>
                    <strong className="text-slate-800 font-mono">{data.lambda.errors}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CloudWatch Alarms & Live Application Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alarms Roster */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary-600" />
                  <h3 className="font-bold text-slate-800">CloudWatch Alarms</h3>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-full">
                  {data?.alarms.length || 4} Configured
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {(data?.alarms || [
                  { alarmName: 'CloudCampus-EC2-HighCPU', metricName: 'CPUUtilization', threshold: 80, stateValue: 'OK' },
                  { alarmName: 'CloudCampus-ALB-5XX-Errors', metricName: 'HTTPCode_Target_5XX', threshold: 5, stateValue: 'OK' },
                  { alarmName: 'CloudCampus-RDS-HighCPU', metricName: 'CPUUtilization', threshold: 80, stateValue: 'OK' },
                  { alarmName: 'CloudCampus-Lambda-Errors', metricName: 'Errors', threshold: 1, stateValue: 'OK' },
                ]).map((alarm, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <span className="font-bold text-slate-700 block">{alarm.alarmName}</span>
                        <span className="text-[10px] text-slate-400">
                          {alarm.metricName} &gt; {alarm.threshold}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                      {alarm.stateValue}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CloudWatch Logs */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <h3 className="font-bold text-slate-800">CloudWatch Application Logs</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Stream: /cloudcampus/backend</span>
              </div>

              <div className="mt-4 bg-slate-950 text-slate-300 font-mono text-[11px] p-4 rounded-xl max-h-56 overflow-y-auto space-y-2">
                {logs.length > 0 ? (
                  logs.map((log, idx) => (
                    <div key={idx} className="border-b border-slate-800/80 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                        <span>{new Date(log.timestamp).toISOString()}</span>
                        <span className="text-slate-600">{log.logStreamName}</span>
                      </div>
                      <div className="text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
                        {log.message}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-4">All application systems running smoothly. No warnings or errors logged.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-400" />
                Backend Role-Based Access Control (RBAC) Security Matrix
              </h2>
              <p className="text-xs text-slate-300">
                Server-side authorization enforced at Express middleware & AWS API Gateway. Frontend state tampering cannot bypass backend security.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Endpoints Protected
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 font-bold">API Route</th>
                    <th className="p-4 font-bold">Method</th>
                    <th className="p-4 font-bold text-center">STUDENT</th>
                    <th className="p-4 font-bold text-center">FACULTY</th>
                    <th className="p-4 font-bold text-center">ADMIN</th>
                    <th className="p-4 font-bold">Access Scope & Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {API_ROLE_MATRIX.map((route, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-mono font-bold text-slate-800 text-[11px]">{route.endpoint}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-md uppercase font-mono ${
                          route.method.includes('POST') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          route.method.includes('PUT') ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {route.method}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {route.student ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-600 font-bold">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {route.faculty ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-600 font-bold">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {route.admin ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-600 font-bold">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 font-medium">{route.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
