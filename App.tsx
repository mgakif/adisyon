import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from './services/supabaseService';
import { Product, Table, Order, OrderItem, ProductCategory } from './types';
import { ICONS, CATEGORIES } from './constants';
import WeightModal from './components/WeightModal';
import PaymentModal from './components/PaymentModal';
import ProductFormModal from './components/ProductFormModal';
import TableFormModal from './components/TableFormModal'; 
import Login from './components/Login';
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime';

// --- SUB-COMPONENTS ---

// 1. PRODUCT CARD
interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => (
  <button 
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-xl p-3 flex flex-col justify-between text-left h-28 transition-all
      ${product.type === 'retail' 
        ? 'bg-amber-50 border-2 border-amber-100 hover:border-amber-300 hover:bg-amber-100 text-amber-900' 
        : 'bg-slate-50 border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-100 text-slate-900'}
      active:scale-95 shadow-sm
    `}
  >
    <div className="flex justify-between items-start w-full gap-1 overflow-hidden">
      <span className="font-bold text-sm leading-tight whitespace-nowrap truncate flex-1 block">
        {product.name}
      </span>
      {product.type === 'retail' ? <ICONS.Retail size={14} className="opacity-30 shrink-0" /> : <ICONS.Service size={14} className="opacity-30 shrink-0" />}
    </div>
    <div className="mt-auto">
      <div className="flex items-baseline gap-1 whitespace-nowrap">
        <span className="text-lg font-bold">{product.price}</span>
        <span className="text-[10px] opacity-70">₺/{product.unit}</span>
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
    <div className="flex-1 overflow-hidden">
      <div className="font-medium text-slate-900 whitespace-nowrap truncate pr-2">{item.product_name}</div>
      <div className="text-xs text-slate-500 mt-0.5">
        {item.unit === 'kg' 
          ? (
            <span className="flex items-center gap-1">
               <span className="font-bold text-slate-700 text-sm">{(item.quantity * 1000).toFixed(0)} g</span>
               <span className="text-slate-400 text-[10px]">x {item.unit_price} ₺/kg</span>
            </span>
          )
          : (
            <span>{item.quantity} Adet x {item.unit_price} ₺</span>
          )
        }
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="font-bold text-slate-800 whitespace-nowrap">{item.total_price?.toFixed(2) || '0.00'} ₺</span>
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
  // Auth State
  const [session, setSession] = useState<any>(null);

  // App State
  const [view, setView] = useState<'tables' | 'pos' | 'orders' | 'schema' | 'management'>('tables');
  const [managementTab, setManagementTab] = useState<'products' | 'tables'>('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Table Management Modal
  const [tableFormOpen, setTableFormOpen] = useState(false);

  // Check Auth on Mount
  useEffect(() => {
    supabaseService.getCurrentUser().then(user => {
        if (user) setSession(user);
    });
  }, []);

  // Load Data
  const refreshData = useCallback(async () => {
    const [p, t] = await Promise.all([
      supabaseService.getProducts(),
      supabaseService.getTables()
    ]);
    setProducts(p);
    setTables(t);
  }, []);

  useEffect(() => {
    if (session) refreshData();
  }, [refreshData, session]);

  // Hook up Realtime
  useSupabaseRealtime(() => {
    if (session) refreshData();
  });

  // --- AUTH ACTIONS ---
  const handleLogout = async () => {
    await supabaseService.signOut();
    setSession(null);
  };

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
        console.error(e);
        alert('Ürün kaydedilemedi: ' + (e as any).message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
        try {
            await supabaseService.deleteProduct(id);
            await refreshData();
        } catch (e) {
             console.error(e);
            alert('Silinemedi: ' + (e as any).message);
        }
    }
  };

  // Table Management Actions
  const handleSaveTable = async (tableData: Partial<Table>) => {
    try {
        await supabaseService.saveTable(tableData);
        await refreshData();
    } catch (e) {
         console.error(e);
        alert('Masa kaydedilemedi: ' + (e as any).message);
    }
  };

  const handleDeleteTable = async (e: React.MouseEvent, table: Table) => {
    e.stopPropagation();
    if (table.status === 'occupied') {
        alert('Dolu masa silinemez!');
        return;
    }
    if (window.confirm(`${table.name} silinecek. Emin misiniz?`)) {
        try {
            await supabaseService.deleteTable(table.id);
            await refreshData();
        } catch (e) {
             console.error(e);
            alert('Silinemedi: ' + (e as any).message);
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
    <div className="p-4 md:p-6 overflow-y-auto h-full bg-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Masa Seçimi</h2>
        <div className="flex gap-4">
            <button 
                onClick={() => handleTableSelect(null)} 
                className="bg-orange-600 text-white px-4 py-3 md:px-6 md:py-3 rounded-xl shadow-lg hover:bg-orange-700 font-bold flex items-center gap-2 transition-transform active:scale-95 text-sm md:text-base"
            >
                <ICONS.Retail size={18} />
                Hızlı Satış
            </button>
        </div>
      </div>
      
      {tables.length === 0 ? (
          <div className="text-center p-10 text-slate-400">
              <p>Masa bulunamadı. "Yönetim" panelinden yeni masa oluşturun.</p>
          </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {tables.map(table => (
            <button
                key={table.id}
                onClick={() => handleTableSelect(table.id)}
                className={`
                h-28 md:h-32 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all relative group shadow-sm
                ${table.status === 'occupied' 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600'}
                active:scale-95
                `}
            >
                <ICONS.Table size={28} className="md:w-8 md:h-8" />
                <span className="font-bold text-sm md:text-base">{table.name}</span>
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
        <div className="p-2 bg-white border-b border-slate-200 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
      <div className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl z-20 shrink-0">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex flex-col overflow-hidden">
            <h3 className="font-bold text-slate-800 whitespace-nowrap truncate">
                {activeTableId ? tables.find(t => t.id === activeTableId)?.name : 'Hızlı Satış'}
            </h3>
            <span className="text-[10px] text-slate-500">#{currentOrder.order_number || 'YENİ'}</span>
          </div>
          <button onClick={() => setView('tables')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <ICONS.Close size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <ICONS.Retail size={40} className="mb-2" />
                <p className="text-sm">Sepet Boş</p>
            </div>
          ) : (
            cartItems.map(item => <CartItemRow key={item.id} item={item} onRemove={() => removeFromCart(item.id)} />)
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-3">
                <span className="text-slate-500 text-sm">Toplam</span>
                <span className="text-2xl font-bold text-emerald-600">{cartTotal.toFixed(2)} ₺</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={saveOrder}
                    className="py-3 px-2 bg-orange-100 text-orange-700 text-sm font-bold rounded-xl hover:bg-orange-200 transition"
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
                    className="py-3 px-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-200"
                >
                    ÖDEME AL
                </button>
            </div>
        </div>
      </div>
    </div>
  );

  const renderManagementView = () => (
      <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
        <div className="bg-white p-4 md:p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
            <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">Yönetim</h2>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setManagementTab('products')}
                        className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-bold transition-all ${managementTab === 'products' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Ürünler
                    </button>
                    <button 
                         onClick={() => setManagementTab('tables')}
                         className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-bold transition-all ${managementTab === 'tables' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Masalar
                    </button>
                </div>
            </div>
            
            {managementTab === 'products' ? (
                <button 
                    onClick={() => {
                        setEditingProduct(null);
                        setProductFormOpen(true);
                    }}
                    className="w-full md:w-auto bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition text-sm"
                >
                    <ICONS.Plus size={18} />
                    Yeni Ürün
                </button>
            ) : (
                <button 
                    onClick={() => setTableFormOpen(true)}
                    className="w-full md:w-auto bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition text-sm"
                >
                    <ICONS.Plus size={18} />
                    Yeni Masa
                </button>
            )}
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                {managementTab === 'products' ? (
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Ürün Adı</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Kategori</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Tür</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Fiyat</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-medium text-slate-800 text-sm whitespace-nowrap truncate max-w-[200px]">{p.name}</td>
                                    <td className="p-4 text-slate-600 text-sm">
                                        {CATEGORIES.find(c => c.id === p.category)?.label || p.category}
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.type === 'retail' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {p.type === 'retail' ? 'Perakende' : 'Hizmet'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-emerald-600 text-sm">{p.price.toFixed(2)} ₺/{p.unit}</td>
                                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                                        <button 
                                            onClick={() => {
                                                setEditingProduct(p);
                                                setProductFormOpen(true);
                                            }}
                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded transition text-xs"
                                        >
                                            Düzenle
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteProduct(p.id)}
                                            className="text-red-600 hover:bg-red-50 p-2 rounded transition text-xs"
                                        >
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left min-w-[400px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Masa Adı</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Durum</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tables.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-medium text-slate-800 flex items-center gap-3 text-sm">
                                        <ICONS.Table size={16} className="text-slate-400" />
                                        {t.name}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === 'occupied' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {t.status === 'occupied' ? 'Dolu' : 'Müsait'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={(e) => handleDeleteTable(e, t)}
                                            className="text-red-600 hover:bg-red-50 p-2 rounded transition flex items-center gap-2 ml-auto text-xs font-medium"
                                        >
                                            <ICONS.Delete size={14} />
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      </div>
  );

  const renderSchema = () => (
      <div className="p-8 h-full overflow-y-auto bg-slate-900 text-slate-300 font-mono">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
            <h1 className="text-xl text-emerald-400">Database Schema</h1>
            <button onClick={() => setView('tables')} className="bg-slate-700 px-4 py-2 rounded text-white hover:bg-slate-600">Kapat</button>
          </div>
          <pre className="whitespace-pre-wrap text-xs md:text-sm">
            {supabaseService.getSchemaSQL()}
          </pre>
      </div>
  );

  // --- LOGIN CHECK ---
  if (!session) {
    return <Login onLoginSuccess={setSession} />;
  }

  // --- MAIN LAYOUT ---

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* Drawer Sidebar Overlay */}
      {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-300" 
            onClick={() => setSidebarOpen(false)} 
          />
      )}

      {/* Side Nav (Collapsible Drawer) */}
      <nav className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col items-center py-6 z-50 transition-transform duration-300 ease-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-emerald-500/20 mb-10">
            K
        </div>
        
        <div className="flex flex-col gap-2 w-full px-4">
            <button 
                onClick={() => { setView('tables'); setSidebarOpen(false); }} 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all w-full text-left ${view === 'tables' || view === 'pos' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
                <ICONS.Retail size={20} />
                <span className="font-semibold">Satış Ekranı</span>
            </button>
            <button 
                onClick={() => { setView('management'); setSidebarOpen(false); }} 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all w-full text-left ${view === 'management' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
                <ICONS.Settings size={20} />
                <span className="font-semibold">Yönetim Paneli</span>
            </button>
            <button 
                onClick={() => { setView('schema'); setSidebarOpen(false); }} 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all w-full text-left ${view === 'schema' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
                <ICONS.History size={20} />
                <span className="font-semibold">Veri Yapısı</span>
            </button>
        </div>

        <div className="mt-auto w-full px-4">
            <button 
                onClick={handleLogout} 
                className="flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all w-full text-left"
            >
                <ICONS.Logout size={20} />
                <span className="font-semibold">Çıkış Yap</span>
            </button>
        </div>

        {/* Inner Close Button for Sidebar */}
        <button 
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
            <ICONS.Close size={24} />
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-30">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <ICONS.Menu size={24} />
                </button>
                <h1 className="font-bold text-slate-800 hidden sm:block">Kuruyemiş & POS</h1>
            </div>

            <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end mr-2">
                    <span className="text-xs font-bold text-slate-800">Admin Panel</span>
                    <span className="text-[10px] text-emerald-500 font-medium">Sistem Çevrimiçi</span>
                </div>
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                    <ICONS.Settings size={18} />
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
            {view === 'tables' && renderTablesView()}
            {view === 'pos' && renderPOSView()}
            {view === 'schema' && renderSchema()}
            {view === 'management' && renderManagementView()}
        </main>
      </div>

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

      <TableFormModal
        isOpen={tableFormOpen}
        onClose={() => setTableFormOpen(false)}
        onSave={handleSaveTable}
      />
    </div>
  );
}