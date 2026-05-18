---
title: 'Spec-driven development design drafted'
purpose: decide
tier: card
status: active
date: 2026-05-18
topic: ['docs-strategy', 'spec-driven-development', 'workflow', 'authoring-stack']
verified-against-commit: HEAD
last-verified: 2026-05-18
supersedes: []
---

> **Decision card** — design spec for spec-driven development drafted post-Phase-3 of docs-strategy-2026. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Spec-driven development design drafted

**Spec**: [`docs/superpowers/specs/2026-05-18-spec-driven-development-design.md`](../../superpowers/specs/2026-05-18-spec-driven-development-design.md) — draft status.

**Context**: Phase 3 of docs-strategy-2026 shipped (PRs #199/#200/#201/#202) on 2026-05-17. The post-Phase-3 brainstorm topic — _the SSoT collision between `docs/superpowers/specs/` and product docs_, with user verbatim framing "real product specs first, then code" — has been carried through to a full design spec on 2026-05-18.

**The design (high-level)**:

- **5-layer authoring stack** — L1 Vision (`01-vision/`) → L2 Journeys (`02-journeys/`) → L3 Features (`03-features/`) → L4 Engineering (`05-technical/`, conditional) → L5 ADRs (`07-decisions/`). Code is realized by the cascade.
- **Design specs as deltas** (not parallel SSoT): Propose → Apply → Archive lifecycle. `implements:` frontmatter required, listing L1/L2/L3 targets the spec proposes changes to. L1-L3 docs updated _before_ code lands. After delivery, spec archives.
- **UI integration policy**: mandatory Mermaid/ASCII intent diagrams inside L3 specs (per `kind: ui | workflow | engine | infrastructure`). No Figma adoption. No Storybook adoption. Light-colors-only Tailwind palette (50-300 surfaces / 400-700 text/strokes; no dark mode V1).
- **Enforcement**: 3 mechanisms (validator HARD-FAIL + WARN rules, pre-push hook + PR template self-check, Steward loop drift detection — all phased WARN-then-HARD-FAIL).
- **Brainstorm-to-code flow updates**: `superpowers:brainstorming` requires `implements:` in spec output; `superpowers:writing-plans` mandates Apply task first; `superpowers:subagent-driven-development` executes Apply before code.

**Migration (6 phases, 5 PRs over 2-4 weeks)**:

- M0 Inventory + Capture Confidence (`docs/cards/investigations/2026-05-18-sdd-migration-inventory.md`) — gates everything else
- M1 Frontmatter retrofit (~143 docs, WARN-only)
- M2 L1 reconciliation (extend `constitution.md`, don't duplicate) + L2 reshape (V1 personas Lead/Member/Sponsor + IA nav model; retire legacy 10 personas)
- M3 L3 audit + reshape (48 files → ~30 stay + ~18 graduate to L4)
- M4 Active design specs retrofit (46 → ~10-15 active + ~30 archived + a few allowlisted)
- M5 Enforcement go-live + skill updates

**Grounded by**: GitHub Spec Kit, AWS Kiro, OpenSpec, Tessl, Sean Grove "The New Code" (2025), Anthropic Constitution precedent, Martin Fowler SDD framing, Stripe/Linear/Amazon/Anthropic authoring-stack patterns, Marty Cagan + Teresa Torres + Lean UX Canvas V2 + JTBD discovery patterns, Wireloom/WireMD wireframes-in-markdown emergent convention.

**Next step**: invoke `superpowers:writing-plans` to plan PR-SDD-0 (M0 inventory card) in detail.

**Status**: draft spec; not yet under Apply phase. Once user reviews spec + writing-plans produces M0 plan, M0 inventory work begins.
