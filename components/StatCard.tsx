import React from 'react';
import { Card } from './ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  trend?: string; // e.g. "+5%"
  trendUp?: boolean;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, icon }) => {
  return (
    <Card className="flex flex-col justify-between h-full hover:shadow-lg transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 group-hover:text-shopee-orange transition-colors">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200 font-display tracking-tight">{value}</h3>
        </div>
        {icon && <div className="p-2.5 bg-orange-50 dark:bg-slate-800 rounded-xl text-shopee-orange ring-1 ring-orange-100 dark:ring-slate-700">{icon}</div>}
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
            {trend}
          </span>
          <span className="text-xs text-slate-400 ml-2 font-medium">vs yesterday</span>
        </div>
      )}
    </Card>
  );
};