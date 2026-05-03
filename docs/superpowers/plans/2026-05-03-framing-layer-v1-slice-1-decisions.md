---
title: Framing Layer V1 Slice 1 — Locked Decisions
audience: [engineer]
category: implementation
status: draft
date: 2026-05-03
related:
  - docs/superpowers/plans/2026-05-03-framing-layer-v1-slice-1.md
  - docs/superpowers/specs/2026-05-03-framing-layer-design.md
---

# Locked Decisions — Slice 1

## D1. AnalysisBrief vs new types

The existing `AnalysisBrief` interface in `packages/ui/src/components/ColumnMapping/index.tsx`
sketched issue/questions/targetMetric but is unused today. **Decision:** do NOT extend
AnalysisBrief. Create a clean `OutcomeSpec` type on `ProcessHub`. AnalysisBrief stays in
its current sketched form for slice 5 (Stage 5 investigation entry); slice 1 leaves it
alone. Reason: the framing-layer spec separates Hub-level (durable: outcomes + specs)
from investigation-level (episodic: issue + question); conflating into AnalysisBrief
re-merges what the spec just split.

## D2. PWA persistence is OPT-IN per Q8-revised

PWA persists ONLY after the user clicks "Save to this browser." Default is session-only
(matches today's behavior). The Dexie schema is loaded post-opt-in only. The opt-in flag
itself is stored in IndexedDB (a tiny `meta` record) so subsequent sessions know whether
to auto-load. `.vrs` import/export is always available regardless of the opt-in flag.
Reason: Q8-revised Option 4 — explicit user consent; trainers / privacy-conscious users
can use file-only persistence; demo users skip persistence entirely.

## D3. Multi-outcome validation

`validateData()` today validates one outcome column. Slice 1 supports multiple outcomes
per Hub (`OutcomeSpec[]`). Refactor `validateData()` to take `outcomeColumns: string[]`
and produce a per-outcome quality report. Backward-compatible single-outcome call site
in dashboard / analysis can wrap with `validateData(data, [singleOutcome])` and unwrap
the first entry. Reason: V1 supports multiple outcomes per spec §3.2.

## D4. Goal-context biasing — keyword extraction is deterministic

`detectColumns()` gains an optional `goalContext: string` parameter. Implementation:
extract content words from the goal narrative (lowercase, drop stopwords using
`packages/core/src/parser/stopwords.ts` — create if missing); compute outcome candidate
keyword-match score = max(token overlap with column name lowercased + token overlap
with column-name's underscore-split parts). Bias is additive on top of the existing
keyword-detection score; no replacement. Reason: deterministic per Q5 (no AI in V1);
existing detection logic preserved.

## D5. Mode A.1 reopen UX (PWA)

PWA Mode A.1 reopen path: on app load, check if `hubRepository.getOptInFlag()` is true.
If true: load saved Hub via `hubRepository.loadHub()` and render canvas with restored
state. If false: render `HomeScreen` (existing flow). No "Hub list" UI in PWA — single
Hub-of-one constraint per Q8. User can clear via "Forget this browser" affordance
(separate task — not in slice 1; user can clear browser storage manually until then).
Reason: Q8 + minimal slice 1 surface area.
