import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext.js';

interface OptionValue {
  id: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
  sortOrder: number;
}

interface MenuOption {
  id: string;
  name: string;
  displayType: 'SELECT' | 'RADIO' | 'CHECKBOX' | 'QUANTITY';
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  values: OptionValue[];
}

interface Allergen {
  allergen: { id: string; name: string };
}

interface MenuItemDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image: string | null;
  isActive: boolean;
  category: { id: string; name: string };
  options: MenuOption[];
  allergens: Allergen[];
}

interface Props {
  itemId: string;
  onClose: () => void;
}

export default function MenuItemModal({ itemId, onClose }: Props) {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const [item, setItem] = useState<MenuItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/menu/items/${itemId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load item');
        return res.json();
      })
      .then((json) => {
        setItem(json.data);
        // Set defaults
        const defaults: Record<string, string[]> = {};
        for (const opt of json.data.options) {
          const defaultVals = opt.values.filter((v: OptionValue) => v.isDefault).map((v: OptionValue) => v.id);
          if (defaultVals.length > 0) {
            defaults[opt.id] = defaultVals;
          } else if (opt.isRequired && (opt.displayType === 'SELECT' || opt.displayType === 'RADIO')) {
            defaults[opt.id] = [opt.values[0]?.id].filter(Boolean);
          }
        }
        setSelections(defaults);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [itemId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  function handleSelect(optionId: string, valueId: string, displayType: string, maxSelect: number) {
    setSelections((prev) => {
      const current = prev[optionId] || [];
      if (displayType === 'SELECT' || displayType === 'RADIO') {
        return { ...prev, [optionId]: [valueId] };
      }
      // CHECKBOX
      if (current.includes(valueId)) {
        return { ...prev, [optionId]: current.filter((id) => id !== valueId) };
      }
      if (current.length >= maxSelect) {
        return prev;
      }
      return { ...prev, [optionId]: [...current, valueId] };
    });
  }

  function handleAddToCart() {
    if (!item) return;
    const cartOptions = item.options.flatMap((opt) => {
      const selected = selections[opt.id] || [];
      return opt.values
        .filter((v) => selected.includes(v.id))
        .map((v) => ({
          optionId: opt.id,
          optionName: opt.name,
          valueId: v.id,
          valueName: v.name,
          priceModifier: v.priceModifier,
        }));
    });
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      options: cartOptions,
    });
    onClose();
  }

  function calculateTotal(): number {
    if (!item) return 0;
    let total = item.price;
    for (const opt of item.options) {
      const selected = selections[opt.id] || [];
      for (const val of opt.values) {
        if (selected.includes(val.id)) {
          total += val.priceModifier;
        }
      }
    }
    return total * quantity;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-xl max-h-[90vh] overflow-y-auto rounded-t-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-6">
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
            <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:text-gray-700">
              Close
            </button>
          </div>
        )}

        {item && (
          <>
            {/* Image */}
            <div className="h-48 relative">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <svg className="w-16 h-16 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full p-1.5 transition-colors"
                aria-label={t("common.close")}
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
                <span className="text-xl font-bold text-primary-600">${item.price.toFixed(2)}</span>
              </div>

              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {item.category.name}
              </span>

              {item.description && (
                <p className="text-gray-600 mt-3 text-sm">{item.description}</p>
              )}

              {/* Allergens */}
              {item.allergens.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {item.allergens.map((a) => (
                      <span
                        key={a.allergen.id}
                        className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200"
                      >
                        {a.allergen.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              {item.options.length > 0 && (
                <div className="mt-6 space-y-5">
                  {item.options.map((opt) => (
                    <div key={opt.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">{opt.name}</h3>
                        {opt.isRequired && (
                          <span className="text-xs text-red-500 font-medium">{t('common.required')}</span>
                        )}
                      </div>

                      {(opt.displayType === 'SELECT') ? (
                        <select
                          value={(selections[opt.id] || [])[0] || ''}
                          onChange={(e) => handleSelect(opt.id, e.target.value, opt.displayType, opt.maxSelect)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        >
                          {!opt.isRequired && <option value="">None</option>}
                          {opt.values.map((val) => (
                            <option key={val.id} value={val.id}>
                              {val.name}
                              {val.priceModifier !== 0 && ` (+$${val.priceModifier.toFixed(2)})`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-2">
                          {opt.values.map((val) => {
                            const isSelected = (selections[opt.id] || []).includes(val.id);
                            const isRadio = opt.displayType === 'RADIO';
                            return (
                              <label
                                key={val.id}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'border-primary-300 bg-primary-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type={isRadio ? 'radio' : 'checkbox'}
                                  name={`option-${opt.id}`}
                                  checked={isSelected}
                                  onChange={() => handleSelect(opt.id, val.id, opt.displayType, opt.maxSelect)}
                                  className="accent-primary-600"
                                />
                                <span className="text-sm text-gray-900 flex-1">{val.name}</span>
                                {val.priceModifier !== 0 && (
                                  <span className="text-xs text-gray-500">
                                    +${val.priceModifier.toFixed(2)}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity & Add to cart */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    {t('menu.addToCart')} &mdash; ${calculateTotal().toFixed(2)}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
