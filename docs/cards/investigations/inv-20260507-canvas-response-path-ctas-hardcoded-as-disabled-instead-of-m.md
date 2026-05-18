---
title: 'Canvas response-path CTAs hardcoded as disabled instead of mode-aware (vision §5.3 + §2.4)'
purpose: remember
tier: card
status: archived
date: 2026-05-07
topic: ['investigation', 'resolved']
surfaced-date: 2026-05-06
verified-against-commit: 6f51f080
last-verified: 2026-05-18
---

> **Archived investigation card** — closed 2026-05-07 (resolved); extracted from `docs/investigations.md` on 2026-05-18. Live queue: [`ephemeral/investigations.md`](../../ephemeral/investigations.md). Card index: [`cards/investigations/`](../investigations/).

# Canvas response-path CTAs hardcoded as disabled instead of mode-aware (vision §5.3 + §2.4)

**Surfaced by:** Canvas PR5 retrospective design review, 2026-05-06 (`packages/ui/src/components/Canvas/internal/CanvasStepOverlay.tsx:276-294`).

**Description:** Vision §5.3 and §2.4 prescribe **five mode-aware response-path CTAs**: Quick action / Focused investigation / Charter / Sustainment / Handoff. Cadence-mode (mature Hub) shows all five active; first-time/no-Hub mode (PWA free tier) shows Quick action + Focused investigation active and dims the rest with a tier-upgrade hint. Codex hardcoded Charter / Sustainment / Handoff as **permanently `disabled`** — wrong UX signal: users see "permanently broken" instead of "tier-gated, here's why."

**Possible directions:**

- Hub-maturity signal: thread `mode: 'cadence' | 'first-time' | 'demo'` through `CanvasWorkspace` → `Canvas` → `CanvasStepOverlay`. Compute from `assignmentsComplete && stepsAuthored && hasPriorSnapshot`.
- Access gate: check `canAccess()` from `@variscout/core/projectMembership` for Charter / Sustainment features. `isPaidTier()` retired in V1 (single SKU) — see ADR-082.
- First-time-Hub copy: dimmed CTAs with tooltip "Available once your Hub has cadence" (or similar).
- Mode boundary: separate "mode" (drill-down content) from "tier" (paid feature gating); they are conflated in the current code.

**Promotion path:** PR8a of the canvas migration sequence. ~5 tasks: thread mode signal, compute hub-maturity, replace `disabled` with tier-aware affordances + copy.

**Resolution:** PR8-8a — `computeCtaState` helper + 2-state CTA rendering (`active` / `prerequisite-locked`). All five paths free-tier-active per Q2 (tier reframe). Charter has no workflow prerequisite per DMAIC Define-phase research. Stub destinations ship for Charter / Sustainment / Handoff; full surfaces deferred to per-path slices listed below.

> **Wedge V1 supersession (2026-05-16):** Canvas response paths collapse from 5 → 3 (Investigate / Quick Action / Charter). Sustainment auto-fires (ADR-080); Handoff path is retired (folded into Sustainment). `computeCtaState` and stub destinations for Sustainment / Handoff are now dead code — removal deferred to a dedicated deletion sweep.
