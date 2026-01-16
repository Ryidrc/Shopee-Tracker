
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
  const [heroOnly, setHeroOnly] = useState(true);

  const handleAdd = () => {
    if (!newComp.mySku || !newComp.competitorPrice || !newComp.competitorName) return;
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

  const filteredCompetitors = heroOnly ? competitors.slice(0, 20) : competitors;
  const inputClass = "bg-slate-50 dark:bg-slate-700 border-none rounded-lg p-2 text-slate-900 dark:text-white w-full focus:ring-1 focus:ring-shopee-orange";

  return (
    <div className="space-y-6">
      {/* Strategy Tip Banner - Minimal */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
          <div className="text-sm text-indigo-800 dark:text-indigo-200">
              <span className="font-bold uppercase tracking-wide mr-2">The 80/20 Rule:</span>
              Only track Top 20 Best Sellers weekly. Ignore the rest.
          </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm flex justify-between items-center transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Competitor Tracking</h2>
        </div>
        <div className="flex items-center gap-3">
             <div className="flex bg-slate-100 dark:bg-slate-700 rounded-full p-0.5">
                 <button 
                    onClick={() => setHeroOnly(true)}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${heroOnly ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
                 >
                     Top 20
                 </button>
                 <button 
                    onClick={() => setHeroOnly(false)}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${!heroOnly ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
                 >
                     All
                 </button>
             </div>
            <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-shopee-orange text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-red-600 transition"
            >
            {isAdding ? 'Cancel' : '+ Track'}
            </button>
        </div>
      </div>

      {isAdding && (
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm animate-fade-in mb-4">
            <h3 className="text-sm font-bold mb-4 dark:text-white">Add New Tracker</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">My SKU</label>
                    <input list="sku-list" className={inputClass} value={newComp.mySku || ''} onChange={e => setNewComp({...newComp, mySku: e.target.value})} placeholder="Select SKU" />
                    <datalist id="sku-list">
                        {pricingItems.map(p => <option key={p.id} value={p.sku}>{p.productName}</option>)}
                    </datalist>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Competitor Shop</label>
                    <input type="text" className={inputClass} value={newComp.competitorName || ''} onChange={e => setNewComp({...newComp, competitorName: e.target.value})} placeholder="e.g. Official Store" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Their Price</label>
                    <input type="number" className={inputClass} value={newComp.competitorPrice || ''} onChange={e => setNewComp({...newComp, competitorPrice: Number(e.target.value)})} placeholder="0" />
                </div>
                <button onClick={handleAdd} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-green-600 h-10 w-full">
                    Save
                </button>
            </div>
         </div>
      )}

      <div className="space-y-3">
        {filteredCompetitors.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl">
                {heroOnly && competitors.length > 0 ? 'No competitors in Top 20 view.' : 'No competitors tracked yet.'}
            </div>
        ) : (
            filteredCompetitors.map(comp => {
                const myPrice = getMyPrice(comp.mySku);
                const { diff, percent } = getPriceDiff(myPrice, comp.competitorPrice);
                const isExpensive = diff > 0;
                
                return (
                    <div key={comp.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-l-slate-200 dark:border-l-slate-700 hover:border-l-shopee-orange transition-all group">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-900 dark:text-white text-lg">{comp.mySku}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">vs {comp.competitorName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">Last Checked: {comp.lastChecked}</div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">My Price</div>
                                <div className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(myPrice)}</div>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Competitor</div>
                                <div className="flex items-center gap-2">
                                     <input 
                                        type="number" 
                                        value={comp.competitorPrice} 
                                        onChange={(e) => handleUpdatePrice(comp.id, Number(e.target.value))}
                                        className="w-24 text-center border-none bg-slate-50 dark:bg-slate-700 rounded p-1 font-bold text-slate-900 dark:text-white"
                                     />
                                </div>
                            </div>

                            <div className="text-right min-w-[100px]">
                                <div className={`font-bold text-lg ${isExpensive ? 'text-red-500' : 'text-green-500'}`}>
                                    {isExpensive ? '+' : ''}{formatCurrency(diff)}
                                </div>
                                <div className={`text-[10px] font-bold uppercase ${isExpensive ? 'text-red-400' : 'text-green-400'}`}>
                                    {isExpensive ? 'More Expensive' : 'Cheaper'}
                                </div>
                            </div>
                            
                            <button onClick={() => onRequestDelete(comp.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
