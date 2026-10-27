export interface CurrencyConfig {
  code: string;
  symbol: string;
  position: 'before' | 'after';
}

export const DEFAULT_CURRENCY: CurrencyConfig = { code: 'USD', symbol: '$', position: 'before' };

/** Builds a currency config from raw general settings, falling back to defaults per field. */
export function resolveCurrency(
  general?: { defaultCurrency?: string; currencySymbol?: string; currencyPosition?: string } | null,
): CurrencyConfig {
  const code = general?.defaultCurrency?.trim().toUpperCase();
  return {
    code: code && /^[A-Z]{3}$/.test(code) ? code : DEFAULT_CURRENCY.code,
    symbol: general?.currencySymbol?.trim() || DEFAULT_CURRENCY.symbol,
    position: general?.currencyPosition === 'after' ? 'after' : 'before',
  };
}

export function formatPrice(amount: number, currency: CurrencyConfig = DEFAULT_CURRENCY): string {
  const value = amount.toFixed(2);
  return currency.position === 'after' ? `${value} ${currency.symbol}` : `${currency.symbol}${value}`;
}
