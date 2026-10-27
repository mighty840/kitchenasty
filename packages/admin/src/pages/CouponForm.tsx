import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext.js';

export default function CouponForm() {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [code, setCode] = useState('');
  const [type, setType] = useState('PERCENTAGE');
  const [value, setValue] = useState(0);
  const [minOrder, setMinOrder] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState<string>('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [perCustomer, setPerCustomer] = useState(1);
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/coupons/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t('messages.failed_to_load_coupon'));
        return res.json();
      })
      .then((data) => {
        const c = data.data;
        setCode(c.code);
        setType(c.type);
        setValue(c.value);
        setMinOrder(c.minOrder);
        setMaxDiscount(c.maxDiscount !== null ? String(c.maxDiscount) : '');
        setUsageLimit(c.usageLimit !== null ? String(c.usageLimit) : '');
        setPerCustomer(c.perCustomer);
        setStartsAt(c.startsAt ? c.startsAt.split('T')[0] : '');
        setExpiresAt(c.expiresAt ? c.expiresAt.split('T')[0] : '');
        setIsActive(c.isActive);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const body = {
      code,
      type,
      value,
      minOrder,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      perCustomer,
      startsAt: startsAt || null,
      expiresAt: expiresAt || null,
      isActive,
    };

    try {
      const url = isEdit ? `/api/coupons/${id}` : `/api/coupons`;
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : t('messages.failed_to_save'));
      navigate('/coupons');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/coupons" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? t('pages.coupon_form.edit_coupon') : t('pages.coupon_form.new_coupon')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.coupon_form.code')}</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t('pages.coupon_form.save20')}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.coupon_form.type')}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="PERCENTAGE">{t('pages.coupon_form.percentage_off')}</option>
              <option value="FIXED">{t('pages.coupon_form.fixed_amount_off')}</option>
              <option value="FREE_DELIVERY">{t('pages.coupon_form.free_delivery')}</option>
            </select>
          </div>
        </div>

        {type !== 'FREE_DELIVERY' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">

                {t('pages.coupon_form.value')} {type === 'PERCENTAGE' ? '(%)' : `(${currency.symbol})`}
              </label>
              <input
                type="number"
                step={type === 'PERCENTAGE' ? '1' : '0.01'}
                min="0"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            {type === 'PERCENTAGE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.coupon_form.max_discount')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  placeholder={t('pages.coupon_form.no_cap')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.coupon_form.min_order')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={minOrder}
              onChange={(e) => setMinOrder(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.coupon_form.per_customer_limit')}</label>
            <input
              type="number"
              min="1"
              value={perCustomer}
              onChange={(e) => setPerCustomer(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.coupon_form.total_usage_limit')}</label>
          <input
            type="number"
            min="1"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder={t('pages.coupon_form.unlimited')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.coupon_form.valid_from')}</label>
            <input
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.coupon_form.valid_until')}</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">{t('pages.coupon_form.active')}</label>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? t('pages.coupon_form.saving') : isEdit ? t('pages.coupon_form.update_coupon') : t('pages.coupon_form.create_coupon')}
          </button>
          <Link
            to="/coupons"
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >

            {t('pages.coupon_form.cancel')}
          </Link>
        </div>
      </form>
    </div>
  );
}
