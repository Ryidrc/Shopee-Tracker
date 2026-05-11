import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Shop } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shops: Shop[];
  onUpdateShops: (shops: Shop[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, shops, onUpdateShops
}) => {
  const [newShopName, setNewShopName] = useState('');
  const [newShopColor, setNewShopColor] = useState('#3B82F6');
  const [isMigrating, setIsMigrating] = useState(false);

  if (!isOpen) return null;

  const handleAddShop = () => {
    if (!newShopName.trim()) return;
    const newShop: Shop = {
      id: `shop-${Date.now()}`,
      name: newShopName.trim(),
      color: newShopColor
    };
    onUpdateShops([...shops, newShop]);
    setNewShopName('');
  };

  const handleDeleteShop = (id: string) => {
    if (confirm("Are you sure you want to delete this shop? Data associated might be affected.")) {
      onUpdateShops(shops.filter(s => s.id !== id));
    }
  };

  const handleMigrateData = async () => {
    if (!confirm("This will copy your local data to the cloud. Proceed?")) return;
    setIsMigrating(true);
    
    const keys = [
      "shopee_shops", "shopee_team_members", "shopee_team_reports", 
      "shopee_team_tasks", "shopee_team_task_completions", "shopee_team_issues", 
      "shopee_team_projects", "shopee_sales_data", "shopee_tasks_def", 
      "shopee_task_completions", "shopee_goals", "shopee_work_logs", 
      "shopee_hero_products", "shopee_pricing_data", "shopee_competitors", 
      "shopee_video_logs"
    ];

    try {
      for (const key of keys) {
        const localData = localStorage.getItem(key);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            await setDoc(doc(db, "appData", key), { value: parsed });
          } catch (e) {
            console.error(`Error migrating ${key}`, e);
          }
        }
      }
      alert("Data migration to cloud completed successfully!");
    } catch (error) {
      console.error("Migration failed:", error);
      alert("Migration failed. Check console for details.");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <h3 className="text-md font-medium mb-4 dark:text-slate-200">Manage Shops</h3>
          <div className="space-y-3 mb-6">
            {shops.map(shop => (
              <div key={shop.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: shop.color }}></div>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{shop.name}</span>
                </div>
                <button onClick={() => handleDeleteShop(shop.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t pt-4 dark:border-slate-800">
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Add New Shop</h4>
            <input 
              type="text" 
              placeholder="Shop Name" 
              className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={newShopName}
              onChange={e => setNewShopName(e.target.value)}
            />
            <div className="flex gap-2 items-center">
              <input 
                type="color" 
                value={newShopColor}
                onChange={e => setNewShopColor(e.target.value)}
                className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
              />
              <button onClick={handleAddShop} className="flex-1 bg-shopee-orange text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-orange-600 transition">
                <Plus size={16} /> Add Shop
              </button>
            </div>
          </div>
          
          <div className="mt-8 border-t pt-4 dark:border-slate-800">
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Data Migration</h4>
            <p className="text-xs text-slate-500 mb-3">Copy your existing local data to the cloud.</p>
            <button 
              onClick={handleMigrateData} 
              disabled={isMigrating}
              className="w-full bg-slate-800 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-slate-700 transition disabled:opacity-50"
            >
              {isMigrating ? "Migrating..." : "Migrate Local Data to Cloud"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
