/// <reference lib="dom" />
import { useState, useEffect, useRef, useCallback } from "react";
import {
  SalesRecord,
  TaskCompletion,
  Product,
  SHOPS,
  INITIAL_TASKS,
  Task,
  PricingItem,
  CompetitorItem,
  VideoLog,
  ShopID,
  WorkLog,
  Goal,
  WindowState,
  ViewType,
} from "./types";
import { AnalyticsView } from "./views/AnalyticsView";
import { TaskTrackerView } from "./views/TaskTrackerView";
import { PricingView } from "./views/PricingView";
import { CompetitorView } from "./views/CompetitorView";
import { VideoTrackerView } from "./views/VideoTrackerView";
import { CampaignGeneratorView } from "./views/CampaignGeneratorView";
import { InputModal } from "./components/InputModal";
import { ProductModal } from "./components/ProductModal";
import { VideoLogModal } from "./components/VideoLogModal";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { ImportSelectionModal } from "./components/ImportSelectionModal";
import { ToastContainer, useToast } from "./components/Toast";
import { DataRecoveryPanel } from "./components/DataRecoveryPanel";
import { AIAssistant } from "./components/AIAssistant";
import { GlobalSearch } from "./components/GlobalSearch";
import { SummaryReport } from "./components/SummaryReport";
import { Window } from "./components/Window";
import { INITIAL_PRICING, INITIAL_VIDEO_LOGS } from "./data";
import { MainLayout } from "./components/Layout/MainLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { usePocketBase } from "./hooks/usePocketBase";
import { AuthModal } from "./components/AuthModal";
import * as XLSX from "xlsx";

function App() {
  const [view, setView] = useState<
    "analytics" | "tasks" | "pricing" | "competitors" | "videos" | "campaigns"
  >("analytics");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Lifted Date Range State (so we can update it after import)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 6))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // HELPER: Sanitize Products to ensure unique IDs
  const sanitizeProducts = (rawProducts: any[]): Product[] => {
    const seenIds = new Set();
    return rawProducts.map((p: any, i: number) => {
      let id = p.id;
      if (typeof id !== "string") id = String(id || "");
      id = id.trim();
      if (!id || seenIds.has(id) || id === "undefined" || id === "null") {
        id = `prod-${Date.now()}-${i}`;
      }
      seenIds.add(id);
      return { ...p, id };
    });
  };

  // -- STATE INITIALIZATION WITH AUTO-PERSISTENCE --
  const [salesData, setSalesData] = useLocalStorage<SalesRecord[]>(
    "shopee_sales_data",
    [],
  );
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    "shopee_tasks_def",
    INITIAL_TASKS,
  );
  const [taskCompletions, setTaskCompletions] = useLocalStorage<
    TaskCompletion[]
  >("shopee_task_completions", []);
  const [goals, setGoals] = useLocalStorage<Goal[]>("shopee_goals", []);
  const [workLogs, setWorkLogs] = useLocalStorage<WorkLog[]>(
    "shopee_work_logs",
    [],
  );

  // Products with sanitizer
  const [products, setProducts] = useLocalStorage<Product[]>(
    "shopee_hero_products",
    [],
    sanitizeProducts,
  );

  const [pricingItems, setPricingItems] = useLocalStorage<PricingItem[]>(
    "shopee_pricing_data",
    INITIAL_PRICING,
  );
  const [competitors, setCompetitors] = useLocalStorage<CompetitorItem[]>(
    "shopee_competitors",
    [],
  );
  const [videoLogs, setVideoLogs] = useLocalStorage<VideoLog[]>(
    "shopee_video_logs",
    INITIAL_VIDEO_LOGS,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoModalDefaultShop, setVideoModalDefaultShop] =
    useState<ShopID>("shop1");
  const [editingVideoLog, setEditingVideoLog] = useState<VideoLog | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<
    Omit<SalesRecord, "id" | "shopId">[]
  >([]);
  const [importSummary, setImportSummary] = useState({
    count: 0,
    minDate: "",
    maxDate: "",
    fileName: "",
  });

  // Data Recovery Panel State
  const [isRecoveryPanelOpen, setIsRecoveryPanelOpen] = useState(false);

  // AI Assistant, Search, and Report State
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSummaryReportOpen, setIsSummaryReportOpen] = useState(false);

  // PocketBase Authentication State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const pocketbase = usePocketBase();

  // Window State Management
  const [windowStates, setWindowStates] = useLocalStorage<
    Record<ViewType, WindowState>
  >("window_states", {
    analytics: {
      isOpen: false,
      isMinimized: false,
      position: { x: 100, y: 100 },
      size: { width: 900, height: 700 },
      zIndex: 1000,
    },
    tasks: {
      isOpen: false,
      isMinimized: false,
      position: { x: 150, y: 150 },
      size: { width: 900, height: 700 },
      zIndex: 1000,
    },
    pricing: {
      isOpen: false,
      isMinimized: false,
      position: { x: 200, y: 200 },
      size: { width: 900, height: 700 },
      zIndex: 1000,
    },
    competitors: {
      isOpen: false,
      isMinimized: false,
      position: { x: 250, y: 250 },
      size: { width: 900, height: 700 },
      zIndex: 1000,
    },
    videos: {
      isOpen: false,
      isMinimized: false,
      position: { x: 300, y: 300 },
      size: { width: 900, height: 700 },
      zIndex: 1000,
    },
    campaigns: {
      isOpen: false,
      isMinimized: false,
      position: { x: 350, y: 350 },
      size: { width: 900, height: 700 },
      zIndex: 1000,
    },
  });
  const [maxZIndex, setMaxZIndex] = useState(1000);

  // -- CONFIRMATION MODAL STATE --
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const openConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Initialize Theme
  useEffect(() => {
    if (
      (window as any).matchMedia &&
      (window as any).matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setIsDarkMode(true);
    }
  }, []);

  // Apply Theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K opens search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Escape closes modals
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsAIAssistantOpen(false);
        setIsSummaryReportOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // PocketBase Auto-sync
  useEffect(() => {
    if (pocketbase.isAuthenticated) {
      // Auto-sync on data changes
      const syncData = async () => {
        await pocketbase.pushData({
          salesData,
          pricingItems,
          videoLogs,
          tasks,
          taskCompletions,
          workLogs,
          competitors,
          products,
        });
      };

      // Debounce sync to avoid excessive requests
      const timeoutId = setTimeout(syncData, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [
    salesData,
    pricingItems,
    videoLogs,
    tasks,
    taskCompletions,
    workLogs,
    competitors,
    products,
    pocketbase.isAuthenticated,
  ]);

  // Pull data from cloud on login
  useEffect(() => {
    if (pocketbase.isAuthenticated) {
      const pullData = async () => {
        const cloudData = await pocketbase.pullData();
        if (cloudData) {
          // Merge cloud data with local data
          if (cloudData.salesData) setSalesData(cloudData.salesData);
          if (cloudData.pricingItems) setPricingItems(cloudData.pricingItems);
          if (cloudData.videoLogs) setVideoLogs(cloudData.videoLogs);
          if (cloudData.tasks) setTasks(cloudData.tasks);
          if (cloudData.taskCompletions)
            setTaskCompletions(cloudData.taskCompletions);
          if (cloudData.workLogs) setWorkLogs(cloudData.workLogs);
          if (cloudData.competitors) setCompetitors(cloudData.competitors);
          if (cloudData.products)
            setProducts(sanitizeProducts(cloudData.products));

          toast.success("Data synced from cloud!");
        }
      };
      pullData();
    }
  }, [pocketbase.isAuthenticated]);

  // Toast notification system
  const toast = useToast();

  // --- IMPORT / EXPORT HANDLERS (moved up for keyboard shortcut access) ---
  const handleExportData = useCallback(() => {
    const data = {
      salesData,
      tasks,
      taskCompletions,
      products,
      pricingItems,
      competitors,
      videoLogs,
      workLogs,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shopee_tracker_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [
    salesData,
    tasks,
    taskCompletions,
    products,
    pricingItems,
    competitors,
    videoLogs,
    workLogs,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ctrl/Cmd + Number for navigation
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            setView("analytics");
            break;
          case "2":
            e.preventDefault();
            setView("tasks");
            break;
          case "3":
            e.preventDefault();
            setView("pricing");
            break;
          case "4":
            e.preventDefault();
            setView("competitors");
            break;
          case "5":
            e.preventDefault();
            setView("videos");
            break;
          case "6":
            e.preventDefault();
            setView("campaigns");
            break;
          case "s":
            e.preventDefault();
            handleExportData();
            toast.success("Backup exported successfully!");
            break;
        }
      }

      // Escape to close modals
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setIsProductModalOpen(false);
        setIsVideoModalOpen(false);
        setIsImportModalOpen(false);
        closeConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleExportData, toast]);

  // -- DATA HANDLERS (Manual localStorage.setItem REMOVED as usePersistentState handles it) --

  const handleAddData = (record: Omit<SalesRecord, "id">) => {
    const existingIndex = salesData.findIndex(
      (d) => d.date === record.date && d.shopId === record.shopId,
    );
    let updatedData;
    if (existingIndex >= 0) {
      updatedData = [...salesData];
      updatedData[existingIndex] = { ...salesData[existingIndex], ...record };
    } else {
      const newRecord = {
        ...record,
        id: `${record.date}-${record.shopId}-${Date.now()}`,
      };
      updatedData = [...salesData, newRecord];
    }
    setSalesData(updatedData);
  };

  const handleDeleteSalesData = (date: string, shopId: ShopID) => {
    openConfirm(
      "Delete Record?",
      "Are you sure you want to delete this daily record?",
      () => {
        const deletedRecord = salesData.find(
          (d) => d.date === date && d.shopId === shopId,
        );
        const updated = salesData.filter(
          (d) => !(d.date === date && d.shopId === shopId),
        );
        setSalesData(updated);
        setIsModalOpen(false);
        closeConfirm();

        // Show toast with undo option
        if (deletedRecord) {
          toast.success(`Record deleted`, {
            label: "Undo",
            onClick: () => {
              setSalesData((prev) => [...prev, deletedRecord]);
              toast.info("Record restored");
            },
          });
        }
      },
    );
  };

  // TASK HANDLERS
  const handleAddTask = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const handleEditTask = (
    taskId: string,
    newText: string,
    newFrequency: "daily" | "weekly",
    newTime?: string,
  ) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              text: newText,
              frequency: newFrequency,
              reminderTime: newTime,
            }
          : t,
      ),
    );
  };

  const handleDeleteTask = (taskId: string) => {
    openConfirm(
      "Delete Task?",
      "Are you sure you want to remove this task from your checklist?",
      () => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        closeConfirm();
      },
    );
  };

  const handleToggleTask = (
    taskId: string,
    shopId: any,
    date: string,
    checked: boolean,
  ) => {
    setTaskCompletions((prev) => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(
        (t) => t.taskId === taskId && t.shopId === shopId && t.date === date,
      );
      if (existingIndex > -1) {
        updated[existingIndex].completed = checked;
      } else {
        updated.push({ taskId, shopId, date, completed: checked });
      }
      return updated;
    });
  };

  const handleUpdateWorkLog = (log: WorkLog) => {
    setWorkLogs((prev) => {
      const existingIdx = prev.findIndex(
        (l) => l.date === log.date && l.shopId === log.shopId,
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = log;
        return updated;
      } else {
        return [...prev, log];
      }
    });
  };

  const handleAddGoal = (goal: Goal) => {
    setGoals((prev) => [goal, ...prev]);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleSaveProduct = (product: Product) => {
    setProducts((prev) => {
      const index = prev.findIndex((p) => p.id === product.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = product;
        return updated;
      }
      return [...prev, product];
    });

    if (product.sku) {
      const sku = product.sku.trim();
      setPricingItems((prevItems) => {
        const skuExists = prevItems.some(
          (i) => i.sku.toLowerCase() === sku.toLowerCase(),
        );

        if (skuExists) {
          if (product.image) {
            return prevItems.map((item) => {
              if (item.sku.toLowerCase() === sku.toLowerCase()) {
                return { ...item, image: product.image };
              }
              return item;
            });
          }
          return prevItems;
        } else {
          const timestamp = Date.now();
          const newPricingItems: PricingItem[] = SHOPS.map((shop) => ({
            id: `item-${timestamp}-${shop.id}`,
            sku: sku,
            shopId: shop.id,
            productName: product.name,
            image: product.image || "",
            brand: "",
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
            total: 0,
          }));
          return [...prevItems, ...newPricingItems];
        }
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (!id) {
      alert("Error: ID missing");
      return;
    }
    openConfirm(
      "Delete Product?",
      "Remove this product from the Top 10 list?",
      () => {
        setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
        closeConfirm();
      },
    );
  };

  const handleUpdatePricing = (updatedItems: PricingItem[]) => {
    setPricingItems(updatedItems);
  };

  const handleRequestDeletePricing = (id: string) => {
    const itemToDelete = pricingItems.find((i) => i.id === id);
    if (!itemToDelete) return;

    // Extract the creation group timestamp from id if it matches 'item-{timestamp}-{shopId}'
    const idParts = id.split("-");
    const isGroupedItem = idParts.length >= 3 && idParts[0] === "item";
    const timestampGroup = isGroupedItem ? idParts[1] : null;

    openConfirm(
      "Delete Inventory?",
      `Delete this item (SKU: ${itemToDelete.sku}) from ALL shops?`,
      () => {
        setPricingItems((prev) =>
          prev.filter((i) => {
            if (timestampGroup) {
              return !i.id.startsWith(`item-${timestampGroup}-`);
            }
            // Fallback for items that might not have the grouped ID structure
            return i.id !== id;
          }),
        );
        closeConfirm();
      },
    );
  };

  const handleUpdateCompetitors = (updated: CompetitorItem[]) => {
    setCompetitors(updated);
  };

  const handleRequestDeleteCompetitor = (id: string) => {
    openConfirm(
      "Stop Tracking?",
      "Remove this competitor from your list?",
      () => {
        setCompetitors((prev) => prev.filter((c) => c.id !== id));
        closeConfirm();
      },
    );
  };

  const handleAddVideoLog = (logData: Omit<VideoLog, "id"> | VideoLog) => {
    setVideoLogs((prev) => {
      let updatedLogs;
      if ("id" in logData) {
        updatedLogs = prev.map((v) => (v.id === logData.id ? logData : v));
      } else {
        const newLog = { ...logData, id: `vid-${Date.now()}` };
        updatedLogs = [...prev, newLog];
      }
      return updatedLogs;
    });

    const taskCompleted = taskCompletions.some(
      (t) =>
        t.taskId === "t4" &&
        t.shopId === logData.shopId &&
        t.date === logData.date &&
        t.completed,
    );

    if (!taskCompleted) {
      setTaskCompletions((prev) => [
        ...prev,
        {
          taskId: "t4",
          shopId: logData.shopId,
          date: logData.date,
          completed: true,
        },
      ]);
    }
  };

  const handleDeleteVideoLog = (id: string) => {
    openConfirm(
      "Delete Log?",
      "Are you sure you want to delete this video log?",
      () => {
        const logToDelete = videoLogs.find((v) => v.id === id);
        setVideoLogs((prev) => prev.filter((v) => v.id !== id));

        if (logToDelete) {
          const remainingVideos = videoLogs.filter(
            (v) =>
              v.shopId === logToDelete.shopId &&
              v.date === logToDelete.date &&
              v.id !== id,
          );

          if (remainingVideos.length === 0) {
            setTaskCompletions((prev) =>
              prev.filter(
                (t) =>
                  !(
                    t.taskId === "t4" &&
                    t.shopId === logToDelete.shopId &&
                    t.date === logToDelete.date
                  ),
              ),
            );
          }
        }
        closeConfirm();
      },
    );
  };

  // (handleExportData moved up for keyboard shortcut access)

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
        if (typeof content !== "string") return;

        const data = JSON.parse(content);

        if (!data.salesData && !data.products && !data.pricingItems) {
          alert("Invalid backup file format or empty data.");
          return;
        }

        openConfirm(
          "Restore Backup?",
          "This will overwrite your current data with the backup. Continue?",
          () => {
            if (data.salesData) setSalesData(data.salesData);
            if (data.tasks) setTasks(data.tasks);
            if (data.taskCompletions) setTaskCompletions(data.taskCompletions);
            if (data.workLogs) setWorkLogs(data.workLogs);
            if (data.products) setProducts(sanitizeProducts(data.products));
            if (data.pricingItems) setPricingItems(data.pricingItems);
            if (data.competitors) setCompetitors(data.competitors);
            if (data.videoLogs) setVideoLogs(data.videoLogs);

            closeConfirm();
            alert("Backup restored successfully.");
          },
        );
      } catch (error) {
        console.error("Error reading backup file:", error);
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: true,
        }) as any[][];

        const tempRecords: Omit<SalesRecord, "id" | "shopId">[] = [];
        let importCount = 0;
        let minDate = "";
        let maxDate = "";

        // Loop through ALL rows (0-based) and let date validation filter out headers/summaries
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const colDate = row[0];
          let isoDate = "";

          if (typeof colDate === "number") {
            const dateObj = XLSX.SSF.parse_date_code(colDate);
            if (dateObj) {
              const p = (n: number) => n.toString().padStart(2, "0");
              isoDate = `${dateObj.y}-${p(dateObj.m)}-${p(dateObj.d)}`;
            }
          } else if (typeof colDate === "string") {
            if (colDate.length > 10 && colDate.split("-").length > 3) continue;
            if (/^\d{2}-\d{2}-\d{4}$/.test(colDate)) {
              const [day, month, year] = colDate.split("-");
              isoDate = `${year}-${month}-${day}`;
            }
          }

          if (!isoDate) continue;

          if (!minDate || isoDate < minDate) minDate = isoDate;
          if (!maxDate || isoDate > maxDate) maxDate = isoDate;

          const parseShopeeNumber = (val: any): number => {
            if (typeof val === "number") return val;
            if (typeof val === "string") {
              let clean = val.trim().replace(/[Rp\s%IDR]/g, "");
              if (clean.includes(".") && clean.includes(",")) {
                clean = clean.replace(/\./g, "").replace(/,/g, ".");
              } else if (clean.includes(".")) {
                clean = clean.replace(/\./g, "");
              } else if (clean.includes(",")) {
                clean = clean.replace(/,/g, ".");
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
          if (typeof rawConv === "number") {
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
            lateShipmentRate: undefined,
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
            fileName: file.name,
          });
          setIsImportModalOpen(true);
        } else {
          toast.warning(
            "No valid daily data found. Please check if the Excel matches the expected format.",
          );
        }
      } catch (error) {
        console.error("Excel Import Error:", error);
        toast.error("Error parsing Excel file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (excelInputRef.current) excelInputRef.current.value = "";
  };

  const handleConfirmImport = (targetShopId: ShopID) => {
    // Convert pending records to full SalesRecords with ID and ShopID
    const newRecords: SalesRecord[] = pendingImportData.map((r) => ({
      ...r,
      shopId: targetShopId,
      id: `${r.date}-${targetShopId}-${Date.now()}-${Math.random()}`,
    }));

    setSalesData((prev) => {
      // Remove existing records for the same dates and shop to avoid duplicates
      const filtered = prev.filter(
        (p) =>
          !newRecords.some((n) => n.date === p.date && n.shopId === p.shopId),
      );
      const updated = [...filtered, ...newRecords];
      return updated;
    });

    if (importSummary.minDate && importSummary.maxDate) {
      setDateRange({
        start: importSummary.minDate,
        end: importSummary.maxDate,
      });
    }

    const targetShopName = SHOPS.find((s) => s.id === targetShopId)?.name;
    toast.success(`Imported ${importSummary.count} rows for ${targetShopName}`);

    setIsImportModalOpen(false);
    setPendingImportData([]);
  };

  // Helper for theme toggling
  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Window Management Functions
  const handleOpenWindow = (viewId: ViewType) => {
    setWindowStates((prev) => ({
      ...prev,
      [viewId]: {
        ...prev[viewId],
        isOpen: true,
        isMinimized: false,
        zIndex: maxZIndex + 1,
      },
    }));
    setMaxZIndex((prev) => prev + 1);
  };

  const handleCloseWindow = (viewId: ViewType) => {
    setWindowStates((prev) => ({
      ...prev,
      [viewId]: { ...prev[viewId], isOpen: false },
    }));
  };

  const handleMinimizeWindow = (viewId: ViewType) => {
    setWindowStates((prev) => ({
      ...prev,
      [viewId]: { ...prev[viewId], isMinimized: !prev[viewId].isMinimized },
    }));
  };

  const handleWindowPositionChange = (
    viewId: ViewType,
    position: { x: number; y: number },
  ) => {
    setWindowStates((prev) => ({
      ...prev,
      [viewId]: { ...prev[viewId], position },
    }));
  };

  const handleWindowFocus = (viewId: ViewType) => {
    setWindowStates((prev) => ({
      ...prev,
      [viewId]: { ...prev[viewId], zIndex: maxZIndex + 1 },
    }));
    setMaxZIndex((prev) => prev + 1);
  };

  const handleWindowSizeChange = (
    viewId: ViewType,
    size: { width: number; height: number },
  ) => {
    setWindowStates((prev) => ({
      ...prev,
      [viewId]: { ...prev[viewId], size },
    }));
  };

  return (
    <MainLayout
      currentView={view}
      setView={setView}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      onOpenWindow={handleOpenWindow}
      actions={
        <>
          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors tooltip"
            data-tooltip="Search (Ctrl+K)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* AI Assistant Button */}
          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="p-2 text-slate-500 hover:text-shopee-orange hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full transition-colors tooltip"
            data-tooltip="AI Assistant"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </button>

          {/* Summary Report Button */}
          <button
            onClick={() => setIsSummaryReportOpen(true)}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors tooltip"
            data-tooltip="Summary Report"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>

          {/* PocketBase Sync Button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`p-2 rounded-full transition-colors tooltip relative ${
              pocketbase.isAuthenticated
                ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                : "text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            }`}
            data-tooltip={
              pocketbase.isAuthenticated
                ? `Synced • ${pocketbase.user?.email} • Click to sync or logout`
                : "Login to PocketBase"
            }
          >
            {pocketbase.isSyncing ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
            )}
            {pocketbase.isAuthenticated && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </button>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div className="flex gap-1">
            <button
              onClick={handleImportExcelClick}
              className="p-2 text-slate-500 hover:text-green-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center gap-2 tooltip"
              data-tooltip="Import Excel"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-xs font-bold hidden sm:inline">
                Import Sheet
              </span>
            </button>
            <button
              onClick={handleExportData}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors tooltip"
              data-tooltip="Export Backup"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
            <button
              onClick={handleImportClick}
              className="p-2 text-slate-500 hover:text-orange-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors tooltip"
              data-tooltip="Import Backup"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </button>
            <button
              onClick={() => setIsRecoveryPanelOpen(true)}
              className="p-2 text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors tooltip"
              data-tooltip="Data Recovery"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            </button>
          </div>
        </>
      }
    >
      {view === "analytics" && (
        <AnalyticsView
          data={salesData}
          products={products}
          goals={goals}
          onAddDataClick={() => setIsModalOpen(true)}
          onManageProducts={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          onDeleteProduct={handleDeleteProduct}
          onDeleteSalesRecord={handleDeleteSalesData}
          onAddGoal={handleAddGoal}
          onDeleteGoal={handleDeleteGoal}
          dateRange={dateRange}
          setDateRange={setDateRange}
          pricingItems={pricingItems}
          onEditProduct={handleEditProduct}
        />
      )}

      {view === "tasks" && (
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

      {view === "pricing" && (
        <PricingView
          items={pricingItems}
          onUpdateItems={handleUpdatePricing}
          onRequestDelete={handleRequestDeletePricing}
        />
      )}

      {view === "competitors" && (
        <CompetitorView
          competitors={competitors}
          onUpdateCompetitors={handleUpdateCompetitors}
          pricingItems={pricingItems}
          onRequestDelete={handleRequestDeleteCompetitor}
        />
      )}

      {view === "videos" && (
        <VideoTrackerView
          videoLogs={videoLogs}
          pricingItems={pricingItems}
          onAddLog={(shopId) => {
            setVideoModalDefaultShop(shopId);
            setEditingVideoLog(null);
            setIsVideoModalOpen(true);
          }}
          onEditLog={(log) => {
            setEditingVideoLog(log);
            setIsVideoModalOpen(true);
          }}
          onDeleteLog={handleDeleteVideoLog}
        />
      )}

      {view === "campaigns" && <CampaignGeneratorView />}

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

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />

      {/* Data Recovery Panel */}
      <DataRecoveryPanel
        isOpen={isRecoveryPanelOpen}
        onClose={() => setIsRecoveryPanelOpen(false)}
      />

      {/* AI Assistant */}
      <AIAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        salesData={salesData}
        pricingItems={pricingItems}
      />

      {/* Global Search */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        salesData={salesData}
        pricingItems={pricingItems}
        videoLogs={videoLogs}
        onNavigate={(view, filter) => {
          setView(view as any);
          setIsSearchOpen(false);
        }}
      />

      {/* Summary Report */}
      <SummaryReport
        isOpen={isSummaryReportOpen}
        onClose={() => setIsSummaryReportOpen(false)}
        salesData={salesData}
        videoLogs={videoLogs}
        taskCompletions={taskCompletions}
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
        onSubmit={handleSaveProduct}
        pricingItems={pricingItems}
        initialData={editingProduct}
      />

      <VideoLogModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSubmit={handleAddVideoLog}
        pricingItems={pricingItems}
        initialData={editingVideoLog}
        existingLogs={videoLogs}
        defaultShopId={videoModalDefaultShop}
      />

      {/* PocketBase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={pocketbase.login}
        onRegister={pocketbase.register}
        isAuthenticated={pocketbase.isAuthenticated}
        user={pocketbase.user}
        onLogout={pocketbase.logout}
        onSync={() => {
          pocketbase.pushData({
            salesData,
            pricingItems,
            videoLogs,
            tasks: INITIAL_TASKS,
            taskCompletions,
            workLogs,
            competitors,
            products,
            goals,
            windowStates,
          });
        }}
        isSyncing={pocketbase.isSyncing}
      />

      {/* Floating Windows */}
      <Window
        id="competitors"
        title="Competitor Tracking"
        isOpen={windowStates.competitors.isOpen}
        isMinimized={windowStates.competitors.isMinimized}
        position={windowStates.competitors.position}
        size={windowStates.competitors.size}
        zIndex={windowStates.competitors.zIndex}
        onClose={() => handleCloseWindow("competitors")}
        onMinimize={() => handleMinimizeWindow("competitors")}
        onPositionChange={(pos) =>
          handleWindowPositionChange("competitors", pos)
        }
        onSizeChange={(size) => handleWindowSizeChange("competitors", size)}
        onFocus={() => handleWindowFocus("competitors")}
      >
        <CompetitorView
          competitors={competitors}
          onUpdateCompetitors={handleUpdateCompetitors}
          pricingItems={pricingItems}
          onRequestDelete={handleRequestDeleteCompetitor}
        />
      </Window>

      <Window
        id="pricing"
        title="Pricing Database"
        isOpen={windowStates.pricing.isOpen}
        isMinimized={windowStates.pricing.isMinimized}
        position={windowStates.pricing.position}
        size={windowStates.pricing.size}
        zIndex={windowStates.pricing.zIndex}
        onClose={() => handleCloseWindow("pricing")}
        onMinimize={() => handleMinimizeWindow("pricing")}
        onPositionChange={(pos) => handleWindowPositionChange("pricing", pos)}
        onSizeChange={(size) => handleWindowSizeChange("pricing", size)}
        onFocus={() => handleWindowFocus("pricing")}
      >
        <PricingView
          items={pricingItems}
          onUpdateItems={handleUpdatePricing}
          onRequestDelete={handleRequestDeletePricing}
        />
      </Window>
    </MainLayout>
  );
}

export default App;
