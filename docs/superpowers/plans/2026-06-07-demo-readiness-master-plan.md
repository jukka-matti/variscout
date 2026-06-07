---
tier: ephemeral
purpose: build
title: 'Demo-readiness master plan — b0 rescue · Wall legibility · Process tab · CoScout'
status: active
date: 2026-06-07
layer: spec
related:
  - docs/superpowers/specs/2026-06-07-analyze-wall-legibility-design.md
  - docs/superpowers/plans/2026-06-02-connective-surface-model-master-plan.md
  - docs/superpowers/plans/2026-06-06-first-session-journey-master-plan.md
  - docs/superpowers/plans/2026-06-07-b0-y-candidate-fix.md
  - docs/superpowers/plans/2026-06-07-l1-evidence-angle-picker.md
---

# Demo-Readiness Master Plan

> **For agentic workers:** This is a SEQUENCING umbrella. Each PR runs the hybrid mode (Codex implements / Claude orchestrates): grounded sub-plan = the contract → Codex app or `codex exec` in its own `.worktrees/<branch>/` → stop-line = PR opened → Claude reviews, chrome-walks, merges. One phase in flight at a time.

**Goal:** Reach the customer-demo bar — Model B (Analyze/Wall) legible + ergonomic, the Process-tab per-step capability view, the first-session journey unbroken — by sequencing four workstreams that each have their own canonical home.

**The demo bar** (connective-surface spec): Model B + the Process-tab per-step capability view. This plan adds the walk-driven legibility layer to Model B and threads the closeouts.

**SSOT discipline:** CS-series PRs stay homed in the [connective-surface master plan](2026-06-02-connective-surface-model-master-plan.md); FSJ closeout in the [first-session-journey master plan](2026-06-06-first-session-journey-master-plan.md). This doc owns only the **L-series** (Wall legibility) + the cross-stream sequence. Delivery state = `gh pr list` + the per-stream plans, never memory.

---

## Sequence

| #   | Phase                               | Home / contract                                                                                                                                    | Gate                                                                                       |
| --- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 0   | **b0 Y-candidate rescue**           | [b0 fix plan](2026-06-07-b0-y-candidate-fix.md) — Codex in flight (`fix/b0-y-candidate-rescue`)                                                    | PR review + chrome replay of the walk dataset (CycleTime ranks; manual pick works)         |
| 1   | **L-1 evidence-angle picker**       | [L-1 sub-plan](2026-06-07-l1-evidence-angle-picker.md) — **the first Codex-app dispatch**                                                          | Breadth rule observable live: a gemba finding + a data finding → Verified chip fires       |
| 2   | **L-2 display states + vocabulary** | Sub-plan authored at dispatch (spec §2/§3/§8; includes D7 chip retirement)                                                                         | No "Mechanism Branch"/"Proposed" anywhere user-facing; serializer round-trip untouched     |
| 3   | **L-4 Wall fit-to-content**         | Sub-plan at dispatch (spec §7)                                                                                                                     | Cold-start Wall fills the viewport on the walk scenario; `F`/⌖ recenters                   |
| 4   | **L-3 activity layer**              | Sub-plan at dispatch (spec §5; depends L-1)                                                                                                        | Stalled card renders for a quiet unsettled cause; paste→plan-complete loop chrome-verified |
| 5   | **L-5 causes matrix**               | Sub-plan at dispatch (spec §6; depends L-1+L-2)                                                                                                    | Matrix renders all causes; row click focuses Wall card; digest line correct                |
| 6   | **Phase 2P: CS-P1…P5** + **CS-14**  | [CS master plan](2026-06-02-connective-surface-model-master-plan.md) (canonical home)                                                              | Per that plan's gates                                                                      |
| —   | **Threaded, not serialized:**       |                                                                                                                                                    |                                                                                            |
| T1  | FSJ delivery closeout + retro       | [FSJ master plan](2026-06-06-first-session-journey-master-plan.md) §Delivery-closeout                                                              | Apply-phase docs landed; retro covers the Codex-trial verdict                              |
| T2  | Walk polish cluster                 | investigations.md entries [LOGGED 2026-06-07]: contrast/ghosting · note "E—" truncation · finding-card n · Cpk-no-specs · wizard restyle-or-retire | One polish PR (or fold items into adjacent L-PRs where the file is already open)           |
| T3  | Dependabot PRs #309–311             | `gh pr list`                                                                                                                                       | CI green → merge                                                                           |

**Ordering rationale:** L-1 first (unblocks L-3/L-5 and is the smallest; proves the Codex-app loop on a well-bounded contract). L-2 and L-4 are independent of everything — they can interleave if a second lane opens, but default is one phase in flight. Phase 2P starts when the L-series demo gate passes (or earlier if the owner wants parallel lanes — the streams share no files except i18n catalogs, which merge cleanly).

## Codex-app dispatch protocol (per phase)

1. Claude authors/refreshes the grounded sub-plan → commits to main.
2. Owner opens the Codex app on a fresh branch `feat/<phase>` (own worktree if local).
3. The prompt: point Codex at AGENTS.md + the sub-plan path + the stop-line (PR opened, never merge). First prompt template: see L-1 sub-plan §Codex-prompt.
4. PR opened → Claude: subagent code review + chrome walk against the phase gate → merge `--merge --delete-branch`.
5. Retro line item per phase: review-fix count (the trial metric).

## Done means

- The first-session walk replayed end-to-end with zero FAIL-grade findings (b0 fixed, Wall legible + fitted, causes scannable).
- A first-session user can: paste → see CycleTime ranked → capture across three evidence angles → watch the Verified chip earn itself → scan the matrix → read "what's in flight".
- Phase 2P + CS-14 delivered per the CS plan's own gates.
