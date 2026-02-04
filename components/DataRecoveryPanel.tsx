
import React, { useState, useEffect } from 'react';

interface DataRecoveryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StorageStats {
  key: string;
  mainSize: number;
  backupSize: number;
  mainCount: number;
  backupCount: number;
  lastModified?: string;
}

const STORAGE_KEYS = [
  'shopee_sales_data',
  'shopee_tasks_def',
  'shopee_task_completions',
  'shopee_work_logs',
  'shopee_hero_products',
  'shopee_pricing_data',
  'shopee_competitors',
  'shopee_video_logs',
];

export const DataRecoveryPanel: React.FC<DataRecoveryProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<StorageStats[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = () => {
    const newStats: StorageStats[] = STORAGE_KEYS.map(key => {
      const main = localStorage.getItem(key);
      const backup = localStorage.getItem(`${key}_backup`);
      
      let mainCount = 0;
      let backupCount = 0;
      
      try {
        if (main) mainCount = JSON.parse(main).length || 0;
      } catch {}
      
      try {
        if (backup) backupCount = JSON.parse(backup).length || 0;
      } catch {}
      
      return {
        key,
        mainSize: main?.length || 0,
        backupSize: backup?.length || 0,
        mainCount,
        backupCount,
      };
    });
    
    setStats(newStats);
  };

  const restoreFromBackup = (key: string) => {
    try {
      const backup = localStorage.getItem(`${key}_backup`);
      if (backup) {
        localStorage.setItem(key, backup);
        setMessage({ type: 'success', text: `Restored ${key} from backup. Please refresh the page.` });
        loadStats();
      } else {
        setMessage({ type: 'error', text: `No backup found for ${key}` });
      }
    } catch (e) {
      setMessage({ type: 'error', text: `Failed to restore: ${e}` });
    }
  };

  const exportAllData = () => {
    const allData: Record<string, any> = {
      exportDate: new Date().toISOString(),
      version: 1,
      data: {},
    };
    
    STORAGE_KEYS.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          allData.data[key] = JSON.parse(data);
        } catch {
          allData.data[key] = data;
        }
      }
    });
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Backup exported successfully!' });
  };

  const clearAllBackups = () => {
    if (confirm('Are you sure you want to clear all backups? This cannot be undone.')) {
      STORAGE_KEYS.forEach(key => {
        localStorage.removeItem(`${key}_backup`);
      });
      loadStats();
      setMessage({ type: 'success', text: 'All backups cleared.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Data Recovery Panel</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 font-medium">Data Store</th>
                <th className="py-2 font-medium text-right">Main</th>
                <th className="py-2 font-medium text-right">Backup</th>
                <th className="py-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {stats.map(stat => (
                <tr key={stat.key} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {stat.key.replace('shopee_', '')}
                  </td>
                  <td className="py-3 text-right">
                    <span className={`font-bold ${stat.mainCount === 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {stat.mainCount} items
                    </span>
                    <span className="text-slate-400 text-xs ml-1">
                      ({(stat.mainSize / 1024).toFixed(1)}KB)
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={`font-bold ${stat.backupCount === 0 ? 'text-slate-400' : 'text-blue-600'}`}>
                      {stat.backupCount} items
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {stat.backupCount > stat.mainCount ? (
                      <button
                        onClick={() => restoreFromBackup(stat.key)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                      >
                        Restore
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-between">
          <div className="flex gap-3">
            <button
              onClick={exportAllData}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
            >
              Export Full Backup
            </button>
            <button
              onClick={clearAllBackups}
              className="px-4 py-2 text-red-500 border border-red-200 rounded-lg font-medium hover:bg-red-50 transition-colors text-sm"
            >
              Clear Backups
            </button>
          </div>
          <button
            onClick={loadStats}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataRecoveryPanel;
