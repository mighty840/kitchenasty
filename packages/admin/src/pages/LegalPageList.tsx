import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  updatedAt: string;
}

export default function LegalPageList() {
  const { t } = useTranslation();
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    fetch('/api/legal', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPages(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-6 text-gray-500">{t('pages.legal_page_list.loading')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('pages.legal_page_list.legal_pages')}</h1>

      {pages.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          <p>{t('pages.legal_page_list.no_legal_pages_yet_create_one_by_editing_a_slug_below')}</p>
          <div className="mt-4 flex gap-3 justify-center">
            <Link to="/legal/pages/privacy-policy" className="text-primary-600 hover:underline">

              {t('pages.legal_page_list.create_privacy_policy')}
            </Link>
            <Link to="/legal/pages/impressum" className="text-primary-600 hover:underline">

              {t('pages.legal_page_list.create_impressum')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">{t('pages.legal_page_list.title')}</th>
                <th className="px-6 py-3 text-left">{t('pages.legal_page_list.slug')}</th>
                <th className="px-6 py-3 text-left">{t('pages.legal_page_list.last_updated')}</th>
                <th className="px-6 py-3 text-right">{t('pages.legal_page_list.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{page.title}</td>
                  <td className="px-6 py-4 text-gray-500">{page.slug}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/legal/pages/${page.slug}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >

                      {t('pages.legal_page_list.edit')}
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
