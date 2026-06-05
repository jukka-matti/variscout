---
title: 'project-doc-alignment-initiative'
description: 'The 6-wave documentation-alignment initiative (delivered 2026-06-02) + the reusable ground→author→review pattern and the audits-over-flag lesson'
purpose: remember
tier: card
status: active
date: 2026-06-05
topic: [memory, project]
related: []
verified-against-commit: 7712f1edb
last-verified: 2026-06-05
source-hash: e9569f094fe73910
origin-session-id: d7b5f55a-73f4-473f-8bac-b5fbd14d238b
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_doc_alignment_initiative.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

The **documentation-alignment initiative** (delivered 2026-06-02, `main` commits `0b0d4cc0`…`c289d920`) brought the shipped V1 surface into a coherent, current, single-canonical-home state. Triggered by "is the documentation done?" → a grounded audit found the shipped surface was **~1-in-6 documented** (57 capabilities). Root cause = the SDD **Apply phase** is systematically skipped (specs ship `delivered`, their `implements:` docs never written).

Canonical artifacts (all in git): spec `docs/superpowers/specs/2026-06-02-documentation-alignment-design.md`; tracker `docs/superpowers/plans/2026-06-02-doc-alignment-master-plan.md`; `decision-log.md` 2026-06-02 (completion + **R-series freeze LIFTED**); `investigations.md` "Doc + user-journey alignment" `[RESOLVED 2026-06-02]`. Net-new docs: `investigation-surface`, `findings-hypotheses`, `collaboration`, `save-and-load`, `home`, `report` + L4 `app-feature-factories-pattern`, `persistence-internals`. Shipped the **Apply-phase validator sensor** (`scripts/apply-phase-sensor.mjs` — WARNs on a `status:delivered` spec whose `implements:` targets lack a fresh `last-verified`) so the backlog can't silently recur.

**Reusable process (worked across all 6 waves):** per wave, **ground (parallel subagents read specs+code → distilled facts) → author (single-implementer, for cross-doc coherence + serialized commits) → adversarial review (subagent verifies docs vs code)**. See [[feedback_subagent_grounding_catches_drift]].

**Load-bearing lesson — multi-agent coverage audits OVER-FLAG; ground against actual code before acting.** The original 57-capability audit repeatedly called docs "stale" that grounding then verified accurate (the data stubs, the Process/Project/Measurement-Plan refresh docs, the role×tab ACL matrix it said to "collapse"). And it asserted "Home owns the active-IP cascade" — code showed it originates on Dashboard/Improve. **Why:** read-only audits infer from prose + stale ADRs; grounded re-reads catch it. **How to apply:** treat audit "stale/missing" verdicts as *candidates*, not facts — re-ground each against code before editing; expect ~half to be over-flagged.

**The adversarial review earns its keep** — it caught real errors a green doc-gate cannot: the PWA-has-no-PDF claim (code had `window.print()`), 7-vs-8 `ReportSectionId`s, a non-existent `createAction`, a 100/200/400 vs 100/200ms ETag backoff. Several traced to a grounding agent trusting a stale ADR over code. Always run the review before declaring a doc wave done.

**Wave-6 coherence pass + spec-lifecycle close (2026-06-02, commits `6ca89f14` · `a759da68` · `eb5af09f` · `c2aacf8e`):** after the 6 waves, a completeness audit found 5 genuinely-stale docs still on the retired `FRAME→SCOUT→INVESTIGATE` spine + Question/SuspectedCause framing — fixed constitution / positioning / methodology / analyze-to-action / improvement-workspace. Flipped the two upstream specs `draft→delivered` (investigation-surface ← IM-0…IM-7 #243–#263; factors-evaluation ← FE-1/2a/2b #260–#262 — **verified all PRs merged before claiming delivered**), repointed factors-evaluation `implements:` off a sibling *spec* onto real stampable doc homes, stamped the 4 lagging targets → **Apply-phase sensor fully green (947 docs, 0 WARN)**. The final review caught one real error: I'd stamped `control.md` `last-verified` + called it "grounded," but its body documented `packages/core/src/sustainment.ts` + `Sustainment*` types — **the Sustainment→Control rename had propagated to the control-domain code identifiers** (`control.ts` exports `Control*`; PWA ships `ControlPanel.tsx`). Fixed. **Lesson reinforced: a stub's own "preserved per Task #N" prose is not grounding — grep the code.** The 2026-05-29 "preserved code-level `sustainment` identifiers intact" claim is now **stale for the control domain** (code renamed post-#241, IM-6 era); broader doc drift (`feature-parity.md` + historical cards still cite `Sustainment*` paths) is tracked in `investigations.md` for Apply-on-edit.
