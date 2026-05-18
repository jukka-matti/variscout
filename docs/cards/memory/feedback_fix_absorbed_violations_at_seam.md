---
title: 'Fix absorbed pattern''s violations at the seam, don''t carry forward'
description: 'When code moves between locations (refactor / absorption / extraction), the move is the right moment to fix the absorbed code''s known violations — not carry them forward as "pre-existing patterns."'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 6a57865c1d5dc853
origin-session-id: 906cccde-0cd3-4d5a-bbda-f82a5855e4cc
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_fix_absorbed_violations_at_seam.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When code moves between locations as part of a refactor, absorption, or extraction (e.g., `packages/ui/src/components/ProcessMap/ProcessMapBase.tsx` → `packages/ui/src/components/Canvas/internal/ProcessMapBase.tsx`), the move is the right moment to fix the absorbed code's known violations of project rules. Don't treat the absorption as "moving the file unchanged" if the file violates current project rules.

**Why:** Canvas migration PR2 (`25769d93`, 2026-05-05) absorbed `ProcessMapBase` from `packages/ui/src/components/ProcessMap/` into `packages/ui/src/components/Canvas/internal/`. The original file had `Math.random()` for ID generation and 11 hardcoded Tailwind palette colors (`bg-emerald-500/10`, `bg-amber-500/10`, etc.) that violate `@variscout/ui` CLAUDE.md hard rules. The absorption preserved the violations under the new path. PR4c-PR6 inherited them; the retrospective review on 2026-05-06 caught both (Math.random was caught earlier at PR #126 review for *another* file but missed in the absorbed copy; palette colors slipped past until the retrospective). Result: an extra fix PR is now needed when the work could have been done at the absorption seam.

**How to apply:** When opening a refactor / absorption PR (e.g., "absorb component X into Y"):

1. Run a quick rule audit on the moved file BEFORE moving:
   - `grep "Math\.random\|Date\.now()" <file>` (project rule: deterministic IDs only)
   - `grep -E "bg-(blue|red|amber|green|emerald|sky)-[0-9]+" <file>` (project rule: semantic Tailwind in `@variscout/ui`)
   - `grep "// @ts-ignore\|any\b" <file>` (TypeScript escape hatches)
   - Any file-specific known issues
2. **Fix the violations in the moved file in the same PR as the absorption.** Per `feedback_no_backcompat_clean_architecture`: the move is internal-API change; fix consumers + violations atomically.
3. **Document any deliberate carries-forward** — if a violation is preserved by intent (e.g., a `Math.random` that's documented as test-only), call it out in the absorption PR's description.

**Counter-case:** if the absorbed file is unchanged and the rule was added AFTER the file was created (e.g., a new lint rule landed on main yesterday), the absorption isn't responsible for fixing it. Audit-then-fix-at-seam is for *known existing violations* that the absorption is the natural cleanup point for.

**Cost:** ~5 minutes of audit per absorption PR. Compared to a separate fix PR (~30+ minutes including review), the seam-fix is a clear win.

**Generalizes to:** refactors that move code between layers (per package architecture), file-rename refactors, copy-and-modify patterns where the original file is being replaced.
