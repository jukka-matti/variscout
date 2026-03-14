# AI Components

NarrativeBar, ChartInsightChip, and CopilotPanel for AI-assisted analysis.

---

## Availability

Azure App only (Standard and Team plans). All AI components require:

1. AI endpoint configured in ARM deployment (`enableAI` parameter)
2. User Settings toggle "Show AI assistance" set to ON

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
  onAskClick: () => void; // opens CopilotPanel
  colorScheme?: NarrativeBarColorScheme;
}
```

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
- "Ask →" button at right edge (opens CopilotPanel)
- Height: 40px (compact, does not obscure chart content)

### Accessibility

- `aria-live="polite"` — announces narrative changes to screen readers
- "Ask →" button: `aria-label="Open AI copilot"`

---

## ChartInsightChip

Small chip displayed below a chart card. Provides one contextual suggestion per chart.

### Props

```typescript
interface ChartInsightChipProps {
  text: string;
  onDismiss: () => void;
  colorScheme?: ChartInsightChipColorScheme;
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

---

## CopilotPanel

Resizable slide-out panel for conversational AI interaction. Follows the same panel pattern as FindingsPanel (see [Panels and Drawers](../patterns/panels-and-drawers.md)).

### Props

```typescript
interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: CopilotMessage[];
  onSend: (text: string) => void;
  isStreaming: boolean;
  error?: CopilotError;
  colorScheme?: CopilotPanelColorScheme;
}
```

### Layout

- Resizable width: 320px–600px (same as FindingsPanel)
- Slides in from the right edge
- Header: "Copilot" title + close button
- Body: scrollable message history
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
| CopilotPanel     | Resizable side panel | Full-screen overlay (same as FindingsPanel on phone) |

---

## Graceful Degradation

All three components share a common visibility check:

```typescript
const showAI = aiEndpointConfigured && userAIToggle;
```

When `showAI` is false, no AI components render. The dashboard layout is unchanged — no empty spaces, no "configure AI" placeholders. The app behaves identically to a non-AI deployment.

---

## See Also

- [AI-Assisted Analysis Workflow](../../03-features/workflows/ai-assisted-analysis.md) — User-facing workflow
- [AI Architecture](../../05-technical/architecture/ai-architecture.md) — Technical implementation
- [ADR-019: AI Integration](../../07-decisions/adr-019-ai-integration.md) — Architectural decision
- [Findings](findings.md) — Investigation findings system
- [Panels and Drawers](../patterns/panels-and-drawers.md) — Panel patterns
