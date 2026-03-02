import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface MetricsSummary {
  totalRequests: number;
  avgResponseTime: number;
  errorCount: number;
  errorRate: number;
  requestsPerMinute: number;
}

interface HourlyData {
  hour: string;
  requests: number;
  errors: number;
  avgResponseTime: number;
}

interface EndpointData {
  method: string;
  path: string;
  count: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  errors: number;
}

const TIME_RANGES = [
  { label: '1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '7d', hours: 168 },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
};

export default function DeveloperMetrics() {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [hourly, setHourly] = useState<HourlyData[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointData[]>([]);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ hours: String(hours) });

    Promise.all([
      fetch(`/api/developer/metrics?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`/api/developer/metrics/endpoints?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([metricsRes, endpointsRes]) => {
        if (metricsRes.success) {
          setSummary(metricsRes.data.summary);
          setHourly(metricsRes.data.hourly);
        }
        if (endpointsRes.success) {
          setEndpoints(endpointsRes.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hours, token]);

  const formatHour = (iso: any) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">API Metrics</h1>
        <div className="flex gap-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.hours}
              onClick={() => setHours(r.hours)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                hours === r.hours
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {loading ? '--' : summary?.totalRequests.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Avg Response Time</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {loading ? '--' : `${summary?.avgResponseTime}ms`}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Error Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {loading ? '--' : `${summary?.errorRate}%`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {summary ? `${summary.errorCount} errors` : ''}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase">Req/min</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {loading ? '--' : summary?.requestsPerMinute}
          </p>
        </div>
      </div>

      {/* Charts */}
      {!loading && hourly.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Requests Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={hourly}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={formatHour} fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip labelFormatter={formatHour} />
                <Area type="monotone" dataKey="requests" stroke="#ea580c" fill="url(#reqGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Avg Response Time (ms)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={formatHour} fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip labelFormatter={formatHour} />
                <Bar dataKey="avgResponseTime" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Endpoints table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Top Endpoints</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">Method</th>
              <th className="px-6 py-3 text-left">Path</th>
              <th className="px-6 py-3 text-right">Requests</th>
              <th className="px-6 py-3 text-right">Avg (ms)</th>
              <th className="px-6 py-3 text-right">P95 (ms)</th>
              <th className="px-6 py-3 text-right">Errors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : endpoints.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No data yet.</td>
              </tr>
            ) : (
              endpoints.map((ep, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${METHOD_COLORS[ep.method] || 'bg-gray-100 text-gray-700'}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-700 font-mono text-xs">{ep.path}</td>
                  <td className="px-6 py-3 text-right text-gray-900">{ep.count.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-gray-700">{ep.avgResponseTime}</td>
                  <td className="px-6 py-3 text-right text-gray-700">{ep.p95ResponseTime}</td>
                  <td className="px-6 py-3 text-right">
                    {ep.errors > 0 ? (
                      <span className="text-red-600 font-medium">{ep.errors}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
