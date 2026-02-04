import React, { useState } from 'react';
import { Product, SHOPS, ShopID, PricingItem } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product) => void;
  pricingItems?: PricingItem[];
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSubmit, pricingItems = [] }) => {
  const [sku, setSku] = useState('');
  const [skuError, setSkuError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    shopId: 'shop1' as ShopID,
    rank: 1,
    sales: 0,
    image: ''
  });

  if (!isOpen) return null;

  const handleSkuSearch = () => {
    if (!sku.trim()) return;
    const found = pricingItems.find(p => p.sku.toLowerCase() === sku.toLowerCase());
    
    if (found) {
        setFormData(prev => ({
            ...prev,
            name: found.productName || found.brand + ' ' + found.sku,
            shopId: found.shopId,
            image: found.image
        }));
        setSkuError('');
    } else {
        setSkuError('SKU not found in Pricing Database. Please check your spelling or add it in Pricing Calculator first.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sku: sku, // Pass the SKU so we can sync with pricing DB
      ...formData
    });
    // Reset
    onClose();
    setFormData({ name: '', shopId: 'shop1', rank: 1, sales: 0, image: '' });
    setSku('');
    setSkuError('');
  };

  const inputClass = "mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-shopee-orange focus:ring focus:ring-shopee-orange focus:ring-opacity-50 border p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 transition-colors";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 transition-colors animate-fade-in">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Add Hero Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* SKU Lookup Section */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600 mb-4">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Look up by SKU (Syncs Image)</label>
              <div className="flex gap-2">
                  <input 
                    type="text" 
                    className={`${inputClass} mt-0`}
                    value={sku}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSku(e.target.value)}
                    onBlur={handleSkuSearch}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkuSearch())}
                    placeholder="Enter SKU..."
                  />
                  <button type="button" onClick={handleSkuSearch} className="bg-slate-200 dark:bg-slate-600 px-3 rounded-md text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                    Search
                  </button>
              </div>
              {skuError && <p className="text-red-500 text-xs mt-1">{skuError}</p>}
          </div>

          <div>
            <label className={labelClass}>Product Name</label>
            <input 
              type="text" 
              required
              className={inputClass}
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Whitening Serum 30ml"
            />
          </div>

          <div>
            <label className={labelClass}>Image URL (Optional)</label>
            <input 
              type="text" 
              className={inputClass}
              value={formData.image} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, image: e.target.value})} 
              placeholder="https://example.com/image.jpg" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className={labelClass}>Sales Count</label>
               <input 
                type="number" 
                required 
                min="0" 
                className={inputClass}
                value={formData.sales} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, sales: Number(e.target.value)})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className={labelClass}>Rank</label>
               <input 
                type="number" 
                required 
                min="1" 
                className={inputClass}
                value={formData.rank} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, rank: Number(e.target.value)})} 
               />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-shopee-orange rounded-lg hover:bg-red-600 shadow-md">
              Save Product
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};