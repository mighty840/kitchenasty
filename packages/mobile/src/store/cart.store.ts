import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateCartTotals } from '@kitchenasty/shared';

export interface CartItemOption {
  optionId: string;
  optionName: string;
  valueId: string;
  valueName: string;
  priceModifier: number;
}

export interface CartItem {
  id: string;
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

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

let nextId = 1;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(item) {
        set((state) => ({
          items: [...state.items, { ...item, id: String(nextId++) }],
        }));
      },

      updateQuantity(id, quantity) {
        if (quantity <= 0) {
          set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
        } else {
          set((state) => ({
            items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
          }));
        }
      },

      removeItem(id) {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      clear() {
        set({ items: [] });
      },

      itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      subtotal() {
        return calculateCartTotals(get().items).subtotal;
      },
    }),
    {
      name: 'kitchenasty-cart',
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as Pick<CartState, 'items'>;
        // Version 0 carts used 8% tax and had no automatic surcharge.
        return { items: state.items.map((item) => ({
          ...item, taxRate: 8, surchargeEnabled: false, surchargeAmount: 0,
        })) };
      },
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
