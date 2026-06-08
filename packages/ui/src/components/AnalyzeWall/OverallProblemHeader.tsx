import React from 'react';

export interface OverallProblemHeaderProps {
  issueStatement?: string | null;
  outcomeLabel?: string | null;
  targetLabel?: string | null;
  problemStatement?: string | null;
  problemStatementDraft?: string | null;
  scopeBranchCount: number;
}

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function OverallProblemHeader({
  issueStatement,
  outcomeLabel,
  targetLabel,
  problemStatement,
  problemStatementDraft,
  scopeBranchCount,
}: OverallProblemHeaderProps): React.ReactElement {
  const issue = cleanText(issueStatement) ?? 'Issue not set';
  const problem =
    cleanText(problemStatement) ??
    cleanText(problemStatementDraft) ??
    'Problem statement draft pending';
  const outcome = cleanText(outcomeLabel) ?? 'Outcome not selected';
  const target = cleanText(targetLabel) ?? 'target not set';
  const scopeStatus =
    scopeBranchCount === 0
      ? 'scope to be determined'
      : `${scopeBranchCount} open scope branch${scopeBranchCount === 1 ? '' : 'es'}`;

  return (
    <section
      aria-label="Overall problem"
      className="border-b border-edge bg-surface px-3 py-2"
      data-testid="overall-problem-header"
    >
      <div className="grid gap-2 text-xs text-content-secondary md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto]">
        <div className="min-w-0">
          <div className="font-medium uppercase tracking-normal text-content-tertiary">Issue</div>
          <div className="truncate text-content">{issue}</div>
        </div>
        <div className="min-w-0">
          <div className="font-medium uppercase tracking-normal text-content-tertiary">Outcome</div>
          <div className="truncate text-content">
            {outcome}
            <span className="text-content-tertiary"> · </span>
            <span className="text-content-tertiary">{target}</span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-medium uppercase tracking-normal text-content-tertiary">
            Problem statement
          </div>
          <div className="truncate text-content">{problem}</div>
        </div>
        <div className="min-w-0 md:text-right">
          <div className="font-medium uppercase tracking-normal text-content-tertiary">Scopes</div>
          <div className="whitespace-nowrap text-content">{scopeStatus}</div>
        </div>
      </div>
    </section>
  );
}
