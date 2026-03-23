import type { Finding, FindingAssignee } from '@variscout/core';

/**
 * Core finding callbacks shared by PWA and Azure dashboards.
 * Bundles chart-level finding operations (observation, edit, delete)
 * to reduce prop drilling through Dashboard → chart components.
 *
 * Note: onPinFinding is NOT here — it's a Dashboard-level concern
 * (pins current filter state) and lives as a flat Dashboard prop.
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

/**
 * Azure extension adding Teams integration features
 * (sharing, assignees, channel mentions).
 */
export interface AzureFindingsCallbacks extends FindingsCallbacks {
  onShareFinding?: (finding: Finding, assignee?: FindingAssignee) => Promise<boolean>;
  onSetFindingAssignee?: (id: string, assignee: FindingAssignee | null) => void;
  canMentionInChannel?: boolean;
}
