import { useEffect, useState } from 'react';

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';

interface AnalyticsData {
  summary: {
    totalReservations: number;
    totalGuests: number;
    avgPartySize: number;
    completionRate: number;
    rangeStart: string;
    rangeEnd: string;
  };
  dailyBookings: { date: string; reservations: number; guests: number }[];
  dayOfWeekDistribution: { dow: number; reservations: number; guests: number }[];
  partySizeDistribution: { partySize: number; count: number }[];
  statusDistribution: { status: string; count: number }[];
  hourlyDistribution: { hour: number; reservations: number }[];
  leadTimeBuckets: { bucket: string; count: number }[];
}

interface Location {
  id: string;
  name: string;
}

const CHART_COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#7c3aed', '#2563eb', '#059669'];

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#2563eb',
  SEATED: '#7c3aed',
  COMPLETED: '#059669',
  CANCELLED: '#dc2626',
};

const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const LEAD_TIME_LABELS: Record<string, string> = {
  'same-day': 'leadTime.sameDay',
  '1-2d': 'leadTime.oneToTwoDays',
  '3-7d': 'leadTime.threeToSevenDays',
  '8-14d': 'leadTime.oneToTwoWeeks',
  '15d+': 'leadTime.twoPlusWeeks',
};

export default function ReservationTrends() {
  const { t } = useTranslation();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [locationId, setLocationId] = useState<string>('');

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    fetch('/api/locations', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setLocations(result.data.map((l: Location) => ({ id: l.id, name: l.name })));
        }
      })
      .catch(() => { });
  }, [token]);

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ days: String(days) });
    if (locationId) params.set('locationId', locationId);
    fetch(`/api/reservations/analytics?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t('messages.failed_to_load_analytics'));
        return res.json();
      })
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, days, locationId, t]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">{t('pages.reservation_trends.reservation_trends')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('pages.reservation_trends.booking_patterns_peak_days_and_guest_distribution')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {locations.length > 1 && (
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
              aria-label={t('pages.reservation_trends.filter_by_location')}
            >
              <option value="">{t('pages.reservation_trends.all_locations')}</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[7, 14, 30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${days === d ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                aria-label={t('a11y.showDayWindow', { count: d })}
              >
                {d}{t('pages.reservation_trends.d')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" role="status" aria-label={t('pages.reservation_trends.loading')} />
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard label="Reservations" value={data.summary.totalReservations.toLocaleString()} />
            <SummaryCard label="Guests" value={data.summary.totalGuests.toLocaleString()} />
            <SummaryCard label="Avg party size" value={data.summary.avgPartySize.toFixed(1)} />
            <SummaryCard label="Completion rate" value={`${(data.summary.completionRate * 100).toFixed(0)}%`} />
          </div>

          {/* Daily bookings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.reservation_trends.daily_bookings')}</h3>
            {data.dailyBookings.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.dailyBookings.map((d) => ({ ...d, label: formatDate(d.date) }))}>
                  <defs>
                    <linearGradient id="reservationsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="guestsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend />
                  <Area type="monotone" dataKey="reservations" stroke="#ea580c" fill="url(#reservationsGradient)" strokeWidth={2} name="Reservations" />
                  <Area type="monotone" dataKey="guests" stroke="#7c3aed" fill="url(#guestsGradient)" strokeWidth={2} name="Guests" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Day of week */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.reservation_trends.peak_days')}</h3>
              {data.dayOfWeekDistribution.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={Array.from({ length: 7 }, (_, i) => {
                      const found = data.dayOfWeekDistribution.find((d) => d.dow === i);
                      return { day: t(`days.short.${DOW_KEYS[i]}`), reservations: found?.reservations ?? 0, guests: found?.guests ?? 0 };
                    })}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Legend />
                    <Bar dataKey="reservations" fill="#ea580c" radius={[4, 4, 0, 0]} name="Reservations" />
                    <Bar dataKey="guests" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Guests" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Party size */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.reservation_trends.party_sizes')}</h3>
              {data.partySizeDistribution.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.partySizeDistribution.map((d) => ({ label: `${d.partySize}`, count: d.count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                      formatter={(value) => [value, 'Reservations']}
                      labelFormatter={(label) => `Party of ${label}`}
                    />
                    <Bar dataKey="count" fill="#fb923c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.reservation_trends.status_breakdown')}</h3>
              {data.statusDistribution.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.statusDistribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value }) => `${name} (${value})`}
                      labelLine={false}
                    >
                      {data.statusDistribution.map((d, i) => (
                        <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Lead time */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.reservation_trends.booking_lead_time')}</h3>
              <p className="text-xs text-gray-500 mb-3">{t('pages.reservation_trends.how_far_in_advance_guests_book')}</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.leadTimeBuckets.map((b) => ({
                    label: LEAD_TIME_LABELS[b.bucket] ? t(LEAD_TIME_LABELS[b.bucket]) : b.bucket,
                    count: b.count,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.reservation_trends.reservations_by_hour')}</h3>
            {data.hourlyDistribution.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={Array.from({ length: 24 }, (_, i) => {
                    const found = data.hourlyDistribution.find((h) => h.hour === i);
                    return { hour: i, label: formatHour(i), reservations: found?.reservations ?? 0 };
                  })}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="reservations" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return <p className="text-gray-500 text-sm py-8 text-center">{t('pages.reservation_trends.no_reservations_in_this_window')}</p>;
}
