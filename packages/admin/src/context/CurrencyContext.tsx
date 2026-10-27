import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_CURRENCY, formatPrice, type CurrencyConfig } from '@kitchenasty/shared';

interface CurrencyContextType {
  currency: CurrencyConfig;
  format: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: DEFAULT_CURRENCY,
  format: (amount) => formatPrice(amount),
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyConfig>(DEFAULT_CURRENCY);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.currency) setCurrency(json.data.currency);
      })
      .catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ currency, format: (amount: number) => formatPrice(amount, currency) }),
    [currency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
