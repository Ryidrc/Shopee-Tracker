
/// <reference lib="dom" />
import React, { useState, useEffect, useRef } from 'react';
import { SalesRecord, TaskCompletion, Product, SHOPS, INITIAL_TASKS, Task, PricingItem, CompetitorItem, VideoLog, ShopID, WorkLog } from './types';
import { AnalyticsView } from './views/AnalyticsView';
import { TaskTrackerView } from './views/TaskTrackerView';
import { PricingView } from './views/PricingView';
import { CompetitorView } from './views/CompetitorView';
import { VideoTrackerView } from './views/VideoTrackerView';
import { InputModal } from './components/InputModal';
import { ProductModal } from './components/ProductModal';
import { VideoLogModal } from './components/VideoLogModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ImportSelectionModal } from './components/ImportSelectionModal';
import { INITIAL_PRICING } from './data';
import * as XLSX from 'xlsx';

function App() {
  const [view, setView] = useState<'analytics' | 'tasks' | 'pricing' | 'competitors' | 'videos'>('analytics');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  
  // Lifted Date Range State (so we can update it after import)
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  // HELPER: Sanitize Products to ensure unique IDs
  const sanitizeProducts = (rawProducts: any[]): Product[] => {
      const seenIds = new Set();
      return rawProducts.map((p: any, i: number) => {
        let id = p.id;
        
        // Convert to string safely
        if (typeof id !== 'string') id = String(id || '');
        
        id = id.trim();

        // If ID is missing, empty, duplicate, or 'undefined', generate a new one
        if (!id || seenIds.has(id) || id === 'undefined' || id === 'null') {
           // Use a clean simple ID format
           id = `prod-${Date.now()}-${i}`;
        }
        seenIds.add(id);
        return { ...p, id };
      });
  };

  // -- STATE INITIALIZATION --
  const [salesData, setSalesData] = useState<SalesRecord[]>(() => {
    try {
      const saved = localStorage.getItem('shopee_sales_data');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('shopee_tasks_def');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch (e) { return INITIAL_TASKS; }
  });

  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>(() => {
    try {
      const saved = localStorage.getItem('shopee_task_completions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [workLogs, setWorkLogs] = useState<WorkLog[]>(() => {
    try {
        const saved = localStorage.getItem('shopee_work_logs');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('shopee_hero_products');
      let parsed = saved ? JSON.parse(saved) : [];
      
      const sanitized = sanitizeProducts(parsed);

      // If we fixed any IDs during load, save back to storage immediately
      if (JSON.stringify(sanitized) !== JSON.stringify(parsed)) {
          localStorage.setItem('shopee_hero_products', JSON.stringify(sanitized));
      }
      return sanitized;
    } catch (e) { return []; }
  });

  const [pricingItems, setPricingItems] = useState<PricingItem[]>(() => {
    try {
      const saved = localStorage.getItem('shopee_pricing_data');
      return saved ? JSON.parse(saved) : INITIAL_PRICING;
    } catch (e) { return INITIAL_PRICING; }
  });

  const [competitors, setCompetitors] = useState<CompetitorItem[]>(() => {
    try {
      const saved = localStorage.getItem('shopee_competitors');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [videoLogs, setVideoLogs] = useState<VideoLog[]>(() => {
    try {
      const saved = localStorage.getItem('shopee_video_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideoLog, setEditingVideoLog] = useState<VideoLog | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<Omit<SalesRecord, 'id' | 'shopId'>[]>([]);
  const [importSummary, setImportSummary] = useState({ count: 0, minDate: '', maxDate: '', fileName: '' });

  // -- CONFIRMATION MODAL STATE --
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Initialize Theme
  useEffect(() => {
    if ((window as any).matchMedia && (window as any).matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Apply Theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // -- DATA HANDLERS --

  const handleAddData = (record: Omit<SalesRecord, 'id'>) => {
    const existingIndex = salesData.findIndex(d => d.date === record.date && d.shopId === record.shopId);
    let updatedData;
    if (existingIndex >= 0) {
        updatedData = [...salesData];
        updatedData[existingIndex] = { ...salesData[existingIndex], ...record };
    } else {
        const newRecord = { ...record, id: `${record.date}-${record.shopId}-${Date.now()}` };
        updatedData = [...salesData, newRecord];
    }
    setSalesData(updatedData);
    localStorage.setItem('shopee_sales_data', JSON.stringify(updatedData));
  };

  const handleDeleteSalesData = (date: string, shopId: ShopID) => {
    openConfirm("Delete Record?", "Are you sure you want to delete this daily record? This cannot be undone.", () => {
        const updated = salesData.filter(d => !(d.date === date && d.shopId === shopId));
        setSalesData(updated);
        localStorage.setItem('shopee_sales_data', JSON.stringify(updated));
        setIsModalOpen(false); 
        closeConfirm();
    });
  };

  // TASK HANDLERS
  const handleAddTask = (newTask: Task) => {
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem('shopee_tasks_def', JSON.stringify(updatedTasks));
  };

  const handleEditTask = (taskId: string, newText: string, newFrequency: 'daily' | 'weekly', newTime?: string) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, text: newText, frequency: newFrequency, reminderTime: newTime } : t);
    setTasks(updatedTasks);
    localStorage.setItem('shopee_tasks_def', JSON.stringify(updatedTasks));
  };

  const handleDeleteTask = (taskId: string) => {
    openConfirm("Delete Task?", "Are you sure you want to remove this task from your checklist?", () => {
        const updatedTasks = tasks.filter(t => t.id !== taskId);
        setTasks(updatedTasks);
        localStorage.setItem('shopee_tasks_def', JSON.stringify(updatedTasks));
        closeConfirm();
    });
  };

  const handleToggleTask = (taskId: string, shopId: any, date: string, checked: boolean) => {
    let updated = [...taskCompletions];
    const existingIndex = updated.findIndex(t => t.taskId === taskId && t.shopId === shopId && t.date === date);

    if (existingIndex > -1) {
      updated[existingIndex].completed = checked;
    } else {
      updated.push({ taskId, shopId, date, completed: checked });
    }
    setTaskCompletions(updated);
    localStorage.setItem('shopee_task_completions', JSON.stringify(updated));
  };

  const handleUpdateWorkLog = (log: WorkLog) => {
      const existingIdx = workLogs.findIndex(l => l.date === log.date && l.shopId === log.shopId);
      let updated;
      if (existingIdx > -1) {
          updated = [...workLogs];
          updated[existingIdx] = log;
      } else {
          updated = [...workLogs, log];
      }
      setWorkLogs(updated);
      localStorage.setItem('shopee_work_logs', JSON.stringify(updated));
  }

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => {
        const updated = [...prev, newProduct];
        const sanitized = sanitizeProducts(updated); 
        localStorage.setItem('shopee_hero_products', JSON.stringify(sanitized));
        return sanitized;
    });

    if (newProduct.sku) {
      const sku = newProduct.sku.trim();
      setPricingItems(prevItems => {
        const skuExists = prevItems.some(i => i.sku.toLowerCase() === sku.toLowerCase());
        
        if (skuExists) {
           if (newProduct.image) {
             const updatedItems = prevItems.map(item => {
                if (item.sku.toLowerCase() === sku.toLowerCase()) {
                   return { ...item, image: newProduct.image };
                }
                return item;
             });
             localStorage.setItem('shopee_pricing_data', JSON.stringify(updatedItems));
             return updatedItems;
           }
           return prevItems;
        } else {
           const timestamp = Date.now();
           const newPricingItems: PricingItem[] = SHOPS.map(shop => ({
              id: `item-${timestamp}-${shop.id}`,
              sku: sku,
              shopId: shop.id,
              productName: newProduct.name,
              image: newProduct.image || '',
              brand: '', 
              stock: 0,
              rating: 5.0, 
              price: 0,
              priceNet: 0,
              biaya1250: 1250,
              voucher: 0,
              discount: 0,
              hargaJual: 0,
              flashSale: 0,
              promotion: 0,
              affiliate: 5, 
              admin: 8,     
              ongkir: 4,    
              total: 0
           }));
           
           const updated = [...prevItems, ...newPricingItems];
           localStorage.setItem('shopee_pricing_data', JSON.stringify(updated));
           return updated;
        }
      });
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (!id) { alert("Error: ID missing"); return; }
    openConfirm("Delete Product?", "Remove this product from the Top 10 list?", () => {
        setProducts(prev => {
            const targetId = String(id);
            const updated = prev.filter(p => String(p.id) !== targetId);
            localStorage.setItem('shopee_hero_products', JSON.stringify(updated));
            return updated;
        });
        closeConfirm();
    });
  }

  const handleUpdatePricing = (updatedItems: PricingItem[]) => {
    setPricingItems(updatedItems);
    localStorage.setItem('shopee_pricing_data', JSON.stringify(updatedItems));
  }
  
  const handleRequestDeletePricing = (id: string) => {
      const itemToDelete = pricingItems.find(i => i.id === id);
      if (!itemToDelete) return;

      openConfirm("Delete Inventory?", `Delete SKU ${itemToDelete.sku} from ALL shops?`, () => {
          const updated = pricingItems.filter(i => i.sku !== itemToDelete.sku);
          setPricingItems(updated);
          localStorage.setItem('shopee_pricing_data', JSON.stringify(updated));
          closeConfirm();
      });
  };

  const handleUpdateCompetitors = (updated: CompetitorItem[]) => {
    setCompetitors(updated);
    localStorage.setItem('shopee_competitors', JSON.stringify(updated));
  }

  const handleRequestDeleteCompetitor = (id: string) => {
     openConfirm("Stop Tracking?", "Remove this competitor from your list?", () => {
        const updated = competitors.filter(c => c.id !== id);
        setCompetitors(updated);
        localStorage.setItem('shopee_competitors', JSON.stringify(updated));
        closeConfirm();
     });
  };

  const handleAddVideoLog = (logData: Omit<VideoLog, 'id'> | VideoLog) => {
    let updatedLogs;
    if ('id' in logData) {
        updatedLogs = videoLogs.map(v => v.id === logData.id ? logData : v);
    } else {
        const newLog = { ...logData, id: `vid-${Date.now()}` };
        updatedLogs = [...videoLogs, newLog];
    }
    setVideoLogs(updatedLogs);
    localStorage.setItem('shopee_video_logs', JSON.stringify(updatedLogs));

    const taskCompleted = taskCompletions.some(t =>
        t.taskId === 't4' && t.shopId === logData.shopId && t.date === logData.date && t.completed
    );

    if (!taskCompleted) {
        const newCompletion = {
            taskId: 't4',
            shopId: logData.shopId,
            date: logData.date,
            completed: true
        };
        const updatedCompletions = [...taskCompletions, newCompletion];
        setTaskCompletions(updatedCompletions);
        localStorage.setItem('shopee_task_completions', JSON.stringify(updatedCompletions));
    }
  }

  const handleDeleteVideoLog = (id: string) => {
    openConfirm("Delete Log?", "Are you sure you want to delete this video log?", () => {
        const logToDelete = videoLogs.find(v => v.id === id);
        const updated = videoLogs.filter(v => v.id !== id);
        setVideoLogs(updated);
        localStorage.setItem('shopee_video_logs', JSON.stringify(updated));

        if (logToDelete) {
            const remainingVideos = updated.filter(v => v.shopId === logToDelete.shopId && v.date === logToDelete.date);
            
            if (remainingVideos.length === 0) {
                const updatedCompletions = taskCompletions.filter(t => 
                    !(t.taskId === 't4' && t.shopId === logToDelete.shopId && t.date === logToDelete.date)
                );
                if (updatedCompletions.length !== taskCompletions.length) {
                    setTaskCompletions(updatedCompletions);
                    localStorage.setItem('shopee_task_completions', JSON.stringify(updatedCompletions));
                }
            }
        }
        closeConfirm();
    });
  }

  // --- IMPORT / EXPORT HANDLERS ---
  const handleExportData = () => {
    const data = {
        salesData,
        tasks,
        taskCompletions,
        products,
        pricingItems,
        competitors,
        videoLogs,
        workLogs,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopee_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') return;
        
        const data = JSON.parse(content);
        
        if (!data.salesData && !data.products && !data.pricingItems) {
            alert("Invalid backup file format or empty data.");
            return;
        }

        openConfirm("Restore Backup?", "This will overwrite your current data with the backup. Continue?", () => {
            if (data.salesData) {
                setSalesData(data.salesData);
                localStorage.setItem('shopee_sales_data', JSON.stringify(data.salesData));
            }
            if (data.tasks) {
                setTasks(data.tasks);
                localStorage.setItem('shopee_tasks_def', JSON.stringify(data.tasks));
            }
            if (data.taskCompletions) {
                setTaskCompletions(data.taskCompletions);
                localStorage.setItem('shopee_task_completions', JSON.stringify(data.taskCompletions));
            }
            if (data.workLogs) {
                setWorkLogs(data.workLogs);
                localStorage.setItem('shopee_work_logs', JSON.stringify(data.workLogs));
            }
            if (data.products) {
                const cleanProducts = sanitizeProducts(data.products);
                setProducts(cleanProducts);
                localStorage.setItem('shopee_hero_products', JSON.stringify(cleanProducts));
            }
            if (data.pricingItems) {
                setPricingItems(data.pricingItems);
                localStorage.setItem('shopee_pricing_data', JSON.stringify(data.pricingItems));
            }
            if (data.competitors) {
                setCompetitors(data.competitors);
                localStorage.setItem('shopee_competitors', JSON.stringify(data.competitors));
            }
            if (data.videoLogs) {
                setVideoLogs(data.videoLogs);
                localStorage.setItem('shopee_video_logs', JSON.stringify(data.videoLogs));
            }
            
            closeConfirm();
            alert("Backup restored successfully.");
        });

      } catch (error) {
        console.error("Error reading backup file:", error);
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportExcelClick = () => {
    excelInputRef.current?.click();
  };

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true }) as any[][];
            
            const tempRecords: Omit<SalesRecord, 'id' | 'shopId'>[] = [];
            let importCount = 0;
            let minDate = '';
            let maxDate = '';
            
            const START_ROW_INDEX = 4;

            for (let i = START_ROW_INDEX; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;

                const colDate = row[0];
                let isoDate = '';

                if (typeof colDate === 'number') {
                    const dateObj = XLSX.SSF.parse_date_code(colDate);
                    if (dateObj) {
                        const p = (n: number) => n.toString().padStart(2, '0');
                        isoDate = `${dateObj.y}-${p(dateObj.m)}-${p(dateObj.d)}`;
                    }
                } else if (typeof colDate === 'string') {
                    if (colDate.length > 10 && colDate.split('-').length > 3) continue; 
                    if (/^\d{2}-\d{2}-\d{4}$/.test(colDate)) {
                        const [day, month, year] = colDate.split('-');
                        isoDate = `${year}-${month}-${day}`;
                    }
                }

                if (!isoDate) continue;

                if (!minDate || isoDate < minDate) minDate = isoDate;
                if (!maxDate || isoDate > maxDate) maxDate = isoDate;

                const parseShopeeNumber = (val: any): number => {
                    if (typeof val === 'number') return val;
                    if (typeof val === 'string') {
                        let clean = val.trim().replace(/[Rp\s%IDR]/g, '');
                        if (clean.includes('.') && clean.includes(',')) {
                             clean = clean.replace(/\./g, '').replace(/,/g, '.');
                        } else if (clean.includes('.')) {
                             clean = clean.replace(/\./g, '');
                        } else if (clean.includes(',')) {
                             clean = clean.replace(/,/g, '.');
                        }
                        const num = parseFloat(clean);
                        return isNaN(num) ? 0 : num;
                    }
                    return 0;
                };

                const sales = parseShopeeNumber(row[1]);
                const orders = parseShopeeNumber(row[2]);
                const clicks = parseShopeeNumber(row[4]);
                const visitors = parseShopeeNumber(row[5]);
                let convRaw = 0;
                const rawConv = row[6];
                if (typeof rawConv === 'number') {
                    convRaw = rawConv < 1.0 ? rawConv : rawConv / 100;
                } else {
                    convRaw = parseShopeeNumber(rawConv) / 100;
                }

                const record = {
                    date: isoDate,
                    penjualan: sales,
                    pesanan: orders,
                    konversi: convRaw,
                    pengunjung: visitors,
                    produkDiklik: clicks,
                    chatResponseRate: undefined, 
                    lateShipmentRate: undefined
                };

                tempRecords.push(record);
                importCount++;
            }

            if (importCount > 0) {
                setPendingImportData(tempRecords);
                setImportSummary({
                    count: importCount,
                    minDate,
                    maxDate,
                    fileName: file.name
                });
                setIsImportModalOpen(true);
            } else {
                alert("No valid daily data found. Please check if the Excel matches the expected format.");
            }

        } catch (error) {
            console.error("Excel Import Error:", error);
            alert("Error parsing Excel file.");
        }
    };
    reader.readAsArrayBuffer(file);
    if (excelInputRef.current) excelInputRef.current.value = '';
  }

  const handleConfirmImport = (targetShopId: ShopID) => {
      // Convert pending records to full SalesRecords with ID and ShopID
      const newRecords: SalesRecord[] = pendingImportData.map(r => ({
          ...r,
          shopId: targetShopId,
          id: `${r.date}-${targetShopId}-${Date.now()}-${Math.random()}`
      }));

      setSalesData(prev => {
          // Remove existing records for the same dates and shop to avoid duplicates
          const filtered = prev.filter(p => !newRecords.some(n => n.date === p.date && n.shopId === p.shopId));
          const updated = [...filtered, ...newRecords];
          localStorage.setItem('shopee_sales_data', JSON.stringify(updated));
          return updated;
      });

      if (importSummary.minDate && importSummary.maxDate) {
          setDateRange({ start: importSummary.minDate, end: importSummary.maxDate });
      }

      const targetShopName = SHOPS.find(s => s.id === targetShopId)?.name;
      alert(`Success! Imported ${importSummary.count} rows for ${targetShopName}.\nDashboard date range updated.`);
      
      setIsImportModalOpen(false);
      setPendingImportData([]);
  };

  const navButtonClass = (active: boolean) => 
    `px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
      active 
      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' 
      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 flex flex-col transition-colors duration-200 relative">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />

      <ImportSelectionModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={handleConfirmImport}
        recordCount={importSummary.count}
        dateRange={{ start: importSummary.minDate, end: importSummary.maxDate }}
        fileName={importSummary.fileName}
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".json"
      />
      <input 
        type="file" 
        ref={excelInputRef} 
        onChange={handleExcelUpload} 
        className="hidden" 
        accept=".xlsx, .xls"
      />
      
      {/* Minimalistic Navigation */}
      <nav className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200 border-b border-slate-100 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-2 mr-4">
               <div className="bg-shopee-orange text-white p-1.5 rounded-lg shadow-sm">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
               </div>
               <span className="font-bold text-lg tracking-tight hidden md:inline dark:text-white text-slate-900">Tracker</span>
            </div>
            
            {/* Desktop Tabs */}
            <div className="hidden md:flex space-x-1">
                <button onClick={() => setView('analytics')} className={navButtonClass(view === 'analytics')}>Dashboard</button>
                <button onClick={() => setView('tasks')} className={navButtonClass(view === 'tasks')}>Productivity</button>
                <button onClick={() => setView('pricing')} className={navButtonClass(view === 'pricing')}>Pricing</button>
                <button onClick={() => setView('competitors')} className={navButtonClass(view === 'competitors')}>Competitors</button>
                <button onClick={() => setView('videos')} className={navButtonClass(view === 'videos')}>Videos</button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                      <button onClick={handleImportExcelClick} className="p-2 text-slate-500 hover:text-green-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center gap-2" title="Import Excel">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                         <span className="text-xs font-bold hidden sm:inline">Import Sheet</span>
                      </button>
                      <button onClick={handleExportData} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Export Backup">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                       <button onClick={handleImportClick} className="p-2 text-slate-500 hover:text-orange-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Import Backup">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      </button>
                  </div>

                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                  <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    {isDarkMode ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                  </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu (Horizontal Scroll) */}
        <div className="md:hidden border-t border-slate-100 dark:border-slate-700 flex overflow-x-auto no-scrollbar py-2 px-2 gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md">
             <button onClick={() => setView('analytics')} className={navButtonClass(view === 'analytics')}>Dashboard</button>
             <button onClick={() => setView('tasks')} className={navButtonClass(view === 'tasks')}>Productivity</button>
             <button onClick={() => setView('pricing')} className={navButtonClass(view === 'pricing')}>Pricing</button>
             <button onClick={() => setView('competitors')} className={navButtonClass(view === 'competitors')}>Competitors</button>
             <button onClick={() => setView('videos')} className={navButtonClass(view === 'videos')}>Videos</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in">
        {view === 'analytics' ? (
          <AnalyticsView 
            data={salesData} 
            products={products} 
            onAddDataClick={() => setIsModalOpen(true)}
            onManageProducts={() => setIsProductModalOpen(true)}
            onDeleteProduct={handleDeleteProduct}
            onDeleteSalesRecord={handleDeleteSalesData}
            isDarkMode={isDarkMode}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        ) : view === 'pricing' ? (
          <PricingView 
            items={pricingItems}
            onUpdateItems={handleUpdatePricing}
            onRequestDelete={handleRequestDeletePricing}
          />
        ) : view === 'competitors' ? (
          <CompetitorView 
             competitors={competitors}
             onUpdateCompetitors={handleUpdateCompetitors}
             pricingItems={pricingItems}
             onRequestDelete={handleRequestDeleteCompetitor}
          />
        ) : view === 'videos' ? (
          <VideoTrackerView 
            videoLogs={videoLogs}
            pricingItems={pricingItems}
            onAddLog={() => { setEditingVideoLog(null); setIsVideoModalOpen(true); }}
            onEditLog={(log) => { setEditingVideoLog(log); setIsVideoModalOpen(true); }}
            onDeleteLog={handleDeleteVideoLog}
          />
        ) : (
          <TaskTrackerView 
            tasks={tasks}
            completions={taskCompletions}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            workLogs={workLogs}
            onUpdateWorkLog={handleUpdateWorkLog}
            pricingItems={pricingItems}
            salesData={salesData}
          />
        )}
      </main>

      {/* Modals */}
      <InputModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddData}
        onDelete={handleDeleteSalesData}
        existingData={salesData}
      />
      
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleAddProduct}
        pricingItems={pricingItems}
      />

      <VideoLogModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSubmit={handleAddVideoLog}
        pricingItems={pricingItems}
        initialData={editingVideoLog}
      />
    </div>
  );
}

export default App;
