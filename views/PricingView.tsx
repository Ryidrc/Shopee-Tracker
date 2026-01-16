
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { PricingItem, SHOPS } from '../types';
import { formatCurrency, formatNumber } from '../utils';

interface PricingViewProps {
  items: PricingItem[];
  onUpdateItems: (items: PricingItem[]) => void;
  onRequestDelete: (id: string) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ items, onUpdateItems, onRequestDelete }) => {
  const [activeShopId, setActiveShopId] = useState<string>(SHOPS[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const tableBottomRef = useRef<HTMLDivElement>(null);

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
      rating: 5.0, 
      price: 0,
      priceNet: 0,
      biaya1250: 1250,
      voucher: 0,
      voucherExpiry: '',
      discount: 0,
      hargaJual: 0,
      flashSale: 0,
      promotion: 0,
      affiliate: 5,
      admin: 8,
      ongkir: 4,
      total: 0
    }));

    onUpdateItems([...items, ...newItems]);
    setTimeout(() => {
        tableBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const calculateTotal = (item: PricingItem): number => {
    const percentageFees = (item.hargaJual * (item.affiliate + item.admin + item.ongkir)) / 100;
    const fixedFees = item.biaya1250 + item.voucher + item.flashSale + item.promotion;
    return item.hargaJual - percentageFees - fixedFees;
  };

  useEffect(() => {
    const updated = items.map(item => ({...item, total: calculateTotal(item)}));
    if (JSON.stringify(updated) !== JSON.stringify(items)) {
       onUpdateItems(updated);
    }
  }, []);

  const handleChange = (id: string, field: keyof PricingItem, value: any) => {
    const syncedFields: (keyof PricingItem)[] = ['productName', 'image', 'brand', 'priceNet', 'hargaJual', 'biaya1250', 'sku'];
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    const isSyncedField = syncedFields.includes(field);
    const updated = items.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        newItem.total = calculateTotal(newItem);
        return newItem;
      }
      if (isSyncedField && item.sku === targetItem.sku) {
        const newItem = { ...item, [field]: value };
        newItem.total = calculateTotal(newItem); 
        return newItem;
      }
      return item;
    });
    onUpdateItems(updated);
  };

  const visibleItems = useMemo(() => {
    return items.filter(item => 
      item.shopId === activeShopId && 
      (item.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
       item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, activeShopId, searchTerm]);

  const metrics = useMemo(() => {
    const shopItems = items.filter(i => i.shopId === activeShopId);
    const totalStock = shopItems.reduce((acc, curr) => acc + curr.stock, 0);
    const totalValue = shopItems.reduce((acc, curr) => acc + (curr.stock * curr.priceNet), 0);
    const potentialRevenue = shopItems.reduce((acc, curr) => acc + (curr.stock * curr.total), 0);
    const potentialProfit = potentialRevenue - totalValue;

    return { totalStock, totalValue, potentialProfit };
  }, [items, activeShopId]);

  const getDaysRemaining = (expiryDate: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const exp = new Date(expiryDate);
    exp.setHours(0,0,0,0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getVoucherInputClass = (expiryDate: string | undefined) => {
     if (!expiryDate) return inputClass + " text-slate-400";
     const days = getDaysRemaining(expiryDate);
     if (days === null) return inputClass;
     if (days < 0) return inputClass + " text-red-500 font-bold"; 
     if (days <= 2) return inputClass + " text-orange-500 font-bold";
     return inputClass + " text-green-600";
  };

  const expiringItems = useMemo(() => {
      return items.filter(item => {
          if (!item.voucherExpiry || item.voucher === 0) return false;
          const days = getDaysRemaining(item.voucherExpiry);
          return days !== null && days <= 2;
      }).map(item => ({
          sku: item.sku,
          shopName: SHOPS.find(s => s.id === item.shopId)?.name,
          expiry: item.voucherExpiry,
          days: getDaysRemaining(item.voucherExpiry)
      }));
  }, [items]);

  const getTotalColorClass = (total: number, hpp: number) => {
    if (total < hpp) return 'text-red-600 bg-red-50 dark:bg-red-900/30';
    if (total < hpp * 1.1) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30';
    return 'text-green-600 bg-green-50 dark:bg-green-900/30';
  };

  const thClass = "px-4 py-3 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap bg-white dark:bg-slate-800 sticky top-0 border-b border-slate-100 dark:border-slate-700 z-10";
  const tdClass = "px-4 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 border-b border-slate-50 dark:border-slate-800";
  const inputClass = "w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-300";

  return (
    <div className="space-y-6">

      {/* Expiry Alert Banner - Minimal */}
      {expiringItems.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 flex items-center gap-4 animate-fade-in">
                 <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                 <div className="flex-1 text-sm text-red-800 dark:text-red-200">
                     <span className="font-bold">Vouchers Expiring:</span> {expiringItems.length} items need attention.
                 </div>
          </div>
      )}

      {/* Metrics Summary - Clean Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stock</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatNumber(metrics.totalStock)}</div>
         </div>
         <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capital (HPP)</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(metrics.totalValue)}</div>
         </div>
         <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="text-xs font-bold text-green-500 uppercase tracking-wider">Est. Profit</div>
            <div className="text-2xl font-bold text-green-500 mt-1">{formatCurrency(metrics.potentialProfit)}</div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <input 
               type="text"
               placeholder="Search SKU..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="border-none bg-slate-50 dark:bg-slate-700 rounded-full px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-0 w-full md:w-64"
            />
            
            <div className="flex bg-slate-50 dark:bg-slate-700 rounded-full p-1">
                {SHOPS.map(shop => (
                    <button
                        key={shop.id}
                        onClick={() => setActiveShopId(shop.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            activeShopId === shop.id 
                            ? 'bg-white dark:bg-slate-600 shadow-sm text-shopee-orange' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {shop.name}
                    </button>
                ))}
            </div>
        </div>

        <button 
           onClick={handleAddItem}
           className="bg-shopee-orange text-white px-5 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-red-600 transition whitespace-nowrap"
        >
           + Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className={`${thClass} left-0 z-20`}>SKU</th>
                <th className={thClass}>Product Name</th>
                <th className={thClass}>Stock</th>
                <th className={thClass}>Rating</th>
                <th className={thClass}>HPP</th>
                <th className={thClass}>1250</th>
                <th className={thClass}>Voucher</th>
                <th className={thClass}>Exp.</th>
                <th className={thClass} style={{ color: '#EE4D2D' }}>Harga Jual</th>
                <th className={thClass}>Flash</th>
                <th className={thClass}>Promo</th>
                <th className={thClass}>Aff %</th>
                <th className={thClass}>Adm %</th>
                <th className={thClass}>Ong %</th>
                <th className={`${thClass} right-0 z-20 text-center`}>NET PAYOUT</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
              {visibleItems.map((item) => {
                const isLowStock = item.stock < 10;
                return (
                <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className={`${tdClass} sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50 z-10`}>
                    <input type="text" value={item.sku} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'sku', e.target.value)} className={`${inputClass} font-bold w-20`} placeholder="SKU" />
                  </td>
                  <td className={tdClass}>
                    <input type="text" value={item.productName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'productName', e.target.value)} className={`${inputClass} w-32`} placeholder="Name" />
                  </td>
                  <td className={tdClass}>
                    <input 
                        type="number" 
                        value={item.stock} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'stock', Number(e.target.value))} 
                        className={`${inputClass} w-12 text-center rounded ${isLowStock ? 'text-red-500 font-bold bg-red-50' : ''}`} 
                    />
                  </td>
                   <td className={tdClass}>
                    <input 
                        type="number" 
                        step="0.1"
                        value={item.rating || 0} 
                        onChange={(e) => handleChange(item.id, 'rating', Number(e.target.value))} 
                        className={`${inputClass} w-10 text-center ${(item.rating || 5) < 4 ? 'text-red-500 font-bold' : 'text-slate-500'}`} 
                    />
                  </td>
                  
                  <td className={tdClass}>
                    <input type="number" value={item.priceNet} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'priceNet', Number(e.target.value))} className={`${inputClass} w-20 text-slate-500`} />
                  </td>
                  <td className={tdClass}>
                    <input type="number" value={item.biaya1250} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'biaya1250', Number(e.target.value))} className={`${inputClass} w-12 text-center text-slate-400`} />
                  </td>
                  <td className={tdClass}>
                    <input type="number" value={item.voucher} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'voucher', Number(e.target.value))} className={`${inputClass} w-16`} />
                  </td>
                  <td className={tdClass}>
                     <input 
                        type="date" 
                        value={item.voucherExpiry || ''} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'voucherExpiry', e.target.value)} 
                        className={`${getVoucherInputClass(item.voucherExpiry)} w-24`} 
                     />
                  </td>
                  <td className={tdClass}>
                    <input type="number" value={item.hargaJual} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'hargaJual', Number(e.target.value))} className={`${inputClass} w-20 font-bold text-shopee-orange`} />
                  </td>

                  {/* Deductions (Rp) */}
                  <td className={tdClass}><input type="number" value={item.flashSale} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'flashSale', Number(e.target.value))} className={`${inputClass} w-16 text-center`} /></td>
                  <td className={tdClass}><input type="number" value={item.promotion} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'promotion', Number(e.target.value))} className={`${inputClass} w-16 text-center`} /></td>

                  {/* Percentages */}
                  <td className={tdClass}><input type="number" value={item.affiliate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'affiliate', Number(e.target.value))} className={`${inputClass} w-8 text-center text-slate-400`} /></td>
                  <td className={tdClass}><input type="number" value={item.admin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'admin', Number(e.target.value))} className={`${inputClass} w-8 text-center text-slate-400`} /></td>
                  <td className={tdClass}><input type="number" value={item.ongkir} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'ongkir', Number(e.target.value))} className={`${inputClass} w-8 text-center text-slate-400`} /></td>

                  <td className={`${tdClass} sticky right-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50 z-10 text-center`}>
                    <div className="flex flex-col items-center">
                      <span className={`font-bold px-2 py-0.5 rounded text-xs ${getTotalColorClass(item.total, item.priceNet)}`}>
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  </td>
                  <td className={tdClass}>
                    <button onClick={() => onRequestDelete(item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              )})}
               <tr ref={tableBottomRef}></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
