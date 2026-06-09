import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceProjectChip } from '../WorkspaceProjectChip';
import { normalizeColor } from '../../../test-utils/color';

describe('WorkspaceProjectChip', () => {
  it('renders Workspace Project text with a title control', () => {
    render(<WorkspaceProjectChip title="Heads 5-8 Cpk shortfall" onTitleClick={() => {}} />);

    expect(screen.getByTestId('workspace-project-chip')).toHaveTextContent(
      '◆ Workspace Project: Heads 5-8 Cpk shortfall'
    );
    expect(
      screen.getByRole('button', { name: 'Open Project Heads 5-8 Cpk shortfall' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exit Workspace' })).not.toBeInTheDocument();
  });

  it('uses the required inline chip style', () => {
    render(<WorkspaceProjectChip title="Reduce rework" onTitleClick={() => {}} />);

    const chip = screen.getByTestId('workspace-project-chip');
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
      <WorkspaceProjectChip title="Reduce rework" onTitleClick={onTitleClick} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Project Reduce rework' }));

    expect(onTitleClick).toHaveBeenCalledOnce();
    expect(container.querySelectorAll('button button')).toHaveLength(0);
  });
});
