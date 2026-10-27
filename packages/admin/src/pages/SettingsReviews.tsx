import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

export default function SettingsReviews() {
  const { t } = useTranslation();
  const token = localStorage.getItem('token') || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [enabled, setEnabled] = useState(true);
  const [requireOrder, setRequireOrder] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [minimumRating, setMinimumRating] = useState(1);

  useEffect(() => {
    fetch('/api/settings/review', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          if (d.enabled !== undefined) setEnabled(d.enabled);
          if (d.requireOrder !== undefined) setRequireOrder(d.requireOrder);
          if (d.autoApprove !== undefined) setAutoApprove(d.autoApprove);
          if (d.minimumRating !== undefined) setMinimumRating(d.minimumRating);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/settings/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled, requireOrder, autoApprove, minimumRating }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(t('messages.review_settings_updated'));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(typeof data.error === 'string' ? data.error : t('messages.failed_to_save'));
      }
    } catch {
      setError(t('messages.network_error'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-gray-500">{t('pages.settings_reviews.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/settings" className="text-sm text-primary-600 hover:text-primary-700">&larr; Back to Settings</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{t('pages.settings_reviews.review_settings')}</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
          {saving ? t('pages.settings_reviews.saving') : t('pages.settings_reviews.save_changes')}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
          <span className="text-sm font-medium text-gray-700">{t('pages.settings_reviews.reviews_enabled')}</span>
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" checked={requireOrder} onChange={(e) => setRequireOrder(e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
          <span className="text-sm font-medium text-gray-700">{t('pages.settings_reviews.require_a_completed_order_to_leave_a_review')}</span>
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" checked={autoApprove} onChange={(e) => setAutoApprove(e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
          <span className="text-sm font-medium text-gray-700">{t('pages.settings_reviews.auto_approve_new_reviews')}</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_reviews.minimum_rating_1_5')}</label>
          <input type="number" min={1} max={5} value={minimumRating} onChange={(e) => setMinimumRating(parseInt(e.target.value) || 1)} className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          <p className="mt-1 text-xs text-gray-500">{t('pages.settings_reviews.minimum_rating_allowed_for_reviews')}</p>
        </div>
      </div>
    </div>
  );
}
