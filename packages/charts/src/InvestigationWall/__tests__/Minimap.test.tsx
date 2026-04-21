/**
 * Minimap — bird's-eye view of the Investigation Wall.
 *
 * Tests verify the coordinate mapping: a click on the minimap triggers
 * onPanTo with x/y converted from minimap-space (local to the 160×100 svg)
 * to canvas-space (2000×1400).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Minimap } from '../Minimap';
import { CANVAS_W, CANVAS_H } from '../WallCanvas';
import type { SuspectedCause, Question } from '@variscout/core';

const hubs: SuspectedCause[] = [
  {
    id: 'h-1',
    name: 'Night shift',
    synthesis: '',
    questionIds: [],
    findingIds: [],
    status: 'suspected',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'h-2',
    name: 'Calibration drift',
    synthesis: '',
    questionIds: [],
    findingIds: [],
    status: 'suspected',
    createdAt: '',
    updatedAt: '',
  },
];

const questions: Question[] = [
  {
    id: 'q-1',
    text: 'What about downtime?',
    status: 'open',
    linkedFindingIds: [],
    createdAt: '',
    updatedAt: '',
  },
];

describe('Minimap', () => {
  it('renders a minimap container with aria-label', () => {
    const { getByLabelText } = render(
      <Minimap hubs={hubs} questions={questions} zoom={1} pan={{ x: 0, y: 0 }} onPanTo={vi.fn()} />
    );
    expect(getByLabelText(/Investigation Wall minimap/i)).toBeInTheDocument();
  });

  it('renders one dot per hub + question', () => {
    const { container } = render(
      <Minimap hubs={hubs} questions={questions} zoom={1} pan={{ x: 0, y: 0 }} onPanTo={vi.fn()} />
    );
    const dots = container.querySelectorAll('[data-minimap-node]');
    expect(dots.length).toBe(hubs.length + questions.length);
  });

  it('click on minimap calls onPanTo with coordinates in canvas-space', () => {
    const onPanTo = vi.fn();
    const { container } = render(
      <Minimap hubs={hubs} questions={questions} zoom={1} pan={{ x: 0, y: 0 }} onPanTo={onPanTo} />
    );
    const svg = container.querySelector('svg[data-testid="wall-minimap"]') as SVGSVGElement;
    expect(svg).toBeTruthy();

    // Stub getBoundingClientRect so fireEvent.click produces a predictable offset.
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 160, height: 100, right: 160, bottom: 100 }) as DOMRect;

    // Click at the minimap's center — clientX=80, clientY=50.
    fireEvent.click(svg, { clientX: 80, clientY: 50 });

    expect(onPanTo).toHaveBeenCalledTimes(1);
    // Center of minimap should map to the center of the canvas.
    const [x, y] = onPanTo.mock.calls[0];
    expect(x).toBeCloseTo(CANVAS_W / 2, 0);
    expect(y).toBeCloseTo(CANVAS_H / 2, 0);
  });

  it('click near the top-left corner maps to canvas origin', () => {
    const onPanTo = vi.fn();
    const { container } = render(
      <Minimap hubs={hubs} questions={questions} zoom={1} pan={{ x: 0, y: 0 }} onPanTo={onPanTo} />
    );
    const svg = container.querySelector('svg[data-testid="wall-minimap"]') as SVGSVGElement;
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 160, height: 100, right: 160, bottom: 100 }) as DOMRect;

    fireEvent.click(svg, { clientX: 0, clientY: 0 });
    const [x, y] = onPanTo.mock.calls[0];
    expect(x).toBeCloseTo(0, 0);
    expect(y).toBeCloseTo(0, 0);
  });

  it('renders a viewport rectangle', () => {
    const { container } = render(
      <Minimap hubs={hubs} questions={questions} zoom={1} pan={{ x: 0, y: 0 }} onPanTo={vi.fn()} />
    );
    expect(container.querySelector('[data-minimap-viewport]')).toBeTruthy();
  });
});
