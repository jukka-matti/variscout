import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MindmapWindow, { openMindmapPopout } from '../MindmapWindow';

// Mock chart and hooks
vi.mock('@variscout/charts', () => ({
  InvestigationMindmapBase: (props: any) => (
    <div data-testid="mindmap-base">
      <button
        data-testid="category-select"
        onClick={() => props.onCategorySelect?.('Machine', 'A')}
      >
        Select Category
      </button>
    </div>
  ),
}));

vi.mock('@variscout/hooks', () => ({
  useMindmapState: () => ({
    nodes: [],
    drillTrail: [],
    cumulativeVariationPct: 0,
    interactionEdges: [],
    narrativeSteps: [],
    drillPath: [],
    mode: 'drilldown' as const,
    setMode: vi.fn(),
    handleAnnotationChange: vi.fn(),
  }),
}));

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,test'),
}));

const SYNC_KEY = 'variscout_mindmap_sync';

const mockSyncData = {
  rawData: [
    { Weight: 10.2, Machine: 'A' },
    { Weight: 10.5, Machine: 'B' },
  ],
  factors: ['Machine'],
  outcome: 'Weight',
  columnAliases: {},
  specs: { usl: 12, lsl: 8 },
  filterStack: [],
  timestamp: Date.now(),
};

describe('MindmapWindow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders error state when no localStorage data', () => {
    render(<MindmapWindow />);

    expect(screen.getByText('No Connection')).toBeInTheDocument();
    expect(
      screen.getByText('No data available. Please open from the main VariScout window.')
    ).toBeInTheDocument();
  });

  it('renders mindmap when localStorage data is present', () => {
    localStorage.setItem(SYNC_KEY, JSON.stringify(mockSyncData));

    render(<MindmapWindow />);

    expect(screen.getByText('Investigation')).toBeInTheDocument();
    expect(screen.getByTestId('mindmap-base')).toBeInTheDocument();
  });

  it('renders mode toggle buttons', () => {
    localStorage.setItem(SYNC_KEY, JSON.stringify(mockSyncData));

    render(<MindmapWindow />);

    expect(screen.getByText('Drilldown')).toBeInTheDocument();
    expect(screen.getByText('Interactions')).toBeInTheDocument();
    expect(screen.getByText('Narrative')).toBeInTheDocument();
  });

  it('sends postMessage on category select when opener exists', () => {
    localStorage.setItem(SYNC_KEY, JSON.stringify(mockSyncData));
    const mockPostMessage = vi.fn();
    const originalOpener = window.opener;
    Object.defineProperty(window, 'opener', {
      value: { postMessage: mockPostMessage },
      writable: true,
      configurable: true,
    });

    render(<MindmapWindow />);
    fireEvent.click(screen.getByTestId('category-select'));

    expect(mockPostMessage).toHaveBeenCalledWith(
      { type: 'MINDMAP_DRILL_CATEGORY', factor: 'Machine', value: 'A' },
      window.location.origin
    );

    Object.defineProperty(window, 'opener', {
      value: originalOpener,
      writable: true,
      configurable: true,
    });
  });

  it('stores drill action in localStorage fallback', () => {
    localStorage.setItem(SYNC_KEY, JSON.stringify(mockSyncData));

    render(<MindmapWindow />);
    fireEvent.click(screen.getByTestId('category-select'));

    const drillData = JSON.parse(localStorage.getItem('variscout_mindmap_drill')!);
    expect(drillData.factor).toBe('Machine');
    expect(drillData.value).toBe('A');
  });
});

describe('openMindmapPopout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('writes sync data to localStorage and calls window.open', () => {
    const mockOpen = vi.spyOn(window, 'open').mockReturnValue(null);

    openMindmapPopout(
      mockSyncData.rawData,
      mockSyncData.factors,
      mockSyncData.outcome,
      mockSyncData.columnAliases,
      mockSyncData.specs
    );

    // Verify localStorage was written
    const stored = JSON.parse(localStorage.getItem(SYNC_KEY)!);
    expect(stored.rawData).toEqual(mockSyncData.rawData);
    expect(stored.factors).toEqual(mockSyncData.factors);
    expect(stored.outcome).toBe('Weight');

    // Verify window.open was called
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('?view=mindmap'),
      'variscout-mindmap',
      expect.any(String)
    );

    mockOpen.mockRestore();
  });

  it('passes filterStack to sync data', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const filters = [
      { type: 'filter' as const, source: 'chip' as const, factor: 'Machine', values: ['A'] },
    ];

    openMindmapPopout(
      mockSyncData.rawData,
      mockSyncData.factors,
      mockSyncData.outcome,
      mockSyncData.columnAliases,
      mockSyncData.specs,
      filters as any
    );

    const stored = JSON.parse(localStorage.getItem(SYNC_KEY)!);
    expect(stored.filterStack).toEqual(filters);

    vi.restoreAllMocks();
  });
});
