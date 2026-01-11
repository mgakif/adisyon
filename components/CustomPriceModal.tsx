import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ICONS } from '../constants';
import NumericKeypad from './NumericKeypad';

interface CustomPriceModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (product: Product, customPrice: number) => void;
}

const CustomPriceModal: React.FC<CustomPriceModalProps> = ({ isOpen, product, onClose, onConfirm }) => {
  const [price, setPrice] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPrice('');
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleKeyPress = (key: string) => {
    if (key === '.') {
      // Nokta ekle, eğer zaten varsa ekleme
      if (!price.includes('.')) {
        // Eğer boşsa "0." ekle
        setPrice(prev => prev === '' ? '0.' : prev + '.');
      }
      return;
    }
    
    // Eğer price "0" veya "0." ise, yeni rakamla değiştir
    if (price === '0' || price === '0.') {
      setPrice(key === '0' ? '0' : key);
      return;
    }
    
    // Maksimum 8 haneli sayı (999999.99)
    if (price.replace('.', '').length >= 8) return;
    setPrice(prev => prev + key);
  };

  const handleDelete = () => {
    setPrice(prev => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      alert('Lütfen geçerli bir fiyat girin.');
      return;
    }
    onConfirm(product, priceValue);
    onClose();
  };

  const numericPrice = parseFloat(price) || 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-100 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800">{product.name}</h3>
            <p className="text-slate-500 text-sm">Özel Fiyat Girin</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <ICONS.Close size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Display */}
        <div className="p-6 flex flex-col items-center gap-1 bg-white mb-1">
          <div className="flex items-baseline gap-2 text-slate-800 w-full justify-center">
            <span className="text-5xl font-mono font-bold tracking-tighter text-emerald-600">
              {price || '0'}
            </span>
            <span className="text-2xl font-bold text-slate-400">₺</span>
          </div>
          
          <div className="text-slate-400 font-medium mt-2">
            {price ? `Toplam: ${numericPrice.toFixed(2)} ₺` : 'Fiyat girin'}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-4 bg-slate-100 flex-1">
          <NumericKeypad 
            value={price ? `${price} ₺` : '0 ₺'}
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            onConfirm={handleConfirm}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomPriceModal;
