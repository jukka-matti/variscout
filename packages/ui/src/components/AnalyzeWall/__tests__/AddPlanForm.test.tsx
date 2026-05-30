import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddPlanForm } from '../AddPlanForm';
import type { ProjectMember } from '@variscout/core/projectMembership';
import type { ConditionLeaf } from '@variscout/core/findings';

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
  it('renders primary factor, method, sample size, owner, outcome, neededFactors, and msa note fields', () => {
    render(
      <AddPlanForm hypothesisId="h-1" members={members} onSave={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByLabelText(/primary factor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sample size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/outcome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/needed factors/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/msa/i)).toBeInTheDocument();
  });

  it('does NOT render an msaRequired checkbox (replaced by msaNote textarea)', () => {
    render(
      <AddPlanForm hypothesisId="h-1" members={members} onSave={vi.fn()} onCancel={vi.fn()} />
    );
    // The old checkbox had id="add-plan-msa" and type="checkbox"
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(0);
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

  it('fires onSave with the DCP plan shape', () => {
    const onSave = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={members} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/primary factor/i), {
      target: { value: 'spindle vibration' },
    });
    fireEvent.change(screen.getByLabelText(/outcome/i), { target: { value: 'Fill Weight' } });
    fireEvent.change(screen.getByLabelText(/needed factors/i), {
      target: { value: 'SHIFT, Operator' },
    });
    fireEvent.change(screen.getByLabelText(/method/i), { target: { value: 'manual-count' } });
    fireEvent.change(screen.getByLabelText(/sample size/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/owner/i), { target: { value: 'pm-bob' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith({
      hypothesisId: 'h-1',
      outcome: 'Fill Weight',
      primaryFactor: 'spindle vibration',
      neededFactors: ['SHIFT', 'Operator'],
      method: 'manual-count',
      sampleSize: 50,
      owner: 'pm-bob',
      status: 'planned',
      scope: [],
      processLocation: '',
      linkedFindingIds: [],
    });
  });

  it('blocks save when primary factor is empty', () => {
    const onSave = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={members} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(
      screen.getByText(/primary factor.*required|required.*primary factor/i)
    ).toBeInTheDocument();
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

  it('omits soft-deleted members from the owner picker', () => {
    const membersWithSoftDeleted: ProjectMember[] = [
      ...members,
      {
        id: 'pm-deleted',
        userId: 'u-4',
        displayName: 'Removed',
        role: 'member',
        invitedAt: 4,
        createdAt: 4,
        deletedAt: 100,
      },
    ];
    render(
      <AddPlanForm
        hypothesisId="h-1"
        members={membersWithSoftDeleted}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const ownerSelect = screen.getByLabelText(/owner/i) as HTMLSelectElement;
    const optionValues = Array.from(ownerSelect.options).map(o => o.value);
    expect(optionValues).not.toContain('pm-deleted');
  });

  it('pre-fills outcome from defaultOutcome prop', () => {
    render(
      <AddPlanForm
        hypothesisId="h-1"
        members={members}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        defaultOutcome="Fill Weight (g)"
      />
    );
    expect((screen.getByLabelText(/outcome/i) as HTMLInputElement).value).toBe('Fill Weight (g)');
  });

  it('sets scope from defaultScope prop in onSave payload', () => {
    const onSave = vi.fn();
    const scope: ConditionLeaf[] = [{ kind: 'leaf', column: 'SHIFT', op: 'eq', value: 'night' }];
    render(
      <AddPlanForm
        hypothesisId="h-1"
        members={members}
        onSave={onSave}
        onCancel={vi.fn()}
        defaultScope={scope}
      />
    );
    fireEvent.change(screen.getByLabelText(/primary factor/i), { target: { value: 'Temp' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSave.mock.calls[0][0];
    expect(payload.scope).toEqual(scope);
  });

  it('renders step options select when stepOptions are provided', () => {
    render(
      <AddPlanForm
        hypothesisId="h-1"
        members={members}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        stepOptions={[
          { id: 'step-fill-1', label: 'Fill' },
          { id: 'step-pack-2', label: 'Pack' },
        ]}
      />
    );
    expect(screen.getByLabelText(/process step/i)).toBeInTheDocument();
    const stepSelect = screen.getByLabelText(/process step/i) as HTMLSelectElement;
    const values = Array.from(stepSelect.options).map(o => o.value);
    expect(values).toContain('step-fill-1');
    expect(values).toContain('step-pack-2');
    expect(values).toContain(''); // "— none —" option
  });

  it('does not render process step select when stepOptions is absent', () => {
    render(
      <AddPlanForm hypothesisId="h-1" members={members} onSave={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.queryByLabelText(/process step/i)).not.toBeInTheDocument();
  });

  it('sets processLocation from step select in onSave payload', () => {
    const onSave = vi.fn();
    render(
      <AddPlanForm
        hypothesisId="h-1"
        members={members}
        onSave={onSave}
        onCancel={vi.fn()}
        stepOptions={[{ id: 'step-fill-1', label: 'Fill' }]}
      />
    );
    fireEvent.change(screen.getByLabelText(/primary factor/i), { target: { value: 'Temp' } });
    fireEvent.change(screen.getByLabelText(/process step/i), {
      target: { value: 'step-fill-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSave.mock.calls[0][0];
    expect(payload.processLocation).toBe('step-fill-1');
  });

  it('includes opDef in onSave payload when entered', () => {
    const onSave = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={members} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/primary factor/i), { target: { value: 'Temp' } });
    fireEvent.change(screen.getByLabelText(/operational definition/i), {
      target: { value: 'Measure at station 3' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSave.mock.calls[0][0];
    expect(payload.opDef).toBe('Measure at station 3');
  });

  it('omits opDef from onSave payload when blank', () => {
    const onSave = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={members} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/primary factor/i), { target: { value: 'Temp' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSave.mock.calls[0][0];
    expect(payload).not.toHaveProperty('opDef');
  });

  it('includes msaNote in onSave payload when entered', () => {
    const onSave = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={members} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/primary factor/i), { target: { value: 'Temp' } });
    fireEvent.change(screen.getByLabelText(/msa/i), {
      target: { value: 'Calibrate gauge monthly' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSave.mock.calls[0][0];
    expect(payload.msaNote).toBe('Calibrate gauge monthly');
  });

  it('omits msaNote from onSave payload when blank', () => {
    const onSave = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={members} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/primary factor/i), { target: { value: 'Temp' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSave.mock.calls[0][0];
    expect(payload).not.toHaveProperty('msaNote');
  });

  it('parses whitespace-padded and empty comma segments in neededFactors correctly', () => {
    const onSave = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={members} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/primary factor/i), { target: { value: 'Temp' } });
    fireEvent.change(screen.getByLabelText(/needed factors/i), {
      target: { value: ' SHIFT , , Operator, ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSave.mock.calls[0][0];
    expect(payload.neededFactors).toEqual(['SHIFT', 'Operator']);
  });

  it('produces empty neededFactors array when input is blank', () => {
    const onSave = vi.fn();
    render(<AddPlanForm hypothesisId="h-1" members={members} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/primary factor/i), { target: { value: 'Temp' } });
    // leave neededFactors blank (default '')
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSave.mock.calls[0][0];
    expect(payload.neededFactors).toEqual([]);
  });

  it('uses the cleared outcome value (not the prefill) when user erases a prefilled outcome', () => {
    const onSave = vi.fn();
    render(
      <AddPlanForm
        hypothesisId="h-1"
        members={members}
        onSave={onSave}
        onCancel={vi.fn()}
        defaultOutcome="Fill Weight (g)"
      />
    );
    fireEvent.change(screen.getByLabelText(/primary factor/i), { target: { value: 'Temp' } });
    // User clears the pre-filled outcome field
    fireEvent.change(screen.getByLabelText(/outcome/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    const payload = onSave.mock.calls[0][0];
    // outcome must be '' — NOT the defaultOutcome re-substituted
    expect(payload.outcome).toBe('');
  });
});
