import { supabase, isMockMode } from '../lib/supabase';
import { Product, Table, Order, OrderItem } from '../types';

// --- MOCK DATA FOR DEMO MODE ---
let MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Antep Fıstığı', price: 650, unit: 'kg', type: 'retail', category: 'nuts' },
  { id: '2', name: 'Karışık Lüks', price: 450, unit: 'kg', type: 'retail', category: 'nuts' },
  { id: '3', name: 'Kuru İncir', price: 320, unit: 'kg', type: 'retail', category: 'dried_fruit' },
  { id: '4', name: 'Çay (Bardak)', price: 15, unit: 'qty', type: 'service', category: 'drinks' },
  { id: '5', name: 'Türk Kahvesi', price: 50, unit: 'qty', type: 'service', category: 'drinks' },
  { id: '6', name: 'Limonata', price: 60, unit: 'qty', type: 'service', category: 'drinks' },
  { id: '7', name: 'Çifte Kavrulmuş Lokum', price: 280, unit: 'kg', type: 'retail', category: 'dessert' },
];

let MOCK_TABLES: Table[] = [
  { id: 't1', name: 'Masa 1', status: 'available', current_order_id: null },
  { id: 't2', name: 'Masa 2', status: 'available', current_order_id: null },
  { id: 't3', name: 'Masa 3', status: 'available', current_order_id: null },
  { id: 't4', name: 'Masa 4', status: 'available', current_order_id: null },
  { id: 't5', name: 'Bahçe 1', status: 'available', current_order_id: null },
  { id: 't6', name: 'Bahçe 2', status: 'available', current_order_id: null },
];

let MOCK_ORDERS: Order[] = [];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const supabaseService = {
  // --- AUTH ---
  signIn: async (email: string, password: string) => {
    if (isMockMode) {
      await delay(500);
      // Accept any login in mock mode
      return { user: { email, role: 'admin' }, error: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, error };
  },

  signOut: async () => {
    if (isMockMode) return;
    await supabase.auth.signOut();
  },

  getCurrentUser: async () => {
    if (isMockMode) return { email: 'demo@admin.com', role: 'admin' };
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  // --- PRODUCTS ---
  
  getProducts: async (): Promise<Product[]> => {
    if (isMockMode) {
      await delay(300);
      return [...MOCK_PRODUCTS];
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    
    // DB'deki 'product_type' kolonunu Frontend'deki 'type' alanına eşle
    return data.map((item: any) => ({
        ...item,
        type: item.product_type || item.type
    })) as Product[];
  },

  saveProduct: async (product: Partial<Product>) => {
    if (isMockMode) {
      await delay(300);
      const newProduct = {
        ...product,
        id: product.id || Math.random().toString(36).substr(2, 9)
      } as Product;
      
      const index = MOCK_PRODUCTS.findIndex(p => p.id === newProduct.id);
      if (index >= 0) {
        MOCK_PRODUCTS[index] = newProduct;
      } else {
        MOCK_PRODUCTS.push(newProduct);
      }
      return newProduct;
    }

    // Prepare payload for DB
    const productData: any = { ...product };
    
    // Frontend'deki 'type' alanını DB'deki 'product_type' kolonuna çevir
    if (productData.type) {
        productData.product_type = productData.type;
        delete productData.type; // DB'de 'type' diye bir kolon yok, siliyoruz
    }

    // Remove id if it's undefined/empty string to let DB handle generation or use specific ID
    if (!productData.id) delete productData.id;

    const { data, error } = await supabase
      .from('products')
      .upsert(productData)
      .select()
      .single();

    if (error) throw error;
    
    // Return ederken tekrar frontend formatına çevir
    const savedProduct = data as any;
    return {
        ...savedProduct,
        type: savedProduct.product_type
    } as Product;
  },

  deleteProduct: async (id: string) => {
    if (isMockMode) {
      MOCK_PRODUCTS = MOCK_PRODUCTS.filter(p => p.id !== id);
      return;
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // --- TABLES ---

  getTables: async (): Promise<Table[]> => {
    if (isMockMode) {
      await delay(300);
      return [...MOCK_TABLES];
    }

    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('name'); 
    
    if (error) {
        console.error('Error fetching tables', error);
        return [];
    }
    return data as Table[];
  },

  saveTable: async (table: Partial<Table>) => {
    if (isMockMode) {
      const newTable = {
        ...table,
        id: table.id || Math.random().toString(36).substr(2, 9),
        status: table.status || 'available'
      } as Table;
      MOCK_TABLES.push(newTable);
      return newTable;
    }

    const tableData = { ...table };
    if (!tableData.id) delete tableData.id;

    const { data, error } = await supabase
        .from('tables')
        .upsert(tableData)
        .select()
        .single();
    
    if (error) throw error;
    return data;
  },

  deleteTable: async (id: string) => {
    if (isMockMode) {
      MOCK_TABLES = MOCK_TABLES.filter(t => t.id !== id);
      return;
    }

    const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
  },

  // --- ORDERS ---

  getActiveOrders: async (): Promise<Order[]> => {
    if (isMockMode) {
      return MOCK_ORDERS.filter(o => ['pending', 'preparing', 'served'].includes(o.status));
    }

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
    if (isMockMode) {
      await delay(500);
      let order = MOCK_ORDERS.find(o => o.id === orderPartial.id);
      
      if (!order) {
        // Create new
        order = {
          id: orderPartial.id || Math.random().toString(36).substr(2, 9),
          table_id: orderPartial.table_id || null,
          status: orderPartial.status || 'pending',
          total_amount: orderPartial.total_amount || 0,
          created_at: new Date().toISOString(),
          order_number: Math.floor(Math.random() * 1000).toString(),
          items: []
        } as Order;
        MOCK_ORDERS.push(order);
      } else {
        // Update existing
        order.status = orderPartial.status || order.status;
        order.total_amount = orderPartial.total_amount || order.total_amount;
      }

      // Update Items
      if (orderPartial.items) {
        order.items = orderPartial.items.map(item => ({
          ...item,
          order_id: order!.id
        }));
      }

      // Update Table
      if (order.table_id) {
        const table = MOCK_TABLES.find(t => t.id === order!.table_id);
        if (table) {
          table.status = 'occupied';
          table.current_order_id = order.id;
        }
      }

      return order;
    }

    // --- REAL IMPLEMENTATION ---
    
    // 1. Prepare Order Data
    const orderData = {
        id: orderPartial.id,
        table_id: orderPartial.table_id || null,
        status: orderPartial.status || 'pending',
        total_amount: orderPartial.total_amount || 0,
    };

    if (!orderData.id) delete orderData.id;

    // 2. Upsert Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .upsert(orderData)
        .select()
        .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Failed to create order');

    // 3. Handle Order Items
    if (orderPartial.items && orderPartial.items.length > 0) {
        await supabase.from('order_items').delete().eq('order_id', order.id);

        const itemsToInsert = orderPartial.items.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            unit: item.unit,
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);
        
        if (itemsError) throw itemsError;
    } else if (orderPartial.items && orderPartial.items.length === 0) {
        await supabase.from('order_items').delete().eq('order_id', order.id);
    }

    // 4. Update Table Status
    if (order.table_id) {
        await supabase
            .from('tables')
            .update({ status: 'occupied', current_order_id: order.id })
            .eq('id', order.table_id);
    }

    return {
        ...order,
        items: orderPartial.items || []
    } as Order;
  },

  closeOrder: async (orderId: string) => {
    if (isMockMode) {
      await delay(300);
      const order = MOCK_ORDERS.find(o => o.id === orderId);
      if (order) {
        order.status = 'paid';
        if (order.table_id) {
          const table = MOCK_TABLES.find(t => t.id === order.table_id);
          if (table) {
            table.status = 'available';
            table.current_order_id = null;
          }
        }
      }
      return;
    }

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