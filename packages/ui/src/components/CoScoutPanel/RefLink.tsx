import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Hash,
  BookmarkPlus,
  GitBranch,
  LayoutDashboard,
  FileText,
  MessageSquare,
} from 'lucide-react';

export interface RefLinkProps {
  targetType: string;
  targetId?: string;
  displayText: string;
  onActivate: (targetType: string, targetId?: string) => void;
}

/** Knowledge source types that open an inline citation preview instead of highlighting a chart. */
export const CITATION_TYPES = new Set<string>(['document', 'answer']);

const CHART_LABELS: Record<string, string> = {
  boxplot: 'Boxplot chart',
  pareto: 'Pareto chart',
  yamazumi: 'Yamazumi chart',
  ichart: 'I-Chart',
  stats: 'Stats panel',
  finding: 'Finding',
  question: 'Question',
  dashboard: 'Dashboard',
  improvement: 'Improvement workspace',
  document: 'document',
  answer: 'answer',
};

function getIcon(targetType: string): React.ReactElement {
  switch (targetType) {
    case 'boxplot':
    case 'pareto':
    case 'yamazumi':
      return <BarChart3 size={11} />;
    case 'ichart':
      return <TrendingUp size={11} />;
    case 'stats':
      return <Hash size={11} />;
    case 'finding':
      return <BookmarkPlus size={11} />;
    case 'question':
      return <GitBranch size={11} />;
    case 'document':
      return <FileText size={11} />;
    case 'answer':
      return <MessageSquare size={11} />;
    default:
      return <LayoutDashboard size={11} />;
  }
}

export function RefLink({ targetType, targetId, displayText, onActivate }: RefLinkProps) {
  const label = CHART_LABELS[targetType] ?? targetType;
  const isCitation = CITATION_TYPES.has(targetType);
  return (
    <button
      type="button"
      onClick={() => onActivate(targetType, targetId)}
      className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-blue-400 hover:text-blue-300 bg-blue-500/[0.08] hover:bg-blue-500/15 underline decoration-dotted transition-colors cursor-pointer"
      title={isCitation ? `Click to preview ${label}` : `Click to highlight in ${label}`}
      aria-label={
        isCitation
          ? `${displayText} — Click to preview ${label}`
          : `${displayText} — Click to highlight in ${label}`
      }
    >
      {getIcon(targetType)}
      <span>{displayText}</span>
    </button>
  );
}
