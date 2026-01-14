import React, { useState, useEffect } from 'react';
import { SalesRecord, SHOPS, ShopID } from '../types';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (record: Omit<SalesRecord, 'id'>) => void;
  onDelete?: (date: string, shopId: ShopID) => void;
  existingData: SalesRecord[];
}

export const InputModal: React.FC<InputModalProps> = ({ isOpen, onClose, onSubmit, onDelete, existingData }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shopId: 'shop1' as ShopID,
    penjualan: '',
    pesanan: '',
    konversi: '',
    pengunjung: '',
    produkDiklik: '',
    chatResponseRate: '',
    lateShipmentRate: ''
  });

  // Watch for Date/Shop changes to pre-fill existing data
  // Also runs when isOpen becomes true to refresh the state
  useEffect(() => {
    if (!isOpen) return;

    const record = existingData.find(d => d.date === formData.date && d.shopId === formData.shopId);
    
    if (record) {
        setFormData(prev => ({
            ...prev,
            penjualan: record.penjualan.toString(),
            pesanan: record.pesanan.toString(),
            konversi: (record.konversi * 100).toFixed(2), // Convert back to percentage 0-100
            pengunjung: record.pengunjung.toString(),
            produkDiklik: record.produkDiklik.toString(),
            chatResponseRate: record.chatResponseRate !== undefined ? record.chatResponseRate.toString() : '',
            lateShipmentRate: record.lateShipmentRate !== undefined ? record.lateShipmentRate.toString() : ''
        }));
    } else {
        // Only clear specific fields, keep Date and ShopId so user doesn't lose context
        setFormData(prev => ({
            ...prev,
            penjualan: '',
            pesanan: '',
            konversi: '',
            pengunjung: '',
            produkDiklik: '',
            chatResponseRate: '',
            lateShipmentRate: ''
        }));
    }
  }, [isOpen, formData.date, formData.shopId, existingData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: formData.date,
      shopId: formData.shopId,
      penjualan: Number(formData.penjualan),
      pesanan: Number(formData.pesanan),
      konversi: Number(formData.konversi) / 100, // Convert percentage input to decimal
      pengunjung: Number(formData.pengunjung),
      produkDiklik: Number(formData.produkDiklik),
      chatResponseRate: formData.chatResponseRate ? Number(formData.chatResponseRate) : undefined,
      lateShipmentRate: formData.lateShipmentRate ? Number(formData.lateShipmentRate) : undefined,
    });
    onClose();
  };

  const isEditing = existingData.some(d => d.date === formData.date && d.shopId === formData.shopId);
  const inputClass = "mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-shopee-orange focus:ring focus:ring-shopee-orange focus:ring-opacity-50 border p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 transition-colors my-8 animate-fade-in">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
            {isEditing ? 'Edit Daily Report' : 'Add Daily Report'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date</label>
              <input 
                type="date" 
                required
                className={inputClass}
                value={formData.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className={labelClass}>Shop</label>
              <select 
                className={inputClass}
                value={formData.shopId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, shopId: e.target.value as ShopID})}
              >
                {SHOPS.map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Penjualan (IDR)</label>
            <input 
              type="number" 
              required
              min="0"
              placeholder="e.g. 24000000"
              className={inputClass}
              value={formData.penjualan}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, penjualan: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className={labelClass}>Pesanan</label>
               <input type="number" required min="0" className={inputClass}
                value={formData.pesanan} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, pesanan: e.target.value})} />
            </div>
            <div>
               <label className={labelClass}>Konversi (%)</label>
               <input type="number" required min="0" step="0.01" className={inputClass}
                value={formData.konversi} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, konversi: e.target.value})} />
            </div>
          </div>

           <div className="grid grid-cols-2 gap-4">
            <div>
               <label className={labelClass}>Pengunjung</label>
               <input type="number" required min="0" className={inputClass}
                value={formData.pengunjung} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, pengunjung: e.target.value})} />
            </div>
            <div>
               <label className={labelClass}>Produk Diklik</label>
               <input type="number" required min="0" className={inputClass}
                value={formData.produkDiklik} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, produkDiklik: e.target.value})} />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
             <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Shop Health (Optional)</h3>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Chat Response (%)</label>
                  <input type="number" min="0" max="100" className={inputClass}
                    value={formData.chatResponseRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, chatResponseRate: e.target.value})} placeholder="e.g. 95" />
                </div>
                <div>
                  <label className={labelClass}>Late Shipment (%)</label>
                  <input type="number" min="0" max="100" className={inputClass}
                    value={formData.lateShipmentRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, lateShipmentRate: e.target.value})} placeholder="e.g. 1" />
                </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            {isEditing && onDelete && (
                <button type="button" onClick={() => onDelete(formData.date, formData.shopId)} className="mr-auto px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                    Delete
                </button>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-shopee-orange rounded-lg hover:bg-red-600 shadow-md">
              {isEditing ? 'Update Record' : 'Save Record'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};