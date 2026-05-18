---
title: 'FRAME b0 lightweight render (full-vision implementation)'
purpose: decide
tier: card
status: active
date: 2026-05-02
topic: ['decisions', 'supersession', 'archived', 'coscout']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# FRAME b0 lightweight render (full-vision implementation)

Locked the two-archetype FRAME model (investigator b0 vs author b1/b2). b0 renders Y/X picker via `<FrameViewB0 />`; b1/b2 unchanged. ADR-076 is the canonical decision; ADR-070 amended to cross-reference. No auto-pick, no upfront warnings, plain language with MBB jargon as hint chips. `detectScopeFromMap(map)` at `packages/core/src/scopeDetection.ts` is the dispatch point; PWA + Azure FrameView both branch on it. `rankYCandidates` heuristic (16 name patterns + variation bonus, capped) orders the Y picker but never auto-selects. `GapStrip` suppressed in b0 via `showGaps={false}` passthrough. Implementation: 11 sub-tasks across ~25 commits on `feature/full-vision-frame-b0`. _Closed 2026-05-02._ Source: [`docs/07-decisions/adr-076-frame-b0-lightweight-render.md`](07-decisions/adr-076-frame-b0-lightweight-render.md); plan and per-task review notes at `~/.claude/plans/what-is-the-new-squishy-aho.md` (Workstream 3).

- **Plan C3 (FRAME right-hand capability drawer) — superseded 2026-04-29 by FRAME thin-spot batch.** Originally scoped as a right-hand drawer in the FRAME workspace hosting the production-line-glance dashboard, live-bound to FRAME authoring state. Superseded because **CoScout monopolizes the right rail** in EditorDashboardView and InvestigationWorkspace today; staking a non-CoScout claim on FRAME's right rail would force a redesign the moment CoScout is wired into FRAME. The FRAME-mode coaching prompt at `packages/core/src/ai/prompts/coScout/phases/frame.ts` already exists; that wiring is on the roadmap. The underlying need ("live capability feedback while mapping") is real and is met instead by four surgical FRAME helpers: per-column health badges, `suggestNodeMappings` surfaced in the FRAME UI (not just the hub-migration wizard), USL/LSL inputs gaining data-range context, and `processHubId` made visible. Any future capability-preview-during-FRAME-authoring would require a _fresh_ scope (left rail? modal? slot in FRAME header?), not unblocking the existing C3 spec. Rationale captured in the morning session transcript at `~/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/708e62b5-c667-45de-9c9a-869382da2a46.jsonl` line 96. Closing artifact: amended §3 + §Sequencing of [`docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md`](superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md). _Pinned 2026-04-29._

- **W1 `processFamily` / `canAggregate` / cross-hub eligibility taxonomy — superseded 2026-04-28 by ADR-073 + W1' production-line-glance.** The patch approach (engineer a `processFamily` taxonomy, add eligibility predicates, decorate every aggregation surface with a warning checkpoint) was rejected. The structural fix (no aggregation primitive at all; visualize per-step Cpk distributions) is what shipped via PRs #103 / #105 / #106 / #107. Future sessions should not re-propose `processFamily`. Captured in narrative within [`docs/superpowers/specs/2026-04-28-production-line-glance-design.md`](superpowers/specs/2026-04-28-production-line-glance-design.md) lines 43, 47 and [`docs/superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md`](superpowers/specs/2026-04-29-investigation-scope-and-drill-semantics-design.md) lines 33, 362, 420. _Pinned 2026-04-28._

- **Teams entry experience — superseded 2026-04-29 by ADR-059 (web-first deployment architecture).** The 2026-03-22 design described a Teams-embedded entry flow. ADR-059 made VariScout web-first and removed Teams as an entry channel. The spec at `docs/superpowers/specs/2026-03-22-teams-entry-experience-design.md` is being archived to `docs/archive/specs/` as part of the same supersession pass. Source: [`docs/07-decisions/adr-059-web-first-deployment-architecture.md`](07-decisions/adr-059-web-first-deployment-architecture.md). _Pinned 2026-04-29._

- **No V1 / V2 / V3 phasing inside design specs.** Specs describe the complete vision; phasing belongs to delivery plans, not designs. A spec that pre-phases its own contents teaches future-Claude to read the V1 slice as the canonical design and forget the rest. Captured in `feedback_full_vision_spec.md`. _Pinned (long-standing)._

- **Subagent-driven development is the default execution mode.** When executing a writing-plans output, default to the `superpowers:subagent-driven-development` skill (fresh subagent per task + final code-reviewer pass); don't ask, just dispatch. Inline only for trivial / secrets-touching / exploration-only tasks. Captured in `feedback_subagent_driven_default.md`. _Pinned (long-standing)._

- **No "gate" / "gates" prescriptive framing in product, design, or doc surfaces.** Prefer _guidance_, _scaffolding_, _checkpoint_, _step_, _support_, _lens_, or _affordance_. The "gate" framing reads as restrictive and contradicts VariScout's coaching posture. Captured in `feedback_no_gates_language.md`. _Pinned (long-standing)._

- **Ruflo entries hold durable architectural facts, not ephemeral state.** Same shape as the memory-hygiene rule. Patterns, conventions, design decisions, supersession rationales belong in ruflo. PR status, test counts, sprint focus, in-flight phase do not — those go in MEMORY.md or `git`/`gh`. Ruflo entries that cite specific file paths, function names, or commit hashes are claims valid _at write time_; verify before recommending. When a referenced entity is renamed or removed, update or delete the entry. Captured in CLAUDE.md "Ruflo hygiene" section. _Pinned 2026-04-29._
