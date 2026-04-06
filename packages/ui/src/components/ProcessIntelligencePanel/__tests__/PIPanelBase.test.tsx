import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@variscout/hooks', () => {
  const catalog: Record<string, string> = {
    'stats.summary': 'Summary Statistics',
    'stats.histogram': 'Histogram',
    'stats.probPlot': 'Probability Plot',
    'stats.editSpecs': 'Edit specifications',
    'stats.mean': 'Mean',
    'stats.median': 'Median',
    'stats.stdDev': 'Std Dev',
    'stats.samples': 'Samples',
    'stats.passRate': 'Pass Rate',
    'empty.noData': 'No data available',
    'stats.stats': 'Stats',
    'stats.questions': 'Questions',
    'stats.journal': 'Journal',
  };
  return {
    useTranslation: () => ({
      t: (key: string) => catalog[key] ?? key,
      tf: (key: string, params: Record<string, string | number>) => {
        let msg = catalog[key] ?? key;
        for (const [k, v] of Object.entries(params)) {
          msg = msg.replace(`{${k}}`, String(v));
        }
        return msg;
      },
      formatStat: (n: number, decimals?: number) => {
        if (decimals !== undefined) return n.toFixed(decimals);
        return n % 1 === 0 ? String(n) : n.toFixed(2);
      },
      formatPct: (n: number) => `${n}%`,
      locale: 'en',
    }),
  };
});

import PIPanelBase from '../PIPanelBase';
import type { PIPanelBaseProps } from '../types';

const mockGetTerm = vi.fn().mockReturnValue(undefined);

const baseStats = {
  mean: 10.5,
  median: 10.3,
  stdDev: 1.2,
  sigmaWithin: 1.1,
  mrBar: 1.24,
  ucl: 13.8,
  lcl: 7.2,
  cp: 1.45,
  cpk: 1.33,
  outOfSpecPercentage: 2.5,
};

const specsWithLimits = { lsl: 8, usl: 13, target: 10.5 };

const defaultProps: PIPanelBaseProps = {
  stats: baseStats,
  specs: {},
  filteredData: Array.from({ length: 50 }, (_, i) => ({ value: 10 + i * 0.1 })),
  outcome: 'value',
  getTerm: mockGetTerm,
};

describe('PIPanelBase', () => {
  it('renders 4 basic metric cards without specs', () => {
    render(<PIPanelBase {...defaultProps} />);
    expect(screen.getByTestId('stat-value-mean')).toBeDefined();
    expect(screen.getByTestId('stat-value-median')).toBeDefined();
    expect(screen.getByTestId('stat-value-std-dev')).toBeDefined();
    expect(screen.getByTestId('stat-value-samples')).toBeDefined();
  });

  it('renders 7 cards (+ Pass Rate, Cp, Cpk) with specs', () => {
    render(<PIPanelBase {...defaultProps} specs={specsWithLimits} />);
    expect(screen.getByTestId('stat-value-pass-rate')).toBeDefined();
    expect(screen.getByTestId('stat-value-cp')).toBeDefined();
    expect(screen.getByTestId('stat-value-cpk')).toBeDefined();
    expect(screen.getByTestId('stat-value-mean')).toBeDefined();
  });

  it('hides Cp/Cpk/Pass Rate cards when showCpk=false', () => {
    render(<PIPanelBase {...defaultProps} specs={specsWithLimits} showCpk={false} />);
    expect(screen.queryByTestId('stat-value-cp')).toBeNull();
    expect(screen.queryByTestId('stat-value-cpk')).toBeNull();
    expect(screen.queryByTestId('stat-value-pass-rate')).toBeNull();
    expect(screen.getByTestId('stat-value-mean')).toBeDefined();
  });

  it('shows empty state when stats=null', () => {
    render(<PIPanelBase {...defaultProps} stats={null} />);
    const mean = screen.getByTestId('stat-value-mean');
    expect(mean.textContent).toBe('N/A');
  });

  it('displays correct stat values', () => {
    render(<PIPanelBase {...defaultProps} />);
    expect(screen.getByTestId('stat-value-mean').textContent).toBe('10.50');
    expect(screen.getByTestId('stat-value-median').textContent).toBe('10.30');
    expect(screen.getByTestId('stat-value-std-dev').textContent).toBe('1.20');
    expect(screen.getByTestId('stat-value-samples').textContent).toBe('n=50');
  });

  describe('tab switching', () => {
    it('starts on Stats tab by default', () => {
      render(<PIPanelBase {...defaultProps} />);
      expect(screen.getByTestId('stat-value-mean')).toBeDefined();
    });

    it('renders Stats, Questions, Journal tabs', () => {
      render(<PIPanelBase {...defaultProps} />);
      expect(screen.getByText('Stats')).toBeDefined();
      expect(screen.getByText('Questions')).toBeDefined();
      expect(screen.getByText('Journal')).toBeDefined();
    });

    it('switches to Questions tab and renders content', () => {
      const renderQuestionsTab = vi
        .fn()
        .mockReturnValue(<div data-testid="questions-content">Q</div>);
      render(<PIPanelBase {...defaultProps} renderQuestionsTab={renderQuestionsTab} />);

      fireEvent.click(screen.getByText('Questions'));
      expect(screen.getByTestId('questions-content')).toBeDefined();
      expect(renderQuestionsTab).toHaveBeenCalled();
    });

    it('shows empty state for Questions tab when no render function', () => {
      render(<PIPanelBase {...defaultProps} />);
      fireEvent.click(screen.getByText('Questions'));
      expect(screen.getByText('No questions yet')).toBeDefined();
    });

    it('switches to Journal tab and renders content', () => {
      const renderJournalTab = vi.fn().mockReturnValue(<div data-testid="journal-content">J</div>);
      render(<PIPanelBase {...defaultProps} renderJournalTab={renderJournalTab} />);

      fireEvent.click(screen.getByText('Journal'));
      expect(screen.getByTestId('journal-content')).toBeDefined();
      expect(renderJournalTab).toHaveBeenCalled();
    });

    it('shows empty state for Journal tab when no render function', () => {
      render(<PIPanelBase {...defaultProps} />);
      fireEvent.click(screen.getByText('Journal'));
      expect(screen.getByText('No journal entries yet')).toBeDefined();
    });

    it('shows badge on Questions tab when openQuestionCount > 0', () => {
      render(<PIPanelBase {...defaultProps} openQuestionCount={3} />);
      expect(screen.getByText('3')).toBeDefined();
    });

    it('does not show badge when openQuestionCount is 0', () => {
      render(<PIPanelBase {...defaultProps} openQuestionCount={0} />);
      // Badge with value 0 should not render
      const badges = screen.queryAllByText('0');
      expect(badges.length).toBe(0);
    });
  });

  describe('overflow menu', () => {
    it('renders overflow (⋯) button', () => {
      render(<PIPanelBase {...defaultProps} />);
      expect(screen.getByLabelText('More options')).toBeDefined();
    });

    it('shows Data Table via overflowView prop', () => {
      const renderDataTable = vi.fn().mockReturnValue(<div data-testid="data-table">Table</div>);
      render(
        <PIPanelBase
          {...defaultProps}
          renderDataTable={renderDataTable}
          overflowView="data"
          onOverflowViewChange={vi.fn()}
        />
      );
      expect(screen.getByTestId('data-table')).toBeDefined();
      expect(renderDataTable).toHaveBeenCalled();
    });

    it('shows What-If via overflowView prop', () => {
      const renderWhatIf = vi.fn().mockReturnValue(<div data-testid="what-if">Simulator</div>);
      render(
        <PIPanelBase
          {...defaultProps}
          renderWhatIf={renderWhatIf}
          overflowView="whatif"
          onOverflowViewChange={vi.fn()}
        />
      );
      expect(screen.getByTestId('what-if')).toBeDefined();
      expect(renderWhatIf).toHaveBeenCalled();
    });

    it('shows empty state for Data overflow when no render function', () => {
      render(<PIPanelBase {...defaultProps} overflowView="data" onOverflowViewChange={vi.fn()} />);
      expect(screen.getByText('No data available')).toBeDefined();
    });

    it('shows empty state for What-If overflow when no render function', () => {
      render(
        <PIPanelBase {...defaultProps} overflowView="whatif" onOverflowViewChange={vi.fn()} />
      );
      expect(screen.getByText('No What-If simulator available')).toBeDefined();
    });

    it('shows active overflow label as dismissible button', () => {
      render(<PIPanelBase {...defaultProps} overflowView="data" onOverflowViewChange={vi.fn()} />);
      expect(screen.getByLabelText('Close Data Table')).toBeDefined();
    });

    it('calls onOverflowViewChange(null) when active overflow button is clicked', () => {
      const onOverflowViewChange = vi.fn();
      render(
        <PIPanelBase
          {...defaultProps}
          overflowView="data"
          onOverflowViewChange={onOverflowViewChange}
        />
      );
      fireEvent.click(screen.getByLabelText('Close Data Table'));
      expect(onOverflowViewChange).toHaveBeenCalledWith(null);
    });
  });

  describe('pencil link', () => {
    it('shows "Edit specifications" when onEditSpecs provided', () => {
      const onEditSpecs = vi.fn();
      render(<PIPanelBase {...defaultProps} onEditSpecs={onEditSpecs} />);
      expect(screen.getByTestId('edit-specs-link')).toBeDefined();
      expect(screen.getByText('Edit specifications')).toBeDefined();
    });

    it('calls onEditSpecs when pencil link is clicked', () => {
      const onEditSpecs = vi.fn();
      render(<PIPanelBase {...defaultProps} onEditSpecs={onEditSpecs} />);
      fireEvent.click(screen.getByTestId('edit-specs-link'));
      expect(onEditSpecs).toHaveBeenCalledOnce();
    });

    it('does not show pencil link without onEditSpecs', () => {
      render(<PIPanelBase {...defaultProps} />);
      expect(screen.queryByTestId('edit-specs-link')).toBeNull();
    });
  });

  describe('target discovery', () => {
    it('shows prompt when no specs and not drilling', () => {
      render(<PIPanelBase {...defaultProps} specs={{}} isDrilling={false} />);
      expect(screen.getByTestId('target-discovery-prompt')).toBeDefined();
    });

    it('shows complement insight when no specs and drilling', () => {
      render(
        <PIPanelBase
          {...defaultProps}
          specs={{}}
          isDrilling={true}
          complement={{ mean: 10.92, stdDev: 0.31, count: 20 }}
        />
      );
      expect(screen.getByTestId('target-discovery-complement')).toBeDefined();
    });

    it('shows centering opportunity when specs exist and not drilling', () => {
      render(
        <PIPanelBase
          {...defaultProps}
          specs={specsWithLimits}
          isDrilling={false}
          centeringOpportunity={{ currentCpk: 0.26, cp: 1.01, gap: 0.75 }}
        />
      );
      expect(screen.getByTestId('target-discovery-centering')).toBeDefined();
    });

    it('shows headroom check when specs exist and drilling', () => {
      render(
        <PIPanelBase
          {...defaultProps}
          specs={specsWithLimits}
          isDrilling={true}
          activeProjection={{
            currentCpk: 0.26,
            projectedCpk: 1.85,
            label: 'if fixed',
            findingCount: 1,
          }}
          cpkTarget={1.33}
        />
      );
      expect(screen.getByTestId('target-discovery-headroom')).toBeDefined();
    });
  });

  it('compact mode renders tab bar', () => {
    const { container } = render(<PIPanelBase {...defaultProps} compact={true} />);
    expect(container.querySelector('.scroll-touch')).not.toBeNull();
  });

  it('applies default styling classes', () => {
    const { container } = render(<PIPanelBase {...defaultProps} />);
    expect(container.querySelector('.bg-surface-secondary')).not.toBeNull();
  });

  it('respects defaultTab prop', () => {
    const renderQuestionsTab = vi
      .fn()
      .mockReturnValue(<div data-testid="questions-content">Q</div>);
    render(
      <PIPanelBase
        {...defaultProps}
        defaultTab="questions"
        renderQuestionsTab={renderQuestionsTab}
      />
    );
    expect(screen.getByTestId('questions-content')).toBeDefined();
  });

  describe('config-driven tabs API', () => {
    const tabsConfig = [
      {
        id: 'stats',
        label: 'Stats',
        content: <div data-testid="config-stats-content">Stats Content</div>,
      },
      {
        id: 'questions',
        label: 'Questions',
        badge: 5,
        content: <div data-testid="config-questions-content">Questions Content</div>,
      },
      {
        id: 'journal',
        label: 'Journal',
        content: <div data-testid="config-journal-content">Journal Content</div>,
      },
    ];

    it('renders tab bar from tabs array', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} />);
      expect(screen.getByTestId('pi-tab-stats')).toBeDefined();
      expect(screen.getByTestId('pi-tab-questions')).toBeDefined();
      expect(screen.getByTestId('pi-tab-journal')).toBeDefined();
    });

    it('renders tab labels from tabs array', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} />);
      expect(screen.getByText('Stats')).toBeDefined();
      expect(screen.getByText('Questions')).toBeDefined();
      expect(screen.getByText('Journal')).toBeDefined();
    });

    it('renders first tab content by default', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} />);
      expect(screen.getByTestId('config-stats-content')).toBeDefined();
    });

    it('switches tab content when config tab is clicked', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} />);
      fireEvent.click(screen.getByTestId('pi-tab-questions'));
      expect(screen.getByTestId('config-questions-content')).toBeDefined();
    });

    it('switches back to first tab when that tab is clicked', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} />);
      fireEvent.click(screen.getByTestId('pi-tab-questions'));
      fireEvent.click(screen.getByTestId('pi-tab-stats'));
      expect(screen.getByTestId('config-stats-content')).toBeDefined();
    });

    it('shows badge on tab when badge > 0', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} />);
      expect(screen.getByText('5')).toBeDefined();
    });

    it('does not show badge when badge is 0', () => {
      const tabsWithZeroBadge = [{ id: 'a', label: 'A', badge: 0, content: <div>A</div> }];
      render(<PIPanelBase {...defaultProps} tabs={tabsWithZeroBadge} />);
      const badgeEls = screen.queryAllByText('0');
      expect(badgeEls.length).toBe(0);
    });

    it('wraps active tab content with correct data-testid', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} />);
      expect(screen.getByTestId('pi-tab-content-stats')).toBeDefined();
    });

    it('updates content wrapper testid on tab switch', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} />);
      fireEvent.click(screen.getByTestId('pi-tab-journal'));
      expect(screen.getByTestId('pi-tab-content-journal')).toBeDefined();
    });

    it('does NOT render old Stats/Questions/Journal legacy tabs when tabs prop is set', () => {
      // Legacy tabs rendered by the old system use unlabelled text buttons,
      // but config mode uses pi-tab-* testids — verify old overflow button absent
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} />);
      // In config mode the legacy "More options" overflow menu should not appear
      // (it only appears when overflowItems is provided via ConfigOverflowMenu)
      expect(screen.queryByLabelText('More options')).toBeNull();
    });
  });

  describe('config-driven overflowItems', () => {
    const tabsConfig = [
      {
        id: 'stats',
        label: 'Stats',
        content: <div data-testid="config-stats-content">Stats Content</div>,
      },
    ];

    const overflowItems = [
      {
        id: 'data',
        label: 'Data Table',
        content: <div data-testid="config-data-content">Data Table Content</div>,
      },
      {
        id: 'whatif',
        label: 'What-If',
        content: <div data-testid="config-whatif-content">What-If Content</div>,
      },
    ];

    it('renders overflow trigger button when overflowItems provided', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} overflowItems={overflowItems} />);
      expect(screen.getByTestId('pi-overflow-trigger')).toBeDefined();
    });

    it('shows overflow menu items on trigger click', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} overflowItems={overflowItems} />);
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      expect(screen.getByTestId('pi-overflow-item-data')).toBeDefined();
      expect(screen.getByTestId('pi-overflow-item-whatif')).toBeDefined();
    });

    it('shows overflow item content when selected', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} overflowItems={overflowItems} />);
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      fireEvent.click(screen.getByTestId('pi-overflow-item-data'));
      expect(screen.getByTestId('config-data-content')).toBeDefined();
    });

    it('wraps overflow content with correct data-testid', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} overflowItems={overflowItems} />);
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      fireEvent.click(screen.getByTestId('pi-overflow-item-data'));
      expect(screen.getByTestId('pi-overflow-content-data')).toBeDefined();
    });

    it('shows dismissible close button when overflow item is active', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} overflowItems={overflowItems} />);
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      fireEvent.click(screen.getByTestId('pi-overflow-item-data'));
      expect(screen.getByTestId('pi-overflow-close-data')).toBeDefined();
    });

    it('closes overflow item and returns to tab content on close click', () => {
      render(<PIPanelBase {...defaultProps} tabs={tabsConfig} overflowItems={overflowItems} />);
      fireEvent.click(screen.getByTestId('pi-overflow-trigger'));
      fireEvent.click(screen.getByTestId('pi-overflow-item-data'));
      fireEvent.click(screen.getByTestId('pi-overflow-close-data'));
      expect(screen.getByTestId('config-stats-content')).toBeDefined();
    });
  });
});
