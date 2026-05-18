---
name: brainstorming
description: "VariScout-local override for upstream Superpowers brainstorming. Adds SDD `implements:` + Deltas requirements to spec output. Use when starting any creative work — features, components, behavior changes."
---

# Brainstorming (VariScout-Local Override)

> This is a THIN VariScout-local override. **Read the upstream skill first**:
> `/Users/jukka-mattiturtiainen/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/brainstorming/SKILL.md`
>
> The upstream HARD-GATE, checklist, and process flow still apply. The additions below layer on top.

## VariScout-specific additions

When step 6 of the upstream checklist writes the spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`, the spec MUST have:

1. **`implements:` frontmatter** — a non-empty array of L1/L2/L3 paths the spec proposes deltas to. Valid prefixes:
   - `docs/01-vision/` (L1)
   - `docs/02-journeys/` (L2)
   - `docs/03-features/` (L3)
   - Occasionally `docs/05-technical/` (L4) or `docs/agent-context/` if the spec genuinely touches engineering/agent surfaces

   Every path must exist as a file. The validator HARD-FAILs missing `implements:` and broken paths (`pnpm docs:check`).

2. **`layer: spec` frontmatter** — explicit marker that this is a change-proposal, not an L1-L5 doc.

3. **Body "Deltas" section** — explicit subsection per `implements:` target, naming the concrete edit. The deltas are _named at brainstorm time, not deferred_ to a later sweep.

   Example:
   ```markdown
   ## Deltas

   ### `docs/01-vision/constitution.md`
   Add a new "Light-colors invariant" section listing Tailwind 50-300 surfaces / 400-700 text.

   ### `docs/03-features/investigation-wall.md`
   Add `kind: ui` frontmatter + ASCII wireframe under "## Intent diagram".
   ```

## Why

These additions enforce the Propose → Apply → Archive lifecycle: every brainstorm output is a change-proposal that names its targets up front, so the Apply phase (writing-plans / subagent-driven-development) can update L1-L3 docs _before_ code lands. No more "we'll update product docs later" sweeps.

## Canonical contract

See `docs/superpowers/specs/2026-05-18-spec-driven-development-design.md` (§Design-Spec Lifecycle, §Brainstorm-to-Code Flow Updates) for the full contract. The validator at `scripts/check-doc-frontmatter.mjs` HARD-FAILs missing `implements:` on specs in `docs/superpowers/specs/` (M5 onwards).
