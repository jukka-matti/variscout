import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportViewBase } from '../ReportViewBase';
import type { ReportViewBaseProps } from '../ReportViewBase';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultSections: ReportViewBaseProps['sections'] = [
  {
    id: 'current-condition',
    stepNumber: 1,
    title: 'Current condition',
    status: 'active',
    workspace: 'analysis',
  },
  { id: 'drivers', stepNumber: 2, title: 'Drivers', status: 'active', workspace: 'analysis' },
  {
    id: 'evidence-trail',
    stepNumber: 3,
    title: 'Evidence trail',
    status: 'future',
    workspace: 'findings',
  },
];

function defaultProps(overrides: Partial<ReportViewBaseProps> = {}): ReportViewBaseProps {
  return {
    processName: 'Filling Machine A',
    reportType: 'analysis-snapshot',
    sections: defaultSections,
    activeSectionId: 'current-condition',
    onScrollToSection: vi.fn(),
    renderSection: section => (
      <div key={section.id} data-testid={`section-${section.id}`}>
        {section.title}
      </div>
    ),
    onClose: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReportViewBase', () => {
  it('renders the process name in the header', () => {
    render(<ReportViewBase {...defaultProps()} />);
    // Process name appears in header and print header
    expect(screen.getAllByText('Filling Machine A').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the analystName when provided', () => {
    render(<ReportViewBase {...defaultProps({ analystName: 'Jane Doe' })} />);
    // Analyst name appears in header and print footer
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThanOrEqual(1);
  });

  it('does not render analystName when not provided', () => {
    render(<ReportViewBase {...defaultProps()} />);
    expect(screen.queryByText('Jane Doe')).toBeNull();
  });

  describe('report type badge', () => {
    it('renders Analysis Snapshot badge for analysis-snapshot report type', () => {
      render(<ReportViewBase {...defaultProps({ reportType: 'analysis-snapshot' })} />);
      expect(screen.getByText('Analysis Snapshot')).toBeDefined();
    });

    it('renders Investigation Report badge for investigation-report report type', () => {
      render(<ReportViewBase {...defaultProps({ reportType: 'investigation-report' })} />);
      expect(screen.getByText('Investigation Report')).toBeDefined();
    });

    it('renders Improvement Story badge for improvement-story report type', () => {
      render(<ReportViewBase {...defaultProps({ reportType: 'improvement-story' })} />);
      expect(screen.getByText('Improvement Story')).toBeDefined();
    });
  });

  it('calls renderSection for each section', () => {
    const renderSection = vi
      .fn()
      .mockImplementation(section => (
        <div key={section.id} data-testid={`section-${section.id}`} />
      ));
    render(<ReportViewBase {...defaultProps({ renderSection })} />);
    expect(renderSection).toHaveBeenCalledTimes(defaultSections.length);
  });

  it('renders the output of renderSection', () => {
    render(<ReportViewBase {...defaultProps()} />);
    expect(screen.getByTestId('section-current-condition')).toBeDefined();
    expect(screen.getByTestId('section-drivers')).toBeDefined();
    expect(screen.getByTestId('section-evidence-trail')).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ReportViewBase {...defaultProps({ onClose })} />);
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('workspace group headers', () => {
    it('renders workspace group labels in the sidebar', () => {
      render(<ReportViewBase {...defaultProps()} />);
      expect(screen.getByText('ANALYSIS')).toBeDefined();
      expect(screen.getByText('FINDINGS')).toBeDefined();
    });
  });

  describe('audience toggle', () => {
    it('renders audience toggle when onAudienceModeChange is provided', () => {
      const onAudienceModeChange = vi.fn();
      render(
        <ReportViewBase {...defaultProps({ audienceMode: 'technical', onAudienceModeChange })} />
      );
      expect(screen.getByText('Technical')).toBeDefined();
      expect(screen.getByText('Summary')).toBeDefined();
    });

    it('does not render audience toggle when onAudienceModeChange is not provided', () => {
      render(<ReportViewBase {...defaultProps()} />);
      expect(screen.queryByText('Summary')).toBeNull();
    });

    it('calls onAudienceModeChange when Summary is clicked', () => {
      const onAudienceModeChange = vi.fn();
      render(
        <ReportViewBase {...defaultProps({ audienceMode: 'technical', onAudienceModeChange })} />
      );
      fireEvent.click(screen.getByText('Summary'));
      expect(onAudienceModeChange).toHaveBeenCalledWith('summary');
    });
  });

  describe('Share button', () => {
    it('does not render Share button when canShareViaTeams is false', () => {
      render(
        <ReportViewBase
          {...defaultProps({
            canShareViaTeams: false,
            onShareReport: vi.fn(),
          })}
        />
      );
      expect(screen.queryByText('Share Report')).toBeNull();
    });

    it('does not render Share button when canShareViaTeams is undefined', () => {
      render(<ReportViewBase {...defaultProps()} />);
      expect(screen.queryByText('Share Report')).toBeNull();
    });

    it('renders Share button when canShareViaTeams is true and onShareReport is provided', () => {
      render(
        <ReportViewBase
          {...defaultProps({
            canShareViaTeams: true,
            onShareReport: vi.fn(),
          })}
        />
      );
      expect(screen.getAllByText('Share Report').length).toBeGreaterThan(0);
    });

    it('calls onShareReport when Share button is clicked', () => {
      const onShareReport = vi.fn();
      render(
        <ReportViewBase
          {...defaultProps({
            canShareViaTeams: true,
            onShareReport,
          })}
        />
      );
      fireEvent.click(screen.getAllByText('Share Report')[0]);
      expect(onShareReport).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onScrollToSection when a sidebar section button is clicked', () => {
    const onScrollToSection = vi.fn();
    render(<ReportViewBase {...defaultProps({ onScrollToSection })} />);
    // Click the first sidebar TOC button (by section title)
    const tocButtons = screen.getAllByText('Current condition');
    // There may be one in the sidebar and one from renderSection — click the first
    fireEvent.click(tocButtons[0]);
    expect(onScrollToSection).toHaveBeenCalledWith('current-condition');
  });
});
