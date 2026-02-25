/**
 * Tests for chart accessibility utilities
 */

import type React from 'react';
import { describe, it, expect, vi } from 'vitest';
import {
  getInteractiveA11yProps,
  getDataPointA11yProps,
  getBarA11yProps,
  getBoxplotA11yProps,
  getScatterPointA11yProps,
} from '../accessibility';

describe('getInteractiveA11yProps', () => {
  it('returns empty object when no onClick provided', () => {
    const props = getInteractiveA11yProps('Test label');
    expect(props).toEqual({});
  });

  it('returns empty object when onClick is undefined', () => {
    const props = getInteractiveA11yProps('Test label', undefined);
    expect(props).toEqual({});
  });

  it('returns accessibility props when onClick is provided', () => {
    const onClick = vi.fn();
    const props = getInteractiveA11yProps('Select item', onClick);

    expect(props.role).toBe('button');
    expect(props['aria-label']).toBe('Select item');
    expect(props.tabIndex).toBe(0);
    expect(typeof props.onKeyDown).toBe('function');
  });

  it('calls onClick when Enter key is pressed', () => {
    const onClick = vi.fn();
    const props = getInteractiveA11yProps('Test', onClick);

    const event = { key: 'Enter', preventDefault: vi.fn() } as unknown as React.KeyboardEvent;
    props.onKeyDown!(event);

    expect(onClick).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it('calls onClick when Space key is pressed', () => {
    const onClick = vi.fn();
    const props = getInteractiveA11yProps('Test', onClick);

    const event = { key: ' ', preventDefault: vi.fn() } as unknown as React.KeyboardEvent;
    props.onKeyDown!(event);

    expect(onClick).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it('does not call onClick for other keys', () => {
    const onClick = vi.fn();
    const props = getInteractiveA11yProps('Test', onClick);

    const event = { key: 'Tab', preventDefault: vi.fn() } as unknown as React.KeyboardEvent;
    props.onKeyDown!(event);

    expect(onClick).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('does not call onClick for Escape key', () => {
    const onClick = vi.fn();
    const props = getInteractiveA11yProps('Test', onClick);

    const event = { key: 'Escape', preventDefault: vi.fn() } as unknown as React.KeyboardEvent;
    props.onKeyDown!(event);

    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('getDataPointA11yProps', () => {
  it('returns empty object when no onClick', () => {
    const props = getDataPointA11yProps('Measurement', 42.5, 0);
    expect(props).toEqual({});
  });

  it('formats label with 1-indexed point number', () => {
    const onClick = vi.fn();
    const props = getDataPointA11yProps('Measurement', 42.5, 0, onClick);

    expect(props['aria-label']).toBe('Measurement 1: 42.50');
  });

  it('formats label for higher indices', () => {
    const onClick = vi.fn();
    const props = getDataPointA11yProps('Weight', 100.123, 9, onClick);

    expect(props['aria-label']).toBe('Weight 10: 100.12');
  });

  it('returns interactive props when onClick provided', () => {
    const onClick = vi.fn();
    const props = getDataPointA11yProps('Value', 10, 0, onClick);

    expect(props.role).toBe('button');
    expect(props.tabIndex).toBe(0);
  });
});

describe('getBarA11yProps', () => {
  it('returns empty object when no onClick', () => {
    const props = getBarA11yProps('Machine A', 42);
    expect(props).toEqual({});
  });

  it('formats label with Select prefix when interactive', () => {
    const onClick = vi.fn();
    const props = getBarA11yProps('Machine A', 42, onClick);

    expect(props['aria-label']).toBe('Select Machine A (42)');
  });

  it('returns interactive props when onClick provided', () => {
    const onClick = vi.fn();
    const props = getBarA11yProps('Category', 10, onClick);

    expect(props.role).toBe('button');
    expect(props.tabIndex).toBe(0);
  });
});

describe('getBoxplotA11yProps', () => {
  it('returns empty object when no onClick', () => {
    const props = getBoxplotA11yProps('Group A', 50.5, 100);
    expect(props).toEqual({});
  });

  it('formats label with Select prefix when interactive', () => {
    const onClick = vi.fn();
    const props = getBoxplotA11yProps('Machine A', 50.5, 100, onClick);

    expect(props['aria-label']).toBe('Select Machine A (median: 50.50, n=100)');
  });

  it('formats non-interactive label without Select prefix', () => {
    // Non-interactive: no onClick, returns empty
    const props = getBoxplotA11yProps('Group B', 25.123, 50);
    expect(props).toEqual({});
  });

  it('returns interactive props when onClick provided', () => {
    const onClick = vi.fn();
    const props = getBoxplotA11yProps('Group', 10, 5, onClick);

    expect(props.role).toBe('button');
    expect(props.tabIndex).toBe(0);
  });
});

describe('getScatterPointA11yProps', () => {
  it('returns empty object when no onClick', () => {
    const props = getScatterPointA11yProps(1.5, 2.5, 0);
    expect(props).toEqual({});
  });

  it('formats label with coordinates when interactive', () => {
    const onClick = vi.fn();
    const props = getScatterPointA11yProps(1.5, 2.5, 0, onClick);

    expect(props['aria-label']).toBe('Select point 1 (x: 1.50, y: 2.50)');
  });

  it('formats label for higher indices', () => {
    const onClick = vi.fn();
    const props = getScatterPointA11yProps(10.123, 20.456, 4, onClick);

    expect(props['aria-label']).toBe('Select point 5 (x: 10.12, y: 20.46)');
  });

  it('returns interactive props when onClick provided', () => {
    const onClick = vi.fn();
    const props = getScatterPointA11yProps(0, 0, 0, onClick);

    expect(props.role).toBe('button');
    expect(props.tabIndex).toBe(0);
  });
});
