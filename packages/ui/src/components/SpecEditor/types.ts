import type React from 'react';

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
  specs: { usl?: number; lsl?: number; target?: number };
  onSave: (specs: { usl?: number; lsl?: number; target?: number }) => void;
  onClose: () => void;
  style?: React.CSSProperties;
  colorScheme?: SpecEditorColorScheme;
}
