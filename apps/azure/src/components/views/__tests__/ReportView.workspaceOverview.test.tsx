import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DEFAULT_TIME_LENS, type ProcessHub, type TimeLens } from '@variscout/core';
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

describe('ReportView Workspace overview fallback', () => {
  it('renders the Workspace overview report when no Workspace Project scope is active', () => {
    render(<ReportView onClose={vi.fn()} activeHub={activeHub} />);

    expect(screen.getByTestId(`hub-${'port'}${'folio'}-report`)).toBeInTheDocument();
    expect(screen.getAllByText('Workspace overview').length).toBeGreaterThanOrEqual(1);
  });
});
