import { useState, useEffect } from 'react';
import { authService, syncService, SalesTrackerData } from '../services/pocketbaseService';

export const usePocketBase = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Try to restore auth on mount
    const restore = async () => {
      const restored = await authService.restoreAuth();
      if (restored) {
        setIsAuthenticated(true);
        setUser(authService.getCurrentUser());
      }
    };
    restore();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success) {
      setIsAuthenticated(true);
      setUser(result.user);
    }
    return result;
  };

  const register = async (email: string, password: string) => {
    const result = await authService.register(email, password);
    if (result.success) {
      setIsAuthenticated(true);
      setUser(result.user);
    }
    return result;
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const syncData = async (localData: Partial<SalesTrackerData>) => {
    setIsSyncing(true);
    try {
      const result = await syncService.fullSync(localData);
      setLastSyncTime(new Date());
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  const pushData = async (data: Partial<SalesTrackerData>) => {
    setIsSyncing(true);
    try {
      await syncService.pushData(data);
      setLastSyncTime(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  const pullData = async () => {
    setIsSyncing(true);
    try {
      const data = await syncService.pullData();
      setLastSyncTime(new Date());
      return data;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isAuthenticated,
    user,
    isSyncing,
    lastSyncTime,
    login,
    register,
    logout,
    syncData,
    pushData,
    pullData,
  };
};
