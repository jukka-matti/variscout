import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportViewBase } from '../ReportViewBase';
import type { ReportViewBaseProps } from '../ReportViewBase';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultSections: ReportViewBaseProps['sections'] = [
  { id: 'current-condition', stepNumber: 1, title: 'Current condition', status: 'active' },
  { id: 'drivers', stepNumber: 2, title: 'Drivers', status: 'active' },
  { id: 'hypotheses', stepNumber: 3, title: 'Hypotheses', status: 'future' },
];

function defaultProps(overrides: Partial<ReportViewBaseProps> = {}): ReportViewBaseProps {
  return {
    processName: 'Filling Machine A',
    reportType: 'quick-check',
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
    it('renders Quick Check badge for quick-check report type', () => {
      render(<ReportViewBase {...defaultProps({ reportType: 'quick-check' })} />);
      expect(screen.getByText('Quick Check')).toBeDefined();
    });

    it('renders Deep Dive badge for deep-dive report type', () => {
      render(<ReportViewBase {...defaultProps({ reportType: 'deep-dive' })} />);
      expect(screen.getByText('Deep Dive')).toBeDefined();
    });

    it('renders Full Cycle badge for full-cycle report type', () => {
      render(<ReportViewBase {...defaultProps({ reportType: 'full-cycle' })} />);
      expect(screen.getByText('Full Cycle')).toBeDefined();
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
    expect(screen.getByTestId('section-hypotheses')).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ReportViewBase {...defaultProps({ onClose })} />);
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
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
      expect(screen.getByText('Share Report')).toBeDefined();
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
      fireEvent.click(screen.getByText('Share Report'));
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
