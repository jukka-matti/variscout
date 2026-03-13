import type { Finding, FindingAssignee } from '@variscout/core';

/**
 * Grouped findings-related callbacks passed from Editor → Dashboard → child charts.
 * Reduces prop drilling by bundling 8+ related props into a single interface.
 */
export interface FindingsCallbacks {
  onPinFinding?: (noteText?: string) => void;
  onAddChartObservation?: (
    chartType: 'boxplot' | 'pareto' | 'ichart',
    categoryKey?: string,
    noteText?: string,
    anchorX?: number,
    anchorY?: number
  ) => Finding | void;
  onEditFinding?: (id: string, text: string) => void;
  onDeleteFinding?: (id: string) => void;
  onShareFinding?: (finding: Finding, assignee?: FindingAssignee) => Promise<boolean>;
  onSetFindingAssignee?: (id: string, assignee: FindingAssignee | null) => void;
  chartFindings?: { boxplot: Finding[]; pareto: Finding[]; ichart: Finding[] };
  canMentionInChannel?: boolean;
}
