import React, { useState, useEffect } from 'react';
import { Task, TaskCompletion, SHOPS, CAMPAIGN_TASKS } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface TaskTrackerViewProps {
  tasks: Task[];
  completions: TaskCompletion[];
  onToggleTask: (taskId: string, shopId: string, date: string, checked: boolean) => void;
  onAddTask: (task: Task) => void;
  onEditTask: (taskId: string, newText: string, newFrequency: 'daily' | 'weekly') => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskTrackerView: React.FC<TaskTrackerViewProps> = ({ tasks, completions, onToggleTask, onAddTask, onEditTask, onDeleteTask }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskFreq, setNewTaskFreq] = useState<'daily'|'weekly'>('daily');

  // Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ text: '', frequency: 'daily' as 'daily' | 'weekly' });

  // Campaign Mode State
  const [isCampaignMode, setIsCampaignMode] = useState(false);
  const [campaignDate, setCampaignDate] = useState<string>('');
  const [daysToCampaign, setDaysToCampaign] = useState<number | null>(null);

  // Determine which list of tasks to show
  const activeDailyTasks = isCampaignMode ? CAMPAIGN_TASKS : tasks.filter(t => t.frequency === 'daily');
  const activeWeeklyTasks = tasks.filter(t => t.frequency === 'weekly');

  useEffect(() => {
    if (campaignDate) {
      const today = new Date();
      const target = new Date(campaignDate);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysToCampaign(diffDays);
    } else {
        setDaysToCampaign(null);
    }
  }, [campaignDate]);

  // Calculate Progress
  const calculateProgress = (shopId: string) => {
    const dailyCount = activeDailyTasks.length;
    const weeklyCount = activeWeeklyTasks.length;
    const totalTasks = dailyCount + weeklyCount;

    const completedCount = [...activeDailyTasks, ...activeWeeklyTasks].filter(task => {
      return completions.some(c => 
        c.shopId === shopId && 
        c.taskId === task.id && 
        c.date === selectedDate && 
        c.completed
      );
    }).length;

    return { completed: completedCount, total: totalTasks, percentage: totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0 };
  };

  const isTaskCompleted = (taskId: string, shopId: string) => {
    return completions.some(c => 
        c.shopId === shopId && 
        c.taskId === taskId && 
        c.date === selectedDate && 
        c.completed
    );
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask({
      id: `task-${Date.now()}`,
      text: newTaskText,
      frequency: newTaskFreq
    });
    setNewTaskText('');
    setShowAddForm(false);
  };

  const startEdit = (task: Task) => {
      setEditingTaskId(task.id);
      setEditForm({ text: task.text, frequency: task.frequency });
  };

  const saveEdit = () => {
      if (editingTaskId && editForm.text.trim()) {
          onEditTask(editingTaskId, editForm.text, editForm.frequency);
          setEditingTaskId(null);
      }
  };

  const cancelEdit = () => {
      setEditingTaskId(null);
  };

  const inputClass = "border-slate-300 dark:border-slate-600 rounded-md p-2 border shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Daily & Weekly Tasks</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track your optimization routine to improve sales.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
            {/* Campaign Mode Toggle Area */}
            <div className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${isCampaignMode ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-900' : 'bg-slate-50 border-slate-200 dark:bg-slate-700 dark:border-slate-600'}`}>
                <div className="flex items-center gap-2">
                    <div className="relative inline-block w-10 h-6 select-none transition duration-200 ease-in">
                        <input 
                            type="checkbox" 
                            name="toggle" 
                            id="campaign-toggle" 
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-4 checked:border-shopee-orange"
                            checked={isCampaignMode}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsCampaignMode(e.target.checked)}
                        />
                        <label htmlFor="campaign-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${isCampaignMode ? 'bg-shopee-orange' : 'bg-slate-300 dark:bg-slate-500'}`}></label>
                    </div>
                    <label htmlFor="campaign-toggle" className={`text-xs font-bold uppercase tracking-wider cursor-pointer ${isCampaignMode ? 'text-shopee-orange' : 'text-slate-500 dark:text-slate-300'}`}>
                        {isCampaignMode ? 'Campaign Mode ON' : 'Campaign Mode'}
                    </label>
                </div>

                {isCampaignMode && (
                    <input 
                        type="date" 
                        value={campaignDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCampaignDate(e.target.value)}
                        className="text-xs p-1 rounded border border-orange-300 bg-white text-slate-800"
                        placeholder="Target Date"
                    />
                )}
            </div>

            <div className="flex gap-3 items-center ml-auto">
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-sm font-medium text-shopee-orange hover:bg-orange-50 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors border border-orange-100 dark:border-slate-600 whitespace-nowrap"
                >
                  {showAddForm ? 'Cancel' : '+ New Task'}
                </button>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
                  className={inputClass}
                />
            </div>
        </div>
      </div>

      {/* Campaign Countdown Banner */}
      {isCampaignMode && campaignDate && daysToCampaign !== null && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white shadow-lg animate-fade-in flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold">Campaign Prep Mode Active</h3>
                    <p className="text-orange-100 text-sm">Focus on high-impact tasks. Daily routine updated.</p>
                </div>
            </div>
            <div className="text-center bg-white/10 rounded-lg p-3 px-6 backdrop-blur-sm">
                <span className="block text-3xl font-bold">{daysToCampaign}</span>
                <span className="text-xs font-bold uppercase opacity-80">Days Left</span>
            </div>
        </div>
      )}

      {/* Add Task Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border-2 border-orange-100 dark:border-slate-600 animate-fade-in transition-colors">
           <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Add Custom Task</h3>
           <form onSubmit={handleSubmitTask} className="flex flex-col md:flex-row gap-4 items-end">
             <div className="flex-1 w-full">
               <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Task Description</label>
               <input 
                 type="text" 
                 value={newTaskText} 
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskText(e.target.value)}
                 className="w-full border-slate-300 dark:border-slate-600 rounded-md p-2 border bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-shopee-orange focus:border-shopee-orange" 
                 placeholder="e.g. Check Live Stream Analytics"
                 required
               />
             </div>
             <div className="w-full md:w-48">
               <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Frequency</label>
               <select 
                 value={newTaskFreq}
                 onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTaskFreq(e.target.value as any)}
                 className="w-full border-slate-300 dark:border-slate-600 rounded-md p-2 border bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-shopee-orange focus:border-shopee-orange"
               >
                 <option value="daily">Daily</option>
                 <option value="weekly">Weekly</option>
               </select>
             </div>
             <button type="submit" className="bg-shopee-orange text-white px-6 py-2 rounded-lg font-bold text-sm shadow hover:bg-red-600 transition w-full md:w-auto">
               Add Task
             </button>
           </form>
        </div>
      )}

      {/* Progress Circles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SHOPS.map(shop => {
          const stats = calculateProgress(shop.id);
          const data = [
            { name: 'Completed', value: stats.completed },
            { name: 'Remaining', value: Math.max(0, stats.total - stats.completed) },
          ];
          
          return (
            <div key={shop.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
              <div>
                <h3 className="font-bold text-lg" style={{ color: shop.color }}>{shop.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{stats.completed} / {stats.total} Tasks Done</p>
              </div>
              <div className="h-16 w-16">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={12}
                        outerRadius={24}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell key="completed" fill={shop.color} />
                        <Cell key="remaining" fill="#F1F5F9" />
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SHOPS.map(shop => (
          <div key={shop.id} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border ${isCampaignMode ? 'border-orange-200 dark:border-orange-900' : 'border-slate-100 dark:border-slate-700'} overflow-hidden flex flex-col h-full transition-colors`}>
             <div className="p-4 font-bold text-white flex justify-between items-center" style={{ backgroundColor: shop.color }}>
               <span>{shop.name} Checklist</span>
               {isCampaignMode && <span className="text-xs bg-white/20 px-2 py-0.5 rounded uppercase">Campaign</span>}
             </div>
             <div className="p-4 space-y-6 flex-1">
                {/* Daily Section */}
                <div>
                   <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isCampaignMode ? 'text-shopee-orange' : 'text-slate-400 dark:text-slate-500'}`}>
                        {isCampaignMode ? '⚡ Campaign Prep (Daily)' : 'Daily Tasks'}
                   </h4>
                   <div className="space-y-2">
                     {activeDailyTasks.map(task => {
                       const isVideoTask = task.id === 't4';
                       
                       if (editingTaskId === task.id) {
                           return (
                               <div key={task.id} className="flex flex-col gap-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                   <input 
                                     value={editForm.text} 
                                     onChange={e => setEditForm({...editForm, text: e.target.value})}
                                     className="border rounded px-2 py-1 text-sm flex-1 dark:bg-slate-600 dark:text-white"
                                   />
                                   <div className="flex justify-end gap-2">
                                       <button onClick={cancelEdit} className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-300">Cancel</button>
                                       <button onClick={saveEdit} className="text-xs bg-shopee-orange text-white px-2 py-1 rounded">Save</button>
                                   </div>
                               </div>
                           );
                       }

                       return (
                       <div key={task.id} className="group relative flex items-start gap-3">
                         <div className="relative flex items-center pt-0.5">
                           <input 
                              type="checkbox" 
                              className={`peer h-5 w-5 appearance-none rounded-md border border-slate-300 dark:border-slate-600 transition-all checked:border-shopee-orange checked:bg-shopee-orange ${isVideoTask ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              checked={isTaskCompleted(task.id, shop.id)}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => !isVideoTask && onToggleTask(task.id, shop.id, selectedDate, e.target.checked)}
                              disabled={isVideoTask}
                           />
                            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
                                <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                         </div>
                         <div className="flex flex-col flex-1">
                            <span className={`text-sm transition-colors ${isTaskCompleted(task.id, shop.id) ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                                {task.text}
                            </span>
                            {isVideoTask && !isTaskCompleted(task.id, shop.id) && (
                                <span className="text-[10px] text-shopee-orange font-bold">(Log in Video Tracker to complete)</span>
                            )}
                         </div>
                         
                         {/* Edit/Delete Controls (Visible on Hover) */}
                         {!isCampaignMode && (
                             <div className="absolute right-0 top-0 hidden group-hover:flex gap-1 bg-white dark:bg-slate-800 pl-2">
                                 <button onClick={() => startEdit(task)} className="p-1 text-slate-400 hover:text-blue-500">
                                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                 </button>
                                 <button onClick={() => onDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-red-500">
                                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                 </button>
                             </div>
                         )}
                       </div>
                     )})}
                     {activeDailyTasks.length === 0 && <p className="text-xs text-slate-400 italic">No daily tasks.</p>}
                   </div>
                </div>

                {/* Weekly Section */}
                <div>
                   <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Weekly Tasks</h4>
                   <div className="space-y-2">
                     {activeWeeklyTasks.map(task => {
                        if (editingTaskId === task.id) {
                           return (
                               <div key={task.id} className="flex flex-col gap-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                   <input 
                                     value={editForm.text} 
                                     onChange={e => setEditForm({...editForm, text: e.target.value})}
                                     className="border rounded px-2 py-1 text-sm flex-1 dark:bg-slate-600 dark:text-white"
                                   />
                                   <div className="flex justify-end gap-2">
                                       <button onClick={cancelEdit} className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-300">Cancel</button>
                                       <button onClick={saveEdit} className="text-xs bg-shopee-orange text-white px-2 py-1 rounded">Save</button>
                                   </div>
                               </div>
                           );
                       }

                       return (
                       <div key={task.id} className="group relative flex items-start gap-3">
                         <div className="relative flex items-center pt-0.5">
                            <input 
                              type="checkbox" 
                              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-600 transition-all checked:border-shopee-orange checked:bg-shopee-orange"
                              checked={isTaskCompleted(task.id, shop.id)}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onToggleTask(task.id, shop.id, selectedDate, e.target.checked)}
                           />
                            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
                                <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                         </div>
                         <span className={`text-sm flex-1 transition-colors ${isTaskCompleted(task.id, shop.id) ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                           {task.text}
                         </span>
                         
                         {/* Edit/Delete Controls (Visible on Hover) */}
                         {!isCampaignMode && (
                             <div className="absolute right-0 top-0 hidden group-hover:flex gap-1 bg-white dark:bg-slate-800 pl-2">
                                 <button onClick={() => startEdit(task)} className="p-1 text-slate-400 hover:text-blue-500">
                                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                 </button>
                                 <button onClick={() => onDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-red-500">
                                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                 </button>
                             </div>
                         )}
                       </div>
                     )})}
                     {activeWeeklyTasks.length === 0 && <p className="text-xs text-slate-400 italic">No weekly tasks defined.</p>}
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};