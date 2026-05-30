/**
 * HypothesisComments — team comment thread for a Hypothesis card (Investigation Wall).
 *
 * Lifts/parameterizes FindingComments: reuses the existing thread widget and
 * editor, wiring hub.comments as the data source and the hub id as the
 * "findingId" context. ACL gate mirrors HypothesisCardWithPlans:
 *   - members.length === 0  → open-access (V1 single-user scenario)
 *   - otherwise             → canAccess(currentUserId, members, 'edit-contributions')
 *
 * SSE sync: addHubComment (+ useHubCommentStream) are wired at the app level;
 * this component receives callbacks (onAdd/onEdit/onDelete) and is agnostic to
 * transport.
 *
 * Rendered inside a foreignObject extension zone (not SVG), so normal div
 * context applies.
 */

import React from 'react';
import type { Hypothesis } from '@variscout/core';
import type { ProjectMember } from '@variscout/core/projectMembership';
import { canAccess } from '@variscout/core/projectMembership';
import FindingComments from '../FindingsLog/FindingComments';

export interface HypothesisCommentsProps {
  /** The hypothesis whose comments to display. */
  hub: Hypothesis;
  /** Project members for ACL checks. Pass `[]` for open-access (single-user). */
  members: ReadonlyArray<ProjectMember>;
  /**
   * Current user's userId (ProjectMember.userId). Pass `null` when unauthenticated.
   * Ignored when `members` is empty (open-access escape).
   */
  currentUserId: string | null;
  /** Called when the user submits a new comment. */
  onAdd: (hubId: string, text: string, attachment?: File) => void;
  /** Called when the user saves an edited comment. */
  onEdit: (hubId: string, commentId: string, text: string) => void;
  /** Called when the user deletes a comment. */
  onDelete: (hubId: string, commentId: string) => void;
  /** Show author names on comments (default false). */
  showAuthors?: boolean;
}

export const HypothesisComments: React.FC<HypothesisCommentsProps> = ({
  hub,
  members,
  currentUserId,
  onAdd,
  onEdit,
  onDelete,
  showAuthors,
}) => {
  // ACL gate — open-access when no members configured (V1 single-user scenario)
  const canEdit =
    members.length === 0 ||
    (currentUserId !== null && canAccess(currentUserId, [...members], 'edit-contributions'));

  return (
    <FindingComments
      comments={hub.comments ?? []}
      findingId={hub.id}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
      showAuthors={showAuthors}
      canEdit={canEdit}
    />
  );
};
