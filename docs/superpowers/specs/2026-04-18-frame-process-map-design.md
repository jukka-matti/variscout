---
title: FRAME Workspace & Visual Process Map
audience: [engineer, product]
category: architecture
status: delivered
related:
  [
    frame-workspace,
    process-map,
    mode-inference,
    gap-detection,
    sipoc,
    watson-eda,
    quality-4-0,
    capability-storytelling,
    rational-subgroups,
    subgroup-capability,
    coscout-optional,
  ]
---

# FRAME Workspace & Visual Process Map

## Context

During a 2026-04-18 prospect walkthrough with Greg, the first-time journey — _start analysis → upload data → 4-chart grid_ — revealed as engineering-logic first. VariScout is positioned as _"structured investigation for process improvement — question-driven, evidence-based, AI-assisted"_ ([positioning](../../01-vision/positioning.md)) but the UX never asks about the user's **process**. Analysis mode is guessed from column-name heuristics, unannounced and unsteerable.

A related miss in the **capability view** surfaces the same root cause. Per seven Watson MBB sessions in `docs/10-development/` and two transcripts Jukka pasted (2026-04-18), VariScout already does the right _unconventional_ thing — it plots **Cpk as a control chart** across rational subgroups ([ADR-038](../../07-decisions/adr-038-subgroup-capability.md)). But the subgroup-size gear popover mimics Minitab's within-σ input, default `subgroupConfig.size=1` renders the capability chart empty on every seeded sample except `syringe-barrel-weight` (`packages/data/src/samples/syringe-barrel-weight.ts:240`), and there is zero microcopy explaining what rational subgrouping is _for_.

Two Watson-transcript insights (2026-04-18) reshaped the frame:

1. **Quality 4.0 has a birthday.** Watson coined it at Berlin 2017 — _"eliminate Shewhart's measurement-error ceiling via coordinated measurement, then design the process, not just monitor it."_ VariScout embodies this but has never claimed the lineage.
2. **Rational subgroups are fractal.** Between process steps AND within an activity (Gemba / camera / frame-to-frame conversion). Implicit 4-point measurement topology: input → process (conversion) → output → Δ. Today's UI only offers the outer ring.

Both misses share one cause: **the UX starts from data mechanics, not from process structure**, so the rich methodology VariScout embeds is invisible at the moments users most need it.

**Intended outcome.** Promote **FRAME** (the first phase of the delivered five-phase spine FRAME→SCOUT→INVESTIGATE→IMPROVE→REPORT per [ADR-055](../../07-decisions/adr-055-workspace-navigation.md)) to a first-class workspace tab. Replace the silent mode-guess with a **visual process map** that the user actively builds from their uploaded columns. Ship the capability-view storytelling leg alongside.

## What VariScout already is (the load-bearing inventory)

### Methodology — delivered

- Positioning (verbatim): _"VariScout is structured investigation for process improvement — question-driven, evidence-based, AI-assisted."_
- Five-phase spine: FRAME → SCOUT → INVESTIGATE → IMPROVE → REPORT.
- Five workspaces mirror the journey ([ADR-055](../../07-decisions/adr-055-workspace-navigation.md)): Overview | Analysis | Investigation | Improvement | Report. **FRAME has no dedicated surface today — it happens silently during upload.**
- Constitution (10 principles, 3+4+3 structure; [constitution.md](../../01-vision/constitution.md)): journey-driven · same analysis everywhere · customer-owned data · four lenses simultaneously · questions drive investigation · evidence-based drilling · three evidence types · deterministic first AI enhances · shared packages · strategy pattern for modes.
- Watson's EDA foundation (Turtiainen 2019; [methodology.md](../../01-vision/methodology.md)): Four Lenses (I-Chart · Boxplot · Pareto · Capability) · Two Voices (Process vs Customer) · Diamond pattern (Initial → Diverging → Validating → Converging) · Three evidence types (Data · Gemba · Expert).
- VariScout contributions: Parallel Views · Progressive Stratification · Question-Driven Investigation (hubs, not root causes).
- Investigation Spine delivered ([ADR-066](../../07-decisions/adr-066-evidence-map-investigation-center.md), [investigation-spine spec](./2026-04-04-investigation-spine-design.md)): three threads, five progressive sentences (Concern → Direction → Scope → Mechanisms → Confirmed), Evidence Map as workspace center (3-layer SVG), SuspectedCause hubs ([ADR-064](../../07-decisions/adr-064-suspected-cause-hub-model.md)).

### CoScout — delivered

- Five-pillar architecture ([ADR-060](../../07-decisions/adr-060-coscout-intelligence-architecture.md)): Hot Context Quality · Investigation Retrieval · External Document KB · Question interaction · Mode-aware completion.
- 25 phase-gated action tools ([ADR-029](../../07-decisions/adr-029-ai-action-tools.md)).
- Modular prompts with tier enforcement ([ADR-068](../../07-decisions/adr-068-coscout-cognitive-redesign.md)): `assembleCoScoutPrompt(phase, mode, surface, context)`.
- Knowledge Catalyst ([ADR-049](../../07-decisions/adr-049-coscout-context-and-memory.md)) · Visual grounding ([ADR-057](../../07-decisions/adr-057-coscout-visual-grounding.md)).
- Mode-aware coaching per mode. `packages/core/src/ai/prompts/coScout/modes/capability.ts:54-81` has full rational-subgroup + Cpk-stability coaching — only surfaces in AI outputs today, not base UI.

### Data model

`ProcessContext` (`packages/core/src/ai/types.ts:29-58`): `description` · `product` · `measurement` · `issueStatement` · `problemStatement` · `targetMetric` · `targetValue` · `targetDirection` · `suspectedCauses` · `factorRoles` — **all `null` at first-chart time.** `entryScenario: 'problem' | 'exploration' | 'routine'` — exists, never gathered at entry. `subgroupConfig` supports one level only.

### Analysis modes

Standard · Capability ([ADR-038](../../07-decisions/adr-038-subgroup-capability.md)) · Yamazumi ([ADR-034](../../07-decisions/adr-034-yamazumi-analysis-mode.md)) · Performance ([ADR-050](../../07-decisions/adr-050-wide-form-stack-columns.md)) · Defect (delivered 2026-04-16) · Process-Flow ([draft spec](./2026-04-07-process-flow-analysis-mode-design.md), not coded).

## What's missing (the gaps FRAME fills)

1. **FRAME has no dedicated screen.** The five-phase spine says FRAME first; the UX makes it invisible (upload → guess mode → dashboard). No surface for Watson's 3 Qs, no place to capture hunches as pre-data SuspectedCauses.
2. **Two Voices not introduced at entry.** Voice of Process (control limits) vs Voice of Customer (spec limits) is a core methodology claim, never labeled.
3. **CoScout 5 pillars dormant at entry.** Pillar 1 (Hot Context) and Pillar 5 (Mode-aware) could engage before data arrives — today they kick in only after.
4. **Quality 4.0 lineage unclaimed.** VariScout embodies the Watson Berlin 2017 framework; positioning doesn't name it.
5. **Fractal subgroups not exposed.** ADR-038 covers between-step only; the within-activity Gemba layer is not a first-class concept.
6. **CTQ vs CTS split implicit.** `outcome` is the single CTQ by convention; no deliverable (customer-felt) CTS concept.
7. **Probability plot as process diagnostic is backlog.** Inflection-as-loss-point framing ([feature-backlog](../../10-development/feature-backlog.md) items 1–3) not yet shipped.
8. **Capability UI is storytelling-mute.** Math is right; coaching exists in prompts; nothing surfaces in base UI.

## Design: FRAME workspace + visual process map

### Direction

Promote **FRAME** to a first-class workspace tab before Analysis, rendered as a **visual process map** — not a form. Nav becomes:

```
Overview | FRAME | Analysis | Investigation | Improvement | Report
                ^ NEW
```

The map is a single canvas where **the process itself is the primary artifact**; everything else (CTQ · CTS · rational subgroups · hunches · eventually data) hangs on that canvas.

### Visual shape — river-styled SIPOC blend

Primary axis left→right (SIPOC / temporal). Tributaries enter from both banks of each step (river feel / Y=f(x) little xs). Ocean at the far right is **CTS** with USL/LSL painted on it. One canvas, three readings (SIPOC, Y=f(x), river) with no single reading dominating.

```
  ╱ Mach ╲  ╱ Mach ╲  ╱ Mach ╲
 │  Shft ▶│  Shft ▶│  Shft ▶│
  ╲ Lot  ╱  ╲ Lot  ╱  ╲ Lot  ╱
     ↓         ↓         ↓        ocean
  [ Mix ]  [ Fill ]  [ Seal ]→ ( CTS )
     ↑         ↑         ↑       target
  ╱ Op   ╲  ╱ Op   ╲  ╱ Op   ╲  14.2±0.3
 │ Envir ▶ │ Envir ▶ │ Envir ▶
  ╲ Setup╱  ╲ Setup╱  ╲ Setup╱
```

Concepts surfaced on the canvas (all wired to existing `ProcessContext` + `investigationStore`):

- **Process spine** — ordered nodes for Suppliers → Inputs → Step 1..N → Outputs → Customer.
- **CTS** (Critical-to-Satisfaction, customer-felt) — the ocean at the right; target + USL/LSL painted on it.
- **CTQ(s)** (Critical-to-Quality, within process) — a meter on each step node.
- **xs / tributaries** — factors branching into each step (machine, shift, operator, lot…). Acts as the rational-subgroup axis.
- **Hunches** — flag pins on specific tributaries → become pre-data `SuspectedCause` drafts.
- **Watson 3 Qs** — _measure_ is the CTS target, _direction_ is the spec orientation (nominal/smaller/larger), _scope_ is which process steps are in-frame.

This canvas becomes the **pre-investigation bookend** to the already-delivered Evidence Map ([ADR-066](../../07-decisions/adr-066-evidence-map-investigation-center.md)): Process Map = _"here's what we think is happening"_; Evidence Map = _"here's what the data says happens."_

### Entry shape — data-seeded (V1)

User uploads data (or picks a sample). The existing column detector (`packages/core/src/parser/detection.ts`) assigns each column a candidate role:

- `outcome` → Y / CTS (ocean)
- `factor` → tributary x
- `step` column → a step node
- `time` → temporal axis
- `subgroup` → a tributary axis

FRAME drafts a skeleton from those roles and heuristics. The user confirms by placing column chips onto map nodes, names steps, sets target and spec limits, and pins hunches on tributaries.

### CoScout is optional

**Hard requirement:** FRAME must work end-to-end without any AI call. Constitution P8 (_Deterministic first, AI enhances_) and PWA free tier (no AI) both require this. Deterministic core: column detection + map skeleton + mode inference + gap report.

CoScout, when present, sits in a sidebar and offers: step-name suggestions, tributary suggestions from industry knowledge, hunch prompts based on the issue statement. No step is gated on AI.

## FRAME's three jobs

1. **Build the map.** Seeded by uploaded columns in V1; refined by the user; template-backed and CoScout-drafted in V2+.
2. **Choose the analysis mode.** Deterministically, from map shape + column roles. This replaces today's keyword-heuristic mode guess. The mode becomes a _consequence_ of framing, not a silent default.
3. **Identify data gaps.** The map declares what the methodology wants (CTS measure, CTQ per step, xs tributaries, time/batch axis, spec limits); the data declares what the user has; FRAME flags the delta as a measurement plan for later collection.

Per [ADR-074](../../07-decisions/adr-074-scout-level-spanning-surface-boundary-policy.md), FRAME is the L2 (flow / process model) **authoring** owner — the canonical surface for shaping the river-styled SIPOC and column-to-step mappings. Other surfaces lens L2 (read-only) by linking back to FRAME rather than redoing this authoring. The thin-spot helpers and how they fall out of the level-spanning model are described in [Multi-level SCOUT design](./2026-04-29-multi-level-scout-design.md).

## V1 scope (what ships)

- **New workspace tab `FRAME`** inserted after Overview, before Analysis (amend ADR-055).
- **Entry trigger**: appears after data upload / sample load. For data-less scenarios, a small escape hatch (_"Skip to blank map"_) exists but the heavy blank-canvas flow is V2+.
- **Column-role detection** reuses `packages/core/src/parser/detection.ts`. Each detected column appears as a chip with its candidate role.
- **Skeleton map** rendered as SVG primitives matching the Evidence Map's stack (`packages/charts/src/EvidenceMap/`). Nodes: process steps (auto-ordered left→right), tributary branches, ocean (CTS). Inline markers for unresolved / missing pieces.
- **User interaction**: drag column chips onto map nodes · rename steps inline · add/remove steps · set target & spec limits · pin hunches on tributaries (stored as pre-data `SuspectedCause` drafts in `investigationStore`). No full freeform canvas — interactions are structured to keep scope bounded.
- **Deterministic mode inference** (new `packages/core/src/frame/modeInference.ts`). Rule table:
  - `stepColumn + cycleTime + activityType` → `yamazumi`
  - `defectType column + countColumn` (or pass/fail) → `defect`
  - `3+ numeric channels with channel-like names` → `performance`
  - `outcome + specs + rational subgroups` → `capability`
  - fallback → `standard`
- **Gap report** (new `packages/core/src/frame/gapDetector.ts`): inline warning glyphs on unfilled map nodes + a compact gap strip at the bottom of FRAME listing outstanding items.
- **Persistence**: extend `ProcessContext` with `processMap: { nodes, edges, layout, subgroupAxes, hunches }`; persist via existing `projectStore` + Azure Blob sync (no new store).
- **Integration with existing investigation workflow**:
  - Pre-data hunches flow into `investigationStore` as draft `SuspectedCause` hubs ready for evidence.
  - The Process Map persists as a read-only thumbnail in Analysis so the user never loses the frame while drilling.
  - Mode inference feeds the existing strategy pattern (`resolveMode()` / `getStrategy()`).

### Capability-view leg (V1)

- **Seed `subgroupConfig` on every seeded sample** (`packages/data/src/samples/*.ts`). Today only `syringe-barrel-weight.ts:240` does this.
- **Replace `SubgroupConfigPopover`** to read candidates from `processMap.subgroupAxes` — the user picks from the tributaries they sketched in FRAME, not a raw column list.
- **Rename `CapabilityMetricToggle` labels** to story-matching language ("Measurements / Cpk stability" or similar, to be finalized with microcopy review).
- **Surface the existing `coScout/modes/capability.ts:54-81` coaching** in a first-time capability-view help drawer (static content, no AI call required in V1).

## V2+ (deferred)

- CoScout-drafted maps from conversation · CoScout sidebar critique · CoScout-led template customization.
- Bidirectional flow (start from the map without data; columns attach later).
- Template library (injection molding, filling, assembly, chemical, service, hospital, blank).
- Evolution into Investigation: Process Map ↔ Evidence Map continuity (same SVG stack, different layers).
- Full drag-and-drop / auto-layout (likely `react-flow`) replacing V1's structured affordances.
- **Fractal subgroups** — within-step (Gemba / frame-to-frame) as a second subgroup ring. Requires data-model change.
- **CTQ vs CTS split** as an explicit data-model concept (V1 uses the ocean node + CTQ-per-step convention; V2 formalizes).
- **Probability plot inflection detection** (unlocks [feature-backlog](../../10-development/feature-backlog.md) items 1–3). Surfaces Watson's loss-point diagnostic.
- **Quality 4.0 positioning claim** in [positioning.md](../../01-vision/positioning.md) + manifesto (Shewhart 1924 → Six Sigma 1986 → Industry 4.0 2010 → Quality 4.0 Watson 2017 ← VariScout).

## Implementation notes

### Files to create

- `apps/pwa/src/components/views/FrameView.tsx` · `apps/azure/src/components/editor/FrameView.tsx`.
- `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx` — the interactive SIPOC-river SVG.
- `packages/charts/src/ProcessMap/` — SVG layer primitives (spine, tributary, ocean, gap marker) matching Evidence Map style.
- `packages/core/src/frame/modeInference.ts` — rule-table mode resolver (pure function).
- `packages/core/src/frame/gapDetector.ts` — map ↔ data gap analysis.
- `docs/07-decisions/adr-070-frame-workspace.md` — the decision record.

### Files to extend

- `packages/core/src/ai/types.ts` — add `ProcessContext.processMap` schema.
- `packages/stores/src/projectStore.ts` (or wherever the projectStore lives per ADR-041) — add `setProcessMap` action, persist alongside existing fields.
- `packages/core/src/analysisStrategy.ts` (`resolveMode()`) — accept map-derived mode hint from FRAME.
- `packages/ui/src/components/SubgroupConfig/` — consume `processMap.subgroupAxes` instead of raw column list.
- `packages/ui/src/components/CapabilityMetricToggle/` — new labels + first-time coach drawer.
- Navigation (`apps/*/src/components/**`) — insert FRAME tab per ADR-055 update.
- All seeded samples in `packages/data/src/samples/` — set `subgroupConfig`.

### Open technical decisions (resolve during implementation)

- Rendering library choice: SVG-only (reusing Evidence Map primitives) for V1; revisit `react-flow` for V2 freeform.
- Whether mode inference should be a pure function or a store action. Leaning: pure function for testability; store binds it to map changes.
- Whether the gap report lives in Frame state or is recomputed via selector. Leaning: selector to avoid stale state.
- Data-model backward-compat: existing saved projects (no `processMap`) either auto-synthesize one on load or stay mapless until the user opens FRAME. Leaning: mapless with a "Build map from current columns" button.

## Verification

- Walk the new FRAME → Analysis journey end-to-end on each seeded sample (syringe, fill weight, coffee moisture, +others) with `claude --chrome`. Confirm:
  - Process Map is non-empty after upload.
  - Mode is inferred from the map (not keyword heuristics).
  - Capability chart is never empty by default (subgroupConfig seeded).
  - Gap markers point at missing spec limits / CTQs.
- Express the two Watson-inspired test questions from the transcripts:
  - _"For those summer months, which countries have the highest?"_ (conditional cross-filter).
  - _"Trace the phosphate backward through tributaries."_ (constructal-law backward trace).
- MBB-expert review gate on the prototype before merging product code.
- `pnpm test` green across the monorepo; `bash scripts/pr-ready-check.sh` green; visual verification with `claude --chrome` before PR.
- Per-package tests: `modeInference` rule table (unit), `gapDetector` delta analysis (unit), `processMap` store reducer actions, React Testing Library tests for `ProcessMapBase` interactions (drag column, rename step, add hunch).
