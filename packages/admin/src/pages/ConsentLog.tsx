import { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

interface ConsentRecord {
  id: string;
  accepted: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  customer: { id: string; name: string; email: string } | null;
  cookieCategory: { id: string; name: string; label: string };
}

interface CategoryStat {
  categoryId: string;
  categoryName: string;
  total: number;
  accepted: number;
  rejected: number;
  acceptanceRate: number;
}

interface Stats {
  totalConsents: number;
  categories: CategoryStat[];
}

export default function ConsentLog() {
  const { t } = useTranslation();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    fetch('/api/consent/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (categoryFilter) params.set('categoryId', categoryFilter);

    fetch(`/api/consent?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setConsents(res.data);
          setTotalPages(res.pagination.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, categoryFilter, token]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('pages.consent_log.consent_log')}</h1>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">{t('pages.consent_log.total_consents')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalConsents}</p>
          </div>
          {stats.categories.map((cat) => (
            <div key={cat.categoryId} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase">{cat.categoryName}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{cat.acceptanceRate}%</p>
              <p className="text-xs text-gray-400 mt-1">
                {cat.accepted}  {t('pages.consent_log.accepted')} {cat.rejected}  {t('pages.consent_log.rejected')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">{t('pages.consent_log.all_categories')}</option>
          {stats?.categories.map((cat) => (
            <option key={cat.categoryId} value={cat.categoryId}>
              {cat.categoryName}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">{t('pages.consent_log.customer')}</th>
              <th className="px-6 py-3 text-left">{t('pages.consent_log.category')}</th>
              <th className="px-6 py-3 text-center">{t('pages.consent_log.accepted_61a057')}</th>
              <th className="px-6 py-3 text-left">{t('pages.consent_log.ip_address')}</th>
              <th className="px-6 py-3 text-left">{t('pages.consent_log.date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">{t('pages.consent_log.loading')}</td>
              </tr>
            ) : consents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">{t('pages.consent_log.no_consent_records')}</td>
              </tr>
            ) : (
              consents.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {c.customer ? (
                      <div>
                        <span className="font-medium text-gray-900">{c.customer.name}</span>
                        <span className="block text-xs text-gray-400">{c.customer.email}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">{t('pages.consent_log.anonymous')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{c.cookieCategory.label}</td>
                  <td className="px-6 py-4 text-center">
                    {c.accepted ? (
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">

                        {t('pages.consent_log.yes')}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">

                        {t('pages.consent_log.no')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs font-mono">{c.ipAddress || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(c.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
          >

            {t('pages.consent_log.previous')}
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">

            {t('pages.consent_log.page')} {page}  {t('pages.consent_log.of')} {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
          >

            {t('pages.consent_log.next')}
          </button>
        </div>
      )}
    </div>
  );
}
