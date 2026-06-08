import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverallProblemHeader } from '../OverallProblemHeader';

describe('OverallProblemHeader', () => {
  it('starts from the issue and shows scope to be determined when no branches exist', () => {
    render(
      <OverallProblemHeader
        issueStatement="Yield dropped after the night-shift changeover."
        outcomeLabel="Yield"
        targetLabel="maximize"
        scopeBranchCount={0}
      />
    );

    expect(screen.getByText('Yield dropped after the night-shift changeover.')).toBeInTheDocument();
    expect(screen.getByText('Yield')).toBeInTheDocument();
    expect(screen.getByText('maximize')).toBeInTheDocument();
    expect(screen.getByText('scope to be determined')).toBeInTheDocument();
  });

  it('prefers the approved problem statement over the live draft', () => {
    render(
      <OverallProblemHeader
        issueStatement="Fill weight is unstable."
        outcomeLabel="Fill Weight"
        targetLabel="Cpk >= 1.33"
        problemStatement="Fill weight Cpk is below target on Machine A night shift."
        problemStatementDraft="Draft: Fill weight is below target."
        scopeBranchCount={2}
      />
    );

    expect(
      screen.getByText('Fill weight Cpk is below target on Machine A night shift.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Draft: Fill weight is below target.')).not.toBeInTheDocument();
    expect(screen.getByText('2 open scope branches')).toBeInTheDocument();
  });

  it('falls back to the live draft when no approved problem statement exists', () => {
    render(
      <OverallProblemHeader
        problemStatementDraft="Draft: narrow by Machine and Shift."
        scopeBranchCount={1}
      />
    );

    expect(screen.getByText('Draft: narrow by Machine and Shift.')).toBeInTheDocument();
    expect(screen.getByText('1 open scope branch')).toBeInTheDocument();
  });
});
