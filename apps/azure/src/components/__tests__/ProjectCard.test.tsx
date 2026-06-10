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
    questionCounts: {},
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
    const project = makeProject({ metadata: makeMetadata({ phase: 'analyze' }) });
    render(<ProjectCard {...defaultProps} project={project} />);
    expect(screen.getByTestId('project-card-phase-badge')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-phase-badge')).toHaveTextContent('Analyze');
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
        questionCounts: { open: 1 },
      }),
    });
    render(<ProjectCard {...defaultProps} project={project} />);
    const footer = screen.getByTestId('project-card-footer');
    expect(footer).toHaveTextContent('5 findings');
    expect(footer).toHaveTextContent('1 question');
  });

  it('does not render a Your-tasks block (work-item layer shed in §8 / PO-4)', () => {
    const project = makeProject({ metadata: makeMetadata() });
    render(<ProjectCard {...defaultProps} project={project} />);
    expect(screen.queryByTestId('project-card-your-tasks')).not.toBeInTheDocument();
  });

  it('always uses transparent left border (static — no amber work-item accent)', () => {
    const project = makeProject({ metadata: makeMetadata() });
    render(<ProjectCard {...defaultProps} project={project} />);
    const card = screen.getByTestId('project-card');
    expect(card.className).not.toContain('border-l-amber-500');
    expect(card.className).toContain('border-l-transparent');
  });

  // ── negative control ─────────────────────────────────────────────────────────
  // PO-4 shed the work-item + narrative projection fields from ProjectMetadata.
  // The card renders only the KEEP-set surfaces; none of the shed surfaces
  // (status chip, depth label, Your-tasks block, work-item amber accent) come back.
  //
  // The one REAL surviving re-check surface is the control-check chip
  // (data-testid="project-card-control-check"), driven by
  // `metadata.sustainment.nextCheckSuggestedAt`. It must be ABSENT when no
  // sustainment is set.
  it('negative control: shed surfaces absent; control-due chip absent without sustainment', () => {
    const project = makeProject({
      metadata: makeMetadata({ processHubId: 'line-4' }),
      // No sustainment -> nextCheckSuggestedAt is absent -> no control-check chip
    });
    render(<ProjectCard {...defaultProps} project={project} />);
    const card = screen.getByTestId('project-card');

    // Work-item surfaces (shed in PO-4) do not render
    expect(card.className).not.toContain('border-l-amber-500');
    expect(screen.queryByTestId('project-card-your-tasks')).not.toBeInTheDocument();

    // The surviving control-check chip is ABSENT when sustainment has no nextCheckSuggestedAt
    expect(screen.queryByTestId('project-card-control-check')).not.toBeInTheDocument();

    // The KEEP-set processHubId line still renders
    expect(screen.getByTestId('project-card-hub')).toHaveTextContent('line-4');
  });

  // ── control re-check chip ────────────────────────────────────────────────────

  it('shows suggested chip when nextCheckSuggestedAt is in the past', () => {
    const pastDate = new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
    const project = makeProject({
      metadata: makeMetadata({
        sustainment: {
          recordId: 'r-1',
          ladderStep: 0,
          status: 'verifying',
          nextCheckSuggestedAt: pastDate,
        },
      }),
    });
    render(<ProjectCard {...defaultProps} project={project} />);
    const chip = screen.getByTestId('project-card-control-check');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent('Re-check suggested');
    expect(chip.className).toContain('amber');
  });

  it('shows planned chip when nextCheckSuggestedAt is in the future', () => {
    const futureDate = new Date(NOW + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days from now
    const project = makeProject({
      metadata: makeMetadata({
        sustainment: {
          recordId: 'r-2',
          ladderStep: 1,
          status: 'verifying',
          nextCheckSuggestedAt: futureDate,
        },
      }),
    });
    render(<ProjectCard {...defaultProps} project={project} />);
    const chip = screen.getByTestId('project-card-control-check');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent('Re-check planned');
    expect(chip.className).not.toContain('amber');
  });

  it('shows no control chip when sustainment is absent', () => {
    const project = makeProject({ metadata: makeMetadata() });
    render(<ProjectCard {...defaultProps} project={project} />);
    expect(screen.queryByTestId('project-card-control-check')).not.toBeInTheDocument();
  });

  it('shows no control chip when sustainment exists but nextCheckSuggestedAt is absent', () => {
    const project = makeProject({
      metadata: makeMetadata({
        sustainment: {
          recordId: 'r-3',
          ladderStep: 0,
          status: 'verifying',
        },
      }),
    });
    render(<ProjectCard {...defaultProps} project={project} />);
    expect(screen.queryByTestId('project-card-control-check')).not.toBeInTheDocument();
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
