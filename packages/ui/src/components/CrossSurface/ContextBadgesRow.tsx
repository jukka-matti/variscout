import React from 'react';
import { Briefcase, MessageSquare, ShieldCheck, type LucideIcon } from 'lucide-react';

import { MultiLinkPicker, type ContextLinkItem } from './MultiLinkPicker';

export type ContextSurfaceType = 'improvement-projects' | 'wall-threads' | 'sustainment';

export interface ContextLinkGroup<TItem extends ContextLinkItem = ContextLinkItem> {
  surfaceType: ContextSurfaceType;
  items: readonly TItem[];
  label?: string;
}

export interface ContextBadgesRowProps<TItem extends ContextLinkItem = ContextLinkItem> {
  groups: readonly ContextLinkGroup<TItem>[];
  onNavigate: (item: TItem) => void;
  hideEmptyGroups?: boolean;
  className?: string;
}

const SURFACE_META: Record<ContextSurfaceType, { label: string; Icon: LucideIcon }> = {
  'improvement-projects': { label: 'Improvement projects', Icon: Briefcase },
  'wall-threads': { label: 'Wall threads', Icon: MessageSquare },
  sustainment: { label: 'Control', Icon: ShieldCheck },
};

const formatCount = (count: number) => `${count} linked ${count === 1 ? 'item' : 'items'}`;

export function ContextBadgesRow<TItem extends ContextLinkItem = ContextLinkItem>({
  groups,
  onNavigate,
  hideEmptyGroups = true,
  className = '',
}: ContextBadgesRowProps<TItem>) {
  const [activeGroup, setActiveGroup] = React.useState<ContextLinkGroup<TItem> | null>(null);
  const visibleGroups = hideEmptyGroups ? groups.filter(group => group.items.length > 0) : groups;

  const handleBadgeClick = (group: ContextLinkGroup<TItem>) => {
    if (group.items.length === 1) {
      onNavigate(group.items[0]);
      return;
    }

    if (group.items.length > 1) {
      setActiveGroup(group);
    }
  };

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
        {visibleGroups.map(group => {
          const { Icon, label: defaultLabel } = SURFACE_META[group.surfaceType];
          const label = group.label ?? defaultLabel;
          const count = group.items.length;

          return (
            <button
              key={group.surfaceType}
              type="button"
              onClick={() => handleBadgeClick(group)}
              aria-label={`${label}: ${formatCount(count)}`}
              disabled={count === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-surface-secondary px-2.5 py-1 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-tertiary hover:text-content focus:outline-none focus:ring-2 focus:ring-status-info/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon size={14} aria-hidden="true" />
              <span className="tabular-nums text-content">{count}</span>
            </button>
          );
        })}
      </div>

      {activeGroup && (
        <MultiLinkPicker
          label={activeGroup.label ?? SURFACE_META[activeGroup.surfaceType].label}
          items={activeGroup.items}
          onNavigate={onNavigate}
          onClose={() => setActiveGroup(null)}
        />
      )}
    </>
  );
}
