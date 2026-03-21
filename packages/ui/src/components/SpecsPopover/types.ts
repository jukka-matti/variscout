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
  /** Current Cpk target value (undefined = not set) */
  cpkTarget?: number;
  /** Callback when Cpk target changes (undefined = cleared) */
  onCpkTargetChange?: (value: number | undefined) => void;
  className?: string;
  colorScheme?: SpecsPopoverColorScheme;
}
