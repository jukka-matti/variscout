import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewSnapshotsChip } from '../NewSnapshotsChip';

describe('NewSnapshotsChip', () => {
  it('renders nothing when count = 0', () => {
    const { container } = render(<NewSnapshotsChip count={0} onClick={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
  it('renders count + ↑ when count > 0', () => {
    render(<NewSnapshotsChip count={3} onClick={vi.fn()} />);
    expect(screen.getByTestId('new-snapshots-chip')).toBeInTheDocument();
    expect(screen.getByText(/3 new snapshots/)).toBeInTheDocument();
  });
  it('singular form for count = 1', () => {
    render(<NewSnapshotsChip count={1} onClick={vi.fn()} />);
    expect(screen.getByText(/1 new snapshot ↑/)).toBeInTheDocument();
  });
  it('calls onClick on click', () => {
    const onClick = vi.fn();
    render(<NewSnapshotsChip count={2} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('new-snapshots-chip'));
    expect(onClick).toHaveBeenCalled();
  });
});
