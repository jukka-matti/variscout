import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard, { formatRelativeTime } from '../ProjectCard';
import type { CloudProject } from '../../services/storage';
import type { ProjectMetadata } from '@variscout/core';

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW = new Date('2026-03-23T12:00:00.000Z').getTime();

function makeMetadata(overrides: Partial<ProjectMetadata> = {}): ProjectMetadata {
  return {
    phase: 'scout',
    findingCounts: {},
    hypothesisCounts: {},
    actionCounts: { total: 0, completed: 0, overdue: 0 },
    assignedTaskCount: 0,
    hasOverdueTasks: false,
    lastViewedAt: {},
    ...overrides,
  };
}

function makeProject(overrides: Partial<CloudProject> = {}): CloudProject {
  return {
    id: 'p-1',
    name: 'Coffee Line 3',
    modified: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    modifiedBy: 'Kim',
    location: 'team',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProjectCard', () => {
  const defaultProps = {
    project: makeProject(),
    currentUserId: 'jane@contoso.com',
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders project name and location', () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText('Coffee Line 3')).toBeInTheDocument();
    expect(screen.getByText(/Team/)).toBeInTheDocument();
  });

  it('renders phase badge when metadata is present', () => {
    const project = makeProject({ metadata: makeMetadata({ phase: 'investigate' }) });
    render(<ProjectCard {...defaultProps} project={project} />);
    expect(screen.getByTestId('project-card-phase-badge')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-phase-badge')).toHaveTextContent('INVESTIGATE');
  });

  it('does not render phase badge without metadata', () => {
    const project = makeProject(); // no metadata
    render(<ProjectCard {...defaultProps} project={project} />);
    expect(screen.queryByTestId('project-card-phase-badge')).not.toBeInTheDocument();
  });

  it('renders finding counts when metadata present', () => {
    const project = makeProject({
      metadata: makeMetadata({
        findingCounts: { observed: 3, investigating: 2 },
        hypothesisCounts: { untested: 1 },
      }),
    });
    render(<ProjectCard {...defaultProps} project={project} />);
    const footer = screen.getByTestId('project-card-footer');
    expect(footer).toHaveTextContent('5 findings');
    expect(footer).toHaveTextContent('1 hypothesis');
  });

  it('shows Your tasks section when assignedTaskCount > 0', () => {
    const project = makeProject({
      metadata: makeMetadata({ assignedTaskCount: 2 }),
    });
    render(<ProjectCard {...defaultProps} project={project} />);
    expect(screen.getByTestId('project-card-your-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-your-tasks')).toHaveTextContent(
      '2 tasks assigned to you'
    );
  });

  it('hides Your tasks section when assignedTaskCount === 0', () => {
    const project = makeProject({ metadata: makeMetadata({ assignedTaskCount: 0 }) });
    render(<ProjectCard {...defaultProps} project={project} />);
    expect(screen.queryByTestId('project-card-your-tasks')).not.toBeInTheDocument();
  });

  it('shows amber border when hasOverdueTasks is true', () => {
    const project = makeProject({
      metadata: makeMetadata({ assignedTaskCount: 1, hasOverdueTasks: true }),
    });
    render(<ProjectCard {...defaultProps} project={project} />);
    const card = screen.getByTestId('project-card');
    expect(card.className).toContain('border-l-amber-500');
  });

  it('does not show amber border when hasOverdueTasks is false', () => {
    const project = makeProject({
      metadata: makeMetadata({ hasOverdueTasks: false }),
    });
    render(<ProjectCard {...defaultProps} project={project} />);
    const card = screen.getByTestId('project-card');
    expect(card.className).not.toContain('border-l-amber-500');
    expect(card.className).toContain('border-l-transparent');
  });

  it('shows overdue flag inside Your tasks when hasOverdueTasks', () => {
    const project = makeProject({
      metadata: makeMetadata({ assignedTaskCount: 1, hasOverdueTasks: true }),
    });
    render(<ProjectCard {...defaultProps} project={project} />);
    expect(screen.getByTestId('project-card-overdue-flag')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(<ProjectCard {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('project-card'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('handles missing metadata gracefully (basic card)', () => {
    const project = makeProject({ metadata: undefined });
    render(<ProjectCard {...defaultProps} project={project} />);
    // Should render name and subtitle, no footer, no phase badge
    expect(screen.getByText('Coffee Line 3')).toBeInTheDocument();
    expect(screen.queryByTestId('project-card-footer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('project-card-phase-badge')).not.toBeInTheDocument();
  });

  it('shows relative time in subtitle', () => {
    // Project modified 2h ago — subtitle should contain "2h ago"
    const project = makeProject({
      modified: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(),
      modifiedBy: 'Kim',
    });
    render(<ProjectCard {...defaultProps} project={project} />);
    expect(screen.getByText(/Kim updated 2h ago/)).toBeInTheDocument();
  });

  it('shows subtitle without modifier name when modifiedBy is absent', () => {
    const project = makeProject({ modifiedBy: undefined });
    render(<ProjectCard {...defaultProps} project={project} />);
    expect(screen.getByText(/Updated 2h ago/)).toBeInTheDocument();
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for very recent timestamps', () => {
    expect(formatRelativeTime(NOW - 30 * 1000)).toBe('just now');
  });

  it('returns minutes ago', () => {
    expect(formatRelativeTime(NOW - 5 * 60 * 1000)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    expect(formatRelativeTime(NOW - 3 * 60 * 60 * 1000)).toBe('3h ago');
  });

  it('returns "yesterday" for ~24h ago', () => {
    expect(formatRelativeTime(NOW - 25 * 60 * 60 * 1000)).toBe('yesterday');
  });

  it('returns days ago for 2–29 days', () => {
    expect(formatRelativeTime(NOW - 5 * 24 * 60 * 60 * 1000)).toBe('5 days ago');
  });
});
