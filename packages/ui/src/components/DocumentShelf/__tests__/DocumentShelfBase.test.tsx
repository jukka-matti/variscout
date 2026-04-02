import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@variscout/hooks')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      formatStat: (n: number) => String(n),
      locale: 'en',
    }),
    useTooltipPosition: () => ({ position: 'top', style: {} }),
  };
});

import DocumentShelfBase from '../DocumentShelfBase';
import type { DocumentInfo } from '../types';

const makeDoc = (overrides: Partial<DocumentInfo> = {}): DocumentInfo => ({
  id: 'doc-1',
  fileName: 'Report.pdf',
  fileSize: 12345,
  uploadedAt: '2026-04-01T10:00:00Z',
  ...overrides,
});

const defaultProps = {
  documents: [],
  onUpload: vi.fn(),
  onDelete: vi.fn(),
  onDownload: vi.fn(),
};

describe('DocumentShelfBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders drop zone', () => {
    render(<DocumentShelfBase {...defaultProps} />);
    expect(screen.getByTestId('document-drop-zone')).toBeTruthy();
  });

  it('renders filter input', () => {
    render(<DocumentShelfBase {...defaultProps} />);
    expect(screen.getByTestId('document-filter-input')).toBeTruthy();
  });

  it('renders empty state when no documents', () => {
    render(<DocumentShelfBase {...defaultProps} />);
    expect(screen.getByTestId('document-empty-state')).toBeTruthy();
  });

  it('renders auto-index summary when provided', () => {
    render(
      <DocumentShelfBase
        {...defaultProps}
        autoIndexSummary={{ findings: 3, answers: 7, conclusions: 2 }}
      />
    );
    expect(screen.getByTestId('auto-index-summary')).toBeTruthy();
    expect(screen.getByTestId('auto-index-findings').textContent).toBe('3 findings');
    expect(screen.getByTestId('auto-index-answers').textContent).toBe('7 answers');
    expect(screen.getByTestId('auto-index-conclusions').textContent).toBe('2 conclusions');
  });

  it('does not render auto-index summary when not provided', () => {
    render(<DocumentShelfBase {...defaultProps} />);
    expect(screen.queryByTestId('auto-index-summary')).toBeNull();
  });

  it('renders documents sorted alphabetically', () => {
    const docs: DocumentInfo[] = [
      makeDoc({ id: 'doc-3', fileName: 'Zebra.pdf' }),
      makeDoc({ id: 'doc-1', fileName: 'Alpha.pdf' }),
      makeDoc({ id: 'doc-2', fileName: 'Mango.xlsx' }),
    ];
    render(<DocumentShelfBase {...defaultProps} documents={docs} />);
    const rows = screen.getAllByTestId(/^document-row-/);
    expect(rows[0].getAttribute('data-testid')).toBe('document-row-doc-1');
    expect(rows[1].getAttribute('data-testid')).toBe('document-row-doc-2');
    expect(rows[2].getAttribute('data-testid')).toBe('document-row-doc-3');
  });

  it('filters documents by name (case-insensitive)', () => {
    const docs: DocumentInfo[] = [
      makeDoc({ id: 'doc-1', fileName: 'Alpha Report.pdf' }),
      makeDoc({ id: 'doc-2', fileName: 'Beta Analysis.xlsx' }),
      makeDoc({ id: 'doc-3', fileName: 'alpha notes.txt' }),
    ];
    render(<DocumentShelfBase {...defaultProps} documents={docs} />);

    const input = screen.getByTestId('document-filter-input');
    fireEvent.change(input, { target: { value: 'alpha' } });

    expect(screen.getByTestId('document-row-doc-1')).toBeTruthy();
    expect(screen.getByTestId('document-row-doc-3')).toBeTruthy();
    expect(screen.queryByTestId('document-row-doc-2')).toBeNull();
  });

  it('shows no-results state when filter matches nothing', () => {
    const docs: DocumentInfo[] = [makeDoc({ id: 'doc-1', fileName: 'Report.pdf' })];
    render(<DocumentShelfBase {...defaultProps} documents={docs} />);

    const input = screen.getByTestId('document-filter-input');
    fireEvent.change(input, { target: { value: 'xyz-no-match' } });

    expect(screen.getByTestId('document-no-results')).toBeTruthy();
  });

  it('clear button removes filter', () => {
    const docs: DocumentInfo[] = [makeDoc({ id: 'doc-1', fileName: 'Report.pdf' })];
    render(<DocumentShelfBase {...defaultProps} documents={docs} />);

    const input = screen.getByTestId('document-filter-input');
    fireEvent.change(input, { target: { value: 'xyz' } });
    expect(screen.getByTestId('document-filter-clear')).toBeTruthy();

    fireEvent.click(screen.getByTestId('document-filter-clear'));
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('upload button triggers file picker', () => {
    render(<DocumentShelfBase {...defaultProps} />);
    const browseButton = screen.getByTestId('document-browse-button');
    expect(browseButton).toBeTruthy();
  });

  it('shows upload progress when isUploading', () => {
    render(
      <DocumentShelfBase {...defaultProps} isUploading uploadProgress="Uploading 2 of 5..." />
    );
    expect(screen.getByTestId('upload-progress').textContent).toBe('Uploading 2 of 5...');
  });

  it('shows error message when error is set', () => {
    render(<DocumentShelfBase {...defaultProps} error="Upload failed: file too large" />);
    expect(screen.getByTestId('upload-error').textContent).toBe('Upload failed: file too large');
  });
});
