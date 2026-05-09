import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MissingEvidenceDigest } from '../MissingEvidenceDigest';

const gaps = [
  { id: 'g1', message: 'H1 has no disconfirmation.', hubId: 'h1' },
  { id: 'g2', message: 'H2 has data but no gemba.' },
];

describe('MissingEvidenceDigest', () => {
  it('renders nothing when no gaps', () => {
    const { container } = render(<MissingEvidenceDigest gaps={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows collapsed summary by default', () => {
    render(<MissingEvidenceDigest gaps={gaps} />);
    expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument();
    expect(screen.queryByText(/disconfirmation/)).not.toBeInTheDocument();
  });

  it('expands on click and fires onFocusHub for hub-linked gaps', () => {
    const onFocusHub = vi.fn();
    render(<MissingEvidenceDigest gaps={gaps} onFocusHub={onFocusHub} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.click(screen.getByText(/disconfirmation/));
    expect(onFocusHub).toHaveBeenCalledWith('h1');
  });
});
