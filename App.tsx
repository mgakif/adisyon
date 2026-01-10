import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseService } from './services/supabaseService';
import { Product, Table, Order, OrderItem, ProductCategory } from './types';
import { ICONS, CATEGORIES } from './constants';
import WeightModal from './components/WeightModal';
import EditQuantityModal from './components/EditQuantityModal';
import PaymentModal from './components/PaymentModal';
import ProductFormModal from './components/ProductFormModal';
import TableFormModal from './components/TableFormModal'; 
import Login from './components/Login';
import PublicMenu from './components/PublicMenu'; // Import Public Menu
import QRCodeModal from './components/QRCodeModal'; // Import QR Modal
import { ReceiptPrinter } from './components/ReceiptPrinter';
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime';
import { playNotificationSound } from './utils/soundNotification';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { ConfirmModal } from './components/ConfirmModal';
import { ProductCardSkeleton, TableCardSkeleton } from './components/Skeleton';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

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
      relative overflow-hidden rounded-xl px-3 py-2 md:px-4 md:py-4 
      flex items-center md:flex-col md:justify-between text-left 
      h-14 md:min-h-[140px] transition-all border w-full
      ${product.type === 'retail' 
        ? 'bg-amber-50 border-amber-200 hover:border-amber-300 hover:bg-amber-100 text-amber-950' 
        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-900'}
      active:scale-95 shadow-sm group
    `}
  >
    {/* Mobile: Horizontal Layout - Single Row */}
    <div className="flex items-center gap-2 flex-1 min-w-0 md:hidden">
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center shrink-0
        ${product.type === 'retail' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}
      `}>
         {product.type === 'retail' ? <ICONS.Retail size={16} /> : <ICONS.Service size={16} />}
      </div>
      <span className="font-bold text-sm leading-tight truncate flex-1">
        {product.name}
      </span>
      <div className="flex flex-col items-end shrink-0 ml-2">
        <div className="flex items-baseline gap-0.5">
          <span className="text-base font-bold">{product.price.toFixed(2)}</span>
          <span className="text-xs font-normal opacity-80">₺</span>
        </div>
        <span className="text-[10px] opacity-60 uppercase font-medium">
          {product.unit}
        </span>
      </div>
    </div>

    {/* Desktop: Vertical Layout */}
    <div className="hidden md:flex items-start gap-3 flex-1 min-w-0 w-full">
      <div className={`
        w-12 h-12 rounded-lg flex items-center justify-center shrink-0
        ${product.type === 'retail' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}
      `}>
         {product.type === 'retail' ? <ICONS.Retail size={20} /> : <ICONS.Service size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base leading-snug break-words line-clamp-2">
          {product.name}
        </h3>
      </div>
    </div>
    <div className="hidden md:flex items-end justify-between w-full mt-3 pt-3 border-t border-current/10">
      <div className="flex flex-col items-start">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{product.price.toFixed(2)}</span>
          <span className="text-sm font-normal opacity-80">₺</span>
        </div>
        <span className="text-xs opacity-70 uppercase font-medium mt-1">
          {product.unit === 'kg' ? 'kilogram' : product.unit === 'qty' ? 'adet' : product.unit}
        </span>
      </div>
    </div>
  </button>
);

// 2. CART ITEM
interface CartItemRowProps {
  item: OrderItem;
  onRemove: () => void;
  onEdit: () => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item, onRemove, onEdit }) => (
  <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm animate-in slide-in-from-right-2">
    <div className="flex-1 overflow-hidden" onClick={onEdit}>
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
    <div className="flex items-center gap-2">
      <span className="font-bold text-slate-800 whitespace-nowrap">{item.total_price?.toFixed(2) || '0.00'} ₺</span>
      
      <div className="flex gap-1">
        <button 
            onClick={onEdit}
            className="text-blue-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-full transition"
        >
            <ICONS.Settings size={16} />
        </button>
        <button 
            onClick={onRemove}
            className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-full transition"
        >
            <ICONS.Delete size={16} />
        </button>
      </div>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  // Check for Public Menu Mode first
  const [isCustomerMode, setIsCustomerMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('menu') === 'true') {
        setIsCustomerMode(true);
    }
  }, []);

  // Auth State
  const [session, setSession] = useState<any>(null);

  // App State
  const [view, setView] = useState<'tables' | 'pos' | 'orders' | 'schema' | 'management' | 'dashboard'>('tables');
  const [managementTab, setManagementTab] = useState<'products' | 'tables'>('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  
  // Önceki tables state'ini takip etmek için (sesli bildirim için)
  const prevTablesRef = useRef<Table[]>([]);
  
  // Toast notifications
  const toast = useToast();
  
  // Cart / Order State
  const [currentOrder, setCurrentOrder] = useState<Partial<Order>>({ items: [], total_amount: 0 });
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  
  // Modals
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [selectedProductForWeight, setSelectedProductForWeight] = useState<Product | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Editing Cart Item
  const [editQuantityModalOpen, setEditQuantityModalOpen] = useState(false);
  const [editingCartItem, setEditingCartItem] = useState<OrderItem | null>(null);

  // Daily Orders State
  const [dailyOrders, setDailyOrders] = useState<Order[]>([]);
  const [showDeletedOrders, setShowDeletedOrders] = useState(false);

  // Product Management Modal
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Table Management Modal
  const [tableFormOpen, setTableFormOpen] = useState(false);
  
  // QR Code Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState<Table | null>(null);

  // Check Auth on Mount
  useEffect(() => {
    // Only check auth if NOT in customer mode
    if (!isCustomerMode) {
        supabaseService.getCurrentUser().then(user => {
            if (user) setSession(user);
        });
    }
  }, [isCustomerMode]);

  // Load Data
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        supabaseService.getProducts(),
        supabaseService.getTables()
      ]);
      setProducts(p);
      setTables(t);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      // toast.error kullanmıyoruz çünkü bu refreshData'nın dependency'si oluyor
    } finally {
      setLoading(false);
    }
  }, []); // toast dependency'sini kaldırdık

  // Fetch daily orders when view changes to 'orders'
  useEffect(() => {
    if (view === 'orders' && !isCustomerMode) {
        supabaseService.getDailyOrders().then(setDailyOrders);
    }
  }, [view, isCustomerMode]);

  useEffect(() => {
    if (session && !isCustomerMode) refreshData();
  }, [refreshData, session, isCustomerMode]);

  // Garson çağrısı sesli bildirimi
  useEffect(() => {
    if (session && !isCustomerMode && tables.length > 0) {
      // Önceki state ile karşılaştır
      const prevTables = prevTablesRef.current;
      
      // Yeni garson çağrısı olan masaları bul
      const newServiceCalls = tables.filter(table => {
        const prevTable = prevTables.find(t => t.id === table.id);
        // Eğer önceki state'de yoksa veya needs_service false'tu, şimdi true ise yeni çağrı
        return table.needs_service && (!prevTable || !prevTable.needs_service);
      });
      
      // Yeni garson çağrısı varsa ses çal
      if (newServiceCalls.length > 0) {
        playNotificationSound();
      }
      
      // Şimdiki state'i bir sonraki karşılaştırma için sakla
      prevTablesRef.current = tables;
    }
  }, [tables, session, isCustomerMode]);

  // Hook up Realtime with Deep Refresh Logic
  // State'leri ref'lerde saklayarak closure sorununu çözüyoruz
  const viewRef = useRef(view);
  const activeTableIdRef = useRef(activeTableId);
  const currentOrderIdRef = useRef(currentOrder.id);
  
  useEffect(() => {
    viewRef.current = view;
    activeTableIdRef.current = activeTableId;
    currentOrderIdRef.current = currentOrder.id;
  }, [view, activeTableId, currentOrder.id]);

  const realtimeCallback = useCallback(async () => {
    if (session && !isCustomerMode) {
        // 1. Refresh general data (tables status colors, products)
        await refreshData();
        
        // 2. If viewing order history, refresh that
        if (viewRef.current === 'orders') {
            supabaseService.getDailyOrders().then(setDailyOrders);
        }

        // 3. CRITICAL: If a table is active, refresh ITS content.
        const currentActiveTableId = activeTableIdRef.current;
        if (currentActiveTableId) {
            const activeOrders = await supabaseService.getActiveOrders();
            const tableOrder = activeOrders.find(o => o.table_id === currentActiveTableId);
            
            if (tableOrder) {
                setCurrentOrder(tableOrder);
                setCartItems(tableOrder.items || []);
            } else {
                // Sadece gerçekten order kaybolduysa reset et
                if (currentOrderIdRef.current) {
                    setCurrentOrder({ 
                        table_id: currentActiveTableId, 
                        items: [], 
                        total_amount: 0,
                        status: 'pending' 
                    });
                    setCartItems([]);
                }
            }
        }
    }
  }, [session, isCustomerMode, refreshData]);

  useSupabaseRealtime(realtimeCallback);

  // Keyboard Shortcuts
  useKeyboardShortcuts([
    {
      key: '1',
      action: () => setView('dashboard'),
      description: 'Dashboard',
    },
    {
      key: '2',
      action: () => setView('tables'),
      description: 'Satış Ekranı',
    },
    {
      key: '3',
      action: () => setView('orders'),
      description: 'Sipariş Geçmişi',
    },
    {
      key: '4',
      action: () => setView('management'),
      description: 'Yönetim',
    },
    {
      key: 'k',
      ctrl: true,
      action: () => setView('tables'),
      description: 'Hızlı Satış',
    },
    {
      key: 's',
      ctrl: true,
      action: () => {
        if (view === 'pos') {
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          input?.focus();
        }
      },
      description: 'Arama',
    },
    {
      key: 'd',
      ctrl: true,
      action: () => setDarkMode(!darkMode),
      description: 'Dark Mode',
    },
  ]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- EARLY RETURN FOR CUSTOMER MODE ---
  if (isCustomerMode) {
      return <PublicMenu />;
  }

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

  const handleResolveService = async (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation();
    try {
        await supabaseService.toggleTableService(tableId, false);
        await refreshData();
    } catch (error) {
        console.error("Couldn't resolve service", error);
    }
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

  const handleEditCartItem = (item: OrderItem) => {
    setEditingCartItem(item);
    setEditQuantityModalOpen(true);
  };

  const updateCartItemQuantity = (newQuantity: number) => {
    if (!editingCartItem) return;

    setCartItems(prev => prev.map(item => {
        if (item.id === editingCartItem.id) {
            return {
                ...item,
                quantity: newQuantity,
                total_price: newQuantity * item.unit_price
            };
        }
        return item;
    }));
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
        
        toast.success('Sipariş kaydedildi / Mutfakta!');
    } catch (error) {
        console.error("Save failed", error);
        toast.error('Hata: Sipariş kaydedilemedi.');
    }
  };

  const handlePrintOnly = () => {
    // Just print the current view
    window.print();
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
            toast.success('Ödeme tamamlandı!');
        } catch (error) {
            console.error("Payment failed", error);
            toast.error('Hata: Ödeme tamamlanamadı.');
        }
    }
  };

  // Product Management Actions
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
        await supabaseService.saveProduct(productData);
        await refreshData();
        toast.success('Ürün kaydedildi!');
    } catch (e) {
        console.error(e);
        toast.error('Ürün kaydedilemedi: ' + (e as any).message);
    }
  };

  const [deleteProductConfirm, setDeleteProductConfirm] = useState<{isOpen: boolean; id: string | null}>({isOpen: false, id: null});

  const handleDeleteProduct = async (id: string) => {
    setDeleteProductConfirm({isOpen: true, id});
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductConfirm.id) return;
    try {
        await supabaseService.deleteProduct(deleteProductConfirm.id);
        await refreshData();
        toast.success('Ürün silindi!');
    } catch (e) {
         console.error(e);
        toast.error('Silinemedi: ' + (e as any).message);
    } finally {
        setDeleteProductConfirm({isOpen: false, id: null});
    }
  };

  // Table Management Actions
  const handleSaveTable = async (tableData: Partial<Table>) => {
    try {
        await supabaseService.saveTable(tableData);
        await refreshData();
        toast.success('Masa kaydedildi!');
    } catch (e) {
         console.error(e);
        toast.error('Masa kaydedilemedi: ' + (e as any).message);
    }
  };

  const [deleteTableConfirm, setDeleteTableConfirm] = useState<{isOpen: boolean; table: Table | null}>({isOpen: false, table: null});

  const handleDeleteTable = async (e: React.MouseEvent, table: Table) => {
    e.stopPropagation();
    if (table.status === 'occupied') {
        toast.warning('Dolu masa silinemez!');
        return;
    }
    setDeleteTableConfirm({isOpen: true, table});
  };

  const confirmDeleteTable = async () => {
    if (!deleteTableConfirm.table) return;
    try {
        await supabaseService.deleteTable(deleteTableConfirm.table.id);
        await refreshData();
        toast.success('Masa silindi!');
    } catch (e) {
         console.error(e);
        toast.error('Silinemedi: ' + (e as any).message);
    } finally {
        setDeleteTableConfirm({isOpen: false, table: null});
    }
  };

  // Order History Actions
  const [toggleOrderConfirm, setToggleOrderConfirm] = useState<{isOpen: boolean; order: Order | null}>({isOpen: false, order: null});

  const handleToggleOrderDelete = async (order: Order) => {
    setToggleOrderConfirm({isOpen: true, order});
  };

  const confirmToggleOrderDelete = async () => {
    if (!toggleOrderConfirm.order) return;
    const order = toggleOrderConfirm.order;
    const newStatus = !order.is_deleted;
    try {
        await supabaseService.toggleOrderDelete(order.id, newStatus);
        // Manually update local state for immediate feedback
        setDailyOrders(prev => prev.map(o => o.id === order.id ? {...o, is_deleted: newStatus} : o));
        toast.success(newStatus ? 'Sipariş silindi!' : 'Sipariş geri alındı!');
    } catch (e) {
        console.error(e);
        toast.error('İşlem başarısız.');
    } finally {
        setToggleOrderConfirm({isOpen: false, order: null});
    }
  };

  // --- RENDER HELPERS ---

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.total_price || 0), 0);
  
  // Derived active table name for Receipt
  const activeTableName = activeTableId ? tables.find(t => t.id === activeTableId)?.name : 'Hızlı Satış';

  // Dashboard stats
  const dashboardStats = {
    totalSales: dailyOrders.filter(o => !o.is_deleted).reduce((acc, o) => acc + o.total_amount, 0),
    totalOrders: dailyOrders.filter(o => !o.is_deleted).length,
    occupiedTables: tables.filter(t => t.status === 'occupied').length,
    serviceCalls: tables.filter(t => t.needs_service).length,
    popularProducts: (() => {
      const productCounts: Record<string, { name: string; count: number }> = {};
      dailyOrders.filter(o => !o.is_deleted).forEach(order => {
        order.items?.forEach(item => {
          if (!productCounts[item.product_id]) {
            productCounts[item.product_id] = { name: item.product_name, count: 0 };
          }
          productCounts[item.product_id].count += item.quantity;
        });
      });
      return Object.values(productCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    })(),
  };

  // --- VIEWS ---

  const renderDashboardView = () => (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="bg-white p-4 md:p-6 border-b border-slate-200 shrink-0">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500 font-medium">Toplam Satış</span>
              <ICONS.DollarSign className="text-emerald-500" size={24} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{dashboardStats.totalSales.toFixed(2)} ₺</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500 font-medium">Toplam Sipariş</span>
              <ICONS.History className="text-blue-500" size={24} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{dashboardStats.totalOrders}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500 font-medium">Dolu Masalar</span>
              <ICONS.Table className="text-red-500" size={24} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{dashboardStats.occupiedTables} / {tables.length}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500 font-medium">Garson Çağrıları</span>
              <ICONS.Bell className="text-amber-500" size={24} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{dashboardStats.serviceCalls}</p>
          </div>
        </div>

        {/* Popular Products */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ICONS.TrendingUp size={20} />
            En Çok Satan Ürünler
          </h3>
          {dashboardStats.popularProducts.length > 0 ? (
            <div className="space-y-3">
              {dashboardStats.popularProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-slate-800">{product.name}</span>
                  </div>
                  <span className="text-slate-600 font-bold">{product.count} adet</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">Henüz satış verisi yok.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderManagementView = () => (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 md:p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Yönetim Paneli</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setManagementTab('products')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              managementTab === 'products' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Ürünler
          </button>
          <button
            onClick={() => setManagementTab('tables')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              managementTab === 'tables' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Masalar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {managementTab === 'products' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductFormOpen(true);
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 transition"
              >
                <ICONS.Plus size={18} />
                Yeni Ürün Ekle
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-slate-600">Ürün Adı</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Fiyat</th>
                    <th className="p-4 text-sm font-semibold text-slate-600">Kategori</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${product.type === 'retail' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                           {product.type === 'retail' ? <ICONS.Retail size={16} /> : <ICONS.Service size={16} />}
                        </div>
                        {product.name}
                      </td>
                      <td className="p-4 text-slate-600">
                        {product.price.toFixed(2)} ₺ / {product.unit}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {CATEGORIES.find(c => c.id === product.category)?.label || product.category}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingProduct(product);
                              setProductFormOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <ICONS.Settings size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <ICONS.Delete size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="flex justify-end">
              <button
                onClick={() => setTableFormOpen(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 transition"
              >
                <ICONS.Plus size={18} />
                Yeni Masa Ekle
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map(table => (
                <div key={table.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32 relative group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                        <ICONS.Table size={20} />
                      </div>
                      <span className="font-bold text-slate-800">{table.name}</span>
                    </div>
                    {table.status === 'occupied' ? (
                       <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    ) : (
                       <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-auto">
                    <button 
                        onClick={() => {
                            setSelectedTableForQR(table);
                            setQrModalOpen(true);
                        }}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        title="QR Kod"
                    >
                        <ICONS.QrCode size={18} />
                    </button>
                    <button 
                        onClick={(e) => handleDeleteTable(e, table)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Sil"
                    >
                        <ICONS.Delete size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

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
                ${table.needs_service ? 'bg-amber-100 border-amber-400 text-amber-800 animate-pulse' : 
                   table.status === 'occupied' ? 'bg-red-50 border-red-200 text-red-800' : 
                   'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600'}
                active:scale-95
                `}
            >
                {/* Waiter Bell Indicator */}
                {table.needs_service && (
                    <div className="absolute top-2 right-2 animate-bounce">
                        <div 
                            onClick={(e) => handleResolveService(e, table.id)}
                            className="bg-amber-500 text-white p-1.5 rounded-full shadow-lg hover:bg-amber-600 cursor-pointer z-10"
                        >
                            <ICONS.Bell size={16} fill="currentColor" />
                        </div>
                    </div>
                )}
                
                <ICONS.Table size={28} className="md:w-8 md:h-8" />
                <span className="font-bold text-sm md:text-base">{table.name}</span>
                {table.status === 'occupied' && !table.needs_service && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full" />
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
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Search Bar */}
        <div className="p-2 bg-white border-b border-slate-200 shrink-0">
          <div className="relative">
            <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <ICONS.Close size={18} />
              </button>
            )}
          </div>
        </div>
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-5">
              {[...Array(10)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-5">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} onClick={() => handleProductClick(p)} />
              ))}
              {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center p-10 text-slate-400">
                      {searchQuery ? 'Arama sonucu bulunamadı.' : 'Ürün bulunamadı.'}
                  </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart Drawer */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl z-20 shrink-0 h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex flex-col overflow-hidden min-w-0">
            <h3 className="font-bold text-slate-800 whitespace-nowrap truncate">
                {activeTableName}
            </h3>
            <span className="text-[10px] text-slate-500">#{currentOrder.order_number || 'YENİ'}</span>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setView('tables')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <ICONS.Close size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50 min-h-0">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 opacity-60 py-8">
                <ICONS.Retail size={40} className="mb-2" />
                <p className="text-sm">Sepet Boş</p>
            </div>
          ) : (
            cartItems.map(item => (
                <CartItemRow 
                    key={item.id} 
                    item={item} 
                    onRemove={() => removeFromCart(item.id)}
                    onEdit={() => handleEditCartItem(item)}
                />
            ))
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] shrink-0">
            <div className="flex justify-between items-center mb-3">
                <span className="text-slate-500 text-sm">Toplam</span>
                <span className="text-2xl font-bold text-emerald-600">{cartTotal.toFixed(2)} ₺</span>
            </div>
            
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => saveOrder()}
                        disabled={cartItems.length === 0}
                        className="py-3 px-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition shadow-sm disabled:opacity-50"
                    >
                        SİPARİŞİ KAYDET
                    </button>
                    <button 
                        onClick={handlePrintOnly}
                        disabled={cartItems.length === 0}
                        className="py-3 px-2 bg-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-300 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                         <ICONS.History size={16} />
                         FİŞ YAZ
                    </button>
                </div>
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
                    className="w-full py-4 bg-emerald-600 text-white text-base font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
                >
                    <ICONS.Card size={20} />
                    ÖDEME AL
                </button>
            </div>
        </div>
      </div>
    </div>
  );

  const renderOrdersView = () => {
    // Filter displayed orders based on showDeletedOrders toggle
    const displayedOrders = dailyOrders.filter(o => 
        showDeletedOrders ? o.is_deleted : !o.is_deleted
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            <div className="bg-white p-4 md:p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800">Günlük Sipariş Geçmişi</h2>
                    <button 
                        onClick={() => setShowDeletedOrders(!showDeletedOrders)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showDeletedOrders ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {showDeletedOrders ? <ICONS.Hide size={16} /> : <ICONS.Show size={16} />}
                        {showDeletedOrders ? 'Silinenleri Gizle' : 'Silinenleri Göster'}
                    </button>
                </div>
                <div className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-lg">
                    {new Date().toLocaleDateString('tr-TR')}
                </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 md:p-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Sipariş No</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Masa / Konum</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Saat</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Tutar</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Durum</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">İçerik</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {displayedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        {showDeletedOrders ? 'Silinmiş sipariş bulunamadı.' : 'Bugün henüz sipariş alınmadı.'}
                                    </td>
                                </tr>
                            ) : (
                                displayedOrders.map(order => (
                                    <tr key={order.id} className={`hover:bg-slate-50 transition ${order.is_deleted ? 'opacity-60 bg-slate-50' : ''}`}>
                                        <td className="p-4 font-mono font-bold text-slate-700 text-sm">#{order.order_number}</td>
                                        <td className="p-4 text-slate-800 text-sm font-medium">
                                            {order.table_id 
                                                ? tables.find(t => t.id === order.table_id)?.name || 'Bilinmeyen Masa'
                                                : <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs">Hızlı Satış</span>
                                            }
                                        </td>
                                        <td className="p-4 text-slate-500 text-sm">
                                            {new Date(order.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className="p-4 font-bold text-emerald-600 text-sm">{order.total_amount.toFixed(2)} ₺</td>
                                        <td className="p-4 text-sm">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                                                ${order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                                                order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}
                                            `}>
                                                {order.status === 'paid' ? 'Ödendi' : 
                                                order.status === 'pending' ? 'Bekliyor' : order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 text-xs max-w-[200px] truncate">
                                            {order.items?.map(i => `${i.product_name} (${i.quantity})`).join(', ')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => handleToggleOrderDelete(order)}
                                                className={`p-2 rounded transition flex items-center gap-2 ml-auto text-xs font-bold
                                                    ${order.is_deleted 
                                                        ? 'text-emerald-600 hover:bg-emerald-50' 
                                                        : 'text-red-600 hover:bg-red-50'
                                                    }
                                                `}
                                                title={order.is_deleted ? "Geri Al" : "Sil"}
                                            >
                                                {order.is_deleted ? (
                                                    <>
                                                        <ICONS.Restore size={16} />
                                                        Geri Al
                                                    </>
                                                ) : (
                                                    <>
                                                        <ICONS.Delete size={16} />
                                                        Sil
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

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
      {/* Hidden Thermal Printer Component */}
      <ReceiptPrinter 
        order={currentOrder} 
        items={cartItems} 
        tableName={activeTableName}
      />

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
                onClick={() => { setView('dashboard'); setSidebarOpen(false); }} 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all w-full text-left ${view === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
                <ICONS.Dashboard size={20} />
                <span className="font-semibold">Dashboard</span>
            </button>
            <button 
                onClick={() => { setView('tables'); setSidebarOpen(false); }} 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all w-full text-left ${view === 'tables' || view === 'pos' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
                <ICONS.Retail size={20} />
                <span className="font-semibold">Satış Ekranı</span>
            </button>
            <button 
                onClick={() => { setView('orders'); setSidebarOpen(false); }} 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all w-full text-left ${view === 'orders' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
                <ICONS.History size={20} />
                <span className="font-semibold">Sipariş Geçmişi</span>
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
                <ICONS.Database size={20} />
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
            {view === 'dashboard' && renderDashboardView()}
            {view === 'tables' && renderTablesView()}
            {view === 'pos' && renderPOSView()}
            {view === 'orders' && renderOrdersView()}
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
      
      <EditQuantityModal
        isOpen={editQuantityModalOpen}
        item={editingCartItem}
        onClose={() => setEditQuantityModalOpen(false)}
        onConfirm={updateCartItemQuantity}
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

      <QRCodeModal 
        isOpen={qrModalOpen}
        table={selectedTableForQR}
        onClose={() => setQrModalOpen(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={deleteProductConfirm.isOpen}
        title="Ürünü Sil"
        message="Bu ürünü silmek istediğinize emin misiniz?"
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
        onConfirm={confirmDeleteProduct}
        onCancel={() => setDeleteProductConfirm({isOpen: false, id: null})}
      />

      <ConfirmModal
        isOpen={deleteTableConfirm.isOpen}
        title="Masayı Sil"
        message={`${deleteTableConfirm.table?.name} silinecek. Emin misiniz?`}
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
        onConfirm={confirmDeleteTable}
        onCancel={() => setDeleteTableConfirm({isOpen: false, table: null})}
      />

      <ConfirmModal
        isOpen={toggleOrderConfirm.isOpen}
        title={toggleOrderConfirm.order?.is_deleted ? "Siparişi Geri Al" : "Siparişi Sil"}
        message={toggleOrderConfirm.order?.is_deleted 
          ? "Bu siparişi geri almak istediğinize emin misiniz?" 
          : "Bu siparişi silmek istediğinize emin misiniz?"}
        confirmText={toggleOrderConfirm.order?.is_deleted ? "Geri Al" : "Sil"}
        cancelText="İptal"
        type={toggleOrderConfirm.order?.is_deleted ? "info" : "danger"}
        onConfirm={confirmToggleOrderDelete}
        onCancel={() => setToggleOrderConfirm({isOpen: false, order: null})}
      />
    </div>
  );
}