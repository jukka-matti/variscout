import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PasteScreen from '../data/PasteScreen';

describe('PasteScreen', () => {
  const defaultProps = {
    onAnalyze: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    error: null,
  };

  it('renders heading and textarea', () => {
    render(<PasteScreen {...defaultProps} />);
    expect(screen.getByText('Paste Your Data')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Paste rows from Excel, Google Sheets, or a CSV file...')
    ).toBeInTheDocument();
  });

  it('disables Analyze button when textarea is empty', () => {
    render(<PasteScreen {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /analyze data/i });
    expect(btn).toBeDisabled();
  });

  it('enables Analyze button when text is entered', () => {
    render(<PasteScreen {...defaultProps} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'A\tB\n1\t2' } });
    const btn = screen.getByRole('button', { name: /analyze data/i });
    expect(btn).not.toBeDisabled();
  });

  it('calls onAnalyze with text when button is clicked', async () => {
    const onAnalyze = vi.fn().mockResolvedValue(undefined);
    render(<PasteScreen {...defaultProps} onAnalyze={onAnalyze} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'X\tY\n1\t2' } });
    fireEvent.click(screen.getByRole('button', { name: /analyze data/i }));
    await waitFor(() => {
      expect(onAnalyze).toHaveBeenCalledWith('X\tY\n1\t2');
    });
  });

  it('calls onCancel when Back is clicked', () => {
    render(<PasteScreen {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('populates example data when link is clicked', () => {
    render(<PasteScreen {...defaultProps} />);
    fireEvent.click(screen.getByText('Use example data'));
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toContain('Measurement');
    expect(textarea.value).toContain('Alice');
  });

  it('displays error message', () => {
    render(<PasteScreen {...defaultProps} error="Could not parse data" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not parse data');
  });

  it('supports Ctrl+Enter shortcut', async () => {
    const onAnalyze = vi.fn().mockResolvedValue(undefined);
    render(<PasteScreen {...defaultProps} onAnalyze={onAnalyze} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'A\tB\n1\t2' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    await waitFor(() => {
      expect(onAnalyze).toHaveBeenCalledWith('A\tB\n1\t2');
    });
  });
});
