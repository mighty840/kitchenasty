import React, { createContext, useContext, useState, useCallback } from 'react';
import { calculateCartTotals } from '@kitchenasty/shared';

export interface CartItemOption {
  optionId: string;
  optionName: string;
  valueId: string;
  valueName: string;
  priceModifier: number;
}

export interface CartItem {
  id: string; // unique cart line ID
  menuItemId: string;
  name: string;
  price: number;
  taxRate: number;
  surchargeEnabled: boolean;
  surchargeAmount: number;
  quantity: number;
  options: CartItemOption[];
  comment?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  itemCount: number;
  subtotal: number;
  tax: number;
}

const CartContext = createContext<CartContextType | null>(null);

let nextId = 1;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    setItems((prev) => [...prev, { ...item, id: String(nextId++) }]);
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const { subtotal, tax } = calculateCartTotals(items);

  return (
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addItem, updateQuantity, removeItem, clear, itemCount, subtotal, tax }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
