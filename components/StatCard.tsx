import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  trend?: string; // e.g. "+5%"
  trendUp?: boolean;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, icon }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-full transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        </div>
        {icon && <div className="p-2 bg-orange-50 dark:bg-slate-700 rounded-lg text-shopee-orange">{icon}</div>}
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
            {trend}
          </span>
          <span className="text-xs text-slate-400 ml-2">vs yesterday</span>
        </div>
      )}
    </div>
  );
};