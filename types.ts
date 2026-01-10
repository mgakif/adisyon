export type ProductUnit = 'kg' | 'g' | 'qty' | 'portion';
export type ProductType = 'retail' | 'service';
export type ProductCategory = 'nuts' | 'dried_fruit' | 'drinks' | 'dessert' | 'other';
export type OrderStatus = 'pending' | 'preparing' | 'served' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'credit_card';

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: ProductUnit;
  type: ProductType;
  category: ProductCategory;
  image?: string;
  stock?: number;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number; // For kg, this is weight. For qty, this is count.
  unit_price: number;
  total_price: number;
  unit: ProductUnit;
  notes?: string;
}

export interface Order {
  id: string;
  table_id: string | null; // Null implies "Quick Sale" (Kasa Önü)
  status: OrderStatus;
  items: OrderItem[];
  total_amount: number;
  created_at: string;
  order_number: string;
}

export interface Table {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'reserved';
  current_order_id: string | null;
}

// Mimicking Supabase Realtime Payload
export interface RealtimePayload<T> {
  new: T;
  old: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}