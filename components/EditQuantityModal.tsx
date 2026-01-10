import React, { useState, useEffect } from 'react';
import { OrderItem } from '../types';
import NumericKeypad from './NumericKeypad';
import { ICONS } from '../constants';

interface EditQuantityModalProps {
  item: OrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

const EditQuantityModal: React.FC<EditQuantityModalProps> = ({ item, isOpen, onClose, onConfirm }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      if (item.unit === 'kg') {
        // If kg, show as grams (e.g., 0.5 kg -> 500)
        setValue((item.quantity * 1000).toFixed(0));
      } else {
        // If qty, show as integer string
        setValue(item.quantity.toString());
      }
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleKeyPress = (key: string) => {
    if (key === '.') return; // Simple handling, avoid decimals for raw keypad input for now
    if (value.length > 5) return;
    setValue(prev => prev + key);
  };

  const handleDelete = () => {
    setValue(prev => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    const rawVal = parseFloat(value);
    if (!isNaN(rawVal) && rawVal > 0) {
      let finalQty = rawVal;
      if (item.unit === 'kg') {
        // Convert back to kg
        finalQty = rawVal / 1000;
      }
      onConfirm(finalQty);
      onClose();
    }
  };

  // Calculations for Display
  const rawNum = parseFloat(value) || 0;
  let displayQty = "";
  let displayPrice = 0;

  if (item.unit === 'kg') {
    const kg = rawNum / 1000;
    displayQty = `${rawNum} g (${kg.toFixed(3)} kg)`;
    displayPrice = kg * item.unit_price;
  } else {
    displayQty = `${rawNum} Adet`;
    displayPrice = rawNum * item.unit_price;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-100 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800">{item.product_name}</h3>
            <p className="text-slate-500 text-xs">Miktarı Düzenle</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <ICONS.Close size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Display */}
        <div className="p-6 flex flex-col items-center gap-1 bg-white mb-1">
            <div className="flex items-baseline gap-2 text-slate-800">
                <span className="text-4xl font-mono font-bold tracking-tighter text-blue-600">{value || '0'}</span>
                <span className="text-xl font-bold text-slate-400">{item.unit === 'kg' ? 'g' : 'Adet'}</span>
            </div>
            
            <div className="text-slate-400 font-medium text-sm">
                {item.unit === 'kg' ? `( ${ (rawNum/1000).toFixed(3) } kg )` : ''}
            </div>

            <div className="text-slate-800 font-bold text-2xl mt-2 p-2 bg-slate-50 rounded-xl w-full text-center border border-slate-100">
                {displayPrice.toFixed(2)} ₺
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

export default EditQuantityModal;