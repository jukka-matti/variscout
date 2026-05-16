import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImproveStageAdvanced } from '../ImproveStageAdvanced';

describe('ImproveStageAdvanced', () => {
  it('renders all four PDCA workspace regions', () => {
    render(
      <ImproveStageAdvanced
        projectId="ip-1"
        causes={[]}
        ideaGroups={[]}
        matrixIdeas={[]}
        matrixXAxis="benefit"
        matrixYAxis="timeframe"
        matrixColorBy="cost"
        onMatrixToggleSelect={() => {}}
        onMatrixAxisChange={() => {}}
        whatIfMode="standard"
        whatIfCurrentStats={{ mean: 10, stdDev: 2 }}
      />
    );
    expect(screen.getByLabelText(/context/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ideas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prioritization/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/what-if/i)).toBeInTheDocument();
  });
});
