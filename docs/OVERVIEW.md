---
title: VariScout — What It Does In Practice
audience: [engineer, analyst]
category: reference
status: stable
last-reviewed: 2026-05-16
related: [product-overview, modes, single-sku, coscout, journey, v1-architecture]
---

# VariScout — What It Does In Practice

VariScout is **structured investigation for process improvement**. A browser-based tool for improvement specialists — quality engineers, Lean practitioners, Six Sigma belts (Green/Black/MBB), CI engineers — to explore variation in process data, identify suspected causes, drive improvement actions, and verify whether changes worked. Data stays in the customer's environment throughout.

Two ways to use it, both first-class:

- **Quick analysis.** Paste data, explore in charts, save findings. No project ceremony required. Free PWA supports session-only use; Azure tier adds persistence.
- **Project-anchored investigation.** Create a Project (Charter ceremony), invite your team (Lead / Member / Sponsor roles), run the formal lifecycle: **Charter → Approach → Sustainment**. Each project produces a report a Sponsor can sign off.

Canonical V1 design lives in the [V1 architecture spec](superpowers/specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](07-decisions/adr-082-wedge-architecture.md).

## The journey model

Every investigation — whether quick or project-anchored — follows one methodological spine:

**FRAME → SCOUT → INVESTIGATE → IMPROVE**

- **FRAME.** State the problem (data-first or hypothesis-first entry). CoScout helps articulate.
- **SCOUT.** Data is parsed and characterized. Four Lenses of variation emerge (central tendency, spread, pattern, distribution).
- **INVESTIGATE.** Pick suspected causes — data-derived, gemba-observed, or expert-supplied — and examine each with the Evidence Map, statistics, and targeted questions. The Investigation Wall accumulates Findings linked to Hypotheses; Measurement Plans capture what evidence still needs collection (hypothesis-first path).
- **IMPROVE.** Hypotheses converge on improvement actions. Inside a Project this becomes the **Improve tab** (action tracker) — top-level verb tab per the 2026-05-16 amendment — then Sustainment ("did it work? + close").

The spine never changes. Analysis modes vary the tools used inside each phase.

## Project — the optional formal wrapper

A **Project** wraps a body of analysis with formal lifecycle and team membership. Use it when the work needs to be tracked, when a Sponsor wants a signoff-able report, or when collaborators need scoped access. Skip it when you're exploring or producing a quick analysis for personal use.

| Stage           | Function                                                                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Charter**     | Wrap an existing analysis with project ceremony — problem statement, member invites, optional refined goal. Inherits the Hub's framing (outcome, factors, process map) rather than re-doing it. |
| **Approach**    | Investigation strategy → produces suspected causes. Anchor surface is the Investigation Wall (Hypotheses + Findings + Measurement Plans).                                                       |
| **Sustainment** | "Did it work?" closure — Cpk delta + action completion + drift check. Absorbs the legacy Handoff stage.                                                                                         |

Improvement actions are tracked in the **Improve tab** — a top-level verb tab (not a Project stage) scoped to the active project via active-IP cascade.

The data underneath a Project (the Hub) is tenant-wide — anyone in your Azure tenant can paste data and analyze without creating a Project. The Project's formal artifacts (Charter, Approach, Sustainment, Report) are membership-gated.

## Project membership roles

| Role        | Who                                                                    | Access                                         |
| ----------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| **Lead**    | The analyst running the project (typically a belt or project director) | Full edit + manages membership                 |
| **Member**  | SME, analyst, frontline contributor, quality engineer                  | Full edit within project surfaces              |
| **Sponsor** | Executive sponsor / Champion                                           | Report-only at V1; signoff handled out-of-band |

Project members must be in the same Azure AD tenant as the buyer. Cross-org collaboration is out of V1 scope (this becomes a deliberate privacy boundary).

## The six analysis modes

1. **Standard** (default). Continuous measurement data. I-Chart, Boxplot, Pareto, Stats panel. Most common entry point.
2. **Capability.** Cp/Cpk against specifications. Histogram, probability plot. Optional subgroup capability (ADR-038). Used for process qualification and SPC.
3. **Yamazumi** (lean). Activity-level cycle time analysis. Stacked bars by VA/NVA/Waste/Wait (fixed colors), takt line, rebalancing targets. Used by industrial engineers and CI leads.
4. **Performance** (multi-channel). Fill heads, cavities, nozzles. Per-channel Cpk scatter, cross-channel Boxplot comparison, worst-first Pareto. Used by process engineers monitoring multi-stream equipment.
5. **Defect** (events → rates). Event logs transformed into defect rates per time unit. Pareto of defect types, cross-type Evidence Map. Used by quality engineers tracking PPM.
6. **Process Flow** (process-level bottleneck analysis and flow diagnostics).

Mode resolution lives in `packages/core/src/analysisStrategy.ts`. CoScout's methodology coaching adapts per mode.

## Products (V1)

| Tier      | Distribution                          | Price          | What you get                                                                                                                                                                                            |
| --------- | ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PWA**   | Public URL                            | Free           | Full analysis, session-only, no persistence. Training, education, evaluation.                                                                                                                           |
| **Azure** | Azure Marketplace Managed Application | **€120/month** | Full product: Azure tenant-wide, unlimited org users, unlimited projects. Persistence (IndexedDB + Blob), CoScout AI, project membership ACLs, Report sharing, signoff workflows. Optional voice input. |

Same analytical capability everywhere — V1's promise is **one product**, not feature-gating. Team-capability features (photo evidence, Knowledge Catalyst, project membership) are membership-role-gated inside the €120 SKU rather than tier-gated.

A future **VariScout Process** product (enterprise platform with Hub portfolios, process ownership, automated data pipelines, 4-persona model) is named-future on the roadmap; not announced in V1 marketing.

## CoScout — the AI assistant

CoScout is an assistant, not an oracle. It coaches methodology, asks targeted questions, surfaces references, and proposes actions. The deterministic stats engine is the authority on numbers — CoScout quotes it, doesn't override. CoScout is modular (tier1/2/3 prompt layering), mode-aware (methodology coaching varies by analysis mode), and tool-calling (27-tool registry gated by phase/mode). On Azure, CoScout accepts **voice input** in a transcript-first way: speak, text lands in the draft box, review/edit, send. v1 replies remain text.

## Customer-owned data

Processing happens in the browser. When data moves (Blob Storage sync, AI calls, optional Azure voice transcription), it stays in the customer's Azure tenant — no VariScout-operated cloud. This is a core product principle, not a feature. Voice input does not create a durable audio layer; the saved artifact is the transcript inside the normal investigation model.

## Where to go next

- **Canonical V1 design**: [V1 architecture spec](superpowers/specs/2026-05-16-wedge-architecture-design.md)
- **Architectural record**: [ADR-082](07-decisions/adr-082-wedge-architecture.md)
- User flows: [USER-JOURNEYS.md](USER-JOURNEYS.md)
- Data lifecycle (parse → stats → persist → sync): [DATA-FLOW.md](DATA-FLOW.md)
- Investigation Wall + Measurement Plans: [V1 spec §3.6](superpowers/specs/2026-05-16-wedge-architecture-design.md#§36-investigation-wall--measurement-plans)
- Process tab + Canvas: [V1 spec §3.3](superpowers/specs/2026-05-16-wedge-architecture-design.md#§33-process-tab--canvas-substrate--stateedit-modes--specialist-content)
- Mode-specific journeys: `USER-JOURNEYS-{YAMAZUMI,PERFORMANCE,DEFECT,CAPABILITY,PROCESS-FLOW}.md`
- Feature parity: [docs/08-products/feature-parity.md](08-products/feature-parity.md)
- Constitution (10 principles): [docs/01-vision/constitution.md](01-vision/constitution.md)
- Glossary: [glossary.md](glossary.md)
