import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WallShortcutButton } from '../WallShortcutButton';

describe('WallShortcutButton', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-locale', 'en');
  });

  it('renders a button with accessible name Open Wall and a visible label', () => {
    render(<WallShortcutButton onClick={() => undefined} />);

    const button = screen.getByRole('button', { name: 'Open Wall' });

    expect(button).toHaveTextContent('Open Wall');
    expect(button).toHaveAttribute('title', 'Open Wall');
  });

  it('renders an external-link icon', () => {
    render(<WallShortcutButton onClick={() => undefined} />);

    expect(screen.getByTestId('canvas-wall-shortcut-icon')).toBeInTheDocument();
  });

  it('calls onClick exactly once on click', () => {
    const onClick = vi.fn();
    render(<WallShortcutButton onClick={onClick} />);

    fireEvent.click(screen.getByTestId('canvas-wall-shortcut-button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled and does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<WallShortcutButton onClick={onClick} disabled />);

    const button = screen.getByRole('button', { name: 'Open Wall' });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
