
import { useState } from 'react';
import { SHOPS, ShopID } from '../types';

interface ImportSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (shopId: ShopID) => void;
  recordCount: number;
  dateRange: { start: string; end: string };
  fileName: string;
}

export const ImportSelectionModal: React.FC<ImportSelectionModalProps> = ({ 
  isOpen, onClose, onConfirm, recordCount, dateRange, fileName 
}) => {
  const [selectedShop, setSelectedShop] = useState<ShopID>(SHOPS[0]!.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 transition-colors border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Import Data</h3>
        
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg mb-4 text-sm text-slate-600 dark:text-slate-300">
           <p className="font-semibold text-slate-800 dark:text-white mb-1">File: {fileName}</p>
           <ul className="list-disc pl-4 space-y-1">
              <li>Found <span className="font-bold">{recordCount}</span> daily records.</li>
              <li>Range: {dateRange.start} to {dateRange.end}</li>
           </ul>
        </div>

        <div className="mb-6">
            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Select Shop to Assign</label>
            <select 
                value={selectedShop} 
                onChange={(e) => setSelectedShop(e.target.value as ShopID)}
                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-shopee-orange focus:border-shopee-orange p-2.5"
            >
                {SHOPS.map(shop => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
            </select>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(selectedShop)}
            className="px-6 py-2 text-sm font-bold text-white bg-shopee-orange rounded-lg hover:bg-red-600 shadow-md transition-colors"
          >
            Confirm Import
          </button>
        </div>
      </div>
    </div>
  );
};
