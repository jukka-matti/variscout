---
title: 'Code-review subagents must check out the PR branch before assessing'
description: 'Reviewing against `main` produces false negatives (e.g., "0 of 6 tasks implemented" when PR has 248 files). Always git fetch + checkout the PR branch first.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: d80977d0ea74e92f
origin-session-id: 4dc98d7b-6a43-414c-8387-61555905cfc7
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_code_review_subagent_must_checkout_pr_branch.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

When dispatching a code-review subagent for a PR, the prompt MUST include explicit pre-condition steps to check out the PR branch. Reviewing against the local `main` (or whatever branch happens to be checked out) produces catastrophic false negatives.

**Why:** Per RPS V1 PR-RPS-1 review (2026-05-09) — first dispatched reviewer reported "0 of 6 tasks implemented" because they assessed against local `main`. The actual PR had 248 files / +2131/-1954 / 8 commits with all 6 tasks done correctly. The reviewer noted in their report: *"The codebase is on `main` and the PR #144 lives on a separate branch that is not checked out. The review can be completed from the spec/plan + what I've verified is absent from the pre-PR-1 codebase."* — that's the failure mode in plain English.

**How to apply:**

In any code-review subagent prompt, include a STEP 0 block at the top:

```markdown
## STEP 0 (CRITICAL — do FIRST)

The repo may be on the wrong branch. To review the actual PR contents:

​```bash
git fetch origin <pr-branch-name>
git checkout <pr-branch-name>
git log --oneline main..HEAD     # see the commits in the PR
git branch --show-current        # verify you're on the right branch
​```

If you can't check out the branch (uncommitted changes / worktree conflict), STOP and report the blockage. Do NOT proceed with review against the wrong branch.

When done, leave the working tree on the PR branch (don't switch back).
```

**Other safeguards in the same prompt:**

- Use `gh pr view <N> --json files` and `gh pr diff <N>` for verifying the PR's intended scope
- Note the `gh pr view --json files` output is capped at 100 files — for large PRs, use `gh api "repos/{owner}/{repo}/pulls/<N>/files?per_page=100&page={1,2,3}"` paginated
- For very large diffs, ask the agent to spot-check key files rather than read every diff line — they have limited context
- If a downstream subagent reviewer ever reports "0 tasks implemented" or similarly extreme negative findings, IMMEDIATELY verify with `gh pr view <N> --json additions,deletions,changedFiles` before accepting

**Related:**
- `feedback_verify_subagent_staging_gap` — verify subagent commit tree state via `git show <commit> --stat`
- `feedback_verify_preexisting_failure_claims` — verify "pre-existing failure" claims on actual main checkout
- `feedback_subagent_driven_catches_bugs` — subagent reviewers DO catch bugs reliably WHEN dispatched correctly; the failure mode here is a prompt deficit, not a reviewer-quality issue
