import React, { useEffect, useRef } from 'react';
import VariationFunnel from './VariationFunnel';

interface FunnelPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Called when the panel should close */
  onClose: () => void;
  /** Raw data for variation analysis */
  data: any[];
  /** Available factor columns */
  factors: string[];
  /** Outcome column name */
  outcome: string;
  /** Column aliases for display */
  columnAliases?: Record<string, string>;
  /** Specification limits for Cpk projection */
  specs?: { usl?: number; lsl?: number; target?: number };
  /** Called when user applies a single filter (integrates with filter navigation) */
  onApplyFilter?: (factor: string, value: string | number) => void;
  /** @deprecated Use onApplyFilter instead - applies all selected filters at once */
  onApplyFilters?: (filters: Record<string, (string | number)[]>) => void;
  /** Called when user clicks a factor to drill into it */
  onDrillFactor?: (factor: string, value: string | number) => void;
  /** Called when user wants to open in popout window */
  onOpenPopout?: () => void;
}

/**
 * Slide-in panel for the Variation Funnel
 *
 * Similar to SettingsPanel, slides in from the right side.
 * Provides access to the variation funnel analysis for finding
 * optimal factor combinations.
 */
const FunnelPanel: React.FC<FunnelPanelProps> = ({
  isOpen,
  onClose,
  data,
  factors,
  outcome,
  columnAliases,
  specs,
  onApplyFilter,
  onApplyFilters,
  onDrillFactor,
  onOpenPopout,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        onClose();
      }
    };
    // Delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 w-80 bg-surface-secondary border-l border-edge shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden"
      >
        <VariationFunnel
          data={data}
          factors={factors}
          outcome={outcome}
          columnAliases={columnAliases}
          specs={specs}
          onApplyFilter={onApplyFilter}
          onApplyFilters={onApplyFilters}
          onDrillFactor={onDrillFactor}
          onOpenPopout={onOpenPopout}
          onClose={onClose}
        />
      </div>
    </>
  );
};

export default FunnelPanel;
