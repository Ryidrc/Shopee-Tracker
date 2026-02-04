import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { GlobalSearch } from '../GlobalSearch';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  actions?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  currentView, 
  setView,
  isDarkMode,
  toggleTheme,
  actions
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      <Sidebar 
        currentView={currentView}
        setView={setView}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-display font-semibold text-slate-900 dark:text-white hidden sm:block capitalize">
              {currentView}
            </h1>
          </div>

          <div className="flex items-center gap-3">
             {actions}
          </div>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth" id="main-content">
          <div className="max-w-7xl mx-auto w-full animate-fade-in pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
