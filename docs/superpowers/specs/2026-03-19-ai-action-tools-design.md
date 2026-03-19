---
title: AI Action Tools Design Spec
audience: [developer, analyst]
category: architecture
status: active
related: [ai-tools, coscout, function-calling, action-proposal]
---

# AI Action Tools Design Spec

**Date**: 2026-03-19

**ADR**: [ADR-029](../../07-decisions/adr-029-ai-action-tools.md)

## Summary

Brainstorm output for adding action tools to CoScout. The core question: how should an AI assistant propose changes to application state without violating the "analyst confirms" principle?

CoScout's 3 existing tools (ADR-028) are read-only. This design adds 10 new tools (2 read, 8 action) that let CoScout propose filters, findings, hypotheses, actions, and sharing — all requiring explicit user confirmation before execution.

## Key Decisions

### 1. Proposal Pattern (vs Optimistic / Queue)

Three patterns were evaluated:

| Pattern               | How it works                                                     | Pros                                                 | Cons                                         |
| --------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------- |
| **Optimistic**        | Tool handler mutates state immediately; undo available           | Fast, feels responsive                               | Violates "analyst confirms"; undo is complex |
| **Queue**             | Actions queued in background; batch approval                     | Efficient for bulk                                   | Analyst loses context; delayed feedback      |
| **Proposal** (chosen) | Preview computed, returned to LLM, rendered as confirmation card | Explicit consent; analyst sees preview before commit | Extra round-trip; slightly more latency      |

The proposal pattern was chosen because it preserves the core UX philosophy and aligns with the AG-UI (Agent-User Interaction) community pattern for human-in-the-loop AI systems.

### 2. Phase-Gating

Tools are gated by journey phase (FRAME / SCOUT / INVESTIGATE / IMPROVE) rather than by user role or plan tier alone. This ensures:

- Read-only tools in FRAME phase (observation stage)
- Filter and finding tools unlock in SCOUT (drilling down)
- Hypothesis and action tools in INVESTIGATE (root cause)
- Sharing and notification tools in IMPROVE (closing the loop)

Plan-level gating is a secondary filter: sharing tools require Team plan regardless of phase.

### 3. Entry Scenario Routing

The system prompt adapts tool emphasis based on `detectEntryScenario()`:

- **Problem entry** ("something is wrong"): Lead with `apply_filter` and `create_finding`
- **Hypothesis entry** ("I think it's X"): Lead with `create_hypothesis` and `compare_categories`
- **Routine entry** ("daily check"): Lead with read tools, suggest findings only if anomalies detected

This prevents the AI from jumping to hypothesis tools when the analyst is still framing the problem.

### 4. Strict JSON Schemas with Null Unions

All tool parameters use OpenAI strict mode (`strict: true`, `additionalProperties: false`). Optional parameters are expressed as null unions rather than `required: false`:

```json
{
  "type": ["string", "null"],
  "description": "Optional due date in ISO 8601 format"
}
```

This guarantees the LLM always produces valid parameter objects, eliminating parsing failures.

## Implementation Phases

### Phase 1: Read Tools

- `get_available_factors` — Returns factor names, category counts, unique values
- `compare_categories` — Side-by-side stats for two categories within a factor

These are risk-free (no state mutation) and immediately useful for CoScout's analytical capabilities.

### Phase 2: Filter Tools

- `apply_filter` — Preview: shows row count change, mean/sigma shift
- `clear_filters` — Preview: shows return-to-unfiltered stats

First action tools. Simple, reversible, high-frequency use case.

### Phase 3: Finding & Hypothesis Tools

- `create_finding` — Preview: shows proposed finding card with title, description, severity
- `create_hypothesis` — Preview: shows hypothesis statement linked to finding, with mechanism

Core investigation workflow integration.

### Phase 4: Action Tools

- `suggest_action` — Preview: shows action item with owner, due date, linked finding

Extends findings into actionable next steps.

### Phase 5: Sharing & Notification Tools

- `share_finding` — Preview: shows Teams message draft with finding summary
- `publish_report` — Preview: shows report sections that would be published
- `notify_action_owners` — Preview: shows notification recipients and message

Team-plan gated. Requires Graph API integration for actual execution.

## Best Practice Evaluation

### OpenAI Strict Mode

All tools use `strict: true` with fully specified schemas. This leverages OpenAI's constrained decoding to guarantee valid tool calls, eliminating the need for client-side parameter validation or retry logic.

### AG-UI Patterns

The proposal pattern aligns with the Agent-User Interaction (AG-UI) community's recommendations for human-in-the-loop systems:

- **Transparency**: The preview shows exactly what will change
- **Consent**: No state mutation without explicit user action
- **Reversibility**: Proposals can be dismissed with no side effects
- **Context**: Proposals appear inline with the conversation, maintaining analytical flow

### Tool Count Management

With 13 total tools (3 existing + 10 new), the tool set stays under the recommended 20-tool threshold for optimal LLM tool selection accuracy. Phase-gating further reduces the active tool set per turn (5-13 tools depending on phase), keeping the selection space tight.

### Autonomy Dial (Future)

The proposal pattern is the conservative end of an autonomy spectrum:

| Level                       | Behavior                                          | User control |
| --------------------------- | ------------------------------------------------- | ------------ |
| 0 — Suggest only            | Current: proposal cards, explicit Apply           | Full control |
| 1 — Apply with notification | Low-risk actions auto-applied, toast notification | Notification |
| 2 — Apply silently          | Routine actions applied without interruption      | Audit log    |

The autonomy dial would let analysts choose their comfort level. Level 0 ships first; levels 1-2 are future work informed by usage patterns (which proposals are always accepted?).

## Open Questions (Resolved)

1. **Should proposals expire?** No — proposals remain valid until the underlying data changes. If the analyst loads new data, stale proposals are visually marked but not auto-dismissed.
2. **Multi-step proposals?** Deferred — single-action proposals ship first. Multi-step ("filter then create finding") is a future enhancement.
3. **Proposal in PWA?** No — PWA is free tier, AI features are Azure-only. PWA CoScout is not planned.
