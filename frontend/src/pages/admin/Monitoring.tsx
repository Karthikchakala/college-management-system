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

export default function AdminMonitoring() {
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
    }, 30000); // 30 seconds refresh

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

  const statusBadge = {
    HEALTHY: 'bg-emerald-500',
    DEGRADED: 'bg-amber-500',
    CRITICAL: 'bg-rose-500',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
              Live Telemetry & Observability
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">AWS CloudWatch Monitoring</h1>
            <p className="text-slate-400 text-sm mt-1">
              End-to-end metrics across EC2, API Gateway, Lambda, RDS PostgreSQL, and Alarms
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Last updated</p>
              <p className="text-sm font-semibold text-slate-200 flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5 text-primary-400" />
                {lastUpdated || 'Just now'}
              </p>
            </div>

            <button
              onClick={() => fetchMonitoringData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-primary-600/20"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* System Status Hero Card */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Overall Health */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Status</span>
              <span className={`w-3 h-3 rounded-full ${statusBadge[data.overallStatus]} animate-ping`} />
            </div>
            <div className="my-4">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold ${
                  statusColors[data.overallStatus]
                }`}
              >
                {data.overallStatus === 'HEALTHY' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {data.overallStatus === 'DEGRADED' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                {data.overallStatus === 'CRITICAL' && <XCircle className="w-4 h-4 text-rose-600" />}
                {data.overallStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500">Core AWS infrastructure operational</p>
          </div>

          {/* EC2 Health */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>EC2 Server</span>
              <Server className="w-4 h-4 text-primary-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-800">{data.ec2.cpuUtilization}%</div>
              <p className="text-xs text-slate-500 mt-1">CPU Utilization</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Memory</span>
                <span className="font-semibold text-slate-700">{data.ec2.memoryUsedPercent}%</span>
              </div>
              <div>
                <span className="text-slate-400 block">Disk</span>
                <span className="font-semibold text-slate-700">{data.ec2.diskUsedPercent}%</span>
              </div>
            </div>
          </div>

          {/* API Gateway */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>API Gateway</span>
              <Network className="w-4 h-4 text-sky-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-800">{data.apiGateway.avgLatencyMs} ms</div>
              <p className="text-xs text-slate-500 mt-1">Average Latency</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">4XX Errors</span>
                <span className="font-semibold text-slate-700">{data.apiGateway.error4xxCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block">5XX Errors</span>
                <span className="font-semibold text-emerald-600">{data.apiGateway.error5xxCount}</span>
              </div>
            </div>
          </div>

          {/* RDS Database */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>RDS PostgreSQL</span>
              <Database className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-800">{data.rds.cpuUtilization}%</div>
              <p className="text-xs text-slate-500 mt-1">Database CPU</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Connections</span>
                <span className="font-semibold text-slate-700">{data.rds.databaseConnections}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Free Storage</span>
                <span className="font-semibold text-slate-700">{data.rds.freeStorageGB} GB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subsystem Details & Lambda */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lambda Health Function Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">AWS Lambda Function</h3>
                <p className="text-xs text-slate-500">CloudCampus-Health-Function</p>
              </div>
              <span className="ml-auto px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg">
                Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-50 p-4 rounded-xl">
                <span className="text-xs text-slate-500 block">Invocations</span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">{data.lambda.invocations}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <span className="text-xs text-slate-500 block">Errors</span>
                <span className="text-xl font-bold text-emerald-600 mt-1 block">{data.lambda.errors}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <span className="text-xs text-slate-500 block">Avg Duration</span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">{data.lambda.avgDurationMs} ms</span>
              </div>
            </div>
          </div>

          {/* CloudWatch Alarms Roster */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">CloudWatch Alarms</h3>
                <p className="text-xs text-slate-500">Infrastructure Thresholds</p>
              </div>
              <span className="ml-auto px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                {data.alarms.length} Alarms
              </span>
            </div>

            <div className="mt-4 space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {data.alarms.map((alarm, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <span className="font-semibold text-slate-700 block">{alarm.alarmName}</span>
                      <span className="text-slate-400">
                        {alarm.metricName} &gt; {alarm.threshold}%
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-700 font-bold text-[10px]">
                    {alarm.stateValue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CloudWatch Structured Logs Stream */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">CloudWatch Application Logs</h3>
              <p className="text-xs text-slate-500">Log Group: /cloudcampus/backend</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">Stream: pm2-app</span>
        </div>

        <div className="mt-4 bg-slate-950 text-slate-300 font-mono text-xs p-4 rounded-xl max-h-64 overflow-y-auto space-y-2">
          {logs.length > 0 ? (
            logs.map((log, idx) => (
              <div key={idx} className="border-b border-slate-800/80 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                  <span>{new Date(log.timestamp).toISOString()}</span>
                  <span className="text-slate-600">{log.logStreamName}</span>
                </div>
                <div className="text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
                  {log.message}
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-4">No recent log streams available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
