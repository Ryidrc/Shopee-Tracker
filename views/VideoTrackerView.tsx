
import React, { useState, useMemo } from 'react';
import { VideoLog, PricingItem, SHOPS, ShopID } from '../types';
import { formatNumber } from '../utils';
import { EmptyState, Badge } from '../components/UIComponents';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Video, Plus, Edit2, Trash2, ExternalLink, Search } from 'lucide-react';

interface VideoTrackerViewProps {
  videoLogs: VideoLog[];
  pricingItems: PricingItem[];
  onAddLog: (shopId: ShopID) => void;
  onEditLog: (log: VideoLog) => void;
  onDeleteLog: (id: string) => void;
}

const formatDate = (isoString: string) => {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseSku = (sku: string) => {
    // Regex to split letters and numbers. e.g. "XX450" -> "XX", "450"
    const match = sku.match(/^([A-Za-z]+)(\d+.*)$/);
    if (match) {
        return { type: match[1], no: match[2] };
    }
    // Fallback for SKUs that don't match strict letter-number pattern
    if (sku.length > 2) {
        return { type: sku.substring(0, 2), no: sku.substring(2) };
    }
    return { type: sku, no: '' }; 
};

export const VideoTrackerView: React.FC<VideoTrackerViewProps> = ({ videoLogs, pricingItems, onAddLog, onEditLog, onDeleteLog }) => {
  const [activeShopId, setActiveShopId] = useState<ShopID>(SHOPS[0]!.id);
  const [search, setSearch] = useState('');

  const tableData = useMemo(() => {
    return videoLogs
      .filter(log => log.shopId === activeShopId)
      .map(log => {
        const product = pricingItems.find(p => p.sku === log.sku);
        const { type, no } = parseSku(log.sku);
        
        return {
          ...log,
          skuType: type,
          skuNo: no,
          productName: product?.productName || 'Unknown Product',
          uploadDateFormatted: formatDate(log.date),
          videoLink: log.videoCode || `${log.sku}-${log.id.slice(-3)}` // Fallback if no code
        };
      })
      .filter(item => 
        item.sku.toLowerCase().includes(search.toLowerCase()) || 
        item.productName.toLowerCase().includes(search.toLowerCase()) ||
        item.videoLink.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [videoLogs, pricingItems, search, activeShopId]);

  const lastUpdated = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format

  const thClass = "px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 whitespace-nowrap";
  const tdClass = "px-4 py-3 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700 whitespace-nowrap";

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Strategy Header */}
      {/* Strategy Header */}
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 flex flex-row items-center gap-4 p-5 shadow-soft-sm">
         <div className="p-3 bg-white dark:bg-white/10 rounded-full shrink-0 shadow-sm text-red-600 dark:text-red-200">
            <Video size={20} />
         </div>
         <div>
            <h3 className="text-xs font-bold text-red-500 dark:text-red-300 uppercase mb-1 tracking-wider">Strategy Rule</h3>
            <p className="text-sm text-red-900 dark:text-red-100 font-medium leading-relaxed">
               No Viewer over Last 2 Months? <span className="font-bold border-b border-red-300">Reupload</span>: Trim 1s, Add Filter + Brightness, New Song, New Hook.
            </p>
         </div>
      </Card>

      {/* Main Container */}
      <Card className="p-0 overflow-hidden flex flex-col">
         
         {/* Toolbar */}
         <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700">
                    {SHOPS.map(shop => (
                        <button
                            key={shop.id}
                            onClick={() => setActiveShopId(shop.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                activeShopId === shop.id 
                                ? 'bg-white dark:bg-slate-600 shadow-sm text-shopee-orange scale-105' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            {shop.name}
                        </button>
                    ))}
                </div>
                
                <div className="hidden md:flex gap-4 text-xs font-mono text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-700 pl-4 items-center">
                    <div>Updated: <span className="font-bold text-slate-600 dark:text-slate-300">{lastUpdated}</span></div>
                    
                    <a 
                      href="https://drive.google.com/drive/folders/1oMzboTbN7VEZYaugG98oAvaXsaX-j4sf" 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors font-bold"
                    >
                      VIDEO SKU (HAPPY)
                      <ExternalLink size={10} />
                    </a>
                </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
                 <div className="relative flex-1 lg:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search SKU..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-shopee-orange/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <Button 
                    onClick={() => onAddLog(activeShopId)}
                    className="gap-2 shadow-soft-sm whitespace-nowrap"
                  >
                    <Plus size={16} />
                    Log Video
                  </Button>
            </div>
         </div>

         {/* Spreadsheet Table */}
         <div className="overflow-x-auto">
            <table className="min-w-full">
               <thead>
                  <tr>
                     <th className={thClass}>SKU TIPE</th>
                     <th className={thClass}>SKU NO</th>
                     <th className={thClass}>PRODUCT NAME</th>
                     <th className={thClass}>LINK VIDEO</th>
                     <th className={thClass}>UPLOAD DATE</th>
                     <th className={thClass + " text-right"}>TOTAL VIEWS</th>
                     <th className={thClass}></th>
                  </tr>
               </thead>
               <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                  {tableData.length === 0 ? (
                      <tr>
                          <td colSpan={7} className="px-4 py-0">
                            <EmptyState 
                              icon="video"
                              title={`No videos logged for ${SHOPS.find(s => s.id === activeShopId)?.name}`}
                              description="Start logging your Shopee video uploads to track views and performance metrics."
                              action={{
                                label: 'Log First Video',
                                onClick: () => onAddLog(activeShopId)
                              }}
                            />
                          </td>
                      </tr>
                  ) : (
                      tableData.map(log => (
                        <tr key={log.id} className="hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors group">
                           <td className={tdClass + " font-bold text-slate-500"}>{log.skuType}</td>
                           <td className={tdClass + " font-bold text-slate-800 dark:text-slate-200"}>{log.skuNo}</td>
                           <td className={tdClass}>
                              <div className="max-w-[250px] truncate" title={log.productName}>
                                 {log.productName}
                              </div>
                           </td>
                           <td className={tdClass}>
                              <span className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded border border-blue-100 dark:border-blue-800">
                                 {log.videoLink}
                              </span>
                           </td>
                           <td className={tdClass + " font-mono text-xs"}>{log.uploadDateFormatted}</td>
                           <td className={tdClass + " text-right font-bold"}>
                              <span className={`${log.views > 1000 ? 'text-green-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                {formatNumber(log.views)}
                              </span>
                           </td>
                           <td className={tdClass + " text-right"}>
                               <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => onEditLog(log)} className="text-slate-300 hover:text-blue-500 p-1" title="Edit">
                                      <Edit2 size={16} />
                                  </button>
                                  <button onClick={() => onDeleteLog(log.id)} className="text-slate-300 hover:text-red-500 p-1" title="Delete">
                                      <Trash2 size={16} />
                                  </button>
                               </div>
                           </td>
                        </tr>
                      ))
                  )}
               </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
};
