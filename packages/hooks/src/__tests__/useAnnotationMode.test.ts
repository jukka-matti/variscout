import React from 'react';
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
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts })
    );

    expect(result.current.hasAnnotations).toBe(false);
    expect(result.current.contextMenu.isOpen).toBe(false);
  });

  it('opens context menu with correct state', () => {
    const opts = makeOptions();
    const setOpts = vi.fn();
    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts })
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
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts })
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
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts })
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
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts })
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

    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts })
    );

    act(() => result.current.setHighlight('boxplot', 'ShiftA', undefined));
    expect(setOpts).toHaveBeenCalledWith(expect.objectContaining({ boxplotHighlights: {} }));
  });

  it('hasAnnotations detects boxplot highlights', () => {
    const opts = makeOptions({ boxplotHighlights: { ShiftA: 'red' } });
    const setOpts = vi.fn();
    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts })
    );

    expect(result.current.hasAnnotations).toBe(true);
  });

  it('hasAnnotations detects pareto highlights', () => {
    const opts = makeOptions({ paretoHighlights: { CategoryX: 'green' } });
    const setOpts = vi.fn();
    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts })
    );

    expect(result.current.hasAnnotations).toBe(true);
  });

  it('clearAnnotations clears boxplot highlights only', () => {
    const opts = makeOptions({
      boxplotHighlights: { ShiftA: 'red' },
      paretoHighlights: { CategoryX: 'green' },
    });
    const setOpts = vi.fn();
    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts })
    );

    act(() => result.current.clearAnnotations('boxplot'));
    expect(setOpts).toHaveBeenCalledWith(expect.objectContaining({ boxplotHighlights: {} }));
  });

  it('opens context menu for pareto chart type', () => {
    const opts = makeOptions();
    const setOpts = vi.fn();
    const { result } = renderHook(() =>
      useAnnotations({ displayOptions: opts, setDisplayOptions: setOpts })
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
