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
| 2   | **L-2 display states + vocabulary** | [L-2 sub-plan](2026-06-07-l2-display-states-vocabulary.md) (spec §2/§3/§8; includes D7 chip retirement)                                            | No "Mechanism Branch"/"Proposed" anywhere user-facing; serializer round-trip untouched     |
| 3   | **L-4 Wall fit-to-content**         | Sub-plan at dispatch (spec §7)                                                                                                                     | Cold-start Wall fills the viewport on the walk scenario; `F`/⌖ recenters                   |
| 4   | **L-3 activity layer**              | [L-3 sub-plan](2026-06-07-l3-activity-layer.md) (spec §5; depends L-1)                                                                             | Stalled card renders for a quiet unsettled cause; paste→plan-complete loop chrome-verified |
| 5   | **L-5 causes matrix**               | Sub-plan at dispatch (spec §6; depends L-1+L-2)                                                                                                    | Matrix renders all causes; row click focuses Wall card; digest line correct                |
| 6   | **Phase 2P: CS-P1…P5** + **CS-14**  | [CS master plan](2026-06-02-connective-surface-model-master-plan.md) (canonical home)                                                              | Per that plan's gates                                                                      |
| —   | **Threaded, not serialized:**       |                                                                                                                                                    |                                                                                            |
| T1  | FSJ delivery closeout + retro       | [FSJ master plan](2026-06-06-first-session-journey-master-plan.md) §Delivery-closeout                                                              | Apply-phase docs landed; retro covers the Codex-trial verdict                              |
| T2  | Walk polish cluster                 | investigations.md entries [LOGGED 2026-06-07]: contrast/ghosting · note "E—" truncation · finding-card n · Cpk-no-specs · wizard restyle-or-retire | One polish PR (or fold items into adjacent L-PRs where the file is already open)           |
| T3  | Dependabot PRs #309–311             | `gh pr list`                                                                                                                                       | CI green → merge                                                                           |

**Ordering rationale:** L-1 first (unblocks L-3/L-5 and is the smallest; proves the Codex-app loop on a well-bounded contract). L-2 and L-4 are independent of everything — they can interleave if a second lane opens, but default is one phase in flight. Phase 2P starts when the L-series demo gate passes (or earlier if the owner wants parallel lanes — the streams share no files except i18n catalogs, which merge cleanly).

**STATUS 2026-06-08:** Phase 0 (b0, PR #327) + the entire **L-series delivered** — L-1 #328, L-2 #329, L-4 #330, L-3 #331, L-5 #332. **Owner call: move straight to Phase 2P; defer the full demo-readiness gate walk to the END of the master plan** (one comprehensive first-session→matrix walk after Phase 2P, instead of per-phase walks now). Per-phase browser gates still ran inside each PR. Batched post-merge review of b0+L-series + the deferred walk = end-of-plan, alongside the FSJ retro (T1).

**Phase 2P progress (2026-06-08):** CS-P1 #289 (runway) + **CS-P2 #334** (per-step boxplot, the first bar item) delivered. Owner-status-rename PR #333 (Verified→Supported) folded into the L-series vocabulary; spec amended.

**The Codex build chain to finish the Process-tab demo bar (sequential, full-autonomy, one in flight):**

| Step | PR                                              | Depends on                                      | Needs design?                                                                    | Note                                                                                                                                                                                                                                |
| ---- | ----------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **CS-P4** cycle-time viz + bottleneck (Azure)   | CS-P2 ✅                                        | no — Sonnet build                                                                | wires shipped `computeOutputRate`/`computeBottleneck` to a time axis on the CS-P2 surface                                                                                                                                           |
| 2    | **CS-P5** per-step view → PWA parity            | CS-P4 (so it ports capability+time in one pass) | no — Sonnet build                                                                | reuse the shared `*Base` components; ~50-line PWA wiring                                                                                                                                                                            |
| 3    | **CS-15** framing-on-load refinement (surgical) | Phase 1 ✅                                      | **no — Opus build** (preserve 6 seams + retire `ProcessMapBase`; not greenfield) | `ProcessMapBase` lives in `Canvas/internal/` + consumed by `CanvasWorkspace`/`Canvas/index`/`StepDefectIndicator`/`canvasStore`                                                                                                     |
| 4    | **CS-P3** per-step spec-authoring at framing    | CS-15 (the framing UI it rides) + CS-P2         | no — Opus build                                                                  | adds canvasStore `setCapabilityScope`/`editCapabilityScope` → `capabilityScope.specRules` (`packages/core/src/frame/types.ts`); engine `calculateNodeCapability` (`stats/nodeCapability.ts`) already consumes them; respect ADR-087 |

This chain runs entirely on Codex (Variant B per-step). **In parallel, the owner + Claude run the design sessions** — different surfaces, no code conflict.

**Design-session track (revised 2026-06-08):** the **Analyze Wall redesign** jumped the queue ahead of Project-tab — it's the demo centerpiece (Model B) and the owner kept returning to the Miro feel. Design captured in [`2026-06-08-analyze-wall-redesign-design.md`](../specs/2026-06-08-analyze-wall-redesign-design.md): principles **LOCKED** (methodology-first · no-CoScout-first · dual-entry · object-collaboration · scope-lineage-not-recursion · Miro-class composition); **three concepts OPEN** (owner convergence pending a visual-companion session); a **first prototype slice committed** (`codex/analyze-wall-scope-lineage` @ `19fa7397e`, unpushed — Codex gh-token blocker; push as prototype PR, do NOT merge until the concept choice lands). Then the remaining sessions: **Project tab → Home → #12 → CoScout-last** (CS-14 designed/built LAST, after every surface it interprets is stable). ⚠️ Verify the **L-4 default-scale** claim (Codex: "Fit didn't materially improve default scale") — candidate L-4 gap, top of the batched post-merge review.

## Codex-app dispatch protocol (per phase)

Two variants; the sub-plan is the contract either way. **Owner call 2026-06-07: the Codex app owns the full loop — implement, verify (incl. browser where the gate is user-facing), and MERGE.** Claude's review moves post-merge (async, non-blocking; drive-by fixes to main).

**Self-merge gates (every phase, no exceptions):**

1. `bash scripts/pr-ready-check.sh` green (full turbo test + build — Codex runs this itself before merging; the <90s implementer-loop rule applies only mid-task).
2. **Browser verification of the phase gate** where the gate is user-facing (the Gate column in §Sequence): drive the dev app (`pnpm dev`, or the Azure app where the phase touches it) with the repo's Playwright infra (`apps/azure/e2e/helpers.ts` patterns) or a scripted check, and capture the evidence (screenshot/trace) in the PR body. Engine-only phases (e.g. parts of phase 0) may gate on the integration tests instead — say so in the PR.
3. Merge with `gh pr merge --merge --delete-branch` (never `--squash` — per-commit history is load-bearing).

**Variant A — pre-authored contract** (phases 0–1: the b0 fix plan + the L-1 sub-plan already exist): prompt points Codex at AGENTS.md + the sub-plan path + the self-merge gates.

**Variant B — Codex authors the contract AND runs it** (phases L-2…L-5, CS-series, beyond): **Task 0: ground (read the cited anchors in code — the plan stack drifts, so verify against current main, not older plan prose), author the sub-plan to `docs/superpowers/plans/`, commit it** — then **proceed straight to implementation** (no owner/Claude plan-review stop). Full autonomy: ground → plan → build → self-merge gates → merge. The plan-review STOP was retired 2026-06-08 (owner call) — it had been a no-op since the FSJ trial; the contract's independence is preserved by Task-0 grounding + post-merge review, not by a blocking gate. Format exemplar: [the L-1 sub-plan](2026-06-07-l1-evidence-angle-picker.md).

**Post-merge (Claude, async):** subagent code review of the merged diff + a chrome spot-walk; findings land as drive-by fixes on main or investigations.md entries. Retro line item per phase: post-merge-fix count — the trial metric. Higher-stakes phases (design-heavy / demo-bar, e.g. CS-P2) lean harder on the self-authored-plan quality + the owner browser gate; the post-merge review for those should read the self-authored sub-plan against the spec to catch any misread.

## Done means

- The first-session walk replayed end-to-end with zero FAIL-grade findings (b0 fixed, Wall legible + fitted, causes scannable).
- A first-session user can: paste → see CycleTime ranked → capture across three evidence angles → watch the Verified chip earn itself → scan the matrix → read "what's in flight".
- Phase 2P + CS-14 delivered per the CS plan's own gates.
