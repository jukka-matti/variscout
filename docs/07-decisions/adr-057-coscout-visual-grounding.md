# ADR-057: CoScout Visual Grounding

**Status:** Accepted
**Date:** 2026-04-01

## Context

CoScout AI assistant references chart elements in text, but analysts must manually scan charts to find the referenced element. This creates cognitive load.

## Decision

Implement visual grounding: CoScout wraps references in `[REF:type:id]text[/REF]` markers. The UI renders these as clickable blue links that highlight the corresponding chart element with a 3-phase glow lifecycle (3s glow -> 10s settled -> clear).

## Consequences

### Positive

- Eliminates "find the element" cognitive load
- First ref per message auto-highlights (zero-click activation)
- Graceful degradation (malformed markers render as plain text)

### Negative

- ~200 tokens added to system prompt
- ~8% overhead in CoScout output tokens for markers

## Implementation

- `@variscout/core/ai`: parseRefMarkers(), stripRefMarkers() (refMarkers.ts)
- `@variscout/hooks`: useVisualGrounding() with 3-phase timer lifecycle
- `@variscout/ui`: RefLink component, CSS classes `.coscout-highlight` / `.coscout-highlight--settled`
- CoScoutMessages: renderWithRefs() parses REF markers into RefLink components
- ActionProposalCard: auto-highlights relevant chart element on mount
- Azure EditorDashboardView: wires useVisualGrounding to panelsStore (chart focus, panel expand)
