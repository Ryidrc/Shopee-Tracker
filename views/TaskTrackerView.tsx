
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskCompletion, SHOPS, CAMPAIGN_TASKS, WorkLog, PricingItem, SalesRecord } from '../types';
import { generateBroadcastMessage } from '../services/geminiService';

interface TaskTrackerViewProps {
  tasks: Task[];
  completions: TaskCompletion[];
  onToggleTask: (taskId: string, shopId: string, date: string, checked: boolean) => void;
  onAddTask: (task: Task) => void;
  onEditTask: (taskId: string, newText: string, newFrequency: 'daily' | 'weekly', newTime?: string) => void;
  onDeleteTask: (taskId: string) => void;
  workLogs?: WorkLog[];
  onUpdateWorkLog?: (log: WorkLog) => void;
  pricingItems?: PricingItem[];
  salesData?: SalesRecord[];
}

const BROADCAST_TYPES = [
    "Pengingat Produk dalam Keranjang",
    "Update Produk Terbaru",
    "Promosi untuk Pembeli",
    "Exclusive Broadcast for Specific Audience"
];

export const TaskTrackerView: React.FC<TaskTrackerViewProps> = ({ 
  tasks, completions, onToggleTask, onAddTask, onEditTask, onDeleteTask,
  workLogs = [], onUpdateWorkLog, pricingItems = [], salesData = []
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeShopId, setActiveShopId] = useState<string>(SHOPS[0].id);
  
  // Edit Mode State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingTime, setEditingTime] = useState('');
  
  // Add Task State
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Work Log State
  const [currentWorkLog, setCurrentWorkLog] = useState<WorkLog>({
    date: selectedDate,
    shopId: activeShopId as any,
    flashSalesCreated: 0,
    productsRenamed: 0,
    vouchersUpdated: 0,
    reviewsAudited: 0,
    competitorsChecked: 0
  });

  // Sync WorkLog state when date/shop changes
  useEffect(() => {
    const existing = workLogs.find(l => l.date === selectedDate && l.shopId === activeShopId);
    if (existing) {
        setCurrentWorkLog(existing);
    } else {
        setCurrentWorkLog({
            date: selectedDate,
            shopId: activeShopId as any,
            flashSalesCreated: 0,
            productsRenamed: 0,
            vouchersUpdated: 0,
            reviewsAudited: 0,
            competitorsChecked: 0
        });
    }
  }, [selectedDate, activeShopId, workLogs]);

  const handleLogChange = (field: keyof WorkLog, delta: number) => {
    if (!onUpdateWorkLog) return;
    const newVal = Math.max(0, (currentWorkLog[field] as number) + delta);
    const updated = { ...currentWorkLog, [field]: newVal };
    setCurrentWorkLog(updated);
    onUpdateWorkLog(updated);
  };

  // --- SMART DETECTORS ---
  const stagnantProducts = useMemo(() => {
    const shopItems = pricingItems.filter(i => i.shopId === activeShopId);
    return shopItems.filter(i => (i.rating === undefined || i.rating === 0) && i.stock > 0).slice(0, 5);
  }, [pricingItems, salesData, activeShopId]);

  const lowRatedProducts = useMemo(() => {
      return pricingItems.filter(i => i.shopId === activeShopId && (i.rating || 5) < 4.0);
  }, [pricingItems, activeShopId]);

  const [isCampaignMode, setIsCampaignMode] = useState(false);
  const activeDailyTasks = isCampaignMode ? CAMPAIGN_TASKS : tasks.filter(t => t.frequency === 'daily');
  
  // AI Broadcast
  const [broadcastType, setBroadcastType] = useState(BROADCAST_TYPES[0]);
  const [broadcastResult, setBroadcastResult] = useState('');
  const [isGeneratingBroadcast, setIsGeneratingBroadcast] = useState(false);

  const handleGenerateBroadcast = async () => {
    setIsGeneratingBroadcast(true);
    const result = await generateBroadcastMessage(broadcastType);
    setBroadcastResult(result);
    setIsGeneratingBroadcast(false);
  };

  const isTaskCompleted = (taskId: string) => {
    return completions.some(c => c.shopId === activeShopId && c.taskId === taskId && c.date === selectedDate && c.completed);
  };

  // --- TASK EDITING HANDLERS ---
  const startEditing = (task: Task) => {
      setEditingTaskId(task.id);
      setEditingText(task.text);
      setEditingTime(task.reminderTime || '');
  };

  const saveTaskEdit = (task: Task) => {
      if (editingText.trim()) {
          onEditTask(task.id, editingText, task.frequency, editingTime);
      }
      setEditingTaskId(null);
  };

  const handleAddNewTask = () => {
      if (!newTaskText.trim()) return;
      onAddTask({
          id: `custom-${Date.now()}`,
          text: newTaskText,
          frequency: 'daily',
          reminderTime: newTaskTime
      });
      setNewTaskText('');
      setNewTaskTime('');
      setIsAddingTask(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Productivity Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Productivity Hub</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Measure your daily impact.</p>
        </div>
        
        <div className="flex gap-4 items-center">
             <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-full">
                {SHOPS.map(shop => (
                    <button
                        key={shop.id}
                        onClick={() => setActiveShopId(shop.id)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${activeShopId === shop.id ? 'bg-white dark:bg-slate-600 shadow-sm text-shopee-orange' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        {shop.name}
                    </button>
                ))}
             </div>
             <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm text-slate-600 dark:text-slate-200 focus:ring-0"
             />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COL: INPUT LOG */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* Daily Impact Log (Numeric) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 relative">
                  <div className="flex justify-between items-start mb-6">
                      <h3 className="font-bold text-slate-800 dark:text-white">Daily Work Log</h3>
                      <div className="group relative">
                          <svg className="w-5 h-5 text-slate-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <div className="absolute right-0 w-48 p-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg mt-1">
                              Use the +/- buttons to manually count your actions today. This is for your personal record.
                          </div>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Item */}
                      {[
                        { key: 'flashSalesCreated', label: 'Flash Sales', sub: 'Campaigns', color: 'blue' },
                        { key: 'productsRenamed', label: 'Products Renamed', sub: 'SEO Optimization', color: 'green' },
                        { key: 'vouchersUpdated', label: 'Vouchers', sub: 'Budget Control', color: 'orange' },
                        { key: 'reviewsAudited', label: 'Reviews Checked', sub: 'Quality Control', color: 'purple' },
                      ].map((item: any) => (
                        <div key={item.key} className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl flex justify-between items-center transition-colors">
                          <div>
                              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</div>
                              <div className="text-xs text-slate-400">{item.sub}</div>
                          </div>
                          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-full px-2 py-1 shadow-sm border border-slate-100 dark:border-slate-700">
                              <button onClick={() => handleLogChange(item.key, -1)} className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center font-bold transition-colors">-</button>
                              <span className="font-bold text-lg w-6 text-center text-slate-800 dark:text-white select-none">{currentWorkLog[item.key as keyof WorkLog]}</span>
                              <button onClick={() => handleLogChange(item.key, 1)} className={`w-6 h-6 rounded-full text-${item.color}-500 hover:bg-${item.color}-50 dark:hover:bg-${item.color}-900/30 flex items-center justify-center font-bold transition-colors`}>+</button>
                          </div>
                        </div>
                      ))}
                  </div>
              </div>

               {/* Standard Tasks (Checkbox) */}
               <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-slate-800 dark:text-white">Routine Checklist</h3>
                       <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                           <button onClick={() => setIsCampaignMode(false)} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isCampaignMode ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}>Normal</button>
                           <button onClick={() => setIsCampaignMode(true)} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isCampaignMode ? 'bg-orange-100 text-orange-600 shadow' : 'text-slate-500'}`}>Campaign</button>
                       </div>
                   </div>
                   
                   <div className="space-y-2">
                       {activeDailyTasks.map(task => (
                           <div key={task.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group">
                               <label className="flex items-center gap-4 cursor-pointer flex-1">
                                   <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isTaskCompleted(task.id) ? 'bg-shopee-orange border-shopee-orange' : 'border-slate-300 dark:border-slate-600 group-hover:border-shopee-orange'}`}>
                                      {isTaskCompleted(task.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                   </div>
                                   <input 
                                      type="checkbox" 
                                      className="hidden"
                                      checked={isTaskCompleted(task.id)}
                                      onChange={(e) => onToggleTask(task.id, activeShopId, selectedDate, e.target.checked)}
                                   />
                                   {editingTaskId === task.id ? (
                                       <div className="flex-1 flex gap-2 items-center">
                                           <input 
                                              type="text" 
                                              value={editingText}
                                              onChange={(e) => setEditingText(e.target.value)}
                                              className="bg-white dark:bg-slate-900 border border-shopee-orange rounded px-2 py-1 text-sm text-slate-800 dark:text-white w-full focus:outline-none"
                                              autoFocus
                                           />
                                           <input 
                                              type="time" 
                                              value={editingTime}
                                              onChange={(e) => setEditingTime(e.target.value)}
                                              className="bg-white dark:bg-slate-900 border border-shopee-orange rounded px-2 py-1 text-sm text-slate-800 dark:text-white focus:outline-none"
                                           />
                                           <button onClick={() => saveTaskEdit(task)} className="bg-green-500 text-white p-1 rounded">
                                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                           </button>
                                       </div>
                                   ) : (
                                       <div className="flex items-center gap-2">
                                           <span className={`text-sm font-medium ${isTaskCompleted(task.id) ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                               {task.text}
                                           </span>
                                           {task.reminderTime && (
                                               <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
                                                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                   {task.reminderTime}
                                               </span>
                                           )}
                                       </div>
                                   )}
                               </label>
                               {!isCampaignMode && editingTaskId !== task.id && (
                                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button onClick={() => startEditing(task)} className="text-slate-400 hover:text-blue-500 p-1">
                                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                       </button>
                                       <button onClick={() => onDeleteTask(task.id)} className="text-slate-400 hover:text-red-500 p-1">
                                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                       </button>
                                   </div>
                               )}
                           </div>
                       ))}
                       
                       {!isCampaignMode && (
                           <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                               {isAddingTask ? (
                                   <div className="flex gap-2">
                                       <input 
                                          type="text" 
                                          value={newTaskText} 
                                          onChange={(e) => setNewTaskText(e.target.value)}
                                          placeholder="Enter new task..."
                                          className="flex-1 bg-slate-50 dark:bg-slate-700 border-none rounded-lg text-sm px-3 py-2 text-slate-800 dark:text-white focus:ring-1 focus:ring-shopee-orange"
                                          autoFocus
                                       />
                                       <input 
                                          type="time" 
                                          value={newTaskTime} 
                                          onChange={(e) => setNewTaskTime(e.target.value)}
                                          className="w-24 bg-slate-50 dark:bg-slate-700 border-none rounded-lg text-sm px-2 py-2 text-slate-800 dark:text-white focus:ring-1 focus:ring-shopee-orange"
                                       />
                                       <button onClick={handleAddNewTask} className="bg-shopee-orange text-white px-3 rounded-lg font-bold text-xs hover:bg-red-600">Save</button>
                                       <button onClick={() => setIsAddingTask(false)} className="text-slate-400 hover:text-slate-600 px-2">Cancel</button>
                                   </div>
                               ) : (
                                   <button 
                                      onClick={() => setIsAddingTask(true)}
                                      className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-shopee-orange transition-colors px-2 py-1"
                                   >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                      Add Task
                                   </button>
                               )}
                           </div>
                       )}
                   </div>
               </div>
          </div>

          {/* RIGHT COL: ACTION CENTER */}
          <div className="space-y-6">
              
              {/* Alerts */}
              {(stagnantProducts.length > 0 || lowRatedProducts.length > 0) && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
                   <h3 className="font-bold text-slate-800 dark:text-white mb-4">Attention Needed</h3>
                   
                   {stagnantProducts.length > 0 && (
                     <div className="mb-4">
                       <h4 className="text-xs font-bold uppercase text-orange-500 mb-2">Review / Rename Candidates</h4>
                       <ul className="space-y-2">
                          {stagnantProducts.map(p => (
                              <li key={p.id} className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg flex justify-between">
                                  <span className="truncate flex-1">{p.productName}</span>
                                  <span className="text-slate-400">No Ratings</span>
                              </li>
                          ))}
                       </ul>
                     </div>
                   )}

                   {lowRatedProducts.length > 0 && (
                     <div>
                       <h4 className="text-xs font-bold uppercase text-red-500 mb-2">Low Rating Alert</h4>
                       <ul className="space-y-2">
                          {lowRatedProducts.map(p => (
                              <li key={p.id} className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg flex justify-between">
                                  <span className="truncate flex-1">{p.productName}</span>
                                  <span className="font-bold text-red-500">{p.rating} ★</span>
                              </li>
                          ))}
                       </ul>
                     </div>
                   )}
                </div>
              )}

              {/* AI Broadcast Helper */}
              <div className="bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
                  <h4 className="font-bold mb-1">Broadcast Assistant</h4>
                  <p className="text-xs text-indigo-100 mb-4 opacity-80">Generate engaging blast messages instantly.</p>
                  
                  <div className="bg-white/10 p-1 rounded-lg mb-3">
                    <select 
                        value={broadcastType}
                        onChange={(e) => setBroadcastType(e.target.value)}
                        className="w-full bg-transparent border-none text-xs text-white p-2 focus:ring-0 cursor-pointer"
                    >
                        {BROADCAST_TYPES.map(t => <option key={t} value={t} className="text-slate-900">{t}</option>)}
                    </select>
                  </div>

                  <button 
                      onClick={handleGenerateBroadcast} 
                      disabled={isGeneratingBroadcast}
                      className="w-full bg-white text-indigo-600 text-xs font-bold py-2.5 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                      {isGeneratingBroadcast ? 'Generating...' : 'Generate Message'}
                  </button>
                  {broadcastResult && (
                      <div className="mt-4 bg-black/20 p-3 rounded-xl text-xs leading-relaxed cursor-pointer hover:bg-black/30 border border-white/10" onClick={() => {navigator.clipboard.writeText(broadcastResult); alert("Copied!")}}>
                          {broadcastResult}
                      </div>
                  )}
              </div>

          </div>
      </div>
    </div>
  );
};
