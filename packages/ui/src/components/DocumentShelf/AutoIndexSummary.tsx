import React from 'react';
import { Info } from 'lucide-react';
import type { AutoIndexSummaryData } from './types';

export type AutoIndexSummaryProps = AutoIndexSummaryData;

const TOOLTIP_TEXT =
  'CoScout automatically indexes your investigation artifacts so they are available as context when you ask questions. No manual tagging required.';

const AutoIndexSummary: React.FC<AutoIndexSummaryProps> = ({ findings, answers, conclusions }) => {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-2 border-t border-edge/50 text-[0.625rem] text-content-muted"
      data-testid="auto-index-summary"
    >
      <Info size={10} className="shrink-0" />
      <span>
        CoScout also searches:{' '}
        <span className="text-content-secondary" data-testid="auto-index-findings">
          {findings} findings
        </span>
        {' · '}
        <span className="text-content-secondary" data-testid="auto-index-answers">
          {answers} answers
        </span>
        {' · '}
        <span className="text-content-secondary" data-testid="auto-index-conclusions">
          {conclusions} conclusions
        </span>
      </span>
      <span className="relative group ml-auto" data-testid="auto-index-info" title={TOOLTIP_TEXT}>
        <Info size={10} className="text-content-muted cursor-help" />
      </span>
    </div>
  );
};

export default AutoIndexSummary;
