import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// vi.mock MUST come before component imports (per writing-tests skill)
vi.mock('@variscout/stores', () => {
  const setProcessContext = vi.fn();
  const setSpecs = vi.fn();
  return {
    useProjectStore: vi.fn((selector: (s: unknown) => unknown) =>
      selector({
        rawData: [],
        outcome: null,
        specs: null,
        setSpecs,
        processContext: null,
        setProcessContext,
      })
    ),
  };
});

import FrameView from '../FrameView';

describe('FrameView (Azure)', () => {
  it('renders LayeredProcessView with three bands', () => {
    render(<FrameView />);

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('band-outcome')).toBeInTheDocument();
    expect(screen.getByTestId('band-process-flow')).toBeInTheDocument();
    expect(screen.getByTestId('band-operations')).toBeInTheDocument();
  });
});
