import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectStore } from '@variscout/stores';
import { usePanelsStore } from '../../../features/panels/panelsStore';

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useResizablePanel: () => ({
      width: 320,
      isDragging: false,
      handleMouseDown: vi.fn(),
    }),
    useFilteredData: () => ({
      filteredData: [
        { Fill_Weight: 10.1, Machine: 'M1' },
        { Fill_Weight: 10.4, Machine: 'M2' },
      ],
    }),
    useAnalysisStats: () => ({
      stats: { mean: 10.25, median: 10.25, stdDev: 0.2, cpk: undefined },
    }),
    useDocumentShelf: () => ({
      documents: [],
      upload: vi.fn(),
      remove: vi.fn(),
      download: vi.fn(),
      isUploading: false,
      uploadProgress: 0,
      error: null,
    }),
  };
});

// Mock PIPanelBase to render BOTH tabs and overflow items so the What-If gate
// is assertable.
vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    PIPanelBase: ({ overflowItems }: { overflowItems?: Array<{ id: string; label: string }> }) => (
      <div data-testid="pi-panel">
        {(overflowItems ?? []).map(item => (
          <div key={item.id} data-testid={`pi-overflow-item-${item.id}`}>
            {item.label}
          </div>
        ))}
      </div>
    ),
    StatsTabContent: () => <div data-testid="stats-tab-content" />,
    JournalTabContent: () => <div data-testid="journal-tab-content" />,
    SurveyNotebookBase: () => <div data-testid="survey-notebook" />,
    DocumentShelfBase: () => <div data-testid="document-shelf" />,
    WhatIfExplorer: () => <div data-testid="what-if-explorer" />,
    computePresets: vi.fn(() => undefined),
  };
});

vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    isPreviewEnabled: () => false,
  };
});

import { PISection } from '../PISection';

function renderPISection() {
  return render(
    <PISection
      bestSubsets={null}
      projectedCpkMap={{}}
      findingsState={
        {
          findings: [],
          addFinding: vi.fn(() => ({ id: 'finding-1' })),
        } as never
      }
    />
  );
}

describe('PISection What-If gate (per-measure specs)', () => {
  beforeEach(() => {
    useProjectStore.setState({
      rawData: [
        { Fill_Weight: 10.1, Machine: 'M1' },
        { Fill_Weight: 10.4, Machine: 'M2' },
      ],
      outcome: 'Fill_Weight',
      factors: ['Machine'],
      timeColumn: null,
      specs: {},
      measureSpecs: {},
      processContext: { description: 'Filling line' },
      analysisMode: 'standard',
      filters: {},
    });
    usePanelsStore.setState({
      isPISidebarOpen: true,
      piActiveTab: 'stats',
    });
  });

  it('hides the What-If entry when neither global nor per-measure specs exist', () => {
    renderPISection();
    expect(screen.queryByTestId('pi-overflow-item-whatif')).toBeNull();
  });

  it('shows the What-If entry when only a per-measure spec exists (global specs empty)', () => {
    useProjectStore.setState({
      specs: {},
      measureSpecs: { Fill_Weight: { usl: 11, lsl: 9 } },
    });
    renderPISection();
    expect(screen.getByTestId('pi-overflow-item-whatif')).toBeInTheDocument();
  });
});
