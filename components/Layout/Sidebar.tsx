import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Tag, 
  Users, 
  Video, 
  Megaphone, 
  LogOut, 
  Moon, 
  Sun,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Square
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  currentView: string;
  setView: (view: any) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  onOpenWindow?: (viewId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  isMobileOpen, 
  setIsMobileOpen,
  isDarkMode,
  toggleTheme,
  isCollapsed,
  toggleCollapse,
  onOpenWindow
}) => {
  const navItems = [
    { id: 'analytics', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Productivity', icon: CheckSquare },
    { id: 'pricing', label: 'Pricing', icon: Tag },
    { id: 'competitors', label: 'Competitors', icon: Users },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  ];

  const handleNavClick = (viewId: string) => {
    setView(viewId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 transform transition-all duration-300 ease-in-out md:translate-x-0 md:static md:h-screen flex flex-col",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-20" : "w-64",
          "overflow-x-hidden"
        )}
      >
        {/* Logo Area */}
        <div className={clsx(
          "h-16 flex items-center border-b border-slate-100 dark:border-slate-800 transition-all duration-300",
          isCollapsed ? "justify-center px-0" : "px-6"
        )}>
          <div className="bg-shopee-orange text-white p-1.5 rounded-lg shadow-lg shadow-shopee-orange/20 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <span className={clsx(
            "font-display font-bold text-xl text-slate-900 dark:text-white tracking-tight ml-3 overflow-hidden transition-all duration-300",
            isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100"
          )}>
            Tracker
          </span>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="ml-auto md:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={clsx(
                  "w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isCollapsed ? "justify-center gap-0" : "gap-3",
                  isActive 
                    ? "bg-orange-50 text-shopee-orange shadow-soft-sm dark:bg-orange-500/10 dark:text-orange-400" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
                  isCollapsed && "justify-center"
                )}
              >
                <Icon 
                  size={20} 
                  className={clsx(
                    "transition-colors shrink-0",
                    isActive ? "text-shopee-orange dark:text-orange-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                  )} 
                />
                <span className={clsx(
                  "whitespace-nowrap transition-all duration-300 overflow-hidden flex-1",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}>
                  {item.label}
                </span>

                {/* Pop-out Window Button */}
                {!isCollapsed && onOpenWindow && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWindow(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white dark:hover:bg-slate-700 rounded transition-opacity"
                    title="Open in window"
                  >
                    <Square size={14} className="text-slate-400" />
                  </button>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
           <button 
             onClick={toggleCollapse}
             className="w-full items-center justify-center p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all hidden md:flex"
           >
             {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
           </button>

           <button 
             onClick={toggleTheme}
             className={clsx(
               "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-all",
               isCollapsed && "justify-center"
             )}
           >
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             <span className={clsx(
               "whitespace-nowrap transition-all duration-300 overflow-hidden",
               isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
             )}>
               {isDarkMode ? 'Light Mode' : 'Dark Mode'}
             </span>
           </button>
        </div>
      </aside>
    </>
  );
};
