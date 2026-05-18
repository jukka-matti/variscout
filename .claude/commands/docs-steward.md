---
allowed-tools: [Bash, Read, Grep, Glob]
description: Run the docs Steward drift-detection loop and propose triage actions for flagged docs. Read-only proposal mode — never auto-edits cards.
---

# Docs Steward triage

You are about to triage drift candidates flagged by the docs-strategy-2026 Phase 3 Steward loop.

## Step 1 — Run the Steward

Execute `pnpm docs:steward` and read the markdown report. The script scans canonical docs with `verified-against-commit` frontmatter and flags four categories:

1. **Stale cards** — verification SHA >30 commits behind OR `last-verified` >90 days old AND doc was touched in that window.
2. **Untouched-but-referenced** — doc fresh but inbound refs grew significantly; high-traffic anchor likely needs a re-read.
3. **Citation-drift suggestions** — body cites `file:line`; those cited lines moved since verification.
4. **Missing sensor** — doc lacks `verified-against-commit` frontmatter; can't be checked.

## Step 2 — Propose actions per flagged doc

For each flagged doc, propose ONE of:

- **Re-verify** (low-risk; doc intent unchanged): `pnpm docs:verify <id>` after a fresh read. Use when the doc still describes current truth and you just want to bump the sensor.
- **Supersede** (intent invalidated): write a NEW card under `docs/cards/decisions/dec-<YYYYMMDD>-<slug>.md` with `supersedes: [<prior-id>]` frontmatter + reader-first banner pointing at predecessor. Use when the doc's CONTENT is now wrong, not just stale.
- **Archive** (obsolete): `git mv` to `docs/archive/<original-path>` + add `> 🗄 ARCHIVED — <reason>` banner at top + status: archived in frontmatter. Use when the doc describes a feature/decision that no longer applies at all.

For **missing-sensor** docs, propose: `pnpm docs:verify <id>` after a fresh read to stamp the sensor.

## Step 3 — Output proposal table

Produce a markdown table:

```
| Doc | Category | Proposed action | Rationale |
|---|---|---|---|
| adr-082-wedge-architecture | untouched-referenced | re-verify | Current truth; inbound traffic grew because wedge V1 shipped; no content change needed |
| dec-20260315-coscout-cognitive-redesign | stale | supersede (or re-verify) | CoScout AX-design.md updated; this card's recommendations may need a fresh read |
| ...
```

## Discipline reminders

- **DO NOT** edit any card body directly. Cards are append-only by definition (see `docs/agent-context/doc-discipline.md` §Cards). Supersession = NEW card, not edit.
- **DO NOT** run `pnpm docs:verify <id>` autonomously. Verification implies you re-read the doc against current code/state; only the user can confirm that judgment.
- **DO NOT** run `pnpm docs:amend` on cards — it HARD-FAILs by design.
- This command is **read-only proposal mode**. Output the proposal table; user reviews and dispatches actions manually.

## When to invoke

- Weekly cadence (e.g., Monday morning), corresponding to the GitHub Action that posts a Steward report Issue.
- After landing a large PR that touches many code paths (cited-line drift likely).
- When `MEMORY.md` or `decision-log.md` feels stale — run the Steward to surface candidates.

Background: see `docs/agent-context/doc-discipline.md` §Cards and the docs-strategy-2026 design at `docs/superpowers/specs/2026-05-16-docs-strategy-design.md`.
