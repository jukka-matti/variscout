---
title: 'ADR-070: FRAME Workspace, Visual Process Map & Deterministic Mode Inference'
audience: [engineer]
category: architecture
status: stable
related:
  [
    frame-workspace,
    process-map,
    mode-inference,
    gap-detection,
    sipoc,
    watson-eda,
    capability-storytelling,
    rational-subgroups,
    adr-055,
    adr-038,
  ]
---

# ADR-070: FRAME Workspace, Visual Process Map & Deterministic Mode Inference

**Status:** Accepted

**Date:** 2026-04-18

## Context

The five-phase investigation spine FRAME → SCOUT → INVESTIGATE → IMPROVE → REPORT ([ADR-055](./adr-055-workspace-navigation.md)) surfaces four of five phases as workspaces — Overview, Analysis, Investigation, Improvement, Report — but **FRAME has no dedicated surface**. FRAME happens silently during data upload: column detection heuristically labels the outcome, factors, and time column, and analysis mode is guessed from column-name keywords (`packages/core/src/parser/detection.ts`, Yamazumi/Defect/Performance detectors). A prospect walkthrough with Greg on 2026-04-18 exposed the consequence — VariScout is positioned as _structured investigation for process improvement_ but the UX never asks about the user's process.

The capability view has a parallel miss. [ADR-038](./adr-038-subgroup-capability.md) correctly plots **Cpk as a control chart** across rational subgroups — an unconventional, Watson-endorsed approach that answers _"is capability stable?"_, not just _"is capability acceptable?"_. But the subgroup-size gear popover mimics Minitab's within-σ input; default `subgroupConfig.size=1` leaves the chart empty on every seeded sample except `syringe-barrel-weight` (`packages/data/src/samples/syringe-barrel-weight.ts:240`); and CoScout's rational-subgroup coaching (`packages/core/src/ai/prompts/coScout/modes/capability.ts:54-81`) only surfaces in AI outputs, never in base UI.

Two Watson transcripts (2026-04-18) reshaped the frame: (1) Watson coined Quality 4.0 at Berlin 2017 and VariScout embodies that framework without claiming the lineage; (2) rational subgroups are fractal — between process steps AND within an activity (Gemba / camera frame-to-frame). Existing UI only offers the outer ring.

Both misses share one cause: **the UX starts from data mechanics, not from process structure.** The methodology VariScout already embeds (Watson's EDA, three evidence types, hub model, mode strategy) is invisible at the moments users most need it.

## Decision

Promote **FRAME** to a first-class workspace tab rendered as a **visual process map** — a _river-styled SIPOC blend_ — and make it the new entry to every investigation. Replace the silent keyword-heuristic mode guess with **deterministic mode inference from map shape + column roles**. Ship the capability-view storytelling leg alongside. CoScout is optional throughout.

### 1. FRAME becomes a workspace tab

The 5-workspace navigation (ADR-055) expands to 6: `Overview | FRAME | Analysis | Investigation | Improvement | Report`. FRAME is entered automatically after data upload or sample load; a small escape hatch lets users skip to a blank map for data-less scenarios (heavy blank-canvas flow is V2+).

### 2. Visual shape — river-styled SIPOC blend

Primary axis left→right (SIPOC / temporal). Tributaries enter from both banks at each step (river feel / Y=f(x) little xs). Ocean at the far right is **CTS** (Critical-to-Satisfaction) with USL/LSL painted on it. One canvas, three readings (SIPOC, Y=f(x), river) with no single reading dominating. Rendered as SVG primitives matching the Evidence Map stack (`packages/charts/src/EvidenceMap/`) so the Process Map and Evidence Map can eventually merge.

### 3. Data-seeded entry (V1)

Columns propose the map. `detectColumns` assigns candidate roles (Y/CTS, factor/x, step, subgroup, time); FRAME drafts a skeleton; the user confirms by placing column chips onto map nodes, names steps, sets target and spec limits, and pins hunches on tributaries.

### 4. Three FRAME jobs

1. **Build the map** — seeded by columns; refined by the user.
2. **Choose the analysis mode deterministically** — from map shape + column roles. Replaces today's keyword-heuristic guess. Mode becomes a _consequence_ of framing.
3. **Identify data gaps** — map declares what the methodology wants (CTS, CTQ per step, xs, time/batch axis, spec limits); data declares what the user has; FRAME flags the delta as a measurement plan.

### 5. CoScout is optional

FRAME must work end-to-end without any AI call (Constitution P8 _Deterministic first, AI enhances_; PWA free tier has no AI). Core flow is deterministic: column detection + map skeleton + mode inference + gap report. CoScout, when present, sits in a sidebar and suggests step names, tributary candidates, and hunch prompts. No step is gated on AI.

### 6. Capability-view storytelling leg (V1 side-deliverable)

- Seed `subgroupConfig` on every seeded sample (not just `syringe-barrel-weight.ts`).
- Replace `SubgroupConfigPopover` to read rational-subgroup candidates from `processMap.subgroupAxes` (the tributaries the user sketched).
- Rename `CapabilityMetricToggle` labels to story-matching language.
- Surface `coScout/modes/capability.ts:54-81` coaching in a first-time help drawer (static content, no AI call).

## Alternatives Rejected

- **CoScout-led FRAME (conversation-led).** CoScout interviews the user, drafts the map from answers. _Rejected for V1_ — violates the "works without CoScout" constraint (Constitution P8, PWA free tier). Kept as V2+ (CoScout-drafted maps layered on the deterministic core).
- **Goal-first wizard.** Pick a goal (reduce defects / improve capability / …) → maps to mode + process fields. _Rejected_ — least novel ("never done in our category" was an explicit ambition), and less grounded in the Watson methodology VariScout already teaches.
- **Whitehead/Watson ontology frame deck.** Three cards (entity · activity · experience). _Rejected as primary shape_ — more abstract than users need at entry. Its conceptual split is preserved in the CTQ (within process) vs CTS (at ocean) axis of the chosen design.
- **Complete Quality 4.0 frame in one push.** FRAME + CTQ/CTS data-model split + fractal (within-step) subgroups + probability-plot inflection + positioning claim in a single release. _Rejected for V1_ — too much scope at once; data-model changes risk breaking saved projects. Kept as V2+.
- **Phased-with-undecided-spine.** Start shipping quick wins, pick the spine later. _Rejected_ — quick wins are compatible with any spine and are scheduled alongside V1, but the spine decision itself is load-bearing and can't be deferred without blocking mode inference and the capability-leg wiring.

## Consequences

### Easier

- Mode selection becomes explicit and user-steerable instead of a silent keyword guess. Analysts can correct a wrong inference without hunting for a hidden toggle.
- Capability view ships a coherent story: rational subgroups come from the tributaries the user just sketched; microcopy explains what that means; the chart is never empty on load.
- CoScout's existing methodology knowledge (5 pillars, 25 tools, mode-aware prompts) gets a surface that engages before data arrives, without becoming a dependency.
- The Process Map becomes the pre-investigation bookend to the already-delivered Evidence Map: _what we think is happening_ → _what the data says happens_.
- Deterministic rule table makes mode inference testable (NIST-style fixtures) and reviewable, unlike scattered keyword heuristics.

### Harder

- A new workspace tab adds navigation surface area. Documentation, user education, and tests must cover it.
- `ProcessContext` gains a `processMap` field that must be persisted, synced (Blob / IndexedDB), and migrated for existing saved projects. Backward-compat path: existing mapless projects stay mapless until the user opens FRAME, then offer a "build map from current columns" action.
- Capability-leg changes touch `SubgroupConfigPopover`, `CapabilityMetricToggle`, every seeded sample, and CoScout prompt surfacing. Each surface needs tests; the seeded-sample change needs visual verification on every sample.
- V2+ ambitions (fractal subgroups, CTQ/CTS data-model split, probability-plot inflection, Quality 4.0 positioning) accumulate scope debt that must be tracked in the feature backlog.

### Neutral

- Existing investigation workflow is unchanged: pre-data hunches created in FRAME flow into `investigationStore` as draft `SuspectedCause` hubs, reusing the hub model ([ADR-064](./adr-064-suspected-cause-hub-model.md)). Analysis, Investigation, Improvement, and Report workspaces are untouched.

## Implementation

Staged across multiple PRs. See the design spec for full detail: [FRAME Workspace & Visual Process Map](../superpowers/specs/2026-04-18-frame-process-map-design.md).

- **PR · Capability-view quick wins** (independent): seed `subgroupConfig` on every sample, rename `CapabilityMetricToggle` labels, add first-time capability help drawer surfacing `coScout/modes/capability.ts:54-81` as static content.
- **PR · Data model + rule engines**: extend `ProcessContext.processMap` schema; create `packages/core/src/frame/modeInference.ts` (pure function, rule table); create `packages/core/src/frame/gapDetector.ts` (map ↔ data delta); tests.
- **PR · FRAME UI**: SVG primitives in `packages/charts/src/ProcessMap/`; `ProcessMapBase` in `packages/ui/src/components/ProcessMap/`; `FrameView.tsx` in both apps; nav tab insertion.
- **PR · Capability-leg wiring + end-to-end verification**: `SubgroupConfigPopover` reads from `processMap.subgroupAxes`; Process Map thumbnail in Analysis; pre-data hunches flow into `investigationStore`; `claude --chrome` walk on every seeded sample; MBB-expert review gate.

V2+ follow-on work is tracked in the spec's _V2+ deferred_ section.
