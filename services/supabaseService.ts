import { supabase } from '../lib/supabase';
import { Product, Table, Order, OrderItem } from '../types';

export const supabaseService = {
  // --- PRODUCTS ---
  
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    return data as Product[];
  },

  saveProduct: async (product: Partial<Product>) => {
    // Remove id if it's undefined/empty string to let DB handle generation or use specific ID
    const productData = { ...product };
    if (!productData.id) delete productData.id;

    const { data, error } = await supabase
      .from('products')
      .upsert(productData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // --- TABLES ---

  getTables: async (): Promise<Table[]> => {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('name'); // Assuming names are like 'Masa 1', 'Masa 2' sorting might need numeric field
    
    if (error) {
        console.error('Error fetching tables', error);
        return [];
    }
    return data as Table[];
  },

  // --- ORDERS ---

  getActiveOrders: async (): Promise<Order[]> => {
    // Fetch orders that are not paid or cancelled
    // Also fetch their items
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .in('status', ['pending', 'preparing', 'served'])
      .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching active orders', error);
        return [];
    }
    return data as Order[];
  },

  upsertOrder: async (orderPartial: Partial<Order> & { table_id?: string | null }) => {
    // 1. Prepare Order Data
    const orderData = {
        id: orderPartial.id,
        table_id: orderPartial.table_id || null,
        status: orderPartial.status || 'pending',
        total_amount: orderPartial.total_amount || 0,
        // user_id: ... (if auth is implemented)
    };

    // Remove ID if new (let DB generate or use UUID)
    if (!orderData.id) delete orderData.id;

    // 2. Upsert Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .upsert(orderData)
        .select()
        .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Failed to create order');

    // 3. Handle Order Items (Strategy: Delete all and re-insert for simplicity in this edit-mode)
    // In a high-concurrency app, we might want to be more granular, but for POS this ensures exact state match.
    if (orderPartial.items && orderPartial.items.length > 0) {
        // Delete existing items
        await supabase.from('order_items').delete().eq('order_id', order.id);

        // Prepare items with new order_id
        const itemsToInsert = orderPartial.items.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            unit: item.unit,
            // total_price is generated column in DB, don't insert it
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);
        
        if (itemsError) throw itemsError;
    } else if (orderPartial.items && orderPartial.items.length === 0) {
        await supabase.from('order_items').delete().eq('order_id', order.id);
    }

    // 4. Update Table Status if attached
    if (order.table_id) {
        await supabase
            .from('tables')
            .update({ status: 'occupied', current_order_id: order.id })
            .eq('id', order.table_id);
    }

    // 5. Return complete order structure
    return {
        ...order,
        items: orderPartial.items || []
    } as Order;
  },

  closeOrder: async (orderId: string) => {
    // 1. Get the order to find table_id
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('table_id')
        .eq('id', orderId)
        .single();
    
    if (fetchError) throw fetchError;

    // 2. Update Order Status
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);
    
    if (updateError) throw updateError;

    // 3. Free the table
    if (order?.table_id) {
        await supabase
            .from('tables')
            .update({ status: 'available', current_order_id: null })
            .eq('id', order.table_id);
    }
  },

  // Keep SQL schema for reference/setup in UI
  getSchemaSQL: () => `
-- 1. TABLES
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  current_order_id UUID
);

-- 2. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT,
  product_type TEXT,
  category TEXT,
  stock DECIMAL(10,3) DEFAULT 0
);

-- 3. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL,
  table_id UUID REFERENCES tables(id),
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID
);

-- 4. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  unit TEXT NOT NULL
);

-- 5. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  amount DECIMAL(10,2) NOT NULL,
  method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
  `
};