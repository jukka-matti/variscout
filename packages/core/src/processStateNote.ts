/**
 * The 4 kinds of team notes a user can attach to a current-state item.
 * Order is stable — used for UI rendering and telemetry classification.
 */
export type ProcessStateNoteKind = 'question' | 'gemba' | 'data-gap' | 'decision';

export const PROCESS_STATE_NOTE_KINDS: readonly ProcessStateNoteKind[] = [
  'question',
  'gemba',
  'data-gap',
  'decision',
] as const;

const KIND_SET: ReadonlySet<string> = new Set(PROCESS_STATE_NOTE_KINDS);

/**
 * Type guard: true if `value` is one of the 4 valid kinds. Used at storage
 * boundaries (loaded JSON may contain stale or hand-edited values).
 */
export function isProcessStateNoteKind(value: string): value is ProcessStateNoteKind {
  return KIND_SET.has(value);
}

/**
 * A single team note attached to a `ProcessStateItem`.
 *
 * Notes are stored on `ProcessHubInvestigationMetadata.stateNotes[]` and
 * round-trip through Blob Storage with the rest of the project metadata.
 */
export interface ProcessStateNote {
  /** Unique ID — generated client-side, e.g. `note-{timestamp}-{counter}`. */
  id: string;
  /** The `ProcessStateItem.id` this note is attached to. */
  itemId: string;
  kind: ProcessStateNoteKind;
  /** Plain text. No markdown rendering in v1. */
  text: string;
  /** EasyAuth display name (or 'Anonymous' in local dev). */
  author: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** Present only when the note has been edited. */
  updatedAt?: string;
}
