---
title: 'ADR-027: AI Collaborator Evolution'
---

# ADR-027: AI Collaborator Evolution

**Status**: Accepted

**Date**: 2026-03-19

## Context

VariScout's AI integration (ADR-019) was designed with a "narrator" philosophy: AI explains deterministic statistical conclusions but never generates competing analysis or takes action on behalf of the analyst. This was the right initial position — it built trust and avoided the friction that caused EDAScout to roll back their AI chatbot.

After delivering all three AI phases (NarrativeBar, ChartInsightChips, CoScout) and observing the patterns that emerged, several capabilities already push beyond pure narration:

- **ChartInsightChips** suggest drill-down targets ("→ Drill Machine A (47%)") — this IS an action suggestion, just not yet clickable
- **Investigation coaching** in CoScout already suggests next steps based on the diamond phase
- **Improvement ideation** coaching suggests brainstorming approaches during the converging phase
- **buildSuggestedQuestions()** generates phase-aware next questions — actionable by nature

The narrator model is too restrictive for where the product has already arrived. The gap between "AI explains" and "AI suggests actions" is smaller than it appears — the key constraint is that the analyst always confirms.

## Decision

Evolve AI from **narrator** (explain only) to **collaborator** (explain + suggest actions, analyst confirms).

### Principles preserved

1. **Deterministic primacy** — The statistical engine remains the sole authority for numbers. AI never generates statistics.
2. **Analyst confirmation required** — Every AI-suggested action requires explicit user confirmation before execution. No auto-drill, no auto-pin, no auto-status-change.
3. **Graceful degradation** — Suggestions simply don't appear when AI is unavailable. No UI changes.
4. **PWA stays AI-free** — No change to the free training tool.
5. **No pricing changes** — Collaborator capabilities are part of existing AI modes, not a new tier.

### New capabilities

| Capability                          | Description                                                                    | Phase                            |
| ----------------------------------- | ------------------------------------------------------------------------------ | -------------------------------- |
| **Clickable drill suggestions**     | ChartInsightChip arrow icon → click applies filter                             | Delivered (P1-5 from evaluation) |
| **AI-suggested findings**           | CoScout proposes "[Pin as Finding]" with auto-generated text; analyst confirms | Planned                          |
| **Upfront hypothesis → data check** | Analysis brief hypothesis auto-checked against SCOUT data, seeds tree root     | Planned                          |
| **Knowledge Base in SCOUT**         | KB search available from SCOUT onward (not just INVESTIGATE+)                  | Planned                          |
| **FRAME setup coaching**            | Optional CoScout guidance during data setup                                    | Lower priority                   |

### What this does NOT change

- AI still never generates its own statistics
- AI still never auto-acts (confirmation always required)
- AI suggestions are always dismissable
- The existing deterministic suggestion system remains primary
- Error handling and offline behavior unchanged

## Consequences

### Easier

- More natural analyst experience — AI feels like a colleague, not a textbook
- Existing patterns (ChartInsightChip actions, suggested questions) become fully interactive
- Knowledge Base becomes useful earlier in the journey (SCOUT, not just INVESTIGATE+)
- Upfront hypotheses connect to the investigation tree automatically

### Harder

- Each new action type needs confirmation UX design
- Must prevent "confirmation fatigue" — too many prompts degrade the experience
- Need to ensure keyboard navigation works for all new interactive elements
- Testing matrix grows (action × mode × phase × online/offline)

## Implementation

The collaborator evolution is incremental — each capability is independent and can ship separately:

1. **Clickable drill suggestions** — Already implemented via `InsightAction` type and `onAction` callback on `ChartInsightChip`
2. **AI-suggested findings** — CoScout response parser detects `[Pin as Finding]` pattern → renders as actionable card
3. **Upfront hypothesis seeding** — `buildAIContext()` includes analysis brief hypothesis → CoScout references in SCOUT phase → auto-seed tree root
4. **Knowledge Base in SCOUT** — Remove phase gate on "Search KB?" button (currently INVESTIGATE+)
5. **FRAME coaching** — CoScout available during column mapping with setup-specific prompts

## Related

- [ADR-019: AI Integration](adr-019-ai-integration.md) — original AI architecture decision
- [ADR-026: Knowledge Base — SharePoint-First](../archive/adrs/adr-026-knowledge-base-sharepoint-first.md) — knowledge layer
- [AI Journey Integration](../05-technical/architecture/ai-journey-integration.md) — consolidated AI overview
- [AIX Design System](../05-technical/architecture/aix-design-system.md) — governance patterns (§2.8 Actionable Suggestion)
- [AI Integration Evaluation](../archive/specs/2026-03-16-ai-integration-evaluation.md) — baseline assessment
