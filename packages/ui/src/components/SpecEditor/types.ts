export interface SpecEditorColorScheme {
  // Labels
  label: string;
  // Inputs
  input: string;
  // Buttons
  addButton: string;
  removeButton: string;
  // Grades empty state
  gradesEmpty: string;
  gradesHeader: string;
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
  grades: { max: number; label: string; color: string }[];
  onSave: (
    specs: { usl?: number; lsl?: number; target?: number },
    grades: { max: number; label: string; color: string }[]
  ) => void;
  onClose: () => void;
  style?: React.CSSProperties;
  colorScheme?: SpecEditorColorScheme;
}
