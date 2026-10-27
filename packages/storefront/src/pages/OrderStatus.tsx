import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../hooks/useCurrency.js';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.js';

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
  location: { id: string; name: string };
  items: OrderItem[];
}

function getStepIndex(steps: { key: string; label: string }[], status: string): number {
  return steps.findIndex((s) => s.key === status);
}

export default function OrderStatus() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const DELIVERY_STEPS = [
    { key: 'PENDING', label: t('orderStatus.placed') },
    { key: 'CONFIRMED', label: t('orderStatus.confirmed') },
    { key: 'PREPARING', label: t('orderStatus.preparing') },
    { key: 'READY', label: t('orderStatus.ready') },
    { key: 'OUT_FOR_DELIVERY', label: t('orderStatus.outForDelivery') },
    { key: 'DELIVERED', label: t('orderStatus.delivered') },
  ];

  const PICKUP_STEPS = [
    { key: 'PENDING', label: t('orderStatus.placed') },
    { key: 'CONFIRMED', label: t('orderStatus.confirmed') },
    { key: 'PREPARING', label: t('orderStatus.preparing') },
    { key: 'READY', label: t('orderStatus.readyForPickup') },
    { key: 'PICKED_UP', label: t('orderStatus.pickedUp') },
  ];

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`/api/orders/${id}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load order');
        return res.json();
      })
      .then((data) => setOrder(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  // Real-time status updates via Socket.IO
  useEffect(() => {
    if (!id) return;

    const socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });

    socket.emit('join:order', id);

    socket.on('order:statusUpdate', (data: { id: string; status: string }) => {
      if (data.id === id) {
        setOrder((prev) => prev ? { ...prev, status: data.status } : prev);
      }
    });

    return () => {
      socket.emit('leave:order', id);
      socket.disconnect();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error || t('orders.errorLoading')}</div>
        <Link to="/account/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          {t('orders.backToOrders')}
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const steps = order.orderType === 'DELIVERY' ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentStep = getStepIndex(steps, order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">#{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Link to="/account/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          {t('orders.title')}
        </Link>
      </div>

      {/* Status Tracker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('orders.status')}</h2>

        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium text-red-700">{t('orderStatus.cancelledMessage')}</span>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => {
                const isComplete = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isComplete
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
                    >
                      {isComplete ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center ${isComplete ? 'text-primary-700 font-medium' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2" style={{ marginLeft: `${100 / (steps.length * 2)}%`, marginRight: `${100 / (steps.length * 2)}%` }}>
              <div
                className="h-full bg-primary-600 transition-all duration-500"
                style={{ width: currentStep >= 0 ? `${(currentStep / (steps.length - 1)) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.items')}</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
              <div>
                <div className="font-medium text-gray-900">
                  <span className="text-gray-400 mr-1">{item.quantity}x</span>
                  {item.name}
                </div>
                {item.surchargeAmount > 0 && (
                  <p className="text-xs text-gray-500">{t('pricing.surcharge')}: {format(item.surchargeAmount)} / {t('pricing.unit')}</p>
                )}
                {item.options.length > 0 && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.options.map((o) => `${o.name}: ${o.value}`).join(', ')}
                  </div>
                )}
              </div>
              <span className="font-medium text-gray-900">{format(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('checkout.subtotal')}</span>
            <span>{format(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('checkout.tax')}</span>
            <span>{format(order.tax)}</span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">{t('checkout.deliveryFee')}</span>
              <span>{format(order.deliveryFee)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>{t('checkout.discount')}</span>
              <span>-{format(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
            <span>{t('checkout.total')}</span>
            <span className="text-primary-600">{format(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <Link
          to="/menu"
          className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          {t('home.viewMenu')}
        </Link>
        <Link
          to="/account/orders"
          className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          {t('orders.title')}
        </Link>
      </div>
    </div>
  );
}
