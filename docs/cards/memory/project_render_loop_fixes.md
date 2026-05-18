---
title: 'Render Loop Fixes (Apr 4 2026)'
description: 'Render loop bugs found via E2E browser testing — 3 commits eliminated 5700+ errors to zero. Root architectural cause is DataContext→Zustand sync pattern.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: e55176f5b6b097f8
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_render_loop_fixes.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

## E2E Browser Test Discovery (Apr 4 2026)

Chrome browser testing revealed 5700+ "Maximum update depth exceeded" errors that completely blocked the investigation workflow (questions/findings couldn't persist across workspace navigation).

### Fix 1: Unstable getState() refs in orchestration hooks (091eca02)

**Root cause:** `useInvestigationStore.getState().syncXxx` called at hook top level created new references each render, included in useEffect deps → infinite loop.

**Files (6 effects fixed):**
- `useInvestigationOrchestration.ts` — syncQuestions, syncQuestionsMap, syncIdeaImpacts
- `useFindingsOrchestration.ts` — syncFindings, setHighlightedFindingId
- `useImprovementOrchestration.ts` — syncState

**Pattern:** Move `getState()` inside effect body, remove from dependency array.

### Fix 2: viewState circular dependency (c8faf226)

**Root cause:** `handleViewStateChange` callback included `viewState` in deps, creating circular chain: viewState → callback recreated → usePanelsPersistence fires → writes viewState → loop (26 errors).

**Fix:** Use `useRef(viewState)` so callback identity stays stable. Eliminated final 26 errors → **zero total**.

**Side effect:** Also unblocked Tree view tab — findingsViewMode write was being overwritten on every render cycle.

### Fix 3: Question/tree visibility (5596a0f7)

**Root cause (FindingsLog.tsx):** Empty-findings guard rendered "No findings yet" BEFORE the tree-view check, hiding questions from the tree view even when questions existed.

**Root cause (EditorDashboardView.tsx + InvestigationWorkspace.tsx):** Both passed `factorIntelQuestions` (auto-generated only, requires ≥2 factors) instead of `questionsState.questions` (all questions). Manually added questions were invisible.

**Why:** Blocks entire investigation workflow: no questions visible → no cause-role → no InvestigationConclusion → no hub creation.

### Current state (verified via browser)
- **Zero console errors** after all 3 fixes
- Questions persist across workspace navigation
- Tree view renders questions without findings
- PI panel shows manually added questions
- Hub creation works end-to-end

### Anti-pattern to avoid
Never extract `useXxxStore.getState().action` at hook top level then include in `useEffect` deps. Always call `getState()` inside the effect body.
