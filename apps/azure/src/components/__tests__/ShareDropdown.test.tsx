import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ShareDropdown } from '../ShareDropdown';

// Mock clipboard (restore original after tests)
const originalClipboard = navigator.clipboard;
const writeText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, { clipboard: { writeText } });
afterAll(() => {
  Object.assign(navigator, { clipboard: originalClipboard });
});

describe('ShareDropdown', () => {
  const defaultProps = {
    deepLinkUrl: 'https://example.com/?project=Test',
    showPublishReport: false,
    onPublishReport: vi.fn(),
    onToast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders share button', () => {
    render(<ShareDropdown {...defaultProps} />);
    expect(screen.getByTestId('btn-share')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<ShareDropdown {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    expect(screen.getByText('Copy link')).toBeInTheDocument();
  });

  it('does not show "Share in Teams" (removed per ADR-059)', () => {
    render(<ShareDropdown {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    expect(screen.queryByText('Share in Teams')).not.toBeInTheDocument();
  });

  it('hides "Publish report" when not in report view', () => {
    render(<ShareDropdown {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    expect(screen.queryByText('Publish report')).not.toBeInTheDocument();
  });

  it('shows "Publish report" when in report view + team plan', () => {
    render(<ShareDropdown {...defaultProps} showPublishReport={true} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    expect(screen.getByText('Publish report')).toBeInTheDocument();
  });

  it('copies link to clipboard and shows toast', async () => {
    render(<ShareDropdown {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    fireEvent.click(screen.getByText('Copy link'));
    expect(writeText).toHaveBeenCalledWith('https://example.com/?project=Test');
    await vi.waitFor(() => {
      expect(defaultProps.onToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', message: expect.stringContaining('copied') })
      );
    });
  });

  // onShareTeams test removed per ADR-059 (Teams SDK removed)

  it('closes dropdown after action', () => {
    render(<ShareDropdown {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-share'));
    expect(screen.getByText('Copy link')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Copy link'));
    expect(screen.queryByText('Copy link')).not.toBeInTheDocument();
  });
});
