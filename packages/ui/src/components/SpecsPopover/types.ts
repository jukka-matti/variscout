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

export interface SpecsPopoverProps {
  specs: { usl?: number; lsl?: number; target?: number };
  onSave: (specs: { usl?: number; lsl?: number; target?: number }) => void;
  onOpenAdvanced?: () => void;
  className?: string;
  colorScheme?: SpecsPopoverColorScheme;
}
