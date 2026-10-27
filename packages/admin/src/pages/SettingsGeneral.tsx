import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'Europe/Rome', 'Europe/Madrid', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata',
  'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland',
];

export default function SettingsGeneral() {
  const { t } = useTranslation();
  const token = localStorage.getItem('token') || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [currencyPosition, setCurrencyPosition] = useState<'before' | 'after'>('before');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');

  useEffect(() => {
    fetch('/api/settings/general', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          if (d.contactEmail) setContactEmail(d.contactEmail);
          if (d.contactPhone) setContactPhone(d.contactPhone);
          if (d.timezone) setTimezone(d.timezone);
          if (d.distanceUnit) setDistanceUnit(d.distanceUnit);
          if (d.defaultCurrency) setDefaultCurrency(d.defaultCurrency);
          if (d.currencySymbol) setCurrencySymbol(d.currencySymbol);
          if (d.currencyPosition) setCurrencyPosition(d.currencyPosition);
          if (d.googleMapsApiKey) setGoogleMapsApiKey(d.googleMapsApiKey);
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
      const res = await fetch('/api/settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contactEmail, contactPhone, timezone, distanceUnit, defaultCurrency, currencySymbol, currencyPosition, googleMapsApiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(t('messages.general_settings_updated'));
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

  if (loading) return <div className="p-6 text-gray-500">{t('pages.settings_general.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/settings" className="text-sm text-primary-600 hover:text-primary-700">&larr; Back to Settings</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{t('pages.settings_general.general_settings')}</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
          {saving ? t('pages.settings_general.saving') : t('pages.settings_general.save_changes')}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_general.contact_email')}</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_general.contact_phone')}</label>
            <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_general.timezone')}</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_general.distance_unit')}</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="distanceUnit" value="km" checked={distanceUnit === 'km'} onChange={() => setDistanceUnit('km')} className="text-primary-600" />

              {t('pages.settings_general.kilometers_km')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="distanceUnit" value="mi" checked={distanceUnit === 'mi'} onChange={() => setDistanceUnit('mi')} className="text-primary-600" />

              {t('pages.settings_general.miles_mi')}
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_general.default_currency')}</label>
            <input type="text" maxLength={3} value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder={t('pages.settings_general.usd')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_general.currency_symbol')}</label>
            <input type="text" maxLength={5} value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="$" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_general.currency_position')}</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="currencyPosition" value="before" checked={currencyPosition === 'before'} onChange={() => setCurrencyPosition('before')} className="text-primary-600" />

                {t('pages.settings_general.before_10')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="currencyPosition" value="after" checked={currencyPosition === 'after'} onChange={() => setCurrencyPosition('after')} className="text-primary-600" />

                {t('pages.settings_general.after_10')}
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.settings_general.google_maps_api_key')}</label>
          <input type="password" value={googleMapsApiKey} onChange={(e) => setGoogleMapsApiKey(e.target.value)} className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder={t('pages.settings_general.enter_api_key')} />
        </div>
      </div>
    </div>
  );
}
