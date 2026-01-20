import { useState, useRef, useEffect, type ReactNode } from 'react';

interface ChartContainerProps {
  height: number;
  className?: string;
  children: (dimensions: { width: number; height: number }) => ReactNode;
}

/**
 * Responsive container for chart components.
 * Uses ResizeObserver to track container width and provides
 * dimensions to children via render prop pattern.
 */
export default function ChartContainer({ height, className = '', children }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800); // Default width for SSR

  useEffect(() => {
    if (!containerRef.current) return;

    // Set initial width
    setWidth(containerRef.current.offsetWidth);

    // Watch for resize
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ height, width: '100%' }}>
      {/* Dark background matching PWA/Azure charts */}
      <div className="absolute inset-0 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
        {width > 0 && children({ width, height })}
      </div>
    </div>
  );
}
