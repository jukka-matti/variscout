/**
 * Tests for PerformanceSetupPanelBase — verifies onEnable emits a per-channel Cpk-target map.
 *
 * Task E (Cpk follow-up): wizard preserves single-input UX, but the storage shape is
 * a `Record<string, number>` keyed by selected channel column so consumers can write
 * each entry through `setMeasureSpec(column, { cpkTarget })`.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PerformanceSetupPanelBase from '../PerformanceSetupPanelBase';
import type { ChannelInfo } from '@variscout/core';

const channels: ChannelInfo[] = [
  {
    id: 'Valve_1',
    label: 'Valve 1',
    n: 30,
    matchedPattern: true,
    preview: { min: 9.2, max: 10.8, mean: 10.0 },
  },
  {
    id: 'Valve_2',
    label: 'Valve 2',
    n: 30,
    matchedPattern: true,
    preview: { min: 9.5, max: 10.5, mean: 10.0 },
  },
  {
    id: 'Valve_3',
    label: 'Valve 3',
    n: 30,
    matchedPattern: true,
    preview: { min: 9.0, max: 11.0, mean: 10.1 },
  },
];

describe('PerformanceSetupPanelBase', () => {
  it('emits the user-entered Cpk target as a per-channel map keyed by selected columns', () => {
    const onEnable = vi.fn();

    render(
      <PerformanceSetupPanelBase
        variant="inline"
        availableColumns={channels}
        hasData
        hasSpecs
        initialSelection={['Valve_1', 'Valve_2', 'Valve_3']}
        initialLabel="Valve"
        initialCpkTarget={1.33}
        onEnable={onEnable}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /enable performance mode/i }));

    expect(onEnable).toHaveBeenCalledTimes(1);
    const [columns, label, cpkTargetPerChannel] = onEnable.mock.calls[0];
    expect(columns).toEqual(['Valve_1', 'Valve_2', 'Valve_3']);
    expect(label).toBe('Valve');
    expect(cpkTargetPerChannel).toEqual({
      Valve_1: 1.33,
      Valve_2: 1.33,
      Valve_3: 1.33,
    });
  });

  it('applies an updated Cpk target uniformly across every selected channel', () => {
    const onEnable = vi.fn();

    render(
      <PerformanceSetupPanelBase
        variant="inline"
        availableColumns={channels}
        hasData
        hasSpecs
        initialSelection={['Valve_1', 'Valve_2', 'Valve_3']}
        initialLabel="Valve"
        initialCpkTarget={1.33}
        onEnable={onEnable}
      />
    );

    const targetInput = screen.getByDisplayValue('1.33') as HTMLInputElement;
    fireEvent.change(targetInput, { target: { value: '1.67' } });

    fireEvent.click(screen.getByRole('button', { name: /enable performance mode/i }));

    expect(onEnable).toHaveBeenCalledTimes(1);
    const [, , cpkTargetPerChannel] = onEnable.mock.calls[0];
    expect(cpkTargetPerChannel).toEqual({
      Valve_1: 1.67,
      Valve_2: 1.67,
      Valve_3: 1.67,
    });
  });
});
