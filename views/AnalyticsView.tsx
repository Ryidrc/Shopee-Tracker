
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { SalesRecord, SHOPS, ShopID, Product } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils';
import { StatCard } from '../components/StatCard';
import { getSalesCoachInsight } from '../services/geminiService';

interface AnalyticsViewProps {
  data: SalesRecord[];
  products: Product[];
  onAddDataClick: () => void;
  onManageProducts: () => void;
  onDeleteProduct: (id: string) => void;
  onDeleteSalesRecord: (date: string, shopId: ShopID) => void;
  isDarkMode?: boolean;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
}

// Improved Markdown Parser
const parseBold = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, index) => 
        index % 2 === 1 ? <strong key={index} className="font-bold text-yellow-300 shadow-sm">{part}</strong> : part
      )}
    </>
  );
};

const renderFormattedText = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />; // Spacer for empty lines

        // Headers
        if (trimmed.startsWith('##') || trimmed.endsWith(':')) {
           return <h4 key={i} className="font-bold text-white text-base mt-2 mb-1 border-b border-white/10 pb-1">{parseBold(trimmed.replace(/^#+\s*/, ''))}</h4>;
        }

        // List Items (Bullets)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
           return (
             <div key={i} className="flex gap-2 ml-1 items-start">
               <span className="text-yellow-400 mt-1.5 text-[8px] flex-shrink-0">●</span>
               <span className="text-indigo-50 dark:text-indigo-100">{parseBold(trimmed.replace(/^[-*•]\s*/, ''))}</span>
             </div>
           );
        }

        // Numbered Lists (1. )
        if (/^\d+\.\s/.test(trimmed)) {
           return (
             <div key={i} className="flex gap-2 ml-1 items-start">
               <span className="font-bold text-yellow-300/80 mt-0">{trimmed.match(/^\d+\./)?.[0]}</span>
               <span className="text-indigo-50 dark:text-indigo-100">{parseBold(trimmed.replace(/^\d+\.\s*/, ''))}</span>
             </div>
           );
        }

        // Standard Paragraph
        return <p key={i} className="text-indigo-50 dark:text-indigo-100">{parseBold(trimmed)}</p>;
      })}
    </div>
  );
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  data, 
  products, 
  onAddDataClick, 
  onManageProducts, 
  onDeleteProduct,
  onDeleteSalesRecord,
  isDarkMode = false,
  dateRange,
  setDateRange
}) => {
  const [selectedShops, setSelectedShops] = useState<ShopID[]>(['shop1', 'shop2', 'shop3']);
  const [metric, setMetric] = useState<keyof Omit<SalesRecord, 'id' | 'date' | 'shopId'>>('penjualan');
  const [activeRangeBtn, setActiveRangeBtn] = useState<'7d' | '30d' | 'mtd' | 'custom'>('7d');
  
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Quick Date Selectors
  const setQuickRange = (range: '7d' | '30d' | 'mtd') => {
    setActiveRangeBtn(range);
    const end = new Date();
    const start = new Date();
    if (range === '7d') start.setDate(end.getDate() - 6);
    if (range === '30d') start.setDate(end.getDate() - 29);
    if (range === 'mtd') start.setDate(1); // 1st of current month

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    setDateRange({ start: fmt(start), end: fmt(end) });
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
      setActiveRangeBtn('custom');
      setDateRange({ ...dateRange, [type]: value });
  };

  const toggleShop = (id: ShopID) => {
    setSelectedShops(prev => 
      prev.includes(id) 
        ? prev.length > 1 ? prev.filter(s => s !== id) : prev 
        : [...prev, id]
    );
  };

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter(d => 
      d.date >= dateRange.start && 
      d.date <= dateRange.end && 
      selectedShops.includes(d.shopId)
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, dateRange, selectedShops]);

  // Aggregate data for totals
  const totals = useMemo(() => {
    return filteredData.reduce((acc, curr) => ({
      penjualan: acc.penjualan + curr.penjualan,
      pesanan: acc.pesanan + curr.pesanan,
      pengunjung: acc.pengunjung + curr.pengunjung,
    }), { penjualan: 0, pesanan: 0, pengunjung: 0 });
  }, [filteredData]);

  // Get Latest Health Metrics per Shop (based on selected)
  const healthMetrics = useMemo(() => {
    return selectedShops.map(shopId => {
      // Find latest record for this shop
      const shopRecords = data.filter(d => d.shopId === shopId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = shopRecords[0];
      return {
        shopId,
        name: SHOPS.find(s => s.id === shopId)?.name,
        chat: latest?.chatResponseRate,
        lsr: latest?.lateShipmentRate
      };
    }).filter(h => h.chat !== undefined || h.lsr !== undefined);
  }, [data, selectedShops]);

  // Calculate Monthly Progress
  const monthlyProgress = useMemo(() => {
    const now = new Date();
    // Filter for current month and year
    const currentMonthData = data.filter(d => {
      const date = new Date(d.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    const totalSales = currentMonthData.reduce((acc, curr) => acc + curr.penjualan, 0);
    const target = 1000000000; // 1 Billion IDR target
    
    return {
      total: totalSales,
      target: target,
      percent: Math.min((totalSales / target) * 100, 100)
    };
  }, [data]);

  const chartData = useMemo(() => {
    const dates = Array.from(new Set(filteredData.map(d => d.date)));
    return dates.map(date => {
      const entry: any = { date };
      SHOPS.forEach(shop => {
        const record = filteredData.find(d => d.date === date && d.shopId === shop.id);
        entry[shop.id] = record ? record[metric] : null; 
      });
      return entry;
    });
  }, [filteredData, metric]);

  const handleAiCoach = async () => {
    setLoadingAi(true);
    setAiInsight(null);
    
    // Get Shop Names for Context
    const activeShopNames = SHOPS.filter(s => selectedShops.includes(s.id)).map(s => s.name);
    
    // Prepare Context Object
    const context = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        shopNames: activeShopNames
    };

    const result = await getSalesCoachInsight(filteredData, context);
    setAiInsight(result);
    setLoadingAi(false);
  };

  const getRangeBtnClass = (range: string) => 
    `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
        activeRangeBtn === range 
        ? 'bg-shopee-orange text-white shadow' 
        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
    }`;

  const remainingTarget = Math.max(0, monthlyProgress.target - monthlyProgress.total);

  return (
    <div className="space-y-6">
      {/* Controls Container */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm flex flex-col gap-4 transition-colors">
        
        {/* Top Row: Shop Selection & Add Data */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shops:</span>
              <div className="flex gap-2">
                {SHOPS.map(shop => (
                  <button
                    key={shop.id}
                    onClick={() => toggleShop(shop.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedShops.includes(shop.id) 
                        ? `text-white shadow-sm transform scale-105`
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500 hover:bg-slate-200'
                    }`}
                    style={{ 
                      backgroundColor: selectedShops.includes(shop.id) ? shop.color : undefined
                    }}
                  >
                    {shop.name}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={onAddDataClick}
              className="text-shopee-orange bg-orange-50 dark:bg-orange-900/30 px-4 py-2 rounded-full text-sm font-bold hover:bg-orange-100 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              Report Sales
            </button>
        </div>

        {/* Bottom Row: Date Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-50 dark:border-slate-700 pt-4">
           <div className="flex items-center gap-2">
              <button onClick={() => setQuickRange('7d')} className={getRangeBtnClass('7d')}>7 Days</button>
              <button onClick={() => setQuickRange('30d')} className={getRangeBtnClass('30d')}>30 Days</button>
              <button onClick={() => setQuickRange('mtd')} className={getRangeBtnClass('mtd')}>Month</button>
           </div>

           <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-lg border border-transparent focus-within:border-slate-300 dark:focus-within:border-slate-600 transition-colors">
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomDateChange('start', e.target.value)}
                className="bg-transparent border-none text-slate-800 dark:text-white text-sm focus:ring-0 p-0 font-medium"
              />
              <span className="text-slate-400 dark:text-slate-500">to</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomDateChange('end', e.target.value)}
                className="bg-transparent border-none text-slate-800 dark:text-white text-sm focus:ring-0 p-0 font-medium"
              />
           </div>
        </div>
      </div>

      {/* Monthly Target Card - Minimal */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm transition-colors relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <svg className="w-32 h-32 text-shopee-orange" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/></svg>
         </div>
        <div className="flex justify-between items-end mb-4 relative z-10">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Current Month Progress</p>
              <h3 className="font-bold text-3xl text-slate-900 dark:text-white">{formatCurrency(monthlyProgress.total)}</h3>
            </div>
            <div className="text-right">
                <span className={`text-2xl font-bold ${monthlyProgress.percent >= 100 ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'}`}>{monthlyProgress.percent.toFixed(0)}%</span>
            </div>
        </div>
        <div className="relative pt-1 z-10">
          <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-slate-100 dark:bg-slate-700">
            <div 
                style={{ width: `${monthlyProgress.percent}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-shopee-orange transition-all duration-1000 ease-out"
            ></div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
             <span>Start</span>
             <span className={`${remainingTarget === 0 ? 'text-green-500' : 'text-slate-500'}`}>
                {remainingTarget === 0 ? 'Goal Reached!' : `${formatCurrency(remainingTarget)} Remaining`}
             </span>
             <span>Target: Rp 1M</span>
          </div>
        </div>
      </div>

      {/* Shop Health Grid - Cards */}
      {healthMetrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
             {healthMetrics.map(shop => (
                 <div key={shop.shopId} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border-l-4" style={{borderLeftColor: SHOPS.find(s=>s.id===shop.shopId)?.color}}>
                     <h4 className="font-bold text-slate-800 dark:text-white mb-3 text-sm">{shop.name} Operations</h4>
                     <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Chat Rate</span>
                            <span className={`text-lg font-bold ${shop.chat && shop.chat < 85 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                {shop.chat ? `${shop.chat}%` : '-'}
                            </span>
                        </div>
                        <div className="flex-1 border-l border-slate-100 dark:border-slate-700 pl-4">
                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Late Ship</span>
                            <span className={`text-lg font-bold ${shop.lsr && shop.lsr > 5 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                {shop.lsr ? `${shop.lsr}%` : '-'}
                            </span>
                        </div>
                     </div>
                 </div>
             ))}
          </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Sales" 
          value={formatCurrency(totals.penjualan)} 
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard 
          title="Total Orders" 
          value={formatNumber(totals.pesanan)} 
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
        />
        <StatCard 
          title="Visitors" 
          value={formatNumber(totals.pengunjung)} 
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
        />
      </div>

      {/* Main Chart - Clean */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-bold text-slate-800 dark:text-white">Trend Analysis</h3>
          <div className="relative">
             <select 
                className="appearance-none bg-slate-50 dark:bg-slate-700 border-none rounded-full py-2 pl-4 pr-8 text-sm font-bold text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer"
                value={metric}
                onChange={(e) => setMetric(e.target.value as any)}
            >
                <option value="penjualan">Sales</option>
                <option value="pesanan">Orders</option>
                <option value="konversi">Conversion</option>
                <option value="pengunjung">Visitors</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                {SHOPS.map(shop => (
                   <linearGradient key={shop.id} id={`color-${shop.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={shop.color} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={shop.color} stopOpacity={0}/>
                   </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis 
                stroke="#94A3B8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => metric === 'penjualan' ? `${val / 1000000}M` : metric === 'konversi' ? `${(val * 100).toFixed(0)}%` : val}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  color: isDarkMode ? '#f8fafc' : '#1e293b',
                  padding: '12px'
                }}
                formatter={(val: number) => metric === 'penjualan' ? formatCurrency(val) : metric === 'konversi' ? formatPercent(val) : formatNumber(val)}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              {SHOPS.map(shop => (
                 selectedShops.includes(shop.id) && (
                   <Area 
                    key={shop.id} 
                    type="monotone" 
                    dataKey={shop.id} 
                    stroke={shop.color} 
                    fill={`url(#color-${shop.id})`}
                    fillOpacity={1}
                    name={shop.name}
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                 )
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Coach Banner - Compact */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-lg">AI Sales Coach</h3>
              <p className="text-indigo-100 text-sm opacity-90">Get instant strategic advice based on your current metrics.</p>
            </div>
            <button 
              onClick={handleAiCoach}
              disabled={loadingAi}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap"
            >
              {loadingAi ? 'Thinking...' : 'Analyze Performance'}
            </button>
         </div>
         {aiInsight && (
            <div className="mt-6 relative z-10 p-4 bg-black/20 rounded-xl backdrop-blur-sm border border-white/10 text-sm leading-relaxed animate-fade-in">
                {renderFormattedText(aiInsight)}
            </div>
         )}
         <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-6">
           <div>
             <h3 className="font-bold text-slate-800 dark:text-white">Hero Products</h3>
             <p className="text-xs text-slate-500">Your top focus items.</p>
           </div>
           <button 
             onClick={onManageProducts}
             className="text-slate-400 hover:text-shopee-orange transition-colors"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
           </button>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-700">
             <p className="text-slate-400 text-sm">No products added.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectedShops.map(shopId => {
              const shop = SHOPS.find(s => s.id === shopId);
              const shopProducts = products.filter(p => p.shopId === shopId).sort((a,b) => a.rank - b.rank);
              
              return (
                <div key={shopId} className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">{shop?.name}</h4>
                  <div className="space-y-3">
                    {shopProducts.map((p, index) => (
                      <div key={p.id} className="flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-600 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                             {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <span className="text-[10px] text-slate-300 font-bold">{index+1}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{p.name}</div>
                             <div className="text-[10px] text-slate-400">{formatNumber(p.sales)} sold</div>
                          </div>
                           <button 
                             onClick={() => onDeleteProduct(p.id)} 
                             className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                      </div>
                    ))}
                    {shopProducts.length === 0 && <div className="text-xs text-slate-400 italic">Empty list</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sales Data Log Table */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm transition-colors overflow-hidden">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Sales Data Log</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Date</th>
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3 text-right">Sales</th>
                <th className="px-4 py-3 text-right">Orders</th>
                <th className="px-4 py-3 text-right">Visitors</th>
                <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
               {filteredData.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No records found for this period.</td>
                 </tr>
               ) : (
                 [...filteredData].reverse().map((record) => {
                    const shop = SHOPS.find(s => s.id === record.shopId);
                    return (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{record.date}</td>
                        <td className="px-4 py-3">
                           <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap" style={{ backgroundColor: shop?.color }}>
                             {shop?.name}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatCurrency(record.penjualan)}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatNumber(record.pesanan)}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatNumber(record.pengunjung)}</td>
                        <td className="px-4 py-3 text-right">
                           <button 
                             onClick={() => onDeleteSalesRecord(record.date, record.shopId)}
                             className="text-slate-300 hover:text-red-500 transition-colors p-1"
                             title="Delete Record"
                           >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </td>
                      </tr>
                    );
                 })
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
