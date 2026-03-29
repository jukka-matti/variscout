import React from 'react';
import type { CloudProject } from '../services/storage';
import { PHASE_CONFIG } from '../lib/journeyPhaseConfig';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProjectCardProps {
  project: CloudProject;
  currentUserId: string;
  onClick: () => void;
}

// ── Relative time helper ──────────────────────────────────────────────────────

/**
 * Format a date string or epoch ms as a human-readable relative time.
 * Returns strings like "2h ago", "yesterday", "3 days ago".
 */
export function formatRelativeTime(dateInput: string | number): string {
  const date = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;

  return date.toLocaleDateString();
}

// ── Component ─────────────────────────────────────────────────────────────────

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  currentUserId: _currentUserId,
  onClick,
}) => {
  const { name, modified, modifiedBy, location, metadata } = project;

  const hasOverdueTasks = metadata?.hasOverdueTasks ?? false;
  const assignedTaskCount = metadata?.assignedTaskCount ?? 0;
  const phase = metadata?.phase;
  const phaseConfig = phase ? PHASE_CONFIG[phase] : undefined;

  // Finding + hypothesis + action counts for footer
  const findingTotal = metadata
    ? Object.values(metadata.findingCounts).reduce((sum, n) => sum + n, 0)
    : 0;
  const hypothesisTotal = metadata
    ? Object.values(metadata.hypothesisCounts).reduce((sum, n) => sum + n, 0)
    : 0;
  const overdueActions = metadata?.actionCounts.overdue ?? 0;

  // Location label
  const locationLabel = location === 'team' ? 'Team' : 'Personal';

  // Subtitle: "Personal · Kim updated 2h ago" or "Team · 2h ago"
  const modifiedAgo = formatRelativeTime(modified);
  const subtitleParts: string[] = [locationLabel];
  if (modifiedBy) {
    subtitleParts.push(`${modifiedBy} updated ${modifiedAgo}`);
  } else {
    subtitleParts.push(`Updated ${modifiedAgo}`);
  }
  const subtitle = subtitleParts.join(' · ');

  // Left border accent: amber if overdue tasks, transparent otherwise
  const borderAccent = hasOverdueTasks
    ? 'border-l-4 border-l-amber-500'
    : 'border-l-4 border-l-transparent';

  return (
    <div
      className={`rounded-lg border border-edge bg-surface-secondary p-4 cursor-pointer hover:bg-surface-primary transition-colors space-y-3 ${borderAccent}`}
      onClick={onClick}
      data-testid="project-card"
    >
      {/* Header: project name + phase badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-content leading-snug">{name}</h3>
        {phaseConfig && (
          <span
            className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[0.625rem] font-medium border ${phaseConfig.textColor} ${phaseConfig.bgColor} ${phaseConfig.borderColor}`}
            data-testid="project-card-phase-badge"
          >
            {phaseConfig.label}
          </span>
        )}
      </div>

      {/* Subtitle: location + who updated when */}
      <p className="text-xs text-content-secondary">{subtitle}</p>

      {/* "Your tasks" section — only when assignedTaskCount > 0 */}
      {assignedTaskCount > 0 && (
        <div
          className="flex items-center justify-between rounded-md bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-700 px-3 py-2"
          data-testid="project-card-your-tasks"
        >
          <span className="text-xs text-indigo-700 dark:text-indigo-300">
            {assignedTaskCount} task{assignedTaskCount !== 1 ? 's' : ''} assigned to you
          </span>
          {hasOverdueTasks && (
            <span
              className="text-xs font-medium text-amber-400"
              data-testid="project-card-overdue-flag"
            >
              Overdue
            </span>
          )}
        </div>
      )}

      {/* Footer: counts */}
      {metadata && (
        <div
          className="flex items-center gap-3 text-xs text-content-secondary"
          data-testid="project-card-footer"
        >
          {findingTotal > 0 && (
            <span>
              {findingTotal} finding{findingTotal !== 1 ? 's' : ''}
            </span>
          )}
          {hypothesisTotal > 0 && (
            <span>
              {hypothesisTotal} {hypothesisTotal !== 1 ? 'hypotheses' : 'hypothesis'}
            </span>
          )}
          {overdueActions > 0 && <span className="text-amber-500">{overdueActions} overdue</span>}
          {findingTotal === 0 && hypothesisTotal === 0 && overdueActions === 0 && (
            <span>No findings yet</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
