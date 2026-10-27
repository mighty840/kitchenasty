import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { translateStatus } from '../i18n/index.js';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext.js';
import { PaymentBadge, type OrderPayment } from '../components/PaymentBadge.js';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  surchargeAmount: number;
  subtotal: number;
  comment: string | null;
  options: { id: string; name: string; value: string; priceModifier: number }[];
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  comment: string | null;
  scheduledAt: string | null;
  createdAt: string;
  customer: { id: string; name: string; email: string; phone: string | null } | null;
  location: { id: string; name: string };
  items: OrderItem[];
  payments?: OrderPayment[];
}

const STATUSES = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'PICKED_UP', 'CANCELLED',
];

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

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    fetch(`/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t('messages.failed_to_load_order'));
        return res.json();
      })
      .then((data) => setOrder(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token, t]);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" role="status" aria-label={t('pages.order_detail.loading')} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error || 'Order not found'}</div>
        <Link to="/orders" className="text-primary-600 hover:text-primary-700 text-sm">

          {t('pages.order_detail.back_to_orders')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/orders" className="text-gray-400 hover:text-gray-600" aria-label={t('pages.order_detail.back_to_orders_f02399')}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.order_detail.order')} {order.orderNumber}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <span className="ml-auto flex items-center gap-2">
          <PaymentBadge payments={order.payments} className="!text-sm !px-3 !py-1" />
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
            {translateStatus(t, order.status)}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.order_detail.items')}</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="font-medium text-gray-900">
                      <span className="text-gray-400 mr-1">{item.quantity}{t('pages.order_detail.x')}</span>
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500">{t('pricing.taxRate')}: {item.taxRate}</div>
                    {item.surchargeAmount > 0 && (
                      <div className="text-xs text-gray-500">{t('pricing.surcharge')}: {format(item.surchargeAmount)} / {t('pricing.unit')}</div>
                    )}
                    {item.options.length > 0 && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.options.map((o) => `${o.name}: ${o.value}`).join(', ')}
                      </div>
                    )}
                    {item.comment && (
                      <div className="text-xs text-gray-400 mt-0.5 italic">{t('pages.order_detail.note')} {item.comment}</div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">{format(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('pages.order_detail.subtotal')}</span>
                <span>{format(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('pages.order_detail.tax')}</span>
                <span>{format(order.tax)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('pages.order_detail.delivery_fee')}</span>
                  <span>{format(order.deliveryFee)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('pages.order_detail.discount')}</span>
                  <span>-{format(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>{t('pages.order_detail.total')}</span>
                <span className="text-primary-600">{format(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.comment && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('pages.order_detail.order_notes')}</h2>
              <p className="text-gray-600 text-sm">{order.comment}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status update */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.order_detail.update_status')}</h2>
            <div className="space-y-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  disabled={updating || order.status === status}
                  onClick={() => updateStatus(status)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${order.status === status
                      ? STATUS_COLORS[status] + ' cursor-default'
                      : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                    }`}
                  aria-label={t('common.setStatusTo', { status: translateStatus(t, status) })}
                >
                  {translateStatus(t, status)}
                </button>
              ))}
            </div>
          </div>

          {/* Payments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.order_detail.payment')}</h2>
            {order.payments && order.payments.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-medium text-gray-900">{p.method}</span>
                      <span className="block text-xs text-gray-400">{format(p.amount)}</span>
                      {p.transactionId && <span className="block text-xs text-gray-400 break-all">{p.transactionId}</span>}
                    </div>
                    <PaymentBadge payments={[p]} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">{t('pages.order_detail.payment_none')}</p>
            )}
          </div>

          {/* Order info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('pages.order_detail.details')}</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">{t('pages.order_detail.order_type')}</dt>
                <dd className="font-medium text-gray-900">{order.orderType}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('pages.order_detail.location')}</dt>
                <dd className="font-medium text-gray-900">{order.location.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('pages.order_detail.customer')}</dt>
                <dd className="font-medium text-gray-900">
                  {order.customer ? (
                    <>
                      {order.customer.name}
                      <span className="block text-xs text-gray-400">{order.customer.email}</span>
                      {order.customer.phone && (
                        <span className="block text-xs text-gray-400">{order.customer.phone}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">{t('pages.order_detail.guest')}</span>
                  )}
                </dd>
              </div>
              {order.scheduledAt && (
                <div>
                  <dt className="text-gray-500">{t('pages.order_detail.scheduled_for')}</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(order.scheduledAt).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
