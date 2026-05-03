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
          'workspace.frame': 'Frame',
          'workspace.analysis': 'Analysis',
          'workspace.investigation': 'Investigation',
          'workspace.improvement': 'Improvement',
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
      expect(screen.queryByTestId('phase-tabs-inline')).toBeNull();
    });
  });

  describe('phase tabs — rendered inside the app bar when hasData', () => {
    const withDataProps = {
      ...baseProps,
      hasData: true,
      dataFilename: 'test.csv',
      rowCount: 100,
    };

    it('renders all five phase tab buttons inside the app bar', () => {
      const onPhaseChange = vi.fn();
      render(<AppHeader {...withDataProps} activePhase="analysis" onPhaseChange={onPhaseChange} />);

      const nav = screen.getByTestId('phase-tabs-inline');
      expect(nav).toBeTruthy();

      const phases: PhaseId[] = ['frame', 'analysis', 'investigation', 'improvement', 'report'];
      for (const phase of phases) {
        expect(screen.getByTestId(`phase-tab-${phase}`)).toBeTruthy();
      }
    });

    it('marks the active phase tab with aria-pressed=true', () => {
      const onPhaseChange = vi.fn();
      render(
        <AppHeader {...withDataProps} activePhase="investigation" onPhaseChange={onPhaseChange} />
      );

      const investigationBtn = screen.getByTestId('phase-tab-investigation');
      expect(investigationBtn.getAttribute('aria-pressed')).toBe('true');

      const analysisBtn = screen.getByTestId('phase-tab-analysis');
      expect(analysisBtn.getAttribute('aria-pressed')).toBe('false');
    });

    it('calls onPhaseChange with the correct phase id when a tab is clicked', () => {
      const onPhaseChange = vi.fn();
      render(<AppHeader {...withDataProps} activePhase="analysis" onPhaseChange={onPhaseChange} />);

      fireEvent.click(screen.getByTestId('phase-tab-frame'));
      expect(onPhaseChange).toHaveBeenCalledWith('frame');

      fireEvent.click(screen.getByTestId('phase-tab-investigation'));
      expect(onPhaseChange).toHaveBeenCalledWith('investigation');

      fireEvent.click(screen.getByTestId('phase-tab-improvement'));
      expect(onPhaseChange).toHaveBeenCalledWith('improvement');

      fireEvent.click(screen.getByTestId('phase-tab-report'));
      expect(onPhaseChange).toHaveBeenCalledWith('report');
    });

    it('does not render phase tabs when activePhase is undefined', () => {
      render(<AppHeader {...withDataProps} />);
      expect(screen.queryByTestId('phase-tabs-inline')).toBeNull();
    });

    it('phase tabs are rendered inside the header element (not a separate strip)', () => {
      const onPhaseChange = vi.fn();
      render(<AppHeader {...withDataProps} activePhase="analysis" onPhaseChange={onPhaseChange} />);

      const header = document.querySelector('header');
      const nav = screen.getByTestId('phase-tabs-inline');
      expect(header?.contains(nav)).toBe(true);
    });
  });

  describe('right-side toolbar', () => {
    it('renders Settings button when hasData', () => {
      render(<AppHeader {...baseProps} hasData={true} dataFilename="test.csv" rowCount={10} />);
      expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
    });
  });
});
