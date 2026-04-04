import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProjectStore, useInvestigationStore } from '@variscout/stores';
import { setupCloudSync } from '../cloudSyncSubscriber';
import type { DataRow } from '@variscout/core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRow(): DataRow {
  return { value: 1 } as unknown as DataRow;
}

function seedProjectStore() {
  useProjectStore.setState({
    projectId: 'test-project',
    rawData: [makeRow()],
  });
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  useProjectStore.setState(useProjectStore.getInitialState());
  useInvestigationStore.setState(useInvestigationStore.getInitialState());
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('setupCloudSync', () => {
  it('returns a cleanup function', () => {
    const cleanup = setupCloudSync(vi.fn());
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('does NOT call onSave on the initial subscription fire', () => {
    const onSave = vi.fn();
    const cleanup = setupCloudSync(onSave, 500);

    // Trigger the very first state change from projectStore — this is the
    // "skip first fire" case.
    useProjectStore.setState({ projectName: 'first' });
    vi.advanceTimersByTime(600);

    expect(onSave).not.toHaveBeenCalled();
    cleanup();
  });

  it('does NOT call onSave when gate is closed (no rawData)', () => {
    const onSave = vi.fn();
    const cleanup = setupCloudSync(onSave, 500);

    // Prime each store's "first fire" skip
    useProjectStore.setState({ projectName: 'init' });
    useInvestigationStore.setState({});

    // Now trigger a second change — gate is closed (rawData empty, no projectId)
    useProjectStore.setState({ projectName: 'changed' });
    vi.advanceTimersByTime(600);

    expect(onSave).not.toHaveBeenCalled();
    cleanup();
  });

  it('calls onSave after debounce when gate is open (projectStore change)', () => {
    const onSave = vi.fn();
    const cleanup = setupCloudSync(onSave, 500);

    seedProjectStore(); // sets rawData + projectId → this is the 1st (skipped) fire

    // Second change — gate is open
    useProjectStore.setState({ projectName: 'updated' });
    expect(onSave).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(onSave).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('calls onSave after debounce when gate is open (investigationStore change)', () => {
    const onSave = vi.fn();
    const cleanup = setupCloudSync(onSave, 500);

    // Prime the "skip first" for both stores
    seedProjectStore();
    useInvestigationStore.setState({});

    // Second investigation-store change — gate open
    useInvestigationStore.setState({});
    vi.advanceTimersByTime(500);

    expect(onSave).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('debounces rapid changes into a single save', () => {
    const onSave = vi.fn();
    const cleanup = setupCloudSync(onSave, 500);

    seedProjectStore(); // 1st fire — skipped

    // Fire multiple rapid changes
    useProjectStore.setState({ projectName: 'a' });
    vi.advanceTimersByTime(100);
    useProjectStore.setState({ projectName: 'b' });
    vi.advanceTimersByTime(100);
    useProjectStore.setState({ projectName: 'c' });

    expect(onSave).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(onSave).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('does not call onSave after cleanup, even if timer was pending', () => {
    const onSave = vi.fn();
    const cleanup = setupCloudSync(onSave, 500);

    seedProjectStore(); // 1st fire — skipped
    useProjectStore.setState({ projectName: 'after-gate' }); // arms debounce

    cleanup(); // teardown before timer fires

    vi.advanceTimersByTime(600);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('uses default debounce of 2000 ms when not specified', () => {
    const onSave = vi.fn();
    const cleanup = setupCloudSync(onSave); // no debounceMs argument

    seedProjectStore(); // 1st fire — skipped
    useProjectStore.setState({ projectName: 'trigger' });

    vi.advanceTimersByTime(1999);
    expect(onSave).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onSave).toHaveBeenCalledTimes(1);
    cleanup();
  });
});
