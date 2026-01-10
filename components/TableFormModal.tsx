import React, { useState } from 'react';
import { Table } from '../types';
import { ICONS } from '../constants';

interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (table: Partial<Table>) => void;
}

const TableFormModal: React.FC<TableFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({
        name: name,
        status: 'available',
        current_order_id: null
      });
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h3 className="font-bold text-lg">Yeni Masa Ekle</h3>
            <button onClick={onClose}><ICONS.Close /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Masa Adı / No</label>
                <input 
                    type="text" 
                    required
                    placeholder="Örn: Masa 5"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                />
            </div>

            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition mt-4">
                KAYDET
            </button>
        </form>
      </div>
    </div>
  );
};

export default TableFormModal;