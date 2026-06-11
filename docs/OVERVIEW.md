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

> **Last material edit 2026-06-11** — V1 now follows [ADR-092](07-decisions/adr-092-local-first-variscout-product-model.md): local-first practical Minitab replacement, artifact-first sharing, and optional Azure services.

VariScout is **local-first structured investigation for process improvement**. A browser-based tool for improvement specialists — quality engineers, Lean practitioners, Six Sigma belts (Green/Black/MBB), CI engineers — to explore variation in process data, connect evidence to the process, drive improvement actions, verify whether changes worked, and export a polished Analysis Pack. Data stays in the customer's environment throughout.

Three ways to use it, all anchored in the same Workspace model:

- **Local Workspace.** Paste data, explore in charts, capture findings, create actions, verify Control, and export `.vrs` / Analysis Packs. No project ceremony required.
- **Company-approved Workspace.** Same local-first experience, distributed or licensed through an IT-approved route such as Azure Marketplace, without requiring customer process data to live in Azure.
- **Formalized Project.** When governance is needed, formalize the Workspace — name it, set a charter, optionally invite teammates (Lead / Member / Sponsor roles), and use customer-tenant services for persistence or sharing.

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

A **Project** wraps a Workspace with formal lifecycle and optional team membership. Use it when governance, persistence, or managed sharing is needed. Skip project ceremony when you are doing private/local analysis and sharing by `.vrs` or Analysis Pack.

| Stage        | Function                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Charter**  | Wrap an existing analysis with project ceremony — problem statement, member invites, optional refined goal. Inherits the Hub's framing (outcome, factors, process map) rather than re-doing it. |
| **Approach** | Analyze strategy → produces suspected causes. Anchor surface is the Investigation Wall (Hypotheses + Findings + Measurement Plans).                                                             |
| **Control**  | "Did it work?" closure — Cpk delta + action completion + drift check. Absorbs the legacy Handoff stage.                                                                                         |

Improvement actions are tracked in the **Improve tab** — a top-level verb tab, not a Project stage.

The internal Hub remains storage vocabulary, not a user-facing product noun. Local `.vrs` and Analysis Packs are file/share artifacts; managed Azure documents are membership-gated only when optional customer-tenant services are enabled.

## Project membership roles

| Role        | Who                                                                    | Access                                                                 |
| ----------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Lead**    | The analyst running the project (typically a belt or project director) | Full edit + manages membership                                         |
| **Member**  | SME, analyst, frontline contributor, quality engineer                  | Full edit within project surfaces                                      |
| **Sponsor** | Executive sponsor / Champion                                           | Reads everywhere (2-tier ACL with Member); signoff handled out-of-band |

Project members must be in the same Azure AD tenant as the buyer. Cross-org collaboration is out of V1 scope (this becomes a deliberate privacy boundary).

## The five analysis modes

1. **Standard** (default). Continuous measurement data. I-Chart, Boxplot, Pareto, Stats panel. Most common entry point.
2. **Capability.** Cp/Cpk against specifications. Histogram, probability plot. Optional subgroup capability (ADR-038). Used for process qualification and SPC.
3. **Performance** (multi-channel). Fill heads, cavities, nozzles. Per-channel Cpk scatter, cross-channel Boxplot comparison, worst-first Pareto. Used by process engineers monitoring multi-stream equipment.
4. **Defect** (events → rates). Event logs transformed into defect rates per time unit. Pareto of defect types, cross-type Evidence Map. Used by quality engineers tracking PPM.
5. **Process Flow** (process-level bottleneck analysis and flow diagnostics).

> Yamazumi mode (lean time study with stacked VA/NVA/Waste/Wait bars) was removed in wedge V1 via PR-LV1-0 (2026-05-28). Process-flow mode covers the flow-analysis use case; activity-classified time-study data is deferred to a future pivot-table capability. See [ADR-034](07-decisions/adr-034-yamazumi-analysis-mode.md) (superseded).

Mode resolution lives in `packages/core/src/analysisStrategy.ts`. CoScout's methodology coaching adapts per mode.

## Products (V1)

| Tier      | Distribution                          | Price          | What you get                                                                                                                                                                                            |
| --------- | ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PWA**   | Public URL                            | Free           | Full local analysis, session-only by default, `.vrs` export/import, Analysis Pack export. Training, education, evaluation, and real local work.                                                          |
| **Company-approved / Azure** | Azure Marketplace or another IT-approved route | **€120/month target** | Licensed/distributed company use. Optional customer-tenant persistence, customer AI, managed sharing, project membership, and governance services.                                                        |

Same analytical capability everywhere — V1's promise is **one product**, not feature-gating. Optional services add company-approved distribution, AI, persistence, governance, and managed sharing.

A future **VariScout Process** product (enterprise platform with Hub portfolios, process ownership, automated data pipelines, 4-persona model) is named-future on the roadmap; not announced in V1 marketing.

## CoScout — the AI assistant

CoScout is an assistant, not an oracle. It coaches methodology, asks targeted questions, surfaces references, and proposes actions. The deterministic stats engine is the authority on numbers — CoScout quotes it, doesn't override. AI is provider-boundary based: no AI, optional customer Azure AI, future local LLM, and future local MCP/agent surfaces.

## Customer-owned data

Processing happens in the browser. The default durable artifacts are user-controlled files: `.vrs` snapshots and Analysis Packs. When optional services are enabled (Blob Storage sync, AI calls, optional Azure voice transcription), data stays in the customer's Azure tenant — no VariScout-operated cloud. This is a core product principle, not a feature.

## Where to go next

- **Canonical V1 design**: [V1 architecture spec](superpowers/specs/2026-05-16-wedge-architecture-design.md)
- **Architectural record**: [ADR-082](07-decisions/adr-082-wedge-architecture.md)
- **Local-first product model**: [ADR-092](07-decisions/adr-092-local-first-variscout-product-model.md)
- User flows: [USER-JOURNEYS.md](USER-JOURNEYS.md)
- Data lifecycle (parse → stats → persist → sync): [DATA-FLOW.md](DATA-FLOW.md)
- Investigation Wall + Measurement Plans: [V1 spec §3.6](superpowers/specs/2026-05-16-wedge-architecture-design.md#§36-investigation-wall--measurement-plans)
- Process tab + Canvas: [V1 spec §3.3](superpowers/specs/2026-05-16-wedge-architecture-design.md#§33-process-tab--canvas-substrate--stateedit-modes--specialist-content)
- Mode-specific journeys: `USER-JOURNEYS-{YAMAZUMI,PERFORMANCE,DEFECT,CAPABILITY,PROCESS-FLOW}.md`
- Feature parity: [docs/08-products/feature-parity.md](08-products/feature-parity.md)
- Constitution (10 principles): [docs/01-vision/constitution.md](01-vision/constitution.md)
- Glossary: [glossary.md](glossary.md)
