import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { operatorColors } from '@variscout/charts';
import { TagChip } from '../TagChip';

describe('TagChip', () => {
  it('renders a compact hash-prefixed tag label', () => {
    render(<TagChip tag="Night Shift" />);

    expect(screen.getByText('#Night Shift')).toBeInTheDocument();
  });

  it('applies a deterministic theme-derived border color', () => {
    render(
      <>
        <TagChip tag="Night Shift" />
        <TagChip tag="Night Shift" />
      </>
    );

    const chips = screen
      .getAllByText('#Night Shift')
      .map(label => label.closest('[data-theme-color]') as HTMLElement);
    const firstColor = chips[0].getAttribute('data-theme-color');
    const secondColor = chips[1].getAttribute('data-theme-color');

    expect(firstColor).toBe(secondColor);
    expect(operatorColors).toContain(firstColor);
    expect(chips[0]).toHaveStyle({ borderColor: firstColor });
  });
});
