import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

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
        <h2 className="text-2xl font-semibold text-gray-800">Locations</h2>
        <Link
          to="/locations/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Add Location
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading locations...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && locations.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No locations yet.</p>
          <Link
            to="/locations/new"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Create your first location
          </Link>
        </div>
      )}

      {!loading && locations.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Services
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                          Delivery
                        </span>
                      )}
                      {loc.pickupEnabled && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Pickup
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
                      {loc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {loc._count.orders} orders &middot; {loc._count.tables} tables &middot;{' '}
                    {loc._count.deliveryZones} zones
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                    <button
                      onClick={() => toggleBusy(loc)}
                      disabled={togglingBusy === loc.id}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${loc.isBusy
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      aria-label={`${loc.isBusy ? 'Turn off' : 'Turn on'} busy mode for ${loc.name}`}
                    >
                      {loc.isBusy ? 'Busy ON' : 'Busy OFF'}
                    </button>
                    <Link
                      to={`/locations/${loc.id}/tables`}
                      className="text-gray-600 hover:text-gray-900 font-medium"
                      aria-label={`View tables for ${loc.name}`}
                    >
                      Tables
                    </Link>
                    <Link
                      to={`/locations/${loc.id}`}
                      className="text-primary-600 hover:text-primary-900 font-medium"
                      aria-label={`Edit ${loc.name}`}
                    >
                      Edit
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
