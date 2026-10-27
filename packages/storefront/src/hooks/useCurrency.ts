import { useCallback } from 'react';
import { formatPrice } from '@kitchenasty/shared';
import { useTheme } from '../context/ThemeContext.js';

export function useCurrency() {
  const { settings } = useTheme();
  const currency = settings.currency;
  const format = useCallback((amount: number) => formatPrice(amount, currency), [currency]);
  return { currency, format };
}
