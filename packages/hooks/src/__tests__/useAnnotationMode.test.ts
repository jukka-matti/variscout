import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnnotations } from '../useAnnotationMode';
import type { DisplayOptions } from '../types';

function makeOptions(overrides: Partial<DisplayOptions> = {}): DisplayOptions {
  return { ...overrides };
}

describe('useAnnotations', () => {
  it('starts with no annotations and context menu closed', () => {
    const opts = makeOptions();
    const setOpts = vi.fn();
    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts, dataFingerprint: 'a' })
    );

    expect(result.current.hasAnnotations).toBe(false);
    expect(result.current.contextMenu.isOpen).toBe(false);
  });

  it('opens context menu with correct state', () => {
    const opts = makeOptions();
    const setOpts = vi.fn();
    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts, dataFingerprint: 'a' })
    );

    const mockEvent = {
      preventDefault: vi.fn(),
      clientX: 100,
      clientY: 200,
    } as unknown as React.MouseEvent;

    act(() => result.current.handleContextMenu('boxplot', 'ShiftA', mockEvent));

    expect(result.current.contextMenu.isOpen).toBe(true);
    expect(result.current.contextMenu.categoryKey).toBe('ShiftA');
    expect(result.current.contextMenu.chartType).toBe('boxplot');
    expect(result.current.contextMenu.position).toEqual({ x: 100, y: 200 });
  });

  it('closes context menu', () => {
    const opts = makeOptions();
    const setOpts = vi.fn();
    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts, dataFingerprint: 'a' })
    );

    const mockEvent = {
      preventDefault: vi.fn(),
      clientX: 100,
      clientY: 200,
    } as unknown as React.MouseEvent;

    act(() => result.current.handleContextMenu('boxplot', 'ShiftA', mockEvent));
    expect(result.current.contextMenu.isOpen).toBe(true);

    act(() => result.current.closeContextMenu());
    expect(result.current.contextMenu.isOpen).toBe(false);
  });

  it('sets boxplot highlight color directly', () => {
    const opts = makeOptions();
    const setOpts = vi.fn();
    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts, dataFingerprint: 'a' })
    );

    act(() => result.current.setHighlight('boxplot', 'ShiftA', 'red'));
    expect(setOpts).toHaveBeenCalledWith(
      expect.objectContaining({ boxplotHighlights: { ShiftA: 'red' } })
    );
  });

  it('sets pareto highlight color directly', () => {
    const opts = makeOptions();
    const setOpts = vi.fn();
    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts, dataFingerprint: 'a' })
    );

    act(() => result.current.setHighlight('pareto', 'CategoryX', 'green'));
    expect(setOpts).toHaveBeenCalledWith(
      expect.objectContaining({ paretoHighlights: { CategoryX: 'green' } })
    );
  });

  it('clears highlight by passing undefined', () => {
    let opts = makeOptions({ boxplotHighlights: { ShiftA: 'red' } });
    const setOpts = vi.fn((newOpts: DisplayOptions) => {
      opts = newOpts;
    });

    const { result, rerender } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts, dataFingerprint: 'a' })
    );

    act(() => result.current.setHighlight('boxplot', 'ShiftA', undefined));
    expect(setOpts).toHaveBeenCalledWith(expect.objectContaining({ boxplotHighlights: {} }));
  });

  it('creates boxplot annotation for a category', () => {
    const opts = makeOptions();
    const setOpts = vi.fn();

    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts, dataFingerprint: 'a' })
    );

    act(() => result.current.createAnnotation('boxplot', 'ShiftB'));

    expect(setOpts).toHaveBeenCalledWith(
      expect.objectContaining({
        boxplotAnnotations: [
          expect.objectContaining({
            anchorCategory: 'ShiftB',
            text: '',
            offsetX: 0,
            offsetY: 0,
            width: 140,
            color: 'neutral',
          }),
        ],
      })
    );
  });

  it('does not create duplicate annotation for same category', () => {
    const opts = makeOptions({
      boxplotAnnotations: [
        {
          id: 'existing',
          anchorCategory: 'ShiftB',
          text: 'test',
          offsetX: 0,
          offsetY: 0,
          width: 140,
          color: 'neutral',
        },
      ],
    });
    const setOpts = vi.fn();

    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts, dataFingerprint: 'a' })
    );

    act(() => result.current.createAnnotation('boxplot', 'ShiftB'));
    expect(setOpts).not.toHaveBeenCalled();
  });

  it('updates annotation list via setBoxplotAnnotations', () => {
    const opts = makeOptions({
      boxplotAnnotations: [
        {
          id: 'a1',
          anchorCategory: 'ShiftA',
          text: 'old',
          offsetX: 0,
          offsetY: 0,
          width: 140,
          color: 'neutral',
        },
      ],
    });
    const setOpts = vi.fn();

    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts, dataFingerprint: 'a' })
    );

    const updated = [{ ...opts.boxplotAnnotations![0], text: 'new text' }];
    act(() => result.current.setBoxplotAnnotations(updated));

    expect(setOpts).toHaveBeenCalledWith(
      expect.objectContaining({
        boxplotAnnotations: [expect.objectContaining({ text: 'new text' })],
      })
    );
  });

  it('clears all boxplot annotations and highlights', () => {
    const opts = makeOptions({
      boxplotHighlights: { ShiftA: 'red' },
      boxplotAnnotations: [
        {
          id: 'a1',
          anchorCategory: 'ShiftA',
          text: 'note',
          offsetX: 10,
          offsetY: 20,
          width: 140,
          color: 'red',
        },
      ],
    });
    const setOpts = vi.fn();

    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts, dataFingerprint: 'a' })
    );

    expect(result.current.hasAnnotations).toBe(true);

    act(() => result.current.clearAnnotations('boxplot'));

    expect(setOpts).toHaveBeenCalledWith(
      expect.objectContaining({
        boxplotHighlights: {},
        boxplotAnnotations: [],
      })
    );
  });

  it('resets annotation offsets when dataFingerprint changes', () => {
    const annotation = {
      id: 'a1',
      anchorCategory: 'ShiftA',
      text: 'note',
      offsetX: 50,
      offsetY: 30,
      width: 140,
      color: 'neutral' as const,
    };
    let opts = makeOptions({ boxplotAnnotations: [annotation] });
    const setOpts = vi.fn((newOpts: DisplayOptions) => {
      opts = newOpts;
    });
    let fingerprint = 'fp1';

    const { rerender } = renderHook(() =>
      useAnnotations({
        displayOptions: opts,
        setDisplayOptions: setOpts,
        dataFingerprint: fingerprint,
      })
    );

    // Change fingerprint to simulate data change
    fingerprint = 'fp2';
    rerender();

    expect(setOpts).toHaveBeenCalledWith(
      expect.objectContaining({
        boxplotAnnotations: [expect.objectContaining({ id: 'a1', offsetX: 0, offsetY: 0 })],
      })
    );
  });

  it('opens context menu for pareto chart type', () => {
    const opts = makeOptions();
    const setOpts = vi.fn();
    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts, dataFingerprint: 'a' })
    );

    const mockEvent = {
      preventDefault: vi.fn(),
      clientX: 300,
      clientY: 400,
    } as unknown as React.MouseEvent;

    act(() => result.current.handleContextMenu('pareto', 'CategoryY', mockEvent));

    expect(result.current.contextMenu.isOpen).toBe(true);
    expect(result.current.contextMenu.categoryKey).toBe('CategoryY');
    expect(result.current.contextMenu.chartType).toBe('pareto');
  });
});
