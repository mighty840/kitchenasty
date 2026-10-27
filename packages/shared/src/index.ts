// Shared types and constants for KitchenAsty
export * from './pricing.js';
export * from './currency.js';

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'picked_up',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const RESERVATION_STATUSES = [
  'pending',
  'confirmed',
  'seated',
  'completed',
  'cancelled',
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const ORDER_TYPES = ['delivery', 'pickup'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const STAFF_ROLES = ['super_admin', 'manager', 'staff'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const COUPON_TYPES = ['percentage', 'fixed', 'free_delivery'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const MENU_OPTION_DISPLAY_TYPES = [
  'select',
  'radio',
  'checkbox',
  'quantity',
] as const;
export type MenuOptionDisplayType = (typeof MENU_OPTION_DISPLAY_TYPES)[number];

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
