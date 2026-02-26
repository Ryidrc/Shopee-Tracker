import React, { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, Minus } from 'lucide-react';

interface WindowProps {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  onClose: () => void;
  onMinimize: () => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  onFocus: () => void;
  zIndex: number;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({
  id,
  title,
  isOpen,
  isMinimized,
  position,
  size,
  onClose,
  onMinimize,
  onPositionChange,
  onSizeChange,
  onFocus,
  zIndex,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep window within viewport bounds
      const maxX = window.innerWidth - 200; // Minimum 200px visible
      const maxY = window.innerHeight - 50; // Minimum title bar visible
      
      onPositionChange({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = position.x;
      let newY = position.y;

      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(400, resizeStart.width + deltaX);
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(300, resizeStart.height + deltaY);
      }
      if (resizeDirection.includes('w')) {
        const widthChange = resizeStart.width - deltaX;
        if (widthChange >= 400) {
          newWidth = widthChange;
          newX = position.x + deltaX;
        }
      }
      if (resizeDirection.includes('n')) {
        const heightChange = resizeStart.height - deltaY;
        if (heightChange >= 300) {
          newHeight = heightChange;
          newY = position.y + deltaY;
        }
      }

      onSizeChange({ width: newWidth, height: newHeight });
      if (newX !== position.x || newY !== position.y) {
        onPositionChange({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, resizeStart, position, onSizeChange, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.window-title')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      onFocus();
    }
  };

  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
    onFocus();
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 flex items-center gap-2 cursor-pointer hover:shadow-xl transition-shadow"
        style={{ zIndex }}
        onClick={onMinimize}
      >
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-slate-400 hover:text-red-500 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className="fixed bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex,
      }}
      onClick={onFocus}
    >
      {/* Title Bar */}
      <div
        className="window-title bg-gradient-to-r from-shopee-orange to-orange-500 text-white px-4 py-3 flex items-center justify-between cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <h3 className="font-bold text-sm">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onMinimize}
            className="hover:bg-white/20 rounded p-1 transition-colors"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-900">
        {children}
      </div>

      {/* Resize Handles */}
      {/* Edges */}
      <div
        className="absolute top-0 left-0 right-0 h-1 cursor-n-resize"
        onMouseDown={handleResizeStart('n')}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize"
        onMouseDown={handleResizeStart('s')}
      />
      <div
        className="absolute top-0 left-0 bottom-0 w-1 cursor-w-resize"
        onMouseDown={handleResizeStart('w')}
      />
      <div
        className="absolute top-0 right-0 bottom-0 w-1 cursor-e-resize"
        onMouseDown={handleResizeStart('e')}
      />
      
      {/* Corners */}
      <div
        className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
        onMouseDown={handleResizeStart('nw')}
      />
      <div
        className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
        onMouseDown={handleResizeStart('ne')}
      />
      <div
        className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
        onMouseDown={handleResizeStart('sw')}
      />
      <div
        className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
        onMouseDown={handleResizeStart('se')}
      />
    </div>
  );
};
