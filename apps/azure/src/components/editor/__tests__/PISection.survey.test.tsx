import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
        { SampleTime: '2026-04-01T08:00:00Z', Fill_Weight: 10.1, Machine: 'M1' },
        { SampleTime: '2026-04-01T09:00:00Z', Fill_Weight: 10.4, Machine: 'M2' },
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

vi.mock('@variscout/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/ui')>();
  return {
    ...actual,
    useIsMobile: () => false,
    PIPanelBase: ({
      tabs,
    }: {
      tabs: Array<{ id: string; label: string; content: React.ReactNode }>;
    }) => (
      <div data-testid="pi-panel">
        <div>
          {tabs.map(tab => (
            <button key={tab.id} data-testid={`pi-tab-${tab.id}`} type="button">
              {tab.label}
            </button>
          ))}
        </div>
        {tabs.map(tab => (
          <div key={tab.id} data-testid={`pi-content-${tab.id}`}>
            {tab.content}
          </div>
        ))}
      </div>
    ),
    StatsTabContent: () => <div data-testid="stats-tab-content" />,
    QuestionsTabContent: () => <div data-testid="questions-tab-content" />,
    JournalTabContent: () => <div data-testid="journal-tab-content" />,
    DocumentShelfBase: () => <div data-testid="document-shelf" />,
    WhatIfExplorer: () => <div data-testid="what-if-explorer" />,
    computePresets: vi.fn(() => undefined),
  };
});

vi.mock('@variscout/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/core')>();
  return {
    ...actual,
    hasKnowledgeBase: () => false,
    isPreviewEnabled: () => false,
  };
});

import { PISection } from '../PISection';

function renderPISection() {
  return render(
    <PISection
      bestSubsets={null}
      projectedCpkMap={{}}
      handleQuestionClick={vi.fn()}
      questionsState={
        {
          questions: [],
          addQuestion: vi.fn(),
          focusedQuestionId: null,
          linkFinding: vi.fn(),
        } as never
      }
      findingsState={
        {
          findings: [],
          addFinding: vi.fn(() => ({ id: 'finding-1' })),
        } as never
      }
    />
  );
}

describe('PISection Survey integration', () => {
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
      processContext: { description: 'Filling line' },
      analysisMode: 'standard',
      filters: {},
    });
    usePanelsStore.setState({
      isPISidebarOpen: true,
      piActiveTab: 'stats',
    });
  });

  it('shows Survey as a Process Intelligence tab', () => {
    renderPISection();

    expect(screen.getByTestId('pi-tab-survey')).toBeDefined();
    expect(screen.getAllByText('Survey').length).toBeGreaterThan(0);
  });

  it('promotes an accepted Survey recommendation into processContext.nextMove', () => {
    renderPISection();

    fireEvent.click(screen.getAllByRole('button', { name: /accept next move/i })[0]);

    expect(useProjectStore.getState().processContext?.nextMove).toBe(
      'Set LSL or USL for the mapped outcome.'
    );
  });
});
