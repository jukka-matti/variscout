---
title: 'ADR-078 PWA + Azure architecture alignment (same product, gated tiers)'
purpose: decide
tier: card
status: active
date: 2026-05-05
topic: ['decisions', 'canvas', 'investigation', 'wall']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# ADR-078 PWA + Azure architecture alignment (same product, gated tiers)

Slice 4 retro + PR #126 review + state-management drift audit revealed `apps/pwa/CLAUDE.md`'s "State via React Context (DataContext). No Zustand stores in PWA." rule was demonstrably false — PWA components actually import `useProjectStore`, `useSessionStore`, `useWallLayoutStore`, etc. across 15+ files. Q8-revised (2026-05-03) reset the persistence story but never re-evaluated state management. Brainstorm 2026-05-05 selected framing α (same product, gated tiers) over β (two products sharing UI) and γ (same architecture, different persistence). **Decision: ADR-078 locks α as canonical.** D1: PWA uses same domain Zustand stores as Azure. D2: state shapes tier-agnostic; persistence (IndexedDB Hub-of-one + .vrs vs Blob Storage sync) is the only tier-gated dimension. D3: investigation lifecycle deferred to investigation-loading brainstorm; framing α — same hooks both apps; multi-investigation per hub is Azure-tier feature. D4: shared orchestration components live in `@variscout/ui` with ~40-50 LOC route-shell per app; FrameView, Dashboard, drill-down overlay are extraction targets. D5: tier-gated features check `isPaidTier()` at mount point — runtime, not compile-time; no per-app conditional code paths. **Migration: doc-first (this entry + `apps/pwa/CLAUDE.md` update via this commit; opportunistic refactor follows per `feedback_no_backcompat_clean_architecture`).** Implications for PR #126: the FrameView Zustand-store import is not a violation; the recommended fix narrows to documenting reality (now done). Implications for PR4: `useCanvasStore` lives in shared `@variscout/stores` and mounts in both apps unchanged. Source: `docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md`. _Pinned 2026-05-05._
