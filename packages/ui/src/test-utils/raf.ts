import { act } from '@testing-library/react';

/**
 * flushRaf — advance past one requestAnimationFrame tick inside act().
 *
 * DashboardChartCard / FocusedChartCard gate their chart children behind a
 * one-rAF mount gate (a painted skeleton frame precedes the synchronous chart
 * render). happy-dom schedules rAF on a macrotask, so chart-content children are
 * absent on the first commit. Tests that assert on those children must await one
 * rAF flush after render:
 *
 *   render(<Card isLoading={false}>…</Card>);
 *   await flushRaf();
 *   expect(screen.getByTestId('chart-content')).toBeDefined();
 *
 * Wrapped in act() so the gate's setState commit is flushed and React doesn't
 * warn. Prefer this over `await findByTestId(...)` when you also need to assert
 * the PRE-rAF skeleton state in the same test.
 */
export async function flushRaf(): Promise<void> {
  await act(async () => {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  });
}
