import { useEffect, useState } from 'react';

type Category = 'FOOD' | 'INTERIOR' | 'GARDEN' | 'EVENTS';

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  category: Category;
  sortOrder: number;
  isActive: boolean;
}

const CATEGORIES: Category[] = ['FOOD', 'INTERIOR', 'GARDEN', 'EVENTS'];

const CATEGORY_LABELS: Record<Category, string> = {
  FOOD: 'Food',
  INTERIOR: 'Interior',
  GARDEN: 'Garden',
  EVENTS: 'Events',
};

interface FormState {
  url: string;
  alt: string;
  category: Category;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: FormState = {
  url: '',
  alt: '',
  category: 'FOOD',
  sortOrder: 0,
  isActive: true,
};

export default function DesignGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Category | 'ALL'>('ALL');
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token') || '';
  const authHeaders = { Authorization: `Bearer ${token}` };

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gallery/admin', { headers: authHeaders });
      if (!res.ok) throw new Error('Failed to load gallery');
      const result = await res.json();
      setImages(result.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(img: GalleryImage) {
    setEditing(img);
    setForm({
      url: img.url,
      alt: img.alt,
      category: img.category,
      sortOrder: img.sortOrder,
      isActive: img.isActive,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/gallery/${editing.id}` : '/api/gallery';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(result.error?.[0]?.message || 'Save failed');
      }
      closeForm();
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(img: GalleryImage) {
    if (!window.confirm(`Delete "${img.alt}"?`)) return;
    const res = await fetch(`/api/gallery/${img.id}`, { method: 'DELETE', headers: authHeaders });
    if (res.ok) await load();
    else setError('Delete failed');
  }

  async function toggleActive(img: GalleryImage) {
    const res = await fetch(`/api/gallery/${img.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !img.isActive }),
    });
    if (res.ok) await load();
  }

  const filtered = filter === 'ALL' ? images : images.filter((i) => i.category === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Gallery</h2>
          <p className="text-sm text-gray-500 mt-1">Manage photos shown on the storefront gallery page</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + Add Image
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['ALL', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === c ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {c === 'ALL' ? 'All' : CATEGORY_LABELS[c]}
            <span className="ml-1 opacity-70">
              ({c === 'ALL' ? images.length : images.filter((i) => i.category === c).length})
            </span>
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No images yet. Click "Add Image" to start.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((img) => (
            <div key={img.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-[4/3] bg-gray-100 relative">
                <img src={img.url} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
                {!img.isActive && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold bg-gray-800 px-2 py-1 rounded">HIDDEN</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate" title={img.alt}>{img.alt}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">{CATEGORY_LABELS[img.category]} · #{img.sortOrder}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(img)}
                    className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(img)}
                    className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {img.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => remove(img)}
                    className="text-xs px-2 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50"
                    aria-label={`Delete ${img.alt}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <form onSubmit={save}>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Image' : 'Add Image'}</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    required
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                {form.url && (
                  <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                    <img src={form.url} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt text</label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={form.alt}
                    onChange={(e) => setForm({ ...form, alt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Visible on storefront</span>
                </label>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-xl">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
