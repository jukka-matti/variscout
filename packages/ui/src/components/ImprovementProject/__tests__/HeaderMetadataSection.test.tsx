import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeaderMetadataSection } from '../sections/HeaderMetadataSection';
import { ImprovementProjectForm } from '../ImprovementProjectForm';

describe('HeaderMetadataSection', () => {
  it('renders title required validation for a blank title and clears it for a nonblank title', () => {
    const { rerender } = render(<HeaderMetadataSection title="   " />);

    const titleInput = screen.getByLabelText(/project title/i);
    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/project title is required/i)).toBeInTheDocument();

    rerender(<HeaderMetadataSection title="Reduce rework" />);

    expect(screen.getByLabelText(/project title/i)).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText(/project title is required/i)).not.toBeInTheDocument();
  });

  it('calls the business case callback when the textarea changes', () => {
    const onBusinessCaseChange = vi.fn();

    render(
      <HeaderMetadataSection
        title="Reduce rework"
        businessCase="Current case"
        onBusinessCaseChange={onBusinessCaseChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/business case/i), {
      target: { value: 'Expected savings from fewer escalations' },
    });

    expect(onBusinessCaseChange).toHaveBeenCalledWith('Expected savings from fewer escalations');
  });

  it('calls the financial impact callback with merged amount and currency values', () => {
    const onFinancialImpactChange = vi.fn();

    render(
      <HeaderMetadataSection
        title="Reduce rework"
        financialImpact={{ amount: 12000, currency: 'USD' }}
        onFinancialImpactChange={onFinancialImpactChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/financial impact amount/i), {
      target: { value: '25000' },
    });
    fireEvent.change(screen.getByLabelText(/financial impact currency/i), {
      target: { value: 'EUR' },
    });
    fireEvent.change(screen.getByLabelText(/financial impact amount/i), {
      target: { value: '1e309' },
    });

    expect(onFinancialImpactChange).toHaveBeenNthCalledWith(1, {
      amount: 25000,
      currency: 'USD',
    });
    expect(onFinancialImpactChange).toHaveBeenNthCalledWith(2, {
      amount: 12000,
      currency: 'EUR',
    });
    expect(onFinancialImpactChange).toHaveBeenNthCalledWith(3, {
      amount: undefined,
      currency: 'USD',
    });
  });

  it('calls the investigation callback with selected ids and undefined when cleared', () => {
    const onProjectIdChange = vi.fn();

    render(
      <HeaderMetadataSection
        title="Reduce rework"
        projectId="inv-1"
        projectOptions={[
          { id: 'inv-1', name: 'Returns spike' },
          { id: 'inv-2', name: 'Late handoffs' },
        ]}
        onProjectIdChange={onProjectIdChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/linked investigation/i), {
      target: { value: 'inv-2' },
    });
    fireEvent.change(screen.getByLabelText(/linked investigation/i), {
      target: { value: '' },
    });

    expect(onProjectIdChange).toHaveBeenNthCalledWith(1, 'inv-2');
    expect(onProjectIdChange).toHaveBeenNthCalledWith(2, undefined);
  });

  it('calls onMembersChange with full next arrays for add, remove, role, and display name edits', () => {
    const onMembersChange = vi.fn();
    const members: import('@variscout/core/projectMembership').ProjectMember[] = [
      {
        id: 'pm-ari',
        createdAt: 1,
        deletedAt: null,
        userId: 'ari@org',
        displayName: 'Ari Lead',
        role: 'lead',
        invitedAt: 1,
      },
      {
        id: 'pm-tia',
        createdAt: 1,
        deletedAt: null,
        userId: 'tia@org',
        displayName: 'Tia Member',
        role: 'member',
        invitedAt: 1,
      },
    ];

    render(
      <HeaderMetadataSection
        title="Reduce rework"
        members={members}
        onMembersChange={onMembersChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add team member/i }));
    const firstCall = onMembersChange.mock.calls[0][0] as typeof members;
    expect(firstCall).toHaveLength(3);
    expect(firstCall[0]).toEqual(members[0]);
    expect(firstCall[1]).toEqual(members[1]);
    expect(firstCall[2]).toMatchObject({ displayName: '', role: 'member' });

    const rows = screen.getAllByTestId('metadata-team-row');
    fireEvent.change(within(rows[0]).getByLabelText(/role/i), {
      target: { value: 'sponsor' },
    });
    expect(onMembersChange).toHaveBeenNthCalledWith(2, [
      { ...members[0], role: 'sponsor' },
      members[1],
    ]);

    fireEvent.change(within(rows[1]).getByLabelText(/display name/i), {
      target: { value: 'Taylor Lead' },
    });
    expect(onMembersChange).toHaveBeenNthCalledWith(3, [
      members[0],
      { ...members[1], displayName: 'Taylor Lead' },
    ]);

    fireEvent.click(within(rows[0]).getByRole('button', { name: /remove/i }));
    expect(onMembersChange).toHaveBeenNthCalledWith(4, [members[1]]);
  });
});

describe('ImprovementProjectForm metadata integration', () => {
  it('renders HeaderMetadataSection in Section 1 when metadataProps are provided', () => {
    render(<ImprovementProjectForm metadataProps={{ title: 'Reduce rework' }} />);

    expect(screen.getByLabelText(/project title/i)).toHaveValue('Reduce rework');
  });

  it('keeps sectionContent.metadata override compatibility when metadataProps are provided', () => {
    render(
      <ImprovementProjectForm
        metadataProps={{ title: 'Reduce rework' }}
        sectionContent={{ metadata: <div>Custom metadata override</div> }}
      />
    );

    expect(screen.getByText('Custom metadata override')).toBeInTheDocument();
    expect(screen.queryByLabelText(/project title/i)).not.toBeInTheDocument();
  });
});
