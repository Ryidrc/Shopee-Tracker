import React, { useEffect, useState, useMemo } from 'react';
import { PricingItem, SHOPS } from '../types';
import { formatCurrency } from '../utils';

interface PricingViewProps {
  items: PricingItem[];
  onUpdateItems: (items: PricingItem[]) => void;
  onRequestDelete: (id: string) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ items, onUpdateItems, onRequestDelete }) => {
  const [activeShopId, setActiveShopId] = useState<string>(SHOPS[0].id);

  const handleAddItem = () => {
    const timestamp = Date.now();
    const sku = `NEW-${timestamp.toString().slice(-4)}`;
    
    // Create an item for each shop
    const newItems: PricingItem[] = SHOPS.map(shop => ({
      id: `item-${timestamp}-${shop.id}`,
      sku: sku,
      shopId: shop.id,
      productName: 'New Product',
      image: '',
      brand: '',
      stock: 0,
      price: 0,
      priceNet: 0,
      biaya1250: 1250,
      voucher: 0,
      discount: 0,
      hargaJual: 0,
      flashSale: 0,
      promotion: 0,
      affiliate: 5, // Default 5%
      admin: 8,     // Example default
      ongkir: 4,    // Example default
      total: 0
    }));

    onUpdateItems([...items, ...newItems]);
  };

  const calculateTotal = (item: PricingItem): number => {
    // Percentage Deductions (based on Selling Price)
    const percentageFees = (item.hargaJual * (item.affiliate + item.admin + item.ongkir)) / 100;
    
    // Fixed Deductions (in Rp)
    const fixedFees = item.biaya1250 + item.voucher + item.flashSale + item.promotion;
    
    // Net Payout = Selling Price - Fees
    return item.hargaJual - percentageFees - fixedFees;
  };

  // Recalculate totals on load in case logic changed
  useEffect(() => {
    const updated = items.map(item => ({...item, total: calculateTotal(item)}));
    // Only update if numbers actually changed to prevent loop
    if (JSON.stringify(updated) !== JSON.stringify(items)) {
       onUpdateItems(updated);
    }
  }, []);

  const handleChange = (id: string, field: keyof PricingItem, value: any) => {
    // Fields that should be synchronized across all shops for the same SKU
    const syncedFields: (keyof PricingItem)[] = ['productName', 'image', 'brand', 'priceNet', 'hargaJual', 'biaya1250', 'sku'];
    
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    const isSyncedField = syncedFields.includes(field);

    const updated = items.map(item => {
      // Update the target item
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        newItem.total = calculateTotal(newItem);
        return newItem;
      }
      
      // If it's a synced field and the SKU matches (and it's not the item we just updated), sync the value
      if (isSyncedField && item.sku === targetItem.sku) {
        const newItem = { ...item, [field]: value };
        newItem.total = calculateTotal(newItem); // Recalc total as hargaJual/biaya might have changed
        return newItem;
      }

      return item;
    });
    
    onUpdateItems(updated);
  };

  const visibleItems = useMemo(() => {
    return items.filter(item => item.shopId === activeShopId);
  }, [items, activeShopId]);

  const getTotalColorClass = (total: number, hpp: number) => {
    // If Net Payout < HPP, it's a loss (Red)
    // If Net Payout > HPP but margin is slim, Yellow
    // Else Green
    if (total < hpp) return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    if (total < hpp * 1.1) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
  };

  const thClass = "px-3 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap bg-slate-50 dark:bg-slate-700 sticky top-0 border-b dark:border-slate-600 z-10";
  const tdClass = "px-3 py-2 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700";
  const inputClass = "w-full bg-transparent border-none focus:ring-1 focus:ring-shopee-orange rounded px-1 py-0.5 text-sm text-slate-900 dark:text-slate-100";

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Pricing Calculator</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {SHOPS.find(s => s.id === activeShopId)?.name} View
          </p>
        </div>
        
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
            {SHOPS.map(shop => (
                <button
                    key={shop.id}
                    onClick={() => setActiveShopId(shop.id)}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                        activeShopId === shop.id 
                        ? 'bg-white dark:bg-slate-600 shadow text-shopee-orange' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                >
                    {shop.name}
                </button>
            ))}
        </div>

        <button 
          onClick={handleAddItem}
          className="bg-shopee-orange text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-red-600 transition"
        >
          + Add Product (All Shops)
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr>
                <th className={`${thClass} left-0 z-20 shadow-r`}>SKU</th>
                <th className={thClass}>Product Name</th>
                <th className={thClass}>Image URL</th>
                <th className={thClass}>Stock</th>
                {/* <th className={thClass}>Price</th> */}
                <th className={thClass}>HPP (Modal)</th>
                <th className={thClass}>Biaya 1250</th>
                <th className={thClass}>Voucher</th>
                <th className={thClass} style={{ color: '#EE4D2D' }}>Harga Jual</th>
                <th className={thClass}>Flash Sale (Rp)</th>
                <th className={thClass}>Promotion (Rp)</th>
                <th className={thClass}>Affiliate %</th>
                <th className={thClass}>Admin %</th>
                <th className={thClass}>Ongkir %</th>
                <th className={`${thClass} right-0 z-20 shadow-l text-center`}>NET PAYOUT</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {visibleItems.map((item) => {
                const isLowStock = item.stock < 10;
                return (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <td className={`${tdClass} sticky left-0 bg-white dark:bg-slate-800 z-10 shadow-r font-medium text-slate-900 dark:text-white`}>
                    <input type="text" value={item.sku} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'sku', e.target.value)} className={`${inputClass} font-bold w-24`} placeholder="SKU" />
                  </td>
                  <td className={tdClass}>
                    <input type="text" value={item.productName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'productName', e.target.value)} className={`${inputClass} w-32`} placeholder="Name" />
                  </td>
                  <td className={tdClass}>
                    <input type="text" value={item.image} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'image', e.target.value)} className={`${inputClass} w-24 text-xs`} placeholder="http://..." />
                  </td>
                  <td className={tdClass}>
                    <input 
                        type="number" 
                        value={item.stock} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'stock', Number(e.target.value))} 
                        className={`${inputClass} w-16 text-center rounded-md ${isLowStock ? 'bg-red-500 text-white font-bold animate-pulse' : ''}`} 
                    />
                  </td>
                 {/*  <td className={tdClass}>
                    <input type="number" value={item.price} onChange={e => handleChange(item.id, 'price', Number(e.target.value))} className={`${inputClass} w-24`} />
                  </td> */}
                  
                  <td className={tdClass}>
                    <input type="number" value={item.priceNet} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'priceNet', Number(e.target.value))} className={`${inputClass} w-24 font-medium text-red-500`} />
                  </td>
                  <td className={tdClass}>
                    <input type="number" value={item.biaya1250} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'biaya1250', Number(e.target.value))} className={`${inputClass} w-16 text-center`} />
                  </td>
                  <td className={tdClass}>
                    <input type="number" value={item.voucher} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'voucher', Number(e.target.value))} className={`${inputClass} w-20`} />
                  </td>
                  <td className={tdClass}>
                    <input type="number" value={item.hargaJual} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'hargaJual', Number(e.target.value))} className={`${inputClass} w-24 font-bold text-shopee-orange`} />
                  </td>

                  {/* Deductions (Rp) */}
                  <td className={tdClass}><input type="number" value={item.flashSale} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'flashSale', Number(e.target.value))} className={`${inputClass} w-20 text-center`} /></td>
                  <td className={tdClass}><input type="number" value={item.promotion} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'promotion', Number(e.target.value))} className={`${inputClass} w-20 text-center`} /></td>

                  {/* Percentages */}
                  <td className={tdClass}><input type="number" value={item.affiliate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'affiliate', Number(e.target.value))} className={`${inputClass} w-12 text-center`} />%</td>
                  <td className={tdClass}><input type="number" value={item.admin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'admin', Number(e.target.value))} className={`${inputClass} w-12 text-center`} />%</td>
                  <td className={tdClass}><input type="number" value={item.ongkir} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'ongkir', Number(e.target.value))} className={`${inputClass} w-12 text-center`} />%</td>

                  <td className={`${tdClass} sticky right-0 bg-white dark:bg-slate-800 z-10 shadow-l text-center`}>
                    <div className="flex flex-col">
                      <span className={`font-bold px-2 py-1 rounded ${getTotalColorClass(item.total, item.priceNet)}`}>
                        {formatCurrency(item.total)}
                      </span>
                      {item.total > 0 && item.priceNet > 0 && (
                          <span className="text-[10px] text-slate-400 mt-0.5">
                              Profit: {formatCurrency(item.total - item.priceNet)}
                          </span>
                      )}
                    </div>
                  </td>
                  <td className={tdClass}>
                    <button onClick={() => onRequestDelete(item.id)} className="text-slate-400 hover:text-red-500" title="Delete from ALL shops">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              )})}
              {visibleItems.length === 0 && (
                <tr>
                  <td colSpan={17} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No items found for {SHOPS.find(s => s.id === activeShopId)?.name}. <br/>
                    Click "+ Add Product" to create new inventory for all shops.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-orange-50 dark:bg-slate-800 p-4 rounded-lg text-xs text-slate-500 dark:text-slate-400 border border-orange-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between">
        <div>
            <strong>Formula:</strong> <code>Harga Jual - (Admin% + Affiliate% + Ongkir%) - (Biaya 1250 + Voucher + Flash Sale + Promotion) = Net Payout</code>.<br/>
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span> Loss (Below Modal) 
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-3 mr-1"></span> Profit
        </div>
        <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded bg-red-500 animate-pulse"></span> 
            <strong>Low Stock Alert:</strong> Items with stock &lt; 10 will highlight red automatically.
        </div>
      </div>
    </div>
  );
};