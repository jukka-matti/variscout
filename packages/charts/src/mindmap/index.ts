// Types
export type {
  CategoryData,
  MindmapNode,
  MindmapMode,
  NarrativeStep,
  InvestigationMindmapProps,
} from './types';

// Layout
export { computeLayout, computeTimelineLayout } from './layout';

// Helpers
export {
  MIN_NODE_RADIUS,
  MAX_NODE_RADIUS,
  CENTER_NODE_RADIUS,
  PROGRESS_BAR_HEIGHT,
  MARGIN,
  getNodeRadius,
  getNodeFill,
  getNodeStroke,
} from './helpers';

// Sub-components
export { default as StepAnnotation } from './StepAnnotation';
export type { StepAnnotationProps } from './StepAnnotation';
export { default as ConclusionPanel } from './ConclusionPanel';
export type { ConclusionPanelProps } from './ConclusionPanel';
export { default as CategoryPopover } from './CategoryPopover';
export type { CategoryPopoverProps } from './CategoryPopover';
export { default as ProgressFooter } from './ProgressFooter';
export type { ProgressFooterProps } from './ProgressFooter';
