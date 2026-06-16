import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'customer' | 'admin';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  pushToken: string | null;
  createdAt: Timestamp | Date;
}

// ── Product options ──────────────────────────────────────────────────────────
export type OptionType = 'single' | 'boolean';

export interface ProductOption {
  id: string;
  question: string;
  type: OptionType;
  choices: string[];     // for 'single' type
  extraPrice: number;    // added when boolean="Sí" or for the single group
  required: boolean;
}

// ── Home sections ─────────────────────────────────────────────────────────────
export interface HomeSection {
  id: string;
  title: string;
  icon?: string;            // emoji shown before the title (fallback if no iconImageUrl)
  iconImageUrl?: string | null; // PNG icon shown before the title (takes priority over emoji)
  color?: string;           // hex background color of the box, e.g. '#C8960A'
  titleColor?: string;      // hex color of the title text
  titleFont?: string;       // font key (see lib/fonts FONT_OPTIONS), undefined = default
  imageUrl: string | null;  // floating drink image
  productIds: string[];
  order: number;
}

// ── Menu ─────────────────────────────────────────────────────────────────────
export type MenuCategory = string;

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  category: MenuCategory;
  price: number;
  available: boolean;
  isFeatured: boolean;
  isFavorite: boolean;
  sortOrder: number;
  imageUrl: string | null;
  options: ProductOption[];
}

// ── Orders ───────────────────────────────────────────────────────────────────
export interface OptionSelection {
  optionId: string;
  question: string;
  answer: string;
  extraPrice: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  selections: OptionSelection[];
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'stripe' | 'clip' | 'cash';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  subtotal: number;
  status: OrderStatus;
  paymentIntentId: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  /** How the order was paid. Older orders without this field are Stripe (app/web). */
  paymentMethod?: PaymentMethod;
  /** Clip PinPad request id (only for counter card orders). */
  clipRequestId?: string;
  /** Amount actually captured by Clip (may include tip). */
  amountPaid?: number;
  /** Last 4 digits of the card, when paid via Clip terminal. */
  cardLastDigits?: string;
  notes: string | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// ── Stand / horario ───────────────────────────────────────────────────────────
export interface DaySchedule {
  closed: boolean;
  open: string;   // "HH:MM" 24h
  close: string;  // "HH:MM" 24h
}

export interface StandSettings {
  /** 'manual' = el admin abre/cierra a mano; 'auto' = según el horario. */
  mode: 'manual' | 'auto';
  /** Estado abierto/cerrado cuando mode === 'manual'. */
  isOpen: boolean;
  /** Override para forzar cerrado en modo automático (festivos, etc.). */
  forceClosed?: boolean;
  /** Horario semanal. 7 entradas, índice 0 = Domingo (JS getDay). */
  schedule?: DaySchedule[];
  location?: string;
  closedMessage?: string;
  updatedAt?: Timestamp | Date;
}
