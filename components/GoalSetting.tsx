
import React, { useState, useEffect, useMemo } from 'react';
import { SalesRecord, SHOPS, ShopID, Goal } from '../types';
import { formatCurrency, formatNumber } from '../utils';

interface GoalSettingProps {
  salesData: SalesRecord[];
  goals: Goal[];
  onAddGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalSetting: React.FC<GoalSettingProps> = ({ 
  salesData, 
  goals, 
  onAddGoal, 
  onDeleteGoal 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState<Omit<Goal, 'id' | 'createdAt'>>({
    type: 'sales',
    target: 1000000,
    period: 'monthly',
    shopId: 'all',
    startDate: new Date().toISOString().split('T')[0],
  });

  const calculateProgress = (goal: Goal): { current: number; percentage: number } => {
    const now = new Date();
    const startDate = new Date(goal.startDate);
    
    let endDate: Date;
    switch (goal.period) {
      case 'daily':
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }
    
    const filteredData = salesData.filter(record => {
      const recordDate = new Date(record.date);
      const matchesShop = goal.shopId === 'all' || record.shopId === goal.shopId;
      return matchesShop && recordDate >= startDate && recordDate <= endDate;
    });
    
    let current = 0;
    switch (goal.type) {
      case 'sales':
        current = filteredData.reduce((sum, r) => sum + r.penjualan, 0);
        break;
      case 'orders':
        current = filteredData.reduce((sum, r) => sum + r.pesanan, 0);
        break;
      case 'visitors':
        current = filteredData.reduce((sum, r) => sum + r.pengunjung, 0);
        break;
    }
    
    const percentage = Math.min(100, (current / goal.target) * 100);
    return { current, percentage };
  };

  const handleAddGoal = () => {
    const goal: Goal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    onAddGoal(goal);
    setIsAdding(false);
    setNewGoal({
      type: 'sales',
      target: 1000000,
      period: 'monthly',
      shopId: 'all',
      startDate: new Date().toISOString().split('T')[0],
    });
  };

  const formatValue = (value: number, type: 'sales' | 'orders' | 'visitors') => {
    if (type === 'sales') return formatCurrency(value);
    return formatNumber(value);
  };

  const getGoalIcon = (type: 'sales' | 'orders' | 'visitors') => {
    switch (type) {
      case 'sales':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'orders':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      case 'visitors':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-shopee-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Sales Goals
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-shopee-orange hover:bg-orange-50 dark:hover:bg-orange-900/20 px-3 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Goal
        </button>
      </div>

      {/* Add Goal Form */}
      {isAdding && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl animate-fade-in-down">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Type</label>
              <select
                value={newGoal.type}
                onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="sales">Sales (Rp)</option>
                <option value="orders">Orders</option>
                <option value="visitors">Visitors</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Target</label>
              <input
                type="number"
                value={newGoal.target}
                onChange={(e) => setNewGoal({ ...newGoal, target: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Period</label>
              <select
                value={newGoal.period}
                onChange={(e) => setNewGoal({ ...newGoal, period: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Shop</label>
              <select
                value={newGoal.shopId}
                onChange={(e) => setNewGoal({ ...newGoal, shopId: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="all">All Shops</option>
                {SHOPS.map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                value={newGoal.startDate}
                onChange={(e) => setNewGoal({ ...newGoal, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddGoal}
              className="px-4 py-2 bg-shopee-orange text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
            >
              Create Goal
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No goals set yet</p>
          <p className="text-xs mt-1">Create a goal to track your progress</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const { current, percentage } = calculateProgress(goal);
            const isComplete = percentage >= 100;
            
            return (
              <div 
                key={goal.id} 
                className={`p-4 rounded-xl border transition-all ${
                  isComplete 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isComplete 
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-600' 
                        : 'bg-white dark:bg-slate-600 text-slate-500 shadow-sm'
                    }`}>
                      {getGoalIcon(goal.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white capitalize">{goal.type}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full capitalize">
                          {goal.period}
                        </span>
                        {goal.shopId !== 'all' && (
                          <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: SHOPS.find(s => s.id === goal.shopId)?.color }}>
                            {SHOPS.find(s => s.id === goal.shopId)?.name}
                          </span>
                        )}
                        {isComplete && (
                          <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded-full font-bold">
                            ✓ Complete!
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatValue(current, goal.type)} / {formatValue(goal.target, goal.type)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="progress-bar h-3 rounded-full overflow-hidden">
                  <div 
                    className={`progress-bar-fill h-full rounded-full transition-all duration-500 ${
                      isComplete ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-orange-400 to-shopee-orange'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-400">
                    Started: {new Date(goal.startDate).toLocaleDateString()}
                  </span>
                  <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-shopee-orange'}`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalSetting;
