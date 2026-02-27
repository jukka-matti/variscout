import type React from 'react';
import type { SpecLimits } from '@variscout/core';

export interface SpecEditorColorScheme {
  // Labels
  label: string;
  // Inputs
  input: string;
  // Mobile bottom sheet
  mobileSheet: string;
  mobileDragHandle: string;
  mobileHeaderBorder: string;
  mobileCloseButton: string;
  // Desktop popup
  desktopContainer: string;
  desktopHeaderBorder: string;
  desktopCloseButton: string;
}

export interface SpecEditorProps {
  specs: SpecLimits;
  onSave: (specs: SpecLimits) => void;
  onClose: () => void;
  style?: React.CSSProperties;
  colorScheme?: SpecEditorColorScheme;
}
