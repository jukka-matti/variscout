---
title: 'PWA SW — never use prompt-mode for forced-update flows'
description: 'Keep registerType:''autoUpdate'' + workbox.skipWaiting:true. Don''t switch to prompt-mode unless an out-of-SW path can push existing users to the new code. Stale-chunk defense lives in lazyWithRetry, not a UI banner.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: bc9669a642a6656a
origin-session-id: 58b5bbc5-f330-4e14-8fcd-95e94bee288c
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_pwa_sw_no_prompt_mode.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

PWA service-worker update strategy MUST NOT depend on UI that lives in the NEW code unless we have an out-of-SW way to push the new code to existing users. Use `registerType:'autoUpdate'` + `workbox.skipWaiting:true` + `workbox.clientsClaim:true`. Runtime defense for stale-chunk failures is `apps/pwa/src/lib/chunkReload.ts` (`lazyWithRetry`), not a banner.

**Why:** PR #118 (2026-05-02) shipped `registerType:'prompt'` + `UpdatePrompt` banner. Existing users with the OLD SW kept serving cached OLD `index.html` from precache. The OLD HTML had no `UpdatePrompt` component → users could never see the banner → could never click Reload → new SW stuck in `installed/waiting` forever → users permanently stuck on stale assets. Visible symptom was "cannot press Start Analysis": old code's analysis pipeline async-imported chunks the new Vercel deploy had replaced, the rejection was unhandled (no `lazyWithRetry` in old code), click looked silent. Reverted within 48h in PR #119; ADR-075 amended in place. Net architectural change vs pre-PR-118: zero on SW strategy; +runtime self-heal (lazyWithRetry) + dist-integrity pre-merge gate + Vercel CSP/MIME/cache headers.

The deeper rule the trap illustrates: **SW deploy-recovery controls must sit at a layer that's always active.** The SW lifecycle layer (`skipWaiting`) and the runtime-import layer (`lazyWithRetry`) qualify; a UI banner in the new bundle does not — it requires the system to be already-fixed before it can be reached.

**How to apply:**
- `apps/pwa/vite.config.ts` invariants: `registerType:'autoUpdate'`, `workbox.skipWaiting:true`, `workbox.clientsClaim:true`, `workbox.cleanupOutdatedCaches:true`. Don't flip these without reading ADR-075 amendment first.
- If a future case wants user-controlled updates, the prompt UI must be reachable from the OLD code (e.g., long-cached static shell with the prompt baked in from day one). There's no good general answer; default to autoUpdate.
- Residual risk of `skipWaiting:true`: a deploy mid-session can refresh the tab. With Context-based PWA state and `lazyWithRetry`, the worst case is one brief reload — acceptable.
- Don't reintroduce `UpdatePrompt`, `swUpdates`, or manual `registerSW` glue without explicit reason. They were deleted in PR #119 for clarity.
