import React, { useState, useMemo } from 'react';
import { VideoLog, PricingItem, SHOPS } from '../types';
import { formatNumber } from '../utils';

interface VideoTrackerViewProps {
  videoLogs: VideoLog[];
  pricingItems: PricingItem[];
  onAddLog: () => void;
  onEditLog: (log: VideoLog) => void;
  onDeleteLog: (id: string) => void;
}

export const VideoTrackerView: React.FC<VideoTrackerViewProps> = ({ videoLogs, pricingItems, onAddLog, onEditLog, onDeleteLog }) => {
  const [activeTab, setActiveTab] = useState<'coverage' | 'performance'>('coverage');
  const [search, setSearch] = useState('');

  // --- TAB 1: INVENTORY COVERAGE DATA ---
  // Aggregate data by Unique SKU to see which products have videos
  const inventoryCoverage = useMemo(() => {
    // Get unique SKUs from pricing items
    const uniqueSkus: string[] = Array.from(new Set(pricingItems.map(p => p.sku)));
    
    return uniqueSkus.map(sku => {
      const productInfo = pricingItems.find(p => p.sku === sku);
      // Count total videos across all shops for this SKU
      const videos = videoLogs.filter(v => v.sku === sku);
      const totalViews = videos.reduce((acc, curr) => acc + curr.views, 0);
      const totalOrders = videos.reduce((acc, curr) => acc + curr.orders, 0);

      return {
        sku,
        name: productInfo?.productName || 'Unknown',
        brand: productInfo?.brand || 'Unknown',
        videoCount: videos.length,
        totalViews,
        totalOrders
      };
    }).filter(item => 
       item.name.toLowerCase().includes(search.toLowerCase()) || 
       item.sku.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
        // Sort by Video Count ASC (Show 0 videos first), then by Sales desc
        if (a.videoCount === b.videoCount) return b.totalOrders - a.totalOrders;
        return a.videoCount - b.videoCount;
    });
  }, [pricingItems, videoLogs, search]);


  // --- TAB 2: PERFORMANCE DATA ---
  const performanceData = useMemo(() => {
    return videoLogs.map(log => {
      const product = pricingItems.find(p => p.sku === log.sku && p.shopId === log.shopId) 
                   || pricingItems.find(p => p.sku === log.sku); // Fallback to just SKU match
      
      // Simple Rating Logic
      let rating = 'Normal';
      let ratingColor = 'text-slate-500 bg-slate-100 dark:bg-slate-700';
      
      // If conversion is high (Orders > 0 is good for a single video)
      if (log.orders > 2) {
         rating = 'High Conv.';
         ratingColor = 'text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-300';
      } else if (log.views > 1000) {
         rating = 'Viral';
         ratingColor = 'text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300';
      } else if (log.views < 50) {
         rating = 'Low Perf.';
         ratingColor = 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300';
      }

      return {
        ...log,
        productName: product?.productName || log.sku,
        rating,
        ratingColor
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first
  }, [videoLogs, pricingItems]);


  const thClass = "px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider bg-slate-50 dark:bg-slate-700 sticky top-0";
  const tdClass = "px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Video Tracker</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track uploads and measure which content performs best.</p>
        </div>
        
        <div className="flex gap-2">
           <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex">
              <button 
                onClick={() => setActiveTab('coverage')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'coverage' ? 'bg-white dark:bg-slate-600 shadow text-shopee-orange' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Inventory Coverage
              </button>
              <button 
                onClick={() => setActiveTab('performance')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'performance' ? 'bg-white dark:bg-slate-600 shadow text-shopee-orange' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Performance Log
              </button>
           </div>
           
           <button 
              onClick={onAddLog}
              className="bg-shopee-orange text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-red-600 transition flex items-center gap-2"
           >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Log Video
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'coverage' ? (
        <div className="space-y-4 animate-fade-in">
           {/* Summary Stats for Coverage */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50">
                  <div className="text-red-500 dark:text-red-300 text-sm font-bold uppercase">Untouched Products</div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                      {inventoryCoverage.filter(i => i.videoCount === 0).length} <span className="text-sm font-normal text-slate-500">items</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Products with 0 videos uploaded.</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/50">
                  <div className="text-green-600 dark:text-green-300 text-sm font-bold uppercase">Total Videos</div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                      {videoLogs.length} <span className="text-sm font-normal text-slate-500">uploads</span>
                  </div>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all shops.</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                   <div className="text-blue-600 dark:text-blue-300 text-sm font-bold uppercase">Top Covered SKU</div>
                   <div className="text-lg font-bold text-slate-800 dark:text-white mt-1 truncate">
                      {inventoryCoverage.reduce((prev, current) => (prev.videoCount > current.videoCount) ? prev : current, {sku: '-', videoCount: 0}).sku}
                   </div>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Most video content.</p>
              </div>
           </div>

           {/* Inventory Table */}
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                  <input 
                    type="text" 
                    placeholder="Search Product Name or SKU..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-64 border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-shopee-orange focus:border-shopee-orange"
                  />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead>
                        <tr>
                            <th className={thClass}>Product Name</th>
                            <th className={thClass}>SKU</th>
                            <th className={thClass + " text-center"}>Video Count</th>
                            <th className={thClass + " text-right"}>Total Views</th>
                            <th className={thClass + " text-right"}>Orders Generated</th>
                            <th className={thClass}>Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {inventoryCoverage.map(item => (
                            <tr key={item.sku} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <td className={tdClass}>
                                    <div className="font-medium text-slate-900 dark:text-white">{item.name}</div>
                                    <div className="text-xs text-slate-400">{item.brand}</div>
                                </td>
                                <td className={tdClass + " font-mono text-xs"}>{item.sku}</td>
                                <td className={tdClass + " text-center font-bold"}>{item.videoCount}</td>
                                <td className={tdClass + " text-right"}>{formatNumber(item.totalViews)}</td>
                                <td className={tdClass + " text-right"}>{item.totalOrders}</td>
                                <td className={tdClass}>
                                    {item.videoCount === 0 ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                            Missing Content
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Active
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                         {inventoryCoverage.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-500">No products found. Add products in Pricing Calculator first.</td></tr>
                        )}
                    </tbody>
                </table>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in transition-colors">
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead>
                        <tr>
                            <th className={thClass}>Date</th>
                            <th className={thClass}>Shop</th>
                            <th className={thClass}>Product / SKU</th>
                            <th className={thClass}>Concept</th>
                            <th className={thClass + " text-right"}>Views</th>
                            <th className={thClass + " text-right"}>Likes</th>
                            <th className={thClass + " text-right"}>Orders</th>
                            <th className={thClass}>Rating</th>
                            <th className={thClass + " text-right"}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {performanceData.map(log => {
                            const shop = SHOPS.find(s => s.id === log.shopId);
                            return (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <td className={tdClass}>{log.date}</td>
                                    <td className={tdClass}>
                                        <span className="text-xs px-2 py-1 rounded font-bold text-white whitespace-nowrap" style={{ backgroundColor: shop?.color }}>
                                            {shop?.name}
                                        </span>
                                    </td>
                                    <td className={tdClass}>
                                        <div className="max-w-[200px] truncate font-medium text-slate-900 dark:text-white" title={log.productName}>{log.productName}</div>
                                        <div className="text-xs text-slate-400 font-mono">{log.sku}</div>
                                    </td>
                                    <td className={tdClass}>
                                        <span className="bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded text-xs font-medium text-slate-700 dark:text-slate-200">
                                            {log.concept}
                                        </span>
                                    </td>
                                    <td className={tdClass + " text-right"}>{formatNumber(log.views)}</td>
                                    <td className={tdClass + " text-right"}>{formatNumber(log.likes)}</td>
                                    <td className={tdClass + " text-right font-bold text-slate-900 dark:text-white"}>{log.orders}</td>
                                    <td className={tdClass}>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${log.ratingColor}`}>
                                            {log.rating}
                                        </span>
                                    </td>
                                    <td className={tdClass + " text-right"}>
                                         <button onClick={() => onEditLog(log)} className="text-slate-400 hover:text-blue-500 transition-colors mr-3" title="Edit Metrics">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                         </button>
                                         <button onClick={() => onDeleteLog(log.id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Delete Log">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {performanceData.length === 0 && (
                            <tr><td colSpan={9} className="p-8 text-center text-slate-500">No videos logged yet. Click "Log Video" to start tracking performance.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};