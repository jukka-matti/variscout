/**
 * HypothesisComments — local comment thread for a Hypothesis card (Investigation Wall).
 *
 * Lifts/parameterizes FindingComments: reuses the existing thread widget and
 * editor, wiring hub.comments as the data source and the hub id as the
 * "findingId" context. ADR-093 makes comments local-first and typed; there is
 * no in-product membership ACL.
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
import type { ProjectContributor } from '@variscout/core/improvementProject';
import FindingComments from '../FindingsLog/FindingComments';

export interface HypothesisCommentsProps {
  /** The hypothesis whose comments to display. */
  hub: Hypothesis;
  /** Local contributor labels used for author display and future mention resolution. */
  members: ReadonlyArray<ProjectContributor>;
  /** Current local user id. */
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
  void members;
  void currentUserId;

  return (
    <FindingComments
      comments={hub.comments ?? []}
      findingId={hub.id}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
      showAuthors={showAuthors}
      canEdit
    />
  );
};
