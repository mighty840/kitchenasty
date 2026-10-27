import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

import { useTranslation } from 'react-i18next';

interface Table {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
  _count: { reservations: number };
}

interface LocationInfo {
  id: string;
  name: string;
}

export default function TableList() {
  const { t } = useTranslation();
  const { locationId } = useParams();
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formName, setFormName] = useState('');
  const [formCapacity, setFormCapacity] = useState(2);
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTables = () => {
    setLoading(true);
    Promise.all([
      api.get<{ data: LocationInfo }>(`/locations/${locationId}`),
      api.get<{ data: Table[] }>(`/locations/${locationId}/tables`),
    ])
      .then(([locRes, tableRes]) => {
        setLocation(locRes.data);
        setTables(tableRes.data);
        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  useEffect(() => {
    if (locationId) fetchTables();
  }, [locationId]);

  const openCreateForm = () => {
    setEditingTable(null);
    setFormName('');
    setFormCapacity(2);
    setFormActive(true);
    setShowForm(true);
  };

  const openEditForm = (table: Table) => {
    setEditingTable(table);
    setFormName(table.name);
    setFormCapacity(table.capacity);
    setFormActive(table.isActive);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const body = { name: formName, capacity: Number(formCapacity), isActive: formActive };
      if (editingTable) {
        await api.patch(`/locations/${locationId}/tables/${editingTable.id}`, body);
      } else {
        await api.post(`/locations/${locationId}/tables`, body);
      }
      setShowForm(false);
      fetchTables();
    } catch (err: any) {
      alert(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('a11y.confirmDeleteTable', { name }))) return;
    try {
      await api.delete(`/locations/${locationId}/tables/${id}`);
      setTables((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p className="text-gray-500">{t('pages.table_list.loading_tables')}</p>;
  if (error) return <p className="text-red-600">{t('pages.table_list.error')} {error}</p>;

  const activeCount = tables.filter((t) => t.isActive).length;
  const totalCapacity = tables.reduce((sum, t) => sum + (t.isActive ? t.capacity : 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">{t('pages.table_list.tables')}</h2>
          {location && (
            <p className="text-sm text-gray-500 mt-1">{location.name}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/locations/${locationId}`)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >

            {t('pages.table_list.back_to_location')}
          </button>
          <button
            onClick={openCreateForm}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >

            {t('pages.table_list.add_table')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('pages.table_list.total_tables')}</p>
          <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('pages.table_list.active_tables')}</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('pages.table_list.total_capacity')}</p>
          <p className="text-2xl font-bold text-blue-600">{totalCapacity}</p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-2 border-primary-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingTable ? t('pages.table_list.edit_table') : t('pages.table_list.new_table')}
          </h3>
          <form onSubmit={handleSubmit} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.table_list.name')}</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                placeholder={t('pages.table_list.e_g_table_1_patio_a')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.table_list.capacity')}</label>
              <input
                type="number"
                value={formCapacity}
                onChange={(e) => setFormCapacity(parseInt(e.target.value) || 1)}
                required
                min={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <label className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('pages.table_list.active')}</span>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? t('pages.table_list.saving') : editingTable ? t('pages.table_list.update') : t('pages.table_list.create')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >

              {t('pages.table_list.cancel')}
            </button>
          </form>
        </div>
      )}

      {/* Table List */}
      {tables.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">{t('pages.table_list.no_tables_yet_for_this_location')}</p>
          <button onClick={openCreateForm} className="text-primary-600 hover:text-primary-700 font-medium">

            {t('pages.table_list.add_your_first_table')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('pages.table_list.name_709a23')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('pages.table_list.capacity_45bd90')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('pages.table_list.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('pages.table_list.reservations')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('pages.table_list.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tables.map((table) => (
                <tr key={table.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {table.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.capacity} {table.capacity === 1 ? t('pages.table_list.seat') : t('pages.table_list.seats')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${table.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {table.isActive ? t('pages.table_list.active') : t('pages.table_list.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table._count.reservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                    <button onClick={() => openEditForm(table)} className="text-primary-600 hover:text-primary-900 font-medium" aria-label={t('a11y.editTable', { name: table.name })}>

                      {t('pages.table_list.edit')}
                    </button>
                    <button onClick={() => handleDelete(table.id, table.name)} className="text-red-600 hover:text-red-900 font-medium" aria-label={t('a11y.deleteTable', { name: table.name })}>

                      {t('pages.table_list.delete')}
                    </button>
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
