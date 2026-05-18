---
name: writing-plans
description: "VariScout-local override for upstream Superpowers writing-plans. Mandates an Apply phase as the FIRST task in feature-work plans (edits L1-L3 docs before code). Use when turning a spec into an implementation plan."
---

# Writing Plans (VariScout-Local Override)

> This is a THIN VariScout-local override. **Read the upstream skill first**:
> `/Users/jukka-mattiturtiainen/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/writing-plans/SKILL.md`
>
> The upstream task-granularity, file-structure, and TDD rules still apply. The additions below layer on top.

## VariScout-specific additions

Plans for **feature work** (anything that lands code in `packages/*/src/` or `apps/*/src/`) MUST include an **Apply phase** as the FIRST task:

> **Task 1 — Apply phase**: Edit `implements:` target docs (L1/L2/L3) to reflect the new state described by the design spec. Flip spec `status:` to `active`. Land as a docs-only commit (or the opening commits of the feature branch).

This task lands BEFORE any code-touching task. Subsequent code tasks reference the now-updated L1-L3 docs as their spec — not the design spec under `docs/superpowers/specs/`.

### Why this ordering matters

- L1-L3 docs become the SoT _before_ code lands, so reviewers verify code against updated product docs.
- Eliminates Phase A/C "update product docs after the fact" sweeps that historically followed every feature.
- A docs-only commit lets reviewers focus on intent before reviewing implementation.

### Exceptions

- **Infrastructure-only plans** (tooling, scripts, hooks, CI, dependencies) skip the Apply phase if no L1-L3 docs are affected. The plan should still note this explicitly: _"No Apply phase — infrastructure-only, no L1-L3 deltas."_
- **Pure refactors** that don't change product behavior — same exception applies.

## Last task: archive the design spec

The final task of any feature-work plan should be:

> **Task N — Archive design spec**: `git mv docs/superpowers/specs/<date>-<slug>-design.md docs/archive/specs/<date>-<slug>-design.md`. Flip `status: archived`, add Delivered banner at top, set `delivered-by: PR #N` frontmatter. Capture an ADR under `docs/07-decisions/` IF a decision survives that warrants an immutable record.

## Canonical contract

See `docs/superpowers/specs/2026-05-18-spec-driven-development-design.md` (§Design-Spec Lifecycle, §Brainstorm-to-Code Flow Updates) for the Propose → Apply → Archive lifecycle in full.
