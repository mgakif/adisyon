import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import NumericKeypad from './NumericKeypad';
import { ICONS } from '../constants';

interface WeightModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: Product, quantity: number) => void;
}

const WeightModal: React.FC<WeightModalProps> = ({ product, isOpen, onClose, onConfirm }) => {
  const [value, setValue] = useState(''); // Stores grams as string

  useEffect(() => {
    if (isOpen) setValue('');
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleKeyPress = (key: string) => {
    if (key === '.') return; // Gram entry usually doesn't need decimals in this context
    if (value.length > 5) return; // Limit to 99.999 grams
    setValue(prev => prev + key);
  };

  const handleDelete = () => {
    setValue(prev => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    const grams = parseFloat(value);
    if (!isNaN(grams) && grams > 0) {
      // Convert grams to kg for the system
      const kg = grams / 1000;
      onConfirm(product, kg);
      onClose();
    }
  };

  const numericGrams = parseFloat(value) || 0;
  const kgValue = numericGrams / 1000;
  const calculatedPrice = kgValue * product.price;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-100 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800">{product.name}</h3>
            <p className="text-slate-500 text-sm">Fiyat: {product.price.toFixed(2)} ₺ / kg</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <ICONS.Close size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Display */}
        <div className="p-6 flex flex-col items-center gap-1 bg-white mb-1">
            <div className="flex items-baseline gap-2 text-slate-800">
                <span className="text-5xl font-mono font-bold tracking-tighter text-emerald-600">{value || '0'}</span>
                <span className="text-2xl font-bold text-slate-400">g</span>
            </div>
            
            <div className="text-slate-400 font-medium">
                ( {kgValue.toFixed(3)} kg )
            </div>

            <div className="text-slate-800 font-bold text-2xl mt-2 p-2 bg-slate-50 rounded-xl w-full text-center border border-slate-100">
                {calculatedPrice.toFixed(2)} ₺
            </div>
        </div>

        {/* Keypad */}
        <div className="p-4 bg-slate-100 flex-1">
          <NumericKeypad 
            value={value + " g"}
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            onConfirm={handleConfirm}
          />
        </div>
      </div>
    </div>
  );
};

export default WeightModal;