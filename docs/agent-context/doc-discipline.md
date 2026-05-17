---
title: 'Doc Discipline — SSoT by Doc Type'
purpose: agent-context
tier: living
audience: agent
topic: [ax, discipline, governance]
status: active
last-verified: 2026-05-17
related: [adr-083-eight-purpose-doc-taxonomy, 2026-05-16-docs-strategy-design]
---

# Doc Discipline — Single Source of Truth by Doc Type

> Loaded by the `agent-context-quickstart` skill. **Read before editing ANY canonical doc.**
> Full design rationale: [`docs-strategy-design.md §2.7`](../superpowers/specs/2026-05-16-docs-strategy-design.md).

## The core principle

Different doc types serve different jobs and update differently. **Conflating them creates orphan-amendment drift** — readers can't tell which version is current without mental merging.

## Doc types + update patterns

| Doc type           | Where it lives                                                         | Job                                    | Update pattern                                                                                                   |
| ------------------ | ---------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Design spec**    | `docs/superpowers/specs/`, `docs/01-vision/coscout-ax-design.md`, etc. | Always-current intended state          | **Edit in place.** Spec body = the truth at any moment.                                                          |
| **ADR**            | `docs/07-decisions/adr-*.md`                                           | Point-in-time decision record          | `## Amendment — YYYY-MM-DD` block at bottom. New ADR for fundamental reframings.                                 |
| **Decision-log**   | `docs/decision-log.md`                                                 | Chronological pinned-decisions index   | Append-only. Never edit prior entries. New entry supersedes old.                                                 |
| **Generated docs** | `*-generated.md`                                                       | Mechanical projection of source        | Never hand-edit. Update the generator script + regenerate. `.prettierignore` excludes.                           |
| **Plan files**     | `~/.claude/plans/`                                                     | Ephemeral session transcripts          | Live private. Never become canonical. Optionally promote to `docs/ephemeral/transcripts/` for landmark sessions. |
| **Investigations** | `docs/investigations.md`                                               | Pre-decision observations              | Open entries editable while open. `[RESOLVED]` entries immutable.                                                |
| **Memory**         | `~/.claude/projects/.../memory/`                                       | Cross-session durable facts for Claude | Topic files: edit in place. Index in MEMORY.md: one-line entries ≤200 chars.                                     |

## Anti-patterns (mechanically forbidden)

| Anti-pattern                                                                                                               | Why wrong                                                                          | Right pattern                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `*-amendment-design.md`, `*-revision-design.md`, `*-update-design.md`, `*-followup-design.md` in `docs/superpowers/specs/` | Orphan amendments invisible to a new session reading only the canonical            | Edit canonical in place + decision-log entry. **HARD-FAILed by validator (Play 2b).**             |
| Editing ADR body after `status: accepted` (changing the decision itself)                                                   | Loses original decision context; future readers can't see what was decided         | New `## Amendment — YYYY-MM-DD` block at bottom, OR new ADR with `supersedes:` chain              |
| Editing prior decision-log entries                                                                                         | Breaks chronological record                                                        | New entry with `[supersedes <prior-date>]` marker                                                 |
| Hand-editing `*-generated.md` files                                                                                        | Out-of-sync with source; next regen wipes edits                                    | Update the generator script + regenerate                                                          |
| Putting active-decision content only in plan files                                                                         | Plan files live in `~/.claude/plans/`, not in repo; future sessions can't see them | Land decisions in canonical home (ADR / spec / decision-log) before merging the PR they came from |
| Renaming canonical docs without `supersedes:` chain                                                                        | Breaks inbound links + obscures lineage                                            | `git mv` + add `supersedes:` to new path's frontmatter + redirect banner at old                   |
| Two design specs claiming canonical status for the same concept                                                            | Forks the SoT; readers don't know which to trust                                   | One canonical home per concept (Play 4 enforces). Other docs link, not restate.                   |

## Spec lifecycle states (explicit)

For design specs (`docs/superpowers/specs/` and equivalents), `status:` reflects reality:

| Status       | Meaning                                          | Body update pattern                                                         |
| ------------ | ------------------------------------------------ | --------------------------------------------------------------------------- |
| `draft`      | Designing; not yet building                      | Edit freely. `last-verified` discipline starts at `active`.                 |
| `active`     | Designed; build underway                         | Edit in place when intent changes. Bump `last-verified`.                    |
| `delivered`  | Shipped; `delivered-by: PR #N` set               | Body describes current state of shipped feature. Edit when feature evolves. |
| `superseded` | Replaced by another spec via `supersedes:` chain | Frozen. Redirect banner at top pointing to successor.                       |
| `archived`   | Historical reference only                        | Frozen. Moved to `docs/archive/`. Not cited from canonical surfaces.        |

Transitions are explicit + auditable (frontmatter diff is the signal).

## Edit-in-place mechanics (for design specs)

When editing a canonical spec mid-flight:

1. **Make the edit** in place. Don't create a side file.
2. **Update `last-verified: YYYY-MM-DD`** frontmatter to today.
3. **Add decision-log entry** citing the change:
   ```
   - YYYY-MM-DD — <short title>. Spec edit: <doc>#<section> [supersedes prior text].
     <Why>: <one-sentence rationale>. Commit: <sha>.
   ```
4. **Commit** with message covering both the spec edit and the log entry.
5. **(If during build PR)** flag the change in the PR description so reviewers see it.

## Decision-log as temporal index

Every change to a canonical doc — spec body edit, ADR amendment, supersession — gets a decision-log entry. The decision-log is the chronological backbone over the canonical doc set: canonical docs themselves are always "as of now"; the log tells you "what changed when and why".

The `[supersedes <doc>#<section>]` marker is machine-readable + greppable for finding what changed.

## Decision tree: "I need to change a canonical doc"

```
Q1: Is the doc a design spec, ADR, or decision-log entry?

  Design spec:
    Q2: Is the change material reframing (the spec describes a fundamentally
        different design now)?
      Yes → New spec with supersedes: [<old-id>]. Mark old superseded.
      No  → Edit the spec body in place. Add decision-log entry. Bump
            last-verified. (DO NOT create *-amendment-*.md side file.)

  ADR:
    Q2: Is the change material reframing (the original decision is reversed
        or fundamentally restructured)?
      Yes → New ADR with supersedes: [<old-id>]. Mark old superseded.
      No  → Append ## Amendment — YYYY-MM-DD block at the bottom of the ADR.
            Add decision-log entry. (DO NOT edit the original decision text.)

  Decision-log entry:
    Always → Append a NEW entry with [supersedes <prior-date>] marker.
             (DO NOT edit the prior entry.)
```

## Why this matters

Without doc-type discipline, the 8-purpose × 4-tier schema is just metadata gymnastics. With it, the corpus stays coherent as it scales. At any moment, "what is the current intended state of X?" has exactly ONE answer: the canonical doc for X. No mental merging. No side-spec hunting. No "what supersedes what" archaeology in plain reading.

This is the principle that prevents "superpowers providing specs over specs".

## Enforcement (Play 2b)

- Validator HARD-FAILs filenames matching `*-amendment-*.md`, `*-revision-*.md`, `*-update-*.md`, `*-followup-*.md` in `docs/superpowers/specs/`.
- Validator WARNs on design-spec body diffs that add a `## Amendment` heading (allowed for ADRs only).
- Validator WARNs on design-spec `status: delivered` without `delivered-by:` frontmatter.
- Validator WARNs on `git diff` to decision-log lines older than 7 days (append-only convention).
- This skill (`agent-context-quickstart`) loads this doc on session start so every subagent gets the rules cold.

`.docs-discipline-allowlist` escape hatch for rare intentional exceptions; additions require decision-log entry citing rationale.

## Origin story

This discipline was codified after the **wedge-amendment incident (2026-05-17)**: a mid-flight design change to the wedge spec was captured as a separate `2026-05-16-improve-tab-amendment-design.md` file. A new session loaded the wedge spec, didn't see the amendment doc, went down the wrong path. The user had to intervene + correct.

The lesson: convention alone doesn't prevent this — mechanical enforcement (Play 2b) does. The original Play 2b proposed "addendum threads on all living docs" — also wrong-shape because it conflated design specs (current-state SoT) with ADRs (point-in-time records). Different doc types need different patterns.

Related: [[feedback_design_specs_edit_in_place]], [[project_adr_amendment_convention]], [[project_eight_purpose_taxonomy]]
