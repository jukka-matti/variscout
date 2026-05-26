import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IPDetailHeader from '../IPDetailHeader';
import type { ImprovementProject } from '@variscout/core/improvementProject';

const ip: ImprovementProject = {
  id: 'ip-1',
  hubId: 'hub-1',
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  status: 'active',
  metadata: { title: 'Heads 5-8 Cpk shortfall' },
  goal: { outcomeGoals: [{ outcomeSpecId: 'o-1', baseline: 0.61, target: 1.33 }] },
  sections: { background: {}, investigationLineage: {}, approach: {}, outcomeReference: {} },
};

describe('IPDetailHeader', () => {
  it('renders title + status + goal summary', () => {
    render(<IPDetailHeader ip={ip} onBackToList={() => {}} />);
    expect(screen.getByTestId('ip-detail-title')).toHaveTextContent('Heads 5-8 Cpk shortfall');
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText(/0\.61.*1\.33/)).toBeInTheDocument();
  });

  it('calls onBackToList when back button clicked', () => {
    const onBack = vi.fn();
    render(<IPDetailHeader ip={ip} onBackToList={onBack} />);
    fireEvent.click(screen.getByTestId('ip-detail-back'));
    expect(onBack).toHaveBeenCalled();
  });
});
