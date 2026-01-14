import React, { useState } from 'react';
import { CompetitorItem, PricingItem, SHOPS } from '../types';
import { formatCurrency } from '../utils';

interface CompetitorViewProps {
  competitors: CompetitorItem[];
  onUpdateCompetitors: (items: CompetitorItem[]) => void;
  pricingItems: PricingItem[];
  onRequestDelete: (id: string) => void;
}

export const CompetitorView: React.FC<CompetitorViewProps> = ({ competitors, onUpdateCompetitors, pricingItems, onRequestDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newComp, setNewComp] = useState<Partial<CompetitorItem>>({});

  const handleAdd = () => {
    if (!newComp.mySku || !newComp.competitorPrice || !newComp.competitorName) return;
    
    // Find shopId from Pricing Items if possible
    const linkedProduct = pricingItems.find(p => p.sku === newComp.mySku);

    const item: CompetitorItem = {
      id: `comp-${Date.now()}`,
      mySku: newComp.mySku,
      shopId: linkedProduct?.shopId || 'shop1',
      competitorName: newComp.competitorName,
      competitorPrice: Number(newComp.competitorPrice),
      lastChecked: new Date().toISOString().split('T')[0]
    };

    onUpdateCompetitors([...competitors, item]);
    setIsAdding(false);
    setNewComp({});
  };

  const handleUpdatePrice = (id: string, price: number) => {
    onUpdateCompetitors(competitors.map(c => c.id === id ? { ...c, competitorPrice: price, lastChecked: new Date().toISOString().split('T')[0] } : c));
  };

  const getMyPrice = (sku: string) => {
    const item = pricingItems.find(p => p.sku === sku);
    return item ? item.hargaJual : 0;
  };

  const getPriceDiff = (myPrice: number, compPrice: number) => {
    const diff = myPrice - compPrice;
    const percent = compPrice > 0 ? (diff / compPrice) * 100 : 0;
    return { diff, percent };
  };

  const inputClass = "border-slate-300 dark:border-slate-600 rounded-md p-2 border shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white w-full";

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Competitor Price Tracking</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor other shops selling similar products.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-shopee-orange text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-red-600 transition"
        >
          {isAdding ? 'Cancel' : '+ Track Competitor'}
        </button>
      </div>

      {isAdding && (
         <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-600 animate-fade-in mb-4">
            <h3 className="text-sm font-bold mb-3 dark:text-white">Add New Tracking</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">My SKU</label>
                    <input list="sku-list" className={inputClass} value={newComp.mySku || ''} onChange={e => setNewComp({...newComp, mySku: e.target.value})} placeholder="Select SKU" />
                    <datalist id="sku-list">
                        {pricingItems.map(p => <option key={p.id} value={p.sku}>{p.productName}</option>)}
                    </datalist>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Competitor Shop Name</label>
                    <input type="text" className={inputClass} value={newComp.competitorName || ''} onChange={e => setNewComp({...newComp, competitorName: e.target.value})} placeholder="e.g. Official Store" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Their Price (Rp)</label>
                    <input type="number" className={inputClass} value={newComp.competitorPrice || ''} onChange={e => setNewComp({...newComp, competitorPrice: Number(e.target.value)})} placeholder="0" />
                </div>
                <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-green-700 h-10">
                    Save
                </button>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {competitors.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl">
                No competitors tracked yet.
            </div>
        ) : (
            competitors.map(comp => {
                const myPrice = getMyPrice(comp.mySku);
                const { diff, percent } = getPriceDiff(myPrice, comp.competitorPrice);
                const isExpensive = diff > 0;
                
                return (
                    <div key={comp.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-800 dark:text-white">{comp.mySku}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">vs {comp.competitorName}</span>
                            </div>
                            <div className="text-xs text-slate-400">Last Checked: {comp.lastChecked}</div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">My Price</div>
                                <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(myPrice)}</div>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Competitor</div>
                                <div className="flex items-center gap-2">
                                     <input 
                                        type="number" 
                                        value={comp.competitorPrice} 
                                        onChange={(e) => handleUpdatePrice(comp.id, Number(e.target.value))}
                                        className="w-24 text-center border-b border-slate-300 dark:border-slate-600 bg-transparent focus:border-shopee-orange outline-none font-medium dark:text-white"
                                     />
                                </div>
                            </div>

                            <div className="text-right min-w-[120px]">
                                <div className={`font-bold text-lg ${isExpensive ? 'text-red-500' : 'text-green-500'}`}>
                                    {isExpensive ? '+' : ''}{formatCurrency(diff)}
                                </div>
                                <div className={`text-xs ${isExpensive ? 'text-red-400' : 'text-green-400'}`}>
                                    {isExpensive ? 'More Expensive' : 'Cheaper'} ({Math.abs(percent).toFixed(1)}%)
                                </div>
                            </div>
                            
                            <button onClick={() => onRequestDelete(comp.id)} className="text-slate-300 hover:text-red-500">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};