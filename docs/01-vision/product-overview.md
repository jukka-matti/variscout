---
tier: stable
purpose: orient
title: 'VariScout: Product Overview'
audience: human
category: methodology
status: active
last-reviewed: 2026-06-11
related: [adr-082, philosophy, positioning, specifications, feature-parity, journey]
layer: L1
---

# VariScout: Product Overview

> **Last material edit 2026-06-11** — V1 positioning reframed around [ADR-092](../07-decisions/adr-092-local-first-variscout-product-model.md) + [ADR-093](../07-decisions/adr-093-v1-simplification-cuts.md): local-first desktop Workspace, practical Minitab displacement, the consultation loop as the collaboration model, three access channels (free / individual / company). Live membership, cloud persistence, and mobile are deleted from V1.

## Philosophy

**Methodology is the product.** VariScout is local-first structured investigation for process improvement — question-driven, evidence-based, and optionally AI-assisted. The deterministic stats engine is the authority on numbers; AI and agents add context, critique, narrative, and methodology coaching.

We deliberately choose investigation depth over statistical breadth. VariScout is a practical Minitab alternative for the work improvement specialists do every week: understand variation, connect it to the process, decide what to change, verify whether the change held, and share a credible evidence pack. It does not try to clone every statistical procedure in a broad statistics suite.

The V1 spine is **Process → Explore → Analyze → Improve → Control → Report**. The Process tab is strategic: Minitab analyzes datasets; VariScout analyzes the process behind the data and carries the work through improvement and Control.

Canonical V1 design lineage lives in the [V1 architecture spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md), [ADR-082](../07-decisions/adr-082-wedge-architecture.md), and the local-first reframing in [ADR-092](../07-decisions/adr-092-local-first-variscout-product-model.md).

---

## Two products on a roadmap

VariScout ships as **two products on a roadmap**: local-first VariScout V1 first, the platform later.

| Product                        | Audience                                                                                  | Status                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **VariScout (V1, this doc)**   | Improvement specialists replacing the practical Minitab + Excel + PowerPoint workflow     | **Ship-target.** Local-first Workspace; free PWA; optional company-approved/Azure distribution and services.              |
| **VariScout Process** (future) | Enterprises with ongoing process ownership, multi-project portfolios, 4-persona workflows | Internal roadmap commitment only. Not announced in V1 marketing; mentioned when customers ask about enterprise use cases. |

The breadth-first features (Hub portfolios, automated data pipelines, Process Owner cadence, 4-persona routing) are not lost — they migrate to VariScout Process as a separate product. V1 is the focused, coherent thing: **a private process improvement workspace that can produce shareable evidence without needing a live collaboration platform.**

---

## What VariScout V1 does

The Specialist works in a **Workspace** — the place they bring data, map the process, explore variation, analyze evidence, plan improvements, verify Control, and compile the report.

Three access channels, one Workspace (ADR-093 D5):

- **Free web deployment.** Paste data, explore charts, capture findings — the full analysis loop, in-session only. No save/export (build-time gate), no AI. Training, education, evaluation.
- **Individual (€17+VAT/mo or €99+VAT/yr via Paddle).** Installable desktop PWA on the user's own machine; adds the artifact layer (`.vrs` save, Analysis Packs, the consultation loop) and BYOK CoScout (the user's own AI key, direct browser→provider).
- **Company (€120/mo via Azure Marketplace).** Deployed into the customer's own tenant, tenant-wide users; the artifact layer plus CoScout on the tenant's IT-governed AI endpoint and the security review pack.

When the work needs governance, the Specialist **formalizes** the Workspace into a Project — name it, set a charter, run Charter → Approach → Control. Formalization is a solo act: there is no membership, invite flow, or roles (deleted per ADR-093 D1). The Sponsor is a Report/pack _audience_; sign-off is optional and out-of-band. Collaboration runs through the [consultation loop](../superpowers/specs/2026-06-11-consultation-loop-design.md).

Every Workspace is backed by exactly one Project from first data entry; that Project stays **informal** (no project chrome) until a deliberate formalization act. There is no "activate / exit / switch project" — the Workspace's one Project is always the context; you narrow and broaden attention with **Analysis Scope** (outcome · factor · process step · filters), the only active lens. Internally a Workspace is backed by a **Hub** storage container (code-only — never a user-facing noun); multi-project portfolios are a VariScout Process (future) concern, not V1.

### The journey spine

Both modes follow the same methodological spine:

**Process → Explore → Analyze → Improve → Control → Report**

- **Process.** Sketch the process, orient the measure, specs, steps, and likely sources of variation.
- **Explore.** Data is parsed and characterized. Four Lenses of variation emerge (central tendency, spread, pattern, distribution).
- **Analyze.** The canvas-first **Investigation Wall** is home: the **Finding is the unit of evidence**, linked to hypotheses / suspected causes (data-derived, gemba-observed, or expert-supplied), with statistics and the demoted, read-only **Evidence Map** as supporting lenses. Measurement Plans capture what evidence still needs collecting (hypothesis-first path).
- **Improve.** Hypotheses converge on improvement actions: owner, due date, expected effect, and linked evidence.
- **Control.** Did it work? Verify the improvement held, then close the project (Handoff folds into Control closure).
- **Report.** Export an Analysis Pack: a self-contained evidence artifact for executives, technical reviewers, reproducibility, or redacted external sharing.

Mode-specific tooling varies inside each phase; the spine never changes.

---

## V1 navigation

Seven tabs, in workflow order:

```
[Home] [Project] [Process] [Explore] [Analyze] [Improve] [Report]
```

1. **Home** — resume your last Workspace, or start a new one (no portfolio browser)
2. **Project** — the current Workspace's formal layer: status overview (Charter → Approach → Control stages), present once the Workspace is formalized
3. **Process** — canvas / process map (spatial substrate; direct-manipulation — no mode toggle)
4. **Explore** — EDA / charts / Factor Intelligence
5. **Analyze** — the canvas-first Investigation Wall (Findings + suspected causes); Evidence Map is a demoted read-only lens
6. **Improve** — improvement actions, tracked and linked to evidence
7. **Report** — narrative output and Analysis Pack export

Improve is a top-level verb tab, not buried inside Project detail. Project detail remains the optional formalization layer (Charter → Approach → Control) rather than the default product center. Handoff is folded into Control closure.

---

## The six analysis modes

1. **Standard** (default). Continuous measurement data. I-Chart, Boxplot, Pareto, Stats panel.
2. **Capability.** Cp/Cpk against specifications. Histogram, probability plot. Optional subgroup capability (ADR-038).
3. **Yamazumi** (lean). Activity-level cycle time analysis. Stacked bars by VA/NVA/Waste/Wait, takt line.
4. **Performance** (multi-channel). Fill heads, cavities, nozzles. Per-channel Cpk scatter, cross-channel Boxplot, worst-first Pareto.
5. **Defect** (events → rates). Event logs transformed into defect rates per time unit. Pareto + Evidence Map.
6. **Process Flow** (process-level bottleneck analysis and flow diagnostics).

Mode resolution lives in `packages/core/src/analysisStrategy.ts`. CoScout's methodology coaching adapts per mode.

---

## Pricing (V1)

One product, three access channels — a license-scope ladder, never a feature ladder (ADR-093 D5). The paid product runs on the user's machine or in the customer's tenant; the public website carries only the free deployment.

| Channel        | Distribution                                         | Price                        | What you get                                                                                                                |
| -------------- | ---------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Free**       | Public URL                                           | Free                         | Full in-session analysis. No save/export (build-time gate), no AI. Training, education, evaluation.                         |
| **Individual** | Installable desktop PWA, Paddle-gated app origin     | **€17+VAT/mo or €99+VAT/yr** | Artifact layer (`.vrs`, Analysis Packs, consultation loop) + BYOK CoScout (own AI key, direct calls). Personal-use license. |
| **Company**    | Azure Marketplace, deployed in the customer's tenant | **€120/month per tenant**    | Tenant-wide use, artifact layer, CoScout on the tenant's IT-governed AI endpoint, security review pack.                     |

This supersedes the legacy €79 Standard + €199 Team split (see [feature-parity.md](../08-products/feature-parity.md) for the consolidated matrix).

---

## CoScout — the AI assistant

CoScout is an assistant, not an oracle. It coaches methodology, asks targeted questions, surfaces references, and proposes actions. The deterministic stats engine is the authority on numbers — CoScout quotes it, doesn't override.

The AI boundary is provider-based:

- **No AI** — deterministic local analysis only (the free deployment).
- **Customer Azure AI** — CoScout calls the customer's Azure OpenAI / Foundry endpoint (company channel; IT-governed).
- **BYOK** — the individual user's own AI key; direct browser→provider calls against a supported-provider list, never a VariScout-operated proxy.
- **Future local LLM** — on-device or local-network model support when practical.
- **Future MCP agent** — Claude Code or another company-approved agent reads a controlled workspace bundle or local VariScout MCP tools.

No AI provider silently mutates canonical workspace state. Agents review, draft, critique, and propose; the analyst confirms.

---

## Customer-owned data

Processing happens in the browser. The durable artifacts are user-controlled files: `.vrs` snapshots and Analysis Packs — there is no cloud document store (ADR-093). AI calls go to the customer's own endpoint (tenant or BYOK key) — no VariScout-operated cloud, ever. This is a core product principle (ADR-059, ADR-092, ADR-093), not a feature.

---

## Design Principles

1. **Offline by default** — Works without internet after first visit (paid channels; the free deployment is online-evaluation).
2. **Local-first data** — Browser processing and user-controlled files; no cloud document store. Desktop browsers only (ADR-093 D3).
3. **Transparent math** — Show formulas, explain metrics. Deterministic engine is the authority.
4. **CSV exportable** — All data can be opened in Excel.
5. **Linked exploration** — Charts talk to each other through filtering.
6. **Fast to first insight** — Under 30 seconds from paste.
7. **Export-ready outputs** — Professional charts, signoff-ready Report, and polished HTML Analysis Packs.
8. **Simple over complete** — Do fewer things, do them well. Progressive disclosure for power features (e.g., PDCA workbench behind an "Advanced" toggle in the Improve tab).

---

## Technical Highlights

| Aspect    | Implementation                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Runtime   | PWA with Service Worker                                                                                                                          |
| Framework | React + TypeScript + Vite                                                                                                                        |
| Styling   | Tailwind v4                                                                                                                                      |
| Charts    | Visx (D3 primitives)                                                                                                                             |
| State     | Zustand (3-layer: Document / Annotation / View, ADR-078 + F4)                                                                                    |
| Storage   | In-memory + `.vrs` snapshot + local autosave (IndexedDB); no cloud document store (ADR-093; Blob/EasyAuth-document stack scheduled for deletion) |
| Bundle    | ~700KB gzipped                                                                                                                                   |

---

## Repository Structure

VariScout is a pnpm monorepo with shared packages and multiple apps:

```
variscout-lite/
├── packages/
│   ├── core/              # @variscout/core - Stats, parser, glossary (pure TypeScript)
│   ├── charts/            # @variscout/charts - Visx chart components
│   ├── data/              # @variscout/data - Sample datasets with pre-computed chart data
│   ├── hooks/             # @variscout/hooks - Shared React hooks
│   ├── stores/            # @variscout/stores - 9 Zustand stores across 3 layers (ADR-078)
│   └── ui/                # @variscout/ui - Shared UI components
├── apps/
│   ├── pwa/               # PWA (React + Vite) — free training tool, session-only
│   ├── azure/             # Azure Managed Application (EasyAuth + Blob)
│   └── website/           # Marketing website (Astro + React Islands)
└── docs/                  # Documentation
```

---

## VariScout Process — explicit deferrals (out of V1)

The following migrate to VariScout Process as a future, separate product. Not "coming soon" inside V1:

- 4-persona model (Process Owner / Project Lead / SME / Frontline) — V1 collapses to single Specialist + project-membership roles (V1 spec §3.5; canonical design: [four-personas.md](variscout-process/four-personas.md))
- Process Hub as a user-visible primary container — V1 keeps Hub internal-only
- Automated data pipelines (sensor / SCADA / MES / ERP feeds)
- Multi-Hub portfolio scans + cross-Hub orchestration
- Process Measurement System as a separate surface
- Tier-gating philosophy as a public-facing concept
- Cross-Azure-AD-tenant invitations (Azure AD guest accounts handle the edge case)

The following are **deleted from V1** by ADR-093 (not deferred features — scheduled code deletions; multi-user collaboration re-emerges only in VariScout Process):

- Live multi-user project collaboration (membership, roles, invites, ACLs)
- Customer-tenant Blob persistence / cloud document identity
- Mobile and touch-specific surfaces (desktop-only hard cut)

And the following stay named-future:

- Local LLM / MCP agent execution as shipped behavior
- A true downloadable desktop build (Tauri) for air-gapped demand

See [V1 spec §7 + §10](../superpowers/specs/2026-05-16-wedge-architecture-design.md) for the canonical out-of-V1 list.

---

_See also:_

- [V1 architecture spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md) — V1 canonical anatomy
- [ADR-082](../07-decisions/adr-082-wedge-architecture.md) — V1 architecture decision
- [USER-JOURNEYS](../USER-JOURNEYS.md) — V1 single-persona spine + project-membership roles
- [OVERVIEW](../OVERVIEW.md) — What VariScout does in practice
- [Feature Parity](../08-products/feature-parity.md) — PWA vs Azure (€120) capability matrix
- [Architecture](../05-technical/architecture.md) — Technical architecture details
- [Specifications](../03-features/specifications.md) — Detailed functional specifications
- [Constitution](constitution.md) — 10 principles, terminology enforcement
