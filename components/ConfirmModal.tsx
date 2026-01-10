import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Evet',
  cancelText = 'İptal',
  onConfirm,
  onCancel,
  type = 'warning',
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-amber-500 hover:bg-amber-600',
    info: 'bg-blue-500 hover:bg-blue-600',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-100' : type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
            <AlertTriangle 
              size={24} 
              className={type === 'danger' ? 'text-red-600' : type === 'warning' ? 'text-amber-600' : 'text-blue-600'} 
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-600">{message}</p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium text-white ${colors[type]} transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
