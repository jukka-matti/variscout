import React from 'react';

export interface CauseSummary {
  id: string;
  factor: string;
  evidence: string;
  role: 'suspected-cause' | 'contributing' | 'ruled-out';
  ideaCount: number;
  actionCount: number;
  color: string;
}

export interface ImprovementContextPanelProps {
  problemStatement?: string;
  targetCpk?: number;
  currentCpk?: number;
  causes: CauseSummary[];
  synthesis?: string;
}

const ROLE_LABEL: Record<CauseSummary['role'], string> = {
  'suspected-cause': 'Suspected Cause',
  contributing: 'Contributing',
  'ruled-out': 'Ruled Out',
};

const ROLE_STYLE: Record<CauseSummary['role'], string> = {
  'suspected-cause': 'bg-red-500/15 text-red-500',
  contributing: 'bg-amber-500/15 text-amber-500',
  'ruled-out': 'bg-surface text-content-muted line-through',
};

export const ImprovementContextPanel: React.FC<ImprovementContextPanelProps> = ({
  problemStatement,
  targetCpk,
  currentCpk,
  causes,
  synthesis,
}) => {
  const activeCauses = causes.filter(c => c.role !== 'ruled-out');
  const ruledOut = causes.filter(c => c.role === 'ruled-out');

  return (
    <div
      data-testid="improvement-context-panel"
      className="flex flex-col gap-4 overflow-y-auto h-full px-3 py-3"
    >
      {/* Panel header */}
      <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-content-muted select-none">
        Improvement Context
      </p>

      {/* Problem Statement */}
      <section data-testid="context-problem-statement-section">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-content-muted mb-1.5">
          Problem Statement
        </h3>
        <div className="rounded-md border-l-4 border-amber-500 bg-surface-secondary px-3 py-2.5">
          {problemStatement ? (
            <p
              data-testid="context-problem-statement"
              className="text-sm text-content leading-snug whitespace-pre-wrap"
            >
              {problemStatement}
            </p>
          ) : (
            <p className="text-sm italic text-content-muted">No problem statement defined.</p>
          )}
        </div>
      </section>

      {/* Improvement Target */}
      {(targetCpk != null || currentCpk != null) && (
        <section data-testid="context-improvement-target-section">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-content-muted mb-1.5">
            Capability Target
          </h3>
          <div className="rounded-md border border-edge bg-surface-secondary px-3 py-2.5 flex items-center gap-4">
            {targetCpk != null && (
              <div className="flex flex-col items-center">
                <span
                  data-testid="context-target-cpk"
                  className="text-2xl font-bold text-green-500 leading-none"
                >
                  {targetCpk.toFixed(2)}
                </span>
                <span className="text-[0.625rem] text-content-muted mt-0.5 uppercase tracking-wide">
                  Target Cpk
                </span>
              </div>
            )}
            {targetCpk != null && currentCpk != null && (
              <div className="w-px h-8 bg-edge shrink-0" />
            )}
            {currentCpk != null && (
              <div className="flex flex-col items-center">
                <span
                  data-testid="context-current-cpk"
                  className="text-lg font-semibold text-red-400 leading-none"
                >
                  {currentCpk.toFixed(2)}
                </span>
                <span className="text-[0.625rem] text-content-muted mt-0.5 uppercase tracking-wide">
                  Current Cpk
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Suspected Causes */}
      {causes.length > 0 && (
        <section data-testid="context-causes-section">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-content-muted mb-1.5">
            Suspected Causes
          </h3>
          <div className="flex flex-col gap-1.5">
            {activeCauses.map(cause => (
              <CauseRow key={cause.id} cause={cause} />
            ))}
            {ruledOut.length > 0 && (
              <>
                {activeCauses.length > 0 && <div className="border-t border-edge my-0.5" />}
                {ruledOut.map(cause => (
                  <CauseRow key={cause.id} cause={cause} />
                ))}
              </>
            )}
          </div>
        </section>
      )}

      {/* Synthesis */}
      {synthesis && (
        <section data-testid="context-synthesis-section">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-content-muted mb-1.5">
            Synthesis
          </h3>
          <div className="rounded-md border border-edge bg-surface-secondary px-3 py-2.5">
            <p
              data-testid="context-synthesis"
              className="text-sm text-content leading-snug whitespace-pre-wrap"
            >
              {synthesis}
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

interface CauseRowProps {
  cause: CauseSummary;
}

const CauseRow: React.FC<CauseRowProps> = ({ cause }) => {
  return (
    <div
      data-testid={`context-cause-${cause.id}`}
      className="flex items-start gap-2 rounded-md border border-edge bg-surface-secondary px-2.5 py-2"
    >
      {/* Color indicator */}
      <span
        className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: cause.color }}
      />

      <div className="flex-1 min-w-0">
        {/* Factor name */}
        <p className="text-xs font-medium text-content truncate" title={cause.factor}>
          {cause.factor}
        </p>

        {/* Evidence + role */}
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {cause.evidence && (
            <span className="text-[0.6875rem] text-content-muted">{cause.evidence}</span>
          )}
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0 text-[0.5625rem] font-semibold uppercase tracking-wide ${ROLE_STYLE[cause.role]}`}
          >
            {ROLE_LABEL[cause.role]}
          </span>
        </div>
      </div>

      {/* Idea / action counts */}
      <div className="flex flex-col items-end shrink-0 gap-0.5">
        {cause.ideaCount > 0 && (
          <span
            data-testid={`context-cause-ideas-${cause.id}`}
            className="text-[0.6875rem] text-content-secondary"
          >
            {cause.ideaCount} idea{cause.ideaCount !== 1 ? 's' : ''}
          </span>
        )}
        {cause.actionCount > 0 && (
          <span
            data-testid={`context-cause-actions-${cause.id}`}
            className="text-[0.6875rem] text-green-500"
          >
            {cause.actionCount} action{cause.actionCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
};
