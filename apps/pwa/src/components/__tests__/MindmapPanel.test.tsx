import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { MindmapMode, NarrativeStep } from '@variscout/charts';
import type { DrillStep } from '@variscout/hooks';
import MindmapPanel from '../MindmapPanel';

// Mock InvestigationMindmapBase
vi.mock('@variscout/charts', async () => {
  const actual = await vi.importActual<typeof import('@variscout/charts')>('@variscout/charts');
  return {
    ...actual,
    InvestigationMindmapBase: (props: Record<string, unknown> & { mode?: string }) => (
      <div data-testid="mindmap-chart" data-mode={props.mode}>
        Mindmap
      </div>
    ),
  };
});

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

// Default mock state returned by useMindmapState
const defaultMindmapState: {
  nodes: { factor: string; etaSquared: number; state: 'available'; isSuggested: boolean }[];
  drillTrail: string[];
  cumulativeVariationPct: number | null;
  interactionEdges: undefined;
  narrativeSteps: NarrativeStep[];
  drillPath: DrillStep[];
  mode: MindmapMode;
  setMode: ReturnType<typeof vi.fn>;
  annotations: Map<number, string>;
  handleAnnotationChange: ReturnType<typeof vi.fn>;
} = {
  nodes: [
    { factor: 'Machine', etaSquared: 0.8, state: 'available' as const, isSuggested: true },
    { factor: 'Shift', etaSquared: 0.02, state: 'available' as const, isSuggested: false },
  ],
  drillTrail: [],
  cumulativeVariationPct: null,
  interactionEdges: undefined,
  narrativeSteps: [],
  drillPath: [],
  mode: 'drilldown',
  setMode: vi.fn(),
  annotations: new Map(),
  handleAnnotationChange: vi.fn(),
};

let mockMindmapState = { ...defaultMindmapState };

vi.mock('@variscout/hooks', () => ({
  useMindmapState: () => mockMindmapState,
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  data: [
    { Machine: 'A', Shift: 'Morning', Value: 10 },
    { Machine: 'B', Shift: 'Morning', Value: 11 },
    { Machine: 'A', Shift: 'Evening', Value: 12 },
    { Machine: 'B', Shift: 'Evening', Value: 13 },
    { Machine: 'A', Shift: 'Night', Value: 14 },
  ],
  factors: ['Machine', 'Shift'],
  outcome: 'Value',
  filterStack: [],
  onDrillCategory: vi.fn(),
};

describe('MindmapPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMindmapState = {
      ...defaultMindmapState,
      setMode: vi.fn(),
      handleAnnotationChange: vi.fn(),
    };
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(<MindmapPanel {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders panel with Investigation heading when open', () => {
    render(<MindmapPanel {...defaultProps} />);
    expect(screen.getByText('Investigation')).toBeInTheDocument();
  });

  it('shows two mode toggle buttons', () => {
    render(<MindmapPanel {...defaultProps} />);
    expect(screen.getByText('Drilldown')).toBeInTheDocument();
    expect(screen.getByText('Narrative')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<MindmapPanel {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close investigation panel');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<MindmapPanel {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows Export PNG button in all modes', () => {
    // Export available in drilldown mode
    render(<MindmapPanel {...defaultProps} />);
    expect(screen.getByLabelText('Export as PNG')).toBeInTheDocument();
  });

  it('shows popout button when onOpenPopout provided', () => {
    render(<MindmapPanel {...defaultProps} onOpenPopout={() => {}} />);
    expect(screen.getByLabelText('Open in new window')).toBeInTheDocument();
  });

  it('hides popout button when onOpenPopout not provided', () => {
    render(<MindmapPanel {...defaultProps} />);
    expect(screen.queryByLabelText('Open in new window')).not.toBeInTheDocument();
  });

  it('renders drill path summary when drillPath has entries', () => {
    mockMindmapState = {
      ...mockMindmapState,
      drillPath: [
        {
          factor: 'Machine',
          values: ['A'],
          label: 'Machine = A',
          timestamp: Date.now(),
          scopeFraction: 0.8,
          cumulativeScope: 0.8,
          meanBefore: 15,
          meanAfter: 10.5,
          cpkBefore: 1.2,
          cpkAfter: 1.8,
          countBefore: 8,
          countAfter: 4,
        },
      ],
      drillTrail: ['Machine'],
    };

    render(<MindmapPanel {...defaultProps} />);
    expect(screen.getByText('Drill Path')).toBeInTheDocument();
    expect(screen.getByText('Machine')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('calls setMode when enabled mode toggle buttons are clicked', () => {
    // Narrative requires 1+ drill, so add a drillPath entry
    mockMindmapState = {
      ...mockMindmapState,
      drillPath: [
        {
          factor: 'Machine',
          values: ['A'],
          label: 'Machine = A',
          timestamp: Date.now(),
          scopeFraction: 0.8,
          cumulativeScope: 0.8,
          meanBefore: 15,
          meanAfter: 10.5,
          cpkBefore: 1.2,
          cpkAfter: 1.8,
          countBefore: 5,
          countAfter: 3,
        },
      ],
    };
    render(<MindmapPanel {...defaultProps} />);

    // Click Narrative (not currently active, enabled with 1+ drillPath)
    fireEvent.click(screen.getByText('Narrative'));
    expect(mockMindmapState.setMode).toHaveBeenCalledWith('narrative');
  });

  it('does not call setMode when clicking already-active mode', () => {
    render(<MindmapPanel {...defaultProps} />);

    // Drilldown is already active (default mode)
    fireEvent.click(screen.getByText('Drilldown'));
    expect(mockMindmapState.setMode).not.toHaveBeenCalledWith('drilldown');
  });

  it('disables Narrative mode when no drills applied', () => {
    render(<MindmapPanel {...defaultProps} />);

    const narrativeBtn = screen.getByText('Narrative');
    expect(narrativeBtn).toBeDisabled();
  });

  it('renders mindmap chart component', () => {
    render(<MindmapPanel {...defaultProps} />);
    expect(screen.getByTestId('mindmap-chart')).toBeInTheDocument();
  });
});
