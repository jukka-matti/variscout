---
title: 'feedback-atomic-sweep-cleanup-loops'
description: 'Real atomic-sweep PRs need 2-3 cleanup-dispatch loops after the initial sweep — type-level cascade lands clean, but i18n/glossary/JSDoc/UI-string/comment consistency surfaces sequentially across reviewer rounds. Budget accordingly.'
purpose: remember
tier: card
status: active
date: 2026-05-28
topic: [memory, feedback]
related: []
verified-against-commit: ca45f469
last-verified: 2026-05-28
source-hash: 0da86df8611e6202
origin-session-id: 99006d69-683b-44e8-a807-7a81fd9d2a53
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_atomic_sweep_cleanup_loops.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

`feedback_atomic_sweep_one_dispatch` is canonical for the IMPLEMENTER (one Opus dispatch with Architect→Migration→Validator phases). What this entry adds: at the controller level, real-world public-API renames need **2-3 cleanup-dispatch loops** after the initial sweep. Plan PR cycle time accordingly.

**Why:** the initial atomic sweep handles the type-level cascade cleanly — file renames, identifier renames, barrel updates, tsc-green across packages. But the LOWERCASE / USER-VISIBLE / DOC-PROSE consistency surface only gets fully audited by the spec compliance reviewer in round 1, the code quality reviewer in round 2, and the final branch reviewer in round 3. Each round surfaces a different category of partial-rename drift:

- **Round 1 (spec reviewer)** typically catches: i18n keys still rendering old strings; glossary entries with category fields/IDs not updated; AGENTS.md not mirrored from CLAUDE.md; ADR body amendments missing; Spec body prose stale; nested CLAUDE.md per-package; e2e file comments/variable names.
- **Round 2 (code quality reviewer)** typically catches: interface/Props type names that match a renamed component but weren't renamed themselves (`ControlPanel` component with `SustainmentPanelProps` props); function name leftovers in the renamed file (e.g. `applySustainmentTick` in `control.ts`); barrel re-exports for stale type names; hooks argument interfaces; field-name accessors when the type was renamed but `rollup.investigations[]` wasn't.
- **Round 3 (final branch reviewer)** typically catches: user-visible button labels and aria-labels that pass tsc (no test asserted on them); canonical doc PROSE (ia-nav-model.md Mermaid + JTBD descriptions in personas + stage names in OVERVIEW/USER-JOURNEYS/DATA-FLOW); localStorage keys; cross-doc table titles vs file paths.

PR-WV1-NAV (2026-05-27, PR #218) was the canonical example: 13 initial sweep commits + 9 cleanup sweep commits (Round 1 findings) + 1 closing sweep commit (Round 3 findings). Round 2 findings folded into the Round 1 cleanup because they overlapped. Total: 24 commits via `--merge --delete-branch`.

**How to apply:**

- **Budget 3 reviewer rounds** for any rename that crosses the i18n/docs/prose threshold. Two-round PRs are unusual.
- **Don't bundle all cleanup into ONE post-sweep dispatch** — the reviewer findings come in waves, and each wave's scope is different. Cleanup-dispatch N should address ONLY findings from reviewer N+0 (the one that just ran), not anticipate the next round.
- **Each cleanup dispatch's prompt should explicitly list the findings file-by-file** with the reviewer's exact paths and line numbers. Don't paraphrase; the reviewer was precise — preserve precision in the implementer prompt.
- **The final reviewer's role is critical**: per-task spec + code-quality reviewers run during the sweep; only the FINAL BRANCH reviewer audits the entire branch holistically. Skipping or rushing the final review leaves user-visible drift on main.
- **In the PR description, document the deferral list** (things found that you intentionally defer to followup PRs). PR-WV1-NAV deferred CoScout AI prompts + `investigationId` FK rename, both tracked in `docs/ephemeral/investigations.md`.
- **Lowercase greps catch what capitalized greps miss.** `git grep -nE "\bInvestigation\b"` was clean; `git grep -niE "\binvestigation\b"` had 150+ hits. Run both audits.

**What this does NOT mean:**

- It's NOT a license to ship sloppy first sweeps. The initial sweep should still be `feedback_atomic_sweep_one_dispatch`-disciplined.
- It's NOT a sign the writing-plans phase was incomplete. The plan can't enumerate every i18n key in advance; greps drift between plan-time and execution-time. The cleanup loops are expected, not exceptional.
- It's NOT compatible with squash-merge. Each cleanup commit lands cleanly via `--merge` per `feedback_preserve_commit_history`; squashing would collapse the per-round provenance.

Related: [[feedback_atomic_sweep_one_dispatch]] (the implementer-side pattern this complements), [[feedback_bundle_followups_pre_merge]] (why we fold cleanup into the same PR instead of opening followups), [[feedback_preserve_commit_history]] (why `--merge` not `--squash`), [[feedback_subagent_driven_default]] (the per-task review protocol that surfaces these findings systematically).
