---
title: 'Investigation Wall'
description: 'Hypothesis-centric view toggle of the investigation graph. River-Roots foundation shipped (PR'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 4795770b-7d21-4aff-8dc8-58d3458f8e0e
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_investigation_wall.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Investigation Wall — River-Roots

> **2026-05-09 update — Wall now lives at `packages/ui/src/components/InvestigationWall/`** (re-homed from `packages/charts/` in PR-RPS-1, RPS V1 D17). All file paths in the historical sections below reflect the OLD `packages/charts/` location and need translation when navigating current code. The new location's CLAUDE.md is at `packages/ui/CLAUDE.md`.

## RPS V1 D12 Detective-pack progress

D12 = "Wall vision V1 = Detective-pack" (4 gaps closing piecewise). Status as of 2026-05-09:

- ✓ **Gap #1 — 5th hypothesis status `'needs-disconfirmation'`** — PR-RPS-2 (#147). Status engine in `packages/core/src/survey/wall.ts`. `OneStepAwayBadge` UI replaces openChecksLabel slot at full LOD when status fires. `Finding.evidenceType: 'data' | 'gemba' | 'expert'` + `Finding.refutes?: boolean` added to support derivation.
- ✓ **Gap #2 — Brush-to-pin-finding gesture** — PR-RPS-4 (#149). I-Chart drag→range, Boxplot tap→category. `BrushToFindingFlow` render-prop with a11y dialog (aria-modal, autofocus, Escape) → store-direct `useInvestigationStore.getState().addFinding(...)` + `connectFindingToHub`. `FindingSource.ichart.brushedRange` extension. Reasoning: F5 will subscribe addFinding to HubAction persistence; we don't dispatch FINDING_ADD here.
- ✓ **Gap #3 — Mini-charts inside HypothesisCard** — PR-RPS-3 (#148). `<ChartSlot>` foreignObject at `CHART_SLOT_Y=64`, `CHART_SLOT_H=80`. I-Chart for numeric factor, Boxplot for categorical. CARD_H grew from 228→288. Scatter (continuous-x) dropped V1.
- ✓ **Missing-evidence panel (vision slide 3 "THE DETECTIVE MOVE NOBODY SHIPS")** — PR-RPS-4 (#149). Rule-driven `MissingEvidencePanel` consumes `SurveyHint[]` filtered to data-collection (cat 2) + triangulation-readiness (cat 3). `MissingEvidenceDigest` deleted (was empty in production). `gaps`/`gapsByHubId` props removed from `WallCanvasProps`; `hasGap` derives from data-collection hint set. Survey rule cat 2 added to `surveyWallRules` — fires for `'evidenced'` hypotheses.
- ⏸ **Gap #4 — Best-subsets-inline suggestions** — DEFERRED V2 per spec D12. Background detector exists (`packages/core/src/ai/actions/bestSubsetsCandidateDetector.ts` from PR #76), surfaces via CoScout for now.



Hypothesis-centric projection of the investigation graph (`SuspectedCause` + `CausalLink` + `Finding` + `Question`), complementing Evidence Map (factor-centric) and the Question framework. Five canvas bands: problem condition → hypotheses with mini-chart evidence → AND/OR/NOT gates → tributary chips → missing-evidence critique strip ("the detective move nobody ships"). Azure-only.

Delivery: see PR #75 + PR #76 (run `gh pr list --state all --search "Investigation Wall"`); spec at `docs/superpowers/specs/2026-04-19-investigation-wall-design.md`. Feature doc: `docs/03-features/workflows/investigation-wall.md`. Methodology integration brainstorm logged as Open Question in `docs/decision-log.md`.

## Code-review closeout artifacts
- `150f9200` — merged main back into branch (237 files; docs conflicts resolved by taking main's versions since PR #77 superseded them; pnpm-lock regenerated).
- `7ec6601c` — 3 reviewer blockers fixed: (1) SSE drain-on-reconnect wired in `useHubCommentStream.ts` init handler; (2) `wall.missing.tagline` catalog key + `formatMessage` with `{count}`; (3) Minimap `vpX`/`vpY` divide by `zoom` to match the code comment at `Minimap.tsx:66-68`. +3 hook tests.
- `f8cfbbec` — 4 reviewer concerns cleared: DraggableHypothesisCard strips `role`/`tabIndex` from dnd-kit's attributes spread (HypothesisCard owns button semantics); CommandPalette kinds translated via `wall.palette.kind.{hub,question,finding}` + `aria-activedescendant`; MobileCardList "Q" → `wall.card.questions` catalog key; reactive `useWallLocale()` hook replaces 12 non-reactive `getDocumentLocale()` call sites (MutationObserver on `data-locale`).

`bash scripts/pr-ready-check.sh` green. Tests + lint + docs:check all clean.

**Still pending:** `claude --chrome` walk (session-invoked, can't automate). Watchlist: zoom+pan→minimap tracks, locale toggle reveals new tagline, offline→online SSE replay, keyboard drag single-activate, 768px resize, ⌘K arrow+Enter pan.

**Non-obvious design facts from this round:**
- `drainPendingComments()` is drain-all-on-any-init. Server is id-idempotent (POSTs use `localId`), so duplicate retries are safe. Finding-scoped pendings are re-enqueued (owned by the finding stream). See spec lines 330, 413 (`docs/superpowers/specs/2026-04-19-investigation-wall-design.md`).
- `pan.x/y` in `wallLayoutStore` is **screen-space pixels** (SVG `translate(pan.x) scale(zoom)` applies translate in parent coords, then scale). JSDoc on `MinimapProps.pan` now says this explicitly. Converting pan to canvas-space requires `/zoom`.
- `useWallLocale()` reactive hook pattern mirrors `useChartTheme` — MutationObserver on `document.documentElement` with `attributeFilter: ['data-locale']`. Non-reactive `getDocumentLocale()` stays exported for non-React callers.

## Phase split (durable reference)

Phase 1–8 covered foundations through app toggle (PR #75). Phases 7.2 / 7.3 / 9 / 10 / 11 / 12 / 13 / 14.1 covered interactions, i18n, SSE, scale, and mobile (PR #76). Combined ~6,240 tests (+304 from baseline). Phase 14.2 (visual chrome walk) was deferred separately and not part of either PR.

## Delivery strategy

Plan at `/Users/jukka-mattiturtiainen/.claude/plans/should-we-take-a-playful-summit.md`.

Execution: single-PR stacked on `feature/wall-phase-11`, not 7 separate PRs. Rationale: reduced merge-ceremony overhead, user gets one review surface. Per-phase commits preserve chronology.

Subagent dispatch in 4 batches via `isolation: "worktree"`:
- Batch 1 (parallel): Phase 9, Phase 10, Phase 12
- Batch 2 (sequential): Phase 7.2 + 7.3
- Batch 3 (sequential): Phase 13
- Batch 4 (sequential): Phase 14.1

Phase 11 was already on-branch at session start.

## What's on PR #76 (in addition to Phase 11 work from earlier merge)

### Phase 9 — background best-subsets → CoScout

- `packages/core/src/ai/actions/bestSubsetsCandidateDetector.ts` — pure `detectBestSubsetsCandidates(rows, cts, allColumns, citedColumns, minRows=10, minImprovement=0.10)`.
- `apps/azure/src/features/ai/aiStore` — new `wallSuggestions: WallSuggestion[]` field + `upsertWallSuggestion` / `dismissWallSuggestion` / `clearWallSuggestions` actions. Agent chose this over extending the external `UseAICoScoutReturn['messages']` union — parallels existing `suggestedQuestions` / `actionProposals` patterns.
- `apps/azure/src/features/investigation/useWallBackgroundJobs.ts` — debounced 2s subscription. PWA twin is no-op stub.

### Phase 10 — SSE hub comments

Extends the existing HMW brainstorm pattern at `apps/azure/server.js:512–656`. Three new endpoints: `POST /api/hub-comments/append`, `GET /api/hub-comments/stream`, `GET /api/hub-comments/active`. Same in-memory `Map` + 24h cleanup + `x-ms-client-principal` auth shape.

Client: `packages/hooks/src/useHubCommentStream.ts` (mirrors `useBrainstormSession.ts`). `investigationStore.addHubComment(hubId, text, author?) => Promise<FindingComment>` — optimistic update + failure queue via `wallLayoutStore.pendingComments` (field existed from Phase 1). `useWallHubCommentLifecycle` wired top-level in Azure (self-gating on viewMode + selection). PWA has `useWallHubCommentLocal` no-op stub (ADR-059 server-less constraint).

**Viewport-visible detection deferred** — hook uses `selection` Set as proxy. Phase 13 didn't add LOD viewport culling.

### Phase 12 — i18n

37 flat `wall.*` keys in `MessageCatalog`. English values in `en.ts`, English fallbacks seeded across 31 other locale files. 10 Wall primitives retrofitted via `getMessage` / `formatMessage`. New `packages/charts/src/InvestigationWall/hooks/useWallLocale.ts` consolidates `getDocumentLocale()` for all 32 locales; `QuestionLinkPrompt` (ui, can't depend on charts) has a duplicate inline helper — fine for now, lift to `@variscout/core/i18n` if friction appears.

Drive-by: commit `f371b9f3` replaced `'Narrow to root cause'` → `'Narrow to contribution'` across 27 English-fallback locale files to unblock `no-root-cause-language` ESLint rule. Native-translation locales (fi/de/es/fr/pt/ja/zhHans/zhHant/ko/nb) intentionally untouched — rule only scans English.

### Phase 7.2/7.3 — drag-drop + undo/redo

Deps added: `@dnd-kit/core`, `@dnd-kit/modifiers`, `immer`.

- `packages/core/src/findings/gateNodeOps.ts` — path-based `GateNode` tree helpers (`getAt`, `updateAt`, `insertHubAsAndChild`, `removeAt`). 31 tests.
- `investigationStore.composeGate(path, hubId)` — silent no-op when tree is undefined.
- `useWallDragDrop` + `DraggableHypothesisCard` + `DroppableGateBadge` — composition wrappers. `HypothesisCard` and `GateBadge` unchanged. SVG refs need `as unknown as Ref<SVGGElement>` cast for @dnd-kit compatibility.
- `wallLayoutStore.applyWithUndo` via immer `produceWithPatches`, FIFO cap 50. `undo()` / `redo()` scoped to structural mutations only — zoom/pan/selection/railOpen stay direct. `setNodePosition` refactored through `applyWithUndo`.
- `useWallKeyboard` wires ⌘Z / ⌘⇧Z / ⌘Y. Already callback-based — consumers wire `onUndo={() => useWallLayoutStore.getState().undo()}`.

### Phase 13 — scale features

- Zoom + pan applied to SVG transform in `WallCanvas`. Plain transform used; `@visx/zoom` gesture binding deferred (keyboard + store-driven panning is sufficient; gestures can layer on later without touching `WallCanvas`).
- `HypothesisCard.zoomScale` prop — glyph only <0.3, glyph+name <0.6, full card >=0.6.
- `CommandPalette` (⌘K) — keyboard-nav, Enter pans to selected result. Consumer computes target position from nodeId.
- `Minimap` — 160×100 SVG bottom-right, click-to-pan.
- `wallLayoutStore.groupByTributary` — persisted toggle. `WallCanvas` wraps same-tributary hubs in dashed frames when on.
- **Charts can't import stores** (dep flow rule) — zoom/pan/groupByTributary flow as props from app layer. Azure `InvestigationWorkspace` and PWA `InvestigationView` both wire this.

Deferred items flagged by agent and wired in main-session follow-ups:
- Palette/Minimap mounted in both apps (initial agent shipped them exported but not mounted).
- "Group by tributary" toolbar button added in both apps.

### Phase 14.1 — mobile

- `packages/charts/src/InvestigationWall/hooks/useWallBreakpoint.ts` — `useWallIsMobile()` + `WALL_MOBILE_BREAKPOINT = 768`. Self-contained matchMedia wrapper; `@variscout/charts` can't import `@variscout/ui`'s `useIsMobile`.
- `MobileCardList.tsx` — vertical stack of hypothesis cards with status-colored left border, findings/questions counts. `data-testid="wall-mobile-hub-${id}"`.
- `WallCanvas` renders `MobileCardList` instead of SVG below breakpoint.

Final subagent review flagged one real issue (M1): Minimap + CommandPalette were mounted as *siblings* of WallCanvas in both apps, so they leaked through mobile breakpoint. Fix committed as `749891aa`: both apps now call `useWallIsMobile()` and gate the overlay mounts — and ⌘K bails early on mobile.

## Key files added/modified on PR #76

**New core**:
- `packages/core/src/ai/actions/bestSubsetsCandidateDetector.ts`
- `packages/core/src/findings/gateNodeOps.ts`

**New charts**:
- `packages/charts/src/InvestigationWall/CommandPalette.tsx`
- `packages/charts/src/InvestigationWall/Minimap.tsx`
- `packages/charts/src/InvestigationWall/MobileCardList.tsx`
- `packages/charts/src/InvestigationWall/DraggableHypothesisCard.tsx`
- `packages/charts/src/InvestigationWall/DroppableGateBadge.tsx`
- `packages/charts/src/InvestigationWall/hooks/useWallBreakpoint.ts`
- `packages/charts/src/InvestigationWall/hooks/useWallDragDrop.ts`
- `packages/charts/src/InvestigationWall/hooks/useWallLocale.ts`

**New hooks**:
- `packages/hooks/src/useHubCommentStream.ts`

**New app features**:
- `apps/azure/src/features/investigation/useWallHubCommentLifecycle.ts`
- `apps/azure/src/features/investigation/useWallBackgroundJobs.ts`
- `apps/pwa/src/features/investigation/useWallHubCommentLocal.ts` (no-op stub)
- `apps/pwa/src/features/investigation/useWallBackgroundJobs.ts` (no-op stub)

**Server**: `apps/azure/server.js` — 3 new hub-comment endpoints.

**i18n**: `packages/core/src/i18n/types.ts` + `en.ts` + 31 other locale files.

## Known flake

- `pnpm test` under turbo occasionally flags `packages/hooks/src/__tests__/index.test.ts` under concurrent Turbo load. Passes in isolation. Pre-existing.

## Test deltas (PR #76 baseline)

| Package | Before | After | Delta |
|---|---|---|---|
| core | 2538 | 2698 | +160 |
| stores | 180 | 225 | +45 |
| charts | 158 | 226 | +68 |
| hooks | 966 | 977 | +11 |
| ui | 1189 | 1189 | 0 |
| azure | 782 | 802 | +20 |
| pwa | 123 | 123 | 0 |
| **total** | **~5,936** | **~6,240** | **+304** |

## Parked beyond Phase 14.1

- `@visx/zoom` gesture binding (wheel/trackpad) on Wall canvas.
- Playwright E2E spec (replaced by `claude --chrome` walk per 2026-04-19 strategy change).
- Viewport-culling for hub-comment streams (uses `selection` proxy).
- PWA CLAUDE.md correction — says "No Zustand stores in PWA" but the PWA already uses `useInvestigationStore` + `useWallLayoutStore`. Pre-existing drift, not this PR's regression.
- Follow-up fixup for duplicate `getDocumentLocale` helper in ui vs charts — lift to `@variscout/core/i18n` if friction appears.
