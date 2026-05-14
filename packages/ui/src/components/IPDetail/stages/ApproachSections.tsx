import React, { useMemo } from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import { projectCauses, type CauseProjectionInputs, type CauseRow } from './causeProjection';
import ApproachCauseCard from './ApproachCauseCard';

interface ApproachSectionsProps {
  ip: ImprovementProject;
  causeInputs: CauseProjectionInputs;
  onOpenWorkbench: (cause: CauseRow) => void;
}

const ApproachSections: React.FC<ApproachSectionsProps> = ({
  ip,
  causeInputs,
  onOpenWorkbench,
}) => {
  const causes = useMemo(() => projectCauses(ip, causeInputs), [ip, causeInputs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--vs-accent)]">
          Approach workbench · {causes.length} suspected {causes.length === 1 ? 'cause' : 'causes'}
        </div>
        <button
          type="button"
          className="rounded-md border border-indigo-200 bg-white px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-50"
          data-testid="approach-add-cause"
        >
          + Add another suspected cause
        </button>
      </div>

      <div className="space-y-3">
        {causes.map(cause => (
          <ApproachCauseCard key={cause.factor} cause={cause} onOpenWorkbench={onOpenWorkbench} />
        ))}
      </div>

      <p className="rounded-md bg-slate-50 p-3 text-xs text-content-secondary">
        Brainstorming, idea selection, and action assignment happen in the Improve workbench. Use
        &quot;Open in Improve workbench&quot; on any cause above. The FK lists update automatically.
      </p>
    </div>
  );
};

export default ApproachSections;
