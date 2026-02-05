
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { PricingItem, SHOPS } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils';
import { PricingCalculator } from '../components/PricingCalculator';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Calculator, Plus, Trash2, X, Check, Save } from 'lucide-react';

interface PricingViewProps {
  items: PricingItem[];
  onUpdateItems: (items: PricingItem[]) => void;
  onRequestDelete: (id: string) => void;
}

type SortConfig = {
  key: keyof PricingItem;
  direction: 'asc' | 'desc';
} | null;

export const PricingView: React.FC<PricingViewProps> = ({ items, onUpdateItems, onRequestDelete }) => {
  const [activeShopId, setActiveShopId] = useState<string>(SHOPS[0]!.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const tableBottomRef = useRef<HTMLTableRowElement>(null);

  // Bulk Edit State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [bulkField, setBulkField] = useState<string>('');
  const [bulkValue, setBulkValue] = useState<string>('');

  // Calculator Modal State
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Default values for new items
  const handleAddItem = () => {
    const timestamp = Date.now();
    const sku = `NEW-${timestamp.toString().slice(-4)}`;
    
    // Default Expiry: Today + 2 Years
    const defaultExp = new Date();
    defaultExp.setFullYear(defaultExp.getFullYear() + 2);

    const newItems: PricingItem[] = SHOPS.map(shop => ({
      id: `item-${timestamp}-${shop.id}`,
      sku: sku,
      shopId: shop.id,
      productName: sku, // Default Name = SKU
      image: '',
      brand: '',
      stock: 0,
      rating: 0, 
      price: 0, // Harga Sekarang
      priceNet: 20000, // Default HPP
      biaya1250: 1250,
      voucher: 0,
      voucherExpiry: defaultExp.toISOString().split('T')[0],
      discount: 0,
      hargaJual: 0, // Harga Dicari
      flashSale: 0, // Flash Sale %
      promotion: 0, // Promo %
      affiliate: 5,
      admin: 9, // Fixed Default 9
      ongkir: 4, // Fixed Default 4
      total: 0
    }));

    onUpdateItems([...items, ...newItems]);
    setTimeout(() => {
        tableBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Logic: 
  // Fees = 1250 + (HargaJual * (Admin% + Ongkir% + Affiliate% + FlashSale% + Promo%))
  // Net = HargaJual - Fees
  const calculateTotal = (item: PricingItem): number => {
    const percentageSum = item.affiliate + item.admin + item.ongkir + item.flashSale + item.promotion;
    const percentageFees = (item.hargaJual * percentageSum) / 100;
    const fixedFees = item.biaya1250;
    
    return item.hargaJual - percentageFees - fixedFees;
  };

  // Recalculate totals on mount if needed
  useEffect(() => {
    const updated = items.map(item => ({...item, total: calculateTotal(item)}));
    if (JSON.stringify(updated.map(i => i.total)) !== JSON.stringify(items.map(i => i.total))) {
       onUpdateItems(updated);
    }
  }, []);

  const handleChange = (id: string, field: keyof PricingItem, value: any) => {
    const syncedFields: (keyof PricingItem)[] = ['productName', 'image', 'brand', 'priceNet', 'sku', 'stock'];
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

  // --- BULK EDIT LOGIC ---
  const handleSelectAll = (checked: boolean) => {
      if (checked) {
          setSelectedItemIds(new Set(visibleItems.map(i => i.id)));
      } else {
          setSelectedItemIds(new Set());
      }
  };

  const handleSelectRow = (id: string) => {
      const newSet = new Set(selectedItemIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedItemIds(newSet);
  };

  const handleApplyBulkEdit = () => {
      if (!bulkField || selectedItemIds.size === 0) return;

      let val: any = bulkValue;
      // Convert to number for numeric fields
      if (bulkField !== 'voucherExpiry') {
          val = Number(bulkValue);
      }

      const updated = items.map(item => {
          if (selectedItemIds.has(item.id)) {
              // Apply change
              const newItem = { ...item, [bulkField]: val };
              // Recalculate total if needed
              newItem.total = calculateTotal(newItem);
              return newItem;
          }
          return item;
      });

      onUpdateItems(updated);
      setSelectedItemIds(new Set()); // Reset selection
      setBulkValue('');
      setBulkField('');
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItemIds.size} items? This cannot be undone.`)) {
        const remaining = items.filter(item => !selectedItemIds.has(item.id));
        onUpdateItems(remaining);
        setSelectedItemIds(new Set());
    }
  };
  // -----------------------

  const handleSort = (key: keyof PricingItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const visibleItems = useMemo(() => {
    let filtered = items.filter(item => 
      item.shopId === activeShopId && 
      (item.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
       item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        // Handle undefined values safely
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [items, activeShopId, searchTerm, sortConfig]);

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

  // Helper to check if expired (Today or Past)
  const isExpired = (expiryDate: string | undefined): boolean => {
      if (!expiryDate) return false;
      const days = getDaysRemaining(expiryDate);
      return days !== null && days <= 0;
  };

  const getVoucherInputClass = (expiryDate: string | undefined) => {
     if (!expiryDate) return inputClass + " text-slate-400";
     const days = getDaysRemaining(expiryDate);
     if (days === null) return inputClass;
     // Note: If expired, the whole row is red, but we can keep text bold
     if (days <= 0) return inputClass + " font-bold text-red-900 dark:text-red-100"; 
     if (days <= 2) return inputClass + " text-orange-500 font-bold";
     return inputClass + " text-green-600";
  };

  const getMarginColorClass = (net: number, hpp: number) => {
    if (net <= hpp) return 'text-red-600 bg-red-100 dark:bg-red-900/40';
    // Margin check: (Net - HPP) / HPP. If <= 20% margin (0.2), then Yellow.
    const margin = hpp > 0 ? (net - hpp) / hpp : 0;
    if (margin <= 0.20) return 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/40';
    
    return 'text-green-600 bg-green-100 dark:bg-green-900/40';
  };

  // Sort Indicator Helper
  const SortIcon = ({ columnKey }: { columnKey: keyof PricingItem }) => {
    if (sortConfig?.key !== columnKey) return <span className="opacity-0 group-hover:opacity-30 ml-1">↕</span>;
    return <span className="ml-1 text-shopee-orange">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const thClass = "px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap bg-white dark:bg-slate-800 sticky top-0 border-b border-slate-100 dark:border-slate-700 z-10 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors select-none group";
  const tdClass = "px-6 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 border-b border-slate-50 dark:border-slate-800";
  const inputClass = "w-full bg-transparent border-none p-1 text-sm focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Pricing Calculator Modal */}
      <PricingCalculator 
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
      
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="border-l-4 border-l-blue-500 p-5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stock</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-200 mt-1 font-display">{formatNumber(metrics.totalStock)}</div>
         </Card>
         <Card className="border-l-4 border-l-purple-500 p-5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capital (HPP)</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-200 mt-1 font-display">{formatCurrency(metrics.totalValue)}</div>
         </Card>
         <Card className="border-l-4 border-l-green-500 p-5">
            <div className="text-xs font-bold text-green-500 uppercase tracking-wider">Est. Profit</div>
            <div className="text-2xl font-bold text-green-500 mt-1 font-display">{formatCurrency(metrics.potentialProfit)}</div>
         </Card>
      </div>

      {/* Toolbar: Search, Filter, Add */}
      <Card className="flex flex-col md:flex-row justify-between items-center gap-4 p-5">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <input 
               type="text"
               placeholder="Search SKU..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="border-none bg-slate-50 dark:bg-slate-700 rounded-full px-4 py-2 text-sm text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-shopee-orange/20 w-full md:w-64"
            />
            
            <div className="flex bg-slate-100 dark:bg-slate-700/50 rounded-full p-1">
                {SHOPS.map(shop => (
                    <button
                        key={shop.id}
                        onClick={() => { setActiveShopId(shop.id); setSelectedItemIds(new Set()); }}
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

        <div className="flex gap-2">
          <Button 
             onClick={() => setIsCalculatorOpen(true)}
             className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm"
          >
             <Calculator size={16} />
             Calculator
          </Button>
          <Button 
             onClick={handleAddItem}
             className="gap-2 shadow-sm"
          >
             <Plus size={16} />
             Add Product
          </Button>
        </div>
      </Card>

      {/* Bulk Edit Toolbar (Visible when items selected) */}
      {selectedItemIds.size > 0 && (
         <Card className="bg-blue-600 dark:bg-blue-700 text-white p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in border-none">
             <div className="flex items-center gap-2">
                 <div className="bg-white/20 p-1.5 rounded-md font-bold text-sm px-3">
                     {selectedItemIds.size} Selected
                 </div>
                 <span className="text-sm font-medium opacity-90 hidden sm:inline">Choose action:</span>
             </div>
             
             <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                 <select 
                    className="rounded-lg border-none bg-white text-slate-900 text-sm py-2 pl-3 pr-8 focus:ring-2 focus:ring-white/50 cursor-pointer shadow-sm"
                    value={bulkField}
                    onChange={(e) => setBulkField(e.target.value)}
                 >
                     <option value="">-- Select Field --</option>
                     <option value="stock">Stock</option>
                     <option value="rating">Rating</option>
                     <option value="priceNet">HPP (Capital)</option>
                     <option value="voucherExpiry">Voucher Exp</option>
                     <option value="price">Harga Sekarang</option>
                     <option value="hargaJual">Harga Jual</option>
                     <option value="flashSale">Flash Sale %</option>
                     <option value="promotion">Promo %</option>
                     <option value="affiliate">Affiliate %</option>
                     <option value="admin">Admin %</option>
                     <option value="ongkir">Ongkir %</option>
                 </select>

                 <input 
                    type={bulkField === 'voucherExpiry' ? 'date' : 'number'}
                    placeholder={bulkField ? "New Value" : "Select field first"}
                    className="rounded-lg border-none bg-white text-slate-900 text-sm py-2 px-3 w-32 focus:ring-2 focus:ring-white/50 shadow-sm"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    disabled={!bulkField}
                 />
                 
                 <Button 
                    onClick={handleApplyBulkEdit}
                    disabled={!bulkField}
                    className="bg-white text-blue-600 hover:bg-blue-50 border-none"
                    size="sm"
                 >
                    Apply
                 </Button>
                 
                 <div className="w-px h-8 bg-white/20 mx-1 hidden md:block"></div>

                 <Button 
                    onClick={handleBulkDelete}
                    variant="danger"
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white border-none gap-2"
                 >
                    <Trash2 size={14} />
                    Delete ({selectedItemIds.size})
                 </Button>

                 <button 
                    onClick={() => setSelectedItemIds(new Set())}
                    className="text-white/80 hover:text-white text-sm underline px-2"
                 >
                    Cancel
                 </button>
             </div>
         </Card>
      )}

      <Card className="overflow-hidden p-0 flex flex-col">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full">
            <thead>
              <tr>
                {/* Checkbox Column */}
                <th className={`${thClass} w-14 px-0 text-center sticky left-0 z-50`} style={{ minWidth: '56px' }}>
                    <input 
                        type="checkbox" 
                        checked={visibleItems.length > 0 && selectedItemIds.size === visibleItems.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 text-shopee-orange focus:ring-shopee-orange cursor-pointer"
                    />
                </th>
                <th className={`${thClass} left-14 z-40`} style={{ minWidth: '160px' }} onClick={() => handleSort('sku')}>SKU <SortIcon columnKey="sku" /></th>
                <th className={thClass} onClick={() => handleSort('productName')}>Name <SortIcon columnKey="productName" /></th>
                <th className={thClass} onClick={() => handleSort('stock')}>Stock <SortIcon columnKey="stock" /></th>
                <th className={thClass} onClick={() => handleSort('rating')}>Rating <SortIcon columnKey="rating" /></th>
                <th className={thClass} onClick={() => handleSort('priceNet')}>HPP <SortIcon columnKey="priceNet" /></th>
                <th className={thClass} onClick={() => handleSort('voucherExpiry')}>Exp. <SortIcon columnKey="voucherExpiry" /></th>
                <th className={thClass} onClick={() => handleSort('price')}>Harga Skrg <SortIcon columnKey="price" /></th>
                <th className={thClass} style={{ color: '#EE4D2D' }} onClick={() => handleSort('hargaJual')}>Harga Jual <SortIcon columnKey="hargaJual" /></th>
                <th className={thClass}>Voucher %</th>
                <th className={thClass} onClick={() => handleSort('flashSale')}>Flash % <SortIcon columnKey="flashSale" /></th>
                <th className={thClass} onClick={() => handleSort('promotion')}>Promo % <SortIcon columnKey="promotion" /></th>
                <th className={thClass} onClick={() => handleSort('affiliate')}>Aff % <SortIcon columnKey="affiliate" /></th>
                <th className={thClass} onClick={() => handleSort('admin')}>Adm % <SortIcon columnKey="admin" /></th>
                <th className={thClass} onClick={() => handleSort('ongkir')}>Ong % <SortIcon columnKey="ongkir" /></th>
                <th className={`${thClass} right-0 z-40 text-center`} onClick={() => handleSort('total')}>NET PAYOUT <SortIcon columnKey="total" /></th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900">
              {visibleItems.map((item) => {
                const voucherPct = item.price > 0 ? ((item.price - item.hargaJual) / item.price) * 100 : 0;
                const expiredRow = isExpired(item.voucherExpiry);
                const isSelected = selectedItemIds.has(item.id);
                
                return (
                <tr 
                  key={item.id} 
                  className={`group transition-colors border-b border-slate-50 dark:border-slate-800 
                    ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    ${expiredRow && !isSelected
                      ? 'bg-red-100 dark:bg-red-900/40' 
                      : !isSelected ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800' : ''
                    }`}
                >
                  <td className={`${tdClass} sticky left-0 z-40 text-center w-14 px-0 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : (expiredRow ? 'bg-red-100 dark:bg-red-900/40' : 'bg-white dark:bg-slate-900')}`} style={{ minWidth: '56px' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleSelectRow(item.id)}
                        className="rounded border-slate-300 text-shopee-orange focus:ring-shopee-orange cursor-pointer"
                      />
                  </td>
                  <td className={`${tdClass} sticky left-14 z-30 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : (expiredRow ? 'bg-red-100 dark:bg-red-900/40' : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800')}`} style={{ minWidth: '160px' }}>
                    <input type="text" value={item.sku} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'sku', e.target.value)} className={`${inputClass} font-bold w-full`} placeholder="SKU" />
                  </td>
                  <td className={tdClass}>
                    <input type="text" value={item.productName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'productName', e.target.value)} className={`${inputClass} w-64`} placeholder="Name" />
                  </td>
                  <td className={tdClass}>
                    <input 
                        type="number" 
                        value={item.stock} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'stock', Number(e.target.value))} 
                        className={`${inputClass} w-10 text-center`} 
                    />
                  </td>
                  <td className={tdClass}>
                    <input 
                        type="number" 
                        step="0.1"
                        value={item.rating || 0} 
                        onChange={(e) => handleChange(item.id, 'rating', Number(e.target.value))} 
                        className={`${inputClass} w-8 text-center`} 
                    />
                  </td>
                  <td className={tdClass}>
                    <input type="number" value={item.priceNet} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'priceNet', Number(e.target.value))} className={`${inputClass} w-40 text-slate-500`} />
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
                    <input type="number" value={item.price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'price', Number(e.target.value))} className={`${inputClass} w-40`} />
                  </td>
                  <td className={tdClass}>
                    <input type="number" value={item.hargaJual} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'hargaJual', Number(e.target.value))} className={`${inputClass} w-40 font-bold text-shopee-orange`} />
                  </td>
                  <td className={tdClass}>
                      <span className="text-xs font-mono text-fuchsia-600 bg-fuchsia-100 dark:text-fuchsia-300 dark:bg-fuchsia-900/50 px-2 py-1 rounded font-bold border border-fuchsia-200 dark:border-fuchsia-800">
                        {Math.max(0, voucherPct).toFixed(1)}%
                      </span>
                  </td>
                  
                  {/* Percentage Inputs */}
                  <td className={tdClass}><input type="number" value={item.flashSale} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'flashSale', Number(e.target.value))} className={`${inputClass} w-10 text-center`} /></td>
                  <td className={tdClass}><input type="number" value={item.promotion} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'promotion', Number(e.target.value))} className={`${inputClass} w-10 text-center`} /></td>
                  <td className={tdClass}><input type="number" value={item.affiliate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'affiliate', Number(e.target.value))} className={`${inputClass} w-10 text-center text-slate-400`} /></td>
                  <td className={tdClass}><input type="number" value={item.admin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'admin', Number(e.target.value))} className={`${inputClass} w-10 text-center text-slate-400`} /></td>
                  <td className={tdClass}><input type="number" value={item.ongkir} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(item.id, 'ongkir', Number(e.target.value))} className={`${inputClass} w-10 text-center text-slate-400`} /></td>

                  <td className={`${tdClass} sticky right-0 z-30 text-center ${isSelected ? 'bg-blue-50 dark:bg-slate-800' : (expiredRow ? 'bg-red-100 dark:bg-red-900' : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800')}`}>
                    <div className="flex flex-col items-center">
                      <span className={`font-bold px-2 py-1 rounded text-xs ${getMarginColorClass(item.total, item.priceNet)}`}>
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
      </Card>
    </div>
  );
};
