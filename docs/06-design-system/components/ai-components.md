---
title: 'AI Components'
---

# AI Components

NarrativeBar, ChartInsightChip, and CoScoutPanel for AI-assisted analysis.

---

## Availability

Azure App only (Standard and Team plans). All AI components require:

1. AI endpoint configured in ARM deployment (`enableAI` parameter)
2. User Settings toggle "Show AI assistance" set to ON

### PWA Availability

The PWA (free tier) uses **deterministic `ChartInsightChip` only** (`isAI={false}`). No `NarrativeBar`, no `CoScoutPanel`, no AI service calls. The PWA is a training tool where "the struggle is the point."

### User Control

"Show AI assistance" toggle in SettingsPanel. Per-user preference stored in localStorage. Default: ON when endpoint available.

| State                  | All AI Components                            |
| ---------------------- | -------------------------------------------- |
| No endpoint configured | Never shown. Toggle not visible in Settings. |
| Endpoint + toggle ON   | Shown (default)                              |
| Endpoint + toggle OFF  | Hidden by user choice                        |

When AI is unavailable (no endpoint, toggle off, or offline with no cache), all three components are hidden — the dashboard looks exactly as it does today.

---

## NarrativeBar

Fixed single-line bar at the bottom of the Azure Dashboard. Summarizes current analysis state in plain language.

### Props

```typescript
interface NarrativeBarProps {
  narrative: string | null;
  isLoading: boolean;
  isCached: boolean;
  error: string | null;
  onAsk?: () => void;
  onRetry?: () => void;
}
```

### Per-Component Toggle

NarrativeBar can be independently disabled via the AI preferences section in SettingsPanel, separate from the global "Show AI assistance" toggle. When disabled, the bar is hidden but other AI components (ChartInsightChip, CoScoutPanel) remain active if the global toggle is ON. Preference stored in localStorage.

### States

| State               | Visual                                  |
| ------------------- | --------------------------------------- |
| Loading             | Subtle shimmer animation (skeleton bar) |
| Response            | Summary text, left-aligned              |
| Cached              | Summary text + subtle "(cached)" label  |
| Error / no endpoint | Bar hidden entirely                     |
| Offline (no cache)  | Bar hidden entirely                     |

### Layout

- Fixed at dashboard bottom (above any mobile safe area)
- Full width, single line with text truncation
- "Ask →" button at right edge (opens CoScoutPanel)
- Height: 40px (compact, does not obscure chart content)

### Accessibility

- `aria-live="polite"` — announces narrative changes to screen readers
- "Ask →" button: `aria-label="Open AI CoScout"`

---

## ChartInsightChip

Small chip displayed below a chart card. Provides one contextual suggestion per chart.

### Props

```typescript
interface ChartInsightChipProps {
  text: string;
  chipType?: 'suggestion' | 'warning' | 'info';
  isAI?: boolean;
  isLoading?: boolean;
  onDismiss: () => void;
  chartType: string;
}
```

### Visual

- Small rounded chip (similar to filter chips)
- Subtle background color (muted blue/purple)
- Dismiss button (X) at right
- Text truncation with tooltip on overflow
- Icon: small sparkle (✦) prefix

### Per-Chart Examples

| Chart   | Chip Text                              |
| ------- | -------------------------------------- |
| I-Chart | "Process shift detected at point 34"   |
| Boxplot | "→ Drill Machine A (47% contribution)" |
| Pareto  | "Top 2 categories explain 73%"         |
| Stats   | "Cpk 0.85 — below 1.33 target"         |

### Behavior

- Maximum one chip per chart
- Hidden entirely on any error (never show error states on charts)
- Dismissable — dismissed state persists for current analysis session
- Re-appears when analysis data changes significantly

### Low-Priority AI Skip

When the deterministic insight has `priority <= 1` (e.g., process is healthy and in control), the AI enhancement fetch is skipped entirely. This saves an API call when there is nothing noteworthy to enhance. The deterministic insight is displayed as-is with `isAI={false}`.

---

## CoScoutPanel

Resizable slide-out panel for conversational AI interaction. Follows the same panel pattern as FindingsPanel (see [Panels and Drawers](../patterns/panels-and-drawers.md)).

### Props

```typescript
interface CoScoutPanelBaseProps {
  messages: CoScoutMessage[];
  onSend: (text: string) => void;
  isLoading: boolean;
  isStreaming: boolean;
  error: CoScoutError | null;
  onRetry?: () => void;
  onClear?: () => void;
  onStopStreaming?: () => void;
  onCopyLastResponse?: () => Promise<boolean>;
  onCopyConversation?: () => void;
  providerLabel?: string;
  aiContextSummary?: AIContextSummary;
  suggestedQuestions?: string[];
  onAskSuggested?: (question: string) => void;
}

interface AIContextSummary {
  stats: string;
  filterCount: number;
  findingCount: number;
  phase?: string;
}
```

### Additional Props

- **`providerLabel`** — AI model provider label displayed below the "CoScout" title in the header (e.g., "Claude", "Azure OpenAI"). Rendered in `text-content-secondary text-xs`. Hidden when not provided.
- **`onCopyConversation`** — Copies the entire conversation history to clipboard. Available via the overflow menu (⋮) alongside "Clear conversation" and "Copy last response".
- **`aiContextSummary`** — When provided, renders a collapsible "AI context" card below the header showing the current context sent to the AI: stats summary, active filter count, finding count, and investigation phase. Collapsed by default; toggle via chevron. Helps users understand what context the AI is working with.

### Empty State

When `messages.length === 0 && !isLoading`, the panel shows a capability overview instead of an empty message area:

> **I can help you:**
>
> - Understand patterns in your data
> - Investigate root causes of variation
> - Interpret capability metrics
> - Suggest next steps for improvement

The overview is replaced by the first message as soon as the user sends a question or clicks a suggested question chip.

### Layout

- Resizable width: 320px–600px (same as FindingsPanel)
- Slides in from the right edge
- Header: "CoScout" title + provider label (if set) + close button
- Body: scrollable message history (or empty state)
- Footer: text input + send button

### Message Types

| Type              | Visual                                                  |
| ----------------- | ------------------------------------------------------- |
| User message      | Right-aligned, muted background                         |
| AI response       | Left-aligned, card with subtle border                   |
| AI streaming      | Left-aligned with typing indicator (3 dots)             |
| Error             | Inline error message (see error states below)           |
| Context reference | Collapsible card showing referenced document or finding |

### Error States

| Error          | Display                                                         |
| -------------- | --------------------------------------------------------------- |
| API error      | Inline message: "Something went wrong." + "Retry" button        |
| Content filter | "I can't answer that question. Try rephrasing."                 |
| Rate limit     | "Please wait a moment before asking again."                     |
| Offline        | "AI unavailable offline." Conversation history remains visible. |

All errors are inline — never modal dialogs. Errors logged to `errorService`.

### Keyboard

| Key         | Action            |
| ----------- | ----------------- |
| Enter       | Send message      |
| Shift+Enter | New line in input |
| Escape      | Close panel       |

---

## RefLink and Visual Grounding

When CoScout messages reference specific chart elements, they render inline `RefLink` components that let analysts jump directly to what the AI is describing.

### RefLink Component

Inline clickable reference rendered inside CoScout message bubbles.

**Props:**

```typescript
interface RefLinkProps {
  targetType: 'factor' | 'stat' | 'chart' | 'finding';
  targetId?: string;
  displayText: string;
  onActivate: (targetType: string, targetId?: string) => void;
}
```

**Visual:** Blue text (`text-blue-400`) with a dotted underline, preceded by a small lucide icon that maps to the target type:

| `targetType` | Icon         |
| ------------ | ------------ |
| `factor`     | `BarChart2`  |
| `stat`       | `Activity`   |
| `chart`      | `TrendingUp` |
| `finding`    | `Flag`       |

**Interaction:** Clicking a `RefLink` calls `onActivate`, which dispatches a highlight event via `useVisualGrounding`. The first ref in a new CoScout response auto-activates on render; subsequent refs require a click.

**Accessibility:** `role="button"`, `tabIndex={0}`, keyboard-activatable via Enter/Space.

### Visual Highlight Classes

CSS classes applied by `useVisualGrounding` to DOM elements matching a ref target. Theme-aware — variants are defined in `packages/ui/src/styles/components.css`.

| Class                         | State                | Style                                                                  |
| ----------------------------- | -------------------- | ---------------------------------------------------------------------- |
| `.coscout-highlight`          | Active (0–3s)        | 2px blue border + `box-shadow` glow (`#3b82f6` light / `#60a5fa` dark) |
| `.coscout-highlight--settled` | Settled (after glow) | 1px blue border, no glow                                               |

Both classes are removed at the start of the next conversation turn, or when `useVisualGrounding` receives a `clear` event.

**Elements that receive highlight classes:**

- `DashboardChartCard` — for `factor` and `chart` refs (boxplot categories, pareto bars, chart containers)
- `StatsPanelBase` stat cards — for `stat` refs (mean, sigma, cpk, cp, samples)
- `FindingCard` — for `finding` refs
- SVG `<g>` elements inside charts for bar/point-level precision (future)

**`useVisualGrounding` hook** (`packages/hooks/src/useVisualGrounding.ts`) manages the full lifecycle: auto-highlight first ref, handle click-activations, run the 3s timer, transition to settled state, and clear on turn boundary. Components subscribe via a `data-ref-target` attribute that the hook uses to locate DOM nodes.

---

## Color Scheme

All components follow the standard `colorScheme` pattern with defaults using semantic tokens.

```typescript
const narrativeBarDefaultColorScheme: NarrativeBarColorScheme = {
  background: 'bg-surface-secondary',
  text: 'text-content-secondary',
  cachedLabel: 'text-content-secondary/60',
  askButton: 'text-blue-400 hover:text-blue-300',
};
```

---

## Responsive Behavior

| Component        | Desktop              | Phone (<640px)                                       |
| ---------------- | -------------------- | ---------------------------------------------------- |
| NarrativeBar     | Fixed bottom bar     | Fixed bottom bar (above safe area)                   |
| ChartInsightChip | Below chart card     | Below chart in carousel                              |
| CoScoutPanel     | Resizable side panel | Full-screen overlay (same as FindingsPanel on phone) |

---

## Mobile Responsive Behavior

Detailed phone (<640px) specifications for each AI component. All mobile behavior is gated by `useIsMobile(640)` (same breakpoint as MobileChartCarousel, FindingsPanel, and MobileCategorySheet).

### NarrativeBar on Phone

Fixed at the bottom of the screen, above `safe-area-bottom`. Does not interfere with MobileChartCarousel swipe gestures — the bar sits below the carousel's dot indicators and chevron navigation.

| Property       | Collapsed                             | Expanded                      |
| -------------- | ------------------------------------- | ----------------------------- |
| Height         | 48px                                  | Up to 96px (3 lines max)      |
| Text           | Single line, ellipsis overflow        | Up to 3 lines, full text      |
| Trigger        | Default state                         | Tap on text area              |
| "Ask →" button | Right-aligned, always visible         | Right-aligned, always visible |
| z-index        | `z-30` (below panels, above carousel) | `z-30`                        |

**Layout stacking (bottom to top):**

```
safe-area-bottom (env(safe-area-inset-bottom))
NarrativeBar (48–96px, z-30)
Carousel dot indicators
Carousel chart card
```

**Carousel interaction:**

- When the carousel swipes to a new chart view, the NarrativeBar narrative updates for the newly visible chart (debounced 300ms to avoid flicker during rapid swipes)
- Shimmer loading skeleton matches the full bar width during the debounce/loading period
- The bar does not capture horizontal swipe gestures — touch events pass through to the carousel via CSS `touch-action: pan-x` on the carousel container

**Collapse/expand animation:** `transition: max-height 200ms ease-out`. Tap anywhere on the text area toggles between collapsed (1 line) and expanded (up to 3 lines). Tap on "Ask →" always opens CoScoutPanel regardless of expand state.

**Carousel sync:** When the carousel swipes to a new chart view, the NarrativeBar:

1. Shows shimmer for 300ms debounce period
2. If user swipes again within debounce, timer resets (no stale narratives)
3. NarrativeBar receives `activeChart` prop from carousel parent to trigger updates

The `activeChart` prop type: `'ichart' | 'boxplot' | 'pareto' | 'capability' | 'stats' | undefined`.

### ChartInsightChip on Phone

Chips are per-card — each carousel view has its own chip(s). Chips swipe together with their parent card during carousel navigation.

| Property          | Phone (<640px)                           | Desktop                        |
| ----------------- | ---------------------------------------- | ------------------------------ |
| Max visible chips | 2 (horizontal scroll for additional)     | 3                              |
| Position          | Below chart card, above dot indicators   | Below chart card               |
| Interaction       | Tap to expand (no hover)                 | Hover to expand, click dismiss |
| Dismiss gesture   | Swipe-left on chip (velocity > 0.3px/ms) | Click X button                 |
| X button          | Always visible (no hover gate)           | Visible on hover               |

**Layout within carousel card:**

```
┌──────────────────────────────┐
│  Chart (full width)          │
├──────────────────────────────┤
│  [✦ Insight chip 1] [✦ ...]  │  ← horizontal scroll
├──────────────────────────────┤
│  ● ● ○ ●                    │  ← dot indicators
└──────────────────────────────┘
```

**Chip expansion (ChartInsightChip):** Tap on a truncated insight chip expands it inline (max 2 lines). Second tap collapses. Only one chip can be expanded at a time on phone.

**Suggested question chips:** Truncated via `formatForMobile()` on mobile (60 chars, word-boundary). Unlike ChartInsightChip, these do not expand on tap — tapping sends the full question text to CoScout. The truncated display is visual-only; click handlers always pass the original untruncated question.

**Swipe-to-dismiss:** Horizontal swipe-left on a chip triggers dismiss animation (opacity 0, translateX -100%, 200ms). The `onDismiss` callback fires after animation completes. Swipe direction is left-only to avoid conflict with carousel navigation (which also uses horizontal swipes — chips consume the gesture when touch starts on a chip element).

**Mobile AI debounce:** On phone, the AI enhancement debounce increases from 3s to 5s. Rapid carousel swiping causes visual instability at the desktop 3s threshold. The `useChartInsights` hook accepts an `isMobile` parameter to control this.

### CoScoutPanel on Phone

Full-screen overlay following the same pattern as FindingsPanel on phone (`fixed inset-0 z-40`). Reference: [Findings responsive behavior](findings.md#responsive-behavior) and [Azure Teams Mobile Flow](../../02-journeys/flows/azure-teams-mobile.md).

**Layout:**

```
┌──────────────────────────────┐
│  [←] CoScout            [⋮]  │  ← header (44px height)
├──────────────────────────────┤
│                              │
│  Message history             │  ← scrollable, flex-1
│  (full-width bubbles)        │
│                              │
├──────────────────────────────┤
│  [Question chip] [chip] →    │  ← horizontal scroll
├──────────────────────────────┤
│  [Type a question...] [Send] │  ← fixed above keyboard
│  safe-area-bottom            │
└──────────────────────────────┘
```

| Element             | Spec                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Back button (←)     | Top-left, 44px touch target. Closes panel (same as FindingsPanel close)                                                                                                        |
| Header              | "CoScout" title, centered. Height 44px.                                                                                                                                        |
| Message bubbles     | Full-width layout (no left/right alignment waste on narrow screens)                                                                                                            |
| Suggested questions | Horizontal scroll chips above input field. 3-5 context-aware suggestions. On mobile, truncated to 60 chars at word boundary via `formatForMobile()` — full text sent on click. |
| Input field         | Fixed at bottom, above keyboard (`position: fixed; bottom: env(safe-area-inset-bottom)`). Full width minus 48px send button.                                                   |
| Send button         | 44px square, right of input. Icon only (arrow-up).                                                                                                                             |
| Stop button         | Replaces send button during streaming. Red square icon, 44px. Calls `onStopStreaming()`.                                                                                       |
| z-index             | `z-40` (same as FindingsPanel overlay)                                                                                                                                         |

**Keyboard handling:**

- Input field uses `position: fixed` with `bottom` adjusted for keyboard presence via `visualViewport` API resize events
- When keyboard opens, message history scrolls to bottom automatically
- Suggested question chips hidden when keyboard is open (input field takes priority)

**Overflow menu (⋮):**

- "Clear conversation" — clears message history with confirmation
- "Copy last response" — copies most recent AI response to clipboard
- "Copy conversation" — copies entire conversation history to clipboard (calls `onCopyConversation`)

### AI Onboarding (First-Time Experience)

When the AI endpoint is first configured and the user opens an analysis, a one-time onboarding sequence introduces the AI features without blocking the workflow.

**Sequence:**

1. NarrativeBar appears with welcome message: _"AI-powered insights are now available for your analysis."_
2. A one-time tooltip points to the NarrativeBar "Ask →" button: _"Tap 'Ask →' to explore your data with AI assistance. You can control this in Settings."_
3. Tooltip dismisses on tap anywhere. Never shows again.

**Tooltip spec:**

| Property     | Value                                                       |
| ------------ | ----------------------------------------------------------- |
| Position     | Above NarrativeBar, arrow pointing down to "Ask →" button   |
| Background   | `bg-blue-600` (high contrast against dashboard)             |
| Text color   | `text-white`                                                |
| Max width    | 280px                                                       |
| z-index      | `z-50` (above everything including panels)                  |
| Persistence  | `localStorage` flag: `variscout_ai_onboarding_seen`         |
| Animation    | Fade-in 300ms on mount. Fade-out 200ms on dismiss.          |
| Phone layout | Centered above NarrativeBar. Same spec, no position change. |

**Settings toggle default:** ON when endpoint is available. The onboarding tooltip references Settings so the user knows where to disable AI if desired.

**No subsequent prompts:** After dismissal, the AI features behave normally. No recurring tips, no "did you know" popups, no feature tours.

---

## ProcessContext Entry

### Process Description in Settings Panel

A new "Process Description" section in `SettingsPanelBase`, positioned below the theme section and above the about section. Provides free-text context that enriches AI prompts.

**Layout:**

```
┌──────────────────────────────┐
│  Settings                    │
│                              │
│  Theme                       │
│  [Light] [Dark] [System]     │
│                              │
│  ─────────────────────────   │
│                              │
│  AI Assistance               │
│  [Toggle: Show AI assistance]│
│                              │
│  Process Description         │
│  Describe your manufacturing │
│  process, what you're        │
│  measuring, and quality      │
│  goals...                    │
│  ┌──────────────────────┐    │
│  │                      │    │  ← textarea, 4 rows
│  │                      │    │
│  │                      │    │
│  │                      │    │
│  └──────────────────────┘    │
│  Helper: This helps AI       │
│  understand your process     │
│  and provide more relevant   │
│  insights.                   │
│                 423 / 500     │  ← character counter
│                              │
│  ─────────────────────────   │
│                              │
│  About                       │
│  VariScout v2.x              │
└──────────────────────────────┘
```

**Props (extension to SettingsPanelBase):**

```typescript
interface ProcessDescriptionProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number; // default: 500
}
```

| Property        | Spec                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Textarea rows   | 4 (default), auto-expands up to 8 rows on phone for easier editing                                                            |
| Placeholder     | "Describe your manufacturing process, what you're measuring, and quality goals..."                                            |
| Character limit | 500 characters. Counter shows `{current} / 500` below textarea, right-aligned.                                                |
| Counter color   | `text-content-secondary` normally, `text-red-400` when within 20 chars of limit                                               |
| Persistence     | Azure: saved in `AnalysisState.processContext.description` (per-project). PWA: session-only (not persisted across reloads).   |
| Save behavior   | Auto-save on blur (Azure). No explicit save button.                                                                           |
| Visibility      | Only shown when AI endpoint is configured (hidden alongside AI toggle when no endpoint).                                      |
| Helper text     | Below textarea: "This helps AI understand your process and provide more relevant insights." `text-content-secondary text-sm`. |
| Optional        | AI works without a process description. No validation, no required state.                                                     |

**Phone layout:** Textarea expands to full width. Character counter remains right-aligned below. Same placeholder text. The Settings panel on phone is already a full-screen overlay, so no additional layout changes are needed.

### Factor Role Inference in ColumnMapping

During column detection (`detectColumns()` in `@variscout/core/parser`), column names are matched against keyword groups to auto-infer factor roles. Inferred roles appear as dismissable badge chips on column cards in ColumnMapping.

**Role Types:**

```typescript
type FactorRole = 'equipment' | 'temporal' | 'operator' | 'material' | 'location';
```

**Keyword Inference Rules:**

| Role      | Keywords (case-insensitive)                                   | Badge Color                                                                |
| --------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Equipment | machine, equipment, head, nozzle, cavity, line, station, tool | `bg-blue-100 text-blue-700` (dark: `bg-blue-900/30 text-blue-300`)         |
| Temporal  | date, time, shift, day, week, month, hour, batch, lot, run    | `bg-purple-100 text-purple-700` (dark: `bg-purple-900/30 text-purple-300`) |
| Operator  | operator, worker, technician, inspector, person, staff, user  | `bg-green-100 text-green-700` (dark: `bg-green-900/30 text-green-300`)     |
| Material  | material, supplier, grade, resin, alloy, compound, raw, input | `bg-amber-100 text-amber-700` (dark: `bg-amber-900/30 text-amber-300`)     |
| Location  | location, zone, area, site, plant, facility, building, room   | `bg-cyan-100 text-cyan-700` (dark: `bg-cyan-900/30 text-cyan-300`)         |

**Badge on Column Card:**

```
┌──────────────────────────────────────┐
│  Machine_ID                          │
│  Categorical · 5 unique values       │
│  [Equipment ×]  [? Why]              │  ← dismissable badge + tooltip
│  Sample: A, B, C, D, E              │
└──────────────────────────────────────┘
```

| Element        | Spec                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Badge          | Rounded pill, role name + × dismiss button. 24px height.                                                                               |
| × dismiss      | 16px touch target (expanded to 24px hit area). Removes badge, sets role to `undefined`.                                                |
| "Why?" tooltip | On hover (desktop) or tap (phone): explains the inference rule. E.g., "Detected 'machine' in column name." Dismisses on tap elsewhere. |
| Max one badge  | Each column card shows at most one inferred role badge.                                                                                |
| No badge       | Columns that don't match any keyword group show no badge.                                                                              |

**Persistence:**

```typescript
// In AnalysisState
interface AnalysisState {
  // ... existing fields
  processContext?: ProcessContext;
}

// In ProcessContext (from ai-architecture.md)
interface ProcessContext {
  description?: string;
  // Factor roles keyed by column name
  factorRoles?: Record<string, FactorRole>;
  // ... other Phase 2 fields
}
```

- Inferred roles are stored in `AnalysisState.processContext.factorRoles`
- User dismissals remove the entry from `factorRoles`
- Roles persist with the `.vrs` project file (Azure) or session (PWA)
- Roles are included in `buildAIContext()` payload for AI prompt enrichment

**Behavior rules:**

- Badges are **suggestions only** — dismissing a badge has no effect on analysis behavior, filtering, or chart rendering
- Re-opening ColumnMapping in edit mode preserves user dismissals (does not re-infer dismissed roles)
- If a column is renamed via ColumnMapping's rename feature, the role is not re-inferred automatically (user can manually re-assign via a future role selector in Phase 2)
- Multiple columns can share the same role (e.g., two equipment-related columns)

---

## CoScout Investigation Sidebar

Collapsible sidebar in the FindingsWindow popout that provides investigation-aware AI assistance during hypothesis investigation.

### Availability

Azure App only (Standard and Team plans). Requires AI endpoint configured and "Show AI assistance" toggle ON. Hidden when AI is unavailable — no empty space or placeholder.

### Layout

```
┌──────────────────────────────┬────────────────┐
│                              │  CoScout       │
│  Findings / Board / Tree     │                │
│                              │  Phase:        │
│                              │  Diverging     │
│                              │                │
│                              │  Uncovered:    │
│                              │  - Material    │
│                              │  - Location    │
│                              │                │
│                              │  Suggestions:  │
│                              │  [chip] [chip] │
│                              │                │
│                              │  [Ask CoScout] │
│                              │                │
└──────────────────────────────┴────────────────┘
```

| Property        | Spec                                                          |
| --------------- | ------------------------------------------------------------- |
| Width           | 280px fixed                                                   |
| Collapse        | Toggle button on left edge. Collapsed width: 0 (fully hidden) |
| Position        | Right edge of FindingsWindow popout                           |
| Background      | `bg-surface-secondary`                                        |
| Border          | `border-l border-edge`                                        |
| State persisted | ViewState (collapsed/expanded remembered per project)         |

### Investigation Phase Display

Shows the auto-detected investigation phase with a brief description:

| Phase       | Label         | Description                                                         |
| ----------- | ------------- | ------------------------------------------------------------------- |
| Initial     | "Starting"    | No sub-hypotheses yet                                               |
| Diverging   | "Diverging"   | Generating sub-hypotheses, most untested                            |
| Validating  | "Validating"  | Testing sub-hypotheses, some still untested                         |
| Converging  | "Converging"  | All tested, identifying root cause candidates                       |
| _(IMPROVE)_ | _(Improving)_ | _(Suspected cause identified, defining actions — see IMPROVE/PDCA)_ |

Phase label uses `text-content-primary` with the description in `text-content-secondary text-sm`.

### Uncovered Factor Roles

Lists factor role categories (equipment, temporal, operator, material, location) that have no hypothesis linked to them. Uses the `FactorRole` badges from ColumnMapping with the same color scheme.

Only shown when `processContext.factorRoles` has entries that are not covered by any hypothesis's `factorName`.

### Suggested Question Chips

Phase-aware suggestion chips (same style as CoScoutPanel suggested questions). Clicking a chip opens the full CoScoutPanel with the question pre-filled and investigation context loaded.

| Phase       | Example Chip Text                                                        |
| ----------- | ------------------------------------------------------------------------ |
| Initial     | "What causes [problem] in [process]?"                                    |
| Diverging   | "What other factors could cause [root hypothesis]?"                      |
| Validating  | "How do I validate [untested hypothesis]?"                               |
| Converging  | "Which supported hypothesis is most likely root cause?"                  |
| _(IMPROVE)_ | _(Suggested questions come from IMPROVE/PDCA coaching, not the diamond)_ |

### "Ask CoScout" Button

Full-width button at the bottom of the sidebar. Opens CoScoutPanel (slide-out or full-screen on phone) with investigation context pre-loaded in the system prompt — including problem statement, hypothesis tree state, phase, and uncovered factors.

**Note:** Because the sidebar lives in the FindingsWindow popout (a separate browser window), clicking "Ask CoScout" copies the pre-filled question to the clipboard rather than making an API call directly. The popout has no auth context for AI API calls. The main window CoScoutPanel is opened for the actual conversation.

### Mobile Behavior

The Investigation Sidebar is hidden on phone screens (`hidden sm:block`). On screens narrower than 640px the FindingsWindow popout is not used; investigation context is accessed via the CoScoutInline component embedded in FindingsPanel instead.

---

## CoScout Inline (FindingsPanel)

Compact CoScout conversation embedded within the FindingsPanel. Azure-only (PWA unaffected).

**States:**

- **Collapsed (~48px):** Phase badge + horizontal question chips + expand chevron. Clicking a chip calls `onSend` and auto-expands.
- **Expanded (~50% of parent):** Same header + `CoScoutMessages` + input textarea + send/stop button.

**Components:**

- `CoScoutInline` — Collapsible conversation area within FindingsPanel
- `CoScoutMessages` — Shared message rendering (user/assistant bubbles, loading dots)
- `InvestigationPhaseBadge` — Colored pill badge showing investigation phase

### CoScoutMessages Source Attribution

`[Source: name]` markers in assistant messages are rendered as styled inline badges rather than plain text. Badge styling: `bg-violet-500/15 text-violet-400 text-[9px]` with rounded corners and slight padding. This visually distinguishes source references (e.g., knowledge base entries, methodology concepts) from the surrounding response text.

**Behavior:**

- Shares `useAICoScout` hook instance with standalone CoScout panel — conversation persists across both
- Auto-expands when new messages arrive while collapsed
- Phase badge reflects `detectInvestigationPhase()` from AI context

**E2E Test Selectors:**

| Element            | Selector                                     |
| ------------------ | -------------------------------------------- |
| CoScout inline     | `[data-testid="coscout-inline"]`             |
| Toggle button      | `[data-testid="coscout-inline-toggle"]`      |
| Inline input       | `[data-testid="coscout-inline-input"]`       |
| Inline suggestions | `[data-testid="coscout-inline-suggestions"]` |
| Phase badge        | `[data-testid="investigation-phase-badge"]`  |

---

## HelpTooltip Phone Behavior

On phone (<640px), the HelpTooltip switches from hover to touch-toggle interaction.

| Property   | Desktop                                  | Phone (<640px)                                     |
| ---------- | ---------------------------------------- | -------------------------------------------------- |
| Activation | Hover (`onMouseEnter`)                   | Tap/click toggles visibility                       |
| Dismiss    | Mouse leave (`onMouseLeave`)             | Tap outside, scroll, tap ⓘ again, or "X"           |
| Position   | Relative to icon (top/bottom/left/right) | Bottom-anchored popover to avoid viewport overflow |
| Content    | Label + definition + Learn more          | Same — no content differences                      |

Implementation: `onClick` handler toggles `isVisible` state. On touch devices (`@media (hover: none)`), `onMouseEnter`/`onMouseLeave` become no-ops via CSS or JS detection. Tap outside dismissal via document click listener (skips when click is within tooltip).

---

## Graceful Degradation

All three components share a common visibility check:

```typescript
const showAI = aiEndpointConfigured && userAIToggle;
```

When `showAI` is false, no AI components render. The dashboard layout is unchanged — no empty spaces, no "configure AI" placeholders. The app behaves identically to a non-AI deployment.

---

## E2E Test Selectors

| Element           | Selector                               |
| ----------------- | -------------------------------------- |
| NarrativeBar      | `[data-testid="narrative-bar"]`        |
| Narrative shimmer | `[data-testid="narrative-shimmer"]`    |
| Ask button        | `[data-testid="narrative-ask-button"]` |
| CoScoutPanel      | `[data-testid="coscout-panel"]`        |
| CoScout input     | `[data-testid="coscout-input"]`        |
| CoScout message   | `[data-testid^="coscout-message-"]`    |
| ChartInsightChip  | `[data-testid^="insight-chip-"]`       |

---

## See Also

- [AI Journey Integration](../../05-technical/architecture/ai-journey-integration.md) — User-facing workflow
- [AI Architecture](../../05-technical/architecture/ai-architecture.md) — Technical implementation
- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md) — Architectural decision
- [Findings](findings.md) — Investigation findings system
- [Panels and Drawers](../patterns/panels-and-drawers.md) — Panel patterns
- [Azure Daily Use](../../02-journeys/flows/azure-daily-use.md) — AI in daily analysis workflow
- [Azure AI Setup](../../02-journeys/flows/azure-ai-setup.md) — Admin AI setup flow
- [Azure Teams Mobile](../../02-journeys/flows/azure-teams-mobile.md) — AI on phone
