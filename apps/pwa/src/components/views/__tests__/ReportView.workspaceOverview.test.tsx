import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DEFAULT_TIME_LENS, type ProcessHub, type TimeLens } from '@variscout/core';
import type { ImprovementProject } from '@variscout/core/improvementProject';
import ReportView from '../ReportView';

type ProjectStoreMockState = {
  rawData: never[];
  outcome: null;
  factors: never[];
  specs: Record<string, never>;
  columnAliases: Record<string, never>;
  processContext: null;
  cpkTarget: undefined;
  measureSpecs: Record<string, never>;
  displayOptions: Record<string, never>;
  analysisMode: 'standard';
  subgroupConfig: null;
  stageColumn: null;
  filterStack: never[];
  dataFilename: string;
};

type AnalyzeStoreMockState = {
  findings: never[];
  causalLinks: never[];
  hypotheses: never[];
};

type PreferencesStoreMockState = {
  timeLens: TimeLens;
};

vi.mock('@variscout/stores', () => ({
  useProjectStore: vi.fn((selector: (state: ProjectStoreMockState) => unknown) =>
    selector({
      rawData: [],
      outcome: null,
      factors: [],
      specs: {},
      columnAliases: {},
      processContext: null,
      cpkTarget: undefined,
      measureSpecs: {},
      displayOptions: {},
      analysisMode: 'standard',
      subgroupConfig: null,
      stageColumn: null,
      filterStack: [],
      dataFilename: 'workspace.csv',
    })
  ),
  useAnalyzeStore: vi.fn((selector: (state: AnalyzeStoreMockState) => unknown) =>
    selector({
      findings: [],
      causalLinks: [],
      hypotheses: [],
    })
  ),
  usePreferencesStore: vi.fn((selector: (state: PreferencesStoreMockState) => unknown) =>
    selector({
      timeLens: DEFAULT_TIME_LENS,
    })
  ),
}));

const activeHub: ProcessHub = {
  id: 'hub-1',
  name: 'Line 1 Workspace',
  createdAt: 1745539200000,
  updatedAt: 1745539200000,
  deletedAt: null,
};

const informalWorkspaceProject: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  status: 'active',
  metadata: { title: 'Loaded sample data', projectId: 'proj-1' },
  goal: {
    outcomeGoals: [],
    factorControls: [],
    mechanismGoals: [],
  },
  sections: {
    background: {},
    approach: { improvementIdeaIds: [], actionItemIds: [] },
    outcomeReference: {},
  },
  signoff: undefined,
  createdAt: 1745539200000,
  updatedAt: 1745539200000,
  deletedAt: null,
};

beforeEach(() => {
  class ResizeObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  class IntersectionObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
});

describe('PWA ReportView single-project overview truthfulness', () => {
  it('marks empty found/done content as active instead of done', () => {
    const { container } = render(
      <ReportView
        onClose={vi.fn()}
        stats={null}
        specs={{}}
        findings={[]}
        columnAliases={{}}
        dataFilename="workspace.csv"
        sampleCount={0}
        analysisMode="standard"
        hub={activeHub}
        workspaceProject={informalWorkspaceProject}
      />
    );

    expect(
      screen.getByText(
        'No findings, actions, or suspected causes have been recorded for this report yet.'
      )
    ).toBeInTheDocument();
    const foundSection = Array.from(container.querySelectorAll('[data-report-section]')).find(
      section => section.textContent?.includes('What we found + what we did')
    );
    expect(foundSection).toHaveAttribute('data-report-status', 'active');
  });
});
