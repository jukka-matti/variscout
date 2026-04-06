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
  content: React.ReactNode;
}

export interface PIPanelBaseProps {
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
}
