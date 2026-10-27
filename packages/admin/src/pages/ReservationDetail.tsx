import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { translateStatus } from '../i18n/index.js';
import { useTranslation } from 'react-i18next';

interface Table {
  id: string;
  name: string;
  capacity: number;
}

interface ReservationData {
  id: string;
  date: string;
  time: string;
  partySize: number;
  status: string;
  comment: string | null;
  customer: { id: string; name: string; email: string; phone: string | null };
  location: { id: string; name: string };
  table: Table | null;
}

const STATUSES = ['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED'];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SEATED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-200 text-green-900',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function ReservationDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    fetch(`/api/reservations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t('messages.failed_to_load_reservation'));
        return res.json();
      })
      .then((data) => {
        setReservation(data.data);
        // Fetch tables for the location
        return fetch(`/api/locations/${data.data.location.id}/tables`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => res.json())
      .then((data) => setTables(data.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token, t]);

  async function updateReservation(updates: Record<string, unknown>) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReservation(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" role="status" aria-label={t('pages.reservation_detail.loading')} />
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error || 'Reservation not found'}</div>
        <Link to="/reservations" className="text-primary-600 hover:text-primary-700 text-sm">

          {t('pages.reservation_detail.back_to_reservations')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/reservations" className="text-gray-400 hover:text-gray-600" aria-label={t('pages.reservation_detail.back_to_reservations_443bd0')}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.reservation_detail.reservation_details')}</h1>
          <p className="text-sm text-gray-500">
            {new Date(reservation.date).toLocaleDateString()}  {t('pages.reservation_detail.at')} {reservation.time}
          </p>
        </div>
        <span className={`ml-auto text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[reservation.status] || 'bg-gray-100'}`}>
          {translateStatus(t, reservation.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guest Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.reservation_detail.guest_information')}</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">{t('pages.reservation_detail.name')}</dt>
                <dd className="font-medium text-gray-900">{reservation.customer.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('pages.reservation_detail.email')}</dt>
                <dd className="font-medium text-gray-900">{reservation.customer.email}</dd>
              </div>
              {reservation.customer.phone && (
                <div>
                  <dt className="text-gray-500">{t('pages.reservation_detail.phone')}</dt>
                  <dd className="font-medium text-gray-900">{reservation.customer.phone}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">{t('pages.reservation_detail.party_size')}</dt>
                <dd className="font-medium text-gray-900">{reservation.partySize}  {t('pages.reservation_detail.guests')}</dd>
              </div>
            </dl>
          </div>

          {/* Reservation Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.reservation_detail.details')}</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">{t('pages.reservation_detail.date')}</dt>
                <dd className="font-medium text-gray-900">{new Date(reservation.date).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('pages.reservation_detail.time')}</dt>
                <dd className="font-medium text-gray-900">{reservation.time}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('pages.reservation_detail.location')}</dt>
                <dd className="font-medium text-gray-900">{reservation.location.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('pages.reservation_detail.table')}</dt>
                <dd className="font-medium text-gray-900">
                  {reservation.table ? `${reservation.table.name} (seats ${reservation.table.capacity})` : t('pages.reservation_detail.unassigned')}
                </dd>
              </div>
            </dl>
            {reservation.comment && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{t('pages.reservation_detail.special_requests')}</p>
                <p className="text-sm text-gray-700">{reservation.comment}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.reservation_detail.update_status')}</h2>
            <div className="space-y-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  disabled={updating || reservation.status === status}
                  onClick={() => updateReservation({ status })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${reservation.status === status
                      ? STATUS_COLORS[status] + ' cursor-default'
                      : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                    }`}
                  aria-label={t('common.setReservationStatus', {
                    status: translateStatus(t, status),
                    name: reservation.customer.name,
                  })}
                >
                  {translateStatus(t, status)}
                </button>
              ))}
            </div>
          </div>

          {/* Table Assignment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.reservation_detail.assign_table')}</h2>
            <select
              value={reservation.table?.id || ''}
              onChange={(e) => updateReservation({ tableId: e.target.value || null })}
              disabled={updating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              aria-label={t('pages.reservation_detail.assign_table_2c1a25')}
            >
              <option value="">{t('pages.reservation_detail.no_table_assigned')}</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}  {t('pages.reservation_detail.seats')} {table.capacity})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
