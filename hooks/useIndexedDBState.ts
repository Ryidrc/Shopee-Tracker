/**
 * useIndexedDBState - React hook for IndexedDB-backed state
 * 
 * Features:
 * - Async loading with loading state
 * - Debounced saves to prevent performance issues
 * - Optimistic updates for immediate UI feedback
 * - Automatic recovery from localStorage if IndexedDB is empty
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { storageService, createDebouncedSaver, migrateFromLocalStorage } from '../services/storageService';

interface UseIndexedDBStateOptions<T> {
  /** Store name in IndexedDB */
  storeName: string;
  /** Default value if store is empty */
  defaultValue: T[];
  /** Legacy localStorage key to migrate from */
  legacyLocalStorageKey?: string;
  /** Debounce delay for saves (ms) */
  saveDelay?: number;
  /** Function to sanitize/transform loaded data */
  sanitizer?: (data: any[]) => T[];
}

interface UseIndexedDBStateResult<T> {
  data: T[];
  setData: (value: T[] | ((prev: T[]) => T[])) => void;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  addItem: (item: T) => void;
  updateItem: (id: string, updates: Partial<T>) => void;
  deleteItem: (id: string) => void;
}

export function useIndexedDBState<T extends { id: string }>({
  storeName,
  defaultValue,
  legacyLocalStorageKey,
  saveDelay = 500,
  sanitizer,
}: UseIndexedDBStateOptions<T>): UseIndexedDBStateResult<T> {
  const [data, setDataState] = useState<T[]>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Track if initial load is complete to prevent overwriting
  const isInitialized = useRef(false);
  const pendingSave = useRef<T[] | null>(null);
  
  // Create debounced save function
  const debouncedSave = useRef(createDebouncedSaver<T>(storeName, saveDelay));

  // Load data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // First, attempt migration from localStorage if needed
      await migrateFromLocalStorage();
      
      // Then load from IndexedDB
      let loadedData = await storageService.getAll<T>(storeName);
      
      // If IndexedDB is empty but we have legacy localStorage data, try to recover
      if (loadedData.length === 0 && legacyLocalStorageKey) {
        const legacyData = localStorage.getItem(legacyLocalStorageKey);
        const legacyBackup = localStorage.getItem(`${legacyLocalStorageKey}_backup`);
        const dataStr = legacyData || legacyBackup;
        
        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log(`📦 Recovered ${parsed.length} items from localStorage for ${storeName}`);
              loadedData = sanitizer ? sanitizer(parsed) : parsed;
              // Save recovered data to IndexedDB
              await storageService.replaceAll(storeName, loadedData);
            }
          } catch (e) {
            console.error('Failed to parse legacy localStorage data:', e);
          }
        }
      }
      
      // Apply sanitizer if provided
      const finalData = sanitizer ? sanitizer(loadedData) : loadedData;
      
      setDataState(finalData.length > 0 ? finalData : defaultValue);
      isInitialized.current = true;
      setError(null);
    } catch (e) {
      console.error(`Error loading ${storeName}:`, e);
      setError(e instanceof Error ? e : new Error(String(e)));
      // Fall back to default value
      setDataState(defaultValue);
      isInitialized.current = true;
    } finally {
      setIsLoading(false);
    }
  }, [storeName, legacyLocalStorageKey, defaultValue, sanitizer]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save data when it changes (but only after initial load)
  useEffect(() => {
    if (!isInitialized.current) {
      return;
    }
    
    // Don't save if data is empty and we had data before (prevents accidental wipes)
    if (data.length === 0 && pendingSave.current && pendingSave.current.length > 0) {
      console.warn(`⚠️ Prevented saving empty ${storeName} (had ${pendingSave.current.length} items)`);
      return;
    }
    
    pendingSave.current = data;
    debouncedSave.current(data);
    
    // Also save to localStorage as backup
    if (legacyLocalStorageKey) {
      try {
        localStorage.setItem(legacyLocalStorageKey, JSON.stringify(data));
        if (data.length > 0) {
          localStorage.setItem(`${legacyLocalStorageKey}_backup`, JSON.stringify(data));
        }
      } catch (e) {
        // localStorage might be full, that's OK since we have IndexedDB
      }
    }
  }, [data, storeName, legacyLocalStorageKey]);

  // Wrapper for setData that ensures we don't lose data
  const setData = useCallback((newData: T[] | ((prev: T[]) => T[])) => {
    setDataState((prevData) => {
      const nextData = typeof newData === 'function' ? (newData as (prev: T[]) => T[])(prevData) : newData;
      return nextData;
    });
  }, []);

  // Utility functions for common operations
  const addItem = useCallback((item: T) => {
    setData(prev => [...prev, item]);
  }, [setData]);

  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, [setData]);

  const deleteItem = useCallback((id: string) => {
    setData(prev => prev.filter(item => item.id !== id));
  }, [setData]);

  return {
    data,
    setData,
    isLoading,
    error,
    refresh: loadData,
    addItem,
    updateItem,
    deleteItem,
  };
}

// Simpler hook for settings/small data that can stay in localStorage
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setIsLoading(false);
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(`Error loading ${key}:`, e);
    }
    setIsLoading(false);
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
    }
  }, [key, state]);

  return [state, setState, isLoading];
}

export default useIndexedDBState;
