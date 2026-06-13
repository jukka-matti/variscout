---
tier: living
purpose: design
title: 'D4 app convergence — delete the dead Azure client, one app three deployments'
audience: human
status: draft
date: 2026-06-14
layer: spec
topic:
  [
    d4,
    app-convergence,
    azure,
    workspace-app,
    deletion-sweep,
    cpk,
    problem-condition-card,
    coscout,
    local-first,
    adr-093,
  ]
implements:
  - docs/03-features/workflows/analyze-wall.md
last-verified: 2026-06-13
verified-against-commit: 017457d20503
---

> **Status:** draft — brainstormed + owner-approved 2026-06-14. Implementation plan to follow via `writing-plans`.

# D4 app convergence — design

## Context

ADR-093 §D4 ("Converge to one app, three deployments",
`docs/07-decisions/adr-093-v1-simplification-cuts.md:91`) calls for `apps/azure`
and `apps/pwa` to become a single desktop web app, with deployment
configuration deciding what is enabled (free / individual / company).

**The build-level convergence already shipped** (Codex, PR #388 + guardrails
PR #389):

- `apps/pwa` is the canonical client, renamed `@variscout/workspace-app`.
- Three deployments build from it via `VITE_VARISCOUT_CHANNEL=free|individual|company`
  (`apps/pwa/vite.config.ts`, `apps/pwa/src/config/capabilities.ts`). Free-channel
  artifact exclusion is **real build-time exclusion**, verified by
  `scripts/check-free-artifact-bundle.sh`.
- `apps/azure` default `build` runs `scripts/build-company-workspace.mjs`, which
  builds `@variscout/workspace-app` at the **company** channel into
  `apps/azure/dist`. CI (`.github/workflows/release.yml`,
  `deploy-azure-staging.yml`) invokes exactly that.

### The decisive grounding fact

**The company deployment already ships `workspace-app`, not the Azure client.**
Therefore everything under `apps/azure/src/` — the entire legacy React client
(`App.tsx`, `pages/`, the `Dashboard`/`FrameView`/`ReportView`/`FindingsPanel`/
`WhatIfPage`/`ProjectsTabView` mirrors, `AnalyzeWorkspace`, the admin / control /
performance / charter surfaces, the `features/ai` CoScout glue, cloud-storage
services, `AzureHubRepository`, the Azure `db/schema`, EasyAuth _client_ code) —
**ships in no deployment**. It is dead. The only live reference to a legacy build
is the `build:legacy-client` script, which **nothing else references** (a dead
escape hatch).

This reframes D4's source work. The earlier fear — a complex feature-gated merge
of `AnalyzeWorkspace` (Azure) into `AnalyzeView` (PWA), threading
comment/action/idea collaboration callbacks per channel — is **moot**: that merge
already happened implicitly at the build level, and the collaboration layer it
threaded was deleted by ADR-093 D1 (guardrails block its reintroduction). What
remains is a **contained leaf-deletion** plus one honesty fix plus an in-browser
verification.

`apps/azure/src` is a _leaf_: nothing imports from it (apps sit atop the
`core → hooks → ui → apps` dependency flow). Removing it cannot break a consumer.

### Scope decisions (owner, 2026-06-14)

1. **Cleanup-only.** D4 does **not** build the company-channel feature layer
   (EasyAuth-licensing in the SPA, tenant `/config` consumption, tenant CoScout).
   workspace-app's company channel currently ≈ individual (`artifacts: true`,
   `ai: false`); the server's `/config` endpoint is consumed by nobody. Company
   licensing is a platform concern (App Service EasyAuth gates before the SPA
   loads); tenant CoScout is named-future and independently reworked. Porting the
   dead client's licensing/config code is out of scope.
2. **Keep `apps/azure`** as the server-only deployment host (no rename). The name
   is honest — it is the Azure App Service deployment package.
3. **Two PRs + a verification walk** (below).

## Non-goals

- No company-channel feature wiring (licensing / tenant config / CoScout) — see
  scope decision 1.
- No package rename, no `apps/azure` → `apps/company-server` rename.
- No CoScout rewrite. The CoScout **engine survives untouched** in shared
  packages: `packages/core/src/ai/` (~25 modules + tests),
  `packages/hooks/src/{useAICoScout,useCoScoutProps}.ts`,
  `packages/ui/src/components/{CoScoutPanel,CoScoutInline}`. Only the dead
  Azure-app orchestration glue (`apps/azure/src/features/ai/*`: `aiStore`,
  `coscoutSurface`, `useAIOrchestration`, action/read/team tool handlers,
  `useActionProposals`, `useAnalyzeIndexing`) is deleted. When CoScout ships in
  the BYOK-individual / tenant-company channels it is a **re-wire into
  workspace-app** on top of the surviving engine, not a rebuild.

## Target end-state

One client codebase (`@variscout/workspace-app`, `apps/pwa/`), three channel
builds. `apps/azure/` is a **server-only deployment host**:

- `server.js` — CSP, `/health`, `/config`, EasyAuth `x-ms-client-principal`
  parse, ephemeral SSE relays (brainstorm / hub-comments, 24h TTL), static serve
  of `dist/`. **Retained.** (No document persistence; ADR-093 D2 already removed
  the Blob stack.)
- `scripts/build-company-workspace.mjs` — builds workspace-app @ company →
  `apps/azure/dist`. **Retained.**
- `package.json`, `Dockerfile`/deploy config, server-level tests. **Retained.**
- `apps/azure/src/` — **deleted in full.**

The "dual-store / mirror seam" the project memory repeatedly cites **dissolves by
deletion**: there is only one store-wiring left (workspace-app's). No reconcile
step is needed because nothing downstream consumed the Azure wiring.

## PR-1 — Deletion sweep

**Implementer:** one Opus (atomic deletion-cascade carve-out per CLAUDE.md — do
not split a contained atomic delete into artificial sub-tasks). Own worktree
under `.worktrees/<branch>/`.

**Sub-plan step 0 (grounding gate — before any deletion):**

- Confirm `apps/azure/src` is a true leaf: grep `packages/**` and `apps/pwa/**`
  for any `apps/azure/src` import (expected: none).
- Resolve the one real unknown — the `apps/azure` **Playwright e2e** suite: does
  it drive the _served_ workspace-app `dist` (keep) or import `src` (delete/port)?
  Decide per finding. This is the call-site-reachability check CLAUDE.md mandates.
- Inventory `apps/azure/vite.config.ts` / client `tsconfig` / test setup / turbo /
  `eslint.config.js` (`type: 'azure'` boundary) / `.gitignore` for `src`-only
  references vs. server/build references.

**Deletion:**

- `git rm -r apps/azure/src` (legacy client + its `__tests__`).
- Delete the `build:legacy-client` script.
- Remove `vite.config.ts` / client-`tsconfig` portions that only served `src`;
  keep whatever the build script and server need.
- Remove or collapse the eslint `type: 'azure'` boundary; clean any `src`
  references in test setup / turbo. Keep `dist` in `.gitignore`.
- Reconcile the Playwright e2e per step-0 finding.
- Tighten `apps/azure/CLAUDE.md`: "server / deployment host package, not a client
  app."
- PR description records: **"CoScout engine preserved in
  `packages/{core,hooks,ui}`; only dead Azure orchestration glue removed"** so the
  future re-wire knows where to look, and notes the deletion commit as the
  reference point for the deleted glue.

**Green bar:** `pnpm build` (all channels incl. `build:workspace:company`),
`pnpm test`, `pnpm check:adr-093-guardrails`, `scripts/pr-ready-check.sh`.

## PR-2 — Cpk-no-specs honesty fix

**Implementer:** Sonnet + one Opus adversarial review. TDD. Own worktree.

The Wall problem-condition card currently lies — it shows "Cpk 0.00" when no
spec limits are set. The fix lands once, in the canonical (workspace-app)
`AnalyzeView`, since the Azure mirror is gone.

- `packages/ui` `ProblemConditionCard`
  (`packages/ui/src/components/AnalyzeWall/ProblemConditionCard.tsx`):
  `cpk: number` → `cpk: number | undefined`. Render "no specs set" (not
  "Cpk 0.00") when `cpk === undefined`.
- `apps/pwa/src/components/views/AnalyzeView.tsx` (~875): stop hardcoding
  `problemCpk={0}` / `eventsPerWeek={0}`. Compute the real scoped values —
  **porting the logic the now-deleted Azure `AnalyzeWorkspace` had** (Cpk from
  the scoped filtered-data stats, `stats?.cpk`; events = the out-of-spec event
  count, `round(outOfSpecPercentage / 100 × n)`). Pass `undefined` Cpk when the
  scope has no `usl`/`lsl`.
- Tests: card renders "no specs set" for `undefined`; card renders the value when
  specs present; AnalyzeView computes real Cpk + events for a scoped dataset with
  specs, and `undefined` when specs absent.

**Green bar:** as PR-1.

## Verification walk (no PR unless defects found)

Live `claude --chrome` walk on the **converged build** (the single app all
deployments now ship) — the ER-surface verification deferred from the
Explore-redesign mission, plus confirmation of PR-2:

- `DefectDispatchBanner` (count-Y auto-dispatch banner)
- defect-rate `FactorStrip` (the strip variant)
- ΔR² upgrade in the strip ("in the model" caption + residual)
- ⚡ interaction chip + focal-level comparison
- the PR-2 Cpk card renders honestly ("no specs set" with no specs; a real value
  with specs)

These surfaces currently ship browser-unverified (RTL / strategy-test +
adversarial-review only). Mechanics notes from the ER mission: brush gestures need
full JS `MouseEvent` dispatch on the I-Chart SVG; clear stale `.vite` caches in
fresh worktrees; walk on a fresh session. Any defect → a follow-up investigation
entry, **not** scope-creep into PR-2.

## Risks & policies

- **Primary risk:** the `apps/azure` Playwright e2e. Resolved by PR-1 step-0
  grounding before deletion. No deletion proceeds until reachability is known.
- **Leaf-safety:** confirmed by architecture (apps are top of the dependency
  graph) and re-verified by the step-0 grep.
- **Partial-integration policy:** none required. PR-1 is a self-contained delete
  (no engine → primitive → app span). PR-2 touches the `ui` primitive plus its one
  workspace-app consumer, shipped together in a single PR.
- **Orchestration:** lean loop ([[lean-orchestration-token-economics]]) — one
  grounding pass per PR, one Opus adversarial review per PR. Each writer owns its
  own `.worktrees/<branch>/`; the main session stays at repo root. Merge with
  `gh pr merge --merge --delete-branch` (preserve per-commit history).

## Delivery state

`gh pr list` + the implementation plan, **not** memory.
