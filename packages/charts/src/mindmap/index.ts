// Types
export type {
  CategoryData,
  MindmapNode,
  MindmapEdge,
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
  EDGE_MIN_WIDTH,
  EDGE_MAX_WIDTH,
  getNodeRadius,
  getNodeFill,
  getNodeStroke,
  getEdgeWidth,
  getEdgeOpacity,
  getVisibleEdges,
} from './helpers';

// Sub-components
export { default as StepAnnotation } from './StepAnnotation';
export type { StepAnnotationProps } from './StepAnnotation';
export { default as ConclusionPanel } from './ConclusionPanel';
export type { ConclusionPanelProps } from './ConclusionPanel';
export { default as CategoryPopover } from './CategoryPopover';
export type { CategoryPopoverProps } from './CategoryPopover';
export { default as EdgeTooltip } from './EdgeTooltip';
export type { EdgeTooltipProps } from './EdgeTooltip';
export { default as ProgressFooter } from './ProgressFooter';
export type { ProgressFooterProps } from './ProgressFooter';
