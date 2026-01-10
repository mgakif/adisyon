import React, { useState, useEffect } from 'react';
import { Order, PaymentMethod } from '../types';
import { ICONS } from '../constants';
import NumericKeypad from './NumericKeypad';

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (method: 'split' | 'single', details?: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ order, isOpen, onClose, onComplete }) => {
  const [paidAmount, setPaidAmount] = useState(0);
  const [currentEntry, setCurrentEntry] = useState('');
  const [mode, setMode] = useState<'view' | 'entry'>('view');
  
  // To simulate split logs
  const [logs, setLogs] = useState<{method: string, amount: number}[]>([]);

  useEffect(() => {
    if (isOpen && order) {
        setPaidAmount(0);
        setLogs([]);
        setCurrentEntry('');
        setMode('view');
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const remaining = Math.max(0, order.total_amount - paidAmount);

  const handleAddPayment = (method: PaymentMethod) => {
    if (mode === 'view') {
        // Quick Pay Full Remaining
        setLogs([...logs, { method: method === 'cash' ? 'Nakit' : 'Kredi Kartı', amount: remaining }]);
        setPaidAmount(order.total_amount);
        setTimeout(() => onComplete('single'), 500); // Simulate completion
    } else {
        // Split Pay Specific Amount
        const amount = parseFloat(currentEntry);
        if (!isNaN(amount) && amount > 0) {
            const newTotal = paidAmount + amount;
            setLogs([...logs, { method: method === 'cash' ? 'Nakit' : 'Kredi Kartı', amount }]);
            setPaidAmount(newTotal);
            setCurrentEntry('');
            setMode('view');

            if (newTotal >= order.total_amount - 0.01) {
                setTimeout(() => onComplete('split'), 500);
            }
        }
    }
  };

  const handleNumpadPress = (key: string) => {
    if (key === '.' && currentEntry.includes('.')) return;
    setCurrentEntry(prev => prev + key);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold">Ödeme Al</h2>
                <p className="opacity-80">Adisyon #{order.order_number}</p>
            </div>
            <div className="text-right">
                <p className="text-sm opacity-70">Toplam Tutar</p>
                <p className="text-3xl font-bold text-emerald-400">{order.total_amount.toFixed(2)} ₺</p>
            </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row">
            {/* Left: Summary & Logs */}
            <div className="flex-1 p-6 border-r border-slate-100 flex flex-col gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-600">Ödenen:</span>
                        <span className="font-semibold text-emerald-600">{paidAmount.toFixed(2)} ₺</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                        <span className="text-slate-800">Kalan:</span>
                        <span className="text-red-600">{remaining.toFixed(2)} ₺</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ödeme Geçmişi</h4>
                    {logs.length === 0 && <p className="text-sm text-slate-400 italic">Henüz ödeme girilmedi.</p>}
                    <ul className="space-y-2">
                        {logs.map((log, idx) => (
                            <li key={idx} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                                <span>{log.method}</span>
                                <span className="font-mono">{log.amount.toFixed(2)} ₺</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex-1 p-4 bg-slate-50 flex flex-col gap-3">
                {mode === 'view' ? (
                    <>
                        <p className="text-center text-slate-500 mb-2">Ödeme yöntemini seçin</p>
                        <button 
                            onClick={() => handleAddPayment('cash')}
                            className="flex-1 bg-emerald-600 text-white rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-700 transition"
                        >
                            <ICONS.Cash size={32} />
                            <span className="font-bold text-lg">Tümü Nakit</span>
                        </button>
                        <button 
                            onClick={() => handleAddPayment('credit_card')}
                            className="flex-1 bg-blue-600 text-white rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-blue-700 transition"
                        >
                            <ICONS.Card size={32} />
                            <span className="font-bold text-lg">Tümü Kredi Kartı</span>
                        </button>
                        <button 
                            onClick={() => setMode('entry')}
                            className="h-16 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition"
                        >
                            Parçalı Ödeme Gir
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="bg-white border border-slate-300 rounded-lg p-3 text-right mb-3">
                            <span className="text-2xl font-mono text-slate-800">{currentEntry || '0'}</span>
                        </div>
                        <div className="flex-1 mb-2">
                             <NumericKeypad 
                                value={currentEntry}
                                onKeyPress={handleNumpadPress}
                                onDelete={() => setCurrentEntry(prev => prev.slice(0, -1))}
                                onConfirm={() => {}} // No confirm button needed here, actions below
                             />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                            <button onClick={() => handleAddPayment('cash')} className="bg-emerald-600 text-white p-3 rounded-lg font-bold">Nakit</button>
                            <button onClick={() => handleAddPayment('credit_card')} className="bg-blue-600 text-white p-3 rounded-lg font-bold">Kart</button>
                            <button onClick={() => setMode('view')} className="col-span-2 bg-slate-300 text-slate-700 p-2 rounded-lg text-sm">Geri Dön</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <ICONS.Close size={24} />
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;