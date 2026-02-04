
import React, { useState, useMemo } from 'react';
import { SalesRecord, VideoLog, TaskCompletion, SHOPS, ShopID } from '../types';
import { formatCurrency, formatNumber } from '../utils';

interface SummaryReportProps {
  salesData: SalesRecord[];
  videoLogs: VideoLog[];
  taskCompletions: TaskCompletion[];
  isOpen: boolean;
  onClose: () => void;
}

type ReportPeriod = 'weekly' | 'monthly';

export const SummaryReport: React.FC<SummaryReportProps> = ({
  salesData,
  videoLogs,
  taskCompletions,
  isOpen,
  onClose,
}) => {
  const [period, setPeriod] = useState<ReportPeriod>('weekly');
  const [selectedShop, setSelectedShop] = useState<ShopID | 'all'>('all');

  const reportData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    }

    // Filter data by period and shop
    const filteredSales = salesData.filter(record => {
      const recordDate = new Date(record.date);
      const matchesShop = selectedShop === 'all' || record.shopId === selectedShop;
      return recordDate >= startDate && recordDate <= now && matchesShop;
    });

    const filteredVideos = videoLogs.filter(log => {
      const logDate = new Date(log.date);
      const matchesShop = selectedShop === 'all' || log.shopId === selectedShop;
      return logDate >= startDate && logDate <= now && matchesShop;
    });

    // Get previous period for comparison
    const prevStartDate = new Date(startDate);
    if (period === 'weekly') {
      prevStartDate.setDate(prevStartDate.getDate() - 7);
    } else {
      prevStartDate.setMonth(prevStartDate.getMonth() - 1);
    }

    const prevSales = salesData.filter(record => {
      const recordDate = new Date(record.date);
      const matchesShop = selectedShop === 'all' || record.shopId === selectedShop;
      return recordDate >= prevStartDate && recordDate < startDate && matchesShop;
    });

    // Calculate metrics
    const totalSales = filteredSales.reduce((sum, r) => sum + r.penjualan, 0);
    const totalOrders = filteredSales.reduce((sum, r) => sum + r.pesanan, 0);
    const totalVisitors = filteredSales.reduce((sum, r) => sum + r.pengunjung, 0);
    const totalVideos = filteredVideos.length;

    const prevTotalSales = prevSales.reduce((sum, r) => sum + r.penjualan, 0);
    const prevTotalOrders = prevSales.reduce((sum, r) => sum + r.pesanan, 0);
    const prevTotalVisitors = prevSales.reduce((sum, r) => sum + r.pengunjung, 0);

    const salesChange = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
    const ordersChange = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0;
    const visitorsChange = prevTotalVisitors > 0 ? ((totalVisitors - prevTotalVisitors) / prevTotalVisitors) * 100 : 0;

    // Calculate daily averages
    const days = period === 'weekly' ? 7 : 30;
    const avgDailySales = totalSales / days;
    const avgDailyOrders = totalOrders / days;
    const avgDailyVisitors = totalVisitors / days;
    const conversionRate = totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0;

    // Best performing day
    const salesByDate = filteredSales.reduce((acc, r) => {
      acc[r.date] = (acc[r.date] || 0) + r.penjualan;
      return acc;
    }, {} as Record<string, number>);
    const bestDay = Object.entries(salesByDate).sort((a, b) => (b[1] as number) - (a[1] as number))[0];

    // Shop breakdown
    const shopBreakdown = SHOPS.map(shop => {
      const shopSales = filteredSales.filter(r => r.shopId === shop.id);
      return {
        shop,
        sales: shopSales.reduce((sum, r) => sum + r.penjualan, 0),
        orders: shopSales.reduce((sum, r) => sum + r.pesanan, 0),
        visitors: shopSales.reduce((sum, r) => sum + r.pengunjung, 0),
      };
    }).filter(s => s.sales > 0).sort((a, b) => b.sales - a.sales);

    return {
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      totalSales,
      totalOrders,
      totalVisitors,
      totalVideos,
      salesChange,
      ordersChange,
      visitorsChange,
      avgDailySales,
      avgDailyOrders,
      avgDailyVisitors,
      conversionRate,
      bestDay: bestDay ? { date: bestDay[0], sales: bestDay[1] } : null,
      shopBreakdown,
      recordCount: filteredSales.length,
    };
  }, [salesData, videoLogs, period, selectedShop]);

  const copyToClipboard = () => {
    const text = generateTextReport();
    navigator.clipboard.writeText(text);
    // Could show a toast here
  };

  const generateTextReport = () => {
    const r = reportData;
    const periodLabel = period === 'weekly' ? 'Weekly' : 'Monthly';
    
    return `
📊 ${periodLabel} Sales Report
Period: ${r.startDate} to ${r.endDate}
${selectedShop !== 'all' ? `Shop: ${SHOPS.find(s => s.id === selectedShop)?.name}` : 'All Shops'}

💰 Total Sales: ${formatCurrency(r.totalSales)} (${r.salesChange >= 0 ? '+' : ''}${r.salesChange.toFixed(1)}%)
📦 Total Orders: ${formatNumber(r.totalOrders)} (${r.ordersChange >= 0 ? '+' : ''}${r.ordersChange.toFixed(1)}%)
👥 Total Visitors: ${formatNumber(r.totalVisitors)} (${r.visitorsChange >= 0 ? '+' : ''}${r.visitorsChange.toFixed(1)}%)
📹 Videos Published: ${r.totalVideos}

📈 Daily Averages:
- Sales: ${formatCurrency(r.avgDailySales)}/day
- Orders: ${formatNumber(Math.round(r.avgDailyOrders))}/day
- Visitors: ${formatNumber(Math.round(r.avgDailyVisitors))}/day
- Conversion: ${r.conversionRate.toFixed(2)}%

${r.bestDay ? `🏆 Best Day: ${r.bestDay.date} with ${formatCurrency(r.bestDay.sales)}` : ''}

${r.shopBreakdown.length > 0 ? `
🏪 Shop Breakdown:
${r.shopBreakdown.map(s => `- ${s.shop.name}: ${formatCurrency(s.sales)} (${s.orders} orders)`).join('\n')}
` : ''}
    `.trim();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <svg className="w-6 h-6 text-shopee-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Summary Report
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {reportData.startDate} to {reportData.endDate}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 flex gap-4">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === 'weekly' 
                  ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-slate-200' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === 'monthly' 
                  ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-slate-200' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Monthly
            </button>
          </div>
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Shops</option>
            {SHOPS.map(shop => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard 
              label="Total Sales" 
              value={formatCurrency(reportData.totalSales)}
              change={reportData.salesChange}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <MetricCard 
              label="Total Orders" 
              value={formatNumber(reportData.totalOrders)}
              change={reportData.ordersChange}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
            />
            <MetricCard 
              label="Total Visitors" 
              value={formatNumber(reportData.totalVisitors)}
              change={reportData.visitorsChange}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            />
            <MetricCard 
              label="Conversion" 
              value={`${reportData.conversionRate.toFixed(2)}%`}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
          </div>

          {/* Daily Averages */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">📈 Daily Averages</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatCurrency(reportData.avgDailySales)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Sales/day</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatNumber(Math.round(reportData.avgDailyOrders))}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Orders/day</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatNumber(Math.round(reportData.avgDailyVisitors))}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Visitors/day</div>
              </div>
            </div>
          </div>

          {/* Best Day */}
          {reportData.bestDay && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="text-sm font-medium text-green-800 dark:text-green-300">Best Performing Day</div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-200">
                    {reportData.bestDay.date} — {formatCurrency(reportData.bestDay.sales)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shop Breakdown */}
          {selectedShop === 'all' && reportData.shopBreakdown.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">🏪 Shop Breakdown</h3>
              <div className="space-y-2">
                {reportData.shopBreakdown.map(({ shop, sales, orders }) => (
                  <div key={shop.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: shop.color }} />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{shop.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(sales)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{formatNumber(orders)} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Based on {reportData.recordCount} records
          </div>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-shopee-orange text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Report
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Metric Card component
const MetricCard: React.FC<{
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
}> = ({ label, value, change, icon }) => (
  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{value}</div>
    {change !== undefined && (
      <div className={`text-xs font-medium mt-1 ${
        change >= 0 ? 'text-green-600' : 'text-red-500'
      }`}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs prev
      </div>
    )}
  </div>
);

export default SummaryReport;
