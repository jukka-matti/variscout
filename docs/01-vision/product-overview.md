---
title: 'VariScout: Product Overview'
audience: [business, analyst]
category: methodology
status: stable
last-reviewed: 2026-05-16
related: [wedge, adr-082, philosophy, positioning, specifications, feature-parity, journey]
---

# VariScout: Product Overview

## Philosophy

**Methodology is the product.** VariScout is structured investigation for process improvement — question-driven, evidence-based, AI-assisted. The deterministic stats engine is the authority on numbers; CoScout (AI) adds context and methodology coaching.

We deliberately chose investigation depth over statistical breadth. Instead of competing with Minitab on test coverage, we built the investigation methodology (Turtiainen 2019) into the product: FRAME → SCOUT → INVESTIGATE → IMPROVE as the journey spine, question-driven EDA as the core workflow, and three evidence types (data, gemba, expert) as the investigation backbone.

Canonical V1 design lives in the [wedge architecture spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](../07-decisions/adr-082-wedge-architecture.md).

---

## Two products on a roadmap

VariScout ships as **two products on a roadmap**: VariScout V1 first, the platform later.

| Product                        | Audience                                                                                  | Status                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **VariScout (V1, this doc)**   | Improvement specialists running projects with their team                                  | **Ship-target.** One persona, one €120 SKU, project-scoped membership, Azure-tenant-wide.                                 |
| **VariScout Process** (future) | Enterprises with ongoing process ownership, multi-project portfolios, 4-persona workflows | Internal roadmap commitment only. Not announced in V1 marketing; mentioned when customers ask about enterprise use cases. |

The breadth-first features (Hub portfolios, automated data pipelines, Process Owner cadence, 4-persona routing) are not lost — they migrate to VariScout Process as a separate product. V1 is the focused, coherent thing: **the project tool an improvement specialist invites their team to.**

---

## What VariScout V1 does

The Specialist works in two modes, both first-class:

- **Quick analysis.** Paste data, explore in charts, save findings. No project ceremony required. Free PWA supports session-only use; Azure tier adds persistence and CoScout.
- **Project-anchored investigation.** Create a Project (Charter ceremony), invite teammates (Lead / Member / Sponsor roles), run the formal lifecycle Charter → Approach → Improve → Sustainment. Each project produces a Report a Sponsor can sign off.

Internally, paste data lands in a **data container** (called a Hub in code) that is tenant-wide — anyone in the buyer's Azure tenant can analyze without creating a Project. The Project is the optional formal wrapper that adds membership ACLs and lifecycle ceremony. The UI does not surface "Hub" as a noun; users see only Project and Process.

### The journey spine

Both modes follow the same methodological spine:

**FRAME → SCOUT → INVESTIGATE → IMPROVE**

- **FRAME.** State the problem (data-first or hypothesis-first entry). Process map gets sketched in the Process tab Edit mode.
- **SCOUT.** Data is parsed and characterized. Four Lenses of variation emerge (central tendency, spread, pattern, distribution).
- **INVESTIGATE.** Specialist picks suspected causes — data-derived, gemba-observed, or expert-supplied — and examines each with Evidence Map, statistics, and targeted Questions. The Investigation Wall accumulates Findings linked to Hypotheses; Measurement Plans capture what evidence still needs collection (hypothesis-first path).
- **IMPROVE.** Hypotheses converge on improvement actions. Inside a Project this becomes the Improve stage (action tracker), then Sustainment ("did it work? + close").

Mode-specific tooling varies inside each phase; the spine never changes.

---

## V1 navigation

Seven tabs, in workflow order:

```
[Home] [Project] [Process] [Analyze] [Investigation] [Improve] [Report]
```

1. **Home** — pick what you're working on (project queue + active-IP launchpad)
2. **Project** — current project's status overview (Charter → Approach → Sustainment stages)
3. **Process** — canvas / process map (spatial substrate, State + Edit modes)
4. **Analyze** — EDA / charts / Factor Intelligence
5. **Investigation** — Wall + Evidence Map → suspected causes
6. **Improve** — improvement actions, tracked and owned (active-IP cascade from Home)
7. **Report** — narrative output for Sponsor signoff

Improve is a top-level verb tab with active-IP cascade (not buried inside Project detail). Project detail runs three stages: Charter → Approach → Sustainment. Handoff is folded into Sustainment closure.

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

Single SKU. No tier-gating inside Azure; team-collaboration features are project-membership-role-gated within the €120 plan.

| Tier      | Distribution                          | Price          | What you get                                                                                                                                                                   |
| --------- | ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **PWA**   | Public URL                            | Free           | Full analysis, session-only, no persistence. Training, education, evaluation.                                                                                                  |
| **Azure** | Azure Marketplace Managed Application | **€120/month** | Full product, Azure tenant-wide, unlimited org users, unlimited projects. Persistence (IndexedDB + Blob), CoScout AI, project membership ACLs, Report sharing. Voice optional. |

This supersedes the legacy €79 Standard + €199 Team split (see [feature-parity.md](../08-products/feature-parity.md) for the consolidated matrix).

---

## CoScout — the AI assistant

CoScout is an assistant, not an oracle. It coaches methodology, asks targeted questions, surfaces references, and proposes actions. The deterministic stats engine is the authority on numbers — CoScout quotes it, doesn't override. CoScout is modular (tier1/2/3 prompt layering), mode-aware (methodology coaching varies by analysis mode), and tool-calling (27-tool registry gated by phase/mode). On Azure, CoScout accepts voice input transcript-first: speak, text lands in the draft box, review/edit, send. Replies remain text in V1.

---

## Customer-owned data

Processing happens in the browser. When data moves (Blob Storage sync, AI calls, optional Azure voice transcription), it stays in the customer's Azure tenant — no VariScout-operated cloud. This is a core product principle (ADR-059), not a feature. Voice input does not create a durable audio layer; the saved artifact is the transcript inside the normal investigation model.

---

## Design Principles

1. **Offline by default** — Works without internet after first visit.
2. **Data stays local** — Zero VariScout-operated cloud; everything lives in the customer's tenant.
3. **Transparent math** — Show formulas, explain metrics. Deterministic engine is the authority.
4. **CSV exportable** — All data can be opened in Excel.
5. **Linked exploration** — Charts talk to each other through filtering.
6. **Fast to first insight** — Under 30 seconds from paste.
7. **Export-ready outputs** — Professional charts and signoff-ready Report.
8. **Simple over complete** — Do fewer things, do them well. Progressive disclosure for power features (e.g., PDCA workbench behind an "Advanced" toggle in the Improve stage).

---

## Technical Highlights

| Aspect    | Implementation                                                |
| --------- | ------------------------------------------------------------- |
| Runtime   | PWA with Service Worker                                       |
| Framework | React + TypeScript + Vite                                     |
| Styling   | Tailwind v4                                                   |
| Charts    | Visx (D3 primitives)                                          |
| State     | Zustand (3-layer: Document / Annotation / View, ADR-078 + F4) |
| Storage   | IndexedDB (Dexie) + Azure Blob Storage                        |
| Bundle    | ~700KB gzipped                                                |

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
│   ├── stores/            # @variscout/stores - 6 Zustand stores across 3 layers (ADR-078)
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

- 4-persona model (Process Owner / Project Lead / SME / Frontline) — V1 collapses to single Specialist + project-membership roles
- Process Hub as a user-visible primary container — V1 keeps Hub internal-only
- Automated data pipelines (sensor / SCADA / MES / ERP feeds)
- Multi-Hub portfolio scans + cross-Hub orchestration
- Process Measurement System as a separate surface
- Tier-gating philosophy as a public-facing concept
- Cross-Azure-AD-tenant invitations (Azure AD guest accounts handle the edge case)

See [wedge spec §7 + §10](../superpowers/specs/2026-05-16-wedge-architecture-design.md) for the canonical out-of-V1 list.

---

_See also:_

- [Wedge architecture spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md) — V1 canonical anatomy
- [ADR-082](../07-decisions/adr-082-wedge-architecture.md) — Wedge architecture decision
- [USER-JOURNEYS](../USER-JOURNEYS.md) — V1 single-persona spine + project-membership roles
- [OVERVIEW](../OVERVIEW.md) — What VariScout does in practice
- [Feature Parity](../08-products/feature-parity.md) — PWA vs Azure (€120) capability matrix
- [Architecture](../05-technical/architecture.md) — Technical architecture details
- [Specifications](../03-features/specifications.md) — Detailed functional specifications
- [Constitution](constitution.md) — 10 principles, terminology enforcement
