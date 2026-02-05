import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-4 border-slate-200 dark:border-slate-700 border-t-shopee-orange rounded-full animate-spin`} />
    </div>
  );
};

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'list';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'card', count = 3 }) => {
  if (type === 'card') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-100 dark:bg-slate-700 mb-2" />
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  // list type
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
      ))}
    </div>
  );
};

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  );
};
