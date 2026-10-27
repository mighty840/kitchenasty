import { describe, it, expect } from 'vitest';
import { formatPrice, resolveCurrency, DEFAULT_CURRENCY } from '../currency.js';

describe('resolveCurrency', () => {
  it('falls back to defaults', () => {
    expect(resolveCurrency(null)).toEqual(DEFAULT_CURRENCY);
    expect(resolveCurrency({ defaultCurrency: 'xx1' })).toEqual(DEFAULT_CURRENCY);
  });

  it('reads configured values', () => {
    expect(resolveCurrency({ defaultCurrency: 'eur', currencySymbol: '€', currencyPosition: 'after' }))
      .toEqual({ code: 'EUR', symbol: '€', position: 'after' });
  });
});

describe('formatPrice', () => {
  it('formats with the symbol before by default', () => {
    expect(formatPrice(3.5)).toBe('$3.50');
  });

  it('formats with the symbol after', () => {
    expect(formatPrice(3.5, { code: 'EUR', symbol: '€', position: 'after' })).toBe('3.50 €');
  });
});
