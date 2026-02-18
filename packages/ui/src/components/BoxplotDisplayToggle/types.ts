import type { BoxplotSortBy, BoxplotSortDirection } from '@variscout/core';

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

export interface BoxplotDisplayToggleProps {
  showViolin: boolean;
  showContributionLabels: boolean;
  onToggleViolin: (value: boolean) => void;
  onToggleContributionLabels: (value: boolean) => void;
  sortBy?: BoxplotSortBy;
  sortDirection?: BoxplotSortDirection;
  onSortChange?: (sortBy: BoxplotSortBy, direction: BoxplotSortDirection) => void;
  colorScheme?: BoxplotDisplayToggleColorScheme;
}
