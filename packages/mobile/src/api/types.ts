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

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  loyaltyPoints?: number;
}

export interface AuthLoginData {
  token: string;
  customer: User;
}

export interface AuthMeData {
  type: 'customer';
  customer: User;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  parentId: string | null;
  children: Category[];
  _count: { menuItems: number };
}

export interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image: string | null;
  isActive: boolean;
  trackStock: boolean;
  stockQty: number;
  orderType: 'DELIVERY' | 'PICKUP' | null;
  category: { id: string; name: string };
  _count: { options: number; allergens: number; mealtimes: number };
}

export interface MenuItemDetail extends MenuItem {
  options: MenuOption[];
  allergens: { allergen: { id: string; name: string } }[];
}

export interface MenuOption {
  id: string;
  name: string;
  displayType: 'SELECT' | 'RADIO' | 'CHECKBOX' | 'QUANTITY';
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  values: MenuOptionValue[];
}

export interface MenuOptionValue {
  id: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string;
  city: string;
  state: string | null;
  postalCode: string;
  image: string | null;
  isActive: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  isBusy: boolean;
  busyMessage: string | null;
  operatingHours: OperatingHour[];
}

export interface OperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  comment: string | null;
  options: { id: string; name: string; value: string; priceModifier: number }[];
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  comment: string | null;
  scheduledAt: string | null;
  createdAt: string;
  location: { id: string; name: string };
  items: OrderItem[];
}

export interface Reservation {
  id: string;
  date: string;
  time: string;
  partySize: number;
  status: string;
  comment: string | null;
  location: { id: string; name: string };
  createdAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
