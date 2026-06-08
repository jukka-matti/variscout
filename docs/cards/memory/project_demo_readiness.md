---
title: 'demo-readiness'
description: 'Demo-readiness initiative (2026-06-07) — FSJ-10 gate walk findings, the Analyze/Wall legibility spec (D1-D7), the umbrella master plan, and the Codex full-loop dispatch protocol v2'
purpose: remember
tier: card
status: active
date: 2026-06-08
topic: [memory, project]
related: []
verified-against-commit: 027927efe
last-verified: 2026-06-08
source-hash: 700d80ea22b1f40b
origin-session-id: 097c084b-533f-473f-bb3e-240b0e83a734
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_demo_readiness.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**Demo-readiness initiative — spec + master plan DELIVERED 2026-06-07** (one session: collaborative chrome walk → findings write-up → design brainstorm w/ visual companion → 4-reader grounding workflow + adversarial review → spec → plans). Delivery state = `gh pr list` + `docs/superpowers/plans/2026-06-07-demo-readiness-master-plan.md`, never here.

**The walk** (FSJ-10 gate, owner-in-the-loop, PWA): spine works end-to-end; **FAIL cluster root-caused to ONE regex** — `yLikelihood.ts:28` `.*time$` excludes CycleTime/LeadTime/Downtime from Y candidacy (manual pick validates against the same empty ranked set → silent no-op; wizard fix never propagates). 11 investigations entries + a design-session input list on main (`f5c1b2823`). Method: owner live-flagging during the walk produced the design agenda; "have you checked the overall wall design?" caught a phantom-surface rationale — **grounding corrected priors 3+ times in one session**.

**The legibility spec** (`docs/superpowers/specs/2026-06-07-analyze-wall-legibility-design.md`, wireframes `suspected-cause-card` + `causes-matrix`): calibration = first-session user, zero training. Durable discoveries:
- **D1**: 5-state `HypothesisStatus` is presentation-mapped to **Suspected / Supported / Ruled out** (owner PR #333 2026-06-08 renamed the confirmed-state display Verified→**Supported**, the established Wall brand term; single shared helper `findings/hypothesisStatusDisplay.ts`) — the stored enum is FENCED (Azure serializer hard-throws unknown statuses, "no backward compatibility"; Report groups on all 5; ADR-090). Internal rungs become card FACTS, not taught states.
- **D2**: the triangulated-evidence model was **~70% built and dead** — `FindingEvidenceType` (data/gemba/expert) + the breadth-AND-survived rule (`survey/wall.ts:37-48`) ship, but `createFinding` hard-defaults `'data'` with no setter anywhere. L-1 = the picker that revives it.
- **D3**: "Suspected cause" = user label (P5-approved, LSS-native: suspected→verified/eliminated cause-verification-matrix model); `Hypothesis` stays the entity; 2 hub-name minters say "mechanism" and reach Report verbatim (PWA `AnalyzeView:323,328` + Azure `AnalyzeWorkspace:946,950`).
- **D4**: the causes matrix IS ADR-086's "ACH matrix lens" (not a new taxonomy); `viewMode` union is closed `'map'|'wall'` — widening touches serializer snapshot `:293/316`. Map slot interim pending the logged Evidence-Map-survival question.
- **D5**: Wall fit-to-content is NET-NEW (onFit/onSnapRiver are unwired keyboard stubs; no bbox math for the populated Wall; cold-start crop is zero-hub-only) — the microscopic-Wall demo blocker. Snap-river deferred.
- **D6**: activity layer — run-now checks are BUTTONS never plans; in-flight = collection only (MeasurementPlan = DCP loop); stalled = checks exhausted + nothing collecting + 5d quiet.
- **D7**: Diverging chip retires; `AnalyzePhase` survives as CoScout's compass (derives from FindingStatus only — decoupled; 5 badge mounts; lifecycle-map doc guarded by check-diagram-health).
- River-roots Wall spec is `active` but pervasively stale (Question pills, SuspectedCause naming, never-built right rail) — re-status at delivery.

**Build order**: L-1 picker → L-2 display/vocabulary → L-4 fit → L-3 activity → L-5 matrix; then Phase 2P (CS-P1…P5) + CS-14 per the CS master plan. Threaded: FSJ closeout+retro, walk polish cluster, dependabot.

**Dispatch protocol v2** (amended 2026-06-08): Codex app full loop incl. MERGE + browser-verification gate — see [[codex-implements-claude-orchestrates]]. Variant A = pre-authored sub-plan; Variant B = Codex authors its own sub-plan then **builds straight through (the plan-review STOP was RETIRED — it had been a no-op since the FSJ trial; owner merges each phase with a single "done")**. Orchestrator rule: check `gh pr list` before dispatching (the CS-P1 re-run misfire came from trusting a plan-file's existence over PR state).

**Analyze Wall REDESIGN — design + master plan DELIVERED 2026-06-08** (spec `docs/superpowers/specs/2026-06-08-analyze-wall-redesign-design.md`; plan `docs/superpowers/plans/2026-06-08-analyze-wall-redesign-master-plan.md` — **AW-1…AW-9 + AW-DOC, 5 phases**). The *visual-composition + methodology* layer ON TOP of the legibility L-series; emerged from an owner↔Codex Miro-benchmark conversation then a fresh-session convergence. **Principles LOCKED**: canvas-first ("Miro *feel*, not a Miro board"; ≥~80% viewport = canvas) · methodology-first (Issue→ProblemStatementScope WHERE→Hypotheses WHY→Findings/tests/plans→Improve) · **no-CoScout-first** · **dual-entry** (finding-first + hypothesis-first 3-way Check-it/Link-finding/Plan-evidence) · **object-collaboration** (no chat layer; roles lead|member|sponsor; no approval gates) · **Wall + Causes lenses, Map DEMOTED** (Evidence Map lands on the Wall, AW-4) · **two-drawer model** (left object-detail no-AI = AW-7; right CoScout slot = AW-8, content=CS-14) · **3-state status Suspected/Supported/Ruled out**. **OWNER REVERSAL: current-scope, NOT lineage** — the scope-lineage trail is DROPPED (AW-6 = current scope + switcher); lineage *metadata* (`parentScopeId`/`createdFrom`) survives only as an optional additive type (only `explore-drill` has a live writer), not a build target. **L-4 IS a confirmed gap** (Codex was right Fit didn't fix default scale) → AW-1 fixes it. Entity model grounded: Issue (`AnalysisBrief.issueStatement`)→Problem statement (`buildProblemStatement`)→many ProblemStatementScopes; **Finding=connective tissue, 1 scope:N findings, wire `Finding.scopeId`** (AW-5). **Demo-minimum = Phase 1 (AW-1 readable scale → AW-2 canvas-first chrome → AW-3 legible gates) + AW-4 (lens demote).** **EXECUTION = Codex v2 full-loop** (owner 2026-06-08), one PR in flight, order AW-1→2→3→4 (demo-min) → AW-5/6/7/8/9 → AW-DOC. Per-PR Codex prompts were authored 2026-06-08 (this session) — re-derive from each master-plan AW-N section if lost. AW-2 = Opus (largest; cherry-picks `OverallProblemHeader` from #336, mounts BOTH apps); AW-9 unblocked (CS-15 merged #338); AW-5 has no dep. **Prototype PR #336** (`codex/analyze-wall-scope-lineage`, DRAFT) = **cherry-pick source, never merge wholesale**: AW-2 takes the header, AW-9 the categorical Explore handoff, AW-6 reframes `ScopeRail` (lineage→switcher); **close #336 after AW-2+AW-9 land**. **Process-tab Codex chain COMPLETE/near**: CS-P4 #335, CS-P5 #337, CS-15 #338 merged; CS-P3 last (in flight). **Owed once CS-P3 lands**: batched post-merge review (b0+L-series+CS-P) + the deferred end-to-end demo walk + the FSJ END-of-plan retro (= the Codex-trial retro). Delivery state = `gh pr list` + the two master plans, never here.

Related: [[first-session-journey]], [[connective-surface-redesign]], [[investigation-model-design]].
