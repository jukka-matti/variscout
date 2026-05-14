import React from 'react';
import type { ImprovementProject } from '@variscout/core/improvementProject';

interface IPDetailTeamRailProps {
  ip: ImprovementProject;
}

const IPDetailTeamRail: React.FC<IPDetailTeamRailProps> = ({ ip }) => {
  const teamCount = (ip.metadata.team ?? []).length;
  return (
    <aside
      className="hidden w-[280px] flex-shrink-0 border-l border-edge bg-slate-50 p-4 text-xs lg:block"
      data-testid="ip-detail-team-rail"
      aria-label="Team workspace"
    >
      <div className="uppercase tracking-wide text-content-tertiary">Team · {teamCount}</div>
      <p className="mt-2 text-content-secondary">
        Team roster + activity feed + signoff ship in Plan 3.
      </p>
    </aside>
  );
};

export default IPDetailTeamRail;
