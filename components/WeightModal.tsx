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
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) setValue('');
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleKeyPress = (key: string) => {
    if (key === '.' && value.includes('.')) return;
    if (value.length > 6) return; // Prevent crazy lengths
    setValue(prev => prev + key);
  };

  const handleDelete = () => {
    setValue(prev => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    const weight = parseFloat(value);
    if (!isNaN(weight) && weight > 0) {
      onConfirm(product, weight);
      onClose();
    }
  };

  const numericValue = parseFloat(value) || 0;
  const calculatedPrice = numericValue * product.price;
  const calculatedGrams = (numericValue * 1000).toFixed(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-100 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800">{product.name}</h3>
            <p className="text-slate-500 text-sm">Birim Fiyat: {product.price.toFixed(2)} ₺ / kg</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <ICONS.Close size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Display */}
        <div className="p-6 flex flex-col items-center gap-2 bg-white mb-1">
            <div className="flex items-end gap-2 text-slate-800">
                <span className="text-5xl font-mono font-bold tracking-tighter">{value || '0'}</span>
                <span className="text-xl font-medium mb-2 text-slate-500">kg</span>
            </div>
            
            {/* Gram conversion display */}
            <div className="text-slate-400 font-medium text-lg">
                ( {calculatedGrams} g )
            </div>

            <div className="text-emerald-600 font-bold text-2xl mt-1">
                = {calculatedPrice.toFixed(2)} ₺
            </div>
        </div>

        {/* Keypad */}
        <div className="p-4 bg-slate-100 flex-1">
          <NumericKeypad 
            value={value}
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