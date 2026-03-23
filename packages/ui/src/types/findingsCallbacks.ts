import type { Finding, FindingAssignee } from '@variscout/core';

/**
 * Core finding callbacks shared by PWA and Azure dashboards.
 * Reduces prop drilling by bundling related findings props into a single interface.
 */
export interface FindingsCallbacks {
  onAddChartObservation?: (
    chartType: 'boxplot' | 'pareto' | 'ichart',
    categoryKey?: string,
    noteText?: string,
    anchorX?: number,
    anchorY?: number
  ) => Finding | void;
  onEditFinding?: (id: string, text: string) => void;
  onDeleteFinding?: (id: string) => void;
  chartFindings?: { boxplot: Finding[]; pareto: Finding[]; ichart: Finding[] };
}

/** Azure extension with Teams integration features. */
export interface AzureFindingsCallbacks extends FindingsCallbacks {
  onPinFinding?: (noteText?: string) => void;
  onShareFinding?: (finding: Finding, assignee?: FindingAssignee) => Promise<boolean>;
  onSetFindingAssignee?: (id: string, assignee: FindingAssignee | null) => void;
  canMentionInChannel?: boolean;
}
