import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PasteScreen from '../data/PasteScreen';

describe('PasteScreen', () => {
  const defaultProps = {
    onAnalyze: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    error: null as string | null,
  };

  it('renders textarea and analyze button', () => {
    render(<PasteScreen {...defaultProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze data/i })).toBeInTheDocument();
  });

  it('analyze button is disabled when textarea is empty', () => {
    render(<PasteScreen {...defaultProps} />);
    const button = screen.getByRole('button', { name: /analyze data/i });
    expect(button).toBeDisabled();
  });

  it('analyze button is enabled when text is present', () => {
    render(<PasteScreen {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Weight\tShift\n12.1\tDay' } });
    const button = screen.getByRole('button', { name: /analyze data/i });
    expect(button).not.toBeDisabled();
  });

  it('calls onAnalyze with text on button click', async () => {
    const onAnalyze = vi.fn().mockResolvedValue(undefined);
    render(<PasteScreen {...defaultProps} onAnalyze={onAnalyze} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Weight\tShift\n12.1\tDay' } });

    const button = screen.getByRole('button', { name: /analyze data/i });
    fireEvent.click(button);

    expect(onAnalyze).toHaveBeenCalledWith('Weight\tShift\n12.1\tDay');
  });

  it('shows error message when error prop is set', () => {
    render(<PasteScreen {...defaultProps} error="No data rows found" />);
    expect(screen.getByRole('alert')).toHaveTextContent('No data rows found');
  });

  it('does not show error when error prop is null', () => {
    render(<PasteScreen {...defaultProps} error={null} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onCancel when back button is clicked', () => {
    const onCancel = vi.fn();
    render(<PasteScreen {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('populates example data when "Use example data" is clicked', () => {
    render(<PasteScreen {...defaultProps} />);
    const exampleButton = screen.getByText(/use example data/i);
    fireEvent.click(exampleButton);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toContain('Measurement');
    expect(textarea.value).toContain('Shift');
  });

  it('hides "Use example data" when text is present', () => {
    render(<PasteScreen {...defaultProps} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'some data' } });
    expect(screen.queryByText(/use example data/i)).not.toBeInTheDocument();
  });
});
