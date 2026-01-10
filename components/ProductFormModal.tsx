import React, { useState, useEffect } from 'react';
import { Product, ProductUnit, ProductType, ProductCategory } from '../types';
import { ICONS, CATEGORIES } from '../constants';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  initialData?: Product | null;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    unit: 'kg',
    type: 'retail',
    category: 'nuts'
  });

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setFormData({ ...initialData });
        } else {
            setFormData({
                name: '',
                price: 0,
                unit: 'kg',
                type: 'retail',
                category: 'nuts'
            });
        }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h3 className="font-bold text-lg">{initialData ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</h3>
            <button onClick={onClose}><ICONS.Close /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ürün Adı</label>
                <input 
                    type="text" 
                    required
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fiyat (₺)</label>
                    <input 
                        type="number" 
                        required
                        step="0.01"
                        min="0"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Birim</label>
                    <select 
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        value={formData.unit}
                        onChange={e => setFormData({...formData, unit: e.target.value as ProductUnit})}
                    >
                        <option value="kg">Kilogram (kg)</option>
                        <option value="qty">Adet</option>
                        <option value="portion">Porsiyon</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                    <select 
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})}
                    >
                        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tür</label>
                    <select 
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as ProductType})}
                    >
                        <option value="retail">Perakende (Market)</option>
                        <option value="service">Hizmet (Kafe/Mutfak)</option>
                    </select>
                </div>
            </div>

            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition mt-4">
                KAYDET
            </button>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;