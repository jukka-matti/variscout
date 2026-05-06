import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FindingsExportMenu from '../FindingsExportMenu';
import type { Finding } from '@variscout/core';

// Mock @variscout/core exports
vi.mock('@variscout/core', () => ({
  generateFindingsCSV: vi.fn(() => 'mock csv'),
  generateFindingsJSON: vi.fn(() => '{}'),
  downloadFindingsCSV: vi.fn(),
  downloadFindingsJSON: vi.fn(),
  FINDING_STATUS_LABELS: {
    observed: 'Observed',
    investigating: 'Investigating',
    analyzed: 'Analyzed',
    improving: 'Improving',
    resolved: 'Resolved',
  },
  FINDING_TAG_LABELS: {
    'key-driver': 'Key Driver',
    'low-impact': 'Low Impact',
  },
  formatFindingFilters: vi.fn(() => 'Machine=B'),
  getFindingStatus: vi.fn((f: Finding) => f.status),
}));

const mockFinding: Finding = {
  id: 'f1',
  text: 'Test finding',
  createdAt: 1714000000000,
  deletedAt: null,
  investigationId: 'general-unassigned',
  context: { activeFilters: {}, cumulativeScope: null },
  status: 'observed',
  comments: [],
  statusChangedAt: Date.now(),
};

describe('FindingsExportMenu', () => {
  it('renders nothing when findings are empty', () => {
    const { container } = render(<FindingsExportMenu findings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders export button when findings exist', () => {
    render(<FindingsExportMenu findings={[mockFinding]} />);
    expect(screen.getByTitle('Export findings')).toBeDefined();
  });

  it('opens dropdown on click', () => {
    render(<FindingsExportMenu findings={[mockFinding]} />);
    fireEvent.click(screen.getByTitle('Export findings'));
    expect(screen.getByText('Copy as text')).toBeDefined();
    expect(screen.getByText('Download CSV')).toBeDefined();
    expect(screen.getByText('Download JSON')).toBeDefined();
  });

  it('does not show AI report button without callback', () => {
    render(<FindingsExportMenu findings={[mockFinding]} />);
    fireEvent.click(screen.getByTitle('Export findings'));
    expect(screen.queryByText('Generate AI report')).toBeNull();
  });

  it('shows AI report button with callback', () => {
    const onReport = vi.fn().mockResolvedValue('report text');
    render(<FindingsExportMenu findings={[mockFinding]} onGenerateAIReport={onReport} />);
    fireEvent.click(screen.getByTitle('Export findings'));
    expect(screen.getByText('Generate AI report')).toBeDefined();
  });

  it('calls downloadFindingsCSV on CSV click', async () => {
    const { downloadFindingsCSV } = await import('@variscout/core');
    render(<FindingsExportMenu findings={[mockFinding]} />);
    fireEvent.click(screen.getByTitle('Export findings'));
    fireEvent.click(screen.getByText('Download CSV'));
    expect(downloadFindingsCSV).toHaveBeenCalledWith([mockFinding], undefined);
  });
});
