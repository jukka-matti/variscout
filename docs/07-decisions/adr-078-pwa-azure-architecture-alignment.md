---
tier: living
purpose: decide
title: 'ADR-078: PWA + Azure architecture alignment — same product, gated tiers'
audience: human
category: architecture
status: active
date: 2026-05-05
related:
  - adr-012-pwa-browser-only
  - adr-059-web-first-deployment-architecture
  - adr-075-pwa-atomic-deploy-and-update-policy
  - docs/decision-log.md
  - docs/archive/specs/2026-05-04-canvas-migration-design.md
layer: L5
---

# ADR-078: PWA + Azure architecture alignment — same product, gated tiers

**Status**: Accepted

**Date**: 2026-05-05

**Amendments:** 2026-05-16 retires D5 tier-feature gating via [ADR-082](adr-082-wedge-architecture.md); 2026-05-18 records the 9-store F4 reality; 2026-05-31 ratifies the 10-store model and actual package graph; 2026-06-01 updates Azure persistence language for the R6e server-enforced storage boundary. The original D1-D4 shared-architecture decisions remain in force.

**Supersedes**: The "State via React Context (`DataContext`). No Zustand stores in PWA." invariant previously documented in `apps/pwa/CLAUDE.md` (no formal ADR — the rule was an aspirational invariant that drifted silently as the PWA matured).

**Related**:
[ADR-012](adr-012-pwa-browser-only.md) (PWA browser-only processing — preserved),
[ADR-059](adr-059-web-first-deployment-architecture.md) (web-first; Azure tier with Blob Storage — preserved),
[ADR-075](adr-075-pwa-atomic-deploy-and-update-policy.md) (PWA atomic deploy + update policy — preserved),
[Canvas Migration spec](../archive/specs/2026-05-04-canvas-migration-design.md) (referenced for Decision 2's three-layer state separation that this ADR builds on)

---

## Context

VariScout ships in two tiers — a free PWA (`@variscout/pwa`) and a paid Azure app (`@variscout/azure-app`). Through slices 1–4 of the framing-layer rollout, the PWA matured beyond its original "thin viewer for a single dataset" shape into a full hub-aware methodology workspace with column mapping, evidence snapshots, investigation graphs, and (forthcoming) canvas authoring.

Three architectural drift signals accumulated:

1. **`apps/pwa/CLAUDE.md` invariant** stated _"State via React Context (`DataContext`). No Zustand stores in PWA."_ — but PWA components actually import `useProjectStore`, `useSessionStore`, `useWallLayoutStore`, etc. across 15+ files (App.tsx, Dashboard, FrameView, YamazumiDashboard, ProcessIntelligencePanel, WhatIfPage, charts/IChart, charts/Boxplot, charts/ParetoChart, components/data/DataTableModal, settings/SettingsPanel, components/views/InvestigationView, features/findings/**tests**/findingRestore, features/investigation/useWallLayoutLifecycle). The invariant has been false for some time.

2. **Q8 was revised in May 2026** — the persistence story got explicit attention (session-only by default; opt-in IndexedDB Hub-of-one; `.vrs` export/import). The state-management story was never re-evaluated alongside it.

3. **PR #126's review** (canvas migration PR1+PR2+PR3) flagged the FrameView's `useProjectStore` import as a CLAUDE.md invariant violation. Investigation revealed it's not a violation introduced by #126 — it's a longer-running pattern that was first surfaced loudly there.

Three framings are possible:

- **α — Same product, two tiers (gated features).** Azure = full product. PWA = same product with paid features gated off. Identical state architecture; gates via `isPaidTier()`. Maximum code share.
- **β — Two products that share UI primitives.** PWA = methodology-teaching tool. Azure = practitioner platform. Shared `@variscout/ui` components, but app-level orchestration may diverge. Smaller PWA store surface.
- **γ — Same architecture, different persistence.** Same state shapes; persistence is the only tier-gated dimension.

The brainstorm at 2026-05-05 (this ADR's source session) selected α — _"same product, gated tiers"_ — as the dominant framing.

---

## Decision

VariScout adopts **architecture α — same product, gated tiers** as the canonical framing for PWA + Azure.

### D1 — State management: shared domain Zustand stores

The PWA uses the same domain Zustand stores as Azure, imported from `@variscout/stores`:

- `useProjectStore` — project metadata, dataset, outcome, factors, hubs (today)
- `useInvestigationStore` — findings, questions, suspected causes, causal links
- `useImprovementStore` — finalized improvements
- `useSessionStore` — auto-persisted session config (timeLens, etc.)
- `useWallLayoutStore` — Wall-specific UI state
- _Future:_ `useCanvasStore` (5th domain — per Spec 2 / PR4)

The "DataContext only, no Zustand stores in PWA" rule is **superseded** by this ADR. React Context retains a narrower role: app-mount-time providers (theme, sessionStore provider hooks, error service) — not project-level state.

The PWA's existing direct `@variscout/stores` imports across components are the canonical pattern. No prop-drilling shells are needed; no DataContext restoration is needed.

### D2 — Persistence: state shapes shared, persistence implementation tier-gated

State shapes (the data structures held in domain Zustand stores) are tier-agnostic — the same `ProcessHub`, `ProcessHubInvestigation`, `Finding`, `Question`, etc. types live in `@variscout/core` and are used identically by both apps.

Persistence implementation is the tier gate:

| Tier      | Persistence layer                                                                                  | Scope                                                 |
| --------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Azure** | IndexedDB cache (Dexie) + Blob Storage sync via same-origin server APIs backed by managed identity | Project-scoped (multiple hubs, investigation history) |
| **PWA**   | Session-only runtime + `.vrs` file export/import                                                   | One active in-memory document                         |

This honors ADR-012 (PWA browser-only), ADR-059 (Azure web-first with Blob Storage), and R6d (PWA export-only durability + `.vrs` for trainer-shared scenarios). Both apps use the same state shapes; only Azure owns saved workspace identity.

### D3 — Investigation lifecycle (deferred to investigation-loading brainstorm)

When investigations become first-class loaded entities (the investigation-loading semantics brainstorm deferred from slice 4), both apps mount them identically via the same hooks. Multi-investigation-per-hub will be tier-gated (PWA single-Hub-of-one stays single-investigation by Q8 constraint; Azure can have many).

This ADR locks the framing (α — same lifecycle, tier-gated multi); the implementation lands in a future spec.

### D4 — App-level component duplication: prefer extraction to `@variscout/ui`

Where PWA + Azure render the same component shape, the component lives in `@variscout/ui`. Per-app code is limited to the route shell (typically ~40–50 LOC) wiring routing-derived props into the shared component.

**Concrete extraction rule:** when a PR sees byte-for-byte identical code in `apps/pwa/src/...` and `apps/azure/src/...`, the next PR touching either side extracts the duplication to `@variscout/ui`. Per `feedback_no_backcompat_clean_architecture`, the consumers migrate atomically.

**Existing extraction targets** (from observation through slice 4 + PR #126):

- `FrameView` (now byte-for-byte identical post-#126; CanvasWorkspace already absorbed the shared logic — the route shells are 44 LOC each)
- `Dashboard` (likely candidate — confirm next time it's touched)
- `ProcessHubView` (Azure-only today; if PWA gets equivalent, share)
- Drill-down overlay (Spec 3 territory)

This codifies the "apps wire; ui builds" pattern slice 4 already followed implicitly.

### D5 — Tier-feature gating: single canonical pattern via `isPaidTier()`

Tier-gated features check `isPaidTier()` from `@variscout/core/tier` at their mount point — runtime, not compile-time. No conditional imports between apps.

Existing tier gates (preserved):

- **CoScout** (AI assistant) — gated via `isPaidTier()` per Constitution P8
- **Cloud sync** (Blob Storage) — Azure-only deployment; `apps/azure` mounts the sync hooks
- **Evidence Sources** (background ingestion, A.2-evidence-source) — Azure-only per Q8
- **Chart branding** ("VariScout" footer) — gated via `isPaidTier()` (PWA shows; Azure hides)

Future tier gates anticipated:

- **Multi-user collaboration** (CRDT / Yjs) — V2+ paid feature
- **Multi-investigation per hub** (D3) — Azure-only
- **Linked Hubs cross-Hub views** — Spec 5 / V2

**Rule:** any feature that exists in only one tier gates via `isPaidTier()` at its mount point. This is the single canonical pattern; no per-app conditional code paths.

---

## Consequences

### Positive

- **Documentation matches reality.** The PWA CLAUDE.md no longer claims a rule that's been false in practice. Future PRs validate against the actual architecture, not aspirational fiction.
- **Coding + maintenance simpler.** One state architecture, one tier-gating pattern, one extraction rule. New features wire identically across apps.
- **Slice-4-style drift catchable earlier.** The ADR is the source of truth; future PRs that violate it can be caught by reviewers.
- **Reduces duplication pressure.** D4's extraction rule turns "byte-for-byte identical PWA/Azure files" from an accepted pattern into a flag for the next PR to clean up.
- **Investigation lifecycle clarified.** When investigations become first-class, both apps mount them the same way; persistence + multi-investigation are the tier gates.
- **Vision spec alignment.** _"Canvas = same component, same data model, same gestures"_ (vision §5.1) is now load-bearing across both apps' code, not just intent.

### Harder

- **Documentation pass needed.** `apps/pwa/CLAUDE.md` updates in this ADR's commit. Other docs that reference the old "DataContext only" rule (if any) need to be swept (verify via grep).
- **Some past PRs technically violated the old rule.** Not retroactive — only forward-looking. The accumulated divergence is now consciously sanctioned, not accidental.
- **Tier-gating discipline required.** Every new feature must consciously decide tier-gated-or-not. The temptation to "just add a feature" without the gate-check has to be resisted.
- **Extraction rule (D4) takes ongoing vigilance.** Reviewers must watch for byte-for-byte PWA/Azure duplication and flag for `@variscout/ui` extraction. Slice 4's reviewer caught this on FrameView; the rule formalizes the catch.

### Neutral

- **No code changes ship with this ADR** — it's a documentation + architectural-rule decision. The lived code already matches the rule (D1 specifically — PWA already uses Zustand). Migration is doc-first; opportunistic refactor follows per `feedback_no_backcompat_clean_architecture`.
- **Existing one-off PWA / Azure divergences** remain in place until naturally touched. No "rip and replace" sweep.
- **Constitution P8 ("no AI in free tier") is preserved** — α is fully compatible with P8. The free-tier value proposition (browser-only, no AI, education + training) is unchanged; the architecture under the hood just isn't pretending to be smaller than it is.

---

## Alternatives considered

**Framing β — Two products sharing UI primitives.** Rejected. The "education + training tier" branding was real, but it shaped marketing more than engineering. The `.vrs` export/import is a feature, not an architecture. Treating PWA as a different product would introduce accidental two-product complexity (parallel store layers, parallel persistence patterns, duplicated orchestration code) without methodology benefit.

**Framing γ — Same architecture, different persistence.** Rejected as a primary frame. γ is correct about the lived architecture, but it doesn't explain CoScout / Evidence Source / cloud-sync gates — those are tier features, not persistence concerns. α subsumes γ (γ is what α implies for D2 specifically) without leaving the tier-gating story unmodeled.

**Restoration of the original "DataContext only" rule via prop-drilling.** Rejected (this was Codex's option-b on PR #126). Performative — moves the violation up one level (App.tsx instead of FrameView) without restoring the rule. Creates new inconsistency (App.tsx uses store, FrameView doesn't, both are PWA app code). The honest path is to document reality, not perform fiction.

**Real DataContext restoration.** Rejected. Multi-day audit + migration of all PWA Zustand uses to a hand-written DataContext. No methodology benefit; pure busywork. The Zustand pattern is well-established and works.

**Compile-time tier gating** (separate builds with feature flags excluding paid features). Rejected for V1. Runtime `isPaidTier()` checks are simpler, easier to test, and match the precedent (chart branding already uses runtime). Compile-time gating becomes relevant if bundle size becomes a real PWA concern; defer until that smell surfaces.

---

## Amendment — 2026-05-18 — Stores reality

Surfaced during SDD M0 subagent grounding (2026-05-18, `docs/cards/investigations/inv-20260518-sdd-migration-inventory.md`). The D1 stores table above documents 5 stores + 1 "future" (`useCanvasStore`). Actual `packages/stores/src/index.ts` exports **9 stores** across the F4 three-layer model + wedge V1 additions.

**Actual stores (verified 2026-05-18)**:

| Store                        | Layer               | Origin                                                                                |
| ---------------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| `useProjectStore`            | Document            | ADR-078 D1 (unchanged)                                                                |
| `useInvestigationStore`      | Document            | ADR-078 D1 (unchanged)                                                                |
| `useImprovementProjectStore` | Document            | **Renames** `useImprovementStore` from D1 post-wedge V1                               |
| `useCanvasStore`             | Document            | D1 "future" — shipped via 8f viewport architecture                                    |
| `useCanvasViewportStore`     | Annotation-per-hub  | New — viewport split per ADR-081 (8f canvas) (`STORE_LAYER='annotation-per-hub'`)     |
| `useActiveIPStore`           | Annotation-per-user | New — wedge V1 active-IP cascade (`STORE_LAYER='annotation-per-user'`)                |
| `useProjectMembershipStore`  | Annotation-per-user | New — wedge V1 per-project ACLs                                                       |
| `usePreferencesStore`        | Annotation-per-user | **Replaces** D1's `useSessionStore` (durable half) per F4                             |
| `useViewStore`               | View (no persist)   | **Replaces** D1's `useWallLayoutStore` + D1's `useSessionStore` transient half per F4 |

**Three-layer framing** (per `docs/superpowers/specs/2026-05-07-data-flow-foundation-f4-three-layer-state-design.md`): Document (×4), Annotation (×4 — 1 per-hub + 3 per-user), View (×1 — transient, no persist).

**Renames vs original ADR-078**: `useImprovementStore → useImprovementProjectStore` (wedge V1 scoping); `useSessionStore → usePreferencesStore` (durable) + `useViewStore` (transient half) per F4; `useWallLayoutStore → useViewStore` (folded into the transient layer).

**Net additions**: `useActiveIPStore`, `useProjectMembershipStore` (both wedge V1); `useCanvasViewportStore` (8f viewport split).

D1's "same domain stores in PWA + Azure" architectural decision is preserved; the stores list itself drifted. Future updates to the stores list should land in this amendment block or supersede this ADR entirely.

## Amendment — 2026-05-31 — First refactor architecture ratification

The first refactor slice ratifies the store and package-boundary reality observed after the 2026-05-28 linked-views spec.

`useAnalysisScopeStore` is the second View store. It is a session-scoped linked-views bridge for Process tab ↔ Explore tab state, has no persistence middleware, and belongs in the View layer because it does not survive reloads.

The actual store count is now **10 Zustand stores** across the F4 three-layer model:

- Document ×4
- Annotation ×4 (1 per-hub + 3 per-user)
- View ×2 (`useViewStore`, `useAnalysisScopeStore`)

The actual package dependency graph is:

- `@variscout/core` is the foundation.
- `@variscout/data`, `@variscout/charts`, and `@variscout/stores` depend on `@variscout/core`.
- `@variscout/hooks` depends on `@variscout/core`, `@variscout/data`, and `@variscout/stores`.
- `@variscout/ui` depends on `@variscout/core`, `@variscout/charts`, `@variscout/hooks`, and `@variscout/stores`.
- Apps consume shared packages and own app-level wiring.

`@variscout/ui -> @variscout/stores` is a documented exception for store-aware shared surfaces. Props-based UI remains preferred when state can be supplied cleanly by the caller, but shared workflow surfaces may bind to stores directly when that is the established cross-app contract.

## Amendment — 2026-06-01 — R6e Azure storage boundary

D2's tier-gated persistence decision still holds: PWA is session + `.vrs`
export/import, while Azure owns saved workspace identity through IndexedDB +
customer-tenant Blob Storage. R6e updates the Azure storage access mechanism:
project document list/load/save flows through same-origin server APIs that
enforce the R6c document access model before Blob operations. Production Blob
access uses App Service managed identity and Azure RBAC. Broad browser
container SAS is not the V1 production boundary, and storage account connection
strings / Shared Key credentials are local-dev/test-only.

## References

- VariScout Constitution P8 (no AI in free tier)
- VariScout vision spec §5.1, §5.7 (Canvas + CoScout): `docs/archive/specs/2026-05-03-variscout-vision-design.md`
- Canvas Migration spec (Decision 2 — three-layer state): `docs/archive/specs/2026-05-04-canvas-migration-design.md`
- Q8-revised (PWA persistence): `docs/decision-log.md` 2026-05-03 entry
- ADR-012 (PWA browser-only)
- ADR-059 (web-first; Azure with Blob Storage)
- ADR-075 (PWA atomic deploy + update policy)
- `apps/pwa/CLAUDE.md` (updated by this ADR's commit)
- `apps/azure/CLAUDE.md` (referenced; remains the canonical "Azure tier" rules)
- Slice 4 retro learnings: `feedback_slice_size_cap`, `feedback_plan_call_site_reachability`, `feedback_partial_integration_policy`, `feedback_one_worktree_per_agent`
- PR #126 review (the trigger for this brainstorm): https://github.com/jukka-matti/variscout/pull/126#issuecomment-4377093546

---

## Status

Accepted (2026-05-05). Documentation pass (D1-D5) lands in the ADR's commit. Future PRs validate against this ADR's rules.

## Supersedes / superseded by

- Supersedes: the `apps/pwa/CLAUDE.md` "State via React Context (DataContext). No Zustand stores in PWA." invariant.
- Superseded by: none (active).
- Related: ADR-012 (preserved — PWA still browser-only), ADR-059 (preserved — Azure still cloud-tier), ADR-075 (preserved — PWA atomic deploy unchanged).
