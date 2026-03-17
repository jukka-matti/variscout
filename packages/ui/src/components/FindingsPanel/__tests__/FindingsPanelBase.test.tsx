import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock dependencies BEFORE component import (critical vitest pattern)
vi.mock('@variscout/hooks', () => ({
  useResizablePanel: vi.fn(() => ({
    width: 384,
    isDragging: false,
    handleMouseDown: vi.fn(),
  })),
  useTranslation: () => ({
    t: (key: string) => key,
    formatStat: (n: number) => String(n),
    formatPct: (n: number) => `${n}%`,
    locale: 'en',
  }),
}));

vi.mock('../../FindingsLog', () => ({
  FindingsLog: (props: Record<string, unknown>) => (
    <div data-testid="findings-log" data-count={String((props.findings as unknown[]).length)} />
  ),
  copyFindingsToClipboard: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../../CoScoutInline', () => ({
  CoScoutInline: (props: Record<string, unknown>) => (
    <div data-testid="coscout-inline" data-expanded={String(props.isExpanded)} />
  ),
}));

vi.mock('lucide-react', () => ({
  GripVertical: ({ size }: { size?: number }) => <span data-testid="grip" data-size={size} />,
  X: ({ size }: { size?: number }) => <span data-testid="icon-x" data-size={size} />,
  ClipboardCopy: ({ size }: { size?: number }) => <span data-testid="icon-copy" data-size={size} />,
  Check: ({ size }: { size?: number }) => <span data-testid="icon-check" data-size={size} />,
  ExternalLink: ({ size }: { size?: number }) => (
    <span data-testid="icon-external" data-size={size} />
  ),
  List: ({ size }: { size?: number }) => <span data-testid="icon-list" data-size={size} />,
  LayoutGrid: ({ size }: { size?: number }) => <span data-testid="icon-grid" data-size={size} />,
  GitBranch: ({ size }: { size?: number }) => <span data-testid="icon-branch" data-size={size} />,
}));

import { FindingsPanelBase, type FindingsPanelBaseProps } from '../FindingsPanelBase';
import { copyFindingsToClipboard } from '../../FindingsLog';
import type { Finding } from '@variscout/core';
import type { DrillStep } from '@variscout/hooks';

const makeFinding = (id: string, text = 'Test finding'): Finding => ({
  id,
  text,
  status: 'observed',
  context: { activeFilters: {}, cumulativeScope: null },
  createdAt: Date.now(),
  statusChangedAt: Date.now(),
  comments: [],
});

const makeDrillStep = (
  overrides: Partial<DrillStep> & { factor: string; scopeFraction: number }
): DrillStep => ({
  values: [],
  label: overrides.factor,
  timestamp: Date.now(),
  cumulativeScope: overrides.scopeFraction,
  meanBefore: 10,
  meanAfter: 10,
  cpkBefore: undefined,
  cpkAfter: undefined,
  countBefore: 100,
  countAfter: 50,
  ...overrides,
});

const defaultProps: FindingsPanelBaseProps = {
  isOpen: true,
  onClose: vi.fn(),
  findings: [],
  onEditFinding: vi.fn(),
  onDeleteFinding: vi.fn(),
  onRestoreFinding: vi.fn(),
  onSetFindingStatus: vi.fn(),
  onAddComment: vi.fn(),
  onEditComment: vi.fn(),
  onDeleteComment: vi.fn(),
  drillPath: [],
  resizeConfig: {
    storageKey: 'test-key',
    min: 320,
    max: 600,
    defaultWidth: 384,
  },
};

describe('FindingsPanelBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when isOpen=false', () => {
    const { container } = render(<FindingsPanelBase {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders resize handle and panel when isOpen=true', () => {
    render(<FindingsPanelBase {...defaultProps} />);
    expect(screen.getByTestId('grip')).toBeTruthy();
    expect(screen.getByText('panel.findings')).toBeTruthy();
    expect(screen.getByTestId('findings-log')).toBeTruthy();
  });

  it('shows count badge when findings exist', () => {
    const findings = [makeFinding('1'), makeFinding('2')];
    render(<FindingsPanelBase {...defaultProps} findings={findings} />);
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('shows view toggle when findings exist', () => {
    const findings = [makeFinding('1')];
    render(<FindingsPanelBase {...defaultProps} findings={findings} />);
    expect(screen.getByLabelText('view.list')).toBeTruthy();
    expect(screen.getByLabelText('view.board')).toBeTruthy();
  });

  it('does not show view toggle when no findings', () => {
    render(<FindingsPanelBase {...defaultProps} />);
    expect(screen.queryByLabelText('view.list')).toBeNull();
    expect(screen.queryByLabelText('view.board')).toBeNull();
  });

  it('shows copy button feedback and reverts after 2s', async () => {
    const findings = [makeFinding('1')];
    render(<FindingsPanelBase {...defaultProps} findings={findings} />);

    const copyBtn = screen.getByLabelText('Copy all findings');
    expect(screen.getByTestId('icon-copy')).toBeTruthy();

    await act(async () => {
      fireEvent.click(copyBtn);
      // Allow the promise to resolve
      await Promise.resolve();
    });

    expect(copyFindingsToClipboard).toHaveBeenCalledWith(findings, undefined);
    expect(screen.getByTestId('icon-check')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('icon-copy')).toBeTruthy();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<FindingsPanelBase {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape when closed', () => {
    const onClose = vi.fn();
    render(<FindingsPanelBase {...defaultProps} isOpen={false} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders drill path footer with column aliases and scope %', () => {
    const drillPath = [
      makeDrillStep({ factor: 'machine', scopeFraction: 0.45, cumulativeScope: 0.45 }),
      makeDrillStep({ factor: 'shift', scopeFraction: 0.23, cumulativeScope: 0.68 }),
    ];
    render(
      <FindingsPanelBase
        {...defaultProps}
        drillPath={drillPath}
        columnAliases={{ machine: 'Machine ID' }}
      />
    );

    expect(screen.getByText('panel.drillPath')).toBeTruthy();
    expect(screen.getByText('Machine ID')).toBeTruthy();
    expect(screen.getByText('45%')).toBeTruthy();
    expect(screen.getByText('shift')).toBeTruthy();
    expect(screen.getByText('23%')).toBeTruthy();
  });

  it('uses external viewMode when provided', () => {
    const findings = [makeFinding('1')];
    const { rerender } = render(
      <FindingsPanelBase {...defaultProps} findings={findings} viewMode="board" />
    );

    // Board button should be active (has text-content class)
    const boardBtn = screen.getByLabelText('view.board');
    expect(boardBtn.className).toContain('text-content');

    rerender(<FindingsPanelBase {...defaultProps} findings={findings} viewMode="list" />);
    const listBtn = screen.getByLabelText('view.list');
    expect(listBtn.className).toContain('text-content');
  });

  it('falls back to local viewMode=list when no external viewMode', () => {
    const findings = [makeFinding('1')];
    render(<FindingsPanelBase {...defaultProps} findings={findings} />);

    const listBtn = screen.getByLabelText('view.list');
    expect(listBtn.className).toContain('bg-surface-tertiary');
  });

  it('calls onViewModeChange when toggle clicked', () => {
    const findings = [makeFinding('1')];
    const onViewModeChange = vi.fn();
    render(
      <FindingsPanelBase
        {...defaultProps}
        findings={findings}
        onViewModeChange={onViewModeChange}
      />
    );

    fireEvent.click(screen.getByLabelText('view.board'));
    expect(onViewModeChange).toHaveBeenCalledWith('board');
  });

  it('shows popout button when onPopout is provided', () => {
    const onPopout = vi.fn();
    render(<FindingsPanelBase {...defaultProps} onPopout={onPopout} />);
    expect(screen.getByLabelText('Open findings in separate window')).toBeTruthy();
  });

  it('hides popout button when onPopout is not provided', () => {
    render(<FindingsPanelBase {...defaultProps} />);
    expect(screen.queryByLabelText('Open findings in separate window')).toBeNull();
  });

  it('passes Azure-only props through to FindingsLog', () => {
    const findings = [makeFinding('1')];
    render(
      <FindingsPanelBase
        {...defaultProps}
        findings={findings}
        showAuthors={true}
        onShareFinding={vi.fn()}
        onAddPhoto={vi.fn()}
        onCaptureFromTeams={vi.fn()}
      />
    );

    // FindingsLog renders with the findings count
    expect(screen.getByTestId('findings-log').getAttribute('data-count')).toBe('1');
  });

  describe('CoScout inline', () => {
    it('renders CoScoutInline when coScoutMessages and coScoutOnSend are provided', () => {
      render(
        <FindingsPanelBase
          {...defaultProps}
          coScoutMessages={[]}
          coScoutOnSend={vi.fn()}
          coScoutIsLoading={false}
        />
      );
      expect(screen.getByTestId('coscout-inline')).toBeTruthy();
    });

    it('does not render CoScoutInline when coScoutMessages is absent (PWA)', () => {
      render(<FindingsPanelBase {...defaultProps} />);
      expect(screen.queryByTestId('coscout-inline')).toBeNull();
    });

    it('does not render CoScoutInline when coScoutOnSend is absent', () => {
      render(<FindingsPanelBase {...defaultProps} coScoutMessages={[]} />);
      expect(screen.queryByTestId('coscout-inline')).toBeNull();
    });
  });
});
