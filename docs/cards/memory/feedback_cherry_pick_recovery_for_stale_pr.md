---
title: 'feedback-cherry-pick-recovery-for-stale-pr'
description: 'When main shifts significantly while a long-running PR is open (many merges, restructures), the right recovery is often cherry-pick onto fresh branch off latest main — drop obsoleted commits, add alignment fixes during the pick. Beats long-running merge resolution.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 6b6ea222-9daf-42ab-b211-7ad309428640
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_cherry_pick_recovery_for_stale_pr.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Cherry-pick recovery for a stale PR

When a PR has been open long enough that main has moved significantly under it (many merges, restructures, semantic shifts), the standard "merge main into branch + resolve conflicts" gets ugly fast: dozens of conflicts in files that have been heavily edited by others, fighting auto-merge on content that was REPLACED on main, etc.

**The cleaner recovery pattern**:

1. **Audit your branch's commits**: which are STILL NOVEL (untouched by main's evolution) vs OBSOLETED (main shipped equivalent work differently)?
2. **Branch fresh off latest `origin/main`** with a new descriptive name (e.g., `<original-name>-infra` to signal the scope narrowing)
3. **Cherry-pick the novel commits** in chronological order. Drop the obsoleted ones. Resolve cherry-pick conflicts with a clear heuristic (e.g., "accept main's content + my structural additions on top").
4. **Add alignment-fix commits** during the pick: bring docs/content references in line with main's current reality (renamed terms, updated paths, retired concepts).
5. **Open new PR**; close old PR as superseded with a comment linking the successor.

**Why**: 2026-05-17 session — PR #184 had 17 commits over 24 hours; in the same window, main shipped 21 PRs (wedge V1 engineering + Phase C audit/cleanup). Half of #184's content was obsoleted (Phase A wedge content edits done differently by user on main); other half was still-novel infrastructure (schema collapse, Tier 1 skills, INVARIANTS rename, CoScout AX-design, docs:gen-arch, doc-discipline). Trying to merge main into the #184 branch would have created merge conflicts on ~100+ files. Cherry-picking 16 of 17 commits onto fresh `docs-strategy-2026-infra` off latest main was clean — ~12 conflicts total (all small, predictable, resolved with "accept main's content" heuristic in <30 min). Closed #184 as superseded; opened #199 with the cherry-picked set + alignment fixes.

**How to apply**:
- Use when: a PR has been open >24hr AND main has materially changed in overlapping areas (same files, related restructures, semantic shifts in shared concepts)
- Don't use when: main is quiet, conflicts would be 1-2 files only, or branch is "almost ready" (just merge main + resolve)
- The new branch name should signal narrowing: `<original>-infra`, `<original>-recovered`, `<original>-rebased`, etc.
- Cherry-pick conflict-resolution heuristic depends on doc type: for canonical content edited by others, prefer THEIRS (user's edits are authoritative); for INFRASTRUCTURE (scripts, schema, new files), prefer YOURS (the cherry-pick brings the intent).
- Add alignment-fix commits to bring outdated references in line (renamed terms, removed concepts) — these are NEW work, not part of the original commit, but ship in the same PR.
- Close old PR with `gh pr close <N> --comment "Superseded by #<M>..."` so the lineage is preserved.

**Counter-signals (use plain merge instead)**:
- Conflicts limited to <5 files
- Main and branch touched DIFFERENT files mostly
- Branch is small (<5 commits)
- Time-critical: cherry-pick is more thinking-work than merge

Related: [[feedback_parallel_workstream_conflict_check]] (often the SETUP for needing this recovery: if you check parallel writers BEFORE long PR work, you avoid most stale-PR situations), [[feedback_branch_staleness_guardrails]] (the early signals), [[project_docs_strategy_2026]] (the textbook case).
