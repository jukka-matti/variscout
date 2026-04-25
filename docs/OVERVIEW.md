---
title: VariScout — What It Does In Practice
audience: [engineer, analyst]
category: reference
status: stable
last-reviewed: 2026-04-24
related: [product-overview, modes, tiers, coscout, journey]
---

# VariScout — What It Does In Practice

VariScout is **structured investigation for process improvement**. A browser-based, offline-first tool for quality engineers, lean practitioners, and analysts to explore variation in process data, identify suspected causes, and drive improvement actions. Data stays in the customer's environment throughout.

The near-term product direction is **Process Hub first**: every investigation belongs to a real process, production line, queue, cell, value stream, development flow, or business workflow. The Process Hub gives the process owner and improvement team one place to see what is being investigated, what is being changed, who owns the work, what is waiting for verification, and which learnings need to be sustained. A GB/BB, OpEx lead, or development-org engineer may work across multiple Process Hubs; a line owner may mostly live in one.

## The journey model

Every investigation follows one spine: **FRAME → SCOUT → INVESTIGATE → IMPROVE**.

- **FRAME.** User states the problem (data-first or hypothesis-first entry). CoScout helps articulate.
- **SCOUT.** Data is parsed and characterized. Four Lenses of variation emerge (central tendency, spread, pattern, distribution).
- **INVESTIGATE.** User picks suspected causes — data-derived, gemba-observed, or expert-supplied — and examines each with Evidence Map, statistics, and targeted questions. Journal accumulates findings.
- **IMPROVE.** Hubs of evidence converge on improvement ideas. Prioritization by impact × feasibility. Action items captured.

The spine never changes. Analysis modes vary the tools used inside each phase.

## The organizational context

Process Hub is the organizational context around the journey model. It does not replace the investigation spine; it contains investigations at different depths. A formal improvement project is optional and secondary: it may live inside one hub or span multiple hubs later.

| Depth         | Use                                                            |
| ------------- | -------------------------------------------------------------- |
| **Quick**     | Local team issue, one or two clues, action and verify quickly  |
| **Focused**   | Several checks or one mechanism branch                         |
| **Chartered** | Formal LSSGB/DMAIC-style work with sponsor, target, and report |

EDA 2.0 supplies the language inside each investigation: Issue / Concern, Current Understanding, Problem Condition, Mechanism Branches, Next Move, Verification, and Control handoff. See `docs/superpowers/specs/2026-04-25-process-hub-design.md`.

## The six analysis modes

1. **Standard** (default). Continuous measurement data. I-Chart, Boxplot, Pareto, Stats panel. Most common entry point — quality engineers, analysts, students.
2. **Capability.** Cp/Cpk against specifications. Histogram, probability plot. Optional subgroup capability (ADR-038). Used for process qualification and SPC.
3. **Yamazumi** (lean). Activity-level cycle time analysis. Stacked bars by VA/NVA/Waste/Wait (fixed colors), takt line, rebalancing targets. Used by industrial engineers and continuous improvement leads.
4. **Performance** (multi-channel). Fill heads, cavities, nozzles. Per-channel Cpk scatter, cross-channel Boxplot comparison, worst-first Pareto. Used by process engineers monitoring multi-stream equipment.
5. **Defect** (events → rates). Event logs transformed into defect rates per time unit. Pareto of defect types, cross-type evidence map. Used by quality engineers tracking PPM.
6. **Process Flow** (design-only, not yet coded). Intended for process-level bottleneck analysis and flow diagnostics.

Mode resolution lives in `packages/core/src/analysisStrategy.ts`. CoScout's methodology coaching adapts per mode.

## The three tiers

| Tier           | Distribution      | Price   | Capability                                                                       |
| -------------- | ----------------- | ------- | -------------------------------------------------------------------------------- |
| PWA            | Public URL        | Free    | Full analysis, session-only, no persistence. Training and education.             |
| Azure Standard | Azure Marketplace | €79/mo  | Full analysis + CoScout AI, local (IndexedDB) persistence, optional voice input. |
| Azure Team     | Azure Marketplace | €199/mo | + Blob Storage sync, Knowledge Base, optional voice input.                       |

Same analytical capability everywhere. Tier changes collaboration, persistence, and AI.

## CoScout — the AI assistant

CoScout is an assistant, not an oracle. It coaches methodology, asks targeted questions, surfaces references, and proposes actions. The deterministic stats engine is the authority on numbers — CoScout quotes it, doesn't override. CoScout is modular (tier1/2/3 prompt layering), mode-aware (methodology coaching varies by analysis mode), and tool-calling (27-tool registry gated by phase/mode/tier). On Azure tiers, CoScout can also accept **voice input** in a transcript-first way: the user speaks, the text lands in the normal draft box, the user reviews/edits, then sends. v1 replies remain text.

## Customer-owned data

Processing happens in the browser. When data moves (Blob Storage sync, AI calls, optional Azure voice transcription), it stays in the customer's Azure tenant — no VariScout-operated cloud. This is a core product principle, not a feature. Voice input does not create a durable audio layer; the saved artifact is the transcript inside the normal investigation model.

## Where to go next

- User flows and personas: `USER-JOURNEYS.md`
- Data lifecycle (parse → stats → persist → sync): `DATA-FLOW.md`
- Process Hub direction: `docs/superpowers/specs/2026-04-25-process-hub-design.md`
- Process Hub use cases: `docs/superpowers/specs/2026-04-25-process-hub-use-cases.md`
- EDA 2.0 direction: `docs/superpowers/specs/2026-04-25-question-driven-eda-2-design.md`
- Mode-specific journeys: `USER-JOURNEYS-{YAMAZUMI,PERFORMANCE,DEFECT,CAPABILITY,PROCESS-FLOW}.md`
- Feature parity table: `docs/08-products/feature-parity.md`
- Constitution (10 principles): `docs/01-vision/constitution.md`
