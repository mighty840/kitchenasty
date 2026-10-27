import { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../hooks/useCurrency.js';
import { useCart } from '../context/CartContext.js';
import { calculateLineTotals } from '@kitchenasty/shared';

export default function CartDrawer() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clear, subtotal } = useCart();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    },
    [setIsOpen]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setIsOpen(false)}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{t('cart.title')}</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            aria-label={t('cart.close')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <p className="text-gray-500">{t('cart.empty')}</p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                {t('cart.browsMenu')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const line = calculateLineTotals(item);
                return (
                  <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-100">
                    {/* Item info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                      {line.surchargeAmount > 0 && (
                        <p className="text-xs text-gray-500">{t('pricing.surcharge')}: {format(line.surchargeAmount)} / {t('pricing.unit')}</p>
                      )}
                      {item.options.length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.options.map((o) => o.valueName).join(', ')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-2 text-xs text-red-500 hover:text-red-700"
                        >
                          {t('cart.remove')}
                        </button>
                      </div>
                    </div>
                    {/* Price */}
                    <div className="text-sm font-medium text-gray-900">
                      {format(line.subtotal)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('cart.subtotal')}</span>
              <span className="font-semibold text-gray-900">{format(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => setIsOpen(false)}
              className="block text-center bg-primary-600 text-white py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              {t('cart.checkout')}
            </Link>
            <button
              onClick={clear}
              className="block w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              {t('common.delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
