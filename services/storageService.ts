/**
 * StorageService - Robust data persistence layer
 * 
 * Uses IndexedDB for large datasets (sales, pricing, videos) and localStorage for settings.
 * Features:
 * - Version-controlled data migrations
 * - Automatic backup/recovery
 * - Debounced writes to prevent performance issues
 * - Corruption detection and recovery
 */

const DB_NAME = 'SalesTrackerDB';
const DB_VERSION = 1;

// Store configurations
const STORES = {
  salesData: { keyPath: 'id' },
  pricingItems: { keyPath: 'id' },
  videoLogs: { keyPath: 'id' },
  tasks: { keyPath: 'id' },
  taskCompletions: { keyPath: null, autoIncrement: true },
  workLogs: { keyPath: null, autoIncrement: true },
  competitors: { keyPath: 'id' },
  products: { keyPath: 'id' },
  settings: { keyPath: 'key' },
};

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('📦 IndexedDB initialized successfully');
      resolve(dbInstance);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores
      Object.entries(STORES).forEach(([name, config]) => {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, config);
          console.log(`Created store: ${name}`);
          
          // Add indexes for common queries
          if (name === 'salesData') {
            store.createIndex('by_date', 'date', { unique: false });
            store.createIndex('by_shop', 'shopId', { unique: false });
            store.createIndex('by_date_shop', ['date', 'shopId'], { unique: true });
          }
          if (name === 'pricingItems') {
            store.createIndex('by_shop', 'shopId', { unique: false });
            store.createIndex('by_sku', 'sku', { unique: false });
          }
          if (name === 'videoLogs') {
            store.createIndex('by_shop', 'shopId', { unique: false });
            store.createIndex('by_date', 'date', { unique: false });
          }
          if (name === 'taskCompletions') {
            store.createIndex('by_task_shop_date', ['taskId', 'shopId', 'date'], { unique: true });
          }
          if (name === 'workLogs') {
            store.createIndex('by_shop_date', ['shopId', 'date'], { unique: true });
          }
        }
      });
    };
  });
  
  return dbPromise;
};

// Generic CRUD operations
export const storageService = {
  // Get all items from a store
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },
  
  // Get a single item by key
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  // Put (upsert) an item
  async put<T>(storeName: string, item: T): Promise<IDBValidKey> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  // Put multiple items in a single transaction
  async putAll<T>(storeName: string, items: T[]): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      items.forEach(item => store.put(item));
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // Delete an item
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  // Clear all items in a store
  async clear(storeName: string): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  // Replace all items in a store (clear + putAll)
  async replaceAll<T>(storeName: string, items: T[]): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Clear first
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        // Then add all items
        items.forEach(item => store.put(item));
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },
  
  // Count items in a store
  async count(storeName: string): Promise<number> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
};

// Migration from localStorage to IndexedDB
export const migrateFromLocalStorage = async (): Promise<boolean> => {
  const migrationKey = 'indexeddb_migration_complete';
  
  // Check if already migrated
  if (localStorage.getItem(migrationKey) === 'true') {
    return false;
  }
  
  console.log('🔄 Starting migration from localStorage to IndexedDB...');
  
  const migrations = [
    { localKey: 'shopee_sales_data', store: 'salesData' },
    { localKey: 'shopee_pricing_data', store: 'pricingItems' },
    { localKey: 'shopee_video_logs', store: 'videoLogs' },
    { localKey: 'shopee_tasks_def', store: 'tasks' },
    { localKey: 'shopee_task_completions', store: 'taskCompletions' },
    { localKey: 'shopee_work_logs', store: 'workLogs' },
    { localKey: 'shopee_competitors', store: 'competitors' },
    { localKey: 'shopee_hero_products', store: 'products' },
  ];
  
  let migratedCount = 0;
  
  for (const { localKey, store } of migrations) {
    try {
      // Try main key first, then backup
      let data = localStorage.getItem(localKey);
      if (!data) {
        data = localStorage.getItem(`${localKey}_backup`);
      }
      
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await storageService.replaceAll(store, parsed);
          console.log(`  ✅ Migrated ${parsed.length} items from ${localKey} to ${store}`);
          migratedCount++;
        }
      }
    } catch (e) {
      console.error(`  ❌ Failed to migrate ${localKey}:`, e);
    }
  }
  
  if (migratedCount > 0) {
    localStorage.setItem(migrationKey, 'true');
    console.log(`✅ Migration complete! Migrated ${migratedCount} stores.`);
  }
  
  return migratedCount > 0;
};

// Backup all data to a JSON file
export const exportFullBackup = async (): Promise<object> => {
  const backup: Record<string, any> = {
    version: DB_VERSION,
    exportDate: new Date().toISOString(),
    data: {},
  };
  
  for (const storeName of Object.keys(STORES)) {
    try {
      backup.data[storeName] = await storageService.getAll(storeName);
    } catch (e) {
      console.error(`Error exporting ${storeName}:`, e);
      backup.data[storeName] = [];
    }
  }
  
  return backup;
};

// Import data from a backup file
export const importFullBackup = async (backup: any): Promise<{ success: boolean; counts: Record<string, number> }> => {
  const counts: Record<string, number> = {};
  
  if (!backup.data) {
    throw new Error('Invalid backup format');
  }
  
  for (const [storeName, items] of Object.entries(backup.data)) {
    if (Array.isArray(items) && items.length > 0) {
      try {
        await storageService.replaceAll(storeName, items);
        counts[storeName] = items.length;
      } catch (e) {
        console.error(`Error importing ${storeName}:`, e);
        counts[storeName] = 0;
      }
    }
  }
  
  return { success: true, counts };
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Create a debounced save function for a store
export const createDebouncedSaver = <T>(storeName: string, waitMs: number = 500) => {
  return debounce(async (items: T[]) => {
    try {
      await storageService.replaceAll(storeName, items);
    } catch (e) {
      console.error(`Error saving to ${storeName}:`, e);
    }
  }, waitMs);
};

export default storageService;
