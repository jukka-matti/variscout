---
name: 'Docs Toolbox'
description: 'Use when searching the docs corpus, finding related specs/ADRs, listing recent changes, verifying spec freshness, or amending ADRs. Provides the `pnpm docs:find / docs:get / docs:related / docs:recent / docs:verify / docs:amend` retrieval surface so subagents can locate canonical homes for any concept without grep-walking 500+ files.'
---

# Docs Toolbox

## When to use this skill

Use whenever a task needs to:

- **Find** the canonical home for a concept ("where is the wedge spec?", "all CoScout AX docs", "ADRs about response paths")
- **Get** the full body of a doc by id or path
- **Discover related** docs via the bidirectional graph (frontmatter `related:` + body `[[wikilinks]]`)
- **List recent** new docs or decision-log entries since a date (e.g., "what changed since Phase 1 shipped?")
- **Verify** a spec is still current (bump `last-verified` + `verified-against-commit` after re-reading)
- **Amend** an ADR with a dated amendment block (ADR-only — design specs edit in place)

Skip this skill for: editing prose inside a doc you already have open; one-off `grep` you already know the path for.

## Tool surface

| Command                                            | What it does                                                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `pnpm docs:find --purpose=X --topic=Y --tier=Z`    | Filter docs by frontmatter fields. `--keyword=K` adds keyword filter. `--limit=N` caps output.              |
| `pnpm docs:get <id-or-path>`                       | Print the full doc.                                                                                          |
| `pnpm docs:related <id>`                           | Forward + backward neighbors (frontmatter `related:` + body `[[wikilinks]]`).                               |
| `pnpm docs:recent --since=YYYY-MM-DD`              | New docs + decision-log entries since cutoff.                                                                |
| `pnpm docs:recent --since=YYYY-MM-DD --amendments` | Restrict decision-log to entries with canonical edit-types (spec edit / ADR amendment / etc.).               |
| `pnpm docs:verify <id>`                            | Bump `last-verified` + `verified-against-commit` after re-reading.                                          |
| `pnpm docs:amend <adr-id> "<summary>"`             | Append a dated `## Amendment` block to an ADR. HARD-FAILS on design specs.                                  |

## Task kits

### "Where is the canonical X?"

```bash
pnpm docs:find --keyword="X"                  # broad search
pnpm docs:find --purpose=design --topic=X     # narrow by purpose+topic
pnpm docs:find --purpose=decide --keyword=X   # decisions about X (ADRs + decision-log entries)
```

### "What's recently changed?"

```bash
pnpm docs:recent --since=2026-05-10                 # everything since cutoff
pnpm docs:recent --since=2026-05-10 --amendments    # just canonical edit-types
```

### "What's related to Y?"

```bash
pnpm docs:related adr-082-wedge-architecture
```

### "Re-verifying a spec after re-reading"

```bash
pnpm docs:get 2026-05-16-wedge-architecture-design  # read full body
# ...if no changes needed, just:
pnpm docs:verify 2026-05-16-wedge-architecture-design
```

### "Adding an amendment block to an ADR"

```bash
pnpm docs:amend adr-082-wedge-architecture "Nav amended — see [[2026-05-16-improve-tab-amendment-design]]"
```

(Design specs **do not** get amendment blocks — edit them in place + log to `docs/decision-log.md`. See `docs/agent-context/doc-discipline.md` §Edit-in-place mechanics.)

### "Listing recent decision cards"

```bash
pnpm docs:recent --since=2026-05-01                 # all activity (cards + log + other docs)
pnpm docs:recent --since=2026-05-01 --amendments    # restrict decision-log entries to canonical edit-types
```

Output groups: "Decision cards added or last-verified since X" (from `docs/cards/decisions/`), "Decision-log §4 backlog updates since X" (hand-authored §4 entries), "Other docs since X" (walks `docs/**` excluding cards), "Decision-log entries since X" (legacy view for back-compat).

### "Adding a new decision card"

```bash
# 1. Write the card under docs/cards/decisions/dec-<YYYYMMDD>-<slug>.md with frontmatter:
#    purpose: decide, tier: card, status: active, date: <YYYY-MM-DD>, topic: [...]
# 2. Regenerate the aggregate:
pnpm docs:rebuild
# 3. Verify the new card shows up:
pnpm docs:find --tier=card --purpose=decide --keyword=<your-topic>
```

Don't edit `docs/decision-log.md` §1/§2/§3 directly — those sections are regenerated from cards on every rebuild. Hand-edits get wiped.

### "Superseding a decision card"

Cards are **append-only by definition**. To change a card:

```bash
# 1. Write a NEW card with `supersedes: [<prior-card-id>]` in frontmatter + a banner
#    pointing at the predecessor. Don't edit the old card's body.
# 2. Rebuild:
pnpm docs:rebuild
```

`pnpm docs:amend` HARD-FAILs on `docs/cards/**` paths. See `docs/agent-context/doc-discipline.md` §Cards for the supersession pattern.

## Discipline reminders

The toolbox is the retrieval half; `docs/agent-context/doc-discipline.md` is the editing half. Before editing any canonical doc, invoke `agent-context-quickstart` skill and read the discipline doc. The validator (`scripts/check-doc-frontmatter.mjs`) HARD-FAILs:

- `*-amendment-*.md`, `*-revision-*.md`, `*-update-*.md`, `*-followup-*.md` filenames under `docs/superpowers/specs/`
- `status: superseded`/`archived` without the matching banner in first 15 body lines
- `supersedes: [...]` without banner mentioning predecessor

`--diff` mode adds WARNs for stale decision-log edits and design-spec `## Amendment` headings.

## Implementation

Scripts live in `scripts/docs-toolbox/` and are wired via root `package.json`. Shared helpers at `scripts/docs-toolbox/lib/frontmatter.mjs` (parse + wikilinks) and `scripts/docs-toolbox/lib/edit-types.mjs` (decision-log entry parser + canonical edit-type vocabulary).

Phase 3 added the cards substrate at `docs/cards/{decisions,investigations,memory}/`. The toolbox's recursive walks (`find`, `get`, `related`, `verify`) pick up cards automatically. `recent.mjs` is dual-source (cards + decision-log §4 backlog). `amend.mjs` HARD-FAILs on `docs/cards/**` (cards are append-only by definition — supersede via new card). Aggregate views (`docs/decision-log.md`, `docs/cards/memory/`) are regenerated by `pnpm docs:rebuild` (`scripts/docs/rebuild-views.mjs`).
