import { formatPrice, type CurrencyConfig } from '@kitchenasty/shared';
import { useSettingsStore } from '../store/settings.store';

export function formatCurrency(amount: number, currency?: CurrencyConfig): string {
  return formatPrice(amount, currency ?? useSettingsStore.getState().settings.currency);
}

/** Subscribes the calling screen to currency changes so formatCurrency output refreshes after settings load. */
export function useCurrency(): CurrencyConfig {
  return useSettingsStore((state) => state.settings.currency);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
