---
title: 'Voice Input Drafts — Type Drift on Main'
description: 'Commit d263cd03 left pre-existing tsc errors on main. Fix queued as PR'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 735256b7-0b83-49c5-b7fb-9407f6d02899
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_voice_input_drafts_drift.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Azure voice input drafts — pre-existing type drift

**Status 2026-04-24:** Fix in flight as **PR #79** (`fix/voice-input-drafts-type-drift`, commit `0b09e11a`). Local `tsc --noEmit` + full `pnpm --filter @variscout/azure-app build` + `bash scripts/pr-ready-check.sh` all green. Awaiting CI + squash-merge.

Commit `d263cd03` ("Add Azure voice input drafts for CoScout") landed on main with incomplete test/component sync. Caught during PR #48 read-excel-file v9 investigation (2026-04-24) while running `pnpm --filter @variscout/azure-app exec tsc --noEmit`.

## The two errors (both fixed in PR #79)

1. `apps/azure/src/components/__tests__/AdminKnowledgeSetup.test.tsx:43,79` — TS2345. Test constructs `RuntimeConfig` literals missing `voiceInputEnabled` + `speechToTextDeployment` fields added to the type in d263cd03. **Fix:** added `voiceInputEnabled: false, speechToTextDeployment: ''` to both fixtures (matches `getRuntimeConfig.ts` defaults for unset env values).

2. `apps/azure/src/components/Dashboard.tsx:904` — TS2322. `<VerificationCard renderHistogram={…} renderProbabilityPlot={…} />` — `VerificationCardProps` doesn't declare those props; the component was refactored to a `tabs`-array API but this call site wasn't updated. **Fix:** converted to the tabs API with Probability + Distribution/Capability tabs, `defaultTab="probability"`, matching PWA's `apps/pwa/src/components/Dashboard.tsx` shape (minus Pareto, which Azure Dashboard doesn't wire in this branch).

## Systemic finding (broader than this PR)

`pnpm test` uses vitest which doesn't strict-typecheck test files through the full tsconfig, so type drift in tests slips past the test suite. `pnpm build` (`tsc && vite build`) catches it. **`bash scripts/pr-ready-check.sh` currently runs tests + lint + docs:check — it does NOT run `pnpm build`.** So a PR can be "pr-ready-check green" but still break `pnpm build`. Consider adding a build step to pr-ready-check.sh, or a fast `tsc --noEmit` gate, to catch this category of regression before merge.

**Also related to d263cd03:** PR #78 (already merged) fixed the TS2774 error in `packages/ui/src/components/VoiceInput/VoiceDraftButton.tsx:38` — replaced `navigator.mediaDevices?.getUserMedia &&` with `typeof … === 'function'`. PR #79 closes out the remaining two errors from the same commit.

## How to apply (once merged)

Once PR #79 merges, delete this memory — the drift is gone. Until then, treat this as active context: if asked to "fix main build" the fix already exists and is awaiting merge, not a new patch to write.
