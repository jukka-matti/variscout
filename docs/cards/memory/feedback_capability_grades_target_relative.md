---
title: 'Capability grades are target-relative'
description: 'VariScout grades Cpk via a single function (gradeCpk) relative to a per-characteristic user-set target, not the canonical literature thresholds (1.67/1.33/1.00). Source of truth lives in @variscout/core/capability.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: a936ed15da3bcab6
origin-session-id: 39f5fb0c-cf47-4d4e-a5e2-9b4b414f59bf
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_capability_grades_target_relative.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**VariScout grades Cpk via a single unified function (`gradeCpk` in `@variscout/core/capability`) relative to a user-set, per-characteristic Cpk target.** The default fallback is `1.33`, but the target is per-column and resolved via a cascade (per-column spec → hub → investigation → 1.33) by `resolveCpkTarget`.

**The single rule:** green if `cpk ≥ target`; amber if `cpk ≥ target × 0.75`; red otherwise. Every banding surface calls `gradeCpk` — `processMoments.statusForCpk`, `ReportKPIGrid.getCpkColor`, `ReportCapabilityKPIGrid.getCpkColor`, `ReportPerformanceKPIGrid.getCpkColor`, `ProcessHealthBar.cpkColor`. There are no per-surface variants. The previous absolute `< 1.0` red floor in the Report KPI / ProcessHealthBar surfaces was deleted in Phase A of the per-characteristic Cpk targets work.

**Why target × 0.75 (not absolute 1.0):** the user-set target IS the abstraction for "what capable means for this characteristic." Hardcoding 1.0 reintroduces literature absolutes the target was supposed to replace, and it breaks for industries whose target is far from 1.33 (e.g. Class III medical = 2.0+, where amber would otherwise span an enormous range, or commodity assembly with target = 1.0 where the amber band would collapse to nothing).

**Why per-characteristic at all:** AIAG, AS9100, ISO 13485, JMP, Minitab — every serious framework treats target capability as per-characteristic, with different bars for critical / major / minor characteristics within the same investigation. A FRAME node mapping 3-10 measurement columns to one process step naturally needs each column's own bar.

**How to apply:** When writing or reviewing any doc / banding code that grades Cpk, read `gradeCpk` first — it's the only rule. Frame bands as relative to target with the default explicit. If you're tempted to write "Cpk ≥ 1.67 = excellent" or import `getCpkColor` from a surface, stop and use `gradeCpk` with a properly-resolved target. For target resolution, use `resolveCpkTarget(column, ctx)` rather than reading any single level directly.

**Provenance is now visible:** `resolveCpkTarget` returns `{ value, source }` where `source` is `'spec' | 'hub' | 'investigation' | 'default'`. Banding chrome surfaces (`ProcessHealthBar`, `ReportKPIGrid`, `ReportCapabilityKPIGrid`, `ReportPerformanceKPIGrid`) render a small caption — `sourceLabelFor(source)` → `"per-spec"` / `"hub default"` / `"investigation default"` / `"default"` — next to the displayed target so users can see which cascade level produced each color. Chart reference lines and FindingCard footers are deliberately out of scope. When refactoring callers, destructure as `const { value: cpkTarget } = resolveCpkTarget(...)`; there is no number-returning back-compat shim.
