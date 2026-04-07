/**
 * Tests for InvestigationMapView — EdgeMiniChart wiring and enriched CoScout context.
 *
 * Mock strategy:
 * - @variscout/charts: mock EvidenceMapBase to expose onEdgeClick trigger
 * - @variscout/hooks: mock useEvidenceMapData to return minimal relationship edge data
 * - panelsStore: mock to prevent Zustand overhead in these unit tests
 * - @variscout/ui: NOT mocked — real EdgeDetailCard and EdgeMiniChart render so we can
 *   verify SVG output and data-testid attributes
 * - @variscout/core/stats: NOT mocked — mapRelationshipType runs real implementation
 *
 * IMPORTANT: vi.mock() calls must appear before any component imports.
 */
import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── 1. Mocks BEFORE component imports ──────────────────────────────────────

vi.mock('@variscout/charts', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/charts')>();
  return {
    ...actual,
    EvidenceMapBase: (props: {
      onEdgeClick?: (factorA: string, factorB: string) => void;
      [key: string]: unknown;
    }) => {
      return (
        <div data-testid="evidence-map-base">
          <button
            data-testid="trigger-edge-click"
            onClick={() => props.onEdgeClick?.('Temperature', 'Moisture')}
          >
            Click edge
          </button>
        </div>
      );
    },
  };
});

const mockRelationshipEdges = [
  {
    factorA: 'Temperature',
    factorB: 'Moisture',
    type: 'interactive' as const,
    strength: 0.72,
    ax: 100,
    ay: 200,
    bx: 300,
    by: 400,
    label: '',
    strokeWidth: 2,
    opacity: 0.8,
  },
];

const mockMapData = {
  outcomeNode: null,
  factorNodes: [
    {
      factor: 'Temperature',
      x: 100,
      y: 200,
      label: '',
      metricLabel: '',
      rSquaredAdj: 0.5,
      trendGlyph: undefined,
      optimum: undefined,
      evidenceBadges: [],
      isPending: false,
    },
    {
      factor: 'Moisture',
      x: 300,
      y: 400,
      label: '',
      metricLabel: '',
      rSquaredAdj: 0.4,
      trendGlyph: undefined,
      optimum: undefined,
      evidenceBadges: [],
      isPending: false,
    },
  ],
  relationshipEdges: mockRelationshipEdges,
  equation: null,
  causalEdges: [],
  convergencePoints: [],
  activeLayer: 1 as const,
  isEmpty: false,
};

vi.mock('@variscout/hooks', () => ({
  useEvidenceMapData: () => mockMapData,
}));

vi.mock('../../../features/panels/panelsStore', () => ({
  usePanelsStore: (
    selector: (s: {
      highlightedFactor: string | null;
      setHighlightedFactor: (f: string) => void;
      showImprovement: () => void;
    }) => unknown
  ) => {
    const state = {
      highlightedFactor: null,
      setHighlightedFactor: vi.fn(),
      showImprovement: vi.fn(),
    };
    return selector(state);
  },
}));

// ── 2. Component import AFTER mocks ────────────────────────────────────────

import { InvestigationMapView } from '../InvestigationMapView';

// ── 3. Shared test data ────────────────────────────────────────────────────

// Both factors are continuous → EdgeMiniChart renders scatter (circle elements)
const factorTypes = new Map<string, 'continuous' | 'categorical'>([
  ['Temperature', 'continuous'],
  ['Moisture', 'continuous'],
]);

const minimalMapOptions = {
  bestSubsets: {
    factorTypes,
    subsets: [],
    n: 5,
    grandMean: 0.49,
    ssTotal: 1,
  } as unknown as import('@variscout/core/stats').BestSubsetsResult,
  mainEffects: null,
  interactions: null,
  mode: 'standard' as const,
};

const filteredDataRows: Record<string, unknown>[] = [
  { Temperature: 100, Moisture: 0.45 },
  { Temperature: 110, Moisture: 0.52 },
  { Temperature: 90, Moisture: 0.38 },
  { Temperature: 120, Moisture: 0.61 },
  { Temperature: 105, Moisture: 0.49 },
];

// Polyfill ResizeObserver for jsdom (not provided by default)
beforeAll(() => {
  if (typeof window !== 'undefined' && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

// ── 4. Tests ───────────────────────────────────────────────────────────────

describe('InvestigationMapView — EdgeMiniChart wiring', () => {
  it('renders EdgeDetailCard with SVG when edge is clicked and filteredData is provided', () => {
    render(<InvestigationMapView mapOptions={minimalMapOptions} filteredData={filteredDataRows} />);

    // Trigger the edge click via the mock button
    fireEvent.click(screen.getByTestId('trigger-edge-click'));

    // EdgeDetailCard should now be in the DOM
    const card = screen.getByTestId('edge-detail-card');
    expect(card).toBeTruthy();

    // EdgeMiniChart renders scatter dots (circles) — verify at least one circle data point
    // (Both Temperature and Moisture are continuous → scatter chart → circle elements)
    const circles = card.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('renders EdgeDetailCard WITHOUT SVG when filteredData is absent', () => {
    render(
      <InvestigationMapView
        mapOptions={minimalMapOptions}
        // filteredData deliberately omitted
      />
    );

    fireEvent.click(screen.getByTestId('trigger-edge-click'));

    const card = screen.getByTestId('edge-detail-card');
    expect(card).toBeTruthy();

    // Without filteredData, no scatter circles are rendered (EdgeMiniChart is absent)
    const circles = card.querySelectorAll('circle');
    expect(circles.length).toBe(0);
  });
});

describe('InvestigationMapView — enriched CoScout context', () => {
  it('passes enriched context string with R²adj= to onAskCoScout when Ask CoScout button is clicked', () => {
    const onAskCoScout = vi.fn();

    render(
      <InvestigationMapView
        mapOptions={minimalMapOptions}
        filteredData={filteredDataRows}
        onAskCoScout={onAskCoScout}
      />
    );

    // Open the EdgeDetailCard
    fireEvent.click(screen.getByTestId('trigger-edge-click'));

    // Click the Ask CoScout button in the card
    fireEvent.click(screen.getByTestId('edge-card-coscout'));

    // onAskCoScout must have been called once
    expect(onAskCoScout).toHaveBeenCalledTimes(1);

    // The argument must contain the R²adj= notation from handleEdgeAskCoScout
    const contextArg: string = onAskCoScout.mock.calls[0][0];
    expect(contextArg).toContain('R²adj=');
  });
});
