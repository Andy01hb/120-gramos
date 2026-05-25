export type UserRole = 'customer' | 'admin';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  pushToken: string | null;
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  flavors: string[];
  addBoba: boolean;
  unitPrice: number;
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  subtotal: number;
  status: OrderStatus;
  paymentIntentId: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type MenuCategory = 'iced_coffee' | 'matcha' | 'otras';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  available: boolean;
  flavors: string[];
  hasBoba: boolean;
  isFeatured: boolean;
  sortOrder: number;
  imageUrl: string | null;
}
