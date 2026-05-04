---
title: 'ADR-077: Snapshot-level provenance + match-summary wedge for paste-into-existing-Hub'
audience: [product, designer, engineer, analyst]
category: architecture
status: accepted
date: 2026-05-04
related:
  - adr-073-no-statistical-rollup-across-heterogeneous-units
  - adr-074-scout-level-spanning-surface-boundary-policy
  - framing-layer-design
---

# ADR-077: Snapshot-level provenance + match-summary wedge for paste-into-existing-Hub

**Status**: Accepted

**Date**: 2026-05-04

**Supersedes**: None

**Related**:
[ADR-073](adr-073-no-statistical-rollup-across-heterogeneous-units.md) (no statistical roll-up across heterogeneous units — this ADR's per-source timeline model honors the same locality rule),
[ADR-074](adr-074-scout-level-spanning-surface-boundary-policy.md) (level-spanning boundary policy — per-row provenance lives at the store layer, not on any single surface),
[Framing Layer design](../superpowers/specs/2026-05-03-framing-layer-design.md) §7 (match-summary card), §8 (multi-source ingestion + per-row provenance)

---

## Context

The framing-layer spec §8.3 lists six per-row provenance fields — `source`, `origin`, `imported_at`, `row_timestamp`, `snapshot_id`, `join_key` — without prescribing how they are stored. A naive reading attaches all six fields inline to every data row. This creates two problems:

1. **Per-row tax on single-source pastes.** When a user pastes a single CSV (the 95% case), every row would carry `origin`, `imported_at`, and `snapshot_id` despite the fact that all rows in the snapshot share those values identically. Redundant storage, no analytical gain.

2. **No explicit user choice on paste-into-existing-Hub.** Both Azure's `useEditorDataFlow` and PWA's `usePasteImportFlow` previously called `window.confirm('Replace current data?')` — a browser native dialog with no contextual information. This afforded no classification of the paste (new snapshot vs overlap vs different source), no timeline preview, and no provenance recovery for replaced rows.

The slice 3 implementation resolves both problems as two sub-decisions.

---

## Decision

### D6 — Snapshot-level provenance with a sidecar per-row tag for joined rows only

Provenance is split into two tiers:

**Tier 1 — Snapshot-level fields (always present)**

Three fields live on `EvidenceSnapshot` in `packages/core/src/evidenceSources.ts`:

```ts
export interface EvidenceSnapshot {
  id: string;
  origin: string;              // import-id of the paste / file / Evidence Source
  importedAt: string;          // wall-clock ISO 8601 (window.crypto.randomUUID()-derived)
  rowTimestampRange?: {         // derived from the time column when present
    startISO: string;
    endISO: string;
  };
  // ... existing fields
}
```

Rows reference the snapshot via `snapshot_id` only. They do not carry `origin`, `importedAt`, or `rowTimestampRange` inline.

A standalone `SnapshotProvenance` shape (same three fields) is exported from `packages/core/src/matchSummary/provenance.ts` as a reusable type for contexts that need provenance without a full `EvidenceSnapshot`.

**Tier 2 — Per-row sidecar (multi-source joins only)**

When a confirmed multi-source join occurs — a user pastes data with a different column shape and selects a join key via the `JoinKeySuggestion` sub-card — the analysis store attaches a `RowProvenanceTag` to each joined row via a sidecar `Map<rowIndex, RowProvenanceTag>`:

```ts
export type RowProvenanceTag = {
  source: string;   // source identifier (e.g., "telemetry", "qc-inspection")
  joinKey: string;  // name of the column used to join this row
};
```

Single-source pastes pay no per-row tax. `RowProvenanceTag` is absent from the store entirely until a join occurs.

**`archiveReplacedRows` helper**

`packages/core/src/matchSummary/provenance.ts` also exports `archiveReplacedRows`, a pure function (~25 LOC) that stamps replaced rows with `__replacedBy:<importId>` using the new snapshot's `origin` field. IDs are `crypto.randomUUID()`-derived per `apps/*/CLAUDE.md` convention. Replaced rows are preserved in the store; they are not deleted.

### D9 — Match-summary card replaces `confirmReplaceIfNeeded` for paste-into-existing-Hub

When a user pastes new data into a Hub that is already complete (`isProcessHubComplete(hub) === true`), the legacy `window.confirm('Replace current data?')` dialog is replaced by the deterministic `MatchSummaryCard` from `@variscout/ui`.

The card classifies the paste along two independent axes — source (where from) and temporal (when) — via `classifyPaste` in `@variscout/core/matchSummary`. Classification is fully deterministic: no AI, no heuristics that vary with sampling.

**What the card surfaces:**

- A `TimelineWindow` horizontal strip showing existing snapshots (green), the new dataset range (blue), and any overlap region (orange). Reuses the shipped primitive from Multi-level SCOUT V1.
- A column-shape sub-summary (`suggestNodeMappings`-powered) showing matched / new / missing columns.
- Explicit action choices on block cases: `overlap` and `different-grain` do not proceed silently; the user must choose "Replace overlap / Keep both / Cancel" or "Different Hub / Aggregate first / Cancel" respectively.

**Scope of D9:**

- Applies to the paste flow in Azure (`apps/azure/src/features/data-flow/useEditorDataFlow.ts`) and PWA (`apps/pwa/src/hooks/usePasteImportFlow.ts`).
- Does **not** apply to file upload or sample-load paths — those retain `window.confirm` pending a separate UX pass (spec §17 scope note).

**Known follow-up: `existingRange` wiring**

The `overlap` temporal-axis case correctly archives replaced rows via `archiveReplacedRows` when the user clicks "Replace overlap." However, the trigger condition (`existingRange` present in `ClassifyPasteContext`) is currently always `undefined` in both wedges because neither yet pulls `rowTimestampRange` from the Hub's most-recent `EvidenceSnapshot`. The merge logic is correct and unit-tested; the call-site wiring is the follow-up. See `docs/decision-log.md` — `existingRange` wiring deferral entry (2026-05-04).

---

## Consequences

### Positive

- **ADR-073 honored.** Per-source independent timelines remain intact. Multi-source join rows carry their `source` tag via the sidecar `Map`; the analysis engine never conflates samples from different sources. The join key is the structural anchor preventing illegitimate aggregation.
- **No per-row storage tax on single-source pastes.** The 95% case is unaffected by the per-row provenance machinery.
- **Provenance is recoverable.** `archiveReplacedRows` preserves replaced rows with `__replacedBy:<importId>` rather than deleting them. Recovery requires a snapshot lookup (see "Harder" below), but the data is not lost.
- **Methodology guards active.** The `MatchSummaryCard` blocks silent merge on overlap and different-grain cases. The block cases are enforced at the data-flow layer, not just in UI copy.
- **Deterministic, auditable.** `classifyPaste` is pure TypeScript with no randomness. Classification outcomes are reproducible from inputs.

### Harder

- **Per-row provenance recovery requires snapshot lookup.** If a consumer wants the full six-field provenance for a specific row in a single-source snapshot, it must read `snapshot_id` off the row, then load the corresponding `EvidenceSnapshot` to get `origin`, `importedAt`, and `rowTimestampRange`. This is a two-step read instead of an inline field access. The cost is low in practice (snapshot count per Hub is small) but the indirection is real.
- **`existingRange` wiring is a follow-up.** The overlap-replace UI button is reachable only via deliberate fixture construction until slice 4 (or an earlier focused PR) wires `rowTimestampRange` from the active Hub's most-recent `EvidenceSnapshot` into the `classifyPaste` context. See the decision-log entry.
- **Two paste-flow call sites must stay in sync.** Azure's `useEditorDataFlow` and PWA's `usePasteImportFlow` both invoke `classifyPaste`. Changes to `ClassifyPasteContext` must be applied to both. The shared core helper is the canonical source; both wedges import it.

### Neutral

- The `EvidenceSnapshot` shape gains three fields. No migration required — existing snapshots without `rowTimestampRange` are valid (the field is optional); `origin` and `importedAt` default to the current timestamp and an empty import-id for legacy snapshots loaded from `.vrs` files created before slice 3.
- File upload and sample-load paths are unchanged. The `window.confirm` in those paths is out of scope for D9 per spec §17.

---

## Alternatives considered

**Per-row inline metadata (all six fields on every row)**

All six provenance fields attached directly to every data row. Rejected because (1) it adds storage and serialization overhead for the 95% single-source case where the values are identical across all rows, and (2) it doesn't change the semantics — consumers still need to correlate `origin` / `importedAt` values across rows to understand which snapshot they belong to, which is what the snapshot-level tier does structurally. The fact-table + dimension-table pattern is industry standard for this reason.

**Sidecar map keyed by a stable row ID instead of row index**

A `Map<rowId, RowProvenanceTag>` using a stable per-row UUID. Rejected for V1 because rows in the analysis store do not currently carry stable IDs — they are positional. Adding stable row IDs is a cross-cutting change (parser, store, serialization, tests). The row-index sidecar is correct for V1's single-import-session scope; row IDs become relevant when late-arriving data reconciliation and time-travel queries land (spec §15 V2 items).

**Retain `window.confirm` for paste-into-existing-Hub with richer copy**

Rejected. `window.confirm` is not dismissable programmatically, blocks the JS thread, is not stylable, and gives the user no contextual information about _why_ the paste is being flagged (overlap, different source, different grain). The `MatchSummaryCard` is the same amount of friction for non-block cases (a single "Add snapshot" confirmation) and materially more informative for block cases.

---

## References

- Framing layer spec §7 (match-summary card): `docs/superpowers/specs/2026-05-03-framing-layer-design.md`
- Framing layer spec §8 (multi-source ingestion + per-row provenance fields): same file
- Type definitions: `packages/core/src/evidenceSources.ts`
- `createSnapshotProvenance` factory + `archiveReplacedRows` helper: `packages/core/src/matchSummary/provenance.ts`
- `classifyPaste`: `packages/core/src/matchSummary/classifier.ts`
- `MatchSummaryCard`: `packages/ui/src/components/MatchSummaryCard/`
- Azure paste wedge: `apps/azure/src/features/data-flow/useEditorDataFlow.ts`
- PWA paste wedge: `apps/pwa/src/hooks/usePasteImportFlow.ts`

---

## Status

Accepted (2026-05-04). Delivered in slice 3 (PR #123). The `existingRange` wiring follow-up is logged in `docs/decision-log.md`.

## Supersedes / superseded by

- Supersedes: none (new decision).
- Superseded by: none (active).
- Related: ADR-073 (locality rule honored by per-source sidecar design), ADR-074 (level-spanning boundary policy — provenance lives at the store layer, not on any surface).
