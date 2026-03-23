import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OtherProjectsList from '../OtherProjectsList';
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

function makeProject(id: string, overrides: Partial<CloudProject> = {}): CloudProject {
  return {
    id,
    name: `Project ${id}`,
    modified: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(),
    location: 'team',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OtherProjectsList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the section container', () => {
    render(<OtherProjectsList projects={[]} currentProjectId="p-1" />);
    expect(screen.getByTestId('other-projects-section')).toBeInTheDocument();
  });

  it('shows empty state when no other projects exist', () => {
    const projects = [makeProject('p-1')];
    render(<OtherProjectsList projects={projects} currentProjectId="p-1" />);
    expect(screen.getByTestId('other-projects-empty')).toBeInTheDocument();
    expect(screen.getByText('No other projects')).toBeInTheDocument();
  });

  it('filters out the current project', () => {
    const projects = [makeProject('p-1'), makeProject('p-2'), makeProject('p-3')];
    render(<OtherProjectsList projects={projects} currentProjectId="p-1" />);
    const list = screen.getByTestId('other-projects-list');
    expect(list).toBeInTheDocument();
    expect(screen.queryByTestId('other-project-item-p-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('other-project-item-p-2')).toBeInTheDocument();
    expect(screen.getByTestId('other-project-item-p-3')).toBeInTheDocument();
  });

  it('sorts projects by modified date (newest first)', () => {
    const older = makeProject('p-older', {
      name: 'Older project',
      modified: new Date(NOW - 5 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const newer = makeProject('p-newer', {
      name: 'Newer project',
      modified: new Date(NOW - 1 * 60 * 60 * 1000).toISOString(),
    });
    render(<OtherProjectsList projects={[older, newer]} currentProjectId="p-current" />);
    const newerItem = screen.getByTestId('other-project-item-p-newer');
    const olderItem = screen.getByTestId('other-project-item-p-older');
    // Newer should appear before older in the DOM
    expect(
      newerItem.compareDocumentPosition(olderItem) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('respects the maxVisible limit (default 5)', () => {
    const projects = Array.from({ length: 8 }, (_, i) => makeProject(`p-${i}`));
    render(<OtherProjectsList projects={projects} currentProjectId="p-99" />);
    const list = screen.getByTestId('other-projects-list');
    const items = list.querySelectorAll('[data-testid^="other-project-item-"]');
    expect(items).toHaveLength(5);
  });

  it('respects a custom maxVisible prop', () => {
    const projects = Array.from({ length: 8 }, (_, i) => makeProject(`p-${i}`));
    render(<OtherProjectsList projects={projects} currentProjectId="p-99" maxVisible={3} />);
    const list = screen.getByTestId('other-projects-list');
    const items = list.querySelectorAll('[data-testid^="other-project-item-"]');
    expect(items).toHaveLength(3);
  });

  it('renders project name and relative time for each entry', () => {
    const project = makeProject('p-2', {
      name: 'Coffee Line 3',
      modified: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(),
    });
    render(<OtherProjectsList projects={[project]} currentProjectId="p-1" />);
    expect(screen.getByText('Coffee Line 3')).toBeInTheDocument();
    expect(screen.getByText('Updated 2h ago')).toBeInTheDocument();
  });

  it('renders phase badge when metadata is present', () => {
    const project = makeProject('p-2', {
      metadata: makeMetadata({ phase: 'investigate' }),
    });
    render(<OtherProjectsList projects={[project]} currentProjectId="p-1" />);
    expect(screen.getByTestId('other-project-phase-p-2')).toBeInTheDocument();
    expect(screen.getByTestId('other-project-phase-p-2')).toHaveTextContent('INVESTIGATE');
  });

  it('does not render phase badge without metadata', () => {
    const project = makeProject('p-2'); // no metadata
    render(<OtherProjectsList projects={[project]} currentProjectId="p-1" />);
    expect(screen.queryByTestId('other-project-phase-p-2')).not.toBeInTheDocument();
  });

  it('opens project in new tab on click', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const project = makeProject('p-2');
    render(<OtherProjectsList projects={[project]} currentProjectId="p-1" />);
    fireEvent.click(screen.getByTestId('other-project-item-p-2'));
    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('?project=p-2'), '_blank');
  });

  it('calls onViewPortfolio when "View all in Portfolio" is clicked', () => {
    const onViewPortfolio = vi.fn();
    const project = makeProject('p-2');
    render(
      <OtherProjectsList
        projects={[project]}
        currentProjectId="p-1"
        onViewPortfolio={onViewPortfolio}
      />
    );
    fireEvent.click(screen.getByTestId('other-projects-view-all'));
    expect(onViewPortfolio).toHaveBeenCalledOnce();
  });

  it('renders "View all in Portfolio" link when projects are present', () => {
    const project = makeProject('p-2');
    render(<OtherProjectsList projects={[project]} currentProjectId="p-1" />);
    expect(screen.getByTestId('other-projects-view-all')).toBeInTheDocument();
    expect(screen.getByText('View all in Portfolio')).toBeInTheDocument();
  });

  it('does not render "View all in Portfolio" when no other projects', () => {
    render(<OtherProjectsList projects={[]} currentProjectId="p-1" />);
    expect(screen.queryByTestId('other-projects-view-all')).not.toBeInTheDocument();
  });

  it('renders mobile expandable toggle element', () => {
    const project = makeProject('p-2');
    render(<OtherProjectsList projects={[project]} currentProjectId="p-1" />);
    expect(screen.getByTestId('other-projects-details')).toBeInTheDocument();
  });
});
