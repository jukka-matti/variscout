export interface SpecsPopoverColorScheme {
  // Trigger button
  triggerActive: string;
  triggerInactive: string;
  // Popover container
  popoverContainer: string;
  // Header
  headerBorder: string;
  headerText: string;
  advancedButton: string;
  // Checkbox
  checkbox: string;
  checkboxLabel: string;
  // Input
  input: string;
  inputDisabled: string;
  // Apply button
  applyActive: string;
  applyDisabled: string;
}

import type { SpecLimits } from '@variscout/core';

export interface SpecsPopoverProps {
  specs: SpecLimits;
  onSave: (specs: SpecLimits) => void;
  onOpenAdvanced?: () => void;
  className?: string;
  colorScheme?: SpecsPopoverColorScheme;
}
