import React, { useState } from 'react';
import type { CloudProject } from '../services/storage';
import { formatRelativeTime } from './ProjectCard';
import { PHASE_CONFIG } from '../lib/journeyPhaseConfig';
import { buildProjectLink } from '../services/deepLinks';

// ── Types ────────────────────────────────────────────────────────────────────

export interface OtherProjectsListProps {
  projects: CloudProject[];
  currentProjectId: string;
  maxVisible?: number;
  /** Called when the user clicks "View all in Portfolio" */
  onViewPortfolio?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const OtherProjectsList: React.FC<OtherProjectsListProps> = ({
  projects,
  currentProjectId,
  maxVisible = 5,
  onViewPortfolio,
}) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Filter out current project and sort by modified date (newest first)
  const otherProjects = projects
    .filter(p => p.id !== currentProjectId)
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
    .slice(0, maxVisible);

  const handleProjectClick = (project: CloudProject): void => {
    window.open(buildProjectLink(window.location.origin, project.id), '_blank');
  };

  return (
    <div data-testid="other-projects-section">
      {/*
       * Mobile (<sm): a <details> toggle controls visibility of the list.
       * Desktop (sm+): heading always visible, list always visible.
       * We render ONE set of list elements and show/hide using CSS + the
       * isMobileExpanded state.
       */}

      {/* Heading row */}
      {/* Mobile: clickable <summary>-style button; Desktop: plain heading */}
      <div className="sm:hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between cursor-pointer text-sm font-medium text-content select-none py-1"
          aria-expanded={isMobileExpanded}
          data-testid="other-projects-details"
          onClick={() => setIsMobileExpanded(v => !v)}
        >
          <span>Other projects</span>
          <span className="text-content-secondary text-xs">{isMobileExpanded ? '▲' : '▼'}</span>
        </button>
      </div>
      <div className="hidden sm:block">
        <h3 className="text-sm font-medium text-content mb-2">Other projects</h3>
      </div>

      {/* List — hidden on mobile when collapsed */}
      <div
        className={isMobileExpanded ? 'sm:block' : 'hidden sm:block'}
        data-testid="other-projects-list-wrapper"
      >
        <div className="space-y-2" data-testid="other-projects-list">
          {otherProjects.length === 0 ? (
            <p className="text-xs text-content-secondary py-2" data-testid="other-projects-empty">
              No other projects
            </p>
          ) : (
            <>
              <ul className="space-y-1">
                {otherProjects.map(project => {
                  const phase = project.metadata?.phase;
                  const phaseConfig = phase ? PHASE_CONFIG[phase] : undefined;
                  const modifiedAgo = formatRelativeTime(project.modified);

                  return (
                    <li key={project.id}>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left hover:bg-surface-primary transition-colors group"
                        onClick={() => handleProjectClick(project)}
                        data-testid={`other-project-item-${project.id}`}
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-content truncate group-hover:text-content leading-snug">
                            {project.name}
                          </span>
                          <span className="block text-xs text-content-secondary mt-0.5">
                            Updated {modifiedAgo}
                          </span>
                        </span>
                        {phaseConfig && (
                          <span
                            className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[0.625rem] font-medium border ${phaseConfig.textColor} ${phaseConfig.bgColor} ${phaseConfig.borderColor}`}
                            data-testid={`other-project-phase-${project.id}`}
                          >
                            {phaseConfig.label}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="pt-1 border-t border-edge">
                <button
                  type="button"
                  className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                  onClick={onViewPortfolio}
                  data-testid="other-projects-view-all"
                >
                  View all in Portfolio
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherProjectsList;
