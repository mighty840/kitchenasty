import { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

interface CookieCategory {
  id: string;
  name: string;
  label: string;
  description: string;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm = { name: '', label: '', description: '', isRequired: false, isActive: true, sortOrder: 0 };

export default function CookieCategoryList() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<CookieCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token') || '';

  function loadCategories() {
    fetch('/api/legal/cookie-categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCategories(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCategories(); }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const url = editingId
      ? `/api/legal/cookie-categories/${editingId}`
      : '/api/legal/cookie-categories';
    const method = editingId ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
        loadCategories();
      } else {
        setError(typeof data.error === 'string' ? data.error : t('messages.failed_to_save'));
      }
    } catch {
      setError(t('messages.network_error'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('messages.delete_this_cookie_category'))) return;
    try {
      const res = await fetch(`/api/legal/cookie-categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) loadCategories();
    } catch {}
  }

  function startEdit(cat: CookieCategory) {
    setForm({
      name: cat.name,
      label: cat.label,
      description: cat.description,
      isRequired: cat.isRequired,
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
    });
    setEditingId(cat.id);
    setShowForm(true);
  }

  if (loading) return <div className="p-6 text-gray-500">{t('pages.cookie_category_list.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('pages.cookie_category_list.cookie_categories')}</h1>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          {showForm ? t('pages.cookie_category_list.cancel') : t('pages.cookie_category_list.add_category')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 mb-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.cookie_category_list.name_slug')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={t('pages.cookie_category_list.e_g_analytics')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.cookie_category_list.label')}</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={t('pages.cookie_category_list.e_g_analytics_cookies')}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.cookie_category_list.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isRequired}
                onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600"
              />

              {t('pages.cookie_category_list.required_cannot_be_disabled_by_user')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600"
              />

              {t('pages.cookie_category_list.active')}
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{t('pages.cookie_category_list.sort_order')}</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              {editingId ? t('pages.cookie_category_list.update') : t('pages.cookie_category_list.create')}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">{t('pages.cookie_category_list.name')}</th>
              <th className="px-6 py-3 text-left">{t('pages.cookie_category_list.label')}</th>
              <th className="px-6 py-3 text-left">{t('pages.cookie_category_list.description')}</th>
              <th className="px-6 py-3 text-center">{t('pages.cookie_category_list.required')}</th>
              <th className="px-6 py-3 text-center">{t('pages.cookie_category_list.active')}</th>
              <th className="px-6 py-3 text-right">{t('pages.cookie_category_list.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                <td className="px-6 py-4 text-gray-700">{cat.label}</td>
                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{cat.description}</td>
                <td className="px-6 py-4 text-center">
                  {cat.isRequired ? (
                    <span className="text-green-600 font-medium">{t('pages.cookie_category_list.yes')}</span>
                  ) : (
                    <span className="text-gray-400">{t('pages.cookie_category_list.no')}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {cat.isActive ? (
                    <span className="text-green-600 font-medium">{t('pages.cookie_category_list.yes')}</span>
                  ) : (
                    <span className="text-red-500">{t('pages.cookie_category_list.no')}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >

                    {t('pages.cookie_category_list.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-red-500 hover:text-red-600 font-medium"
                  >

                    {t('pages.cookie_category_list.delete')}
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">

                  {t('pages.cookie_category_list.no_cookie_categories_yet')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
