import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HypothesisDrawToolButton } from '../HypothesisDrawToolButton';

describe('HypothesisDrawToolButton', () => {
  it('renders unpressed for select tool', () => {
    render(<HypothesisDrawToolButton activeTool="select" onChange={() => undefined} />);

    expect(screen.getByRole('button', { name: /draw hypothesis/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('renders pressed for draw-hypothesis tool', () => {
    render(<HypothesisDrawToolButton activeTool="draw-hypothesis" onChange={() => undefined} />);

    expect(screen.getByRole('button', { name: /draw hypothesis/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('toggles from select to draw-hypothesis', () => {
    const onChange = vi.fn();
    render(<HypothesisDrawToolButton activeTool="select" onChange={onChange} />);

    fireEvent.click(screen.getByTestId('hypothesis-draw-tool-button'));

    expect(onChange).toHaveBeenCalledWith('draw-hypothesis');
  });

  it('toggles from draw-hypothesis to select', () => {
    const onChange = vi.fn();
    render(<HypothesisDrawToolButton activeTool="draw-hypothesis" onChange={onChange} />);

    fireEvent.click(screen.getByTestId('hypothesis-draw-tool-button'));

    expect(onChange).toHaveBeenCalledWith('select');
  });

  it('does not call onChange while disabled', () => {
    const onChange = vi.fn();
    render(<HypothesisDrawToolButton activeTool="select" onChange={onChange} disabled />);

    fireEvent.click(screen.getByTestId('hypothesis-draw-tool-button'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
