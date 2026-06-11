---
tier: stable
purpose: orient
title: VariScout — What It Does In Practice
audience: human
category: reference
status: active
last-reviewed: 2026-06-11
related: [product-overview, modes, single-sku, coscout, journey, v1-architecture, local-first]
---

# VariScout — What It Does In Practice

> **Last material edit 2026-06-11** — V1 now follows [ADR-092](07-decisions/adr-092-local-first-variscout-product-model.md) + [ADR-093](07-decisions/adr-093-v1-simplification-cuts.md): local-first desktop Minitab replacement, the consultation loop as the collaboration model, three access channels. Live membership, cloud persistence, and mobile are deleted from V1 (sweeps pending — some sections below describe shipped code scheduled for deletion and are marked accordingly).

VariScout is **local-first structured investigation for process improvement**. A browser-based tool for improvement specialists — quality engineers, Lean practitioners, Six Sigma belts (Green/Black/MBB), CI engineers — to explore variation in process data, connect evidence to the process, drive improvement actions, verify whether changes worked, and export a polished Analysis Pack. Data stays in the customer's environment throughout.

Three access channels, all anchored in the same Workspace model (ADR-093 D5):

- **Free web deployment.** Paste data, explore in charts, capture findings — the full analysis loop, in-session only. No save/export, no AI.
- **Individual (€17+VAT/mo or €99+VAT/yr via Paddle).** Installable desktop PWA on your own machine: adds `.vrs` save, Analysis Pack export, the consultation loop, and BYOK CoScout (your own AI key).
- **Company (€120/mo via Azure Marketplace).** Deployed in the customer's own tenant, tenant-wide: the artifact layer plus IT-governed CoScout and the security review pack.

When governance is needed, formalize the Workspace into a Project — a solo act (name, charter, lifecycle); there is no membership or invite flow (ADR-093 D1). Collaboration runs through the [consultation loop](superpowers/specs/2026-06-11-consultation-loop-design.md): question-carrying packs out, expert knowledge back as analyst-accepted evidence.

Canonical V1 design lives in the [V1 architecture spec](superpowers/specs/2026-05-16-wedge-architecture-design.md), [ADR-082](07-decisions/adr-082-wedge-architecture.md), and the local-first reframing in [ADR-092](07-decisions/adr-092-local-first-variscout-product-model.md).

## The journey model

Every investigation follows one methodological spine:

**Process → Explore → Analyze → Improve → Control → Report**

- **Process.** Map the process, orient the measure, specs, steps, and likely sources of variation.
- **Explore.** Data is parsed and characterized. Four Lenses of variation emerge (central tendency, spread, pattern, distribution).
- **Analyze.** Pick suspected causes — data-derived, gemba-observed, or expert-supplied — and examine each with the Evidence Map, statistics, and targeted questions. The Investigation Wall accumulates Findings linked to Hypotheses; Measurement Plans capture what evidence still needs collection.
- **Improve.** Hypotheses converge on improvement actions: owner, due date, expected effect, linked evidence.
- **Control.** Verify whether the change held.
- **Report.** Export an Analysis Pack for the right audience.

The spine never changes. Analysis modes vary the tools used inside each phase.

## Project — the optional formal wrapper

A **Project** wraps a Workspace with formal lifecycle. Use it when the work needs a charter, stage discipline, and a closeable record. Skip project ceremony when you are doing private analysis and sharing by `.vrs` or Analysis Pack.

| Stage        | Function                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Charter**  | Wrap an existing analysis with project ceremony — problem statement, optional refined goal. Inherits the Hub's framing (outcome, factors, process map) rather than re-doing it. |
| **Approach** | Analyze strategy → produces suspected causes. Anchor surface is the Investigation Wall (Hypotheses + Findings + Measurement Plans).                                             |
| **Control**  | "Did it work?" closure — Cpk delta + action completion + drift check. Absorbs the legacy Handoff stage.                                                                         |

Improvement actions are tracked in the **Improve tab** — a top-level verb tab, not a Project stage.

The internal Hub remains storage vocabulary, not a user-facing product noun. Local `.vrs` and Analysis Packs are file/share artifacts.

## Project membership roles — retired by decision

> **Scheduled for deletion (ADR-093 D1, 2026-06-11).** The Lead / Member / Sponsor role model, invites, and per-project ACLs are deleted from V1 — formalization is a solo act, and collaboration runs through the consultation loop. The role code described in older docs still exists until the deletion sweep lands; do not build on it. "Sponsor" survives only as a Report/pack audience. Multi-user workspaces re-emerge in VariScout Process (future).

## The five analysis modes

1. **Standard** (default). Continuous measurement data. I-Chart, Boxplot, Pareto, Stats panel. Most common entry point.
2. **Capability.** Cp/Cpk against specifications. Histogram, probability plot. Optional subgroup capability (ADR-038). Used for process qualification and SPC.
3. **Performance** (multi-channel). Fill heads, cavities, nozzles. Per-channel Cpk scatter, cross-channel Boxplot comparison, worst-first Pareto. Used by process engineers monitoring multi-stream equipment.
4. **Defect** (events → rates). Event logs transformed into defect rates per time unit. Pareto of defect types, cross-type Evidence Map. Used by quality engineers tracking PPM.
5. **Process Flow** (process-level bottleneck analysis and flow diagnostics).

> Yamazumi mode (lean time study with stacked VA/NVA/Waste/Wait bars) was removed in wedge V1 via PR-LV1-0 (2026-05-28). Process-flow mode covers the flow-analysis use case; activity-classified time-study data is deferred to a future pivot-table capability. See [ADR-034](07-decisions/adr-034-yamazumi-analysis-mode.md) (superseded).

Mode resolution lives in `packages/core/src/analysisStrategy.ts`. CoScout's methodology coaching adapts per mode.

## Products (V1)

| Channel        | Distribution                                         | Price                        | What you get                                                                                                                                 |
| -------------- | ---------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Free**       | Public URL                                           | Free                         | Full in-session analysis. No save/export (build-time gate), no AI. Training, education, evaluation.                                          |
| **Individual** | Installable desktop PWA, Paddle-gated app origin     | **€17+VAT/mo or €99+VAT/yr** | Artifact layer (`.vrs`, Analysis Packs, consultation loop) + BYOK CoScout (own AI key, direct browser→provider calls). Personal-use license. |
| **Company**    | Azure Marketplace, deployed in the customer's tenant | **€120/month per tenant**    | Tenant-wide use, artifact layer, CoScout on the tenant's IT-governed AI endpoint, security review pack.                                      |

Same analytical capability everywhere — V1's promise is **one product**, not feature-gating. Channels differ by license scope, delivery, and AI governance (ADR-093 D5).

A future **VariScout Process** product (enterprise platform with Hub portfolios, process ownership, automated data pipelines, 4-persona model) is named-future on the roadmap; not announced in V1 marketing.

## CoScout — the AI assistant

CoScout is an assistant, not an oracle. It coaches methodology, asks targeted questions, surfaces references, and proposes actions. The deterministic stats engine is the authority on numbers — CoScout quotes it, doesn't override. AI is provider-boundary based: no AI (free), BYOK (individual — own key, direct calls), customer Azure AI (company — IT-governed), future local LLM, and future local MCP/agent surfaces.

## Customer-owned data

Processing happens in the browser. The durable artifacts are user-controlled files: `.vrs` snapshots and Analysis Packs — there is no cloud document store (ADR-093). AI calls go to the customer's own endpoint (tenant or BYOK key) — no VariScout-operated cloud, ever. This is a core product principle, not a feature.

## Where to go next

- **Canonical V1 design**: [V1 architecture spec](superpowers/specs/2026-05-16-wedge-architecture-design.md)
- **Architectural record**: [ADR-082](07-decisions/adr-082-wedge-architecture.md)
- **Local-first product model**: [ADR-092](07-decisions/adr-092-local-first-variscout-product-model.md) + [ADR-093 simplification cuts](07-decisions/adr-093-v1-simplification-cuts.md)
- **Collaboration model**: [Consultation-loop spec](superpowers/specs/2026-06-11-consultation-loop-design.md)
- User flows: [USER-JOURNEYS.md](USER-JOURNEYS.md)
- Data lifecycle (parse → stats → persist → sync): [DATA-FLOW.md](DATA-FLOW.md)
- Investigation Wall + Measurement Plans: [V1 spec §3.6](superpowers/specs/2026-05-16-wedge-architecture-design.md#§36-investigation-wall--measurement-plans)
- Process tab + Canvas: [V1 spec §3.3](superpowers/specs/2026-05-16-wedge-architecture-design.md#§33-process-tab--canvas-substrate--stateedit-modes--specialist-content)
- Mode-specific journeys: `USER-JOURNEYS-{YAMAZUMI,PERFORMANCE,DEFECT,CAPABILITY,PROCESS-FLOW}.md`
- Feature parity: [docs/08-products/feature-parity.md](08-products/feature-parity.md)
- Constitution (10 principles): [docs/01-vision/constitution.md](01-vision/constitution.md)
- Glossary: [glossary.md](glossary.md)
