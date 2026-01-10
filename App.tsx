import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from './services/supabaseService';
import { Product, Table, Order, OrderItem, ProductCategory } from './types';
import { ICONS, CATEGORIES } from './constants';
import WeightModal from './components/WeightModal';
import PaymentModal from './components/PaymentModal';
import ProductFormModal from './components/ProductFormModal';
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime';

// --- SUB-COMPONENTS (Defined locally for single-file constraints in complex parts) ---

// 1. PRODUCT CARD
interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => (
  <button 
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between text-left h-36 transition-all
      ${product.type === 'retail' 
        ? 'bg-amber-50 border-2 border-amber-100 hover:border-amber-300 hover:bg-amber-100 text-amber-900' 
        : 'bg-slate-50 border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-100 text-slate-900'}
      active:scale-95 shadow-sm
    `}
  >
    <div className="flex justify-between items-start w-full">
      <span className="font-bold text-lg leading-tight line-clamp-2">{product.name}</span>
      {product.type === 'retail' ? <ICONS.Retail size={18} className="opacity-40 shrink-0" /> : <ICONS.Service size={18} className="opacity-40 shrink-0" />}
    </div>
    <div className="mt-auto">
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold">{product.price}</span>
        <span className="text-xs opacity-70">₺ / {product.unit}</span>
      </div>
    </div>
  </button>
);

// 2. CART ITEM
interface CartItemRowProps {
  item: OrderItem;
  onRemove: () => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item, onRemove }) => (
  <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm animate-in slide-in-from-right-2">
    <div className="flex-1">
      <div className="font-medium text-slate-900">{item.product_name}</div>
      <div className="text-xs text-slate-500 mt-0.5">
        {item.unit === 'kg' 
          ? (
            <span className="flex items-center gap-1">
               <span className="font-bold text-slate-700 text-sm">{(item.quantity * 1000).toFixed(0)} g</span>
               <span className="text-slate-400 text-xs">x {item.unit_price} ₺/kg</span>
            </span>
          )
          : (
            <span>{item.quantity} Adet x {item.unit_price} ₺</span>
          )
        }
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="font-bold text-slate-800">{item.total_price?.toFixed(2) || '0.00'} ₺</span>
      <button 
        onClick={onRemove}
        className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-full transition"
      >
        <ICONS.Delete size={18} />
      </button>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  // State
  const [view, setView] = useState<'tables' | 'pos' | 'orders' | 'schema' | 'products'>('tables');
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  
  // Cart / Order State
  const [currentOrder, setCurrentOrder] = useState<Partial<Order>>({ items: [], total_amount: 0 });
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  
  // Modals
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [selectedProductForWeight, setSelectedProductForWeight] = useState<Product | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Product Management Modal
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Load Data
  const refreshData = useCallback(async () => {
    // Only refresh background data if not in the middle of a transaction to avoid UI jumps
    // Or optimize to only merge changes. For MVP, full refresh is safer for consistency.
    const [p, t] = await Promise.all([
      supabaseService.getProducts(),
      supabaseService.getTables()
    ]);
    setProducts(p);
    setTables(t);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Hook up Realtime
  useSupabaseRealtime(() => {
    // If table status changes from another device, update our view
    refreshData();
  });

  // --- ACTIONS ---

  const handleTableSelect = async (tableId: string | null) => {
    setActiveTableId(tableId);
    
    // Check if table has active order
    if (tableId) {
      const table = tables.find(t => t.id === tableId);
      if (table?.current_order_id) {
        // Fetch existing order from DB
        const activeOrders = await supabaseService.getActiveOrders();
        const existing = activeOrders.find(o => o.id === table.current_order_id);
        if (existing) {
            setCurrentOrder(existing);
            setCartItems(existing.items || []);
            setView('pos');
            return;
        }
      }
    }
    
    // New Order or Quick Sale
    setCurrentOrder({ 
        table_id: tableId, 
        items: [], 
        total_amount: 0,
        status: 'pending' 
    });
    setCartItems([]);
    setView('pos');
  };

  const handleProductClick = (product: Product) => {
    if (product.unit === 'kg') {
      setSelectedProductForWeight(product);
      setWeightModalOpen(true);
    } else {
      addToCart(product, 1);
    }
  };

  const addToCart = (product: Product, quantity: number) => {
    const newItem: OrderItem = {
      id: crypto.randomUUID(), // Temp ID for UI
      product_id: product.id,
      product_name: product.name,
      quantity: quantity,
      unit_price: product.price,
      total_price: product.price * quantity,
      unit: product.unit
    };

    setCartItems(prev => {
        if (product.unit === 'qty') {
            const existingIdx = prev.findIndex(i => i.product_id === product.id);
            if (existingIdx > -1) {
                const updated = [...prev];
                updated[existingIdx] = {
                    ...updated[existingIdx],
                    quantity: updated[existingIdx].quantity + quantity,
                    total_price: (updated[existingIdx].quantity + quantity) * updated[existingIdx].unit_price
                };
                return updated;
            }
        }
        return [...prev, newItem];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(i => i.id !== itemId));
  };

  const saveOrder = async () => {
    if (cartItems.length === 0) return;
    
    try {
        const orderPayload = {
            ...currentOrder,
            items: cartItems,
            total_amount: cartItems.reduce((acc, i) => acc + (i.total_price || 0), 0)
        };
        
        const savedOrder = await supabaseService.upsertOrder(orderPayload);
        setCurrentOrder(savedOrder);
        setCartItems(savedOrder.items); // Sync with saved state
        
        // Refresh tables immediately
        await refreshData();
        
        alert('Sipariş Kaydedildi / Mutfakta!');
    } catch (error) {
        console.error("Save failed", error);
        alert('Hata: Sipariş kaydedilemedi.');
    }
  };

  const handlePaymentComplete = async () => {
    if (currentOrder.id) {
        try {
            await supabaseService.closeOrder(currentOrder.id);
            setPaymentModalOpen(false);
            setCartItems([]);
            setCurrentOrder({});
            setActiveTableId(null);
            
            await refreshData();
            setView('tables');
        } catch (error) {
            console.error("Payment failed", error);
            alert('Hata: Ödeme tamamlanamadı.');
        }
    }
  };

  // Product Management Actions
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
        await supabaseService.saveProduct(productData);
        await refreshData();
    } catch (e) {
        alert('Ürün kaydedilemedi');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
        try {
            await supabaseService.deleteProduct(id);
            await refreshData();
        } catch (e) {
            alert('Silinemedi');
        }
    }
  };

  // --- RENDER HELPERS ---

  const filteredProducts = products.filter(p => 
    selectedCategory === 'all' || p.category === selectedCategory
  );

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.total_price || 0), 0);

  // --- VIEWS ---

  const renderTablesView = () => (
    <div className="p-6 overflow-y-auto h-full bg-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Masa Seçimi</h2>
        <button 
          onClick={() => handleTableSelect(null)} 
          className="bg-orange-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-orange-700 font-bold flex items-center gap-2"
        >
          <ICONS.Retail />
          Hızlı Satış (Kasa Önü)
        </button>
      </div>
      
      {tables.length === 0 ? (
          <div className="text-center p-10 text-slate-400">
              <p>Masa bulunamadı. Lütfen önce veritabanına masa ekleyin veya Schema sekmesini kontrol edin.</p>
          </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map(table => (
            <button
                key={table.id}
                onClick={() => handleTableSelect(table.id)}
                className={`
                h-32 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all relative
                ${table.status === 'occupied' 
                    ? 'bg-red-50 border-red-200 text-red-800 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 shadow-sm'}
                `}
            >
                <ICONS.Table size={32} />
                <span className="font-bold">{table.name}</span>
                {table.status === 'occupied' && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
            </button>
            ))}
        </div>
      )}
    </div>
  );

  const renderPOSView = () => (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-slate-50">
      {/* Left: Products Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Categories */}
        <div className="p-2 bg-white border-b border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => handleProductClick(p)} />
            ))}
            {filteredProducts.length === 0 && (
                <div className="col-span-full text-center p-10 text-slate-400">
                    Ürün bulunamadı.
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart Drawer */}
      <div className="w-full md:w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl z-20">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex flex-col">
            <h3 className="font-bold text-slate-800">
                {activeTableId ? tables.find(t => t.id === activeTableId)?.name : 'Hızlı Satış'}
            </h3>
            <span className="text-xs text-slate-500">#{currentOrder.order_number || 'YENİ'}</span>
          </div>
          <button onClick={() => setView('tables')} className="p-2 text-slate-400 hover:text-slate-600">
            <ICONS.Close />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <ICONS.Retail size={48} className="mb-2" />
                <p>Sepet Boş</p>
            </div>
          ) : (
            cartItems.map(item => <CartItemRow key={item.id} item={item} onRemove={() => removeFromCart(item.id)} />)
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4">
                <span className="text-slate-500">Toplam</span>
                <span className="text-3xl font-bold text-emerald-600">{cartTotal.toFixed(2)} ₺</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={saveOrder}
                    className="py-3 px-4 bg-orange-100 text-orange-700 font-bold rounded-xl hover:bg-orange-200 transition"
                >
                    Siparişi Yaz
                </button>
                <button 
                    onClick={() => {
                        if (cartItems.length > 0) {
                            if (!currentOrder.id) {
                                saveOrder().then(() => setPaymentModalOpen(true));
                            } else {
                                setPaymentModalOpen(true);
                            }
                        }
                    }}
                    disabled={cartItems.length === 0}
                    className="py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-200"
                >
                    ÖDEME AL
                </button>
            </div>
        </div>
      </div>
    </div>
  );

  const renderProductsView = () => (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="bg-white p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Ürün Yönetimi</h2>
            <button 
                onClick={() => {
                    setEditingProduct(null);
                    setProductFormOpen(true);
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 transition"
            >
                <ICONS.Plus size={20} />
                Yeni Ürün Ekle
            </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600">Ürün Adı</th>
                            <th className="p-4 font-semibold text-slate-600">Kategori</th>
                            <th className="p-4 font-semibold text-slate-600">Tür</th>
                            <th className="p-4 font-semibold text-slate-600">Fiyat</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition">
                                <td className="p-4 font-medium text-slate-800">{p.name}</td>
                                <td className="p-4 text-slate-600">
                                    {CATEGORIES.find(c => c.id === p.category)?.label || p.category}
                                </td>
                                <td className="p-4 text-slate-600">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${p.type === 'retail' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {p.type === 'retail' ? 'Perakende' : 'Hizmet'}
                                    </span>
                                </td>
                                <td className="p-4 font-bold text-emerald-600">{p.price.toFixed(2)} ₺ / {p.unit}</td>
                                <td className="p-4 text-right space-x-2">
                                    <button 
                                        onClick={() => {
                                            setEditingProduct(p);
                                            setProductFormOpen(true);
                                        }}
                                        className="text-blue-600 hover:bg-blue-50 p-2 rounded transition"
                                    >
                                        Düzenle
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteProduct(p.id)}
                                        className="text-red-600 hover:bg-red-50 p-2 rounded transition"
                                    >
                                        Sil
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
  );

  const renderSchema = () => (
      <div className="p-8 h-full overflow-y-auto bg-slate-900 text-slate-300 font-mono">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
            <h1 className="text-xl text-emerald-400">Database Schema (Supabase/PostgreSQL)</h1>
            <button onClick={() => setView('tables')} className="bg-slate-700 px-4 py-2 rounded text-white hover:bg-slate-600">Close</button>
          </div>
          <p className="text-slate-400 mb-4">Aşağıdaki SQL komutlarını Supabase SQL Editor'de çalıştırarak tabloları oluşturun.</p>
          <pre className="whitespace-pre-wrap text-sm">
            {supabaseService.getSchemaSQL()}
          </pre>
      </div>
  );

  // --- MAIN LAYOUT ---

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      {/* Sidebar Nav */}
      <nav className="w-20 bg-slate-900 flex flex-col items-center py-6 gap-8 z-30 shrink-0">
        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
            K
        </div>
        <div className="flex flex-col gap-6 w-full">
            <button onClick={() => setView('tables')} className={`p-3 w-full flex justify-center border-l-4 transition-all ${view === 'tables' || view === 'pos' ? 'border-emerald-500 text-emerald-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-white'}`}>
                <ICONS.Retail size={24} />
            </button>
            <button onClick={() => setView('products')} className={`p-3 w-full flex justify-center border-l-4 transition-all ${view === 'products' ? 'border-emerald-500 text-emerald-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-white'}`}>
                <ICONS.Package size={24} />
            </button>
            <button onClick={() => setView('schema')} className={`p-3 w-full flex justify-center border-l-4 transition-all ${view === 'schema' ? 'border-emerald-500 text-emerald-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-white'}`}>
                <ICONS.Settings size={24} />
            </button>
        </div>
        <div className="mt-auto">
            <button className="p-3 text-red-400 hover:text-red-300"><ICONS.Logout size={24} /></button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden relative">
        {view === 'tables' && renderTablesView()}
        {view === 'pos' && renderPOSView()}
        {view === 'schema' && renderSchema()}
        {view === 'products' && renderProductsView()}
      </main>

      {/* Modals */}
      <WeightModal 
        isOpen={weightModalOpen}
        product={selectedProductForWeight}
        onClose={() => setWeightModalOpen(false)}
        onConfirm={addToCart}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        order={currentOrder as Order}
        onClose={() => setPaymentModalOpen(false)}
        onComplete={handlePaymentComplete}
      />

      <ProductFormModal
        isOpen={productFormOpen}
        initialData={editingProduct}
        onClose={() => setProductFormOpen(false)}
        onSave={handleSaveProduct}
      />
    </div>
  );
}