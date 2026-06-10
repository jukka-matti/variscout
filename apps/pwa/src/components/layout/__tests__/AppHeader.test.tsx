import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock MUST come before component imports (testing.md invariant)

vi.mock('@variscout/hooks', async () => {
  const actual = await vi.importActual('@variscout/hooks');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const msgs: Record<string, string> = {
          'nav.newAnalysis': 'New Analysis',
          'nav.settings': 'Settings',
          'nav.export': 'Export',
          'nav.menu': 'Menu',
          'nav.hideFindings': 'Hide Findings',
          'panel.findings': 'Findings',
          'panel.whatIf': 'What-If',
          'workspace.process': 'Process',
          'workspace.explore': 'Explore',
          'workspace.analyze': 'Analyze',
          'workspace.improve': 'Improve',
          'workspace.project': 'Project',
          'workspace.report': 'Report',
        };
        return msgs[key] ?? key;
      },
      tf: (key: string) => key,
      locale: 'en' as const,
      formatNumber: (v: number) => String(v),
      formatStat: (v: number) => String(v),
      formatPct: (v: number) => `${v}%`,
    }),
  };
});

// Stub sub-components so we only test AppHeader's own rendering
vi.mock('../MobileMenu', () => ({ default: () => null }));
vi.mock('../../SharePopover', () => ({ default: () => null }));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AppHeader, { type PhaseId } from '../AppHeader';

const baseProps = {
  hasData: false,
  dataFilename: null,
  rowCount: 0,
  onNewAnalysis: vi.fn(),
  onToggleFindingsPanel: vi.fn(),
  onOpenDataTable: vi.fn(),
  onExportCSV: vi.fn(),
  onExportImage: vi.fn(),
  onOpenSettings: vi.fn(),
  onReset: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AppHeader', () => {
  describe('phase tabs — hidden when no data', () => {
    it('does not render the phase-tabs nav when hasData is false', () => {
      render(<AppHeader {...baseProps} />);
      expect(screen.queryByTestId('workflow-nav')).toBeNull();
    });
  });

  describe('phase tabs — rendered inside the app bar when hasData', () => {
    const withDataProps = {
      ...baseProps,
      hasData: true,
      dataFilename: 'test.csv',
      rowCount: 100,
    };

    it('renders all phase tab buttons inside the app bar', () => {
      const onPhaseChange = vi.fn();
      render(<AppHeader {...withDataProps} activePhase="explore" onPhaseChange={onPhaseChange} />);

      const nav = screen.getByTestId('workflow-nav');
      expect(nav).toBeTruthy();

      // Order per wedge V1 vocabulary rename (2026-05-27):
      //   Home · Project · Process · Explore · Analyze · Improve · Report
      const phases: PhaseId[] = [
        'home',
        'project',
        'process',
        'explore',
        'analyze',
        'improvement',
        'report',
      ];
      for (const phase of phases) {
        expect(screen.getByTestId(`workflow-tab-${phase}`)).toBeTruthy();
      }
    });

    it('marks the active phase tab with aria-selected=true (role="tab" pattern)', () => {
      const onPhaseChange = vi.fn();
      render(<AppHeader {...withDataProps} activePhase="analyze" onPhaseChange={onPhaseChange} />);

      const analyzeBtn = screen.getByTestId('workflow-tab-analyze');
      expect(analyzeBtn.getAttribute('aria-selected')).toBe('true');
      expect(analyzeBtn.getAttribute('role')).toBe('tab');

      const exploreBtn = screen.getByTestId('workflow-tab-explore');
      expect(exploreBtn.getAttribute('aria-selected')).toBe('false');
    });

    it('renders a tablist container for the phase tabs', () => {
      const onPhaseChange = vi.fn();
      render(<AppHeader {...withDataProps} activePhase="explore" onPhaseChange={onPhaseChange} />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeTruthy();
    });

    it('calls onPhaseChange with the correct phase id when a tab is clicked', () => {
      const onPhaseChange = vi.fn();
      render(<AppHeader {...withDataProps} activePhase="explore" onPhaseChange={onPhaseChange} />);

      fireEvent.click(screen.getByTestId('workflow-tab-process'));
      expect(onPhaseChange).toHaveBeenCalledWith('process');

      fireEvent.click(screen.getByTestId('workflow-tab-home'));
      expect(onPhaseChange).toHaveBeenCalledWith('home');

      fireEvent.click(screen.getByTestId('workflow-tab-analyze'));
      expect(onPhaseChange).toHaveBeenCalledWith('analyze');

      fireEvent.click(screen.getByTestId('workflow-tab-explore'));
      expect(onPhaseChange).toHaveBeenCalledWith('explore');

      fireEvent.click(screen.getByTestId('workflow-tab-improvement'));
      expect(onPhaseChange).toHaveBeenCalledWith('improvement');

      fireEvent.click(screen.getByTestId('workflow-tab-project'));
      expect(onPhaseChange).toHaveBeenCalledWith('project');

      fireEvent.click(screen.getByTestId('workflow-tab-report'));
      expect(onPhaseChange).toHaveBeenCalledWith('report');
    });

    it('does not render phase tabs when activePhase is undefined', () => {
      render(<AppHeader {...withDataProps} />);
      expect(screen.queryByTestId('workflow-nav')).toBeNull();
    });

    it('phase tabs are rendered inside the header element (not a separate strip)', () => {
      const onPhaseChange = vi.fn();
      render(<AppHeader {...withDataProps} activePhase="explore" onPhaseChange={onPhaseChange} />);

      const header = document.querySelector('header');
      const nav = screen.getByTestId('workflow-nav');
      expect(header?.contains(nav)).toBe(true);
    });
  });

  describe('right-side toolbar', () => {
    it('renders Settings button when hasData', () => {
      render(<AppHeader {...baseProps} hasData={true} dataFilename="test.csv" rowCount={10} />);
      expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
    });

    it('renders Workspace Project chip and wires the title action', () => {
      const onOpenWorkspaceProject = vi.fn();

      render(
        <AppHeader
          {...baseProps}
          hasData={true}
          dataFilename="test.csv"
          rowCount={10}
          workspaceProjectTitle="Heads 5-8 Cpk shortfall"
          onOpenWorkspaceProject={onOpenWorkspaceProject}
        />
      );

      expect(screen.getByTestId('workspace-project-chip')).toHaveTextContent(
        '◆ Workspace Project: Heads 5-8 Cpk shortfall'
      );
      fireEvent.click(
        screen.getByRole('button', { name: /Open Project Heads 5-8 Cpk shortfall/i })
      );
      expect(onOpenWorkspaceProject).toHaveBeenCalledOnce();
      expect(screen.queryByRole('button', { name: 'Exit Workspace' })).not.toBeInTheDocument();
    });
  });
});
