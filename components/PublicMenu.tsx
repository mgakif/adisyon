import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Product, Table } from '../types';
import { ICONS, CATEGORIES } from '../constants';

const PublicMenu = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tableName, setTableName] = useState<string>('');

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
          const table = tables.find(t => t.id === tableId);
          if (table) setTableName(table.name);
        }
      } catch (error) {
        console.error("Menu load error", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-xl sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Kuruyemiş & Cafe</h1>
            {tableName && <p className="text-emerald-400 text-sm font-medium">📍 {tableName}</p>}
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
            <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-xl
                  ${product.type === 'retail' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}
                `}>
                  {product.type === 'retail' ? <ICONS.Retail size={20} /> : <ICONS.Service size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{product.name}</h3>
                  <span className="text-xs text-slate-400 uppercase font-medium bg-slate-50 px-2 py-0.5 rounded">
                    {product.category === 'nuts' ? 'Kuruyemiş' : 
                     product.category === 'drinks' ? 'İçecek' : 
                     product.category === 'dessert' ? 'Tatlı' : 'Diğer'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-600 text-lg">{product.price.toFixed(2)} ₺</div>
                <div className="text-xs text-slate-400">
                  {product.unit === 'kg' ? '/ kg' : '/ adet'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Floating Info */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none">
        <div className="bg-slate-900 text-white text-xs p-3 rounded-xl text-center shadow-lg mx-auto max-w-sm pointer-events-auto opacity-90">
          Sipariş vermek için lütfen garsona seslenin.
        </div>
      </div>
    </div>
  );
};

export default PublicMenu;