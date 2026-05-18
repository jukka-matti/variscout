---
title: 'Map journey × persona before answering UI mechanics'
description: 'When asked to lock spec defaults or answer UI form questions, pull back to journey + persona + cognitive shape before evaluating options. The §8 walkthrough caught a structural Q0 the spec missed because journey mapping surfaced Mode A (cadence) vs Mode B (first-time GB) splitting UI questions unevenly.'
purpose: remember
tier: card
status: active
date: 2026-05-18
topic: [memory, feedback]
related: []
verified-against-commit: 6f51f080
last-verified: 2026-05-18
origin-session-id: 503ee542-f216-48e3-9706-8b2aaf6de3ee
---

> 🤖 **Generated mirror** of `~/.claude/memory/feedback_journey_first_then_ui.md`. Edit there, not here. Card synced by `scripts/docs/sync-memory-cards.mjs`; re-run via `pnpm docs:rebuild` (Phase 3 A4).

**Rule.** Before evaluating UI options for a spec question, map the journey × persona × surface inventory. Multiple journey modes can split the same question into different answers — and the spec sometimes silently assumes only one mode.

**Why:** In the 2026-05-03 §8 walk-through, the user pulled back twice when I jumped to UI mechanics. First push: "lets reflect what kind of things we have in the journey, what are the needs of the user(s) what is the context we are talking about now? we also have a case that we could open an other window? in we have coscout!" Second push: "but this is one usecase, the otherone is a gb, who downloads the data for the first time, right???" — surfacing that the spec's drill-down default (Q1) implicitly assumed Mode A (cadence-loop process owner with mature Hub) when Mode B (first-time green-belt with fresh CSV, no Hub, no CoScout) is at least equally common and is the dominant PWA-tier flow.

The journey × surface mapping that followed surfaced **Q0** — a structural prerequisite the spec's §8 didn't ask: "does the unified canvas replace the 5-tab nav, or live inside one of the tabs?" Every other §8 question depended on the answer.

**How to apply:**

- **Spec question that names a UI element** (drill-down panel, gesture, lens, overlay): before evaluating shape options, map who clicks the element, in which mode, with what surrounding context, and what cognitive shape (scanning vs deciding vs editing vs composing).
- **Look for journey-mode splits.** When the spec assumes one persona / state / tier, check the others. VariScout's known split: Mode A (cadence loop, mature Hub, Azure tier, CoScout present) vs Mode B (first-time green-belt / analyst, no Hub, fresh CSV, PWA tier, no CoScout). The same UI question often has different shape per mode — and the spec usually only addresses one.
- **Inventory the existing surface real-estate before designing new ones.** What's the right-rail? Left-rail? Header chrome? What's claimed and by what? In VariScout, CoScout owns the right rail in Azure (locked by C3 supersession), and the pop-out window pattern (`usePopoutChannel`) is shipped — both are facts the spec defaults need to honor or override knowingly.
- **Cognitive shape per surface:** scanning loop = seconds, drill-down = minutes, investigation = hours, charter = days. One UI surface usually can't serve more than ~2 of these well. If the spec wants one drill-down for everything, that's a smell.
- **Pattern: when stuck on options, fan out via Explore agents in parallel** to map (a) journey moments + persona needs, (b) existing surface real-estate / shipped patterns, (c) prior decisions in decision-log + investigations.md. Then re-pose the question with that map in hand.

**Operationally:** if the user gives a spec question and you reach for option-menus before journey-mapping, slow down. Ask "who's clicking this, in what mode, surrounded by what?" first. The right answer often falls out of cognitive shape, not from comparing UI options abstractly.

**Linked memories:** `feedback_world_class_critique` (related — bring opinionated craft critique with concrete sketches, not neutral option menus) and `feedback_validate_architecture` (CTO/AI expert review before multi-layer implementations). This memory is the journey-side complement to those two.
