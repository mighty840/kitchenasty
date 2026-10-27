import { useEffect, useRef, useState } from 'react';
import type { MediaAsset } from '../components/MediaPicker.js';

import { useTranslation } from 'react-i18next';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DesignMedia() {
  const { t } = useTranslation();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem('token') || '';

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/media?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || t('messages.failed_to_load_media'));
      setItems(result.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) {
          const result = await res.json().catch(() => ({}));
          throw new Error(result.error || t('messages.upload_failed_for_file', { name: file.name }));
        }
      }
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function remove(item: MediaAsset) {
    if (!window.confirm(t('a11y.confirmDeleteMedia', { name: item.originalName }))) return;
    const res = await fetch(`/api/media/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) await load();
    else setError(t('messages.delete_failed'));
  }

  async function copyUrl(item: MediaAsset) {
    const fullUrl = `${window.location.origin}${item.url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((id) => (id === item.id ? null : id)), 1500);
    } catch {
      setError(t('messages.could_not_copy_to_clipboard'));
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">{t('pages.design_media.media_library')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('pages.design_media.upload_and_manage_images_used_across_your_storefront')}</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? t('pages.design_media.uploading') : t('pages.design_media.upload_image')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => uploadFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <p className="text-sm text-gray-600">

          {t('pages.design_media.drag_and_drop_images_here_or_click')} <span className="font-semibold">{t('pages.design_media.upload_image_159031')}</span>  {t('pages.design_media.above')}
        </p>
        <p className="text-xs text-gray-400 mt-1">{t('pages.design_media.jpeg_png_webp_or_gif_max_5_mb_each')}</p>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">{t('pages.design_media.no_images_yet_upload_one_to_get_started')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                <img src={item.url} alt={item.originalName} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate" title={item.originalName}>
                  {item.originalName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatSize(item.size)} · {formatDate(item.createdAt)}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => copyUrl(item)}
                    className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {copiedId === item.id ? t('pages.design_media.copied') : t('pages.design_media.copy_url')}
                  </button>
                  <button
                    onClick={() => remove(item)}
                    className="text-xs px-2 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50"
                    aria-label={t('a11y.deleteNamed', { name: item.originalName })}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
