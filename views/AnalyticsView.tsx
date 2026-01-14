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
           return <h4 key={i} className="font-bold text-white text-base mt-2 mb-1">{parseBold(trimmed.replace(/^#+\s*/, ''))}</h4>;
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
  isDarkMode = false,
  dateRange,
  setDateRange
}) => {
  const [selectedShops, setSelectedShops] = useState<ShopID[]>(['shop1', 'shop2', 'shop3']);
  const [metric, setMetric] = useState<keyof Omit<SalesRecord, 'id' | 'date' | 'shopId'>>('penjualan');
  
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Quick Date Selectors
  const setQuickRange = (range: '7d' | '30d' | 'mtd') => {
    const end = new Date();
    const start = new Date();
    if (range === '7d') start.setDate(end.getDate() - 6);
    if (range === '30d') start.setDate(end.getDate() - 29);
    if (range === 'mtd') start.setDate(1); // 1st of current month

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    setDateRange({ start: fmt(start), end: fmt(end) });
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
    // Use the ENTIRE data set (filtered by selection/date) to get insights, 
    // but the service will handle slicing to keep it optimized.
    const result = await getSalesCoachInsight(filteredData);
    setAiInsight(result);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      {/* Controls Container */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-4 transition-colors">
        
        {/* Top Row: Shop Selection & Add Data */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Compare Shops:</span>
              <div className="flex gap-2">
                {SHOPS.map(shop => (
                  <button
                    key={shop.id}
                    onClick={() => toggleShop(shop.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2 ${
                      selectedShops.includes(shop.id) 
                        ? `bg-opacity-10 dark:bg-opacity-20 text-slate-900 dark:text-white`
                        : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-600'
                    }`}
                    style={{ 
                      borderColor: selectedShops.includes(shop.id) ? shop.color : undefined,
                      backgroundColor: selectedShops.includes(shop.id) ? `${shop.color}20` : undefined
                    }}
                  >
                    {shop.name}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={onAddDataClick}
              className="bg-shopee-orange text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-red-600 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Daily Report
            </button>
        </div>

        {/* Bottom Row: Date Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
              <button onClick={() => setQuickRange('7d')} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-600 focus:text-shopee-orange focus:shadow-sm transition-all">Last 7 Days</button>
              <button onClick={() => setQuickRange('30d')} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-600 focus:text-shopee-orange focus:shadow-sm transition-all">Last 30 Days</button>
              <button onClick={() => setQuickRange('mtd')} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm text-slate-600 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-600 focus:text-shopee-orange focus:shadow-sm transition-all">Month to Date</button>
           </div>

           <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">Custom:</span>
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange({...dateRange, start: e.target.value})}
                className="border-slate-300 dark:border-slate-600 rounded-md p-1.5 border bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateRange({...dateRange, end: e.target.value})}
                className="border-slate-300 dark:border-slate-600 rounded-md p-1.5 border bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
           </div>
        </div>
      </div>

      {/* Monthly Target Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg text-green-600 dark:text-green-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Monthly Sales Target</h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Combined sales for {new Date().toLocaleString('default', { month: 'long' })} across all shops.</p>
            </div>
            <div className="text-right">
                <div className="flex items-baseline justify-end gap-2">
                  <span className="text-2xl font-bold text-shopee-orange">{formatCurrency(monthlyProgress.total)}</span>
                  <span className="text-slate-400 text-sm">/ {formatCurrency(monthlyProgress.target)}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Goal: 1 Billion (1M) IDR
                </p>
            </div>
        </div>
        <div className="relative pt-1">
          <div className="overflow-hidden h-4 mb-2 text-xs flex rounded-full bg-slate-100 dark:bg-slate-700 box-border border border-slate-100 dark:border-slate-600">
            <div 
                style={{ width: `${monthlyProgress.percent}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-orange-400 to-shopee-orange transition-all duration-1000 ease-out"
            ></div>
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
             <span>0%</span>
             <span className={`${monthlyProgress.percent >= 100 ? 'text-green-600 dark:text-green-400' : ''}`}>{monthlyProgress.percent.toFixed(1)}% Achieved</span>
             <span>100%</span>
          </div>
        </div>
      </div>

      {/* Shop Health Grid */}
      {healthMetrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
             {healthMetrics.map(shop => (
                 <div key={shop.shopId} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                     <h4 className="font-bold mb-2 text-slate-700 dark:text-slate-200">{shop.name} Health</h4>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Chat Response</span>
                            <span className={`font-bold ${shop.chat && shop.chat < 85 ? 'text-red-500' : 'text-green-500'}`}>
                                {shop.chat ? `${shop.chat}%` : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Late Shipment</span>
                            <span className={`font-bold ${shop.lsr && shop.lsr > 5 ? 'text-red-500' : 'text-green-500'}`}>
                                {shop.lsr ? `${shop.lsr}%` : 'N/A'}
                            </span>
                        </div>
                     </div>
                 </div>
             ))}
          </div>
      )}

      {/* AI Coach Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-900 dark:to-purple-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
         <div className="relative z-10">
           <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold mb-2">AI Sales Coach</h3>
              {aiInsight ? (
                  <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 animate-fade-in">
                     {renderFormattedText(aiInsight)}
                  </div>
              ) : (
                  <p className="text-indigo-100 dark:text-indigo-200 text-sm max-w-2xl">
                    Need a morale boost or a quick strategy check based on your current numbers? Ask your AI Coach.
                  </p>
              )}
            </div>
            <button 
              onClick={handleAiCoach}
              disabled={loadingAi}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-indigo-50 disabled:opacity-50 whitespace-nowrap ml-4"
            >
              {loadingAi ? 'Analyzing...' : 'Ask AI Coach'}
            </button>
           </div>
         </div>
         <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Sales (Penjualan)" 
          value={formatCurrency(totals.penjualan)} 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard 
          title="Total Orders (Pesanan)" 
          value={formatNumber(totals.pesanan)} 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
        />
        <StatCard 
          title="Total Visitors (Pengunjung)" 
          value={formatNumber(totals.pengunjung)} 
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
        />
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Performance Over Time</h3>
          <select 
            className="border-slate-300 dark:border-slate-600 border rounded-md text-sm p-1 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-shopee-orange focus:border-shopee-orange"
            value={metric}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMetric(e.target.value as any)}
          >
            <option value="penjualan">Sales (Penjualan)</option>
            <option value="pesanan">Orders (Pesanan)</option>
            <option value="konversi">Conversion Rate (Konversi)</option>
            <option value="pengunjung">Visitors (Pengunjung)</option>
            <option value="produkDiklik">Product Clicks (Produk Diklik)</option>
          </select>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                {SHOPS.map(shop => (
                   <linearGradient key={shop.id} id={`color-${shop.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={shop.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={shop.color} stopOpacity={0}/>
                   </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#E2E8F0'} />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="#94A3B8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => metric === 'penjualan' ? `${val / 1000000}M` : metric === 'konversi' ? `${(val * 100).toFixed(0)}%` : val}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  color: isDarkMode ? '#f8fafc' : '#1e293b'
                }}
                formatter={(val: number) => metric === 'penjualan' ? formatCurrency(val) : metric === 'konversi' ? formatPercent(val) : formatNumber(val)}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? '#cbd5e1' : '#1e293b' }} />
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
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                 )
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex justify-between items-center mb-4">
           <div>
             <h3 className="text-lg font-bold text-slate-800 dark:text-white">Top 10 Hero Products</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400">Comparing products from currently selected shops.</p>
           </div>
           <button 
             onClick={onManageProducts}
             className="text-shopee-orange text-sm font-semibold hover:bg-orange-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-slate-600 transition-colors"
           >
             Manage Products
           </button>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-600">
             <p className="text-slate-500 dark:text-slate-400">No products added yet.</p>
             <button onClick={onManageProducts} className="mt-2 text-shopee-orange font-semibold hover:underline">Add your first product</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectedShops.map(shopId => {
              const shop = SHOPS.find(s => s.id === shopId);
              const shopProducts = products.filter(p => p.shopId === shopId).sort((a,b) => a.rank - b.rank).slice(0, 10);
              
              return (
                <div key={shopId} className="border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 font-semibold text-sm" style={{ backgroundColor: `${shop?.color}10`, color: shop?.color }}>
                    {shop?.name}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {shopProducts.map(p => (
                      <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-400 dark:text-slate-500 w-4">{p.rank}</span>
                          
                          {/* Image Container with Fallback */}
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-md overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                             {/* Fallback Text (Behind Image) */}
                             <span className="absolute z-0 text-[8px] text-slate-400 font-bold">No Img</span>
                             
                             {/* Image (On Top) */}
                             {p.image && (
                               <img 
                                 src={p.image} 
                                 alt={p.name} 
                                 className="w-full h-full object-cover relative z-10" 
                                 onError={(e) => {
                                   e.currentTarget.style.display = 'none'; // Safe way to hide broken image without unmounting/DOM mutation
                                 }}
                               />
                             )}
                          </div>

                          <div className="flex flex-col">
                             <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate w-24 lg:w-32" title={p.name}>{p.name}</span>
                             {p.sku && <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 z-50 relative">
                           <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{formatNumber(p.sales)} sold</span>

                           <button 
                             type="button"
                             onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Delete Clicked for ID:', p.id); // DEBUG LOG
                                onDeleteProduct(p.id);
                             }} 
                             className="p-2 text-slate-400 hover:text-white bg-transparent hover:bg-red-500 rounded-md transition-colors cursor-pointer relative z-[100]"
                             title="Delete"
                           >
                             <svg className="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </div>
                      </div>
                    ))}
                    {shopProducts.length === 0 && <div className="p-4 text-center text-slate-400 text-sm">No products found</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};