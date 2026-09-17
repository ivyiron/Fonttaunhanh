import React, { useCallback, useEffect, useState } from 'react';
import { GripVertical, GripHorizontal } from 'lucide-react';

interface ResizableDividerProps {
  direction?: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  className?: string;
  title?: string;
}

export const ResizableDivider: React.FC<ResizableDividerProps> = ({
  direction = 'horizontal',
  onResize,
  className = '',
  title = 'Kéo để thay đổi kích thước panel'
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const delta = direction === 'horizontal' ? e.movementX : e.movementY;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        // Simple touch movement
        // For touch, movementX/Y might not exist, so we can track or finish
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, direction, onResize]);

  if (direction === 'vertical') {
    return (
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        title={title}
        className={`group relative h-0.5 w-full shrink-0 flex items-center justify-center cursor-row-resize select-none touch-none hover:bg-neutral-200/70 active:bg-neutral-300 transition-colors ${
          isDragging ? 'bg-neutral-300' : ''
        } ${className}`}
      >
        <div className="w-full h-px bg-neutral-200 group-hover:bg-neutral-400 transition-colors" />
      </div>
    );
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      title={title}
      className={`group relative w-0.5 shrink-0 self-stretch flex items-center justify-center cursor-col-resize select-none touch-none hover:bg-neutral-200/70 active:bg-neutral-300 transition-colors ${
        isDragging ? 'bg-neutral-300' : ''
      } ${className}`}
    >
      <div className="h-full w-px bg-neutral-200 group-hover:bg-neutral-400 transition-colors" />
    </div>
  );
};
