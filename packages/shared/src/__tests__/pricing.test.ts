import { describe, expect, it } from 'vitest';
import { calculateCartTotals, calculateLineTotals, roundMoney } from '../pricing.js';

const item = {
  price: 10,
  quantity: 2,
  taxRate: 7,
  surchargeEnabled: true,
  surchargeAmount: 0.5,
  options: [{ priceModifier: 2 }],
};

describe('per-item pricing', () => {
  it('extracts included tax from the base price and options, excluding packaging', () => {
    expect(calculateLineTotals(item)).toEqual({
      unitPrice: 12.5, subtotal: 25, tax: 1.57, surchargeAmount: 0.5,
    });
  });

  it('does not charge a disabled surcharge even if its amount is retained', () => {
    expect(calculateLineTotals({ ...item, surchargeEnabled: false })).toEqual({
      unitPrice: 12, subtotal: 24, tax: 1.57, surchargeAmount: 0,
    });
  });

  it('supports tax-free items', () => {
    expect(calculateLineTotals({ ...item, taxRate: 0 }).tax).toBe(0);
  });

  it('sums taxes at each item rate instead of using a global rate', () => {
    expect(calculateCartTotals([
      item,
      { ...item, price: 3, quantity: 1, taxRate: 19, surchargeEnabled: false, options: [] },
    ])).toEqual({ subtotal: 28, tax: 2.05 });
  });

  it('rounds each line tax to cents before summing', () => {
    const smallItem = { ...item, price: 0.06, quantity: 1, taxRate: 10, options: [], surchargeEnabled: false };
    expect(calculateCartTotals([smallItem, smallItem])).toEqual({ subtotal: 0.12, tax: 0.02 });
    expect(roundMoney(1.005)).toBe(1.01);
  });

  it('rounds fractional quantities of currency without floating-point drift', () => {
    expect(calculateLineTotals({
      ...item, price: 0.1, quantity: 3, options: [{ priceModifier: 0.2 }], surchargeEnabled: false,
    })).toEqual({ unitPrice: 0.3, subtotal: 0.9, tax: 0.06, surchargeAmount: 0 });
  });

  it('returns zero totals for an empty cart', () => {
    expect(calculateCartTotals([])).toEqual({ subtotal: 0, tax: 0 });
  });

  it.each([0, 0.5, 10, 100])('does not change tax when packaging costs %s per unit', (surchargeAmount) => {
    const line = calculateLineTotals({ ...item, surchargeAmount });
    const withoutPackaging = calculateLineTotals({ ...item, surchargeEnabled: false });
    expect(line.tax).toBe(withoutPackaging.tax);
    expect(line.subtotal).toBe(roundMoney(withoutPackaging.subtotal + surchargeAmount * item.quantity));
  });

  it('charges no tax on packaging for a free item', () => {
    expect(calculateLineTotals({ ...item, price: 0, options: [], taxRate: 19 })).toEqual({
      unitPrice: 0.5, subtotal: 1, tax: 0, surchargeAmount: 0.5,
    });
  });

  it.each([
    { price: 107, taxRate: 7, tax: 7 },
    { price: 119, taxRate: 19, tax: 19 },
    { price: 200, taxRate: 100, tax: 100 },
    { price: 10, taxRate: 0, tax: 0 },
  ])('keeps the gross price $price unchanged at $taxRate% tax', ({ price, taxRate, tax }) => {
    expect(calculateLineTotals({
      ...item, price, taxRate, quantity: 1, options: [], surchargeEnabled: false,
    })).toEqual({ unitPrice: price, subtotal: price, tax, surchargeAmount: 0 });
  });
});
