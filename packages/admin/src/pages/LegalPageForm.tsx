import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

export default function LegalPageForm() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || '';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/legal/${slug}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setTitle(res.data.title);
          setContent(res.data.content);
        } else {
          // New page — set default title from slug
          setTitle(slug === 'privacy-policy' ? 'Privacy Policy' : slug === 'impressum' ? 'Impressum' : slug || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/legal/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (data.success) {
        navigate('/legal/pages');
      } else {
        setError(typeof data.error === 'string' ? data.error : t('messages.failed_to_save'));
      }
    } catch {
      setError(t('messages.network_error'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-gray-500">{t('pages.legal_page_form.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('pages.legal_page_form.edit_legal_page')}</h1>
        <button
          onClick={() => navigate('/legal/pages')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >

          {t('pages.legal_page_form.back_to_list')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.legal_page_form.slug')}</label>
          <input
            type="text"
            value={slug}
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.legal_page_form.title')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.legal_page_form.content_markdown')}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={20}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? t('pages.legal_page_form.saving') : t('pages.legal_page_form.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
