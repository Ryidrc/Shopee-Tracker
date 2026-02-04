
import React, { useState, useEffect } from 'react';
import { VideoLog, SHOPS, ShopID, PricingItem } from '../types';
import { generateVideoCaption } from '../services/geminiService';

interface VideoLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (log: VideoLog | Omit<VideoLog, 'id'>) => void;
  pricingItems: PricingItem[];
  initialData?: VideoLog | null;
  existingLogs?: VideoLog[];
  defaultShopId?: ShopID;
}

export const VideoLogModal: React.FC<VideoLogModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  pricingItems, 
  initialData, 
  existingLogs = [],
  defaultShopId = 'shop1' 
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shopId: defaultShopId,
    sku: '',
    videoCode: '',
    concept: 'Unboxing',
    views: '',
    likes: '',
    orders: ''
  });

  const [skuSearch, setSkuSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState('');

  // AI Caption State
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Load initial data if editing
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
            date: initialData.date,
            shopId: initialData.shopId,
            sku: initialData.sku,
            videoCode: initialData.videoCode || '',
            concept: initialData.concept,
            views: initialData.views.toString(),
            likes: initialData.likes.toString(),
            orders: initialData.orders.toString()
        });
        setSkuSearch(initialData.sku);
        const item = pricingItems.find(p => p.sku === initialData.sku);
        if (item) setSelectedProductName(item.productName);
      } else {
        // Reset for new entry
        setFormData({
            date: new Date().toISOString().split('T')[0],
            shopId: defaultShopId,
            sku: '',
            videoCode: '',
            concept: 'Unboxing',
            views: '',
            likes: '',
            orders: ''
        });
        setSkuSearch('');
        setSelectedProductName('');
        setAiResult('');
        setAiPrompt('');
        setShowAi(false);
      }
    }
  }, [isOpen, initialData, pricingItems, defaultShopId]);

  // Filter unique SKUs for search
  const uniqueSkus = Array.from(new Set(pricingItems.map(p => p.sku))).map((sku: string) => {
    const item = pricingItems.find(p => p.sku === sku);
    return { sku, name: item?.productName || '' };
  });

  const filteredSkus = uniqueSkus.filter(s => 
    s.sku.toLowerCase().includes(skuSearch.toLowerCase()) || 
    s.name.toLowerCase().includes(skuSearch.toLowerCase())
  ).slice(0, 5);

  const generateNextVideoCode = (sku: string) => {
      // Find logs with this SKU
      const relatedLogs = existingLogs.filter(l => l.sku === sku);
      // Logic: count + 1
      const nextNum = relatedLogs.length + 1;
      const formattedNum = String(nextNum).padStart(3, '0');
      return `${sku}-${formattedNum}`;
  };

  const handleSelectSku = (sku: string, name: string) => {
    const nextCode = generateNextVideoCode(sku);
    setFormData({ ...formData, sku, videoCode: nextCode });
    setSkuSearch(sku);
    setSelectedProductName(name);
    setShowSuggestions(false);
  };

  const handleGenerateCaption = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    const result = await generateVideoCaption(selectedProductName || formData.sku || 'Product', aiPrompt);
    setAiResult(result || '');
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiResult);
    alert('Caption copied!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      date: formData.date,
      shopId: formData.shopId,
      sku: formData.sku,
      videoCode: formData.videoCode,
      concept: formData.concept,
      views: Number(formData.views) || 0,
      likes: Number(formData.likes) || 0,
      orders: Number(formData.orders) || 0,
      gmv: 0 
    };

    if (initialData) {
        onSubmit({ ...payload, id: initialData.id });
    } else {
        onSubmit(payload);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = "mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-shopee-orange focus:ring focus:ring-shopee-orange focus:ring-opacity-50 border p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 transition-colors";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 transition-colors my-8 animate-fade-in">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
            {initialData ? 'Edit Video Log' : 'Log New Upload'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date Posted</label>
              <input 
                type="date" 
                required
                className={inputClass}
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className={labelClass}>Shop</label>
              <select 
                className={inputClass}
                value={formData.shopId}
                onChange={e => setFormData({...formData, shopId: e.target.value as ShopID})}
              >
                {SHOPS.map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <label className={labelClass}>Product (SKU)</label>
            <input 
              type="text"
              required
              className={inputClass}
              value={skuSearch}
              onChange={e => {
                setSkuSearch(e.target.value);
                setShowSuggestions(true);
                setFormData({...formData, sku: e.target.value});
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search SKU or Name..."
            />
            {showSuggestions && skuSearch && (
                <div className="absolute z-10 w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {filteredSkus.map(s => (
                        <div 
                            key={s.sku} 
                            onClick={() => handleSelectSku(s.sku, s.name)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer text-sm text-slate-800 dark:text-slate-200"
                        >
                            <span className="font-bold">{s.sku}</span> - {s.name}
                        </div>
                    ))}
                    {filteredSkus.length === 0 && <div className="p-2 text-sm text-slate-500">No matching product found</div>}
                </div>
            )}
          </div>

          <div>
             <label className={labelClass}>Link Video (Code)</label>
             <input 
                type="text"
                className={inputClass}
                value={formData.videoCode}
                onChange={e => setFormData({...formData, videoCode: e.target.value})}
                placeholder="e.g. XX450-001"
             />
             <p className="text-[10px] text-slate-400 mt-1">Auto-generated based on SKU count. Edit if needed.</p>
          </div>

          {/* AI Caption Section */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3">
             <button 
                type="button" 
                onClick={() => setShowAi(!showAi)}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 w-full hover:text-indigo-700 transition-colors"
             >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {showAi ? 'Hide AI Caption Helper' : '✨ Generate Caption with AI'}
             </button>
             
             {showAi && (
                <div className="mt-3 space-y-3 animate-fade-in">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Selling Points / Description</label>
                        <textarea 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="w-full text-xs p-2 rounded border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                            rows={2}
                            placeholder="e.g. Promo 50% off, free shipping, best whitening serum..."
                        />
                    </div>
                    <button 
                        type="button" 
                        onClick={handleGenerateCaption}
                        disabled={isGenerating || !aiPrompt}
                        className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {isGenerating ? 'Generating...' : 'Create Caption'}
                    </button>
                    {aiResult && (
                        <div className="relative">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Result (Max 150 chars)</label>
                            <div className="text-xs p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 pr-8">
                                {aiResult}
                            </div>
                            <button 
                                type="button" 
                                onClick={copyToClipboard}
                                className="absolute right-2 top-6 text-indigo-600 hover:text-indigo-800"
                                title="Copy to Clipboard"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            </button>
                        </div>
                    )}
                </div>
             )}
          </div>

          <div>
             <label className={labelClass}>Video Concept / Style</label>
             <select 
                className={inputClass}
                value={formData.concept}
                onChange={e => setFormData({...formData, concept: e.target.value})}
             >
                <option value="Unboxing">📦 Unboxing</option>
                <option value="Review">⭐ Detailed Review / Testimonial</option>
                <option value="Soft Sell">✨ Soft Sell / Aesthetic</option>
                <option value="Hard Sell">💰 Hard Sell / Promo / Discount</option>
                <option value="Education">🎓 Education / Tutorial</option>
                <option value="Meme">🤡 Meme / Trend / Funny</option>
             </select>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-2">
                 <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Performance Metrics</h3>
                 <span className="text-xs text-slate-400">Optional for new uploads</span>
             </div>
             <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className={labelClass}>Views</label>
                    <input type="number" min="0" className={inputClass} value={formData.views} onChange={e => setFormData({...formData, views: e.target.value})} placeholder="0" />
                </div>
                <div>
                    <label className={labelClass}>Likes</label>
                    <input type="number" min="0" className={inputClass} value={formData.likes} onChange={e => setFormData({...formData, likes: e.target.value})} placeholder="0" />
                </div>
                <div>
                    <label className={labelClass}>Orders</label>
                    <input type="number" min="0" className={inputClass} value={formData.orders} onChange={e => setFormData({...formData, orders: e.target.value})} placeholder="0" />
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-shopee-orange rounded-lg hover:bg-red-600 shadow-md">
              {initialData ? 'Update Log' : 'Save Log'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
