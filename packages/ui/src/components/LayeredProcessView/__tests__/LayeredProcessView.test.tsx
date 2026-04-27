import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LayeredProcessView } from '../LayeredProcessView';
import type { ProcessMap } from '@variscout/core/frame';

const emptyMap: ProcessMap = {
  version: 1,
  nodes: [],
  tributaries: [],
  createdAt: '2026-04-27T00:00:00.000Z',
  updatedAt: '2026-04-27T00:00:00.000Z',
};

describe('LayeredProcessView', () => {
  it('renders three bands labelled Outcome, Process Flow, Operations', () => {
    render(<LayeredProcessView map={emptyMap} availableColumns={[]} onChange={() => {}} />);

    expect(screen.getByTestId('layered-process-view')).toBeInTheDocument();
    expect(screen.getByTestId('band-outcome')).toBeInTheDocument();
    expect(screen.getByTestId('band-process-flow')).toBeInTheDocument();
    expect(screen.getByTestId('band-operations')).toBeInTheDocument();

    expect(screen.getByText('Outcome')).toBeInTheDocument();
    expect(screen.getByText('Process Flow')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
  });
});
