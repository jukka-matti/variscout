---
title: 'Decision Log canonical artifact'
description: 'docs/decision-log.md is the durable home for replayed decisions, open questions, named-future features, session backlog, and journey state. Read it first before re-opening any topic.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, project]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: e50b8fda74fd583b
origin-session-id: 06326608-2d71-4b85-a053-9d261a18efd2
---

> 🤖 **Generated mirror** of `~/.claude/memory/project_decision_log.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

VariScout's drift was being driven by decisions that lived only in plan files (`~/.claude/plans/*.md`) and evaporated between sessions. The fix landed 2026-04-29 as `docs/decision-log.md` — a five-section living artifact:

1. **Replayed Decisions** — pinned closed calls (e.g., C3 superseded by FRAME thin-spot batch, ADR-073 no-aggregation, no-V1/V2-phasing, no-gate-framing).
2. **Open Questions** — known unknowns with state.
3. **Named-Future** — features deferred with intent to remember.
4. **Session Backlog** — running list of conversations with `queued / in-flight / done / blocked / dropped` state.
5. **User Journey Map** — every major user journey with shipped vs documented state.

**Why:** Plan files (`~/.claude/plans/*`) carry session reasoning but aren't durable. ADRs capture closed decisions but not open ones. Specs capture designs but not the deferral rationale for ones that didn't ship. The decision log fills that gap.

**How to apply:**

- **Before re-opening any topic** (FRAME drawer, cross-hub aggregation, MSA, etc.) — `cat docs/decision-log.md` first. The Replayed Decisions section is the pinned-at-top "don't relitigate" list. Captured in CLAUDE.md "When uncertain".
- **When deferring something during a session** — log it in §Open Questions or §Named-Future before exit; don't leave it only in the plan file.
- **When a decision is killed** (not just deferred) — promote to §Replayed Decisions with rationale + closing artifact link.
- **When a feature ships** — update §User Journey Map row's `Status` and `Last chrome-walked`.
- **When a session opens new conversations** — add to §Session Backlog as `queued`; transition to `in-flight` when work begins; close with link to plan-file / PR / commit.

Companion automation:

- `scripts/check-memory-pr-staleness.sh` (registered in `.claude/settings.json` SessionStart) warns at session start when memory entries reference open PRs that have actually merged. Validated at first run by catching PR #76 + PR #103 stale-OPEN entries.
- `scripts/decision-log-reminder.sh` (registered in `.husky/pre-commit`) nudges when commit messages hint at deferral / supersession but `docs/decision-log.md` isn't staged. Warning-only.

Per the new "Memory hygiene" rule (CLAUDE.md): memory should hold *durable* facts (architecture, decisions, terminology, feedback). Ephemeral state (PR status, in-flight phase, currently-shipping) belongs in `git` / `gh`, not memory.

**Related artifacts:**

- `docs/superpowers/specs/2026-04-29-consolidated-method-and-surface-overview-design.md` — periodic state-of-the-union snapshot; links to the decision log for living state.
- `~/.claude/plans/i-am-wondering-that-fancy-brook.md` — the plan that established this discipline (2026-04-29).
