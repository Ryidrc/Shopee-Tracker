
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { SalesRecord, ShopID, Product, Goal, PricingItem, KPIReport, TeamMember, TeamTask, TeamTaskCompletion, Issue, Shop } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/UIComponents';
import { GoalSetting } from '../components/GoalSetting';
import { exportSalesDataToExcel } from '../services/exportService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, Plus, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';


interface AnalyticsViewProps {
  shops: Shop[];
  data: SalesRecord[];
  products: Product[];
  goals: Goal[];
  onAddDataClick: () => void;
  onManageProducts: () => void;
  onDeleteProduct: (id: string) => void;
  onDeleteSalesRecord: (date: string, shopId: ShopID) => void;
  onAddGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  isDarkMode?: boolean;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  pricingItems?: PricingItem[];
  onEditProduct?: (product: Product) => void;
  teamReports?: KPIReport[];
  teamMembers?: TeamMember[];
  teamTasks?: TeamTask[];
  teamTaskCompletions?: TeamTaskCompletion[];
  teamIssues?: Issue[];
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
  shops, data, 
  products,
  goals,
  onAddDataClick, 
  onManageProducts, 
  onDeleteProduct,
  onDeleteSalesRecord,
  onAddGoal,
  onDeleteGoal,
  isDarkMode = false,
  dateRange,
  setDateRange,
  pricingItems = [],
  onEditProduct,
  teamReports = [],
  teamMembers = [],
  teamTasks = [],
  teamTaskCompletions = [],
  teamIssues = []
}) => {
  const [selectedShops, setSelectedShops] = useState<ShopID[]>(() => shops.map(s => s.id));
  const [metric, setMetric] = useState<keyof Omit<SalesRecord, 'id' | 'date' | 'shopId'>>('penjualan');
  const [activeRangeBtn, setActiveRangeBtn] = useState<'7d' | '30d' | 'mtd' | 'custom'>('7d');

  // ---- TEAM DATA COMPUTATIONS ----
  const today = new Date().toISOString().split('T')[0];

  // Task completion per member (today's daily tasks)
  const memberTaskCompletion = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    const periodKeys: Record<string, string> = {
      daily: now.toISOString().split('T')[0],
      weekly: 'week-' + weekStart.toISOString().split('T')[0],
      monthly: 'month-' + now.getFullYear() + '-' + (now.getMonth() + 1),
    };
    return teamMembers.map(member => {
      const byFreq = (['daily', 'weekly', 'monthly'] as const).map(freq => {
        const freqTasks = teamTasks.filter(t => t.frequency === freq && (t.isGlobal || (t.assignedMemberIds && t.assignedMemberIds.includes(member.id))));
        const done = teamTaskCompletions.filter(tc => tc.memberId === member.id && tc.periodKey === periodKeys[freq] && tc.completed).length;
        const pct = freqTasks.length > 0 ? Math.round(done / freqTasks.length * 100) : 0;
        return { freq, done, total: freqTasks.length, pct };
      });
      return { id: member.id, name: member.name.split(' ')[0], color: member.color, byFreq };
    });
  }, [teamMembers, teamTasks, teamTaskCompletions]);

  // Team sales trend (last 14 days from member reports)
  const teamSalesTrend = useMemo(() => {
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (13 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayTotal = teamReports.filter(r => r.date === dateStr).reduce((sum, r) => sum + (r.penjualan || 0), 0);
      return { date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), team: dayTotal };
    });
    return days;
  }, [teamReports]);

  // Goals progress using team reports (moved to after filteredData)
  // Open issues from team
  const openTeamIssues = useMemo(() => teamIssues.filter(i => i.status !== 'resolved'), [teamIssues]);

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

  // Aggregate data for totals (includes both manager's salesData + team member KPI reports)
  const totals = useMemo(() => {
    const base = filteredData.reduce((acc, curr) => ({
      penjualan: acc.penjualan + curr.penjualan,
      pesanan: acc.pesanan + curr.pesanan,
      pengunjung: acc.pengunjung + curr.pengunjung,
    }), { penjualan: 0, pesanan: 0, pengunjung: 0 });

    // Also add team member reports that fall within the date range
    const teamTotals = teamReports
      .filter(r => r.date >= dateRange.start && r.date <= dateRange.end)
      .reduce((acc, r) => ({
        penjualan: acc.penjualan + (r.penjualan || 0),
        pesanan: acc.pesanan + (r.pesanan || 0),
        pengunjung: acc.pengunjung + (r.pengunjung || 0),
      }), { penjualan: 0, pesanan: 0, pengunjung: 0 });

    return {
      penjualan: base.penjualan + teamTotals.penjualan,
      pesanan: base.pesanan + teamTotals.pesanan,
      pengunjung: base.pengunjung + teamTotals.pengunjung,
    };
  }, [filteredData, teamReports, dateRange]);

  // Get Latest Health Metrics per Shop (based on selected)
  const healthMetrics = useMemo(() => {
    return selectedShops.map(shopId => {
      // Find latest record for this shop
      const shopRecords = data.filter(d => d.shopId === shopId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = shopRecords[0];
      return {
        shopId,
        name: shops.find(s => s.id === shopId)?.name,
        chat: latest?.chatResponseRate,
        lsr: latest?.lateShipmentRate
      };
    }).filter(h => h.chat !== undefined || h.lsr !== undefined);
  }, [data, selectedShops]);

  // Goals progress using team reports
  const goalsWithProgress = useMemo(() => {
    return goals.map(goal => {
      const monthStart = new Date(); monthStart.setDate(1);
      const monthStr = monthStart.toISOString().split('T')[0];
      const monthlyTeamSales = teamReports.filter(r => r.date >= monthStr).reduce((sum, r) => sum + (r.penjualan || 0), 0);
      const monthlySales = filteredData.filter(d => d.date >= monthStr).reduce((sum, d) => sum + (d.penjualan || 0), 0);
      const totalSales = monthlyTeamSales + monthlySales;
      const pct = goal.target > 0 ? Math.min(Math.round(totalSales / goal.target * 100), 100) : 0;
      return { ...goal, progress: pct, current: totalSales };
    });
  }, [goals, teamReports, filteredData]);

  const chartData = useMemo(() => {
    // Merge shop sales data + team-submitted reports by date and shopId
    const allDates = Array.from(new Set([
      ...filteredData.map(d => d.date),
      ...teamReports.filter(r => r.date >= dateRange.start && r.date <= dateRange.end).map(r => r.date)
    ])).sort();

    return allDates.map(date => {
      const entry: any = { date };
      shops.forEach(shop => {
        // Sum from manager's own records
        const shopRecord = filteredData.find(d => d.date === date && d.shopId === shop.id);
        const ownValue = shopRecord ? (shopRecord[metric] ?? 0) : 0;
        // Sum from team member reports for same shop+date
        const teamValue = teamReports
          .filter(r => r.date === date && r.shopId === shop.id && r.date >= dateRange.start && r.date <= dateRange.end)
          .reduce((sum, r) => {
            const v = r[metric as keyof typeof r];
            return sum + (typeof v === 'number' ? v : 0);
          }, 0);
        const combined = ownValue + teamValue;
        entry[shop.id] = combined > 0 ? combined : null;
      });
      return entry;
    });
  }, [filteredData, teamReports, metric, shops, dateRange]);




  const getRangeBtnClass = (range: string) => 
    `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
        activeRangeBtn === range 
        ? 'bg-shopee-orange text-white shadow' 
        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
    }`;



  return (
    <div className="space-y-6">
      {/* Controls Container */}
      <Card className="flex flex-col gap-4 animate-fade-in">
        
        {/* Top Row: Shop Selection & Add Data */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shops:</span>
              <div className="flex gap-2">
                {shops.map(shop => (
                  <button
                    key={shop.id}
                    onClick={() => toggleShop(shop.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      selectedShops.includes(shop.id) 
                        ? `text-white shadow-sm transform scale-105 border-transparent`
                        : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => exportSalesDataToExcel(filteredData, shops)}
                disabled={filteredData.length === 0}
                className="gap-2"
                title="Export to Excel"
              >
                <Download size={14} />
                Export
              </Button>
            </div>
        </div>

        {/* Bottom Row: Date Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-50 dark:border-slate-800 pt-4">
           <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg dark:bg-slate-900/50">
              {['7d', '30d', 'mtd'].map((range) => (
                <button 
                  key={range}
                  onClick={() => setQuickRange(range as any)} 
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                    activeRangeBtn === range 
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-200' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'This Month'}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-2 text-sm bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-slate-200 dark:focus-within:ring-slate-700 transition-all shadow-sm">
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomDateChange('start', e.target.value)}
                className="bg-transparent border-none text-slate-800 dark:text-slate-200 text-sm focus:ring-0 p-0 font-medium font-sans"
              />
              <span className="text-slate-400 dark:text-slate-500 px-1">→</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomDateChange('end', e.target.value)}
                className="bg-transparent border-none text-slate-800 dark:text-slate-200 text-sm focus:ring-0 p-0 font-medium font-sans"
              />
           </div>
        </div>
      </Card>

      {/* Goal Setting & Progress Tracking */}
      <GoalSetting shops={shops} 
        salesData={data} 
        goals={goals} 
        onAddGoal={onAddGoal} 
        onDeleteGoal={onDeleteGoal} 
      />

      {/* Shop Health Grid - Cards */}
      {healthMetrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
             {healthMetrics.map(shop => (
                 <Card key={shop.shopId} className="border-l-4 p-4" style={{borderLeftColor: shops.find(s=>s.id===shop.shopId)?.color}}>
                     <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-sm">{shop.name} Operations</h4>
                     <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Chat Rate</span>
                            <span className={`text-lg font-bold font-display ${shop.chat && shop.chat < 85 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                {shop.chat ? `${shop.chat}%` : '-'}
                            </span>
                        </div>
                        <div className="flex-1 border-l border-slate-100 dark:border-slate-700 pl-4">
                            <span className="block text-[10px] text-slate-400 uppercase font-bold">Late Ship</span>
                            <span className={`text-lg font-bold font-display ${shop.lsr && shop.lsr > 5 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                {shop.lsr ? `${shop.lsr}%` : '-'}
                            </span>
                        </div>
                     </div>
                 </Card>
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
      <Card>
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 font-display">Trend Analysis</h3>
          <div className="relative">
             <select 
                className="appearance-none bg-slate-50 dark:bg-slate-900 border-none rounded-full py-2 pl-4 pr-10 text-sm font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-shopee-orange/20 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                value={metric}
                onChange={(e) => setMetric(e.target.value as any)}
            >
                <option value="penjualan">Sales</option>
                <option value="pesanan">Orders</option>
                <option value="konversi">Conversion</option>
                <option value="pengunjung">Visitors</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>
        <div className="h-80 w-full">
          {chartData.length === 0 ? (
            <EmptyState 
              icon="chart"
              title="No sales data yet"
              description="Start by adding your daily Shopee sales reports to see beautiful trend charts and insights."
              action={{
                label: 'Add First Report',
                onClick: onAddDataClick
              }}
            />
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                {shops.map(shop => (
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
              {shops.map(shop => (
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
          )}
        </div>
      </Card>



      {/* Top Products - Enhanced Table */}
      <Card>
        <div className="flex justify-between items-center mb-6">
           <div>
             <h3 className="font-bold text-slate-800 dark:text-slate-200 font-display">Hero Products</h3>
             <p className="text-xs text-slate-500">Your top focus items with live pricing data.</p>
           </div>
           <Button variant="ghost" size="sm" onClick={onManageProducts}>
             Add New
           </Button>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-800">
             <p className="text-slate-400 text-sm">No products added.</p>
             <button onClick={onManageProducts} className="mt-2 text-shopee-orange font-bold text-sm hover:underline">Add one now</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 pl-2">Rank</th>
                      <th className="py-3">Product</th>
                      <th className="py-3 text-right">Sales / Stock</th>
                      <th className="py-3 text-right">Price / Profit</th>
                      <th className="py-3 text-right">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                   {products.sort((a,b) => a.rank - b.rank).map((p) => {
                      const shop = shops.find(s => s.id === p.shopId);
                      // Find linked Pricing Item
                      const pricingItem = p.sku ? pricingItems.find(pi => pi.sku.toLowerCase() === p.sku!.toLowerCase()) : null;
                      
                      const stockLevel = pricingItem ? pricingItem.stock : 0;
                      const isLowStock = stockLevel < 20; // Alert threshold

                      return (
                        <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           {/* Rank */}
                           <td className="py-3 pl-2 w-16">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                                 p.rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                                 p.rank === 2 ? 'bg-slate-200 text-slate-600' :
                                 p.rank === 3 ? 'bg-orange-100 text-orange-600' :
                                 'bg-slate-50 text-slate-400 dark:bg-slate-800'
                              }`}>
                                 {p.rank}
                              </div>
                           </td>

                           {/* Product Info */}
                           <td className="py-3">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                    {p.image ? (
                                       <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                                    ) : (
                                       <div className="w-full h-full flex items-center justify-center text-slate-300">
                                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                       </div>
                                    )}
                                 </div>
                                 <div className="min-w-0 max-w-[180px] sm:max-w-xs">
                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</div>
                                    <div className="flex items-center gap-2">
                                       <span className="text-[10px] px-1.5 py-0.5 rounded text-white font-bold" style={{backgroundColor: shop?.color}}>{shop?.name}</span>
                                       {p.sku && <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{p.sku}</span>}
                                    </div>
                                 </div>
                              </div>
                           </td>

                           {/* Sales / Stock */}
                           <td className="py-3 text-right">
                              <div className="flex flex-col items-end">
                                 <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatNumber(p.sales)} Sold</span>
                                 {pricingItem ? (
                                    <span className={`text-[10px] font-bold px-1.5 rounded-full ${isLowStock ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                                       {stockLevel} in Stock
                                    </span>
                                 ) : (
                                    <span className="text-[10px] text-slate-400 italic">No stock data</span>
                                 )}
                              </div>
                           </td>

                           {/* Price / Profit */}
                           <td className="py-3 text-right">
                              {pricingItem ? (
                                 <div className="flex flex-col items-end">
                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatCurrency(pricingItem.hargaJual)}</span>
                                    <div className="flex gap-1 items-center">
                                       <span className="text-[10px] text-slate-400">Net:</span>
                                       <span className="text-xs font-bold text-emerald-600">{formatCurrency(pricingItem.total)}</span>
                                    </div>
                                 </div>
                              ) : (
                                 <span className="text-xs text-slate-500">-</span>
                              )}
                           </td>

                           {/* Actions */}
                           <td className="py-3 text-right">
                              <div className="flex justify-end gap-1">
                                 <button 
                                    onClick={() => onEditProduct && onEditProduct(p)}
                                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Edit"
                                 >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                 </button>
                                 <button 
                                    onClick={() => onDeleteProduct(p.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete"
                                 >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                 </button>
                              </div>
                           </td>
                        </tr>
                      );
                   })}
                </tbody>
             </table>
          </div>
        )}
      </Card>

      {/* ===== TEAM OVERVIEW SECTION ===== */}
      {teamMembers.length > 0 && (
        <>
          {/* Task Completion by Frequency */}
          <Card>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 font-display mb-5">Task Completion by Category</h3>
            {memberTaskCompletion.every(m => m.byFreq.every(f => f.total === 0)) ? (
              <p className="text-slate-400 text-sm">No tasks defined yet. Go to Team KPI → Manage Tasks to add tasks.</p>
            ) : (
              <div className="space-y-6">
                {(['daily', 'weekly', 'monthly'] as const).map(freq => {
                  const hasAny = memberTaskCompletion.some(m => m.byFreq.find(f => f.freq === freq)!.total > 0);
                  if (!hasAny) return null;
                  return (
                    <div key={freq}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 capitalize">{freq} Tasks</h4>
                      <div className="space-y-2">
                        {memberTaskCompletion.map(m => {
                          const f = m.byFreq.find(x => x.freq === freq)!;
                          if (f.total === 0) return null;
                          return (
                            <div key={m.id}>
                              <div className="flex justify-between text-sm mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{backgroundColor: m.color}}>{m.name.charAt(0)}</div>
                                  <span className="font-medium text-slate-700 dark:text-slate-300">{m.name}</span>
                                </div>
                                <span className="text-slate-500">{f.done}/{f.total} ({f.pct}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                                <div
                                  className="h-2.5 rounded-full transition-all"
                                  style={{ width: `${f.pct}%`, backgroundColor: f.pct >= 80 ? '#22c55e' : f.pct >= 50 ? '#f59e0b' : '#ef4444' }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

            {/* Open Issues Panel */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={18} className="text-amber-500"/>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 font-display">Open Issues</h3>
                {openTeamIssues.length > 0 && (
                  <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{openTeamIssues.length}</span>
                )}
              </div>
              {openTeamIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-sm text-slate-500">No open issues — team is on track!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {openTeamIssues.map(issue => {
                    const member = teamMembers.find(m => m.id === issue.memberId);
                    return (
                      <div key={issue.id} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{backgroundColor: member?.color || '#999'}}>{member?.name.charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-white text-sm truncate">{issue.title}</p>
                          <p className="text-xs text-slate-500">{member?.name} · {issue.date} · <span className={issue.status==='open'?'text-red-600':'text-amber-600'}>{issue.status}</span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

          {/* Sales Goals with Team Data */}

          {goalsWithProgress.length > 0 && (
            <Card>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 font-display mb-4">Sales Goals Progress (This Month)</h3>
              <div className="space-y-4">
                {goalsWithProgress.map(goal => (
                  <div key={goal.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{goal.type} Goal</span>
                      <span className="text-slate-500">{goal.type === 'sales' ? formatCurrency(goal.current) : formatNumber(goal.current)} / {goal.type === 'sales' ? formatCurrency(goal.target) : formatNumber(goal.target)} ({goal.progress}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{ width: `${goal.progress}%`, backgroundColor: goal.progress >= 100 ? '#22c55e' : goal.progress >= 70 ? '#f59e0b' : '#EE4D2D' }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Includes team reports + shop sales data</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Sales Data Log Table */}
      <Card className="overflow-hidden p-0">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
           <h3 className="font-bold text-slate-800 dark:text-slate-200 font-display">Sales Data Log</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Shop</th>
                <th className="px-6 py-4 text-right">Sales</th>
                <th className="px-6 py-4 text-right">Orders</th>
                <th className="px-6 py-4 text-right">Visitors</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
               {filteredData.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No records found for this period.</td>
                 </tr>
               ) : (
                 [...filteredData].reverse().map((record) => {
                    const shop = shops.find(s => s.id === record.shopId);
                    return (
                      <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{record.date}</td>
                        <td className="px-6 py-4">
                           <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white whitespace-nowrap shadow-sm" style={{ backgroundColor: shop?.color }}>
                             {shop?.name}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatCurrency(record.penjualan)}</td>
                        <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">{formatNumber(record.pesanan)}</td>
                        <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">{formatNumber(record.pengunjung)}</td>
                        <td className="px-6 py-4 text-right">
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
      </Card>
    </div>
  );
};
