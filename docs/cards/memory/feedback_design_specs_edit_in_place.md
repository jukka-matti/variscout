---
title: 'feedback-design-specs-edit-in-place'
description: 'Design specs (docs/superpowers/specs/) are current-state SoT — edit in place when intent changes. NEVER create `*-amendment-*.md` side files. ADRs amendment-block-at-bottom; decision-log append-only; different doc types update differently.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: c6cf0f8c5
last-verified: 2026-05-18
source-hash: 06404cd7f6cd6d90
origin-session-id: 6b6ea222-9daf-42ab-b211-7ad309428640
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_design_specs_edit_in_place.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

# Doc-type discipline for canonical docs

Different doc types serve different jobs and update differently. Conflating them creates orphan-amendment drift (the wedge-amendment incident).

## The discipline by doc type

| Doc type | Job | Update pattern |
|---|---|---|
| **Design spec** (`docs/superpowers/specs/`, `docs/01-vision/coscout-ax-design.md`, etc.) | Always-current intended state | **Edit in place.** Spec body at any moment = the truth. |
| **ADR** (`docs/07-decisions/adr-*.md`) | Point-in-time decision record | `## Amendment — YYYY-MM-DD` block at bottom OR new ADR for fundamental reframings (existing convention per `project_adr_amendment_convention`). |
| **Decision-log** (`docs/decision-log.md`) | Chronological pinned-decisions log | Append-only; never edit prior entries; new entry supersedes old. |
| **Generated docs** (`*-generated.md`) | Mechanical projection of source | Auto-rebuilt by scripts; never hand-edit; `.prettierignore` excludes (per `feedback_autogen_doc_prettierignore`). |
| **Plan files** (`~/.claude/plans/`) | Ephemeral session transcripts | Live private; selective promotion to `docs/ephemeral/transcripts/` for landmark sessions. NEVER become canonical. |

## Hard anti-patterns

- **`*-amendment-design.md`, `*-revision-design.md`, `*-update-design.md` side files in `docs/superpowers/specs/`** — orphan amendments invisible to a new session reading only the canonical spec. The wedge-amendment incident (2026-05-17) is the textbook example: amendment created as a separate spec file; subagent in fresh session loaded wedge spec, didn't see the amendment doc, went down the wrong path.
- **Editing ADR body after `status: accepted`** — loses original decision context. Use amendment block + date.
- **Editing prior decision-log entries** — breaks chronological record. New entry supersedes.
- **Hand-editing `*-generated.md`** — out-of-sync with source; next regen wipes.

## Why this matters

The user's concern: "should we have specific specs for everything as a source of truth that defines what is coded, instead of superpowers providing specs over specs and we don't have one source of truth?"

Answer: **YES, exactly that.** The mechanism is doc-type discipline — different doc types serve different roles, but each TYPE has one canonical pattern. Design specs are the SoT for "what we're building / what we built". Edit them. Don't create amendment-specs-over-specs. The decision-log is the temporal index over the canonical doc set.

## How to apply

When editing a canonical design spec mid-flight:
1. Make the edit.
2. Update `last-verified: <today>` frontmatter; bump `verified-against-commit: <sha>` after commit.
3. **Add a status banner at the top** of the body (after the H1) noting the material edit — frontmatter alone is invisible to a fresh-session reader. Templates + the full required/recommended matrix live in `docs/agent-context/doc-discipline.md` §Reader-first banners. Pattern: `> 🔄 **Last material edit 2026-MM-DD** — §<section> rewritten: <one-sentence what>. See [decision-log](../../decision-log.md) for rationale.`
4. Add decision-log entry citing the section change with `[supersedes <doc>#<section>]` marker.
5. Commit with message capturing both edit + log entry.

When tempted to create `<topic>-amendment-design.md`: **don't**. Edit the canonical instead. If the change is large enough to feel "amendment-worthy", it's large enough to land as a proper edit + banner at top + decision-log entry. If the change is fundamental enough to warrant a new spec entirely, supersede with `supersedes: [<id>]` chain (not "amend") + redirect banner at top of the superseded spec.

**Two principles together**: (a) edit canonical in place — body always reflects current truth, (b) put a reader-first status banner at the TOP when there's reader-relevant divergence (recent material edit, supersession, delivered state, ADR with amendments below). Wikilinks (`[[name]]`) are passive at read time and don't substitute for active banners.

## Enforcement (Play 2b)

Validator HARD-FAILs filenames matching `*-amendment-*.md` / `*-revision-*.md` / `*-update-*.md` / `*-followup-*.md` in `docs/superpowers/specs/`. Convention doc at `docs/agent-context/doc-discipline.md` (when Play 2b ships) provides the rules; `agent-context-quickstart` skill loads it on session start so every subagent gets the discipline cold.

## Why "addendum threads on all living docs" (original Play 2b) was wrong

The original Play 2b proposed `## Amendments` sections on ALL living docs uniformly. That conflated design specs (current-state) with ADRs (point-in-time records). Design specs should NEVER accumulate amendment threads — their bodies should always reflect current truth. Amendment threads on ADRs preserve decision provenance (good); amendment threads on design specs fork the canonical state across body + thread (bad).

The wedge-amendment incident surfaced this. Strategy spec §2.7 + revised Play 2b in `docs/superpowers/specs/2026-05-16-docs-strategy-design.md` capture the correction.

Related: [[feedback_parallel_workstream_conflict_check]], [[feedback_taskstop_subagent_pivot]], [[feedback_autogen_doc_prettierignore]], [[project_docs_strategy_2026]], [[project_eight_purpose_taxonomy]], [[project_adr_amendment_convention]]
