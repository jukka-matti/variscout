import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IPContextChip } from '../IPContextChip';

describe('IPContextChip', () => {
  it('renders the exact working-in-IP text with separate title and exit controls', () => {
    render(
      <IPContextChip title="Heads 5-8 Cpk shortfall" onTitleClick={() => {}} onExitIP={() => {}} />
    );

    expect(screen.getByTestId('ip-context-chip')).toHaveTextContent(
      '◆ Working in IP: Heads 5-8 Cpk shortfall · Exit IP'
    );
    expect(
      screen.getByRole('button', { name: 'Open IP Heads 5-8 Cpk shortfall' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exit IP' })).toBeInTheDocument();
  });

  it('uses the required inline chip style', () => {
    render(<IPContextChip title="Reduce rework" onTitleClick={() => {}} onExitIP={() => {}} />);

    const chip = screen.getByTestId('ip-context-chip');
    expect(chip.style.padding).toBe('4px 10px');
    expect(chip.style.background).toBe('rgba(99, 102, 241, 0.06)');
    expect(chip.style.border).toBe('1px solid rgba(99, 102, 241, 0.2)');
    expect(chip.style.borderRadius).toBe('999px');
    expect(chip.style.color).toBe('rgb(79, 70, 229)');
  });

  it('calls title and exit callbacks without nesting interactive elements', () => {
    const onTitleClick = vi.fn();
    const onExitIP = vi.fn();
    const { container } = render(
      <IPContextChip title="Reduce rework" onTitleClick={onTitleClick} onExitIP={onExitIP} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open IP Reduce rework' }));
    fireEvent.click(screen.getByRole('button', { name: 'Exit IP' }));

    expect(onTitleClick).toHaveBeenCalledOnce();
    expect(onExitIP).toHaveBeenCalledOnce();
    expect(container.querySelectorAll('button button')).toHaveLength(0);
  });
});
