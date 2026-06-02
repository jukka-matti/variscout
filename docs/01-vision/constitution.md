---
tier: stable
purpose: orient
title: 'VariScout Constitution'
audience: human
category: architecture
status: active
related: [philosophy, methodology, architecture, journey]
layer: L1
last-verified: 2026-06-02
verified-against-commit: c289d920
---

# VariScout Constitution

Non-negotiable principles that govern every architectural decision and implementation.

## Product Identity

1. **Nested improvement methodology** — Process Hub is the operating spine for recurring process-owner cadence and team improvement. **Frame → Explore → Analyze → Improve → Control** is the investigation spine inside each hub investigation. Asking questions of the data is the reasoning practice — scope-first (the `Question` _entity_ is retired per ADR-085; scope + hypotheses are the tracked entities). Survey is the horizontal readiness evaluator across phases. Contribution, not causation.

2. **Same analysis everywhere** — PWA and Azure share identical **analytical** capability (Four Lenses, Factor Intelligence, scope-first investigation, the full journey). Collaboration, persistence, and AI scale by app + project role: PWA is session-only (no AI); Azure (the single €120 SKU) adds persistence, CoScout AI, cloud sync, photo evidence, and the Knowledge Base — team features gated by project-membership role, not by tier. Core analysis is constant.

3. **Customer-owned data** — All processing happens in the browser. When data moves (Blob Storage sync, AI calls), it stays in the customer's Azure tenant. No VariScout-owned service touches customer data.

## Methodology

4. **Four Lenses simultaneously** — I-Chart, Boxplot, Pareto, and Stats are shown together with linked filtering. Each lens reveals what the others miss. The analyst's eye does the integration.

5. **Inquiry drives investigation** (Turtiainen 2019) — asking questions of the data, not asserting theories, is the reasoning practice. (The `Question` _entity_ is retired per ADR-085; question generation is now transient factor-node metadata, and the tracked entities are the **scope** + **hypotheses**.) Three legitimate entry points: (1) **upfront hypotheses** captured during Frame (Analysis Brief — analyst's prior beliefs before any data), (2) **evidence-ranked factors** surfaced by Factor Intelligence once data loads, and (3) **observation-triggered drilling** from the Four Lenses. Drilling sharpens the Issue Statement into a first-class Problem-Statement scope. Multiple suspected causes are correct outcomes, not failures.

6. **Evidence-based drilling** — Drill into data iteratively, guided by statistical evidence (η² for factor effect size, R²adj for factor ranking via Factor Intelligence). The boxplot visual and StdDev comparison reveal which categories to investigate. Filter chips show sample count (n=X) to keep the analyst aware of data sufficiency.

7. **Three evidence types** — Investigation questions are validated by data (auto η²/R²adj), gemba (go-and-see with photo evidence), or expert knowledge. Collaboration routes tasks and observations to the right people (web links, shared Blob Storage, future channel webhooks). No variation problem is solved from a desk alone.

## V1 Wedge Principles

These principles encode the 2026-05-16 single-SKU pivot. They scope V1; VariScout Process (enterprise) is named-future. Canonical source: [2026-05-16 Wedge Architecture design spec](../superpowers/specs/2026-05-16-wedge-architecture-design.md) + [ADR-082](../07-decisions/adr-082-wedge-architecture.md).

8. **Single-product specialist tool** — V1 ships as one SKU: €120/mo Azure tenant-wide, sold to improvement specialists. No tier ladder, no portfolio rollouts in V1. VariScout Process (multi-Hub enterprise) is named-future and out of V1 scope.

9. **Three in-project personas** — Lead, Member, Sponsor — per-project ACLs scoped to a single Azure AD tenant (no cross-tenant invites). These are in-product roles, distinct from the buyer/ICP "Improvement Specialist" (which lives in market positioning, not in-product journeys). Project membership replaces the legacy 10-persona model for V1.

10. **7-tab workflow nav** — `Home · Project · Process · Explore · Analyze · Improve · Report`. The order matches the investigator's day. Improve is a top-level verb tab with active-IP cascade (`useActiveIPContext(sessionHub)` + `<NoActiveProjectGuidance>` empty state pattern) — not a sub-step of another tab.

11. **Light-colors-only UI palette** — Tailwind 50-300 utilities for surfaces; 400-700 for text and strokes. No dark mode in V1. No deep-saturated fills. Pair every light surface with darker text (600-800) for accessibility per the [`feedback_green_400_light_contrast`](../cards/memory/feedback_green_400_light_contrast.md) precedent. Rationale: clinical/paper-document feel; accessibility-first. Agent-canonical home: [`.claude/INVARIANTS.md`](../../.claude/INVARIANTS.md) §Visual design; build-time enforcement: [`packages/ui/CLAUDE.md`](../../packages/ui/CLAUDE.md) §Color discipline.

12. **Real product specs first, then code** — Design specs in `docs/superpowers/specs/` propose deltas to L1/L2/L3 product docs (`docs/01-vision/`, `docs/02-journeys/`, `docs/03-features/`); those targets are updated BEFORE code lands. After delivery, design specs archive to `docs/archive/specs/`; the product docs become the durable record. See the [Spec-Driven Development design](../superpowers/specs/2026-05-18-spec-driven-development-design.md) for the full lifecycle.

## Architecture

13. **Deterministic first, AI enhances** — The statistical engine computes the answer. CoScout adds language, context, and suggestions. The analyst confirms before any action executes. Conclusions are reproducible and auditable.

14. **Shared packages, props-based** — `@variscout/core` (pure TypeScript, no React), `@variscout/charts` and `@variscout/ui` (React, props-only, no context dependency). Apps wire context. Dependencies flow strictly downward.

15. **Strategy pattern for modes** — `resolveMode()` + `getStrategy()` is the sole source of truth for mode-specific behavior (chart slots, KPI type, question strategy, AI coaching). No cascading mode ternaries.
