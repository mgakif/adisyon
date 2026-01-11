import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Product, Table } from '../types';
import { ICONS, CATEGORIES } from '../constants';

// Product Card Component with Image
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const [imageError, setImageError] = useState(false);

  // Debug: image URL'ini kontrol et
  if (product.image) {
    console.log('Product image URL:', product.name, product.image);
  }

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center">
      {product.image && !imageError ? (
        <img 
          src={product.image} 
          alt={product.name}
          className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={`
          w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0
          ${product.type === 'retail' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}
        `}>
          {product.type === 'retail' ? <ICONS.Retail size={24} /> : <ICONS.Service size={24} />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 mb-1">{product.name}</h3>
        <span className="text-xs text-slate-400 uppercase font-medium bg-slate-50 px-2 py-0.5 rounded inline-block">
          {product.category === 'nuts' ? 'Kuruyemiş' : 
           product.category === 'drinks' ? 'İçecek' : 
           product.category === 'dessert' ? 'Tatlı' : 'Diğer'}
        </span>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-bold text-emerald-600 text-lg">{product.price.toFixed(2)} ₺</div>
        <div className="text-xs text-slate-400">
          {product.unit === 'kg' ? '/ kg' : '/ adet'}
        </div>
      </div>
    </div>
  );
};

const PublicMenu = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [table, setTable] = useState<Table | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'called'>('idle');

  useEffect(() => {
    // 1. Get Table Name from URL if exists
    const params = new URLSearchParams(window.location.search);
    const tableId = params.get('tableId');
    
    const loadData = async () => {
      try {
        const prods = await supabaseService.getProducts();
        setProducts(prods);

        if (tableId) {
          const tables = await supabaseService.getTables();
          const t = tables.find(t => t.id === tableId);
          if (t) setTable(t);
        }
      } catch (error) {
        console.error("Menu load error", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCallWaiter = async () => {
    if (!table) return;
    setCallStatus('calling');
    try {
        await supabaseService.toggleTableService(table.id, true);
        setCallStatus('called');
        setTimeout(() => setCallStatus('idle'), 5000); // Reset button after 5s but state stays in DB
    } catch (e) {
        alert('Garson çağrısı yapılamadı.');
        setCallStatus('idle');
    }
  };

  const filteredProducts = products.filter(p => 
    selectedCategory === 'all' || p.category === selectedCategory
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 animate-pulse">Menü Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans relative">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-xl sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Kuruyemiş & Cafe</h1>
            {table && <p className="text-emerald-400 text-sm font-medium">📍 {table.name}</p>}
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ICONS.Menu size={20} />
          </div>
        </div>

        {/* Categories Scroller */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border
                ${selectedCategory === cat.id 
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <ICONS.Retail size={48} className="mx-auto mb-2 opacity-20" />
            <p>Bu kategoride ürün bulunamadı.</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>

      {/* Footer / Call Waiter */}
      {table && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-30 flex justify-center">
             <button
                onClick={handleCallWaiter}
                disabled={callStatus !== 'idle'}
                className={`
                    flex items-center gap-3 px-8 py-4 rounded-full font-bold shadow-xl transition-all transform active:scale-95
                    ${callStatus === 'called' 
                        ? 'bg-emerald-600 text-white' 
                        : callStatus === 'calling'
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-amber-500 text-white hover:bg-amber-600'
                    }
                `}
             >
                <ICONS.Bell size={24} className={callStatus === 'idle' ? 'animate-bounce' : ''} />
                <span>
                    {callStatus === 'called' ? 'Garson Geliyor!' : 
                     callStatus === 'calling' ? 'Çağrılıyor...' : 'Garson Çağır'}
                </span>
             </button>
        </div>
      )}
    </div>
  );
};

export default PublicMenu;