vi.mock('lucide-react', () => ({
  ChevronLeft: (props: Record<string, unknown>) => (
    <span data-testid="chevron-left-icon" {...props} />
  ),
  ChevronRight: (props: Record<string, unknown>) => (
    <span data-testid="chevron-right-icon" {...props} />
  ),
  MessageSquare: (props: Record<string, unknown>) => (
    <span data-testid="messagesquare-icon" {...props} />
  ),
  Pencil: (props: Record<string, unknown>) => <span data-testid="pencil-icon" {...props} />,
  Trash2: (props: Record<string, unknown>) => <span data-testid="trash-icon" {...props} />,
  Camera: (props: Record<string, unknown>) => <span data-testid="camera-icon" {...props} />,
  Loader2: (props: Record<string, unknown>) => <span data-testid="loader-icon" {...props} />,
  ImageIcon: (props: Record<string, unknown>) => <span data-testid="image-icon" {...props} />,
  Paperclip: (props: Record<string, unknown>) => <span data-testid="paperclip-icon" {...props} />,
  FileText: (props: Record<string, unknown>) => <span data-testid="filetext-icon" {...props} />,
  X: (props: Record<string, unknown>) => <span data-testid="x-icon" {...props} />,
  Mic: (props: Record<string, unknown>) => <span data-testid="mic-icon" {...props} />,
}));

vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    locale: 'en-US',
  }),
}));

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Finding, FindingComment, Hypothesis } from '@variscout/core';
import type { ProjectContributor } from '@variscout/core/improvementProject';

import { ObjectDetailDrawer } from '../ObjectDetailDrawer';

const leadMember: ProjectContributor = {
  id: 'm1',
  userId: 'user-lead',
  displayName: 'Alice Lead',
  createdAt: 1,
  deletedAt: null,
};

const hubComment: FindingComment = {
  id: 'hc1',
  text: 'Existing cause comment',
  createdAt: 1_000,
  deletedAt: null,
  parentId: 'h1',
  parentKind: 'hypothesis',
  author: 'Alice Lead',
};

const findingComment: FindingComment = {
  id: 'fc1',
  text: 'Existing finding comment',
  createdAt: 1_000,
  deletedAt: null,
  parentId: 'f1',
  parentKind: 'finding',
  author: 'Alice Lead',
};

const supportingFinding: Finding = {
  id: 'f1',
  text: 'Temperature spike',
  evidenceType: 'data',
  context: { activeFilters: {}, cumulativeScope: null },
  status: 'observed',
  comments: [findingComment],
  statusChangedAt: 1,
  createdAt: 1,
  deletedAt: null,
};

const counterFinding: Finding = {
  id: 'f2',
  text: 'Jig checked OK',
  evidenceType: 'gemba',
  refutes: true,
  context: { activeFilters: {}, cumulativeScope: null },
  status: 'investigating',
  comments: [],
  statusChangedAt: 1,
  createdAt: 1,
  deletedAt: null,
};

const hub: Hypothesis = {
  id: 'h1',
  name: 'Nozzle runs hot',
  synthesis: 'Heat lines up with the defect window.',
  findingIds: ['f1', 'f2'],
  counterFindingIds: ['f2'],
  status: 'proposed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  comments: [hubComment],
  actions: [
    {
      id: 'a1',
      text: 'Check coolant flow',
      status: 'open',
      createdAt: 1,
      deletedAt: null,
    },
  ],
};

type Props = React.ComponentProps<typeof ObjectDetailDrawer>;

function makeProps(overrides: Partial<Props> = {}): Props {
  return {
    selectedObject: { kind: 'cause', id: 'h1' },
    isOpen: true,
    onOpenChange: vi.fn(),
    hubs: [hub],
    findings: [supportingFinding, counterFinding],
    members: [leadMember],
    currentUserId: 'user-lead',
    onAddHubComment: vi.fn(),
    onEditHubComment: vi.fn(),
    onDeleteHubComment: vi.fn(),
    onAddFindingComment: vi.fn(),
    onEditFindingComment: vi.fn(),
    onDeleteFindingComment: vi.fn(),
    showAuthors: true,
    ...overrides,
  };
}

describe('ObjectDetailDrawer', () => {
  it('renders a slim left handle when closed', () => {
    render(<ObjectDetailDrawer {...makeProps({ isOpen: false, selectedObject: null })} />);

    expect(screen.getByTestId('object-detail-handle')).toHaveTextContent('Details');
    expect(screen.queryByTestId('object-detail-drawer')).toBeNull();
  });

  it('opens on a selected cause with the expected tabs', () => {
    render(<ObjectDetailDrawer {...makeProps({ selectedObject: { kind: 'cause', id: 'h1' } })} />);

    expect(screen.getByTestId('object-detail-drawer')).toHaveTextContent('Suspected cause');
    expect(screen.getByTestId('object-detail-title')).toHaveTextContent('Nozzle runs hot');
    expect(screen.getByRole('tab', { name: 'Evidence' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Comments' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Activity' })).toBeInTheDocument();
  });

  it('shows supporting and counter evidence for a cause', () => {
    render(<ObjectDetailDrawer {...makeProps({ selectedObject: { kind: 'cause', id: 'h1' } })} />);

    const evidence = screen.getByTestId('object-detail-evidence');
    expect(evidence).toHaveTextContent('Supports');
    expect(evidence).toHaveTextContent('Temperature spike');
    expect(evidence).toHaveTextContent('Counts against');
    expect(evidence).toHaveTextContent('Jig checked OK');
  });

  it('uses hypothesis comment callbacks for cause comments', () => {
    const onAddHubComment = vi.fn();
    render(
      <ObjectDetailDrawer
        {...makeProps({ selectedObject: { kind: 'cause', id: 'h1' }, onAddHubComment })}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Comments' }));
    fireEvent.click(screen.getByText(/1 comment/i));
    fireEvent.click(screen.getByText('+ Add comment'));
    fireEvent.change(screen.getByLabelText(/finding.note/i), {
      target: { value: 'Drawer comment' },
    });
    fireEvent.keyDown(screen.getByLabelText(/finding.note/i), {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
    });

    expect(onAddHubComment).toHaveBeenCalledWith('h1', 'Drawer comment', undefined);
  });

  it('opens on a selected finding with evidence metadata', () => {
    render(
      <ObjectDetailDrawer {...makeProps({ selectedObject: { kind: 'finding', id: 'f1' } })} />
    );

    expect(screen.getByTestId('object-detail-drawer')).toHaveTextContent('Finding');
    expect(screen.getByTestId('object-detail-title')).toHaveTextContent('Temperature spike');
    expect(screen.getByTestId('object-detail-evidence')).toHaveTextContent('Data');
    expect(screen.getByTestId('object-detail-evidence')).toHaveTextContent('Observed');
  });

  it('uses finding comment callbacks for finding comments', () => {
    const onAddFindingComment = vi.fn();
    render(
      <ObjectDetailDrawer
        {...makeProps({
          selectedObject: { kind: 'finding', id: 'f1' },
          onAddFindingComment,
        })}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Comments' }));
    fireEvent.click(screen.getByText(/1 comment/i));
    fireEvent.click(screen.getByText('+ Add comment'));
    fireEvent.change(screen.getByLabelText(/finding.note/i), {
      target: { value: 'Finding drawer comment' },
    });
    fireEvent.keyDown(screen.getByLabelText(/finding.note/i), {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
    });

    expect(onAddFindingComment).toHaveBeenCalledWith('f1', 'Finding drawer comment', undefined);
  });
});
