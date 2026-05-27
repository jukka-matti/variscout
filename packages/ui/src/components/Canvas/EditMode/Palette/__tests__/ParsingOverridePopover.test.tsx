import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParsingOverridePopover } from '../ParsingOverridePopover';
import { createTestColumnParsingProfile } from '../../../../../test-utils/columnParsingProfile';

const renderPopover = (overrides: Record<string, unknown> = {}) => {
  const props = {
    columnName: 'Speed',
    profile: createTestColumnParsingProfile({
      columnName: 'Speed',
      confidence: 92,
      primary: { kind: 'numeric', label: 'numeric · EU decimal', detail: {} },
      alternatives: [
        {
          interpretation: { kind: 'numeric', label: 'numeric · US format', detail: {} },
          parseCount: 5,
          totalCount: 10,
        },
      ],
      transformedSamples: [
        { raw: '182,5', transformed: '182.5' },
        { raw: '93,2', transformed: '93.2' },
        { raw: '47,1', transformed: '47.1' },
      ],
    }),
    anchor: { x: 100, y: 200 },
    onChoose: vi.fn(),
    onApplyToSimilar: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<ParsingOverridePopover {...props} />) };
};

describe('ParsingOverridePopover', () => {
  it('renders the primary interpretation label and confidence', () => {
    renderPopover();
    expect(screen.getByText(/numeric · EU decimal/)).toBeInTheDocument();
    expect(screen.getByText(/92%/)).toBeInTheDocument();
  });

  it('renders the 3 transformed samples', () => {
    renderPopover();
    expect(screen.getByText(/182,5 → 182\.5/)).toBeInTheDocument();
    expect(screen.getByText(/93,2 → 93\.2/)).toBeInTheDocument();
    expect(screen.getByText(/47,1 → 47\.1/)).toBeInTheDocument();
  });

  it('renders alternatives with parseCount / totalCount', () => {
    renderPopover();
    expect(screen.getByText(/numeric · US format/)).toBeInTheDocument();
    expect(screen.getByText(/5 \/ 10/)).toBeInTheDocument();
  });

  it('clicking an alternative fires onChoose with the chosen interpretation', () => {
    const { props } = renderPopover();
    fireEvent.click(screen.getByTestId('override-alternative-numeric · US format'));
    expect(props.onChoose).toHaveBeenCalledWith('Speed', {
      kind: 'numeric',
      label: 'numeric · US format',
      detail: {},
    });
  });

  it('fires onApplyToSimilar with current primary when the affordance is clicked', () => {
    const { props } = renderPopover();
    fireEvent.click(screen.getByRole('button', { name: /apply to similar/i }));
    expect(props.onApplyToSimilar).toHaveBeenCalledWith('Speed', {
      kind: 'numeric',
      label: 'numeric · EU decimal',
      detail: {},
    });
  });

  it('closes on Escape', () => {
    const { props } = renderPopover();
    fireEvent.keyDown(screen.getByTestId('parsing-override-popover'), { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click', () => {
    const { props } = renderPopover();
    fireEvent.click(screen.getByTestId('parsing-override-popover-backdrop'));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('shows a "parse failed" hint when primary is null', () => {
    renderPopover({
      profile: createTestColumnParsingProfile({
        status: 'error',
        primary: null,
        confidence: 0,
      }),
    });
    expect(screen.getByText(/parse failed/i)).toBeInTheDocument();
  });
});
