
import { useState, useEffect, useRef, useCallback } from 'react';
import { SalesRecord, PricingItem, VideoLog, SHOPS } from '../types';
import { formatCurrency } from '../utils';

interface SearchResult {
  type: 'sales' | 'pricing' | 'video';
  id: string;
  title: string;
  subtitle: string;
  date?: string;
  shopId?: string;
  highlight?: string;
}

interface GlobalSearchProps {
  salesData: SalesRecord[];
  pricingItems: PricingItem[];
  videoLogs: VideoLog[];
  onNavigate: (view: string, filter?: { date?: string; shopId?: string }) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  salesData,
  pricingItems,
  videoLogs,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search sales data
    salesData.forEach(record => {
      const shopName = SHOPS.find(s => s.id === record.shopId)?.name || '';
      const searchText = `${record.date} ${shopName} ${record.penjualan}`.toLowerCase();
      
      if (searchText.includes(q)) {
        searchResults.push({
          type: 'sales',
          id: record.id,
          title: `Sales: ${formatCurrency(record.penjualan)}`,
          subtitle: `${shopName} - ${record.date}`,
          date: record.date,
          shopId: record.shopId,
          highlight: 'analytics',
        });
      }
    });

    // Search pricing items
    pricingItems.forEach(item => {
      const searchText = `${item.productName} ${item.sku || ''}`.toLowerCase();
      
      if (searchText.includes(q)) {
        searchResults.push({
          type: 'pricing',
          id: item.id,
          title: item.productName,
          subtitle: `SKU: ${item.sku || 'N/A'} - ${formatCurrency(item.price)}`,
          shopId: item.shopId,
          highlight: 'pricing',
        });
      }
    });

    // Search video logs
    videoLogs.forEach(log => {
      const searchText = `${log.concept || ''} ${log.sku || ''} ${log.videoCode || ''}`.toLowerCase();
      
      if (searchText.includes(q)) {
        searchResults.push({
          type: 'video',
          id: log.id,
          title: log.concept || 'Untitled Video',
          subtitle: `${log.date} - SKU: ${log.sku || 'N/A'}`,
          date: log.date,
          shopId: log.shopId,
          highlight: 'videos',
        });
      }
    });

    setResults(searchResults.slice(0, 10));
    setSelectedIndex(0);
  }, [query, salesData, pricingItems, videoLogs]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [results, selectedIndex, onClose]);

  const handleSelect = (result: SearchResult) => {
    onNavigate(result.highlight || 'analytics', {
      date: result.date,
      shopId: result.shopId,
    });
    onClose();
    setQuery('');
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'sales':
        return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
      case 'pricing':
        return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
      case 'video':
        return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'sales': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/30';
      case 'pricing': return 'text-green-500 bg-green-50 dark:bg-green-900/30';
      case 'video': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/30';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-[15vh]" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative border-b border-slate-200 dark:border-slate-700">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search sales, products, videos..."
            className="w-full pl-12 pr-4 py-4 text-lg bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder-slate-400"
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            ) : (
              <ul>
                {results.map((result, index) => (
                  <li 
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      index === selectedIndex 
                        ? 'bg-orange-50 dark:bg-orange-900/20' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                      {getTypeIcon(result.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 dark:text-white truncate">
                        {result.title}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {result.subtitle}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Quick Tips */}
        {!query.trim() && (
          <div className="p-4 text-center text-slate-400">
            <p className="text-sm mb-2">Quick Search Tips:</p>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Search by date</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Product name</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">SKU code</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple inline search bar for individual views
export const SearchBar: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Search...', className = '' }) => {
  return (
    <div className={`search-bar ${className}`}>
      <svg className="search-icon w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
      />
      {value && (
        <button className="clear-button" onClick={() => onChange('')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default GlobalSearch;
