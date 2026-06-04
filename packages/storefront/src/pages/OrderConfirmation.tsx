import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext.js';

type Order = {
  id: string;
  orderNumber?: string;
  orderType?: string;
  status?: string;
  subtotal?: number;
  total?: number;
};

const eur = (v: number | undefined) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v ?? 0);

export default function OrderConfirmation() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const [search] = useSearchParams();
  const { clear } = useCart();

  const paid = search.get('paid') === 'true';
  const initial = (location.state?.order as Order | undefined) ?? null;
  const [order, setOrder] = useState<Order | null>(initial);
  const [polls, setPolls] = useState(0);

  // First visit with ?paid=true (Stripe redirected back). Clear the cart
  // — we kept it loaded across the Stripe hop in case the user cancelled.
  useEffect(() => {
    if (paid) clear();
  }, [paid, clear]);

  // Refetch the order from the API if we landed here without state (the
  // Stripe redirect drops it) or if the order is still PENDING — the
  // webhook can take a second or two after success.
  useEffect(() => {
    if (!id) return;
    if (order && order.status === 'CONFIRMED') return;
    if (polls > 10) return;

    let cancelled = false;
    const t = setTimeout(
      async () => {
        try {
          const res = await fetch(`/api/orders/${id}`);
          if (!res.ok) return;
          const data = await res.json();
          if (!cancelled && data?.data) setOrder(data.data as Order);
          setPolls((n) => n + 1);
        } catch {
          /* noop */
        }
      },
      polls === 0 ? 0 : 1500,
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [id, order, polls]);

  const confirmed = order?.status === 'CONFIRMED';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('orderConfirmation.title')}</h1>
      <p className="text-gray-600 mb-2">{t('orderConfirmation.thankYou')}</p>

      {paid && !confirmed && (
        <p className="text-sm text-gray-500 mb-2">Finalising your payment…</p>
      )}

      {(order?.orderNumber || id) && (
        <p className="text-sm text-gray-500 mb-6">
          {t('orderConfirmation.orderNumber')} {order?.orderNumber ? `#${order.orderNumber}` : `ID: ${id}`}
        </p>
      )}

      {order && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left mb-8">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">{t('checkout.orderType')}</span>
              <p className="font-medium text-gray-900">{order.orderType}</p>
            </div>
            <div>
              <span className="text-gray-500">{t('orders.status')}</span>
              <p className="font-medium text-gray-900">{order.status}</p>
            </div>
            <div>
              <span className="text-gray-500">{t('checkout.subtotal')}</span>
              <p className="font-medium text-gray-900">{eur(order.subtotal)}</p>
            </div>
            <div>
              <span className="text-gray-500">{t('checkout.total')}</span>
              <p className="font-bold text-primary-600">{eur(order.total)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4">
        <Link
          to="/menu"
          className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          {t('orderConfirmation.orderMore')}
        </Link>
        <Link
          to="/"
          className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  );
}
