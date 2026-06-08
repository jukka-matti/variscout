import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Crosshair } from 'lucide-react';

export type CoScoutDrawerObject =
  | { kind: 'cause'; id: string; label: string }
  | { kind: 'finding'; id: string; label: string };

export type CoScoutDrawerTab = 'coach' | 'evidence' | 'actions';

export interface CoScoutRightDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedObject?: CoScoutDrawerObject | null;
  refTarget?: { targetType: string; targetId?: string };
  onRefActivate?: (targetType: string, targetId?: string) => void;
  children: React.ReactNode;
}

const tabLabels: Record<CoScoutDrawerTab, string> = {
  coach: 'Coach',
  evidence: 'Evidence',
  actions: 'Actions',
};

export const CoScoutRightDrawer: React.FC<CoScoutRightDrawerProps> = ({
  isOpen,
  onOpenChange,
  selectedObject,
  refTarget,
  onRefActivate,
  children,
}) => {
  const [activeTab, setActiveTab] = useState<CoScoutDrawerTab>('coach');

  if (!isOpen) {
    return (
      <button
        type="button"
        data-testid="coscout-drawer-handle"
        onClick={() => onOpenChange(true)}
        className="absolute right-3 top-16 z-30 inline-flex items-center gap-1 rounded border border-edge bg-surface/95 px-2 py-1 text-xs font-medium text-content shadow-sm hover:bg-surface-secondary"
        aria-label="Open CoScout"
      >
        CoScout
        <ChevronLeft size={14} aria-hidden="true" />
      </button>
    );
  }

  const objectKindLabel =
    selectedObject?.kind === 'cause'
      ? 'Suspected cause'
      : selectedObject?.kind === 'finding'
        ? 'Finding'
        : 'Wall context';
  const objectLabel = selectedObject?.label ?? 'No Wall object selected';

  return (
    <aside
      data-testid="coscout-right-drawer"
      className="absolute right-3 top-16 z-30 flex max-h-[calc(100%-5rem)] w-[min(420px,calc(100%-1.5rem))] flex-col overflow-hidden rounded border border-edge bg-surface shadow-xl"
      aria-label="CoScout drawer"
    >
      <div className="flex items-start gap-2 border-b border-edge px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 data-testid="coscout-drawer-title" className="text-sm font-semibold text-content">
              CoScout
            </h2>
            {refTarget && onRefActivate ? (
              <button
                type="button"
                data-testid="coscout-ref-hook"
                onClick={() => onRefActivate(refTarget.targetType, refTarget.targetId)}
                className="inline-flex items-center gap-1 rounded border border-edge px-1.5 py-0.5 text-[11px] font-semibold text-content-secondary hover:bg-surface-secondary hover:text-content"
                aria-label="Activate CoScout reference"
              >
                <Crosshair size={12} aria-hidden="true" />
                REF
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">
            {objectKindLabel}
          </p>
          <p data-testid="coscout-drawer-object" className="line-clamp-2 text-xs text-content">
            {objectLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded p-1 text-content-secondary hover:bg-surface-secondary hover:text-content"
          aria-label="Collapse CoScout"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="flex border-b border-edge px-2 pt-2" role="tablist" aria-label="CoScout tabs">
        {(['coach', 'evidence', 'actions'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-t px-3 py-1.5 text-xs font-medium ${
              activeTab === tab
                ? 'bg-surface-secondary text-content'
                : 'text-content-secondary hover:text-content'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'coach' ? (
          <div data-testid="coscout-drawer-coach" className="flex h-full min-h-0">
            {children}
          </div>
        ) : (
          <div
            className="p-3 text-xs text-content-secondary"
            data-testid={`coscout-drawer-${activeTab}`}
          >
            {tabLabels[activeTab]} context is reserved for CS-14.
          </div>
        )}
      </div>
    </aside>
  );
};
