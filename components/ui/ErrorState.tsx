import React from 'react';

interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  className = ''
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-slate-600 dark:text-slate-400 text-center mb-6 max-w-md">
        {errorMessage}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-shopee-orange hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

interface InlineErrorProps {
  message: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 text-red-600 dark:text-red-400 text-sm ${className}`}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
};
