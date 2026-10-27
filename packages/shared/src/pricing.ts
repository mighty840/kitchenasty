export interface PricedItem {
  price: number;
  quantity: number;
  taxRate: number;
  surchargeEnabled: boolean;
  surchargeAmount: number;
  options: ReadonlyArray<{ priceModifier: number }>;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLineTotals(item: PricedItem) {
  const surchargeAmount = item.surchargeEnabled ? item.surchargeAmount : 0;
  const taxableUnitPrice = roundMoney(
    item.price + item.options.reduce((sum, option) => sum + option.priceModifier, 0),
  );
  const unitPrice = roundMoney(taxableUnitPrice + surchargeAmount);
  const subtotal = roundMoney(unitPrice * item.quantity);
  const taxableSubtotal = roundMoney(taxableUnitPrice * item.quantity);
  const tax = roundMoney(taxableSubtotal * item.taxRate / (100 + item.taxRate));
  return { unitPrice, subtotal, tax, surchargeAmount };
}

export function calculateCartTotals(items: ReadonlyArray<PricedItem>) {
  let subtotal = 0;
  let tax = 0;
  for (const item of items) {
    const line = calculateLineTotals(item);
    subtotal += line.subtotal;
    tax += line.tax;
  }
  return { subtotal: roundMoney(subtotal), tax: roundMoney(tax) };
}
