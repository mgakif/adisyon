import { Product, Table, Order, OrderItem } from '../types';

// --- MOCK DATA ---

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Antep Fıstığı (Duble)', price: 850, unit: 'kg', type: 'retail', category: 'nuts' },
  { id: 'p2', name: 'Kajun Fıstık', price: 600, unit: 'kg', type: 'retail', category: 'nuts' },
  { id: 'p3', name: 'Karışık Lüks', price: 750, unit: 'kg', type: 'retail', category: 'nuts' },
  { id: 'p4', name: 'Kuru Üzüm', price: 200, unit: 'kg', type: 'retail', category: 'dried_fruit' },
  { id: 'p5', name: 'Türk Çayı', price: 25, unit: 'qty', type: 'service', category: 'drinks' },
  { id: 'p6', name: 'Türk Kahvesi', price: 60, unit: 'qty', type: 'service', category: 'drinks' },
  { id: 'p7', name: 'Su (0.5L)', price: 15, unit: 'qty', type: 'service', category: 'drinks' },
  { id: 'p8', name: 'Soda', price: 20, unit: 'qty', type: 'service', category: 'drinks' },
  { id: 'p9', name: 'Lokum (Güllü)', price: 400, unit: 'kg', type: 'retail', category: 'dessert' },
];

const MOCK_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`,
  name: `Masa ${i + 1}`,
  status: 'available',
  current_order_id: null,
}));

// --- STATE STORAGE (Simulating DB) ---
let products = [...MOCK_PRODUCTS];
let tables = [...MOCK_TABLES];
let orders: Order[] = [];

// --- HELPERS ---

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateOrderNumber = () => `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

// --- SERVICE METHODS ---

export const supabaseService = {
  getProducts: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return products;
  },

  saveProduct: async (product: Partial<Product>) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    if (product.id) {
        // Update
        const idx = products.findIndex(p => p.id === product.id);
        if (idx > -1) {
            products[idx] = { ...products[idx], ...product } as Product;
        }
    } else {
        // Insert
        const newProduct = {
            id: generateId(),
            ...product
        } as Product;
        products.push(newProduct);
    }
    return products;
  },

  deleteProduct: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    products = products.filter(p => p.id !== id);
    return products;
  },

  getTables: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return tables;
  },

  getActiveOrders: async () => {
    return orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled');
  },

  // Create or Update an order
  upsertOrder: async (orderPartial: Partial<Order> & { table_id?: string | null }) => {
    let order: Order;
    
    // Check if updating existing order
    const existingIndex = orders.findIndex(o => o.id === orderPartial.id);
    
    if (existingIndex > -1) {
      // Update
      order = { ...orders[existingIndex], ...orderPartial };
      // Recalculate total
      order.total_amount = order.items.reduce((sum, item) => sum + item.total_price, 0);
      orders[existingIndex] = order;
    } else {
      // Create New
      order = {
        id: generateId(),
        order_number: generateOrderNumber(),
        created_at: new Date().toISOString(),
        status: 'pending',
        items: [],
        total_amount: 0,
        table_id: orderPartial.table_id || null, // Ensure table_id is handled
        ...orderPartial
      };
      
      // Calculate total for new order
      order.total_amount = order.items.reduce((sum, item) => sum + item.total_price, 0);
      orders.push(order);

      // If attached to a table, update table status
      if (order.table_id) {
        const tableIndex = tables.findIndex(t => t.id === order.table_id);
        if (tableIndex > -1) {
          tables[tableIndex] = {
             ...tables[tableIndex], 
             status: 'occupied', 
             current_order_id: order.id 
          };
        }
      }
    }

    return order;
  },

  closeOrder: async (orderId: string) => {
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      const order = orders[idx];
      orders[idx] = { ...order, status: 'paid' };
      
      // Free up table if exists
      if (order.table_id) {
        const tIdx = tables.findIndex(t => t.id === order.table_id);
        if (tIdx > -1) {
          tables[tIdx] = { ...tables[tIdx], status: 'available', current_order_id: null };
        }
      }
      return orders[idx];
    }
    throw new Error('Order not found');
  },

  // Mocks the SQL Schema requested in the prompt
  getSchemaSQL: () => `
-- 1. TABLES
CREATE TABLE tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'available', -- available, occupied
  current_order_id UUID -- Relation to active order
);

-- 2. PRODUCTS
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT CHECK (unit IN ('kg', 'qty', 'portion')),
  product_type TEXT CHECK (product_type IN ('retail', 'service')),
  category TEXT,
  stock DECIMAL(10,3) DEFAULT 0
);

-- 3. ORDERS
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL,
  table_id UUID REFERENCES tables(id), -- NULL for Quick Sale (Kasa)
  status TEXT DEFAULT 'pending', -- pending, paid, cancelled
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) -- Who created the order
);

-- 4. ORDER ITEMS (The Critical Part)
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT, -- Snapshot of name at time of sale
  quantity DECIMAL(10,3) NOT NULL, -- Stored as Float: 0.250 for 250g, 2.0 for 2 qty
  unit_price DECIMAL(10,2) NOT NULL, -- Snapshot of price
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  unit TEXT NOT NULL -- 'kg' or 'qty'
);

-- 5. PAYMENTS (Split Payments)
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  amount DECIMAL(10,2) NOT NULL,
  method TEXT CHECK (method IN ('cash', 'credit_card', 'discount')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
  `
};