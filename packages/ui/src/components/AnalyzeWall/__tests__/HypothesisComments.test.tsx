/**
 * HypothesisComments — task 1 failing tests (RED).
 *
 * Acceptance:
 *   - Hypothesis card renders a comment thread bound to hub.comments.
 *   - An edit-contributions member can ADD/EDIT/DELETE a comment via a human composer.
 *   - The composer is hidden when canAccess(…, 'edit-contributions') is false.
 *   - Existing FindingComments tests stay green (untouched).
 *
 * Reuse strategy: HypothesisComments lifts/parameterizes FindingComments,
 * binding hub.comments as the comment list and addHubComment/editHubComment/
 * deleteHubComment as the write callbacks.
 *
 * vi.mock() calls MUST be hoisted before any production imports (Vitest
 * hoists vi.mock to the top of the module regardless of textual position,
 * but to be safe we group them at the top before the non-mock imports).
 *
 * HypothesisComments wraps FindingComments → FindingEditor, which imports
 * `useTranslation` from @variscout/hooks (the `finding.note` aria-label below
 * depends on the identity `t` mock) and lucide-react icons. Those two mocks
 * are load-bearing. It does NOT import @variscout/stores — no store mock needed.
 */

vi.mock('lucide-react', () => ({
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
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Hypothesis, FindingComment } from '@variscout/core';
import type { ProjectMember } from '@variscout/core/projectMembership';

// ── The component under test — does NOT exist yet (RED) ───────────────────────
// HypothesisComments: lifts FindingComments and binds to hub.comments +
// addHubComment/editHubComment/deleteHubComment. Renders inside a normal div
// context (not SVG), as it lives in the foreignObject extension zone.
import { HypothesisComments } from '../HypothesisComments';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const leadMember: ProjectMember = {
  id: 'm1',
  userId: 'user-lead',
  displayName: 'Alice Lead',
  role: 'lead',
  invitedAt: 1,
  createdAt: 1,
  deletedAt: null,
};

const memberMember: ProjectMember = {
  id: 'm2',
  userId: 'user-member',
  displayName: 'Bob Member',
  role: 'member',
  invitedAt: 1,
  createdAt: 1,
  deletedAt: null,
};

const sponsorMember: ProjectMember = {
  id: 'm3',
  userId: 'user-sponsor',
  displayName: 'Carol Sponsor',
  role: 'sponsor',
  invitedAt: 1,
  createdAt: 1,
  deletedAt: null,
};

const existingComment: FindingComment = {
  id: 'comment-1',
  text: 'First team comment',
  createdAt: 1_000_000,
  deletedAt: null,
  parentId: 'h1',
  parentKind: 'hypothesis',
  author: 'Alice Lead',
};

const hub: Hypothesis = {
  id: 'h1',
  name: 'Nozzle runs hot on night shift',
  synthesis: '',
  findingIds: ['f1'],
  status: 'proposed',
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
  investigationId: 'inv-1',
  comments: [existingComment],
};

const hubNoComments: Hypothesis = {
  ...hub,
  id: 'h2',
  comments: [],
};

// ── Helper ─────────────────────────────────────────────────────────────────────

type Props = React.ComponentProps<typeof HypothesisComments>;

function makeProps(overrides: Partial<Props> = {}): Props {
  return {
    hub: hub,
    members: [leadMember, memberMember, sponsorMember],
    currentUserId: 'user-lead',
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('HypothesisComments — thread rendering', () => {
  it('renders a comment count toggle when hub has comments', () => {
    render(<HypothesisComments {...makeProps()} />);
    // FindingComments renders "N comments" toggle button
    expect(screen.getByText(/1 comment/i)).toBeInTheDocument();
  });

  it('renders "Add comment" when hub has no comments', () => {
    render(<HypothesisComments {...makeProps({ hub: hubNoComments })} />);
    expect(screen.getByText(/Add comment/i)).toBeInTheDocument();
  });

  it('expands the thread on toggle click, showing existing comment text', () => {
    render(<HypothesisComments {...makeProps()} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    expect(screen.getByText('First team comment')).toBeInTheDocument();
  });

  it('shows author name when showAuthors is true', () => {
    render(<HypothesisComments {...makeProps({ showAuthors: true })} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    expect(screen.getByText('Alice Lead')).toBeInTheDocument();
  });

  it('renders all comments when hub has multiple', () => {
    const secondComment: FindingComment = {
      id: 'comment-2',
      text: 'Second team comment',
      createdAt: 2_000_000,
      deletedAt: null,
      parentId: 'h1',
      parentKind: 'hypothesis',
    };
    const hubMulti: Hypothesis = { ...hub, comments: [existingComment, secondComment] };
    render(<HypothesisComments {...makeProps({ hub: hubMulti })} />);
    fireEvent.click(screen.getByText(/2 comments/i));
    expect(screen.getByText('First team comment')).toBeInTheDocument();
    expect(screen.getByText('Second team comment')).toBeInTheDocument();
  });
});

describe('HypothesisComments — human composer (ACL-gated add)', () => {
  it('shows "+ Add comment" button when canEdit (lead member)', () => {
    render(<HypothesisComments {...makeProps({ currentUserId: 'user-lead' })} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    expect(screen.getByText('+ Add comment')).toBeInTheDocument();
  });

  it('shows "+ Add comment" button when canEdit (member role)', () => {
    render(<HypothesisComments {...makeProps({ currentUserId: 'user-member' })} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    expect(screen.getByText('+ Add comment')).toBeInTheDocument();
  });

  it('shows "+ Add comment" button when canEdit (sponsor role)', () => {
    render(<HypothesisComments {...makeProps({ currentUserId: 'user-sponsor' })} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    expect(screen.getByText('+ Add comment')).toBeInTheDocument();
  });

  it('hides the composer completely when user is not in members (non-empty members)', () => {
    render(<HypothesisComments {...makeProps({ currentUserId: 'user-not-a-member' })} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    expect(screen.queryByText('+ Add comment')).toBeNull();
  });

  it('shows the composer when members is empty (open-access escape)', () => {
    render(<HypothesisComments {...makeProps({ members: [], currentUserId: 'user-any' })} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    expect(screen.getByText('+ Add comment')).toBeInTheDocument();
  });

  it('shows the composer when currentUserId is null and members is empty', () => {
    render(<HypothesisComments {...makeProps({ members: [], currentUserId: null })} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    expect(screen.getByText('+ Add comment')).toBeInTheDocument();
  });

  it('calls onAdd with hubId + text when a comment is submitted', () => {
    const onAdd = vi.fn();
    render(
      <HypothesisComments
        {...makeProps({ hub: hubNoComments, onAdd, currentUserId: 'user-lead' })}
      />
    );
    fireEvent.click(screen.getByText(/Add comment/i));
    fireEvent.click(screen.getByText('+ Add comment'));

    // FindingEditor uses aria-label 'finding.note'
    const textarea = screen.getByLabelText('finding.note');
    fireEvent.change(textarea, { target: { value: 'Night shift observation' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onAdd).toHaveBeenCalledWith('h2', 'Night shift observation', undefined);
  });
});

describe('HypothesisComments — edit (ACL-gated)', () => {
  it('shows the edit button on hover when canEdit is true', () => {
    render(<HypothesisComments {...makeProps({ currentUserId: 'user-lead' })} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    // Edit button is present (opacity-0 on idle, but rendered in DOM)
    expect(screen.getByLabelText('Edit comment')).toBeInTheDocument();
  });

  it('does NOT render the edit button when canEdit is false', () => {
    render(<HypothesisComments {...makeProps({ currentUserId: 'user-not-a-member' })} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    expect(screen.queryByLabelText('Edit comment')).toBeNull();
  });

  it('calls onEdit with hubId + commentId + new text when the edit is saved', () => {
    const onEdit = vi.fn();
    render(<HypothesisComments {...makeProps({ onEdit, currentUserId: 'user-lead' })} />);
    fireEvent.click(screen.getByText(/1 comment/i));

    fireEvent.click(screen.getByLabelText('Edit comment'));

    const textarea = screen.getByLabelText('finding.note');
    fireEvent.change(textarea, { target: { value: 'Edited team comment' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(onEdit).toHaveBeenCalledWith('h1', 'comment-1', 'Edited team comment');
  });
});

describe('HypothesisComments — delete (ACL-gated)', () => {
  it('shows the delete button when canEdit is true', () => {
    render(<HypothesisComments {...makeProps({ currentUserId: 'user-lead' })} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    expect(screen.getByLabelText('Delete comment')).toBeInTheDocument();
  });

  it('does NOT render the delete button when canEdit is false', () => {
    render(<HypothesisComments {...makeProps({ currentUserId: 'user-not-a-member' })} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    expect(screen.queryByLabelText('Delete comment')).toBeNull();
  });

  it('calls onDelete with hubId + commentId when the delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<HypothesisComments {...makeProps({ onDelete, currentUserId: 'user-lead' })} />);
    fireEvent.click(screen.getByText(/1 comment/i));
    fireEvent.click(screen.getByLabelText('Delete comment'));
    expect(onDelete).toHaveBeenCalledWith('h1', 'comment-1');
  });
});
