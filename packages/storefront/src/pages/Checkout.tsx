import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';

type OrderType = 'delivery' | 'pickup';
type PaymentMethod = 'cash' | 'stripe' | 'paypal';

const TAX_RATE = 0.08;

export default function Checkout() {
  const { t } = useTranslation();
  const { items, subtotal, clear } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', zip: '' });
  const [scheduledAt, setScheduledAt] = useState('');
  const [comment, setComment] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Guest checkout fields
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Dynamic delivery fee from zone check
  const [deliveryFee, setDeliveryFee] = useState(4.99);
  const [zoneError, setZoneError] = useState('');

  // Busy mode
  const [isBusy, setIsBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState('');

  // Loyalty points
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyRedeem, setLoyaltyRedeem] = useState(0);
  const loyaltyDiscount = loyaltyRedeem / 100;

  const tax = subtotal * TAX_RATE;
  const currentDeliveryFee = orderType === 'delivery' ? deliveryFee : 0;
  const total = subtotal + tax + currentDeliveryFee - loyaltyDiscount;

  // Check busy mode on mount
  useEffect(() => {
    fetch('/api/locations')
      .then((res) => res.json())
      .then((data) => {
        const loc = data.data?.[0];
        if (loc?.isBusy) {
          setIsBusy(true);
          setBusyMessage(loc.busyMessage || 'This location is currently not accepting orders.');
        }
      })
      .catch(() => {});
  }, []);

  // Fetch loyalty balance for logged-in users
  useEffect(() => {
    if (token) {
      fetch('/api/loyalty/balance', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setLoyaltyBalance(data.data.points);
        })
        .catch(() => {});
    }
  }, [token]);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('checkout.emptyCart')}</h1>
        <Link
          to="/menu"
          className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          {t('checkout.browseMenu')}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const orderItems = items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        comment: item.comment,
        options: item.options.map((o) => ({
          menuOptionValueId: o.valueId,
          name: o.optionName,
          value: o.valueName,
          priceModifier: o.priceModifier,
        })),
      }));

      const body: Record<string, unknown> = {
        orderType: orderType.toUpperCase(),
        paymentMethod,
        items: orderItems,
        comment: comment || undefined,
        scheduledAt: scheduledAt || undefined,
        couponCode: couponCode || undefined,
      };

      if (orderType === 'delivery') {
        body.address = address;
      }

      // Guest info
      if (!user) {
        body.guestName = guestName;
        body.guestEmail = guestEmail;
        body.guestPhone = guestPhone || undefined;
      }

      // Loyalty points
      if (loyaltyRedeem > 0) {
        body.loyaltyPointsRedeem = loyaltyRedeem;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      const orderId = data.data.id as string;

      // Stripe path: hand the user off to the hosted Checkout page. Stripe
      // brings them back to /order/:id?paid=true on success (the webhook
      // is what actually flips Order.status). Cancel falls back to /checkout.
      if (paymentMethod === 'stripe') {
        const sessRes = await fetch('/api/payments/create-checkout-session', {
          method: 'POST',
          headers,
          body: JSON.stringify({ orderId }),
        });
        const sessData = await sessRes.json();
        if (!sessRes.ok || !sessData.data?.url) {
          throw new Error(sessData.error || 'Failed to start Stripe checkout');
        }
        // Don't clear the cart yet — only after Stripe confirms. If the
        // user backs out of the hosted page, they return to a still-loaded
        // checkout and can retry without re-typing everything.
        window.location.href = sessData.data.url as string;
        return;
      }

      clear();
      navigate(`/order/${orderId}`, { state: { order: data.data } });
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('checkout.title')}</h1>

      {isBusy && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 p-4 rounded-lg mb-6">
          <p className="font-semibold">Currently Unavailable</p>
          <p className="text-sm mt-1">{busyMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
        {/* Left: Form */}
        <div className="flex-1 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">{error}</div>
          )}

          {/* Order type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.orderType')}</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`flex-1 py-3 rounded-lg font-medium text-sm border-2 transition-colors ${
                  orderType === 'delivery'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {t('checkout.delivery')}
              </button>
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`flex-1 py-3 rounded-lg font-medium text-sm border-2 transition-colors ${
                  orderType === 'pickup'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {t('checkout.pickup')}
              </button>
            </div>
          </div>

          {/* Delivery address */}
          {orderType === 'delivery' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.deliveryAddress')}</h2>
              {zoneError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-3">{zoneError}</div>
              )}
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder={t('checkout.addressLine1')}
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder={t('checkout.addressLine2')}
                  value={address.line2}
                  onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder={t('checkout.city')}
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  />
                  <input
                    type="text"
                    required
                    placeholder={t('checkout.state')}
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  />
                  <input
                    type="text"
                    required
                    placeholder={t('checkout.zipCode')}
                    value={address.zip}
                    onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.scheduling')}</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="schedule"
                  checked={!scheduledAt}
                  onChange={() => setScheduledAt('')}
                  className="accent-primary-600"
                />
                <span className="text-sm text-gray-700">{t('checkout.asap')}</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="schedule"
                  checked={!!scheduledAt}
                  onChange={() => setScheduledAt(getDefaultScheduleTime())}
                  className="accent-primary-600"
                />
                <span className="text-sm text-gray-700">{t('checkout.scheduled')}</span>
              </label>
              {scheduledAt && (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                />
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.orderNotes')}</h2>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm resize-none"
            />
          </div>

          {/* Coupon */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.couponCode')}</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('checkout.apply')}
              </button>
            </div>
          </div>

          {/* Loyalty Points Redemption */}
          {user && loyaltyBalance > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Loyalty Points</h2>
              <p className="text-sm text-gray-600 mb-3">
                You have <span className="font-bold text-primary-600">{loyaltyBalance}</span> points available
                (100 points = $1.00)
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={Math.min(loyaltyBalance, Math.floor(subtotal * 100))}
                  step={100}
                  value={loyaltyRedeem}
                  onChange={(e) => setLoyaltyRedeem(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  placeholder="0"
                />
                <span className="text-sm text-gray-600">points to redeem</span>
                {loyaltyRedeem > 0 && (
                  <span className="text-sm font-medium text-green-600">
                    -${loyaltyDiscount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Payment method */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.paymentMethod')}</h2>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                paymentMethod === 'cash'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="accent-primary-600"
                />
                <span className="text-sm font-medium text-gray-900">{t('checkout.cashOnDelivery')}</span>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                paymentMethod === 'stripe'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'stripe'}
                  onChange={() => setPaymentMethod('stripe')}
                  className="accent-primary-600"
                />
                <span className="text-sm font-medium text-gray-900">{t('checkout.creditCard')}</span>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                paymentMethod === 'paypal'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'paypal'}
                  onChange={() => setPaymentMethod('paypal')}
                  className="accent-primary-600"
                />
                <span className="text-sm font-medium text-gray-900">PayPal</span>
              </label>
            </div>
          </div>

          {/* Guest info or login prompt */}
          {!user && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-sm text-gray-600 mb-3">
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium underline">
                  {t('nav.login')}
                </Link>{' '}
                for faster checkout, or continue as guest:
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Full name *"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                />
                <input
                  type="email"
                  required
                  placeholder="Email address *"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                />
                <input
                  type="tel"
                  placeholder="Phone number (optional)"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Order summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.orderSummary')}</h2>

            <div className="space-y-3 mb-4">
              {items.map((item) => {
                const optionsTotal = item.options.reduce((s, o) => s + o.priceModifier, 0);
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-400 mr-1">{item.quantity}x</span>
                      <span className="text-gray-700">{item.name}</span>
                      {item.options.length > 0 && (
                        <p className="text-xs text-gray-400 ml-5">
                          {item.options.map((o) => o.valueName).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="text-gray-900 font-medium">
                      ${((item.price + optionsTotal) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('checkout.subtotal')}</span>
                <span className="text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('checkout.tax')}</span>
                <span className="text-gray-900">${tax.toFixed(2)}</span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('checkout.deliveryFee')}</span>
                  <span className="text-gray-900">${currentDeliveryFee.toFixed(2)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Loyalty Discount</span>
                  <span>-${loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-base">
                <span>{t('checkout.total')}</span>
                <span className="text-primary-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isBusy}
              className="w-full mt-4 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isBusy
                ? 'Currently Unavailable'
                : loading
                  ? t('checkout.processing')
                  : `${t('checkout.placeOrder')} — $${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function getDefaultScheduleTime(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}
