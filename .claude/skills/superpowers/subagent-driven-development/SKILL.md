---
name: subagent-driven-development
description: "VariScout-local override for upstream Superpowers subagent-driven-development. Dispatches the Apply task FIRST (docs-only commit updating L1-L3) before code tasks; archives the design spec after delivery. Use when executing a plan."
---

# Subagent-Driven Development (VariScout-Local Override)

> This is a THIN VariScout-local override. **Read the upstream skill first**:
> `/Users/jukka-mattiturtiainen/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/subagent-driven-development/SKILL.md`
>
> The upstream fresh-implementer-per-task, spec+quality-reviewer pair, and final-code-reviewer protocol still apply. The additions below layer on top.

## VariScout-specific additions

When executing a plan that includes an Apply phase (per the `writing-plans` override):

### 1. Dispatch Apply FIRST

The first subagent dispatch is the Apply task. It produces:
- A docs-only commit (or the opening commits of the feature branch) updating L1-L3 docs to reflect the new state described by the design spec.
- The design spec's `status:` flipped from `draft` to `active`.

**No code-touching subagent dispatches before Apply completes.** Subsequent code tasks reference the now-updated L1-L3 docs as their spec — not the design spec under `docs/superpowers/specs/`.

### 2. Code tasks reference updated L1-L3 docs

When dispatching code-task implementers, point them at the now-updated L1-L3 docs (not the original design spec). The design spec under `docs/superpowers/specs/` becomes a change-proposal/plan-of-record; the L1-L3 docs are the SoT for "what the code should look like".

### 3. Final task: Archive the design spec

After all code tasks complete and the final code-reviewer is green, dispatch one last task:

> **Archive task**: `git mv docs/superpowers/specs/<date>-<slug>-design.md docs/archive/specs/<date>-<slug>-design.md`. Flip `status: archived`, add Delivered banner at top (`> 🗄 Archived YYYY-MM-DD — deltas absorbed into [L1-L3 paths]`), set `delivered-by: PR #N` frontmatter. Capture an ADR under `docs/07-decisions/` IF a decision survives that warrants an immutable record.

### Exception: infrastructure-only plans

If the plan declared no Apply phase (infrastructure-only / pure refactor), skip steps 1 and 3 — proceed with the upstream protocol directly.

## Canonical contract

See `docs/superpowers/specs/2026-05-18-spec-driven-development-design.md` (§Design-Spec Lifecycle, §Brainstorm-to-Code Flow Updates) for the Propose → Apply → Archive lifecycle in full.
