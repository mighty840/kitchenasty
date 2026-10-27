import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { slugify } from '../lib/slug.js';
import { api } from '../lib/api.js';

import { useTranslation } from 'react-i18next';

interface OptionValue {
  name: string;
  priceModifier: number;
  isDefault: boolean;
  sortOrder: number;
}

interface MenuOption {
  name: string;
  displayType: 'SELECT' | 'RADIO' | 'CHECKBOX' | 'QUANTITY';
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  values: OptionValue[];
}

interface MenuItemData {
  name: string;
  slug: string;
  description: string;
  price: number;
  taxRate: number;
  surchargeEnabled: boolean;
  surchargeAmount: number;
  isActive: boolean;
  sortOrder: number;
  trackStock: boolean;
  stockQty: number;
  categoryId: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface AllergenOption {
  id: string;
  name: string;
}

interface MealtimeOption {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

const emptyItem: MenuItemData = {
  name: '',
  slug: '',
  description: '',
  price: 0,
  taxRate: 8,
  surchargeEnabled: false,
  surchargeAmount: 0,
  isActive: true,
  sortOrder: 0,
  trackStock: false,
  stockQty: 0,
  categoryId: '',
};

const emptyOptionValue: OptionValue = { name: '', priceModifier: 0, isDefault: false, sortOrder: 0 };
const emptyOption: MenuOption = {
  name: '',
  displayType: 'SELECT',
  isRequired: false,
  minSelect: 0,
  maxSelect: 1,
  sortOrder: 0,
  values: [{ ...emptyOptionValue }],
};

export default function MenuItemForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<MenuItemData>(emptyItem);
  const [options, setOptions] = useState<MenuOption[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedMealtimes, setSelectedMealtimes] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [allergens, setAllergens] = useState<AllergenOption[]>([]);
  const [mealtimes, setMealtimes] = useState<MealtimeOption[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ data: CategoryOption[] }>('/menu/categories'),
      api.get<{ data: AllergenOption[] }>('/menu/allergens'),
      api.get<{ data: MealtimeOption[] }>('/menu/mealtimes'),
    ]).then(([catRes, allRes, mtRes]) => {
      setCategories(catRes.data);
      setAllergens(allRes.data);
      setMealtimes(mtRes.data);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get<{ data: any }>(`/menu/items/${id}`)
      .then((res) => {
        const item = res.data;
        setForm({
          name: item.name,
          slug: item.slug,
          description: item.description || '',
          price: item.price,
          taxRate: item.taxRate,
          surchargeEnabled: item.surchargeEnabled,
          surchargeAmount: item.surchargeAmount,
          isActive: item.isActive,
          sortOrder: item.sortOrder,
          trackStock: item.trackStock,
          stockQty: item.stockQty,
          categoryId: item.categoryId,
        });
        if (item.image) setImageUrl(item.image);
        if (item.options?.length) {
          setOptions(item.options.map((o: any) => ({
            name: o.name,
            displayType: o.displayType,
            isRequired: o.isRequired,
            minSelect: o.minSelect,
            maxSelect: o.maxSelect,
            sortOrder: o.sortOrder,
            values: o.values.map((v: any) => ({
              name: v.name,
              priceModifier: v.priceModifier,
              isDefault: v.isDefault,
              sortOrder: v.sortOrder,
            })),
          })));
        }
        if (item.allergens?.length) {
          setSelectedAllergens(item.allergens.map((a: any) => a.allergenId));
        }
        if (item.mealtimes?.length) {
          setSelectedMealtimes(item.mealtimes.map((m: any) => m.mealtimeId));
        }
        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [id, isEdit]);

  const updateField = (field: keyof MenuItemData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const autoSlug = (name: string) => {
    if (!isEdit) {
      updateField('slug', slugify(name));
    }
  };

  const addOption = () => setOptions((prev) => [...prev, { ...emptyOption, values: [{ ...emptyOptionValue }] }]);
  const removeOption = (index: number) => setOptions((prev) => prev.filter((_, i) => i !== index));

  const updateOption = (index: number, field: keyof MenuOption, value: any) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addOptionValue = (optIndex: number) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[optIndex] = {
        ...updated[optIndex],
        values: [...updated[optIndex].values, { ...emptyOptionValue }],
      };
      return updated;
    });
  };

  const removeOptionValue = (optIndex: number, valIndex: number) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[optIndex] = {
        ...updated[optIndex],
        values: updated[optIndex].values.filter((_, i) => i !== valIndex),
      };
      return updated;
    });
  };

  const updateOptionValue = (optIndex: number, valIndex: number, field: keyof OptionValue, value: any) => {
    setOptions((prev) => {
      const updated = [...prev];
      const values = [...updated[optIndex].values];
      values[valIndex] = { ...values[valIndex], [field]: value };
      updated[optIndex] = { ...updated[optIndex], values };
      return updated;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.upload<{ data: { image: string } }>(`/menu/items/${id}/image`, formData);
      setImageUrl(res.data.image);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleImageRemove = async () => {
    if (!id) return;
    setUploading(true);
    setError(null);
    try {
      await api.delete(`/menu/items/${id}/image`);
      setImageUrl(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = {
        ...form,
        price: Number(form.price),
        taxRate: Number(form.taxRate),
        surchargeAmount: Number(form.surchargeAmount),
        sortOrder: Number(form.sortOrder),
        stockQty: Number(form.stockQty),
        options: options.length > 0 ? options : undefined,
        allergenIds: selectedAllergens,
        mealtimeIds: selectedMealtimes,
      };

      if (isEdit) {
        const { slug: _, ...updateBody } = body;
        await api.patch(`/menu/items/${id}`, updateBody);
      } else {
        await api.post('/menu/items', body);
      }
      navigate('/menu/items');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">{t('pages.menu_item_form.loading')}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {isEdit ? t('pages.menu_item_form.edit_menu_item') : t('pages.menu_item_form.new_menu_item')}
        </h2>
        <button onClick={() => navigate('/menu/items')} className="text-gray-500 hover:text-gray-700 text-sm">

          {t('pages.menu_item_form.back_to_menu_items')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('pages.menu_item_form.basic_information')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.menu_item_form.name')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => { updateField('name', e.target.value); autoSlug(e.target.value); }}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.menu_item_form.slug')}</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                required
                disabled={isEdit}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.menu_item_form.description')}</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.menu_item_form.category')}</label>
              <select
                value={form.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">{t('pages.menu_item_form.select_category')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.menu_item_form.price')}</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                required
                min={0}
                step={0.01}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="item-tax-rate" className="block text-sm font-medium text-gray-700 mb-1">{t('pricing.taxRate')}</label>
              <p className="text-xs text-gray-500 mb-2">{t('pricing.priceIncludesTax')}</p>
              <input id="item-tax-rate" type="number" min={0} max={100} step={0.01} required
                value={form.taxRate} onChange={(e) => updateField('taxRate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.surchargeEnabled}
                  onChange={(e) => updateField('surchargeEnabled', e.target.checked)} />
                {t('pricing.enableSurcharge')}
              </label>
              {form.surchargeEnabled && (
                <div className="mt-2">
                  <label htmlFor="item-surcharge" className="block text-sm font-medium text-gray-700 mb-1">{t('pricing.surchargeAmount')}</label>
                  <input id="item-surcharge" type="number" min={0} step={0.01} required
                    value={form.surchargeAmount} onChange={(e) => updateField('surchargeAmount', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.menu_item_form.sort_order')}</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => updateField('sortOrder', e.target.value)}
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center gap-6 mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => updateField('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{t('pages.menu_item_form.active')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.trackStock}
                  onChange={(e) => updateField('trackStock', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{t('pages.menu_item_form.track_stock')}</span>
              </label>
              {form.trackStock && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">{t('pages.menu_item_form.qty')}</label>
                  <input
                    type="number"
                    value={form.stockQty}
                    onChange={(e) => updateField('stockQty', e.target.value)}
                    min={0}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Image Upload */}
        {isEdit && (
          <section className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('pages.menu_item_form.image')}</h3>
            <div className="flex items-start gap-6">
              {imageUrl ? (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={form.name}
                    className="w-40 h-40 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    disabled={uploading}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50"
                    aria-label={t('pages.menu_item_form.remove_image')}
                  >

                    {t('pages.menu_item_form.x')}
                  </button>
                </div>
              ) : (
                <div className="w-40 h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <span className="text-sm text-gray-400">{t('pages.menu_item_form.no_image')}</span>
                </div>
              )}
              <div>
                <label className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer disabled:opacity-50 transition-colors">
                  {uploading ? t('pages.menu_item_form.uploading') : t('pages.menu_item_form.upload_image')}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-2">{t('pages.menu_item_form.jpeg_png_webp_or_gif_max_5mb')}</p>
              </div>
            </div>
          </section>
        )}

        {/* Menu Options */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{t('pages.menu_item_form.menu_options')}</h3>
            <button type="button" onClick={addOption} className="text-primary-600 hover:text-primary-700 text-sm font-medium">

              {t('pages.menu_item_form.add_option_group')}
            </button>
          </div>
          {options.length === 0 && (
            <p className="text-sm text-gray-400">{t('pages.menu_item_form.no_options_configured_add_option_groups_like_size_topp')}</p>
          )}
          <div className="space-y-6">
            {options.map((opt, optIdx) => (
              <div key={optIdx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">{t('pages.menu_item_form.option_group')}{optIdx + 1}</span>
                  <button type="button" onClick={() => removeOption(optIdx)} className="text-red-500 hover:text-red-700 text-sm">

                    {t('pages.menu_item_form.remove_group')}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('pages.menu_item_form.name')}</label>
                    <input
                      type="text"
                      value={opt.name}
                      onChange={(e) => updateOption(optIdx, 'name', e.target.value)}
                      placeholder={t('pages.menu_item_form.e_g_size')}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('pages.menu_item_form.display_type')}</label>
                    <select
                      value={opt.displayType}
                      onChange={(e) => updateOption(optIdx, 'displayType', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="SELECT">{t('pages.menu_item_form.select')}</option>
                      <option value="RADIO">{t('pages.menu_item_form.radio')}</option>
                      <option value="CHECKBOX">{t('pages.menu_item_form.checkbox')}</option>
                      <option value="QUANTITY">{t('pages.menu_item_form.quantity')}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={opt.isRequired}
                        onChange={(e) => updateOption(optIdx, 'isRequired', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600"
                      />
                      <span className="text-xs text-gray-700">{t('pages.menu_item_form.required')}</span>
                    </label>
                  </div>
                </div>

                {/* Option Values */}
                <div className="ml-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">{t('pages.menu_item_form.values')}</span>
                    <button type="button" onClick={() => addOptionValue(optIdx)} className="text-primary-600 text-xs font-medium">

                      {t('pages.menu_item_form.add_value')}
                    </button>
                  </div>
                  {opt.values.map((val, valIdx) => (
                    <div key={valIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={val.name}
                        onChange={(e) => updateOptionValue(optIdx, valIdx, 'name', e.target.value)}
                        placeholder={t('pages.menu_item_form.value_name')}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">+$</span>
                        <input
                          type="number"
                          value={val.priceModifier}
                          onChange={(e) => updateOptionValue(optIdx, valIdx, 'priceModifier', parseFloat(e.target.value) || 0)}
                          step={0.01}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={val.isDefault}
                          onChange={(e) => updateOptionValue(optIdx, valIdx, 'isDefault', e.target.checked)}
                          className="rounded border-gray-300 text-primary-600"
                        />
                        <span className="text-xs text-gray-500">{t('pages.menu_item_form.default')}</span>
                      </label>
                      {opt.values.length > 1 && (
                        <button type="button" onClick={() => removeOptionValue(optIdx, valIdx)} className="text-red-400 hover:text-red-600 text-xs" aria-label={t('a11y.removeValue', { name: val.name || valIdx + 1 })}>

                          {t('pages.menu_item_form.x')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Allergens & Mealtimes */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allergens */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">{t('pages.menu_item_form.allergens')}</h3>
              {allergens.length === 0 ? (
                <p className="text-sm text-gray-400">{t('pages.menu_item_form.no_allergens_defined')}</p>
              ) : (
                <div className="space-y-2">
                  {allergens.map((a) => (
                    <label key={a.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedAllergens.includes(a.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAllergens((prev) => [...prev, a.id]);
                          } else {
                            setSelectedAllergens((prev) => prev.filter((id) => id !== a.id));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{a.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Mealtimes */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">{t('pages.menu_item_form.mealtimes')}</h3>
              {mealtimes.length === 0 ? (
                <p className="text-sm text-gray-400">{t('pages.menu_item_form.no_mealtimes_defined')}</p>
              ) : (
                <div className="space-y-2">
                  {mealtimes.map((m) => (
                    <label key={m.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMealtimes.includes(m.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMealtimes((prev) => [...prev, m.id]);
                          } else {
                            setSelectedMealtimes((prev) => prev.filter((id) => id !== m.id));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{m.name} ({m.startTime} - {m.endTime})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/menu/items')} className="px-6 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">

            {t('pages.menu_item_form.cancel')}
          </button>
          <button type="submit" disabled={saving} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
            {saving ? t('pages.menu_item_form.saving') : isEdit ? t('pages.menu_item_form.update_item') : t('pages.menu_item_form.create_item')}
          </button>
        </div>
      </form>
    </div>
  );
}
