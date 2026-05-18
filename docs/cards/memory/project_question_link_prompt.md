---
title: 'QuestionLinkPrompt feature (2026-04-16)'
description: 'Observation-triggered question-linking UX nudge — implementation of amended Constitution Principle 5''s third entry point'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 900b93bb415e4946
origin-session-id: b7106bf7-e1bf-474a-969a-12214772d5ef
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_question_link_prompt.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

## What landed

A lightweight modal prompt (`QuestionLinkPrompt` in `@variscout/ui`) that appears after a Finding is created from a chart observation, offering to link the finding to an existing open question. This is the **observation-triggered entry point** of amended Constitution Principle 5.

## Key code locations

- **Component**: `packages/ui/src/components/FindingsLog/QuestionLinkPrompt.tsx` — props-based, no store imports. Focus trap, Escape close, ARIA-compliant (plain `<ul><li><button>` — no fake `role="listbox"`).
- **Flag**: `sessionStore.skipQuestionLinkPrompt` (persisted to IndexedDB via partialize). Setter: `setSkipQuestionLinkPrompt(value)`.
- **PWA wiring**: `apps/pwa/src/App.tsx` lines 545–560 (handlers) + ~1035 (mount). Uses `findingsState.addFinding()` return value to capture id.
- **Azure wiring**: two mounts — `apps/azure/src/pages/Editor.tsx` (chart observations, via `findingsCallbacksWithPrompt` wrapper) and `apps/azure/src/components/editor/InvestigationWorkspace.tsx` (Evidence Map context menu; has `if (mapPromptOpen) return` re-trigger guard).

## Why: relevance for future work

- **Why** — Post-amendment Principle 5 names 3 entry points (upfront hypotheses / evidence-ranked / observation-triggered). This feature ONLY strengthens entry point #3 — the other two are already wired via Analysis Brief + Factor Intelligence auto-population.
- **How to apply** — When building AI coaching, UX flows, or features that touch questions/findings: respect all three pathways. Don't narrow the design to just question-first OR just observation-first — either bias violates the amended principle.
- **Don't re-introduce** forced question-first gating in finding creation flow. Observations-before-questions is legitimate EDA (`docs/01-vision/eda-mental-model.md:117, 290, 315`).

## Known gaps

- Azure `useFindingsOrchestration.ts` has a `focusedQuestionId` auto-link path that runs BEFORE the prompt appears (line 214–215). Can produce an already-linked finding showing up in the prompt. Low priority; see final review finding #3.
- No dedicated integration tests for PWA/Azure wiring (only component-level tests on QuestionLinkPrompt itself). Documented gap.
- Component strings are raw English — i18n wiring deferred.

## Final commit range

`git log --oneline e7fdfedd..HEAD` — 11 commits (4c5e109d through 9c8194f5).
