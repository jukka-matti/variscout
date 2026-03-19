import { describe, it, expect, vi } from 'vitest';

vi.mock('@variscout/hooks', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const map: Record<string, string> = {
          'data.pasteData': 'Paste Data',
          'data.pasteSubtitle': 'Copy from Excel, CSV, or any spreadsheet',
          'data.pasteInstructions': 'Paste your data here',
          'data.useExample': 'Use example data',
          'data.analyzing': 'Analyzing\u2026',
          'data.startAnalysis': 'Start Analysis',
          'data.back': 'Back',
          'data.tipWithData': 'Tip: Include column headers in the first row',
          'data.tipNoData': 'Tip: Try pasting data from a spreadsheet or CSV file',
          'action.save': 'Save',
          'action.cancel': 'Cancel',
        };
        return map[key] ?? key;
      },
      tf: (key: string, params: Record<string, string | number>) => {
        let msg = key;
        for (const [k, v] of Object.entries(params)) {
          msg = msg.replace(`{${k}}`, String(v));
        }
        return msg;
      },
      locale: 'en' as const,
      formatNumber: (v: number, d = 2) => v.toFixed(d),
      formatStat: (v: number, d = 2) => v.toFixed(d),
      formatPct: (v: number, d = 1) => `${(v * 100).toFixed(d)}%`,
    }),
  };
});

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
    expect(screen.getByText('Paste Data')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste your data here')).toBeInTheDocument();
  });

  it('disables Analyze button when textarea is empty', () => {
    render(<PasteScreen {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /start analysis/i });
    expect(btn).toBeDisabled();
  });

  it('enables Analyze button when text is entered', () => {
    render(<PasteScreen {...defaultProps} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'A\tB\n1\t2' } });
    const btn = screen.getByRole('button', { name: /start analysis/i });
    expect(btn).not.toBeDisabled();
  });

  it('calls onAnalyze with text when button is clicked', async () => {
    const onAnalyze = vi.fn().mockResolvedValue(undefined);
    render(<PasteScreen {...defaultProps} onAnalyze={onAnalyze} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'X\tY\n1\t2' } });
    fireEvent.click(screen.getByRole('button', { name: /start analysis/i }));
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
