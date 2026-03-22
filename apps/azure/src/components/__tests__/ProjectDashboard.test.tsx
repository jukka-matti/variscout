import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Finding, Hypothesis } from '@variscout/core';

// vi.mock MUST come before component imports to prevent import ordering issues

vi.mock('../../context/DataContext', () => ({
  useDataStateCtx: vi.fn(),
}));

vi.mock('../../features/ai/aiStore', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useAIStore: vi.fn((selector: (s: any) => unknown) =>
    selector({
      narration: null,
      setPendingDashboardQuestion: vi.fn(),
    })
  ),
}));

vi.mock('@variscout/hooks', () => ({
  useJourneyPhase: vi.fn(() => 'scout'),
}));

vi.mock('lucide-react', () => ({
  Play: () => <span data-testid="icon-play" />,
  Upload: () => <span data-testid="icon-upload" />,
  FileText: () => <span data-testid="icon-file-text" />,
  ListChecks: () => <span data-testid="icon-list-checks" />,
  Send: () => <span data-testid="icon-send" />,
}));

import ProjectDashboard from '../ProjectDashboard';
import ProjectStatusCard from '../ProjectStatusCard';
import DashboardSummaryCard from '../DashboardSummaryCard';
import { useDataStateCtx } from '../../context/DataContext';
import { useAIStore } from '../../features/ai/aiStore';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f-1',
    text: 'Test finding',
    createdAt: Date.now(),
    context: {
      activeFilters: { Shift: ['Night'] },
      cumulativeScope: null,
    },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    ...overrides,
  };
}

function makeHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: 'h-1',
    text: 'Night shift causes drift',
    status: 'untested',
    linkedFindingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const defaultDataState = {
  findings: [] as Finding[],
  hypotheses: [] as Hypothesis[],
  filterStack: [],
  viewState: {},
  rawData: [{ Weight: 10 }],
  aiEnabled: false,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ProjectStatusCard', () => {
  const defaultProps = {
    projectName: 'Coffee Line 3',
    lastEdited: '2 hours ago',
    journeyPhase: 'scout' as const,
    findings: [] as Finding[],
    hypotheses: [] as Hypothesis[],
    filterStack: [],
    viewState: {},
    onNavigateToFindings: vi.fn(),
    onNavigateToHypothesis: vi.fn(),
    onNavigateToActions: vi.fn(),
    onResumeAnalysis: vi.fn(),
  };

  it('renders project name and last edited', () => {
    render(<ProjectStatusCard {...defaultProps} />);
    expect(screen.getByText('Coffee Line 3')).toBeInTheDocument();
    expect(screen.getByText('Last edited 2 hours ago')).toBeInTheDocument();
  });

  it('renders phase indicator with correct active phase', () => {
    render(<ProjectStatusCard {...defaultProps} journeyPhase="investigate" />);
    expect(screen.getByText('INVESTIGATE')).toBeInTheDocument();
    expect(screen.getByText('FRAME')).toBeInTheDocument();
    expect(screen.getByText('SCOUT')).toBeInTheDocument();
    expect(screen.getByText('IMPROVE')).toBeInTheDocument();
  });

  it('renders finding counts by status', () => {
    const findings = [
      makeFinding({ id: 'f-1', status: 'observed' }),
      makeFinding({ id: 'f-2', status: 'observed' }),
      makeFinding({ id: 'f-3', status: 'investigating' }),
    ];
    render(<ProjectStatusCard {...defaultProps} findings={findings} />);

    expect(screen.getByTestId('finding-status-observed')).toBeInTheDocument();
    expect(screen.getByTestId('finding-status-investigating')).toBeInTheDocument();
    // "2" for observed count
    expect(screen.getByTestId('finding-status-observed')).toHaveTextContent('2');
  });

  it('calls onNavigateToFindings when clicking a status', () => {
    const onNavigateToFindings = vi.fn();
    const findings = [makeFinding({ id: 'f-1', status: 'observed' })];
    render(
      <ProjectStatusCard
        {...defaultProps}
        findings={findings}
        onNavigateToFindings={onNavigateToFindings}
      />
    );
    fireEvent.click(screen.getByTestId('finding-status-observed'));
    expect(onNavigateToFindings).toHaveBeenCalledWith('observed');
  });

  it('renders root hypotheses with status icons', () => {
    const hypotheses = [
      makeHypothesis({ id: 'h-1', text: 'Night shift causes drift', status: 'supported' }),
      makeHypothesis({
        id: 'h-2',
        text: 'Temperature variation',
        status: 'untested',
        parentId: 'h-1',
      }),
    ];
    render(<ProjectStatusCard {...defaultProps} hypotheses={hypotheses} />);
    // Only root hypothesis (h-1) should appear, not child (h-2)
    expect(screen.getByText('Night shift causes drift')).toBeInTheDocument();
    expect(screen.queryByText('Temperature variation')).not.toBeInTheDocument();
  });

  it('calls onNavigateToHypothesis when clicking a hypothesis', () => {
    const onNavigateToHypothesis = vi.fn();
    const hypotheses = [makeHypothesis({ id: 'h-1', text: 'Night shift drift' })];
    render(
      <ProjectStatusCard
        {...defaultProps}
        hypotheses={hypotheses}
        onNavigateToHypothesis={onNavigateToHypothesis}
      />
    );
    fireEvent.click(screen.getByText('Night shift drift'));
    expect(onNavigateToHypothesis).toHaveBeenCalledWith('h-1');
  });

  it('renders action progress bar when actions exist', () => {
    const findings = [
      makeFinding({
        id: 'f-1',
        actions: [
          { id: 'a-1', text: 'Fix it', createdAt: Date.now(), completedAt: Date.now() },
          { id: 'a-2', text: 'Test it', createdAt: Date.now() },
        ],
      }),
    ];
    render(<ProjectStatusCard {...defaultProps} findings={findings} />);
    expect(screen.getByText('1/2 completed')).toBeInTheDocument();
  });

  it('does not render findings section when no findings exist', () => {
    render(<ProjectStatusCard {...defaultProps} findings={[]} />);
    expect(screen.queryByText('Findings')).not.toBeInTheDocument();
  });
});

describe('DashboardSummaryCard', () => {
  const defaultProps = {
    summary: null,
    isLoading: false,
    isAIAvailable: true,
    onAskCoScout: vi.fn(),
  };

  it('renders nothing when AI is not available', () => {
    const { container } = render(<DashboardSummaryCard {...defaultProps} isAIAvailable={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders loading shimmer when isLoading', () => {
    render(<DashboardSummaryCard {...defaultProps} isLoading={true} />);
    expect(screen.getByTestId('summary-shimmer')).toBeInTheDocument();
  });

  it('renders summary text when available', () => {
    render(
      <DashboardSummaryCard
        {...defaultProps}
        summary="Analysis shows significant variation in Shift factor."
      />
    );
    expect(
      screen.getByText('Analysis shows significant variation in Shift factor.')
    ).toBeInTheDocument();
  });

  it('renders fallback text when no summary and not loading', () => {
    render(<DashboardSummaryCard {...defaultProps} />);
    expect(screen.getByText(/No summary available yet/)).toBeInTheDocument();
  });

  it('calls onAskCoScout when submitting a question', () => {
    const onAskCoScout = vi.fn();
    render(<DashboardSummaryCard {...defaultProps} onAskCoScout={onAskCoScout} />);

    const input = screen.getByTestId('dashboard-coscout-input');
    fireEvent.change(input, { target: { value: 'What is the main driver?' } });
    fireEvent.submit(input.closest('form')!);

    expect(onAskCoScout).toHaveBeenCalledWith('What is the main driver?');
  });

  it('does not submit empty questions', () => {
    const onAskCoScout = vi.fn();
    render(<DashboardSummaryCard {...defaultProps} onAskCoScout={onAskCoScout} />);

    const input = screen.getByTestId('dashboard-coscout-input');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);

    expect(onAskCoScout).not.toHaveBeenCalled();
  });
});

describe('ProjectDashboard', () => {
  const defaultProps = {
    projectName: 'Coffee Line 3',
    lastEdited: '2 hours ago',
    onNavigate: vi.fn(),
    onAddData: vi.fn(),
    onResumeAnalysis: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useDataStateCtx).mockReturnValue(
      defaultDataState as unknown as ReturnType<typeof useDataStateCtx>
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useAIStore).mockImplementation((selector: (s: any) => unknown) =>
      selector({
        narration: null,
        setPendingDashboardQuestion: vi.fn(),
      })
    );
  });

  it('renders the project dashboard container', () => {
    render(<ProjectDashboard {...defaultProps} />);
    expect(screen.getByTestId('project-dashboard')).toBeInTheDocument();
  });

  it('renders project name via ProjectStatusCard', () => {
    render(<ProjectDashboard {...defaultProps} />);
    expect(screen.getByText('Coffee Line 3')).toBeInTheDocument();
  });

  it('renders quick actions with Continue analysis and Add data', () => {
    render(<ProjectDashboard {...defaultProps} />);
    expect(screen.getByTestId('action-resume')).toBeInTheDocument();
    expect(screen.getByTestId('action-add-data')).toBeInTheDocument();
  });

  it('shows View report button when findings exist', () => {
    vi.mocked(useDataStateCtx).mockReturnValue({
      ...defaultDataState,
      findings: [makeFinding()],
    } as unknown as ReturnType<typeof useDataStateCtx>);

    render(<ProjectDashboard {...defaultProps} />);
    expect(screen.getByTestId('action-report')).toBeInTheDocument();
  });

  it('hides View report button when no findings', () => {
    render(<ProjectDashboard {...defaultProps} />);
    expect(screen.queryByTestId('action-report')).not.toBeInTheDocument();
  });

  it('shows Review actions button when actions exist', () => {
    vi.mocked(useDataStateCtx).mockReturnValue({
      ...defaultDataState,
      findings: [
        makeFinding({
          actions: [{ id: 'a-1', text: 'Fix', createdAt: Date.now() }],
        }),
      ],
    } as unknown as ReturnType<typeof useDataStateCtx>);

    render(<ProjectDashboard {...defaultProps} />);
    expect(screen.getByTestId('action-review-actions')).toBeInTheDocument();
  });

  it('calls onResumeAnalysis when Continue analysis is clicked', () => {
    const onResumeAnalysis = vi.fn();
    render(<ProjectDashboard {...defaultProps} onResumeAnalysis={onResumeAnalysis} />);
    fireEvent.click(screen.getByTestId('action-resume'));
    expect(onResumeAnalysis).toHaveBeenCalled();
  });

  it('calls onAddData when Add data is clicked', () => {
    const onAddData = vi.fn();
    render(<ProjectDashboard {...defaultProps} onAddData={onAddData} />);
    fireEvent.click(screen.getByTestId('action-add-data'));
    expect(onAddData).toHaveBeenCalled();
  });

  it('calls onNavigate with report when View report is clicked', () => {
    const onNavigate = vi.fn();
    vi.mocked(useDataStateCtx).mockReturnValue({
      ...defaultDataState,
      findings: [makeFinding()],
    } as unknown as ReturnType<typeof useDataStateCtx>);

    render(<ProjectDashboard {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByTestId('action-report'));
    expect(onNavigate).toHaveBeenCalledWith('report');
  });

  it('does not render AI summary card when aiEnabled is false', () => {
    render(<ProjectDashboard {...defaultProps} />);
    expect(screen.queryByTestId('dashboard-summary-card')).not.toBeInTheDocument();
  });
});
