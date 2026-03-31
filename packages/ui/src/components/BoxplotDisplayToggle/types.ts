import type {
  BoxplotSortBy,
  BoxplotSortDirection,
  BoxplotPriorityCriterion,
} from '@variscout/core';

export interface BoxplotDisplayToggleColorScheme {
  trigger: string;
  popoverContainer: string;
  checkbox: string;
  checkboxLabel: string;
  description: string;
  radioActive?: string;
  radioInactive?: string;
  directionButton?: string;
  sectionLabel?: string;
}

/** Per-category summary stats for the category picker */
export interface CategoryPickerItem {
  key: string;
  mean: number;
  isVisible: boolean;
}

export interface BoxplotDisplayToggleProps {
  showViolin: boolean;
  onToggleViolin: (value: boolean) => void;
  sortBy?: BoxplotSortBy;
  sortDirection?: BoxplotSortDirection;
  onSortChange?: (sortBy: BoxplotSortBy, direction: BoxplotSortDirection) => void;
  colorScheme?: BoxplotDisplayToggleColorScheme;
  /** Category picker: total categories available */
  totalCategories?: number;
  /** Category picker: currently visible categories */
  visibleCount?: number;
  /** Category picker: auto mode active */
  isAutoMode?: boolean;
  /** Category picker: auto selection criterion label */
  priorityCriterion?: BoxplotPriorityCriterion;
  /** Category picker: toggle auto/manual mode */
  onAutoModeToggle?: (isAuto: boolean) => void;
  /** Category picker: all categories with stats */
  categoryItems?: CategoryPickerItem[];
  /** Category picker: manual selection change */
  onManualSelectionChange?: (keys: string[]) => void;
  /** Format a stat value */
  formatStat?: (value: number, decimals?: number) => string;
}
