import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { slugify } from '../lib/slug.js';
import { api } from '../lib/api.js';

import { useTranslation } from 'react-i18next';
import { useCurrency } from '../context/CurrencyContext.js';

interface OperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface DeliveryZone {
  id?: string;
  name: string;
  charge: number;
  minOrder: number;
  isActive: boolean;
}

interface LocationData {
  name: string;
  slug: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isActive: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  minOrderDelivery: number;
  minOrderPickup: number;
  deliveryLeadTime: number;
  pickupLeadTime: number;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const defaultHours: OperatingHour[] = DAYS.map((_, i) => ({
  dayOfWeek: i,
  openTime: '10:00',
  closeTime: '22:00',
  isClosed: false,
}));

const emptyLocation: LocationData = {
  name: '',
  slug: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  isActive: true,
  deliveryEnabled: true,
  pickupEnabled: true,
  minOrderDelivery: 0,
  minOrderPickup: 0,
  deliveryLeadTime: 30,
  pickupLeadTime: 15,
};

export default function LocationForm() {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<LocationData>(emptyLocation);
  const [hours, setHours] = useState<OperatingHour[]>(defaultHours);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    api.get<{ data: any }>(`/locations/${id}`)
      .then((res) => {
        const loc = res.data;
        setForm({
          name: loc.name,
          slug: loc.slug,
          description: loc.description || '',
          phone: loc.phone || '',
          email: loc.email || '',
          address: loc.address,
          city: loc.city,
          state: loc.state || '',
          postalCode: loc.postalCode,
          country: loc.country,
          isActive: loc.isActive,
          deliveryEnabled: loc.deliveryEnabled,
          pickupEnabled: loc.pickupEnabled,
          minOrderDelivery: loc.minOrderDelivery,
          minOrderPickup: loc.minOrderPickup,
          deliveryLeadTime: loc.deliveryLeadTime,
          pickupLeadTime: loc.pickupLeadTime,
        });
        if (loc.operatingHours?.length) {
          setHours(loc.operatingHours.map((h: any) => ({
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          })));
        }
        if (loc.deliveryZones?.length) {
          setZones(loc.deliveryZones);
        }
        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [id, isEdit]);

  const updateField = (field: keyof LocationData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const autoSlug = (name: string) => {
    if (!isEdit) {
      updateField('slug', slugify(name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = {
        ...form,
        minOrderDelivery: Number(form.minOrderDelivery),
        minOrderPickup: Number(form.minOrderPickup),
        deliveryLeadTime: Number(form.deliveryLeadTime),
        pickupLeadTime: Number(form.pickupLeadTime),
        operatingHours: hours,
      };

      if (isEdit) {
        const { slug: _, ...updateBody } = body;
        await api.patch(`/locations/${id}`, updateBody);
      } else {
        await api.post('/locations', body);
      }
      navigate('/locations');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const addZone = () => {
    setZones((prev) => [...prev, { name: '', charge: 0, minOrder: 0, isActive: true }]);
  };

  const removeZone = (index: number) => {
    setZones((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) return <p className="text-gray-500">{t('pages.location_form.loading')}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {isEdit ? t('pages.location_form.edit_location') : t('pages.location_form.new_location')}
        </h2>
        <button
          onClick={() => navigate('/locations')}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >

          {t('pages.location_form.back_to_locations')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('pages.location_form.basic_information')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.name')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => { updateField('name', e.target.value); autoSlug(e.target.value); }}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.slug')}</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                required
                disabled={isEdit}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.description')}</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.phone')}</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('pages.location_form.address')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.street_address')}</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.city')}</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.state')}</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.postal_code')}</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.country')}</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => updateField('country', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </section>

        {/* Service Settings */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('pages.location_form.service_settings')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('pages.location_form.active')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.deliveryEnabled}
                onChange={(e) => updateField('deliveryEnabled', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('pages.location_form.delivery_enabled')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.pickupEnabled}
                onChange={(e) => updateField('pickupEnabled', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('pages.location_form.pickup_enabled')}</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.min_order_delivery')}</label>
              <input
                type="number"
                value={form.minOrderDelivery}
                onChange={(e) => updateField('minOrderDelivery', e.target.value)}
                min={0}
                step={0.01}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.delivery_lead_time_min')}</label>
              <input
                type="number"
                value={form.deliveryLeadTime}
                onChange={(e) => updateField('deliveryLeadTime', e.target.value)}
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.location_form.pickup_lead_time_min')}</label>
              <input
                type="number"
                value={form.pickupLeadTime}
                onChange={(e) => updateField('pickupLeadTime', e.target.value)}
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </section>

        {/* Operating Hours */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('pages.location_form.operating_hours')}</h3>
          <div className="space-y-3">
            {hours.map((hour, index) => (
              <div key={hour.dayOfWeek} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium text-gray-700">{t(`days.${DAYS[hour.dayOfWeek]}`)}</span>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={!hour.isClosed}
                    onChange={(e) => {
                      const updated = [...hours];
                      updated[index] = { ...hour, isClosed: !e.target.checked };
                      setHours(updated);
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">{t('pages.location_form.open')}</span>
                </label>
                <input
                  type="time"
                  value={hour.openTime}
                  disabled={hour.isClosed}
                  onChange={(e) => {
                    const updated = [...hours];
                    updated[index] = { ...hour, openTime: e.target.value };
                    setHours(updated);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="time"
                  value={hour.closeTime}
                  disabled={hour.isClosed}
                  onChange={(e) => {
                    const updated = [...hours];
                    updated[index] = { ...hour, closeTime: e.target.value };
                    setHours(updated);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Delivery Zones */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{t('pages.location_form.delivery_zones')}</h3>
            <button
              type="button"
              onClick={addZone}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >

              {t('pages.location_form.add_zone')}
            </button>
          </div>
          {zones.length === 0 && (
            <p className="text-sm text-gray-400">{t('pages.location_form.no_delivery_zones_configured')}</p>
          )}
          <div className="space-y-3">
            {zones.map((zone, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <input
                  type="text"
                  placeholder={t('pages.location_form.zone_name')}
                  value={zone.name}
                  onChange={(e) => {
                    const updated = [...zones];
                    updated[index] = { ...zone, name: e.target.value };
                    setZones(updated);
                  }}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">{currency.symbol}</span>
                  <input
                    type="number"
                    placeholder={t('pages.location_form.charge')}
                    value={zone.charge}
                    onChange={(e) => {
                      const updated = [...zones];
                      updated[index] = { ...zone, charge: parseFloat(e.target.value) || 0 };
                      setZones(updated);
                    }}
                    min={0}
                    step={0.01}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">{t('pages.location_form.min')}</span>
                  <input
                    type="number"
                    placeholder={t('pages.location_form.min_order')}
                    value={zone.minOrder}
                    onChange={(e) => {
                      const updated = [...zones];
                      updated[index] = { ...zone, minOrder: parseFloat(e.target.value) || 0 };
                      setZones(updated);
                    }}
                    min={0}
                    step={0.01}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeZone(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >

                  {t('pages.location_form.remove')}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/locations')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >

            {t('pages.location_form.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? t('pages.location_form.saving') : isEdit ? t('pages.location_form.update_location') : t('pages.location_form.create_location')}
          </button>
        </div>
      </form>
    </div>
  );
}
