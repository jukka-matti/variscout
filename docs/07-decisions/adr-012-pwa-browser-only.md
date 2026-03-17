---
title: 'ADR-012: PWA Browser-Only, Zero Data Collection'
---

# ADR-012: PWA Browser-Only, Zero Data Collection

**Status**: Accepted

**Date**: 2026-02-18

## Context

VariScout's PWA serves as a free training and education tool. Two principles have been true in practice but never formally documented:

1. **The PWA is browser-only** — users access it as a regular website in their browser tab. There is no "Add to Home Screen" installation and no standalone app mode.
2. **Zero user data collection** — no analytics, no telemetry, no cookies, no tracking of any kind. The only localStorage used is for theme preference and UI state (panel width).

The codebase had contradictions: `vite-plugin-pwa` was configured with `display: standalone` (which enables browser install prompts), an `InstallPrompt.tsx` component and `useIsInstalled`/`useInstallPrompt` hooks existed as dead code, and several docs referenced PWA installation. Meanwhile, the zero-data-collection stance was already true in code but undocumented.

## Decision

### Decision 1: PWA is a browser-only tool, not an installable app

- Users open VariScout in a browser tab. That's it.
- No install prompts, no standalone mode, no home screen icons.
- The manifest `display` mode is set to `browser` (not `standalone`).

### Decision 2: Zero user data collection

- No analytics (Google Analytics, Plausible, Mixpanel, etc.)
- No telemetry or error reporting services
- No cookies (the PWA has no server-side component)
- No tracking pixels, fingerprinting, or session recording
- localStorage is used only for theme preference and UI state — never for user identification

### What we keep

- **Service Worker** for offline caching: `vite-plugin-pwa` generates a Service Worker that precaches static assets. This means the PWA loads fast on repeat visits and works offline. This is about performance, not installation.
- **Web App Manifest**: Still present for metadata (name, icons, theme color) but with `display: browser` so browsers don't offer install prompts.

### What we removed

- `InstallPrompt.tsx` component (dead code)
- `useIsInstalled` and `useInstallPrompt` hooks (dead code)
- `display: 'standalone'` from manifest config
- Documentation references to "Add to Home Screen" and PWA installation

## Rationale

**Simplicity**: A free training tool that runs in a browser tab is the simplest mental model. Users don't need to understand what a PWA is, how installation works, or why their "installed" app looks different from a bookmark.

**Trust**: A free tool for quality professionals shouldn't feel like surveillance. Zero data collection means we can honestly say "we know nothing about you" — which aligns with the offline-first, no-backend architecture.

**Maintenance**: Install prompts, standalone display mode, and the associated UX (update notifications, offline indicators in standalone mode) add code and testing surface for no business value. The Azure App is the paid product; the PWA is a funnel, not a platform.

**Consistency**: The PWA is session-only (no saved projects, no persistence beyond theme). Offering "installation" implies a level of commitment and continuity that doesn't match the session-only data model.

## Consequences

### Easier

- Simpler codebase (no install prompt logic, no standalone detection)
- Simpler documentation (no need to explain installation to users)
- Privacy story is clean and verifiable ("view source — there's no tracking code")
- No need to handle service worker update UX in standalone mode

### Harder

- Users who want a desktop shortcut must create a browser bookmark manually
- No offline indicator in standalone mode (but Service Worker caching still works in-browser)
- If we ever want to support installation in the future, we'd need to re-add the manifest display mode and install UX

## See Also

- [ADR-004: Offline-First](adr-004-offline-first.md) — Service Worker caching remains
- [ADR-007: Azure Marketplace Distribution](adr-007-azure-marketplace-distribution.md) — the paid product strategy
- [PWA Product Spec](../08-products/pwa/index.md)
