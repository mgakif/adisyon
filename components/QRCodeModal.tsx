import React from 'react';
import { Table } from '../types';
import { ICONS } from '../constants';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, table }) => {
  if (!isOpen || !table) return null;

  // Generate URL: Current Domain + ?menu=true + tableId
  const menuUrl = `${window.location.origin}/?menu=true&tableId=${table.id}`;
  
  // Use a public API for QR generation (Simple and effective without new dependencies)
  // We double encode the URL to ensure special characters work safely
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}&margin=10`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Kod - ${table.name}</title>
            <style>
              body { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                font-family: sans-serif; 
                text-align: center;
              }
              h1 { margin-bottom: 10px; font-size: 24px; }
              img { border: 2px solid #000; border-radius: 10px; max-width: 80%; }
              p { margin-top: 10px; font-size: 14px; color: #555; }
              .footer { margin-top: 20px; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>${table.name}</h1>
            <p>Menüyü görüntülemek için okutun</p>
            <img src="${qrImageUrl}" onload="window.print();window.close()" />
            <div class="footer">Kuruyemiş & Cafe</div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h3 className="font-bold text-lg">{table.name} - QR Menü</h3>
            <button onClick={onClose}><ICONS.Close /></button>
        </div>
        
        <div className="p-8 flex flex-col items-center gap-6 bg-white">
            <div className="bg-white p-2 border-2 border-slate-100 rounded-xl shadow-sm">
                <img 
                    src={qrImageUrl} 
                    alt="QR Code" 
                    className="w-48 h-48 object-contain"
                />
            </div>
            
            <p className="text-center text-sm text-slate-500 px-4">
                Bu QR kodu masaya yapıştırın. Müşteriler okuttuğunda doğrudan menüye erişecekler.
            </p>

            <button 
                onClick={handlePrint}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2"
            >
                <ICONS.Retail size={20} />
                YAZDIR
            </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;