// packages/ui/src/components/AnalyzeWall/__tests__/MiniScatterFit.test.tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MiniScatterFit } from '../MiniScatterFit';

function renderInSvg(ui: React.ReactElement) {
  return render(<svg>{ui}</svg>);
}

describe('MiniScatterFit', () => {
  it('renders one marker per point and a fitted line when provided', () => {
    renderInSvg(
      <MiniScatterFit
        points={[
          { x: 1, y: 2 },
          { x: 2, y: 3 },
          { x: 3, y: 5 },
        ]}
        fittedLine={[
          { x: 1, y: 2 },
          { x: 3, y: 5 },
        ]}
        isSignificant
        width={200}
        height={56}
      />
    );
    expect(screen.getByTestId('mini-scatter-fit')).toBeInTheDocument();
    expect(screen.getAllByTestId('mini-scatter-fit-point')).toHaveLength(3);
    expect(screen.getByTestId('mini-scatter-fit-line')).toBeInTheDocument();
  });

  it('NEGATIVE CONTROL: renders points but NO line element when fittedLine is null', () => {
    renderInSvg(
      <MiniScatterFit
        points={[
          { x: 1, y: 2 },
          { x: 2, y: 4 },
        ]}
        fittedLine={null}
        isSignificant={false}
        width={200}
        height={56}
      />
    );
    expect(screen.getAllByTestId('mini-scatter-fit-point')).toHaveLength(2);
    // Proves the line is data-driven, not always-drawn.
    expect(screen.queryByTestId('mini-scatter-fit-line')).toBeNull();
  });

  it('renders nothing when there are no points', () => {
    renderInSvg(
      <MiniScatterFit points={[]} fittedLine={null} isSignificant={false} width={200} height={56} />
    );
    expect(screen.queryByTestId('mini-scatter-fit')).toBeNull();
  });
});
