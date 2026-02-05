
import React, { useState } from 'react';
import { CompetitorItem, PricingItem, SHOPS, ShopID } from '../types';
import { formatCurrency } from '../utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Trash2, Plus, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface CompetitorViewProps {
  competitors: CompetitorItem[];
  onUpdateCompetitors: (items: CompetitorItem[]) => void;
  pricingItems: PricingItem[];
  onRequestDelete: (id: string) => void;
}

interface CompetitorGroup {
  sku: string;
  shopId: ShopID;
  myPrice: number;
  competitors: CompetitorItem[];
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  lastUpdated: string;
}

export const CompetitorView: React.FC<CompetitorViewProps> = ({ competitors, onUpdateCompetitors, pricingItems, onRequestDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newComp, setNewComp] = useState<Partial<CompetitorItem>>({});
  const [heroOnly, setHeroOnly] = useState(true);
  const [selectedShop, setSelectedShop] = useState<ShopID>('shop1');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleAdd = () => {
    if (!newComp.mySku || !newComp.competitorPrice || !newComp.competitorName || !selectedShop) return;
    const item: CompetitorItem = {
      id: `comp-${Date.now()}`,
      mySku: newComp.mySku,
      shopId: selectedShop,
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

  const getMyPrice = (sku: string, shopId: ShopID) => {
    const item = pricingItems.find(p => p.sku === sku && p.shopId === shopId);
    return item ? item.hargaJual : 0;
  };

  const getSelectedShopPrice = () => {
    if (!newComp.mySku || !selectedShop) return null;
    const item = pricingItems.find(p => p.sku === newComp.mySku && p.shopId === selectedShop);
    return item ? item.hargaJual : null;
  };

  const availableSkus = pricingItems.filter(p => p.shopId === selectedShop);

  // Group competitors by SKU + ShopID
  const groupCompetitors = (): CompetitorGroup[] => {
    const groups: Record<string, CompetitorGroup> = {};
    
    competitors.forEach(comp => {
      const key = `${comp.mySku}-${comp.shopId}`;
      if (!groups[key]) {
        const myPrice = getMyPrice(comp.mySku, comp.shopId);
        groups[key] = {
          sku: comp.mySku,
          shopId: comp.shopId,
          myPrice,
          competitors: [],
          avgPrice: 0,
          minPrice: Infinity,
          maxPrice: 0,
          lastUpdated: comp.lastChecked
        };
      }
      
      groups[key].competitors.push(comp);
      groups[key].minPrice = Math.min(groups[key].minPrice, comp.competitorPrice);
      groups[key].maxPrice = Math.max(groups[key].maxPrice, comp.competitorPrice);
      
      // Update last updated date to most recent
      if (comp.lastChecked > groups[key].lastUpdated) {
        groups[key].lastUpdated = comp.lastChecked;
      }
    });

    // Calculate averages
    Object.values(groups).forEach(group => {
      const sum = group.competitors.reduce((acc, c) => acc + c.competitorPrice, 0);
      group.avgPrice = sum / group.competitors.length;
    });

    return Object.values(groups);
  };

  const getPricingSuggestion = (myPrice: number, avgPrice: number, minPrice: number) => {
    const diff = myPrice - avgPrice;
    const diffPercent = (diff / avgPrice) * 100;
    
    if (myPrice < minPrice) {
      return { 
        type: 'underpriced', 
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        message: `You're below all competitors (Rp ${formatCurrency(minPrice)}). Consider raising price.` 
      };
    } else if (diffPercent <= 5) {
      return { 
        type: 'competitive', 
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        message: '✓ Your price is competitive! Within 5% of market average.' 
      };
    } else if (diffPercent <= 15) {
      return { 
        type: 'premium', 
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        message: `Premium pricing (+${diffPercent.toFixed(1)}%). Average is Rp ${formatCurrency(avgPrice)}.` 
      };
    } else {
      const suggested = Math.round(avgPrice * 1.05);
      return { 
        type: 'expensive', 
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        message: `Consider lowering to Rp ${formatCurrency(suggested)} (avg + 5%) to stay competitive.` 
      };
    }
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const groupedCompetitors = groupCompetitors();
  const filteredGroups = heroOnly ? groupedCompetitors.slice(0, 20) : groupedCompetitors;
  const inputClass = "bg-slate-50 dark:bg-slate-700 border-none rounded-lg p-2 text-slate-900 dark:text-slate-200 w-full focus:ring-1 focus:ring-shopee-orange";

  return (
    <div className="space-y-6">
      {/* Strategy Tip Banner */}
      <Card className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 flex items-center gap-3 border border-indigo-100 dark:border-indigo-900/30 shadow-soft-sm">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 animate-pulse"></div>
          <div className="text-sm text-indigo-800 dark:text-indigo-200">
              <span className="font-bold uppercase tracking-wide mr-2">The 80/20 Rule:</span>
              Only track Top 20 Best Sellers weekly. Ignore the rest.
          </div>
      </Card>

      <Card className="flex justify-between items-center p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 font-display">Competitor Tracking</h2>
          <p className="text-xs text-slate-500 mt-1">{groupedCompetitors.length} products tracked</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="flex bg-slate-100 dark:bg-slate-700/50 rounded-full p-1">
                 <button 
                    onClick={() => setHeroOnly(true)}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${heroOnly ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-200' : 'text-slate-500'}`}
                 >
                     Top 20
                 </button>
                 <button 
                    onClick={() => setHeroOnly(false)}
                    className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${!heroOnly ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-200' : 'text-slate-500'}`}
                 >
                     All
                 </button>
             </div>
            <Button 
                onClick={() => setIsAdding(!isAdding)}
                className="gap-2"
            >
                {isAdding ? 'Cancel' : (
                    <>
                        <Plus size={16} />
                        Track
                    </>
                )}
            </Button>
        </div>
      </Card>

      {isAdding && (
         <Card className="mb-4 animate-fade-in">
            <h3 className="text-sm font-bold mb-4 dark:text-slate-200">Add New Tracker</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">My Shop</label>
                    <select 
                      className={inputClass}
                      value={selectedShop}
                      onChange={(e) => {
                        setSelectedShop(e.target.value as ShopID);
                        setNewComp({...newComp, mySku: ''});
                      }}
                    >
                      {SHOPS.map(shop => (
                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                      ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">My SKU</label>
                    <input 
                      list="sku-list" 
                      className={inputClass} 
                      value={newComp.mySku || ''} 
                      onChange={e => setNewComp({...newComp, mySku: e.target.value})} 
                      placeholder="Select SKU" 
                    />
                    <datalist id="sku-list">
                        {availableSkus.map(p => <option key={p.id} value={p.sku}>{p.productName}</option>)}
                    </datalist>
                    {getSelectedShopPrice() !== null && (
                      <div className="text-[10px] text-slate-500 mt-1">
                        My Price: {formatCurrency(getSelectedShopPrice()!)}
                      </div>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Competitor Shop</label>
                    <input type="text" className={inputClass} value={newComp.competitorName || ''} onChange={e => setNewComp({...newComp, competitorName: e.target.value})} placeholder="e.g. Official Store" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Their Price</label>
                    <input type="number" className={inputClass} value={newComp.competitorPrice || ''} onChange={e => setNewComp({...newComp, competitorPrice: Number(e.target.value)})} placeholder="0" />
                </div>
                <Button onClick={handleAdd} className="w-full bg-green-500 hover:bg-green-600">
                    Save
                </Button>
            </div>
         </Card>
      )}

      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl">
                {heroOnly && groupedCompetitors.length > 0 ? 'No competitors in Top 20 view.' : 'No competitors tracked yet.'}
            </div>
        ) : (
            filteredGroups.map(group => {
                const key = `${group.sku}-${group.shopId}`;
                const isExpanded = expandedGroups.has(key);
                const shop = SHOPS.find(s => s.id === group.shopId);
                const diff = group.myPrice - group.avgPrice;
                const isExpensive = diff > 0;
                const suggestion = getPricingSuggestion(group.myPrice, group.avgPrice, group.minPrice);
                
                return (
                    <Card key={key} className="border-l-4 border-l-slate-200 dark:border-l-slate-700 hover:border-l-shopee-orange transition-all">
                        {/* Collapsed Header */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-slate-900 dark:text-slate-200 text-lg font-display">{group.sku}</span>
                                    {shop && (
                                      <span 
                                        className="text-xs px-2 py-0.5 rounded font-bold"
                                        style={{ 
                                          backgroundColor: shop.color + '20', 
                                          color: shop.color 
                                        }}
                                      >
                                        {shop.name}
                                      </span>
                                    )}
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                                      {group.competitors.length} competitor{group.competitors.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-400">Last Updated: {group.lastUpdated}</div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">My Price</div>
                                    <div className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(group.myPrice)}</div>
                                </div>
                                
                                <div className="text-center">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Avg Competitor</div>
                                    <div className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(group.avgPrice)}</div>
                                    <div className="text-[9px] text-slate-400">
                                      {formatCurrency(group.minPrice)} - {formatCurrency(group.maxPrice)}
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
                                
                                <button 
                                  onClick={() => toggleGroup(key)} 
                                  className="text-slate-400 hover:text-shopee-orange transition-colors p-2"
                                >
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Pricing Suggestion */}
                        <div className={`mx-6 mb-4 p-3 rounded-lg ${suggestion.bgColor} flex items-start gap-2`}>
                            <Lightbulb size={16} className={`${suggestion.color} mt-0.5 shrink-0`} />
                            <div className={`text-xs ${suggestion.color} font-medium`}>
                                {suggestion.message}
                            </div>
                        </div>

                        {/* Expanded Individual Competitors */}
                        {isExpanded && (
                            <div className="px-6 pb-6 space-y-2 animate-fade-in">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-3">Individual Competitors</div>
                                {group.competitors.map(comp => (
                                    <div key={comp.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg group/item">
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">vs {comp.competitorName}</span>
                                            <div className="text-[10px] text-slate-400">{comp.lastChecked}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="number" 
                                                value={comp.competitorPrice} 
                                                onChange={(e) => handleUpdatePrice(comp.id, Number(e.target.value))}
                                                className="w-28 text-center border-none bg-white dark:bg-slate-700 rounded p-2 text-sm font-bold text-slate-900 dark:text-slate-200 focus:ring-1 focus:ring-shopee-orange"
                                            />
                                            <button 
                                                onClick={() => onRequestDelete(comp.id)} 
                                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-2"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                );
            })
        )}
      </div>
    </div>
  );
};
