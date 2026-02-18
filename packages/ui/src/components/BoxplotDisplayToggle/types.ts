export interface BoxplotDisplayToggleColorScheme {
  trigger: string;
  popoverContainer: string;
  checkbox: string;
  checkboxLabel: string;
  description: string;
}

export interface BoxplotDisplayToggleProps {
  showViolin: boolean;
  showContributionLabels: boolean;
  onToggleViolin: (value: boolean) => void;
  onToggleContributionLabels: (value: boolean) => void;
  colorScheme?: BoxplotDisplayToggleColorScheme;
}
