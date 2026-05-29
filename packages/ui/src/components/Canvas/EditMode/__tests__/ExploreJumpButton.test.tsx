import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExploreJumpButton } from '../ExploreJumpButton';

describe('ExploreJumpButton', () => {
  it('renders a button with the parameterized aria-label', () => {
    render(<ExploreJumpButton label="Diameter" onClick={vi.fn()} />);
    const button = screen.getByRole('button', { name: /open diameter in explore/i });
    expect(button).toBeInTheDocument();
  });

  it('has data-testid="chip-explore-jump"', () => {
    render(<ExploreJumpButton label="Diameter" onClick={vi.fn()} />);
    expect(screen.getByTestId('chip-explore-jump')).toBeInTheDocument();
  });

  it('renders the → glyph as its child', () => {
    render(<ExploreJumpButton label="Diameter" onClick={vi.fn()} />);
    expect(screen.getByTestId('chip-explore-jump')).toHaveTextContent('→');
  });

  it('fires onClick when clicked and stops propagation', () => {
    const onClick = vi.fn();
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <ExploreJumpButton label="Diameter" onClick={onClick} />
      </div>
    );
    fireEvent.click(screen.getByTestId('chip-explore-jump'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();
  });
});
