# Investigation Mindmap

The spatial investigation overview component. Three switchable modes show factor relationships, drill progress, and a shareable narrative timeline.

## Modes and Progressive Disclosure

The mindmap has three modes accessible via a segmented control. Modes unlock progressively as the investigation advances. Disabled modes appear muted with a tooltip explaining the unlock condition.

| Mode             | Available When                                    | Purpose                                       |
| ---------------- | ------------------------------------------------- | --------------------------------------------- |
| **Drilldown**    | Always                                            | Factor landscape, drill trail, suggestions    |
| **Interactions** | 2+ categorical factors AND n >= 5 after filtering | Pairwise interaction edges between nodes      |
| **Narrative**    | 1+ drill applied (at least one filter active)     | Linear timeline for stakeholder communication |

## Node Rendering

Node size encodes max category contribution (area-proportional via `getNodeRadius()`).

| Constant             | Value | Purpose              |
| -------------------- | ----- | -------------------- |
| `MIN_NODE_RADIUS`    | 20    | Smallest factor node |
| `MAX_NODE_RADIUS`    | 40    | Largest factor node  |
| `CENTER_NODE_RADIUS` | 16    | "Start" center node  |

### Node Colors

Colors are computed by `getNodeFill()` and `getNodeStroke()` in `packages/charts/src/mindmap/helpers.ts`:

| State       | Fill (dark)               | Fill (light)       | Stroke                                           |
| ----------- | ------------------------- | ------------------ | ------------------------------------------------ |
| `active`    | `chartColors.mean` (blue) | `chartColors.mean` | `chartColors.mean`                               |
| `available` | slate-700                 | slate-200          | slate-600 / slate-400                            |
| `exhausted` | slate-800                 | slate-100          | slate-600 / slate-400                            |
| Suggested   | (any fill)                | (any fill)         | `chartColors.pass` (green) + CSS pulse animation |

### Edge Rendering (Interactions Mode)

- Width: linear interpolation from `EDGE_MIN_WIDTH` (1.5) to `EDGE_MAX_WIDTH` (6) based on delta-R-squared relative to the maximum
- Opacity: 1.0 for p < 0.05, 0.4 for p < 0.10, hidden for p >= 0.10
- Color: `chartColors.warning` (amber)

## CategoryPopover

Opens when an available node is clicked. Lists category values with contribution percentages.

### Interaction Pattern

- **Open**: Click on an available (non-exhausted) node
- **Navigate**: Arrow Up / Arrow Down to move focus between categories
- **Select**: Enter to apply the focused category as a filter
- **Close**: Escape, or click outside the popover
- **Focus ring**: 2px outline on the focused item using `chrome.axisPrimary`

### Visual

- Background: `chrome.tooltipBg`
- Border: `chrome.gridLine`, 8px border-radius
- Header: factor name, 11px, 600 weight, `chrome.labelPrimary`
- Items: 11px, `chrome.tooltipText`, contribution % in `chrome.labelSecondary` at 10px
- Max height: 200px (scrollable for factors with many categories)

## Theme Integration

All subcomponents receive `chrome` from `useChartTheme()` and use theme-aware colors:

| Component         | Theme-Aware Properties                                         |
| ----------------- | -------------------------------------------------------------- |
| `CategoryPopover` | tooltipBg, gridLine, labelPrimary, tooltipText, axisPrimary    |
| `EdgeTooltip`     | tooltipBg, gridLine, labelPrimary, labelSecondary, tooltipText |
| `ConclusionPanel` | labelPrimary, labelSecondary                                   |
| `StepAnnotation`  | tooltipBg, gridLine, tooltipText, labelSecondary, labelMuted   |
| `ProgressFooter`  | gridLine, labelSecondary                                       |

This ensures correct rendering in both light and dark themes without any hardcoded hex values for chrome elements.

## ConclusionPanel

Rendered at the end of the Narrative timeline. Shows cumulative variation percentage and whether the investigation target was reached.

- "Model improvements" CTA is a styled button with hover/focus states (background highlight on hover, 2px outline on focus)
- Links to the What-If Simulator via `onNavigateToWhatIf` callback

## StepAnnotation

Each narrative step shows a card below the timeline node with:

- Factor name and filtered value(s)
- Scope fraction percentage
- Mean before/after (green if improved)
- Cpk before/after (if specs are set)
- Sample count before/after

The "+ Add note" prompt uses 11px font with a larger plus icon (13px) and hover underline for discoverability. Annotations are editable inline with Enter to save and Escape to cancel.

## Progress Footer

A horizontal bar showing cumulative variation percentage with a target marker (default 70%).

- Fill bar has a smooth CSS `transition: width 0.3s ease-out` animation
- Color: `chartColors.mean` (blue) below target, `chartColors.pass` (green) at or above target

## Export

Copy-to-clipboard, PNG download, and SVG download are available in **all three modes** (Drilldown, Interactions, Narrative). Export uses the same `useChartCopy` / `exportMindmapPng` / `exportMindmapSvg` infrastructure as other chart components.

## Platform Differences

| Capability              | PWA                                            | Azure                                          |
| ----------------------- | ---------------------------------------------- | ---------------------------------------------- |
| Panel type              | Overlay (slide-out)                            | Inline resizable (flex panel)                  |
| Pop-out window          | Yes                                            | Yes                                            |
| SVG export              | No                                             | Yes                                            |
| Annotations             | Session-only (sessionStorage)                  | Persistent (saved with project, OneDrive sync) |
| Trigger button          | Labelled "Investigation" (Network icon + text) | Same                                           |
| First-drill prompt      | InvestigationPrompt (default color scheme)     | InvestigationPrompt (azure color scheme)       |
| VariationBar as gateway | onClick opens investigation                    | Same                                           |

## Discoverability Aids

Three mechanisms guide users to the Investigation panel:

1. **Labelled trigger** -- "Investigation" button with Network icon and text label in the header toolbar (replaces the previous unlabelled icon)
2. **First-drill prompt** -- `InvestigationPrompt` component appears once per session when the user applies their first filter, with a link to open the panel. Dismissed via sessionStorage.
3. **VariationBar gateway** -- The VariationBar accepts an optional `onClick` prop. When provided, clicking the bar opens the investigation panel.

## Files

| File                                              | Purpose                                    |
| ------------------------------------------------- | ------------------------------------------ |
| `packages/charts/src/InvestigationMindmap.tsx`    | Main component (responsive wrapper + base) |
| `packages/charts/src/mindmap/types.ts`            | TypeScript interfaces                      |
| `packages/charts/src/mindmap/helpers.ts`          | Node radius, colors, edge sizing           |
| `packages/charts/src/mindmap/layout.ts`           | Radial and timeline layout algorithms      |
| `packages/charts/src/mindmap/CategoryPopover.tsx` | Click-to-filter popover                    |
| `packages/charts/src/mindmap/EdgeTooltip.tsx`     | Interaction edge hover tooltip             |
| `packages/charts/src/mindmap/ConclusionPanel.tsx` | Narrative conclusion + CTA                 |
| `packages/charts/src/mindmap/StepAnnotation.tsx`  | Narrative step cards                       |
| `packages/charts/src/mindmap/ProgressFooter.tsx`  | Cumulative variation bar                   |
| `packages/ui/src/components/InvestigationPrompt/` | First-drill callout component              |
| `packages/ui/src/components/VariationBar/`        | Clickable variation progress bar           |
| `packages/ui/src/components/MindmapPanel/`        | Panel shell + export functions             |

## See Also

- [Design Spec](../../01-vision/evaluations/design-spec-investigation-mindmap.md) -- Full design specification
- [Investigation to Action](../../03-features/workflows/investigation-to-action.md) -- Three-phase workflow
- [Interaction Guidance](interaction-guidance.md) -- Contextual regression hint
- [VariationBar](variation-funnel.md) -- Variation scope progress bar
