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
  };
});

import DocumentRow from '../DocumentRow';
import type { DocumentInfo } from '../types';

const doc: DocumentInfo = {
  id: 'doc-abc',
  fileName: 'Analysis Report.pdf',
  fileSize: 204800, // 200 KB
  uploadedBy: 'alice',
  uploadedAt: '2026-04-01T10:00:00Z',
  mimeType: 'application/pdf',
};

const defaultProps = {
  document: doc,
  onDelete: vi.fn(),
  onDownload: vi.fn(),
};

describe('DocumentRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders file name', () => {
    render(<DocumentRow {...defaultProps} />);
    expect(screen.getByTestId(`document-name-${doc.id}`).textContent).toBe(doc.fileName);
  });

  it('renders formatted file size', () => {
    render(<DocumentRow {...defaultProps} />);
    const row = screen.getByTestId(`document-row-${doc.id}`);
    expect(row.textContent).toContain('200.0 KB');
  });

  it('renders uploader name', () => {
    render(<DocumentRow {...defaultProps} />);
    const row = screen.getByTestId(`document-row-${doc.id}`);
    expect(row.textContent).toContain('alice');
  });

  it('calls onDownload with correct args when download button clicked', () => {
    render(<DocumentRow {...defaultProps} />);
    fireEvent.click(screen.getByTestId(`document-download-${doc.id}`));
    expect(defaultProps.onDownload).toHaveBeenCalledOnce();
    expect(defaultProps.onDownload).toHaveBeenCalledWith(doc.id, doc.fileName);
  });

  it('calls onDelete with correct args when delete button clicked', () => {
    render(<DocumentRow {...defaultProps} />);
    fireEvent.click(screen.getByTestId(`document-delete-${doc.id}`));
    expect(defaultProps.onDelete).toHaveBeenCalledOnce();
    expect(defaultProps.onDelete).toHaveBeenCalledWith(doc.id, doc.fileName);
  });

  it('highlights matching text when highlightText provided', () => {
    render(<DocumentRow {...defaultProps} highlightText="Report" />);
    const mark = screen.getByTestId(`document-name-${doc.id}`).querySelector('mark');
    expect(mark).toBeTruthy();
    expect(mark?.textContent).toBe('Report');
  });

  it('does not render highlight mark when highlightText is absent', () => {
    render(<DocumentRow {...defaultProps} />);
    const mark = screen.getByTestId(`document-name-${doc.id}`).querySelector('mark');
    expect(mark).toBeNull();
  });

  it('does not highlight when text does not match', () => {
    render(<DocumentRow {...defaultProps} highlightText="xyz-no-match" />);
    const mark = screen.getByTestId(`document-name-${doc.id}`).querySelector('mark');
    expect(mark).toBeNull();
  });
});
