---
title: Phase 3 — H1 Closure + H2 Launch
audience: engineer
category: design-spec
status: draft
related:
  - 2026-04-27-actionable-current-process-state-panel-design.md
  - 2026-04-27-product-method-roadmap-design.md
  - 2026-04-27-process-learning-operating-model-design.md
  - 2026-04-26-evidence-sources-data-profiles-design.md
  - 2026-04-26-agent-review-log-process-hub-design.md
  - ../../07-decisions/adr-070-frame-workspace.md
  - ../../07-decisions/adr-072-process-hub-storage-and-coscout-context.md
  - ../../07-decisions/adr-059-web-first-deployment.md
---

# Phase 3 — H1 Closure + H2 Launch

> **Implementation plan:** [`2026-04-27-phase-3-h1-closure-h2-launch-plan.md`](../plans/2026-04-27-phase-3-h1-closure-h2-launch-plan.md) — TDD breakdown for PR #1 (team notes), PR #2 (full EvidenceSheet), PR #3 (general Evidence Source).

## Context

Phase 2 V2 closed 2026-04-27 (PRs #96 / #97 / #98 / #99). The actionable `ProcessHubCurrentStatePanel` delivers the H1 product promise of _"a process team can open one hub and understand what needs attention now, why, and which response path fits"_ — but two H1 capabilities remain incomplete and one V2 surface (the evidence chip) is currently a half-loop.

Per the **Product Method Roadmap**:

- **H1 line 144** — _"Team notes on state items: question, gemba finding, data gap, decision."_ Process owners need to capture team context at cadence review without leaving the hub. Today there is nowhere on a state-item card to write a note.
- **V2 evidence-chip half-loop** — the chip count derives from `findingCounts` metadata, but click navigates to the most-recent linked investigation rather than rendering the actual findings. The full `EvidenceSheet` design exists in the prior spec but was deferred because Dashboard didn't load `Finding[]` hub-wide. This phase resolves the load decision (lazy on chip click) and ships the sheet.
- **H2 line 181** — _"General Evidence Source setup for ordinary CSV/Excel exports."_ First slice of the Process Measurement System horizon. Today only the `AGENT_REVIEW_LOG_PROFILE` exists; users cannot promote arbitrary CSV/Excel into recurring evidence.

Phase 3 closes the H1 gap and launches H2 in three sequenced PRs. The full vision is specced here; the implementation plan sequences delivery (per `feedback_full_vision_spec` memory).

## Goal

After Phase 3, a process owner can:

1. Open the hub, see current state, **add a team note** (question / gemba finding / data gap / decision) on any state-item card without leaving the Dashboard. The note persists across reload and is visible to other team members.
2. Click an evidence chip on a state-item card and **see the actual findings** in a bottom sheet — labels, statuses, click-through to the specific finding inside the investigation.
3. Upload **any tabular CSV or Excel file** (not just an Agent Review Log) and promote it into a recurring `EvidenceSource` for the hub, with a confirmed column mapping and an initial `EvidenceSnapshot`.

All three capabilities respect existing invariants: required props throughout, exhaustive switches where applicable, App Insights telemetry on user actions (no PII per ADR-059), Azure-only feature surface (PWA does not get hub features per ADR-072).

## Non-Goals

These are deferred to later horizons or follow-up passes:

1. **MSA editor surface** (`measurement-system-work` response path). Renders 'Planned' pill today; H2 territory but its own design pass.
2. **Snapshot trend / Cp-Cpk gap card** in `ProcessHubCurrentStatePanel` (roadmap H2 second slice). Comes after PR #3 establishes the snapshot pipeline.
3. **Recurring snapshot trigger / cadence enforcement.** PR #3 stores cadence as metadata only; nothing pulls or pushes snapshots on a schedule. Separate horizon slice.
4. **Hub-canonical ProcessMap** (H3, level-aware Process Hub map). Separate brainstorming session per `feedback_roadmap_horizon_alignment` memory.
5. **Control-handoff workflow revisit** (user-flagged, own brainstorming session).
6. **Editor honors `?intent=` and `?surface=` query params.** Standalone ~50-LOC follow-up; can land any time independent of Phase 3.
7. **Profile config DSL.** PR #3 keeps `DataProfileDefinition` instances as TypeScript code in `DATA_PROFILE_REGISTRY`. A YAML/JSON profile-as-config format is a future H2+ refinement.
8. **Collaborative real-time presence on team notes.** PR #1 saves notes through the existing Blob-Storage round-trip; conflict resolution is last-write-wins. Real-time collaboration is its own architecture problem.
9. **i18n message catalogs** for new strings introduced in Phase 3. Hardcoded English copy preserved per existing pattern; ADR-025 catalog migration is separate.
10. **Telemetry event-naming consolidation.** Phase 3 adds new event names (`process_hub.state_note_added`, `process_hub.evidence_sheet_opened`, `process_hub.evidence_source_created`); no schema for the broader event taxonomy.

## Architecture

Three layers preserved from V2 (core → ui → apps/azure), no PWA wiring. Each PR adds a vertical slice; PR #2's evidence-contract change ripples through the panel into Azure (refactor consumer in same PR per `feedback_no_backcompat_clean_architecture`).

```
┌──────────────────────────── @variscout/core ────────────────────────────┐
│                                                                          │
│  processHub.ts (existing — extended)                                    │
│    ProcessHubInvestigationMetadata                                       │
│      + stateNotes?: ProcessStateNote[]                  (NEW for PR #1) │
│                                                                          │
│  processStateNote.ts (NEW for PR #1)                                    │
│    type ProcessStateNoteKind =                                           │
│      | 'question' | 'gemba' | 'data-gap' | 'decision';                   │
│    interface ProcessStateNote {                                          │
│      id: string;                                                         │
│      itemId: string;       // ProcessStateItem.id this note attaches to │
│      kind: ProcessStateNoteKind;                                         │
│      text: string;         // plain text; no markdown for v1            │
│      author: string;       // EasyAuth display name (or 'Anonymous')    │
│      createdAt: string;    // ISO timestamp                              │
│      updatedAt?: string;   // present when edited                       │
│    }                                                                     │
│                                                                          │
│  evidenceSources.ts (existing — extended for PR #3)                     │
│    DATA_PROFILE_REGISTRY                                                 │
│      + GENERIC_TABULAR_PROFILE                          (NEW for PR #3) │
│      Detection: any tabular file with ≥1 numeric column;                │
│        confidence scaled by column-shape recognisability.               │
│      Validation: at least 1 numeric column present + ≥1 row.            │
│      Apply: identity transform (no derived signals in this profile).    │
│                                                                          │
│  processEvidence.ts (existing — unchanged)                              │
│    linkFindingsToStateItems already supports the use case.              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ pure types + functions
                              │
┌──────────────────────────── @variscout/ui ──────────────────────────────┐
│                                                                          │
│  ProcessHubCurrentStatePanel (existing — extended)                      │
│    Props (PR #1 + PR #2 changes):                                       │
│      state, actions, evidence, notes (NEW required contract)            │
│                                                                          │
│    interface ProcessHubNotesContract (NEW — PR #1):                     │
│      notesFor: (item: ProcessStateItem) => readonly ProcessStateNote[]; │
│      onAddNote: (item, kind, text) => void;                             │
│      onEditNote: (item, noteId, text) => void;                          │
│      onDeleteNote: (item, noteId) => void;                              │
│      currentUserId: string;  // for own-note edit/delete gating         │
│                                                                          │
│    interface ProcessHubEvidenceContract (PR #2 change):                 │
│      findingsFor: (item) =>                                              │
│        readonly Finding[] | Promise<readonly Finding[]>;   (was sync)   │
│      onChipClick: (item, findings: readonly Finding[]) => void;         │
│      ↑ Sheet wraps async via local loading state.                       │
│                                                                          │
│  StateItemCard (NEW behavior — PR #1):                                  │
│    + "+" affordance opens StateItemNotesDrawer                          │
│    + notes list shown under the existing card content                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ named imports + props
                              │
┌──────────────────────────── apps/azure ─────────────────────────────────┐
│                                                                          │
│  StateItemNotesDrawer.tsx (NEW — PR #1, ~150 LOC)                       │
│    Inline drawer below state-item card. Form with kind selector +       │
│    textarea + save. Edit/delete inline on own notes.                    │
│                                                                          │
│  EvidenceSheet.tsx (NEW — PR #2, ~120 LOC)                              │
│    Bottom sheet listing findings: label + status badge + click-thru.    │
│    Loading state while findingsFor promise resolves. Esc + click-out    │
│    + close-button all close. Empty state for zero findings.             │
│                                                                          │
│  ProcessHubReviewPanel.tsx (existing — extended for all 3 PRs)          │
│    + notesFor / onAddNote / onEditNote / onDeleteNote                   │
│      wire via useStorage().saveProject() round-trip on metadata        │
│    + evidenceSheetState lifted; chip click async loads findings via    │
│      loadProject() chain                                                 │
│                                                                          │
│  ProcessHubEvidencePanel.tsx (existing — extended for PR #3, ~+300 LOC) │
│    + Profile picker (visible when detectDataProfiles returns >1 match) │
│    + Mapping confirmation form (column dropdowns wired to               │
│      detectColumns suggestions)                                          │
│    + Cadence selector (manual/daily/weekly/monthly — metadata only)    │
│                                                                          │
│  Dashboard.tsx (existing — wired for PR #1 + PR #2)                     │
│    + handleAddNote / handleEditNote / handleDeleteNote                  │
│      (telemetry + persistence via existing project-load/save chain)     │
│    + handleChipClick (PR #2): async load findings, open sheet           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key invariants

- **Required props throughout.** New `notes` contract (PR #1) is required on `ProcessHubCurrentStatePanel`. Existing consumer (`ProcessHubReviewPanel`) refactored in the same PR per `feedback_no_backcompat_clean_architecture`.
- **PR #2 changes the evidence contract** to allow async `findingsFor`. This is a breaking change to the existing contract; same-PR refactor of all consumers.
- **PR #3 adds to `DATA_PROFILE_REGISTRY`** (additive) but introduces a new UI flow. No breaking changes.
- **Telemetry no-PII** per ADR-059. New events: `process_hub.state_note_added`, `process_hub.evidence_sheet_opened`, `process_hub.evidence_sheet_finding_clicked`, `process_hub.evidence_source_created`. Payloads: `hubId` (from `rollup.hub.id`), enum values, integers. **Never** finding labels, note text, column names, or investigation IDs.
- **Azure-only.** PWA gets nothing in Phase 3 (Process Hub is Azure-only by ADR-072 + ADR-012).

## Components & Contracts

### PR #1 — Team notes on state items

#### `processStateNote.ts` (NEW in `@variscout/core`)

```ts
export type ProcessStateNoteKind = 'question' | 'gemba' | 'data-gap' | 'decision';

export const PROCESS_STATE_NOTE_KINDS: readonly ProcessStateNoteKind[] = [
  'question',
  'gemba',
  'data-gap',
  'decision',
] as const;

export interface ProcessStateNote {
  id: string;
  itemId: string;
  kind: ProcessStateNoteKind;
  text: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
}
```

`ProcessHubInvestigationMetadata` (in `processHub.ts`) gains:

```ts
stateNotes?: ProcessStateNote[];
```

Notes are **investigation-scoped** (live on per-investigation metadata). The Dashboard collects all `stateNotes` from `rollup.investigations[*].metadata.stateNotes`, filters by `itemId` for each card. This reuses the existing Blob-Storage round-trip — no new storage paths.

#### `ProcessHubNotesContract` (NEW in `@variscout/ui`)

```ts
export interface ProcessHubNotesContract {
  notesFor: (item: ProcessStateItem) => readonly ProcessStateNote[];
  onAddNote: (item: ProcessStateItem, kind: ProcessStateNoteKind, text: string) => void;
  onEditNote: (item: ProcessStateItem, noteId: string, text: string) => void;
  onDeleteNote: (item: ProcessStateItem, noteId: string) => void;
  /** Current user ID — used to gate edit/delete affordances on own notes. */
  currentUserId: string;
}
```

Added as a **required** prop alongside `state`, `actions`, `evidence`. The existing `ProcessHubReviewPanel` consumer is refactored in PR #1 to pass this contract.

#### `StateItemNotesDrawer.tsx` (NEW in `apps/azure`)

Inline drawer that toggles below a state-item card when the user clicks the "+" affordance. Renders:

- Kind selector (4 buttons: Question / Gemba / Data Gap / Decision).
- Multiline text input.
- Save / Cancel.
- Below: list of existing notes for this item (timestamp + author + kind label + text). Each note has Edit / Delete affordances if `note.author === currentUserId`.

The drawer is purely presentational — receives `notes`, `currentUserId`, and the four callbacks as props from the panel.

#### Visual delta

```
┌─ State Item Card (with notes) ──────────────────────────────────┐
│  OUTCOME                                              [● Red]   │
│  Capability below target                                         │
│  Cpk 1.05 vs target 1.33                                         │
│                                                                  │
│  [ Focused investigation ]              ⓘ 3 findings  [+ note]  │
└──────────────────────────────────────────────────────────────────┘
                                                       ↑
                                              click → drawer opens

┌─ When drawer is open, expanded card ────────────────────────────┐
│  (existing card content)                                         │
│  ─────────────────────────────────────────────────────────────  │
│  Add note: [Question] [Gemba] [Data Gap] [Decision]              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                          [Cancel]   [Save]       │
│  ─────────────────────────────────────────────────────────────  │
│  3 notes                                                         │
│  • [Question] J. Smith · 14:03 · "Are we sure the change held?" │
│    Edit · Delete                                                 │
│  • [Gemba] M. Lee · 13:48 · "Saw the operator override yesterday"│
└──────────────────────────────────────────────────────────────────┘
```

### PR #2 — Full EvidenceSheet rendering

#### `ProcessHubEvidenceContract` (refactored in `@variscout/ui`)

```ts
export interface ProcessHubEvidenceContract {
  /** May return sync (cached) or async (lazy-load). Sheet handles both. */
  findingsFor: (item: ProcessStateItem) => readonly Finding[] | Promise<readonly Finding[]>;
  onChipClick: (item: ProcessStateItem, findings: readonly Finding[]) => void;
}
```

Sheet wraps the async case with a local loading indicator. The existing PR #99 wiring (synthetic placeholder findings of count N) becomes the sync fallback for the count-only display in the panel; the async `Promise<Finding[]>` returns the real findings when the user clicks the chip and the sheet opens.

**Better contract** (refactored in same PR): split count from list.

```ts
export interface ProcessHubEvidenceContract {
  /** Sync count for the chip — derived from rollup metadata. */
  countFor: (item: ProcessStateItem) => number;
  /** Async load for the sheet. Called only when chip is clicked. */
  loadFindingsFor: (item: ProcessStateItem) => Promise<readonly Finding[]>;
  /** Fired when chip is clicked — telemetry only. */
  onChipClick: (item: ProcessStateItem) => void;
  /** Fired when user selects a finding in the sheet. */
  onFindingSelect: (item: ProcessStateItem, finding: Finding) => void;
}
```

This is **cleaner** than overloading `findingsFor` — count and load are different lifecycle concerns. The PR #99 synthetic-Finding cast goes away (resolves the `TODO(evidence-sheet-pr)` comment in `ProcessHubReviewPanel.tsx`).

#### `EvidenceSheet.tsx` (NEW in `apps/azure`)

Bottom sheet (Tailwind absolute positioning + backdrop overlay). Props:

```ts
interface EvidenceSheetProps {
  item: ProcessStateItem | null; // null = sheet hidden
  findings: readonly Finding[] | null; // null = loading
  onSelectFinding: (finding: Finding) => void;
  onClose: () => void;
}
```

Behavior:

- Renders nothing when `item === null`.
- Shows "Loading findings…" placeholder when `findings === null`.
- Renders empty-state message when `findings.length === 0`.
- Otherwise lists findings: label + status badge + click-thru. Click fires `onSelectFinding(finding)`.
- Esc key, click-outside, and explicit close button all fire `onClose`.

#### Dashboard wiring (PR #2)

```ts
const [sheetState, setSheetState] = useState<{ item: ProcessStateItem; findings: Finding[] | null } | null>(null);

const evidenceContract: ProcessHubEvidenceContract = {
  countFor: (item) => /* derive from findingCounts as before */,
  loadFindingsFor: async (item) => {
    const investigationIds = investigationIdResolver(item);
    const findingsByInv = new Map<string, Finding[]>();
    await Promise.all(
      investigationIds.map(async (invId) => {
        const project = await loadProject(invId, 'personal');  // or pick correct location
        if (project?.findings) findingsByInv.set(invId, project.findings);
      })
    );
    return linkFindingsToStateItems([item], findingsByInv, investigationIdResolver).byItemId.get(item.id) ?? [];
  },
  onChipClick: (item) => {
    safeTrackEvent('process_hub.evidence_chip_click', { hubId, responsePath: item.responsePath, lens: item.lens });
    setSheetState({ item, findings: null });
    evidenceContract.loadFindingsFor(item).then(findings =>
      setSheetState(prev => prev?.item.id === item.id ? { ...prev, findings } : prev)
    );
  },
  onFindingSelect: (item, finding) => {
    safeTrackEvent('process_hub.evidence_sheet_finding_clicked', { hubId, lens: item.lens });
    setSheetState(null);
    navigate(`/editor/${finding.investigationId ?? item.investigationIds?.[0] ?? ''}#finding-${finding.id}`);
  },
};
```

(Real navigation depends on how `Finding → investigation` resolution works in the load chain — Finding still has no `investigationId` field. Dashboard tracks the source investigation ID alongside each loaded `Finding[]` to make this work.)

### PR #3 — General Evidence Source setup for CSV/Excel

#### `GENERIC_TABULAR_PROFILE` (NEW in `evidenceSources.ts`)

```ts
export const GENERIC_TABULAR_PROFILE: DataProfileDefinition = {
  id: 'generic-tabular',
  version: 1,
  name: 'Generic tabular',
  description:
    'Any CSV/Excel file with at least one numeric column. Used when no domain-specific profile matches.',

  detect(rows, headers) {
    if (rows.length === 0 || headers.length === 0) return null;
    const numericColumns = headers.filter(h => analyzeColumn(rows, h).type === 'numeric');
    if (numericColumns.length === 0) return null;
    // Confidence: how many columns are recognisable measurement-shaped vs text/categorical?
    const confidence = numericColumns.length / headers.length;
    return {
      profileId: 'generic-tabular',
      confidence,
      recommendedMapping: detectColumns(rows, headers), // reuse existing detector
    };
  },

  validate(snapshot) {
    const issues: string[] = [];
    if (snapshot.rowCount === 0) issues.push('Snapshot has zero rows.');
    // Allow snapshots even without an outcome column — analyst may want pure factor data.
    return { valid: issues.length === 0, issues };
  },

  apply(rows, mapping) {
    // Identity transform — no derived signals for generic tabular.
    return { derivedRows: rows, derivedColumns: mapping.detectedColumns ?? [] };
  },
};

DATA_PROFILE_REGISTRY.push(GENERIC_TABULAR_PROFILE);
```

`detectDataProfiles()` (already exists) will return both `AGENT_REVIEW_LOG_PROFILE` and `GENERIC_TABULAR_PROFILE` matches when the file content fits both — UI sorts by confidence and shows a picker if both are returned.

#### `ProcessHubEvidencePanel.tsx` extensions

The existing panel auto-applies `AGENT_REVIEW_LOG_PROFILE` on upload. After Phase 3:

1. **Upload step** (existing): user picks a file, `parseText` runs.
2. **Detect step** (NEW): `detectDataProfiles(rows, headers)` returns matches. If 0 matches, show error (shouldn't happen — generic tabular accepts ≥1 numeric column). If 1 match, skip to step 3. If >1 matches, show picker dropdown.
3. **Mapping confirmation step** (NEW for generic; auto-applied for Agent Review Log unless user toggles "Edit mapping"):
   - Show detected mapping (outcome / factors / time / channels) in a form with column dropdowns.
   - User confirms or corrects.
   - "Save Evidence Source" button submits.
4. **Cadence step** (NEW for generic): radio group for `manual / daily / weekly / monthly`. Metadata only — no enforcement.
5. **Save step** (existing path): `saveEvidenceSource()` then `saveEvidenceSnapshot()` via the existing `useStorage()` facade.

#### Telemetry events (Phase 3)

| Event                                        | Payload (no PII)                                   | Trigger                         |
| -------------------------------------------- | -------------------------------------------------- | ------------------------------- |
| `process_hub.state_note_added`               | `hubId, kind, severity, lens`                      | User saves a note               |
| `process_hub.state_note_edited`              | `hubId, kind`                                      | User edits own note             |
| `process_hub.state_note_deleted`             | `hubId, kind`                                      | User deletes own note           |
| `process_hub.evidence_sheet_opened`          | `hubId, responsePath, lens, evidenceCount`         | Chip click → sheet opens        |
| `process_hub.evidence_sheet_finding_clicked` | `hubId, lens, findingStatus`                       | User selects finding from sheet |
| `process_hub.evidence_source_created`        | `hubId, profileId, columnCount, rowCount, cadence` | New Evidence Source saved       |

All `hubId` values use `rollup.hub.id` (admin-assigned), never investigation IDs.

## Data Flow

### PR #1 — Add note flow

```
User clicks [+ note] on state-item card
  → Drawer opens, user picks kind + types text
  → Save click → notes.onAddNote(item, kind, text)
  → Dashboard.handleAddNote(item, kind, text):
      1. find target investigation: item.investigationIds?.[0] ?? defaultInvestigationId
      2. loadProject(targetId) → Project
      3. mutate project.processContext.metadata.stateNotes[] (append new note)
      4. saveProject(project) → persists via Blob Storage cycle
      5. safeTrackEvent('process_hub.state_note_added', {hubId, kind, severity, lens})
  → On next Dashboard mount or rollup recompute, notes re-render via notesFor()
```

### PR #2 — Open Evidence Sheet flow

```
User clicks evidence chip
  → countFor(item) returned synchronously (chip count from findingCounts)
  → onChipClick(item) fires
  → Dashboard.handleChipClick(item):
      1. safeTrackEvent('process_hub.evidence_sheet_opened', {...})
      2. setSheetState({ item, findings: null })   → sheet shows loading
      3. evidence.loadFindingsFor(item) returns Promise
      4. when resolved → setSheetState({ item, findings })
  → Sheet renders findings list
  → User clicks finding
  → onFindingSelect(item, finding) fires
  → Dashboard navigates to `/editor/:investigationId#finding-:findingId`
```

### PR #3 — Create generic Evidence Source flow

```
User in ProcessHubEvidencePanel clicks "New Source"
  → File picker → user selects CSV/Excel
  → parseText / parseExcel produces { rows, headers }
  → detectDataProfiles(rows, headers) returns matches
      ↓ (1 match) → step "confirm mapping"
      ↓ (>1 matches) → step "pick profile" → user selects → step "confirm mapping"
  → "Confirm mapping" form pre-filled with profile.detect().recommendedMapping
  → User edits if needed, clicks Save
  → Cadence selector → user picks
  → Save:
      1. validateEvidenceSourceSnapshot(snapshot) → check
      2. useStorage().saveEvidenceSource(source)
      3. useStorage().saveEvidenceSnapshot(snapshot)
      4. safeTrackEvent('process_hub.evidence_source_created', {...})
      5. onEvidenceChanged callback fires → parent panel refreshes
```

## Error Handling

### Type-system guarantees

- `deriveResponsePathAction` exhaustive switch (existing).
- New: `ProcessStateNoteKind` exhaustive switch in the kind-selector renderer + telemetry mapping. `assertNever` default.
- New: `DataProfileDefinition.detect()` return type uses existing nullable shape — no exhaustive switch needed.

### Runtime guards

- `notes.onAddNote` rejects empty `text.trim()` with inline error in drawer (no telemetry, no save).
- `evidence.loadFindingsFor` wraps the async chain in try/catch; on error, sheet renders an error state ("Couldn't load findings — try again") with a retry button. Telemetry: `process_hub.evidence_sheet_load_error`.
- `evidence.loadFindingsFor` race condition: if user closes sheet or opens a different chip while a load is in-flight, the `setSheetState` checks the current `item.id` matches before applying.
- `saveEvidenceSource` failure (Blob Storage 500, etc.) shows a toast with the error message; the source is NOT saved locally either to prevent half-state.

### EvidenceSheet edge states

| State                           | UI                                                    |
| ------------------------------- | ----------------------------------------------------- |
| Loading (findings === null)     | Shimmer rows + "Loading findings…" text               |
| Empty (findings.length === 0)   | "No findings recorded for this item yet." placeholder |
| Load error                      | "Couldn't load findings. [Retry]"                     |
| Finding's investigation deleted | Toast + the finding row is omitted from the list      |

### Telemetry resilience

All events go through `safeTrackEvent` (existing wrapper). App Insights down → user experience unaffected.

### Strict no-PII per ADR-059

- `process_hub.state_note_added` payload: `hubId, kind, severity, lens` — NEVER the note text or author name.
- `process_hub.evidence_source_created` payload: `hubId, profileId, columnCount, rowCount, cadence` — NEVER column names, file content, or detected mappings.
- All Finding-related events use `findingStatus` (enum) — NEVER finding labels.

## Testing

### Test pyramid coverage

| Layer                                             | Tool         | File                                                                                                             | New tests                |
| ------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Pure: `ProcessStateNote` types + helpers          | vitest       | `packages/core/src/__tests__/processStateNote.test.ts`                                                           | ~5                       |
| Pure: `GENERIC_TABULAR_PROFILE`                   | vitest       | `packages/core/src/__tests__/evidenceSources.generic.test.ts`                                                    | ~8                       |
| Component: panel `notes` rendering                | vitest + RTL | `packages/ui/src/components/ProcessHubCurrentStatePanel/__tests__/ProcessHubCurrentStatePanel.test.tsx` (extend) | +5                       |
| Component: panel `evidence` async contract        | vitest + RTL | same file (extend)                                                                                               | +4                       |
| Component: `StateItemNotesDrawer`                 | vitest + RTL | `apps/azure/src/components/__tests__/StateItemNotesDrawer.test.tsx`                                              | ~7                       |
| Component: `EvidenceSheet`                        | vitest + RTL | `apps/azure/src/components/__tests__/EvidenceSheet.test.tsx`                                                     | ~6                       |
| Component: `ProcessHubEvidencePanel` generic flow | vitest + RTL | `apps/azure/src/components/__tests__/ProcessHubEvidencePanel.generic.test.tsx`                                   | ~8                       |
| Integration: Dashboard add-note + chip-load       | vitest + RTL | `apps/azure/src/pages/__tests__/Dashboard.processHub.test.tsx` (extend)                                          | +4                       |
| E2E happy paths                                   | Playwright   | `apps/azure/tests/e2e/process-hub-phase3.spec.ts`                                                                | 3 scenarios (one per PR) |

### Critical scenarios

**ProcessStateNote (core, ~5 tests):**

- All 4 kinds present in `PROCESS_STATE_NOTE_KINDS` const.
- `ProcessStateNote` interface compiles with required fields.
- Snapshot test for the kind set (catches accidental additions/removals).
- Type guard for kind validity (if needed downstream).

**`GENERIC_TABULAR_PROFILE` (core, ~8 tests):**

- Detects file with all numeric columns at confidence 1.
- Detects file with mixed columns at confidence < 1 but > 0.
- Returns null for empty file or zero numeric columns.
- `validate()` rejects zero-row snapshots; accepts otherwise.
- `apply()` is identity (returns same rows; derivedColumns from mapping).
- `detectDataProfiles()` returns generic + agent-review-log when both match.
- Confidence ordering: agent-review-log > generic for an actual review log.
- Snapshot validates structurally via existing `validateEvidenceSourceSnapshot`.

**Panel `notes` (extended panel test, +5 tests):**

- Card renders [+ note] affordance when notes prop provided.
- Click opens drawer (renders new test ID `current-state-notes-drawer`).
- `notesFor()` renders existing notes under card.
- Edit affordance shown only on notes where `note.author === currentUserId`.
- `onAddNote` fires with correct `(item, kind, text)` args.

**Panel `evidence` async (extended panel test, +4 tests):**

- `countFor` synchronous count drives chip text.
- Chip click fires `onChipClick`.
- Chip click does NOT block on `loadFindingsFor` resolution (UX is responsive).
- Replacing `findingsFor` with `countFor + loadFindingsFor` doesn't break existing tests (regression-safety for the contract change).

**`StateItemNotesDrawer` (azure, ~7 tests):**

- 4 kind buttons render with correct labels.
- Empty text disables save.
- Save fires callback then closes drawer.
- Cancel closes without firing save.
- Edit affordance loads note text into form.
- Delete fires confirm then callback.
- Esc key closes drawer.

**`EvidenceSheet` (azure, ~6 tests):**

- Returns null when item is null.
- Loading state shows shimmer when findings is null.
- Empty state shows placeholder when findings is empty array.
- Renders finding labels + statuses.
- Click finding fires `onSelectFinding`.
- Esc + close button + click-outside all fire `onClose`.

**`ProcessHubEvidencePanel` generic flow (azure, ~8 tests):**

- Upload non-review-log CSV triggers Generic Tabular profile.
- Upload review-log CSV triggers profile picker (both match).
- Mapping form pre-fills from `detectColumns()` suggestions.
- User can edit each mapping field.
- Cadence selector defaults to 'manual'.
- Save calls `saveEvidenceSource` + `saveEvidenceSnapshot` in order.
- Save failure shows toast and does NOT save locally.
- New Source appears in source list after save.

**Dashboard integration (extended, +4 tests):**

- Add note happy path: drawer → save → project mutation → reload shows note.
- Chip click happy path: chip → loading → findings → sheet → finding click → navigate.
- Telemetry assertions for `state_note_added` and `evidence_sheet_opened` events.
- Race-condition test: open chip → close → open another chip → only second findings appear.

**E2E (Playwright, 3 scenarios):**

1. **PR #1 walk:** seed hub → open Dashboard → click "+ note" on a state item → fill question kind + text → save → reload page → verify note persists with author + timestamp.
2. **PR #2 walk:** seed hub with analyzed findings → click chip → assert sheet opens with finding labels → click finding → assert URL `/editor/:id#finding-:fid` → use back button → assert Dashboard re-renders.
3. **PR #3 walk:** open Process Hub Evidence Panel → upload generic CSV → assert mapping form appears → adjust outcome column → save → assert new source appears in list with snapshot count 1.

### CI gates

- `pnpm test` (turbo) all packages green.
- `pnpm --filter @variscout/ui build` clean.
- `bash scripts/pr-ready-check.sh` green before each PR merge.
- Subagent code review per CLAUDE.md workflow + `feedback_subagent_driven_catches_bugs` memory.
- Each PR lands independently; squash-merge in sequence.

### Manual verification (`claude --chrome`)

After PR #1 merges:

- Open Azure Dashboard with seeded hub. Click "+ note" on a state item, add a Question. Reload. Verify note is still visible.

After PR #2 merges:

- Add an analyzed finding to an investigation in the seeded hub. Return to Dashboard. Click the chip. Verify the sheet shows the finding label. Click the finding. Verify navigation lands at `/editor/:id#finding-:fid`.

After PR #3 merges:

- Open ProcessHubEvidencePanel. Upload a fresh CSV (NOT an Agent Review Log). Verify Generic Tabular profile is auto-detected. Confirm the mapping form shows column dropdowns. Adjust outcome column. Save. Verify the new source appears in the source list with snapshot rowCount displayed.

## Open Questions / Future Work

1. **Note ownership across team identities.** PR #1 uses `currentUserId` from EasyAuth; in single-user local dev, `'Anonymous'` is used. Multi-user collaboration features (mentions, threads) are H3+ territory.

2. **Note search / filter.** The drawer currently shows a simple list. If hubs accumulate >50 notes, filtering by kind/author/date becomes useful — defer until usage pressure exists.

3. **Snapshot history view.** PR #3 establishes the snapshot pipeline; a UI to compare snapshot N vs N-1 (Cp-Cpk gap, sample-size warnings) is roadmap H2 second slice — deferred to its own design pass.

4. **Profile authoring outside code.** PR #3 keeps `DataProfileDefinition` instances as TypeScript. A YAML/JSON profile-as-config format with a runtime parser is an H2+ refinement; defer until customers need to author profiles without redeploying.

5. **Recurring snapshot trigger.** PR #3 stores cadence as metadata; nothing pulls or pushes snapshots automatically. The "customer-controlled export drop" mechanism mentioned in the operating model is a separate horizon slice.

6. **Cross-band evidence aggregation in `LayeredProcessView`.** This was a V2 non-goal and remains an H3 concern. Phase 3 doesn't touch the layered view.

7. **Editor honors `?intent=` and `?surface=` query params.** Standalone follow-up; `actionToHref` (PR #98) already builds the URLs. The Editor needs to read query params and route accordingly. ~50 LOC, can land any time.

8. **`linkFindingsToStateItems` synthetic-Finding cast.** PR #99 used a `as unknown as readonly Finding[]` cast for the chip count placeholders. PR #2 in this phase eliminates this entirely by switching the contract to `countFor + loadFindingsFor`.

## References

- Spec: `2026-04-27-actionable-current-process-state-panel-design.md` (parent of Phase 3 follow-ups)
- Spec: `2026-04-27-product-method-roadmap-design.md` (H1 line 144, H2 line 181)
- Spec: `2026-04-27-process-learning-operating-model-design.md` (Current Process State, Evidence Sources)
- Spec: `2026-04-26-evidence-sources-data-profiles-design.md` (PR #3 starting point)
- Spec: `2026-04-26-agent-review-log-process-hub-design.md` (PR #3 pattern reference)
- ADR-070: FRAME workspace
- ADR-072: Process Hub storage (Azure-only)
- ADR-059: Web-first deployment (no-PII telemetry)
- Memory: `feedback_no_backcompat_clean_architecture` (required props, refactor consumers in same PR)
- Memory: `feedback_roadmap_horizon_alignment` (cross-check horizons)
- Memory: `feedback_subagent_driven_catches_bugs` (per-task review discipline)
- Memory: `feedback_full_vision_spec` (spec the whole vision; let plan sequence delivery)
- Memory: `project_phase_2_v2_closure` (V2 shipped state + deferred follow-ups)
