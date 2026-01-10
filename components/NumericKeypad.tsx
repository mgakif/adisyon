import React from 'react';
import { ICONS } from '../constants';

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  value: string;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({ onKeyPress, onDelete, onConfirm, value }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => onKeyPress(k)}
          className="h-14 text-2xl font-semibold bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          {k}
        </button>
      ))}
      <button
        onClick={onDelete}
        className="h-14 flex items-center justify-center text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
      >
        <ICONS.Delete size={24} />
      </button>
      <button
        onClick={onConfirm}
        className="col-span-3 h-14 bg-emerald-600 text-white font-bold text-lg rounded-xl shadow-md hover:bg-emerald-700 active:transform active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <ICONS.Check size={20} />
        ONAYLA ({value})
      </button>
    </div>
  );
};

export default NumericKeypad;