import React, { useState, useRef, useCallback } from 'react';
import { Badge } from '../ui/badge';
import { ChevronsLeftRight } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Before Repair',
  afterLabel = 'After Repair',
  className = ''
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const startDrag = () => {
    isDragging.current = true;
  };

  const stopDrag = () => {
    isDragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-2xl border border-border shadow-soft aspect-[16/10] bg-slate-900 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      onTouchMove={handleTouchMove}
      onTouchEnd={stopDrag}
    >
      {/* After Image (Full background) */}
      <img
        src={afterUrl}
        alt={afterLabel}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute top-3 right-3 z-20">
        <Badge variant="success" className="shadow-md bg-emerald-600 text-white border-0">
          {afterLabel}
        </Badge>
      </div>

      {/* Before Image (Clipped on top) */}
      <div
        className="absolute inset-0 z-10 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-cover max-w-none"
          style={{ width: containerRef.current?.clientWidth || '100%' }}
          loading="lazy"
        />
        <div className="absolute top-3 left-3 z-20">
          <Badge variant="destructive" className="shadow-md bg-rose-600 text-white border-0">
            {beforeLabel}
          </Badge>
        </div>
      </div>

      {/* Draggable Divider Handle */}
      <div
        className="absolute top-0 bottom-0 z-30 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize flex items-center justify-center -ml-[2px]"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg ring-2 ring-primary/40 hover:scale-110 active:scale-95 transition-transform">
          <ChevronsLeftRight className="h-4 w-4 text-primary" />
        </div>
      </div>
    </div>
  );
};
