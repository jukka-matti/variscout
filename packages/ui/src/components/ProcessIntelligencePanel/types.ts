import type React from 'react';

export type PITab = 'stats' | 'questions' | 'journal' | 'docs';
export type PIOverflowView = 'data' | 'whatif' | null;

/** Config-driven tab definition for PIPanelBase tabs prop */
export interface PITabConfig {
  id: string;
  label: string;
  badge?: number;
  content: React.ReactNode;
}

/** Config-driven overflow item definition for PIPanelBase overflowItems prop */
export interface PIOverflowItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /**
   * Rendered inline when the item is selected from the overflow menu.
   * Mutually exclusive with `onSelect` — if `onSelect` is provided, `content`
   * is not rendered; instead the callback is invoked and the menu closes.
   */
  content?: React.ReactNode;
  /**
   * When provided, clicking this overflow item calls the callback instead of
   * showing inline content. Use this for items that open modals or trigger
   * side-effects (e.g., Data Table opens via panelsStore.openDataTable()).
   */
  onSelect?: (id: string) => void;
}

export interface PIPanelBaseProps<T extends string = string> {
  /** Tab definitions — required, drives the tab bar and content */
  tabs: PITabConfig[];
  /** Overflow menu items (e.g., Data Table, What-If) */
  overflowItems?: PIOverflowItem[];
  /** Default tab id to show on mount */
  defaultTab?: string;
  /** Additional CSS class for the container */
  className?: string;
  /** Compact (mobile) layout */
  compact?: boolean;
  /**
   * Controlled active tab id (from panelsStore).
   * When provided, PIPanelBase uses this instead of internal state.
   * Tab click calls `onTabChange` if provided, otherwise falls back to
   * internal state.
   */
  activeTab?: T;
  /**
   * Called when the user clicks a tab button.
   * Required when `activeTab` is provided to keep the controlled value in sync.
   */
  onTabChange?: (tabId: T) => void;
}
