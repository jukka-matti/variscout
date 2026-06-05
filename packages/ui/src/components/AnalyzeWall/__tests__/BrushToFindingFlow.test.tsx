/**
 * Tests for BrushToFindingFlow — brush/category → confirm → persist flow.
 *
 * Covers Task 17: confirmation panel + addFinding + connectFindingToHub wiring.
 * Feedback applied: vi.mock factory closure pattern (feedback_vi_mock_hoist_closure).
 */

import React from 'react';

// vi.mock BEFORE component imports (testing.md invariant)
const mockAddFinding = vi.fn();
const mockConnectFindingToHub = vi.fn();

vi.mock('@variscout/stores', () => {
  return {
    useAnalyzeStore: Object.assign(
      vi.fn((selector: (s: unknown) => unknown) => selector({})),
      {
        getState: vi.fn(() => ({
          addFinding: mockAddFinding,
          connectFindingToHub: mockConnectFindingToHub,
        })),
      }
    ),
    usePreferencesStore: Object.assign(
      vi.fn((selector: (s: unknown) => unknown) => selector({})),
      {
        getState: vi.fn(() => ({
          timeLens: { mode: 'rolling', windowSize: 50 },
        })),
      }
    ),
  };
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrushToFindingFlow } from '../BrushToFindingFlow';
import type { Hypothesis } from '@variscout/core/findings';

const baseHub: Hypothesis = {
  id: 'h-test',
  name: 'Test hub',
  synthesis: '',
  findingIds: [],
  status: 'proposed',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
};

const BASE_ROWS = [
  { TEMP: 90, thickness: 1.2 },
  { TEMP: 92, thickness: 1.3 },
  { TEMP: 95, thickness: 1.5 },
  { TEMP: 97, thickness: 1.6 },
  { TEMP: 100, thickness: 1.8 },
];

beforeEach(() => {
  mockAddFinding.mockReset();
  mockConnectFindingToHub.mockReset();
  // Return a finding with an id so connectFindingToHub gets the right arg
  mockAddFinding.mockReturnValue({ id: 'f-new', text: '', createdAt: 0 });
});

describe('BrushToFindingFlow', () => {
  it('renders children with handlers; no panel by default', () => {
    let capturedHandlers: { onBrushEnd: (r: { startIdx: number; endIdx: number }) => void } | null =
      null;

    render(
      <svg>
        <BrushToFindingFlow hub={baseHub} factor="TEMP" outcomeColumn="thickness" rows={BASE_ROWS}>
          {handlers => {
            capturedHandlers = handlers;
            return (
              <foreignObject x={0} y={0} width={100} height={50}>
                <button onClick={() => capturedHandlers?.onBrushEnd({ startIdx: 12, endIdx: 28 })}>
                  Brush
                </button>
              </foreignObject>
            );
          }}
        </BrushToFindingFlow>
      </svg>
    );

    // Dialog must not appear yet
    expect(screen.queryByRole('dialog')).toBeNull();

    // Fire brush
    fireEvent.click(screen.getByText('Brush'));

    // Dialog appears after brush
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Contains iChart-specific wording (indices + factor)
    expect(screen.getByRole('dialog').textContent).toMatch(/TEMP/);
    expect(screen.getByRole('dialog').textContent).toMatch(/12/);
    expect(screen.getByRole('dialog').textContent).toMatch(/28/);
  });

  it('confirm button calls addFinding + connectFindingToHub and closes dialog', () => {
    let capturedHandlers: { onBrushEnd: (r: { startIdx: number; endIdx: number }) => void } | null =
      null;

    render(
      <svg>
        <BrushToFindingFlow hub={baseHub} factor="TEMP" outcomeColumn="thickness" rows={BASE_ROWS}>
          {handlers => {
            capturedHandlers = handlers;
            return (
              <foreignObject x={0} y={0} width={100} height={50}>
                <button onClick={() => capturedHandlers?.onBrushEnd({ startIdx: 12, endIdx: 28 })}>
                  Brush
                </button>
              </foreignObject>
            );
          }}
        </BrushToFindingFlow>
      </svg>
    );

    fireEvent.click(screen.getByText('Brush'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Pin'));

    // addFinding called once
    expect(mockAddFinding).toHaveBeenCalledTimes(1);
    const [, , source] = mockAddFinding.mock.calls[0];
    expect(source.chart).toBe('ichart');
    expect(source.brushedRange).toEqual({ startIdx: 12, endIdx: 28 });

    // connectFindingToHub called with hub.id + new finding.id
    expect(mockConnectFindingToHub).toHaveBeenCalledTimes(1);
    expect(mockConnectFindingToHub).toHaveBeenCalledWith('h-test', 'f-new');

    // Dialog gone
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('cancel button clears state without persisting', () => {
    let capturedHandlers: { onBrushEnd: (r: { startIdx: number; endIdx: number }) => void } | null =
      null;

    render(
      <svg>
        <BrushToFindingFlow hub={baseHub} factor="TEMP" outcomeColumn="thickness" rows={BASE_ROWS}>
          {handlers => {
            capturedHandlers = handlers;
            return (
              <foreignObject x={0} y={0} width={100} height={50}>
                <button onClick={() => capturedHandlers?.onBrushEnd({ startIdx: 5, endIdx: 10 })}>
                  Brush
                </button>
              </foreignObject>
            );
          }}
        </BrushToFindingFlow>
      </svg>
    );

    fireEvent.click(screen.getByText('Brush'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockAddFinding).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Escape key cancels without persisting', () => {
    let capturedHandlers: { onBrushEnd: (r: { startIdx: number; endIdx: number }) => void } | null =
      null;

    render(
      <svg>
        <BrushToFindingFlow hub={baseHub} factor="TEMP" outcomeColumn="thickness" rows={BASE_ROWS}>
          {handlers => {
            capturedHandlers = handlers;
            return (
              <foreignObject x={0} y={0} width={100} height={50}>
                <button onClick={() => capturedHandlers?.onBrushEnd({ startIdx: 0, endIdx: 4 })}>
                  Brush
                </button>
              </foreignObject>
            );
          }}
        </BrushToFindingFlow>
      </svg>
    );

    fireEvent.click(screen.getByText('Brush'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(mockAddFinding).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('boxplot path: onCategorySelect leads to boxplot source on confirm', () => {
    let capturedHandlers: { onCategorySelect: (category: string) => void } | null = null;

    render(
      <svg>
        <BrushToFindingFlow
          hub={baseHub}
          factor="SUPPLIER"
          outcomeColumn="thickness"
          rows={BASE_ROWS}
        >
          {handlers => {
            capturedHandlers = handlers;
            return (
              <foreignObject x={0} y={0} width={100} height={50}>
                <button onClick={() => capturedHandlers?.onCategorySelect('B')}>Select B</button>
              </foreignObject>
            );
          }}
        </BrushToFindingFlow>
      </svg>
    );

    fireEvent.click(screen.getByText('Select B'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Boxplot dialog mentions category B and factor
    expect(screen.getByRole('dialog').textContent).toMatch(/B/);

    fireEvent.click(screen.getByText('Pin'));

    expect(mockAddFinding).toHaveBeenCalledTimes(1);
    const [, , source] = mockAddFinding.mock.calls[0];
    expect(source.chart).toBe('boxplot');
    expect(source.category).toBe('B');
    expect(source.timeLens).toEqual({ mode: 'rolling', windowSize: 50 });
    // No brushedRange on boxplot
    expect(source.brushedRange).toBeUndefined();
  });

  it('no-factor fallback: uses confirmIChartNoFactor copy when factor is undefined', () => {
    let capturedHandlers: { onBrushEnd: (r: { startIdx: number; endIdx: number }) => void } | null =
      null;

    render(
      <svg>
        <BrushToFindingFlow hub={baseHub} factor={undefined} outcomeColumn={null} rows={BASE_ROWS}>
          {handlers => {
            capturedHandlers = handlers;
            return (
              <foreignObject x={0} y={0} width={100} height={50}>
                <button onClick={() => capturedHandlers?.onBrushEnd({ startIdx: 0, endIdx: 2 })}>
                  Brush
                </button>
              </foreignObject>
            );
          }}
        </BrushToFindingFlow>
      </svg>
    );

    fireEvent.click(screen.getByText('Brush'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // Should show no-factor copy without a {factor} placeholder leak
    expect(dialog.textContent).not.toMatch(/\{factor\}/);
    // Should show the no-factor fallback text
    expect(dialog.textContent).toMatch(/Pin range as finding/i);
  });
});
