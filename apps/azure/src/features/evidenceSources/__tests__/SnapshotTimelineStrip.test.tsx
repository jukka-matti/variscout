import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SnapshotTimelineStrip } from '../SnapshotTimelineStrip';
import type { EvidenceSnapshot } from '@variscout/core';

const makeSnap = (id: string, capturedAt: string): EvidenceSnapshot => ({
  id,
  hubId: 'h1',
  sourceId: 's1',
  capturedAt,
  rowCount: 10,
  origin: 'test',
  importedAt: new Date(capturedAt).getTime(),
  createdAt: new Date(capturedAt).getTime(),
  deletedAt: null,
});

describe('SnapshotTimelineStrip', () => {
  it('renders nothing when no snapshots', () => {
    const { container } = render(
      <SnapshotTimelineStrip allSnapshots={[]} newSnapshotIds={new Set()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders one segment per snapshot', () => {
    const all = [
      makeSnap('s-1', '2026-04-01T00:00:00Z'),
      makeSnap('s-2', '2026-04-15T00:00:00Z'),
      makeSnap('s-3', '2026-04-30T00:00:00Z'),
    ];
    render(<SnapshotTimelineStrip allSnapshots={all} newSnapshotIds={new Set(['s-3'])} />);
    expect(screen.getByTestId('snapshot-timeline-strip')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-segment-s-1')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-segment-s-3')).toHaveClass('bg-green-400');
    expect(screen.getByTestId('snapshot-segment-s-1')).not.toHaveClass('bg-green-400');
  });
});
