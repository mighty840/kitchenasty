import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { translateStatus } from '../i18n/index.js';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext.js';
import { PaymentBadge, type OrderPayment } from '../components/PaymentBadge.js';

interface Order {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  payments?: OrderPayment[];
  subtotal: number;
  total: number;
  createdAt: string;
  scheduledAt: string | null;
  customer: { id: string; name: string; email: string } | null;
  location: { id: string; name: string };
  _count: { items: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-purple-100 text-purple-800',
  READY: 'bg-green-100 text-green-800',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-200 text-green-900',
  PICKED_UP: 'bg-green-200 text-green-900',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function OrderList() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('orderType', typeFilter);

    fetch(`/api/orders?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t('messages.failed_to_load_orders'));
        return res.json();
      })
      .then((data) => {
        setOrders(data.data);
        setPagination(data.pagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, statusFilter, typeFilter, token, t]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('pages.order_list.orders')}</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          aria-label={t('pages.order_list.filter_by_status')}
        >
          <option value="">{t('pages.order_list.all_statuses')}</option>
          <option value="PENDING">{t('pages.order_list.pending')}</option>
          <option value="CONFIRMED">{t('pages.order_list.confirmed')}</option>
          <option value="PREPARING">{t('pages.order_list.preparing')}</option>
          <option value="READY">{t('pages.order_list.ready')}</option>
          <option value="OUT_FOR_DELIVERY">{t('pages.order_list.out_for_delivery')}</option>
          <option value="DELIVERED">{t('pages.order_list.delivered')}</option>
          <option value="PICKED_UP">{t('pages.order_list.picked_up')}</option>
          <option value="CANCELLED">{t('pages.order_list.cancelled')}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          aria-label={t('pages.order_list.filter_by_order_type')}
        >
          <option value="">{t('pages.order_list.all_types')}</option>
          <option value="DELIVERY">{t('pages.order_list.delivery')}</option>
          <option value="PICKUP">{t('pages.order_list.pickup')}</option>
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" role="status" aria-label={t('pages.order_list.loading')} />
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>
      )}

      {!loading && !error && orders.length === 0 && (
        <p className="text-gray-500 text-center py-12">{t('pages.order_list.no_orders_found')}</p>
      )}

      {!loading && orders.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('pages.order_list.order')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('pages.order_list.customer')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('pages.order_list.type')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('pages.order_list.status')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('pages.order_detail.payment')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('pages.order_list.items')}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">{t('pages.order_list.total')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('pages.order_list.date')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('pages.order_list.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      {order.orderNumber}
                      {order.scheduledAt && (
                        <span className="ml-1.5 inline-flex items-center text-indigo-600" title={t('a11y.scheduled', { date: new Date(order.scheduledAt).toLocaleString() })} aria-label={t('a11y.scheduled', { date: new Date(order.scheduledAt).toLocaleString() })}>
                          &#128339;
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.customer ? order.customer.name : <span className="text-gray-400">{t('pages.order_list.guest')}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.orderType === 'DELIVERY' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                        {order.orderType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {translateStatus(t, order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge payments={order.payments} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order._count.items}</td>
                    <td className="px-4 py-3 text-right font-medium">{format(order.total)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                      >

                        {t('pages.order_list.view')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >

                {t('pages.order_list.previous')}
              </button>
              <span className="text-sm text-gray-600">

                {t('pages.order_list.page')} {pagination.page}  {t('pages.order_list.of')} {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >

                {t('pages.order_list.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
