import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const colors = {
    success: 'bg-emerald-500 text-white border-emerald-600',
    error: 'bg-red-500 text-white border-red-600',
    info: 'bg-blue-500 text-white border-blue-600',
    warning: 'bg-amber-500 text-white border-amber-600',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div
      className={`
        ${colors[toast.type]}
        px-4 py-3 rounded-xl shadow-lg border-2 flex items-center gap-3 min-w-[300px] max-w-md
        animate-in slide-in-from-right-5 fade-in duration-300
      `}
    >
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
        {icons[toast.type]}
      </div>
      <p className="flex-1 font-medium text-sm">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};
