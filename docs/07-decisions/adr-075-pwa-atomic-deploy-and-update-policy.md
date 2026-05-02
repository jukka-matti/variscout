---
title: 'ADR-075: PWA atomic deploy + update policy'
audience: [developer, architect]
category: architecture
status: accepted
date: 2026-05-02
related:
  - adr-058-deployment-lifecycle
  - adr-059-web-first-deployment-architecture
---

# ADR-075: PWA atomic deploy + update policy

**Status**: Accepted

**Date**: 2026-05-02

**Supersedes**: None

**Related**:
[ADR-058](adr-058-deployment-lifecycle.md) (deployment lifecycle & self-service updates — Azure-app analogue),
[ADR-059](adr-059-web-first-deployment-architecture.md) (web-first deployment, customer-tenant Blob Storage)

---

## Context

The PWA is shipped as a Vite-built static bundle behind a Vercel deployment with a vite-plugin-pwa service worker (SW) precaching the app shell. A user-reported regression exposed the failure mode this ADR addresses:

- A previously-installed SW had cached an `index.html` that referenced chunk hashes from an older build (e.g. `PasteScreen-BZieqXKP.js`). After a fresh deploy, those hashes no longer existed in `/assets/`, so the lazy import 404'd at click time.
- A 404 on a CSS asset returned a `text/plain` body, which the browser's strict-MIME rule blocked, leaving the page in a half-loaded state.
- Vercel's preview-comments widget loaded `https://vercel.live` resources that the strict CSP rejected, polluting every console with violations even after the underlying app worked.

Three failure surfaces were entangled: SW update timing (the new SW activated mid-session and broke the running tab), chunk-load resilience (a single 404 was unrecoverable), and platform headers (CSP, MIME, cache-control). A patch on any one of these would have masked the others. The user feedback rule (`feedback_systemic_before_patching.md`) is explicit: fix the pattern, not the symptom.

## Decision

### 1. Service-worker update mode: prompt-on-update, never auto-activate

- `vite-plugin-pwa` config moves from `registerType: 'autoUpdate'` to `registerType: 'prompt'`.
- `injectRegister: false` — manual `registerSW` glue lives in `apps/pwa/src/lib/swUpdates.ts`, owning `onNeedRefresh` / `onOfflineReady` wiring.
- `skipWaiting: true` is **removed** from the workbox config. With `prompt` mode the new SW must wait until the user explicitly clicks Reload (which calls `updateSW(true)` → `SKIP_WAITING`).
- `clientsClaim: true` is **retained** so a fresh tab still adopts the active SW immediately on first load.
- `cleanupOutdatedCaches: true` is made explicit so old precache buckets are evicted on activation.
- An `UpdatePrompt` banner (`apps/pwa/src/components/UpdatePrompt.tsx`) renders only when a new SW is waiting, offering Reload (`updateSW(true)`) or Later (dismiss).

### 2. Chunk-load resilience: lazyWithRetry self-heal

- Every `React.lazy()` site in the PWA (`apps/pwa/src/App.tsx`) and the Azure app (`apps/azure/src/pages/Editor.tsx`) is wrapped in `lazyWithRetry` (`apps/pwa/src/lib/chunkReload.ts`, mirrored at `apps/azure/src/lib/chunkReload.ts`).
- On a chunk-load error, `lazyWithRetry` evicts the `workbox-precache-*` caches and reloads once per session — guarded by a `variscout:chunk-reload-attempted` `sessionStorage` key. A second failure rethrows to the existing `ErrorBoundary`.
- `sessionStorage` access is wrapped in `try/catch` so Safari private mode and sandboxed-iframe `SecurityError` failures degrade to "not yet attempted" (the user gets one reload chance instead of zero).
- `PasteScreen` is added to the existing idle-prefetch chain so a stale-hash 404 fires during idle time and the silent reload happens before the user clicks Paste.

### 3. Platform headers: CSP, MIME, cache-control (`apps/pwa/vercel.json`)

- CSP `script-src` and `connect-src` allow `https://vercel.live`; `connect-src` additionally allows `https://*.pusher.com` and `wss://*.pusher.com` so the Vercel preview-comments widget no longer emits CSP violations on every page load.
- Explicit `Content-Type` headers for `/assets/*.css` (`text/css`) and `/assets/*.js` (`application/javascript`) so any future Vercel auto-MIME regression cannot recreate the strict-MIME failure mode.
- `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` (content-hashed and safe to pin forever).
- `Cache-Control: no-cache` on `/index.html` and `/manifest.webmanifest` (must revalidate so a deploy is atomic from the browser's perspective).
- The existing `Cache-Control: no-cache` on `/sw.js` is retained.

### 4. Pre-merge gate: dist-integrity check

- `scripts/check-dist-integrity.mjs` runs after the PWA build inside `scripts/pr-ready-check.sh` and verifies every asset referenced from `apps/pwa/dist/index.html` exists on disk under `apps/pwa/dist/assets/`.
- Exit codes: `0` clean, `1` one or more refs missing, `2` `index.html` itself missing (build not run).
- The gate makes the exact failure mode from the regression — a published `index.html` referencing a chunk hash that no longer exists — uncommittable.

## Rationale

The PWA already has a service worker (ADR-012) and a deployment lifecycle for the Azure app (ADR-058). Neither covered the live-deploy hostile-takeover failure mode this ADR addresses, because both assumed the SW updated cleanly. The actual hazards are mid-session SW activation (which can swap the running app under the user's hands during analysis), chunk-load 404s after publish (which leave the app non-recoverable without a hard reload), and platform-level header drift (which compounds both).

Three reasons the chosen shape is right:

1. **User-consent SW updates fit the analyst posture.** A user mid-investigation should not have their tab silently swapped to a new build between two ANOVA passes. Prompt-on-update preserves session continuity; `clientsClaim: true` still gives a fresh tab the latest SW immediately, so deploy latency for new tabs is unchanged.

2. **Self-heal beats user-facing error.** A stale-chunk 404 with a plain `ErrorBoundary` forces the user to discover the cause and reload manually. `lazyWithRetry` makes the recovery silent, scoped (one attempt per session), and bounded (second failure rethrows). The idle-prefetch makes the recovery preemptive — the broken UI is never seen.

3. **Structural prevention beats run-time defense.** The `check-dist-integrity` gate catches the **problem class** (asset 404 from a stale-hash reference) at PR time. The MIME headers, CSP, and `no-cache` policy catch **symptoms** at run time. Both layers are needed, but the gate is the load-bearing one — without it, the run-time defenses would be papering over a class of bug that the build pipeline can simply prevent.

## Consequences

- **Users on long sessions across a deploy** see a small "Update available — Reload / Later" banner instead of either an auto-swap (hostile) or a stale tab forever (broken). They choose when to take the new build.
- **Users who hit a stale-hash 404** experience a one-time silent reload (often during idle prefetch, before they ever click) and continue working. A second failure surfaces the existing `ErrorBoundary`.
- **Devs cannot land a PWA build that emits a published `index.html` referencing missing chunks** — `pr-ready-check` blocks it.
- **The Vercel preview-comments widget** no longer pollutes the console on production. Cosmetic but a visible win in the developer experience.
- **`https://vercel.live` is now a permanent third-party trust in the PWA's CSP.** The alternative was disabling the preview-comments widget at the Vercel project level. We chose the trust because the widget is operationally useful for preview deploys and Vercel Live is first-party to the platform we ship on. Future tightening of CSP must keep this entry or take the alternative.
- **Service-worker offline scope is narrower** in `prompt` mode than under `autoUpdate` — fresh content propagates only after explicit user consent. Acceptable because the PWA's offline scope is partial today (data stays in the tenant; analysis is browser-local) and the consent cost is one click.

## Alternatives considered

- **Keep `registerType: 'autoUpdate' + skipWaiting: true`.** Rejected because it auto-activates a new SW mid-session and risks a hostile takeover during analysis. The convenience of "no banner ever" does not justify the risk of swapping app state under a working analyst.
- **Drop the service worker entirely.** Deferred. The run-time defenses in this ADR plus the build-time gate would cover the stale-chunk failure class without an SW at all, but offline scope (precaching the app shell so the PWA opens without network) would be lost. Captured as an Open Question in `docs/decision-log.md`; revisit once the tenant-data-only stance is firm.
- **MIME-only fix without the dist-integrity gate.** Rejected. The MIME header alone catches the symptom (a 404 returning `text/plain` that strict-MIME blocks) but does nothing about the cause (a chunk that should not have been missing in the first place). The gate catches the problem class; the headers catch a leak. Both layers ship.
- **Banner with auto-reload after N seconds.** Rejected. Auto-reload re-introduces the hostile-takeover problem we removed by going to `prompt` mode. The "Later" affordance is the contract.

## Implementation

Delivered across the `pwa-deploy-recovery` branch in eight commits:

- `3058cb60` — `feat(pwa): self-heal stale lazy chunks via lazyWithRetry`
- `ad7c644b` — `fix(pwa): harden chunkReload — fake timers in tests, guard sessionStorage`
- `7c883663` — `feat(pwa): prompt-on-update SW + dismissable reload banner`
- `99278f77` — `fix(pwa): drop skipWaiting under prompt mode + vi.hoisted mocks`
- `43442d31` — `perf(pwa): idle-prefetch PasteScreen chunk so stale-hash 404s self-heal early`
- `e4f0f647` — `chore(pwa): vercel headers — CSP for vercel.live, MIME, cache policy`
- `bae220b5` — `test(pwa): e2e paste→map→analysis happy path with data-testid selectors`
- `d26d2e67` — `chore(scripts): pre-merge gate against stale-hash chunks`

PR: TBD (this ADR ships in the same PR as the implementation).

## Status

Accepted (2026-05-02). Captures the response to the user-reported live-deploy regression and locks in the four-layer policy (SW update mode, chunk-load self-heal, platform headers, dist-integrity gate).

## Supersedes / superseded by

- Supersedes: none (new policy).
- Superseded by: none (active).
- Related: ADR-058 (Azure-app deployment lifecycle, parallel update story for the Function-App-orchestrated update flow), ADR-059 (web-first deployment, the platform context this ADR operates in).
