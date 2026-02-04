
import React from 'react';

interface EmptyStateProps {
  icon?: 'chart' | 'list' | 'video' | 'price' | 'competitor' | 'task';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = 'chart', 
  title, 
  description, 
  action 
}) => {
  const icons = {
    chart: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    list: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    video: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    price: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    competitor: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    task: (
      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="text-slate-300 dark:text-slate-600 mb-4">
        {icons[icon]}
      </div>
      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-shopee-orange text-white rounded-xl font-bold text-sm hover:bg-red-600 shadow-lg shadow-shopee-orange/30 transition-all btn-hover-lift"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Progress bar component for tasks
interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  color?: 'orange' | 'green' | 'blue' | 'purple';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  label, 
  color = 'orange' 
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  const colorClasses = {
    orange: 'bg-gradient-to-r from-orange-400 to-shopee-orange',
    green: 'bg-gradient-to-r from-green-400 to-green-500',
    blue: 'bg-gradient-to-r from-blue-400 to-blue-500',
    purple: 'bg-gradient-to-r from-purple-400 to-purple-500',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className="progress-bar h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
        <div 
          className={`progress-bar-fill h-full rounded-full ${colorClasses[color]}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

// Skeleton loader component
interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  variant = 'text', 
  width, 
  height, 
  className = '' 
}) => {
  const baseClasses = 'skeleton animate-shimmer';
  
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'circular' ? width : undefined),
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Stats card with comparison
interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  comparison?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  color?: 'orange' | 'green' | 'blue' | 'purple' | 'slate';
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  comparison,
  color = 'orange',
  onClick
}) => {
  const bgColors = {
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200/50 dark:border-orange-700/30',
    green: 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200/50 dark:border-green-700/30',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200/50 dark:border-blue-700/30',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200/50 dark:border-purple-700/30',
    slate: 'bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/30 border-slate-200/50 dark:border-slate-600/30',
  };

  const iconColors = {
    orange: 'text-orange-500 dark:text-orange-400',
    green: 'text-green-500 dark:text-green-400',
    blue: 'text-blue-500 dark:text-blue-400',
    purple: 'text-purple-500 dark:text-purple-400',
    slate: 'text-slate-500 dark:text-slate-400',
  };

  return (
    <div 
      className={`p-4 rounded-xl border ${bgColors[color]} transition-all ${onClick ? 'cursor-pointer card-hover' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm ${iconColors[color]}`}>
          {icon}
        </div>
        {comparison && (
          <div className={`flex items-center gap-1 text-xs font-medium ${comparison.isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {comparison.isPositive ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{Math.abs(comparison.value).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-white mb-0.5">
        {value}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </div>
      {comparison && (
        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          {comparison.label}
        </div>
      )}
    </div>
  );
};

// Badge component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'neutral', 
  size = 'sm',
  pulse = false 
}) => {
  const variants = {
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span className={`inline-flex items-center font-bold rounded-full ${variants[variant]} ${sizes[size]} ${pulse ? 'badge-pulse' : ''}`}>
      {children}
    </span>
  );
};
