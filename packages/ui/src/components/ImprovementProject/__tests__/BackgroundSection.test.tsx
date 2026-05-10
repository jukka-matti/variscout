import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BackgroundSection } from '../sections/BackgroundSection';
import { BackgroundSnapshot } from '../sections/BackgroundSnapshot';

const snapshot = {
  value: 'Baseline Cpk is 0.84 across the last 12 weeks.',
  sourceHash: 'baseline-hash',
};

const matchingCurrent = {
  value: 'Baseline Cpk is 0.84 across the last 12 weeks.',
  hash: 'baseline-hash',
};

const changedCurrent = {
  value: 'Live Cpk is 1.12 across the last 12 weeks.',
  hash: 'live-hash',
};

describe('BackgroundSnapshot', () => {
  it('hides drift indicator when hashes match and shows it when hashes differ', () => {
    const { rerender } = render(
      <BackgroundSnapshot snapshot={snapshot} current={matchingCurrent} />
    );

    expect(screen.queryByText(/live source changed/i)).not.toBeInTheDocument();

    rerender(<BackgroundSnapshot snapshot={snapshot} current={changedCurrent} />);

    expect(screen.getByText(/live source changed/i)).toBeInTheDocument();
  });

  it('shows refresh only for drift with a callback and sends the refreshed snapshot payload', () => {
    const onRefreshFromLive = vi.fn();
    const { rerender } = render(
      <BackgroundSnapshot
        snapshot={snapshot}
        current={matchingCurrent}
        onRefreshFromLive={onRefreshFromLive}
      />
    );

    expect(screen.queryByRole('button', { name: /refresh from live/i })).not.toBeInTheDocument();

    rerender(<BackgroundSnapshot snapshot={snapshot} current={changedCurrent} />);

    expect(screen.queryByRole('button', { name: /refresh from live/i })).not.toBeInTheDocument();

    rerender(
      <BackgroundSnapshot
        snapshot={snapshot}
        current={changedCurrent}
        onRefreshFromLive={onRefreshFromLive}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /refresh from live/i }));

    expect(onRefreshFromLive).toHaveBeenCalledTimes(1);
    expect(onRefreshFromLive).toHaveBeenCalledWith({
      value: changedCurrent.value,
      sourceHash: changedCurrent.hash,
      snapshottedAt: expect.any(String),
    });
    expect(Date.parse(onRefreshFromLive.mock.calls[0][0].snapshottedAt)).not.toBeNaN();
  });

  it('clears drift after rerendering with the refreshed snapshot hash', () => {
    let refreshedSnapshot = snapshot;
    const onRefreshFromLive = vi.fn(nextSnapshot => {
      refreshedSnapshot = nextSnapshot;
    });

    const { rerender } = render(
      <BackgroundSnapshot
        snapshot={refreshedSnapshot}
        current={changedCurrent}
        onRefreshFromLive={onRefreshFromLive}
      />
    );

    expect(screen.getByText(/live source changed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /refresh from live/i }));

    rerender(
      <BackgroundSnapshot
        snapshot={refreshedSnapshot}
        current={changedCurrent}
        onRefreshFromLive={onRefreshFromLive}
      />
    );

    expect(screen.queryByText(/live source changed/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /refresh from live/i })).not.toBeInTheDocument();
  });
});

describe('BackgroundSection', () => {
  it('keeps manual narrative changes independent from refresh', () => {
    const onManualNarrativeChange = vi.fn();
    const onRefreshFromLive = vi.fn();

    render(
      <BackgroundSection
        snapshot={snapshot}
        current={changedCurrent}
        onRefreshFromLive={onRefreshFromLive}
        manualNarrative="Initial manual context"
        onManualNarrativeChange={onManualNarrativeChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/manual narrative/i), {
      target: { value: 'Updated manual context' },
    });

    expect(onManualNarrativeChange).toHaveBeenCalledTimes(1);
    expect(onManualNarrativeChange).toHaveBeenCalledWith('Updated manual context');
    expect(onRefreshFromLive).not.toHaveBeenCalled();
  });
});
