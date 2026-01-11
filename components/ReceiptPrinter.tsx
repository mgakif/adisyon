import React from 'react';
import { createPortal } from 'react-dom';
import { Order, OrderItem } from '../types';

interface ReceiptPrinterProps {
  order: Partial<Order>;
  items: OrderItem[];
  tableName?: string;
}

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({ order, items, tableName }) => {
  const total = items.reduce((acc, item) => acc + (item.total_price || 0), 0);
  const date = new Date().toLocaleString('tr-TR');

  // We use createPortal to render this outside of the #root div.
  // This allows us to hide #root during printing without hiding the receipt.
  return createPortal(
    <div id="printable-receipt" className="hidden">
      <div className="flex flex-col items-center mb-2 pb-2 border-b border-black border-dashed">
        <h2 className="text-xl font-bold uppercase">Can Kuruyemiş Cafe</h2>
        <p className="text-[10px] mt-1">Hoşgeldiniz</p>
      </div>

      <div className="mb-2 pb-2 border-b border-black border-dashed text-xs space-y-0.5">
        <div className="flex justify-between">
            <span>Tarih:</span>
            <span>{date}</span>
        </div>
        <div className="flex justify-between">
            <span>Masa:</span>
            <span className="font-bold">{tableName || 'Hızlı Satış'}</span>
        </div>
        <div className="flex justify-between">
            <span>Fiş No:</span>
            <span>#{order.order_number || 'YENİ'}</span>
        </div>
      </div>

      <div className="mb-2 pb-2 border-b border-black border-dashed">
        <table className="w-full text-xs">
            <thead>
                <tr className="text-left">
                    <th className="pb-1">Ürün</th>
                    <th className="pb-1 text-center">Mik.</th>
                    <th className="pb-1 text-right">Tutar</th>
                </tr>
            </thead>
            <tbody className="font-mono">
                {items.map((item, idx) => (
                    <tr key={idx}>
                        <td className="py-0.5 pr-1 align-top">
                            <div className="font-semibold">{item.product_name}</div>
                            {item.unit === 'kg' && (
                                <div className="text-[10px] opacity-75">
                                    {item.unit_price} ₺/kg
                                </div>
                            )}
                        </td>
                        <td className="py-0.5 px-1 text-center align-top whitespace-nowrap">
                            {item.unit === 'kg' 
                                ? `${(item.quantity * 1000).toFixed(0)}g` 
                                : `${item.quantity}`
                            }
                        </td>
                        <td className="py-0.5 pl-1 text-right align-top font-bold">
                            {item.total_price.toFixed(2)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-sm font-bold mb-4">
        <span>TOPLAM:</span>
        <span className="text-lg">{total.toFixed(2)} ₺</span>
      </div>

      <div className="text-center text-[10px] mt-4">
        <p>Afiyet Olsun!</p>
        <p className="mt-1">Mali Değeri Yoktur</p>
      </div>
    </div>,
    document.body
  );
};