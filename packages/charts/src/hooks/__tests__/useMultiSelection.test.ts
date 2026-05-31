/**
 * Tests for useMultiSelection hook
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { scaleLinear } from '@visx/scale';
import type { MouseEvent } from 'react';
import { useMultiSelection } from '../useMultiSelection';

describe('useMultiSelection', () => {
  const mockData = [
    { x: 0, y: 10 },
    { x: 1, y: 20 },
    { x: 2, y: 15 },
    { x: 3, y: 25 },
    { x: 4, y: 30 },
  ];

  const xScale = scaleLinear({
    domain: [0, 4],
    range: [0, 400],
  });

  const yScale = scaleLinear({
    domain: [0, 40],
    range: [300, 0],
  });

  const mockOnSelectionChange = vi.fn();

  it('should initialize with empty selection', () => {
    const { result } = renderHook(() =>
      useMultiSelection({
        data: mockData,
        xScale,
        yScale,
        selectedPoints: new Set(),
        onSelectionChange: mockOnSelectionChange,
      })
    );

    expect(result.current.brushExtent).toBeNull();
    expect(result.current.isBrushing).toBe(false);
    expect(result.current.isPointSelected(0)).toBe(false);
  });

  it('should detect selected points correctly', () => {
    const selectedPoints = new Set([0, 2, 4]);
    const { result } = renderHook(() =>
      useMultiSelection({
        data: mockData,
        xScale,
        yScale,
        selectedPoints,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    expect(result.current.isPointSelected(0)).toBe(true);
    expect(result.current.isPointSelected(1)).toBe(false);
    expect(result.current.isPointSelected(2)).toBe(true);
  });

  it('should return correct opacity for selected/unselected points', () => {
    const selectedPoints = new Set([1, 3]);
    const { result } = renderHook(() =>
      useMultiSelection({
        data: mockData,
        xScale,
        yScale,
        selectedPoints,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    // Selected points: full opacity
    expect(result.current.getPointOpacity(1)).toBe(1.0);
    expect(result.current.getPointOpacity(3)).toBe(1.0);

    // Unselected points when selection exists: dimmed
    expect(result.current.getPointOpacity(0)).toBe(0.3);
    expect(result.current.getPointOpacity(2)).toBe(0.3);
  });

  it('should return full opacity for all points when no selection', () => {
    const { result } = renderHook(() =>
      useMultiSelection({
        data: mockData,
        xScale,
        yScale,
        selectedPoints: new Set(),
        onSelectionChange: mockOnSelectionChange,
      })
    );

    expect(result.current.getPointOpacity(0)).toBe(1.0);
    expect(result.current.getPointOpacity(2)).toBe(1.0);
  });

  it('should return correct size for selected points', () => {
    const selectedPoints = new Set([1]);
    const { result } = renderHook(() =>
      useMultiSelection({
        data: mockData,
        xScale,
        yScale,
        selectedPoints,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    // Selected: larger
    expect(result.current.getPointSize(1)).toBe(6);

    // Unselected: default
    expect(result.current.getPointSize(0)).toBe(4);
  });

  it('should return correct stroke width for selected points', () => {
    const selectedPoints = new Set([2]);
    const { result } = renderHook(() =>
      useMultiSelection({
        data: mockData,
        xScale,
        yScale,
        selectedPoints,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    // Selected: thicker stroke
    expect(result.current.getPointStrokeWidth(2)).toBe(2);

    // Unselected: default stroke
    expect(result.current.getPointStrokeWidth(0)).toBe(1);
  });

  it('should handle Ctrl+click to toggle point', () => {
    const selectedPoints = new Set([1]);
    const onSelectionChange = vi.fn();

    const { result } = renderHook(() =>
      useMultiSelection({
        data: mockData,
        xScale,
        yScale,
        selectedPoints,
        onSelectionChange,
      })
    );

    // Mock Ctrl+click event
    const mockEvent = {
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      stopPropagation: vi.fn(),
    } as unknown as MouseEvent;

    act(() => {
      result.current.handlePointClick(1, mockEvent);
    });

    // Should remove point 1 from selection
    expect(onSelectionChange).toHaveBeenCalledWith(new Set([]));
  });

  it('should handle Shift+click to add point', () => {
    const selectedPoints = new Set([1]);
    const onSelectionChange = vi.fn();

    const { result } = renderHook(() =>
      useMultiSelection({
        data: mockData,
        xScale,
        yScale,
        selectedPoints,
        onSelectionChange,
      })
    );

    // Mock Shift+click event
    const mockEvent = {
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
      stopPropagation: vi.fn(),
    } as unknown as MouseEvent;

    act(() => {
      result.current.handlePointClick(3, mockEvent);
    });

    // Should add point 3 to selection
    expect(onSelectionChange).toHaveBeenCalledWith(new Set([1, 3]));
  });

  it('should handle regular click to replace selection', () => {
    const selectedPoints = new Set([1, 2]);
    const onSelectionChange = vi.fn();

    const { result } = renderHook(() =>
      useMultiSelection({
        data: mockData,
        xScale,
        yScale,
        selectedPoints,
        onSelectionChange,
      })
    );

    // Mock regular click event
    const mockEvent = {
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      stopPropagation: vi.fn(),
    } as unknown as MouseEvent;

    act(() => {
      result.current.handlePointClick(4, mockEvent);
    });

    // Should replace with point 4
    expect(onSelectionChange).toHaveBeenCalledWith(new Set([4]));
  });

  it('should disable brush when enableBrush is false', () => {
    const { result } = renderHook(() =>
      useMultiSelection({
        data: mockData,
        xScale,
        yScale,
        selectedPoints: new Set(),
        onSelectionChange: mockOnSelectionChange,
        enableBrush: false,
      })
    );

    // Mock mouse down event
    const mockEvent = {
      currentTarget: document.createElement('svg'),
      clientX: 100,
      clientY: 100,
    } as unknown as MouseEvent<SVGElement>;

    act(() => {
      result.current.handleBrushStart(mockEvent);
    });

    // Should not start brushing
    expect(result.current.isBrushing).toBe(false);
  });
});
