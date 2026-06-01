---
title: 'ADR-078 — PWA + Azure architecture alignment (same product, gated tiers)'
description: 'PWA and Azure share state architecture (5 domain Zustand stores + 1 cross-app); persistence is the tier gate; tier-gated features check isPaidTier(); shared orchestration components live in @variscout/ui with ~40 LOC route-shell per app.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: ebeec14c9e9f059d
origin-session-id: 906cccde-0cd3-4d5a-bbda-f82a5855e4cc
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_adr_078_pwa_azure_alignment.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

[ADR-078 PWA + Azure architecture alignment](docs/07-decisions/adr-078-pwa-azure-architecture-alignment.md) — accepted 2026-05-05 — supersedes the (already-drifted) "DataContext only, no Zustand" rule that was in `apps/pwa/CLAUDE.md`.

**Decision: framing α — same product, gated tiers.** PWA and Azure are one product with paid features gated, NOT two products sharing UI primitives.

**Five dimensions locked:**

- **D1 — State management:** 5 domain Zustand stores in `@variscout/stores` (project, investigation, improvement, session, canvas) + 1 cross-app feature store (wallLayout). Same architecture both apps. React Context reserved for app-mount-time providers (theme, sessionStore provider, error service) — not project-level state.

- **D2 — Persistence:** state shapes tier-agnostic (same `ProcessHub`, `Finding`, `Question`, etc. types in `@variscout/core`); persistence implementation is the only tier gate. Azure: IndexedDB cache + Blob Storage sync via SAS tokens. PWA: session-only runtime with user-owned `.vrs` export/import; no browser save identity after R6d.

- **D3 — Investigation lifecycle:** when investigations become first-class loaded entities (deferred brainstorm), both apps mount them via the same hooks. Multi-investigation-per-hub will be tier-gated (PWA single-Hub-of-one stays single-investigation by Q8 constraint; Azure can have many).

- **D4 — App-level component duplication:** when PWA + Azure render the same component shape, the component lives in `@variscout/ui`; the per-app file is a ~40-50 LOC route shell wiring routing-derived props. **Concrete extraction rule:** if a PR sees byte-for-byte identical `apps/pwa/...` and `apps/azure/...` files, the next PR touching either side extracts to `@variscout/ui`. FrameView already extracted post-#126; Dashboard is the next likely candidate.

- **D5 — Tier-feature gating:** runtime `isPaidTier()` checks at mount points — NOT compile-time. No conditional imports between apps. CoScout (Constitution P8), cloud sync, Evidence Sources, multi-investigation, multi-user, chart branding all use this pattern.

**Why:** Slice 4 retro + PR #126 review surfaced that `apps/pwa/CLAUDE.md`'s "DataContext only" rule was demonstrably false — PWA already used 4+ Zustand stores across 15+ files. Brainstorm at 2026-05-05 selected α (same product, gated tiers) over β (two products sharing UI) and γ (same architecture, different persistence). Decision-log entry 2026-05-05 + apps/pwa/CLAUDE.md updated to match.

**How to apply:** any new feature touching project-level state uses domain Zustand stores; tier-gated features get `isPaidTier()` checks at mount; new PWA+Azure-rendered components go into `@variscout/ui` directly with route shells per app. Don't add app-specific store layers; don't conditional-import features per app.
