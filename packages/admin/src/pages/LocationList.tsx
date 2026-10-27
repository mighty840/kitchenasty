import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

import { useTranslation } from 'react-i18next';

interface Location {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string | null;
  isActive: boolean;
  isBusy: boolean;
  busyMessage: string | null;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  _count: { deliveryZones: number; tables: number; orders: number };
}

interface LocationResponse {
  success: boolean;
  data: Location[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function LocationList() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingBusy, setTogglingBusy] = useState<string | null>(null);

  useEffect(() => {
    api.get<LocationResponse>('/locations')
      .then((res) => {
        setLocations(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const toggleBusy = async (loc: Location) => {
    setTogglingBusy(loc.id);
    try {
      await api.patch(`/locations/${loc.id}`, { isBusy: !loc.isBusy });
      setLocations((prev) =>
        prev.map((l) => l.id === loc.id ? { ...l, isBusy: !l.isBusy } : l)
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTogglingBusy(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">{t('pages.location_list.locations')}</h2>
        <Link
          to="/locations/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >

          {t('pages.location_list.add_location')}
        </Link>
      </div>

      {loading && <p className="text-gray-500">{t('pages.location_list.loading_locations')}</p>}
      {error && <p className="text-red-600">{t('pages.location_list.error')} {error}</p>}

      {!loading && !error && locations.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">{t('pages.location_list.no_locations_yet')}</p>
          <Link
            to="/locations/new"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >

            {t('pages.location_list.create_your_first_location')}
          </Link>
        </div>
      )}

      {!loading && locations.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                  {t('pages.location_list.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                  {t('pages.location_list.address')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                  {t('pages.location_list.services')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                  {t('pages.location_list.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                  {t('pages.location_list.stats')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">

                  {t('pages.location_list.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{loc.name}</div>
                    <div className="text-xs text-gray-400">{loc.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {loc.address}, {loc.city}{loc.state ? `, ${loc.state}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {loc.deliveryEnabled && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">

                          {t('pages.location_list.delivery')}
                        </span>
                      )}
                      {loc.pickupEnabled && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">

                          {t('pages.location_list.pickup')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loc.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {loc.isActive ? t('pages.location_list.active') : t('pages.location_list.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {loc._count.orders} orders &middot; {loc._count.tables} tables &middot;{' '}
                    {loc._count.deliveryZones}  {t('pages.location_list.zones')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                    <button
                      onClick={() => toggleBusy(loc)}
                      disabled={togglingBusy === loc.id}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${loc.isBusy
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      aria-label={t(loc.isBusy ? 'a11y.turnBusyOff' : 'a11y.turnBusyOn', { name: loc.name })}
                    >
                      {loc.isBusy ? t('pages.location_list.busy_on') : t('pages.location_list.busy_off')}
                    </button>
                    <Link
                      to={`/locations/${loc.id}/tables`}
                      className="text-gray-600 hover:text-gray-900 font-medium"
                      aria-label={t('a11y.viewTablesFor', { name: loc.name })}
                    >

                      {t('pages.location_list.tables')}
                    </Link>
                    <Link
                      to={`/locations/${loc.id}`}
                      className="text-primary-600 hover:text-primary-900 font-medium"
                      aria-label={t('a11y.editNamed', { name: loc.name })}
                    >

                      {t('pages.location_list.edit')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
