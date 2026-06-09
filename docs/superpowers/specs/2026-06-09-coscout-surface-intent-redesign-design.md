---
tier: ephemeral
purpose: design
title: 'CoScout surface + intent redesign (agent-API-first)'
audience: human
category: design-spec
status: active
date: 2026-06-09
last-verified: 2026-06-09
related:
  - docs/07-decisions/adr-068-coscout-cognitive-redesign.md
  - docs/07-decisions/adr-060-coscout-intelligence-architecture.md
  - docs/superpowers/specs/2026-06-09-workspace-architecture-and-project-formalization-design.md
  - docs/07-decisions/adr-082-wedge-architecture.md
supersedes: []
layer: spec
implements:
  - docs/03-features/ai/coscout.md
  - docs/01-vision/coscout-ax-design.md
  - docs/07-decisions/adr-068-coscout-cognitive-redesign.md
---

# CoScout surface + intent redesign (agent-API-first)

> **Accepted design — 2026-06-09 (owner brainstorm).** Redesigns how CoScout is organized: it stops running on a linear `JourneyPhase` enum and becomes a **loop-aware investigation partner driven by _surface_ (the tab/canvas you're on — deterministic) + soft _loop-intent_ (diverging/converging/deciding — inferred)**. The tool surface is rebuilt as a **transport-agnostic "investigation agent API"** — the in-browser CoScout panel is client #1; a future in-tenant **MCP server** (named-future) is client #2 over the same surface. **Supersedes ADR-068's phase-adaptive model** (ADR-068 amended in place 2026-06-09). Grounded against `main` 2026-06-09 via a 5-lane evaluation (findings below). CoScout remains **Azure-only**; PWA is unaffected. **Delivery:** initial implementation landed in PR #352; the `JourneyPhase`→surface retirement is only partially done (the enum still drives mode-workflow + the dashboard phase badge) and is being completed as a follow-up cleanup.

## Summary

The methodology and product model around CoScout have shifted (5-verb activity frame, Wall-first Analyze, the [Workspace model](2026-06-09-workspace-architecture-and-project-formalization-design.md)), and CoScout's internals have not kept up. A 5-lane grounding found its phase model, Analyze coaching, and vocabulary are roughly one product-generation stale, it has **no behavioral eval coverage**, and its tool registry has drifted. The architecture (Responses API + app-owned tool loop, proposal-gated, deterministic-stats-is-authority) is **sound and kept**.

This redesign:

1. Replaces the linear phase enum with **surface (frames) + soft loop-intent (modulates)**.
2. Re-grounds the methodology on **Wall-first / Finding-as-unit** and the **Workspace / Project / Analysis-Scope** model.
3. Rebuilds the tool layer as a **transport-agnostic agent API** (enables a future MCP server without a rewrite).
4. Adds the missing **behavioral eval harness** as the gate for all prompt change.
5. Cleans the **registry rot**.

## Why (grounded findings, verified against `main` 2026-06-09)

| #   | Finding                                                                                                                                                                                                                                                                                                                                                               | Evidence                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | **Phase model is the retired 4-verb spine.** `JourneyPhase = 'frame' \| 'scout' \| 'analyze' \| 'improve'` — `scout` was never renamed to Explore, no `control`. All phase coaching + tool-gating keys off it.                                                                                                                                                        | `packages/core/src/ai/types.ts:82`                                                                 |
| 2   | **Analyze coaching is INVESTIGATE + Question-trees + Evidence-Map-centric** — all retired (Question dropped; Wall is canvas-first default; Map demoted).                                                                                                                                                                                                              | `prompts/coScout/phases/analyze.ts` (INVESTIGATE, question-tree); `context/analyze.ts:73-157`      |
| 3   | **No Workspace / Analysis-Scope awareness.** "What am I looking at" = a flat drillPath + activeChart; no Analysis-Scope object in `AIContext`; persona/role never reaches CoScout.                                                                                                                                                                                    | `buildAIContext.ts` (no `analysisScope`/role field)                                                |
| 4   | **No behavioral eval harness.** ~29 AI test files, all unit-level (prompt assembly, registry shape, parsers). Nothing tests tool _choice_, argument precision, REF grounding, or refusal-to-invent _in conversation_.                                                                                                                                                 | `packages/core/src/ai/__tests__/` (no fixture/golden/eval harness)                                 |
| 5   | **Registry rot.** 25 tools (docs say 27); **6 advertised-but-unexecutable** (handler map = read 7 + action 7 + navteam 4 = 18 for 25 tools), incl. dead Teams/SharePoint tools; 2 conditional tools (`suggest_hypothesis`, `connect_hub_evidence`) never advertised in Azure (it never passes `analyzePhase`/`existingHubs`); Question-vocabulary residue in schemas. | `tools/registry.ts`; `apps/azure/src/features/ai/useToolHandlers.ts:98`                            |
| 6   | **Azure-only by build-time mount.** PWA has zero CoScout. The AX doc's "PWA read-only coaching" gated by `isPaidTier()` is stale (function deleted). `answer_question` is marked "Delivered" in the AX doc + ADR-060 but absent from the registry.                                                                                                                    | `apps/pwa` (no AI mount); `packages/core/src/tier.ts`; `docs/01-vision/coscout-ax-design.md:56-60` |

The architecture is **not** the problem; the methodology, vocabulary, testability, and registry hygiene are.

## The model

### Surface (deterministic — the frame)

CoScout's behavior is framed by the surface the user is on — a fact the app already knows, not a phase it must guess. Loop-centric reach (decided): **Process** (frame) · **Explore** (diverge) · **Analyze / Wall** (converge) · **Report** (communicate). Not Home/Project admin. The Wall is home; Explore/Process are loop-adjacent; Report is communication.

Surface determines: the coaching domain (Tier-2 block) and **which tools are valid** (deterministic gate). Mounting on Explore/Process/Report is net-new (today CoScout is Analyze-only mounted).

### Loop-intent (soft — the modulation, no enum)

Within a surface, CoScout reasons about where the analyst is in the investigation loop — **diverging → converging → deciding** — and adapts its coaching. This is **soft**: there is no computed intent enum and no state machine (that was the mistake of the phase model). CoScout reasons from facts:

- **Cheap baseline pushed** into context every turn (zero round-trip orientation): coverage %, open-candidate-factor count, leading-hypothesis support.
- **Specifics pulled** via auto-executing read tools on demand: per-factor stats, category comparisons, KB.
- `critique_investigation_state` is **generalized into the cross-loop orientation tool** (today it is Analyze-only and its conditional gating is half-wired).

Intent **never gates tools** — that keeps the fuzzy part safe. Tools gate on surface (deterministic); intent shapes tone/emphasis only.

### Prompt assembly + invariants preserved

`assembleCoScoutPrompt({ surface, scope, context })` replaces `{ phase, analyzePhase, mode }`. **Tier-1 (role/terminology/glossary) stays byte-stable and cacheable**; surface coaching + the cheap baseline live in **Tier-2**. The structural stats-authority backstops are **unchanged**: no raw data in context, all numbers arrive via engine tool-handlers, language-discipline ESLint stays. Tool-gating becomes `getToolsForSurface(...)`.

## Agent-API-first (the durable architecture)

The tool registry + context assembly are rebuilt as a **transport-agnostic "investigation agent API"** — a clean surface that exposes VariScout's deterministic engine + investigation methodology (read: stats/factors/comparisons/state; action: propose findings/hypotheses/filters/actions — proposal-gated) independent of _who_ is calling.

- **Client #1 (now):** the embedded Azure CoScout panel (Responses API + app-owned tool loop).
- **Client #2 (named-future):** an **in-tenant MCP server** so an external agent (Claude Code, etc.) can drive the investigation while humans work the visual Wall (human-on-the-loop). See [decision-log Named-Future](../../decision-log.md).

This is a strictly better architecture than embedded-only and costs little extra now: it forces the tool surface to be defined independent of the panel. It does **not** commit us to building the MCP server — that stays a deliberate V2 bet (headless engine + in-tenant deployment + OAuth 2.1/Entra + the live-UI-coordination question) gated on a customer signal.

## Methodology re-grounding

- **Analyze coaching → Wall-first / Finding-as-unit.** Drop the INVESTIGATE / Question-tree / Evidence-Map-centric blocks; coach the Wall (current scope + switcher, Finding as connective tissue, Wall vs Causes lens).
- **Teach the Workspace model.** Add **Analysis Scope** (outcome/measure + factor + step + filters) to `AIContext`; speak Workspace / soft-formalized Project / Analysis Scope, not Hub/IP/Active-IP. Wire from `ProblemStatementScope` (already one import from the AI path).
- **Refresh `role.ts`** off "four analytical tools simultaneously" → canvas/Wall framing.
- **Role context:** make the Lead/Member/Sponsor role available to coaching tone (currently absent), per the AX doc's own promise.

## Registry hygiene

Delete the 6 unexecutable tools (incl. dead Teams/SharePoint), fix the 2 broken conditional gates, purge Question-vocabulary residue from schemas, correct the 25/27 count, and **re-gate every tool by surface**. The `mode` parameter (capability/yamazumi/defect/…) is reconciled as a **property of the Analyze surface/scope**, not a separate CoScout axis (aligns with the investigation-model decision to retire mode as a user axis).

## Behavioral eval harness (the enabler — built first, used as the gate)

Fixture-based behavioral evals (deterministic fixtures + recorded-response replay or a low-temp tier + assertion/LLM-judge layer), priority order:

1. **Refusal-to-invent-numbers** — context missing a stat → model declines, doesn't fabricate. (The core invariant; today instruction-only.)
2. **Orient-before-coaching** — does it read the baseline / call the orientation tool before coaching convergence?
3. **Tool-choice + argument precision** — realistic (context, turn) → expected tool + args.
4. **REF-marker grounding** — emitted `[REF:type:id]` resolve to IDs present in context (no dangling refs).
5. **Surface-appropriate behavior** — no out-of-surface tools; coaching matches the surface.
6. **Convergence-pressure / proposal safety** — pushes for evidence when coverage is thin; no destructive proposals.

Every prompt change after this lands must pass the harness.

## Scope & sequencing

Azure-only; PWA unaffected. **Coordinates with the Workspace migration** (Codex in progress) — CoScout consumes the new Workspace/Analysis-Scope context, so the surface is _designed_ now and the context is _wired_ when Workspace lands. Ordered for safety:

1. **Agent-API + model lock** — define the transport-agnostic tool surface; replace the phase enum with surface; soft-intent + orientation tool. (New ADR superseding ADR-068.)
2. **Eval fixtures** against the target methodology (the gate).
3. **Re-ground prompts** (Wall-first / Finding-as-unit / Workspace vocab; `role.ts`) — eval harness gates the change.
4. **Registry hygiene + re-gate by surface + generalize the orientation tool.**
5. **Mount on the loop surfaces** (Explore/Process/Report — net-new).
6. **Docs/ADR reconciliation** (AX doc: PWA-AI absent, `answer_question` retired, dead tier gate; ADR-060/068).

## Decisions

1. CoScout is organized by **surface (deterministic, frames + gates tools) + soft loop-intent (inferred, modulates coaching)**. The linear `JourneyPhase` enum is retired.
2. Loop-intent uses **no computed enum** — cheap baseline pushed, specifics pulled via read tools; `critique_investigation_state` generalized as the orientation tool.
3. The tool layer is **transport-agnostic (agent-API-first)**; embedded panel = client #1, in-tenant MCP server = named-future client #2.
4. Methodology re-grounds on **Wall-first / Finding-as-unit / Workspace model**.
5. A **behavioral eval harness** is built first and gates all prompt change.
6. CoScout stays **Azure-only**; `mode` becomes a surface/scope property, not a CoScout axis.
7. This **supersedes ADR-068's phase-adaptive model** (ADR-068 amended in place 2026-06-09).

## Acceptance criteria

- CoScout assembly is `{ surface, scope, context }`; no `JourneyPhase` enum; Tier-1 stays cacheable.
- Tools gate on surface; intent never gates; the tool surface is callable independent of the embedded panel.
- Analyze coaching is Wall-first / Finding-as-unit; the Question-tree + Evidence-Map-centric blocks are gone.
- `AIContext` carries Analysis Scope and Lead/Member/Sponsor role; vocabulary is Workspace/Project/Analysis-Scope.
- Registry: no unexecutable tools, no dead conditional gates, no Question residue, count correct.
- A behavioral eval harness exists and is wired as the prompt-change gate.
- AX doc + ADR-060/068 reconciled with code; the MCP server is logged as named-future.

## Named-future

The **in-tenant MCP server** (VariScout as an agent-operable investigation backend; team works the visual Wall, analyst orchestrates via an external agent) is a deliberate V2 direction, not built here. Prerequisites: headless stats engine, in-tenant deployment, OAuth 2.1 / Entra-delegated auth (scope-bound, no token passthrough), and a decision on live-UI co-presence vs async review. Logged in [decision-log § Named-Future](../../decision-log.md). The agent-API-first tool surface in this spec is the enabling groundwork.
