---
title: 'Phase 6 Deferred Findings'
description: '4 systemic + 2 quick-fix items surfaced during the F-6 chrome walk on 2026-04-27 and deliberately deferred. S5 (review/handoff editors unmounted in v1) gates Q1/Q2.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 02a66b41-bdd2-4766-a2df-96a4c45ba74b
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_phase_6_deferred_findings.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Phase 6 Deferred Findings

Surfaced during the F-6 chrome walk + source review on 2026-04-27, after PR #94 (`9a39a203`) shipped F-2/F-3/F-5/F-7 and the spec was promoted to `delivered` (`0949d695`). Three follow-up commits landed in the same session — `32a05b38` (helper copy fix) and `f5b1fdaa` (Q3-Q5 in `SustainmentRecordEditor`). The findings below were **deliberately not shipped** because they require either spec-author input or a broader sweep beyond Phase 6.

---

## S1 — `text-{red,amber,green}-400` used alone (light-mode contrast)

**Locations:**
- `apps/azure/src/components/ProcessHubSustainmentRegion.tsx:148,152` — Overdue (red-400)
- `apps/azure/src/components/ProcessHubSustainmentRegion.tsx:162,166` — Sustainment due (amber-400)
- `apps/azure/src/components/ProcessHubSustainmentRegion.tsx:176,180` — Recently reviewed (green-400)

**Why this matters:** the user's existing `feedback_green_400_light_contrast` rule says "Always pair with text-green-700 for label text; same for red/amber-400". Phase 6 violated the rule on icons-only paths. Light-mode contrast is unverified — the icons are the only color cue for severity, so they need to read clearly against `bg-surface`.

**Why deferred:** this is codebase-wide — Phase 6 isn't the only violator. A targeted Phase 6 patch would silence this case while leaving the systemic gap. The right fix is one of:
- ESLint rule that flags `text-{red,amber,green}-400` without a paired `-700` in the same component
- Theme-aware `<StatusIcon variant="overdue|due|ok">` wrapper that handles the pair internally
- Manual sweep + visual diff across the codebase

**Resolution path:** sweep + lint rule. Ship as a separate "tailwind contrast hardening" PR.

---

## S3 — Editor form pattern gaps repeated across 3 editors

**Locations:**
- `apps/azure/src/components/SustainmentRecordEditor.tsx` — submit-disabled state was added in `f5b1fdaa` (Q5). Other editors still missing it.
- `apps/azure/src/components/SustainmentReviewLogger.tsx:158-176` — no submit-disabled, freeform UUID inputs at `:137-144` (snapshotId) and `:151-159` (escalatedInvestigationId)
- `apps/azure/src/components/ControlHandoffEditor.tsx:31-` — no submit-disabled, no people picker for `operationalOwner` (commented as v1 simplification at `:70-73`)

**Pattern repeated across all three:** no `isSubmitting` guard on Save (double-submit risk), freeform UUID/text where a picker would be safer, and explicit "v1 simplification" comments acknowledging the gap.

**Why deferred:** band-aiding each editor inline is duplication. Two of the three editors (Logger, Handoff) aren't even mounted in v1 (see S5) — polishing them now is premature. The right fix is shared infrastructure once the wiring decision lands.

**Resolution path:** small refactor spec for `<EditorForm>` shell (handles submit-disabled + cancel guard) and `<EntityPicker>` (snapshot/investigation/participant). Build it before wiring Logger/Handoff into production. Then SustainmentRecordEditor can adopt the shell to remove its hand-rolled `isSubmitting` plumbing.

---

## S4 — Cross-section duplicate render in sustainment region

**Locations:**
- `apps/azure/src/components/ProcessHubSustainmentRegion.tsx:87-104` — `selectSustainmentBuckets()` and `selectControlHandoffCandidates()` are called independently
- `packages/core/src/sustainment.ts:236-281` — `selectSustainmentBuckets` (does not exclude controlled-without-handoff)
- `packages/core/src/sustainment.ts:288-299` — `selectControlHandoffCandidates` (filters status=controlled AND no handoff)

**The quirk:** an investigation with status=`controlled` + has-record + no-handoff appears in BOTH the bucket section (Sustainment due / Overdue / Recently reviewed) AND the Control handoff section. F-2 narrowed scope from the legacy `cadence.sustainment.items` path but cross-section duplication in the new region is still real.

**Why deferred:** this is a **design question**, not a code bug. The same investigation legitimately has two pending actions (a review is due AND a handoff needs recording). Surfacing it twice is correct in a literal sense; the question is whether UX should consolidate.

**Resolution path:** spec author input. Options:
1. One row with two affordances ("Log review" + "Record handoff" buttons side-by-side) — preserves both actions, reduces row count
2. Prioritize one action (e.g., handoff first since it's the path to leaving the queue) — simpler but loses the review reminder
3. Status quo (two rows) — clearer separation per action, but visually duplicates

Adjacent to spec open-question #3 (multi-investigation control). May fold into the same follow-up spec.

---

## S5 — `SustainmentReviewLogger` + `ControlHandoffEditor` are tested but unmounted in v1

**Locations:**
- `apps/azure/src/components/SustainmentReviewLogger.tsx` — defined, fully tested in `__tests__/SustainmentEditors.test.tsx`, **zero production mounts**
- `apps/azure/src/components/ControlHandoffEditor.tsx` — same pattern: defined, tested, zero production mounts
- `apps/azure/src/pages/Editor.sustainment.tsx:64-82` — only mounts `SustainmentRecordEditor` (the cadence editor)
- `apps/azure/src/pages/Dashboard.tsx:200-220` — `handleSetupSustainment` / `handleLogReview` / `handleRecordHandoff` all just call `onOpenProject(...)` — they navigate to the editor, but the editor doesn't actually surface review-logging or handoff-recording forms

**The gap:** the spec's Flow B (log review), Flow C (drifting + escalate), and Flow D (record handoff) **literally cannot be executed by a real user yet**. The components exist as code + tests; they have no UI surface. Memory previously called this out indirectly: "Dashboard sustainment-region clicks navigate to Editor (no in-Dashboard popover state). Editor is v1 management surface" — but the Editor doesn't have those popovers either.

**Why deferred:** this is the biggest single decision blocking Phase 6 v2. Wiring requires either:
1. Extending `Editor.sustainment.tsx` with two new entry rows (Log review / Record handoff) that mount the existing editors
2. Building popover state in Dashboard so clicks open the editors inline (the spec implies this)
3. Documenting them as v2 surfaces and removing the implicit promise the tests carry

**Resolution path:** spec author decision + a small wiring PR. Without it, memory `variscout/phase-6-delivered` is technically true (spec contract met) but functionally misleading (two of four user flows are unreachable).

**Severity:** material. The cadence walks describe a workflow users cannot complete.

---

## Q1 — Conditional escalation field by verdict (deferred — depends on S5)

**Location:** `apps/azure/src/components/SustainmentReviewLogger.tsx:147-160`

**Fix:** "Escalated investigation ID" field renders unconditionally — even for `holding` verdicts where escalation is meaningless. Hide for `holding`, highlight/require for `broken`. Replace freeform UUID input with a dropdown of existing investigations or a "Create new investigation" button.

**Why deferred:** Logger isn't mounted (S5). Polishing dead code is wasted effort until the wiring decision lands and the field's exact UX requirements crystallize.

---

## Q2 — Snapshot picker instead of UUID textbox (deferred — depends on S5)

**Location:** `apps/azure/src/components/SustainmentReviewLogger.tsx:137-144`

**Fix:** today the field auto-fills `latestSnapshotId` but renders as a freeform text input — user can't see which snapshot they're referencing. Replace with dropdown showing recent snapshots (severity / label / capture date).

**Why deferred:** same as Q1 — Logger isn't mounted (S5). Also: when S5 is resolved, the snapshot picker should likely live in the shared `<EntityPicker>` from S3, not as a one-off input here.

---

## Cross-references

- **Already tracked, do not duplicate here:**
  - i18n debt across the entire azure app — see `project_process_hub.md` "DEFERRED: full apps/azure i18n sweep"
  - The 6 spec open questions (cadence anchor, reopen semantics, multi-investigation control, CoScout proactivity, handoff surfaces enum, retention/PII) — see `docs/superpowers/specs/2026-04-26-phase-6-sustainment-control-handoff-design.md:554-582`

- **Sibling memory:** `variscout/phase-6-delivered` (ruflo) records the F-6 verification breakdown.

- **Shipped during the same session, no follow-up needed:**
  - `0949d695` — spec promoted to `delivered`
  - `32a05b38` — disabled-prompt helper copy fix
  - `f5b1fdaa` — Q3 (auto-suggest nextReviewDue) + Q4 (date min) + Q5 (submit-disabled) in `SustainmentRecordEditor` + 6 new tests
