import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IPDetailStageTabs from '../IPDetailStageTabs';
import type { StageStateMap } from '../stageState';

const stages: StageStateMap = {
  charter: 'done',
  approach: 'current',
  sustainment: 'locked',
  handoff: 'locked',
};

describe('IPDetailStageTabs', () => {
  it('renders all 4 stage tabs with state-specific icons', () => {
    render(<IPDetailStageTabs stages={stages} active="approach" onStageChange={() => {}} />);
    expect(screen.getByTestId('stage-tab-charter')).toHaveTextContent('Charter');
    expect(screen.getByTestId('stage-tab-charter')).toHaveTextContent('✓');
    expect(screen.getByTestId('stage-tab-sustainment')).toHaveTextContent('⏸');
  });

  it('does not call onStageChange when locked stage clicked', () => {
    const onChange = vi.fn();
    render(<IPDetailStageTabs stages={stages} active="approach" onStageChange={onChange} />);
    fireEvent.click(screen.getByTestId('stage-tab-sustainment'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onStageChange with the clicked stage name', () => {
    const onChange = vi.fn();
    render(<IPDetailStageTabs stages={stages} active="approach" onStageChange={onChange} />);
    fireEvent.click(screen.getByTestId('stage-tab-charter'));
    expect(onChange).toHaveBeenCalledWith('charter');
  });
});
