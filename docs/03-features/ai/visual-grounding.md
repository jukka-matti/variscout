---
title: CoScout Visual Grounding
audience: [analyst, engineer]
category: ai
status: stable
related: [coscout, visual-grounding, ref-markers]
---

# CoScout Visual Grounding

Visual grounding connects CoScout's text references to the corresponding chart elements, eliminating the cognitive load of manually finding referenced elements.

## How It Works

When CoScout mentions a chart element (e.g., a boxplot category or a Pareto bar), the AI wraps the reference in `[REF:type:id]display text[/REF]` markers. The UI renders these as clickable blue links with a chart-type icon.

**Clicking a RefLink** triggers a 3-phase highlight lifecycle:

1. **Glow** (3 seconds) -- the target element pulses with a blue glow
2. **Settled** (10 seconds) -- the glow fades to a subtle highlight
3. **Clear** -- the highlight is removed

**Auto-highlight**: The first REF in each new assistant message is automatically highlighted after a 100ms delay, providing zero-click activation.

## Supported Targets

| Target Type   | Highlight Behavior                 |
| ------------- | ---------------------------------- |
| `boxplot`     | Category highlight + chart focus   |
| `pareto`      | Category highlight + chart focus   |
| `ichart`      | Chart focus                        |
| `yamazumi`    | Category highlight + chart focus   |
| `stats`       | Stat key highlight or panel expand |
| `finding`     | Findings panel expand + highlight  |
| `hypothesis`  | Findings panel expand              |
| `dashboard`   | Chart focus                        |
| `improvement` | Improvement panel expand           |

## Graceful Degradation

- Malformed or missing markers render as plain text
- When `onRefActivate` is not provided (e.g., PWA), RefLink display text renders without interactivity
- Source badges (`[Source: name]`) continue to work alongside REF markers

## Architecture

- **Parser**: `parseRefMarkers()` in `@variscout/core/ai` (refMarkers.ts)
- **Hook**: `useVisualGrounding()` in `@variscout/hooks` -- manages timer lifecycle
- **Component**: `RefLink` in `@variscout/ui` -- clickable inline element
- **CSS**: `.coscout-highlight` / `.coscout-highlight--settled` classes
- **ADR**: [ADR-057](../../07-decisions/adr-057-coscout-visual-grounding.md)
