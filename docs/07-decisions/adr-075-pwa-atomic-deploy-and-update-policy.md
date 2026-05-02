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

**Status**: Accepted (amended 2026-05-02 — see Amendment below)

**Date**: 2026-05-02

**Supersedes**: None

**Related**:
[ADR-058](adr-058-deployment-lifecycle.md) (deployment lifecycle & self-service updates — Azure-app analogue),
[ADR-059](adr-059-web-first-deployment-architecture.md) (web-first deployment, customer-tenant Blob Storage)

---

## Amendment — 2026-05-02: SW transition trap → revert to autoUpdate + skipWaiting

Within hours of the original acceptance, prompt-mode hit a structural failure mode in production on `mean-beoynd-lite-pwa.vercel.app`: existing users with the previous SW already controlling their tabs had no path to the new SW's `UpdatePrompt` banner, because the banner UI lives in NEW code while the OLD SW kept serving cached OLD `index.html`. The new SW sat in `installed/waiting` indefinitely. Visible symptom: "cannot press Start Analysis" — the old code's async chunk-import pipeline silently rejected on chunks the new Vercel deploy had replaced. Users also reported never seeing the Update banner, confirming they were stuck on old code.

What changed:

- `registerType: 'autoUpdate'` restored (was `'prompt'`).
- `injectRegister: false` removed; vite-plugin-pwa auto-registers again.
- `workbox.skipWaiting: true` re-added alongside `clientsClaim: true` and `cleanupOutdatedCaches: true`.
- `UpdatePrompt` component, `swUpdates` controller, and `workbox-window` devDependency deleted (no back-compat shims).
- `apps/pwa/vercel.json` CSP gains `frame-src 'self' https://vercel.live` so Vercel Live's `feedback.html` iframe is no longer blocked by the `default-src 'self'` fallback.
- `lazyWithRetry` (the run-time chunk-load self-heal) is unchanged and remains the primary defensive layer covering any residual stale-chunk window during SW handover.

Lesson: any SW update strategy that relies on UI in the NEW code to advance the OLD code's lifecycle is unsound for users with a long install lifetime. Auto-activation is the safer default for analysis tools without deeply session-stateful state — and `lazyWithRetry` plus the `check-dist-integrity` gate already cover the failure class the original prompt-mode shape was trying to mitigate.

The Decision, Alternatives, and Implementation sections below are updated in place to reflect the amended state. The original prompt-mode shape is recorded in the rejected-alternative entry "Keep prompt mode + UpdatePrompt".

---

## Context

The PWA is shipped as a Vite-built static bundle behind a Vercel deployment with a vite-plugin-pwa service worker (SW) precaching the app shell. A user-reported regression exposed the failure mode this ADR addresses:

- A previously-installed SW had cached an `index.html` that referenced chunk hashes from an older build (e.g. `PasteScreen-BZieqXKP.js`). After a fresh deploy, those hashes no longer existed in `/assets/`, so the lazy import 404'd at click time.
- A 404 on a CSS asset returned a `text/plain` body, which the browser's strict-MIME rule blocked, leaving the page in a half-loaded state.
- Vercel's preview-comments widget loaded `https://vercel.live` resources that the strict CSP rejected, polluting every console with violations even after the underlying app worked.

Three failure surfaces were entangled: SW update timing (the new SW activated mid-session and broke the running tab), chunk-load resilience (a single 404 was unrecoverable), and platform headers (CSP, MIME, cache-control). A patch on any one of these would have masked the others. The user feedback rule (`feedback_systemic_before_patching.md`) is explicit: fix the pattern, not the symptom.

## Decision

### 1. Service-worker update mode: autoUpdate + skipWaiting (auto-claim on next visit)

- `vite-plugin-pwa` config uses `registerType: 'autoUpdate'`. The plugin auto-registers the SW; no manual glue.
- `workbox.skipWaiting: true` so a newly-installed SW takes over without waiting for all old clients to close.
- `clientsClaim: true` so the active SW adopts every controlled client (including freshly opened tabs) immediately on install.
- `cleanupOutdatedCaches: true` so old precache buckets are evicted on activation.
- No banner. The chunk-load self-heal (§2) covers any in-flight stale-chunk window during the handover; the dist-integrity gate (§4) rejects builds that would create one in the first place.

### 2. Chunk-load resilience: lazyWithRetry self-heal

- Every `React.lazy()` site in the PWA (`apps/pwa/src/App.tsx`) and the Azure app (`apps/azure/src/pages/Editor.tsx`) is wrapped in `lazyWithRetry` (`apps/pwa/src/lib/chunkReload.ts`, mirrored at `apps/azure/src/lib/chunkReload.ts`).
- On a chunk-load error, `lazyWithRetry` evicts the `workbox-precache-*` caches and reloads once per session — guarded by a `variscout:chunk-reload-attempted` `sessionStorage` key. A second failure rethrows to the existing `ErrorBoundary`.
- `sessionStorage` access is wrapped in `try/catch` so Safari private mode and sandboxed-iframe `SecurityError` failures degrade to "not yet attempted" (the user gets one reload chance instead of zero).
- `PasteScreen` is added to the existing idle-prefetch chain so a stale-hash 404 fires during idle time and the silent reload happens before the user clicks Paste.

### 3. Platform headers: CSP, MIME, cache-control (`apps/pwa/vercel.json`)

- CSP `script-src` and `connect-src` allow `https://vercel.live`; `connect-src` additionally allows `https://*.pusher.com` and `wss://*.pusher.com` so the Vercel preview-comments widget no longer emits CSP violations on every page load.
- CSP `frame-src 'self' https://vercel.live` (added 2026-05-02 amendment) so Vercel Live's `feedback.html` iframe loads instead of falling back to `default-src 'self'` and being blocked.
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

1. **Auto-activation + `skipWaiting` is the right default for analysis tools without deeply session-stateful state.** The alternative considered first — prompt-on-update — turned out to be structurally unsound for the install-lifetime profile of this PWA: the banner UI lives in NEW code, but users on a long-installed OLD SW keep being served the OLD `index.html` and never reach it. `clientsClaim: true` plus `skipWaiting: true` gives every user — fresh tab or long-installed — the latest SW on their next visit without UI dependence; `lazyWithRetry` covers the residual stale-chunk window. (See 2026-05-02 amendment for the user-reported regression that closed this question.)

2. **Self-heal beats user-facing error.** A stale-chunk 404 with a plain `ErrorBoundary` forces the user to discover the cause and reload manually. `lazyWithRetry` makes the recovery silent, scoped (one attempt per session), and bounded (second failure rethrows). The idle-prefetch makes the recovery preemptive — the broken UI is never seen.

3. **Structural prevention beats run-time defense.** The `check-dist-integrity` gate catches the **problem class** (asset 404 from a stale-hash reference) at PR time. The MIME headers, CSP, and `no-cache` policy catch **symptoms** at run time. Both layers are needed, but the gate is the load-bearing one — without it, the run-time defenses would be papering over a class of bug that the build pipeline can simply prevent.

## Consequences

- **Users on a long-installed previous SW** are auto-claimed by the new SW on their next visit (no banner, no stuck state). The handover is silent; `lazyWithRetry` (§2) covers any in-flight stale-chunk window.
- **Users who hit a stale-hash 404** experience a one-time silent reload (often during idle prefetch, before they ever click) and continue working. A second failure surfaces the existing `ErrorBoundary`.
- **Devs cannot land a PWA build that emits a published `index.html` referencing missing chunks** — `pr-ready-check` blocks it.
- **The Vercel preview-comments widget** no longer pollutes the console on production. Cosmetic but a visible win in the developer experience.
- **`https://vercel.live` is now a permanent third-party trust in the PWA's CSP** — across `script-src`, `connect-src`, and (post-amendment) `frame-src`. The alternative was disabling the preview-comments widget at the Vercel project level. We chose the trust because the widget is operationally useful for preview deploys and Vercel Live is first-party to the platform we ship on. Future tightening of CSP must keep these entries or take the alternative.
- **Service-worker offline scope under `autoUpdate` + `skipWaiting`** is "next visit gets latest"; freshly-built clients are auto-claimed on activation. Acceptable because the PWA's offline scope is partial today (data stays in the tenant; analysis is browser-local) and there is no deeply session-stateful state that an SW swap would corrupt.

## Alternatives considered

- **Keep prompt mode + `UpdatePrompt` banner.** Rejected (2026-05-02 amendment, after the original ADR shipped this shape). Prompt-mode is structurally unsound for users on a long-installed previous SW: the banner UI only exists in NEW code, but those users continue to be served the OLD `index.html` from the OLD SW's precache. The new SW sits in `installed/waiting` forever and the user has no path to advance it. Empirically, this manifested as silent chunk-import rejections on stale lazy-route loads (the visible "cannot press Start Analysis" symptom) plus users never seeing any banner. The autoUpdate + `skipWaiting` shape we now ship lets the new SW auto-claim on next visit; `lazyWithRetry` (§2) handles the residual stale-chunk window during handover.
- **Drop the service worker entirely.** Deferred. The run-time defenses in this ADR plus the build-time gate would cover the stale-chunk failure class without an SW at all, but offline scope (precaching the app shell so the PWA opens without network) would be lost. Captured as an Open Question in `docs/decision-log.md`; revisit once the tenant-data-only stance is firm.
- **MIME-only fix without the dist-integrity gate.** Rejected. The MIME header alone catches the symptom (a 404 returning `text/plain` that strict-MIME blocks) but does nothing about the cause (a chunk that should not have been missing in the first place). The gate catches the problem class; the headers catch a leak. Both layers ship.
- **Banner with auto-reload after N seconds.** Rejected. Auto-reload re-introduces a hostile-takeover risk and does not solve the prompt-mode trap (the banner has to render at all for any reload — silent or not — to fire). Subsumed by the amendment's autoUpdate + `skipWaiting` decision: the new SW takes over on next visit without UI.

## Implementation

Delivered across the `pwa-deploy-recovery` branch in eight commits (PR #118, merged at `139703a4`):

- `3058cb60` — `feat(pwa): self-heal stale lazy chunks via lazyWithRetry`
- `ad7c644b` — `fix(pwa): harden chunkReload — fake timers in tests, guard sessionStorage`
- `7c883663` — `feat(pwa): prompt-on-update SW + dismissable reload banner`
- `99278f77` — `fix(pwa): drop skipWaiting under prompt mode + vi.hoisted mocks`
- `43442d31` — `perf(pwa): idle-prefetch PasteScreen chunk so stale-hash 404s self-heal early`
- `e4f0f647` — `chore(pwa): vercel headers — CSP for vercel.live, MIME, cache policy`
- `bae220b5` — `test(pwa): e2e paste→map→analysis happy path with data-testid selectors`
- `d26d2e67` — `chore(scripts): pre-merge gate against stale-hash chunks`

Amended on the `pwa-sw-transition-recovery` branch (single commit, see 2026-05-02 Amendment above) reverting prompt-mode → autoUpdate + `skipWaiting`, deleting `UpdatePrompt` + `swUpdates` + `workbox-window`, and adding `frame-src 'self' https://vercel.live` to the CSP.

## Status

Accepted (2026-05-02), amended same day. The four-layer policy (SW update mode, chunk-load self-heal, platform headers, dist-integrity gate) stands; the SW-update layer is now `autoUpdate` + `skipWaiting` rather than prompt-mode (see Amendment).

## Supersedes / superseded by

- Supersedes: none (new policy).
- Superseded by: none (active).
- Related: ADR-058 (Azure-app deployment lifecycle, parallel update story for the Function-App-orchestrated update flow), ADR-059 (web-first deployment, the platform context this ADR operates in).
