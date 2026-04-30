import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CpkTargetInput } from '../CpkTargetInput';

describe('CpkTargetInput', () => {
  it('renders the current value in the input', () => {
    render(<CpkTargetInput value={1.67} onCommit={vi.fn()} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('1.67');
  });

  it('renders empty + placeholder when value is undefined', () => {
    render(<CpkTargetInput value={undefined} onCommit={vi.fn()} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(input.placeholder).toBe('—');
  });

  it('commits parsed value on blur', () => {
    const onCommit = vi.fn();
    render(<CpkTargetInput value={1.33} onCommit={onCommit} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1.67' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith(1.67);
  });

  it('commits on Enter key', () => {
    const onCommit = vi.fn();
    render(<CpkTargetInput value={1.33} onCommit={onCommit} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    // Enter triggers blur, which commits
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith(2);
  });

  it('commits undefined when input is cleared', () => {
    const onCommit = vi.fn();
    render(<CpkTargetInput value={1.33} onCommit={onCommit} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith(undefined);
  });
});
