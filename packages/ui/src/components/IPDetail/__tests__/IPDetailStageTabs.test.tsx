import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IPDetailStageTabs from '../IPDetailStageTabs';
import type { StageStateMap } from '../stageState';

const stages: StageStateMap = {
  charter: 'done',
  approach: 'current',
  sustainment: 'upcoming',
};

describe('IPDetailStageTabs', () => {
  it('renders all 3 stage tabs with state-specific icons', () => {
    render(<IPDetailStageTabs stages={stages} active="approach" onStageChange={() => {}} />);
    expect(screen.getByTestId('stage-tab-charter')).toHaveTextContent('Charter');
    expect(screen.getByTestId('stage-tab-charter')).toHaveTextContent('✓');
    expect(screen.getByTestId('stage-tab-sustainment')).toHaveTextContent('○');
  });

  it('calls onStageChange with the clicked stage name', () => {
    const onChange = vi.fn();
    render(<IPDetailStageTabs stages={stages} active="approach" onStageChange={onChange} />);
    fireEvent.click(screen.getByTestId('stage-tab-charter'));
    expect(onChange).toHaveBeenCalledWith('charter');
  });

  it('names the tablist as Project lifecycle stages', () => {
    render(<IPDetailStageTabs stages={stages} active="approach" onStageChange={() => {}} />);
    expect(screen.getByRole('tablist', { name: /project lifecycle stages/i })).toBeInTheDocument();
    expect(screen.queryByRole('tablist', { name: /IP lifecycle stages/i })).not.toBeInTheDocument();
  });
});

describe('STAGE_ORDER (amendment — 3 stages)', () => {
  it('contains exactly charter, approach, sustainment', () => {
    const threeStages: StageStateMap = {
      charter: 'current',
      approach: 'upcoming',
      sustainment: 'upcoming',
    };
    render(<IPDetailStageTabs stages={threeStages} active="charter" onStageChange={() => {}} />);
    expect(screen.getByTestId('stage-tab-charter')).toBeInTheDocument();
    expect(screen.getByTestId('stage-tab-approach')).toBeInTheDocument();
    expect(screen.getByTestId('stage-tab-sustainment')).toBeInTheDocument();
    expect(screen.queryByTestId('stage-tab-improve')).not.toBeInTheDocument();
  });
});
