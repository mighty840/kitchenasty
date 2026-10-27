import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

export default function SettingsAdvanced() {
  const { t } = useTranslation();
  const token = localStorage.getItem('token') || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [enableRateLimiting, setEnableRateLimiting] = useState(false);

  useEffect(() => {
    fetch('/api/settings/advanced', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          if (d.maintenanceMode !== undefined) setMaintenanceMode(d.maintenanceMode);
          if (d.maintenanceMessage) setMaintenanceMessage(d.maintenanceMessage);
          if (d.enableRateLimiting !== undefined) setEnableRateLimiting(d.enableRateLimiting);
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
      const res = await fetch('/api/settings/advanced', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ maintenanceMode, maintenanceMessage, enableRateLimiting }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(t('messages.advanced_settings_updated'));
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

  if (loading) return <div className="p-6 text-gray-500">{t('pages.settings_advanced.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/settings" className="text-sm text-primary-600 hover:text-primary-700">&larr; Back to Settings</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{t('pages.settings_advanced.advanced_settings')}</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
          {saving ? t('pages.settings_advanced.saving') : t('pages.settings_advanced.save_changes')}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
            <span className="text-sm font-medium text-gray-700">{t('pages.settings_advanced.maintenance_mode')}</span>
          </label>
          {maintenanceMode && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{t('pages.settings_advanced.warning_the_storefront_will_be_unavailable_to_customer')}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_advanced.maintenance_message')}</label>
          <textarea
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('pages.settings_advanced.we_re_currently_performing_maintenance_please_check_ba')}
          />
        </div>

        <label className="flex items-center gap-3">
          <input type="checkbox" checked={enableRateLimiting} onChange={(e) => setEnableRateLimiting(e.target.checked)} className="w-4 h-4 text-primary-600 rounded" />
          <span className="text-sm font-medium text-gray-700">{t('pages.settings_advanced.enable_rate_limiting')}</span>
        </label>
      </div>
    </div>
  );
}
