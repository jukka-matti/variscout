import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IPContextChip } from '../IPContextChip';
import { normalizeColor } from '../../../test-utils/color';

describe('IPContextChip', () => {
  it('renders Workspace Project text with a title control', () => {
    render(<IPContextChip title="Heads 5-8 Cpk shortfall" onTitleClick={() => {}} />);

    expect(screen.getByTestId('ip-context-chip')).toHaveTextContent(
      '◆ Workspace Project: Heads 5-8 Cpk shortfall'
    );
    expect(
      screen.getByRole('button', { name: 'Open Project Heads 5-8 Cpk shortfall' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exit IP' })).not.toBeInTheDocument();
  });

  it('uses the required inline chip style', () => {
    render(<IPContextChip title="Reduce rework" onTitleClick={() => {}} />);

    const chip = screen.getByTestId('ip-context-chip');
    expect(chip.style.padding).toBe('4px 10px');
    expect(chip.style.background).toBe('rgba(99, 102, 241, 0.06)');
    expect(chip.style.border).toBe('1px solid rgba(99, 102, 241, 0.2)');
    expect(chip.style.borderRadius).toBe('999px');
    // Normalize CSS color — jsdom returns 'rgb(79, 70, 229)', happy-dom preserves '#4f46e5'.
    // Both represent the same color; test what the component renders, not the DOM impl's format.
    expect(normalizeColor(chip.style.color)).toBe('rgb(79, 70, 229)');
  });

  it('calls the title callback without nesting interactive elements', () => {
    const onTitleClick = vi.fn();
    const { container } = render(
      <IPContextChip title="Reduce rework" onTitleClick={onTitleClick} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Project Reduce rework' }));

    expect(onTitleClick).toHaveBeenCalledOnce();
    expect(container.querySelectorAll('button button')).toHaveLength(0);
  });
});
