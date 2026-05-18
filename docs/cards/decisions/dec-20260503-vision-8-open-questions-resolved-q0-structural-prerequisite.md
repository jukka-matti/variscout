---
title: 'Vision §8 open questions resolved + Q0 (structural prerequisite) added'
purpose: decide
tier: card
status: active
date: 2026-05-03
topic: ['decisions', 'supersession', 'coscout', 'canvas']
verified-against-commit: 6f51f080
last-verified: 2026-05-18
supersedes: []
---
> **Decision card** — extracted from `docs/decision-log.md` §1 on 2026-05-18. Aggregate view: [`decision-log.md`](../../decision-log.md) (generated).

# Vision §8 open questions resolved + Q0 (structural prerequisite) added

Walk-through resolved 11 brainstorm-default markers from [`docs/archive/specs/2026-05-03-variscout-vision-design.md`](archive/specs/2026-05-03-variscout-vision-design.md) §8 plus a new **Q0** ("tab vs canvas scaffold") that emerged from journey mapping (the §8 questions silently assumed an answer to it). Headlines: **Canvas eats Frame + Analysis tabs (Q0)** — Investigation / Improvement / Report keep their own surfaces; top-level nav post-cutover is `[ Hubs ] [ Canvas ] [ Investigation ] [ Improvement ] [ Report ]`. **Wall is dual-home (Q4)** — destination in Investigation tab AND a canvas overlay. **Drill-down is a modern floating overlay anchored to clicked card with blurred-canvas backdrop (Q1, overrides spec default)** — resolves the C3 supersession conflict with CoScout's right-rail claim; mobile slides up from bottom. **No CoScout map drafting in V1, manual canvas authoring is the path (Q5, overrides default)** — V1 commits to manual click / drag / connect as a first-class design concern; CoScout coaching role unchanged. **PWA gets a local Hub-of-one with IndexedDB persistence (Q8)** — single Hub, browser-tenant-only per ADR-059; Azure adds cloud sync + multi-Hub + cadence + CoScout + team features. **Hard cutover with no migration (Q7)** — no users yet to preserve, deletes happen in the same PR per the no-back-compat rule. **Horizons split out to a delivery-sequence reference doc (Q6).** **Glossary at `docs/glossary.md` becomes canonical (Q10)** — methodology.md cross-references it. **Promoted hypotheses render as node markers, drafts as faint arrows (Q11).** Vision spec §3.4, §5.2, §5.3, §5.4, §5.6, §5.7, §6, §7, §8 rewritten in place; §8 replaced "open questions" with a "resolved decisions" table. ADR-070 (FRAME workspace) amended with a "superseded by Canvas" supersession note. Frontmatter status promoted from `draft` to `accepted`. Full decisions + spec/ADR follow-ups in `~/.claude/plans/lets-do-this-next-rustling-simon.md`. **Next:** brainstorming the FRAME canvas detail spec (§3.3 ten commitments × §5 surfaces translated into detailed UX), inheriting these locked answers. _Pinned 2026-05-03._
