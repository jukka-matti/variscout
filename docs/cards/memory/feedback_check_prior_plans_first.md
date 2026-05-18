---
title: 'Search prior plan files before re-brainstorming'
description: 'Before opening any brainstorm topic, check ~/.claude/plans/ for prior sessions on the same topic; surface locked decisions instead of relitigating'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 708e62b5-c667-45de-9c9a-869382da2a46
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_check_prior_plans_first.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

Before brainstorming any topic in this project, search `~/.claude/plans/` for prior sessions covering the same area. Surface what was already decided before proposing new options or asking exploratory questions.

**Why:** In the 2026-04-29 session, I started a brainstorm about Hub-of-Hubs aggregation that proposed structural models (tree / tags / flat) and an aggregation-rule framing as if from a blank slate. The user corrected: "didn't we have this sort of discussion a bit yesterday? are you able to check the brainstorming session transcript?? becuase i was saying that we could plot those cpk values as an exmaple to boxplot". The April 28 plan file `~/.claude/plans/we-just-implemented-phase-delightful-adleman.md` had **fully locked decisions** on all four drill patterns (Drill A/B/C + Org), the B1/B2 unified data model, governance, context-tuple specs, and the "distribution-as-visualization not aggregation" principle. Almost relitigated all of it.

**How to apply:**
1. Before any non-trivial design conversation, run: `ls ~/.claude/plans/ | tail -30` and `rg -l "<keyword>" ~/.claude/plans/` for the topic keywords.
2. Read the most recent matching plan file BEFORE asking any AskUserQuestion or proposing options.
3. Surface the locked decisions explicitly: "Here's what was decided in [plan file] on [date]: ..." — quote them.
4. Frame new questions only around what's *still open* after acknowledging what's locked.
5. If a user asks "did we discuss this before?" — that's a strong signal to check `~/.claude/plans/` immediately, not just memory.

**Extension (2026-05-17 PR-WV1-5 incident):** Plan files are not the only home for locked decisions. **Before writing a sub-plan that touches a previously-specced surface, also check:**

- **`docs/superpowers/specs/` for amendments** — search `*amendment*` + `last-reviewed > spec date`. Amendments live as their own files; reading the original spec without checking for amendments produces stale plans. Today's failure: I wrote the WV1-5 sub-plan targeting wedge spec §3.1's 6-tab nav, missed the `2026-05-16-improve-tab-amendment-design.md` that supersedes it, and locked the wrong target (deleting the Improve tab when the amendment says keep it).
- **Session JSONL transcripts** — `~/.claude/projects/-Users-jukka-mattiturtiainen-Projects-VariScout-lite/*.jsonl`. Use `jq` + `grep` to find prior discussions on the topic. Plan files capture the *output* of a session; the transcript captures the *journey* including amendments that may not have been re-summarized. Today's user prompt "are you able to check our discussion?" was the exact signal — same shape as the 2026-04-29 prompt that triggered this entry.

When the topic crosses a previously-shipped wedge / spec / design boundary, do BOTH the plan-file search AND the amendment + transcript search before locking.

This applies regardless of how confident the topic feels new.
