import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../hooks/useCurrency.js';
import { useApi } from '../hooks/useApi.js';
import MenuItemModal from '../components/MenuItemModal.js';

interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  parentId: string | null;
  _count: { menuItems: number };
  children: Category[];
}

interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image: string | null;
  isActive: boolean;
  trackStock: boolean;
  stockQty: number;
  category: { id: string; name: string };
  _count: { options: number; allergens: number; mealtimes: number };
}

interface MenuResponse {
  items: MenuItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function Menu() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useApi<Category[]>('/api/menu/categories');

  // Build items URL with filters
  const itemsUrl = buildItemsUrl(selectedCategory, debouncedSearch, page);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [pagination, setPagination] = useState<MenuResponse['pagination'] | null>(null);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch items
  useEffect(() => {
    setItemsLoading(true);
    setItemsError(null);
    fetch(itemsUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load menu');
        return res.json();
      })
      .then((json) => {
        setItems(json.data);
        setPagination(json.pagination);
      })
      .catch((err) => setItemsError(err.message))
      .finally(() => setItemsLoading(false));
  }, [itemsUrl]);

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedCategory) params.category = selectedCategory;
    if (debouncedSearch) params.search = debouncedSearch;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [selectedCategory, debouncedSearch, page, setSearchParams]);

  const activeCategories = categories?.filter((c) => c.isActive && !c.parentId) || [];
  const activeItems = items.filter((i) => i.isActive && (!i.trackStock || i.stockQty > 0));

  function handleCategoryClick(catId: string | null) {
    setSelectedCategory(catId);
    setPage(1);
    setMobileCategoriesOpen(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('menu.title')}</h1>
        <p className="mt-2 text-gray-600">{t('home.heroDescription').split('.')[0]}.</p>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder={t('menu.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Mobile category toggle */}
      <button
        className="md:hidden flex items-center gap-2 mb-4 text-sm font-medium text-primary-600 hover:text-primary-700"
        onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        {mobileCategoriesOpen ? t('menu.categories') : t('menu.categories')}
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Category sidebar */}
        <aside className={`md:w-56 shrink-0 ${mobileCategoriesOpen ? '' : 'hidden md:block'}`}>
          <nav className="space-y-1">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('menu.allCategories')}
            </button>
            {categoriesLoading && (
              <div className="px-3 py-2 text-sm text-gray-400">{t('common.loading')}</div>
            )}
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.name}
                <span className="text-gray-400 ml-1 text-xs">({cat._count.menuItems})</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Menu items grid */}
        <div className="flex-1">
          {itemsLoading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          )}

          {itemsError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              {t('common.error')}
            </div>
          )}

          {!itemsLoading && !itemsError && activeItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('menu.noItems')}</p>
            </div>
          )}

          {!itemsLoading && activeItems.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow text-left"
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                        <svg className="w-12 h-12 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <span className="text-primary-600 font-bold whitespace-nowrap">
                          {format(item.price)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {item.category.name}
                        </span>
                        {item._count.options > 0 && (
                          <span className="text-xs text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
                            {t('menu.options')}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    {t('locations.previous')}
                  </button>
                  <span className="text-sm text-gray-600">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    {t('locations.next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Item detail modal */}
      {selectedItemId && (
        <MenuItemModal
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </div>
  );
}

function buildItemsUrl(categoryId: string | null, search: string, page: number): string {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', categoryId);
  if (search) params.set('search', search);
  if (page > 1) params.set('page', String(page));
  params.set('limit', '12');
  return `/api/menu/items?${params}`;
}
