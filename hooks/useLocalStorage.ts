import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

/**
 * Custom hook for persistent state with localStorage
 * 
 * Features:
 * - Automatic backup creation
 * - Protection against data loss
 * - Debounced writes
 * - Type-safe with generics
 * 
 * @param key - localStorage key
 * @param defaultValue - default value if no saved data exists
 * @param sanitizer - optional function to sanitize loaded data
 * @returns [state, setState, isLoading]
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  sanitizer?: (val: unknown) => T
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);
  const previousValue = useRef<T | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<T>(() => {
    try {
      // Try main key first
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        const result = sanitizer ? sanitizer(parsed) : (parsed as T);
        previousValue.current = result;
        return result;
      }

      // Try backup if main key fails or is missing
      const backup = localStorage.getItem(`${key}_backup`);
      if (backup) {
        console.warn(`🔄 Recovered ${key} from backup`);
        const parsedBackup = JSON.parse(backup);
        const result = sanitizer ? sanitizer(parsedBackup) : (parsedBackup as T);
        previousValue.current = result;
        // Restore main key from backup
        localStorage.setItem(key, backup);
        return result;
      }

      return defaultValue;
    } catch (e) {
      console.error(`Error loading state for ${key}`, e);
      return defaultValue;
    }
  });

  // Mark as initialized after first render
  useEffect(() => {
    isInitialized.current = true;
    setIsLoading(false);
  }, []);

  // Debounced save effect
  useEffect(() => {
    // Don't save during initial render
    if (!isInitialized.current) {
      return;
    }

    // Clear any pending save
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    // Debounce the save operation (500ms)
    saveTimeout.current = setTimeout(() => {
      try {
        const isArray = Array.isArray(state);
        const isEmpty = isArray
          ? (state as unknown[]).length === 0
          : typeof state === 'object' && state !== null
          ? Object.keys(state as object).length === 0
          : false;

        const hadData =
          previousValue.current !== null &&
          (Array.isArray(previousValue.current)
            ? (previousValue.current as unknown[]).length > 0
            : typeof previousValue.current === 'object' && previousValue.current !== null
            ? Object.keys(previousValue.current as object).length > 0
            : true);

        // PROTECTION: Don't save empty data if we previously had data
        // This prevents accidental data loss during HMR or bugs
        if (isEmpty && hadData) {
          console.warn(
            `⚠️ Protected ${key}: Prevented saving empty data (had ${
              Array.isArray(previousValue.current)
                ? (previousValue.current as unknown[]).length
                : 'some'
            } items)`
          );
          return;
        }

        // Save to main key
        const jsonData = JSON.stringify(state);
        localStorage.setItem(key, jsonData);

        // Save to backup if non-empty
        if (!isEmpty) {
          localStorage.setItem(`${key}_backup`, jsonData);
          previousValue.current = state;
        }
      } catch (e) {
        console.error(`Error saving state for ${key}`, e);
      }
    }, 500);

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [key, state]);

  return [state, setState, isLoading];
}

/**
 * Get storage usage information
 */
export function getStorageUsage(): { used: number; total: number; percentage: number } {
  let used = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }

  // Most browsers have 5-10MB limit, we'll use 5MB as conservative estimate
  const total = 5 * 1024 * 1024; // 5MB in bytes
  const percentage = (used / total) * 100;

  return { used, total, percentage };
}

/**
 * Clear all app data from localStorage
 */
export function clearAllStorage(prefix = 'shopee_'): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
}
