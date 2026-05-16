import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddPlanForm } from '../AddPlanForm';
import type { ProjectMember } from '@variscout/core/projectMembership';

const members: ProjectMember[] = [
  {
    id: 'pm-alice',
    createdAt: 1,
    deletedAt: null,
    userId: 'alice@org',
    displayName: 'Alice',
    role: 'lead',
    invitedAt: 1,
  },
  {
    id: 'pm-bob',
    createdAt: 1,
    deletedAt: null,
    userId: 'bob@org',
    displayName: 'Bob',
    role: 'member',
    invitedAt: 1,
  },
  {
    id: 'pm-carol',
    createdAt: 1,
    deletedAt: null,
    userId: 'carol@org',
    displayName: 'Carol',
    role: 'sponsor',
    invitedAt: 1,
  },
];

describe('<AddPlanForm />', () => {
  it('renders factor, method, sample size, owner, and msaRequired fields', () => {
    render(
      <AddPlanForm hypothesisId="h-1" members={members} onSave={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByLabelText(/factor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sample size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/msa/i)).toBeInTheDocument();
  });

  it('omits sponsors from the owner picker', () => {
    render(
      <AddPlanForm hypothesisId="h-1" members={members} onSave={vi.fn()} onCancel={vi.fn()} />
    );
    const ownerSelect = screen.getByLabelText(/owner/i) as HTMLSelectElement;
    const optionValues = Array.from(ownerSelect.options).map(o => o.value);
    expect(optionValues).toContain('pm-alice');
    expect(optionValues).toContain('pm-bob');
    expect(optionValues).not.toContain('pm-carol');
  });

  it('fires onSave with the new plan shape', () => {
    const onSave = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={members} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/factor/i), { target: { value: 'spindle vibration' } });
    fireEvent.change(screen.getByLabelText(/method/i), { target: { value: 'manual-count' } });
    fireEvent.change(screen.getByLabelText(/sample size/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/owner/i), { target: { value: 'pm-bob' } });
    fireEvent.click(screen.getByLabelText(/msa/i));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith({
      hypothesisId: 'h-1',
      factor: 'spindle vibration',
      method: 'manual-count',
      sampleSize: 50,
      owner: 'pm-bob',
      status: 'planned',
      linkedFindingIds: [],
      msaRequired: true,
    });
  });

  it('blocks save when factor is empty', () => {
    const onSave = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={members} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/factor.*required|required.*factor/i)).toBeInTheDocument();
  });

  it('fires onCancel when Cancel button clicked', () => {
    const onCancel = vi.fn();
    render(
      <AddPlanForm hypothesisId="h-1" members={members} onSave={vi.fn()} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('defaults sampleSize to 30 and method to sensor', () => {
    render(
      <AddPlanForm hypothesisId="h-1" members={members} onSave={vi.fn()} onCancel={vi.fn()} />
    );
    expect((screen.getByLabelText(/sample size/i) as HTMLInputElement).value).toBe('30');
    expect((screen.getByLabelText(/method/i) as HTMLSelectElement).value).toBe('sensor');
  });
});
