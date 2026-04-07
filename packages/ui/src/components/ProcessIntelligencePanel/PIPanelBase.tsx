import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import type { PIPanelBaseProps, PITabConfig, PIOverflowItem } from './types';

const CONTAINER_CLASS =
  'w-full lg:w-80 bg-surface-secondary rounded-xl border border-edge p-3 flex flex-col gap-3 shadow-lg relative';
const CONTAINER_COMPACT_CLASS = 'flex flex-col h-full p-3 overflow-auto scroll-touch';
const TAB_BAR_CLASS = 'flex bg-surface/50 p-1 rounded-lg border border-edge/50';
const TAB_ACTIVE_CLASS = 'bg-surface-tertiary text-content shadow-sm';
const TAB_INACTIVE_CLASS = 'text-content-secondary hover:text-content';

// ─── Config-driven tab button ────────────────────────────────────────────────

interface ConfigTabButtonProps {
  tab: PITabConfig;
  activeId: string;
  onTabChange: (id: string) => void;
  compact?: boolean;
}

const ConfigTabButton = ({ tab, activeId, onTabChange, compact }: ConfigTabButtonProps) => (
  <button
    onClick={() => onTabChange(tab.id)}
    data-testid={`pi-tab-${tab.id}`}
    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
      activeId === tab.id ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS
    } ${compact ? 'flex-1 px-2 py-2' : ''}`}
    style={compact ? { minHeight: 44 } : undefined}
  >
    {tab.label}
    {tab.badge !== undefined && tab.badge > 0 && (
      <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[0.5rem] font-semibold rounded-full bg-blue-500/20 text-blue-400 leading-none">
        {tab.badge}
      </span>
    )}
  </button>
);

// ─── Config-driven overflow menu ─────────────────────────────────────────────

interface ConfigOverflowMenuProps {
  items: PIOverflowItem[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

const ConfigOverflowMenu: React.FC<ConfigOverflowMenuProps> = ({ items, activeId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const activeItem = activeId ? items.find(i => i.id === activeId) : null;

  if (activeItem) {
    return (
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-surface-tertiary text-content border border-edge/60 hover:bg-surface hover:text-content-secondary transition-colors"
        aria-label={`Close ${activeItem.label}`}
        data-testid={`pi-overflow-close-${activeItem.id}`}
      >
        <span>{activeItem.label}</span>
        <X size={10} />
      </button>
    );
  }

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="relative ml-auto flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center w-7 h-7 rounded-md text-content-secondary hover:text-content hover:bg-surface-tertiary transition-colors"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="pi-overflow-trigger"
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 min-w-[140px] bg-surface border border-edge rounded-lg shadow-lg py-1"
        >
          {items.map(item => (
            <button
              key={item.id}
              role="menuitem"
              type="button"
              className="w-full text-left px-3 py-1.5 text-xs text-content hover:bg-surface-secondary transition-colors flex items-center gap-2"
              data-testid={`pi-overflow-item-${item.id}`}
              onClick={() => {
                if (item.onSelect) {
                  // Callback-only item: trigger side-effect (e.g. open modal), don't show inline content
                  item.onSelect(item.id);
                } else {
                  onSelect(item.id);
                }
                setOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── PIPanelBase ─────────────────────────────────────────────────────────────

function PIPanelBase<T extends string = string>({
  tabs,
  overflowItems,
  defaultTab,
  className,
  compact = false,
  activeTab: controlledActiveTab,
  onTabChange,
}: PIPanelBaseProps<T>) {
  const [internalActiveTabId, setInternalActiveTabId] = useState<string>(
    () => controlledActiveTab ?? defaultTab ?? (tabs.length > 0 ? tabs[0].id : '')
  );
  const [activeOverflowItemId, setActiveOverflowItemId] = useState<string | null>(null);

  // Controlled vs uncontrolled: when activeTab prop is provided, use it
  const activeTabId = controlledActiveTab ?? internalActiveTabId;

  const handleTabChange = (id: string) => {
    if (onTabChange) {
      onTabChange(id as T);
    } else {
      setInternalActiveTabId(id);
    }
    // Clear overflow when tab changes
    setActiveOverflowItemId(null);
  };

  const renderTabBar = () => {
    const hasOverflow = overflowItems && overflowItems.length > 0;
    return (
      <div className={`${TAB_BAR_CLASS} ${compact ? 'mb-4' : ''} items-center`}>
        {tabs.map(tab => (
          <ConfigTabButton
            key={tab.id}
            tab={tab}
            activeId={activeTabId}
            onTabChange={handleTabChange}
            compact={compact}
          />
        ))}
        {hasOverflow && (
          <ConfigOverflowMenu
            items={overflowItems!}
            activeId={activeOverflowItemId}
            onSelect={setActiveOverflowItemId}
          />
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    // Overflow item content takes priority (only for items with inline content)
    if (activeOverflowItemId) {
      const item = overflowItems?.find(i => i.id === activeOverflowItemId);
      if (item && item.content) {
        return (
          <div
            className="flex-1 min-h-0 overflow-auto"
            data-testid={`pi-overflow-content-${item.id}`}
          >
            {item.content}
          </div>
        );
      }
    }

    const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0];
    if (!activeTab) return null;

    return (
      <div className="flex-1 min-h-0 overflow-auto" data-testid={`pi-tab-content-${activeTab.id}`}>
        {activeTab.content}
      </div>
    );
  };

  // Compact layout (mobile)
  if (compact) {
    return (
      <div className={CONTAINER_COMPACT_CLASS}>
        {renderTabBar()}
        <div className="flex-1 min-h-0">{renderTabContent()}</div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={className ? `${CONTAINER_CLASS} ${className}` : CONTAINER_CLASS}>
      <div className="flex justify-between items-center border-b border-inherit pb-4">
        {renderTabBar()}
      </div>
      {renderTabContent()}
    </div>
  );
}

export default PIPanelBase;
