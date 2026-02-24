import type {
  RegressionResult,
  SpecLimits,
  MultiRegressionResult,
  TermRemovalSuggestion,
} from '@variscout/core';
import type { ColumnClassification, ReductionStep } from '@variscout/hooks';

/**
 * Color scheme for regression view components (SimpleRegressionView, AdvancedRegressionView, ExpandedScatterModal)
 * Allows customization for different app themes (PWA semantic tokens vs Azure slate palette)
 */
export interface RegressionViewColorScheme {
  /** Section bar background (toolbars, footer bars) */
  sectionBg: string;
  /** Card/panel background */
  cardBg: string;
  /** Input/select/code block background */
  inputBg: string;
  /** Tertiary background (ranking pills, toggle buttons) */
  tertiaryBg: string;
  /** Full-screen modal backdrop */
  modalBg: string;
  /** Primary border */
  border: string;
  /** Subtle border (50% opacity variant) */
  borderSubtle: string;
  /** Faint border (30% opacity variant) */
  borderFaint: string;
  /** Input/select border */
  inputBorder: string;
  /** Primary content text */
  contentText: string;
  /** Secondary/label text */
  secondaryText: string;
  /** Muted/placeholder text */
  mutedText: string;
  /** Ranking separator arrow text */
  rankingSeparator: string;
  /** Toggle button hover background (cat/num toggle) */
  toggleBtnHover: string;
  /** General hover background (close buttons, action buttons) */
  hoverBg: string;
  /** General hover text */
  hoverText: string;
}

/**
 * Default color scheme using PWA semantic tokens
 */
export const regressionViewDefaultColorScheme: RegressionViewColorScheme = {
  sectionBg: 'bg-surface-secondary/50',
  cardBg: 'bg-surface-secondary',
  inputBg: 'bg-surface',
  tertiaryBg: 'bg-surface-tertiary',
  modalBg: 'bg-surface/95',
  border: 'border-edge',
  borderSubtle: 'border-edge/50',
  borderFaint: 'border-edge/30',
  inputBorder: 'border-edge-secondary',
  contentText: 'text-content',
  secondaryText: 'text-content-secondary',
  mutedText: 'text-content-muted',
  rankingSeparator: 'text-content-muted',
  toggleBtnHover: 'hover:bg-surface',
  hoverBg: 'hover:bg-surface-tertiary',
  hoverText: 'hover:text-content',
};

/**
 * Azure color scheme using Tailwind Slate palette
 */
export const regressionViewAzureColorScheme: RegressionViewColorScheme = {
  sectionBg: 'bg-slate-800/50',
  cardBg: 'bg-slate-800',
  inputBg: 'bg-slate-900',
  tertiaryBg: 'bg-slate-700',
  modalBg: 'bg-slate-900/95',
  border: 'border-slate-700',
  borderSubtle: 'border-slate-700/50',
  borderFaint: 'border-slate-700/30',
  inputBorder: 'border-slate-600',
  contentText: 'text-slate-300',
  secondaryText: 'text-slate-400',
  mutedText: 'text-slate-500',
  rankingSeparator: 'text-slate-600',
  toggleBtnHover: 'hover:bg-slate-600',
  hoverBg: 'hover:bg-slate-700',
  hoverText: 'hover:text-slate-300',
};

/**
 * Props for SimpleRegressionView with colorScheme support
 */
export interface SimpleRegressionViewComponentProps {
  outcome: string;
  numericColumns: string[];
  selectedXColumns: string[];
  toggleXColumn: (col: string) => void;
  regressionResults: RegressionResult[];
  sortedByStrength: RegressionResult[];
  specs?: SpecLimits | null;
  onExpandChart: (xColumn: string) => void;
  colorScheme?: RegressionViewColorScheme;
}

/**
 * Props for AdvancedRegressionView with colorScheme support
 */
export interface AdvancedRegressionViewComponentProps {
  outcome: string;
  columns: ColumnClassification;
  advSelectedPredictors: string[];
  toggleAdvPredictor: (col: string) => void;
  categoricalColumns: Set<string>;
  toggleCategorical: (col: string) => void;
  includeInteractions: boolean;
  setIncludeInteractions: (value: boolean) => void;
  multiRegressionResult: MultiRegressionResult | null;
  suggestion: TermRemovalSuggestion | null;
  reductionHistory: ReductionStep[];
  onRemoveTerm: (term: string) => void;
  onClearHistory: () => void;
  /** Callback to navigate to What-If with the current model */
  onNavigateToWhatIf?: (model: MultiRegressionResult) => void;
  colorScheme?: RegressionViewColorScheme;
}

/**
 * Props for ExpandedScatterModal with colorScheme support
 */
export interface ExpandedScatterModalComponentProps {
  result: RegressionResult;
  specs?: SpecLimits | null;
  onClose: () => void;
  /** Navigate to next scatter chart (right arrow key) */
  onNext?: () => void;
  /** Navigate to previous scatter chart (left arrow key) */
  onPrev?: () => void;
  /** Current 1-based index in the scatter list */
  currentIndex?: number;
  /** Total number of scatter plots available */
  totalCount?: number;
  /** Show branding footer on the chart (free tier = true, paid = false) */
  showBranding?: boolean;
  colorScheme?: RegressionViewColorScheme;
}
