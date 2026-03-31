---
title: 'Design: Project Dashboard + Hypothesis Navigation + CoScout Search'
---

# Design: Project Dashboard + Hypothesis Navigation + CoScout Search

## Context

When users reopen a saved VariScout project, they currently land directly in the Editor with the last saved state restored silently. There's no orientation moment — no summary of where things stand, what's been tested, or what's still open. Users reopen projects for specific reasons (continue analysis, check a hypothesis, add new data, log an improvement idea), but the tool doesn't acknowledge or support those intents.

Additionally, CoScout cannot search the project's investigation history. If a user asks "have we already checked if it's the material?", CoScout has no tool to search findings or hypotheses — it can only work with whatever's in the current AI context window.

This design adds three interconnected capabilities:

1. A **Project Dashboard** — persistent project overview and navigation hub
2. A **`search_project` CoScout tool** — search findings, hypotheses, ideas, actions
3. A **`navigate_to` CoScout tool** — navigate to specific views with context

## Design Decisions

- **Project Dashboard, not a transient overlay** — a persistent view the user can always return to. It's the default landing for saved projects but also accessible as a tab. This serves OpEx Olivia (KPI monitoring), Green Belt Gary (investigation tracking), and returning users equally.
- **Hypotheses are the right container** for tracking assumptions — no new data model needed. The gap is discoverability, not structure.
- **Two new atomic tools** (search + navigate) rather than one compound tool — follows OpenAI/Anthropic best practices for composability and testability. Tool count: 13 → 15, well within limits with phase-gating.
- **Progressive enhancement** — dashboard works without AI (status overview); AI summary card appears when available.
- **Dashboard is Azure-only** — PWA has no project persistence.
- **Deep links bypass dashboard** — Teams task links, `initialFindingId`, `initialChart` go straight to the Editor at the target. The dashboard is the default, not mandatory.
- **`navigate_to` is a hybrid tool** — auto-executes for panel/view navigation (no state mutation); uses proposal pattern only when `restore_filters: true` (mutates filter state).
- **Tool schemas use strict mode** — no `default` values in JSON schemas; defaults handled in handler code. `additionalProperties: false` on all schemas.

---

## Layer 1: Project Dashboard

### Navigation Model

The Project Dashboard is a **peer view** alongside the analysis Editor within a loaded project:

```
Project List → [select project] → loadProject()
                                       ↓
                              ┌─────────────────┐
                              │  Project Shell   │
                              │  (DataContext)   │
                              │                  │
                              │  ┌───────┐ ┌────┐│
                              │  │Overview│ │Edit││  ← tab bar / nav
                              │  └───┬───┘ └──┬─┘│
                              │      │        │   │
                              │  Dashboard  Editor│
                              └─────────────────┘

Deep links (Teams, initialFindingId) → skip to Editor directly
```

- **Default landing** for saved projects with data → Dashboard tab active
- **Always accessible** via tab/nav — user can return anytime
- **New projects** (no data) → skip straight to Editor in FRAME mode
- **Deep links** → skip to Editor with target view pre-configured
- **Lives inside the existing Editor component tree** — DataContext is already available. The dashboard is a sibling view to the analysis dashboard, toggled via `panelsStore.activeView`.

### Layout

Three zones: **Project Status** (left), **AI Summary + Quick Ask** (right top), **Quick Actions** (right bottom). On mobile (<640px): single column, stacked vertically.

#### Project Status (left column — works without AI)

- **Project name + last edited timestamp**
- **Journey phase indicator**: FRAME/SCOUT/INVESTIGATE/IMPROVE with visual progress (filled/empty segments using phase colors: blue/green/amber/purple)
- **"Current focus"**: Active view description derived from `ViewState`:
  - Example: "Investigating Operator → Night Shift, focused on Boxplot"
  - Includes filter breadcrumb trail from `filterStack`
  - "Go to analysis" button switches to Editor at current ViewState
- **Findings by status**: Clickable counts with color-coded dots (matching FindingStatus colors)
  - Click "3 investigating" → switches to Editor with Findings panel open, status filter = investigating
- **Hypothesis tree summary**: Root hypotheses with status icon (✓ supported /✗ contradicted /? untested /◐ partial) + η² percentage
  - Click a hypothesis → switches to Editor with Investigation sidebar open, that hypothesis expanded
- **Action progress**: "2/5 actions completed" progress bar
  - Click → switches to Editor with Improvement workspace open

All items are **clickable** — each switches to the Editor with the appropriate panel/view pre-opened.

#### AI Summary Card (right top — progressive enhancement)

- 1-3 sentence contextual summary generated by `buildDashboardSummaryPrompt()`
- **Live, not just welcome-back** — refreshes when the user returns to the dashboard mid-session
- Highlights: current investigation status, overdue items, suggested next step
- Hidden when AI is unavailable (left column expands to full width)
- **"Ask CoScout..." input**: Single-line text input
  - On submit: stores question in `aiStore.pendingDashboardQuestion`, switches to Editor, opens CoScout panel with question pre-loaded
  - Enables "have we checked X?" flow from the dashboard

#### Quick Actions (right bottom)

Contextual buttons based on project state:

- **Go to analysis** (always) → switches to Editor at current ViewState
- **Add new data batch** (always) → switches to Editor in data append flow (`useEditorDataFlow`)
- **View report** (when findings exist) → switches to Editor with report view open
- **Review actions** (when overdue actions exist) → replaces "View report", opens Improvement workspace

### Component structure

| Component              | Package                      | Purpose                                         |
| ---------------------- | ---------------------------- | ----------------------------------------------- |
| `ProjectDashboard`     | `apps/azure/src/components/` | Full dashboard view, Azure-only                 |
| `ProjectStatusCard`    | `apps/azure/src/components/` | Status summary (Azure-only, no second consumer) |
| `DashboardSummaryCard` | `apps/azure/src/components/` | AI summary card + quick ask input               |

### State management

New field in `panelsStore`: `activeView: 'dashboard' | 'editor'`

- Set to `'dashboard'` after `loadProject()` for projects with data (unless deep link)
- Set to `'editor'` on any navigation action from the dashboard, or when user clicks "Edit" tab
- Set to `'dashboard'` when user clicks "Overview" tab
- Persisted in `ViewState` so it restores on project reopen

### Data source

All status data from already-loaded `AnalysisState` — findings[], hypotheses[], actions are hydrated by `loadProject()`. AI summary is the only async call. Dashboard reads from the same DataContext as the Editor — no duplication.

---

## Layer 2: CoScout Tool — `search_project`

### Tool definition (Read tool — auto-execute)

```typescript
{
  name: 'search_project',
  description: 'Search findings, hypotheses, improvement ideas, and actions in the current project by text and optional filters. Use when the user asks about past analysis, whether something was investigated, or what was found.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search text (matched against text content of findings, hypotheses, ideas, actions, and comments)'
      },
      artifact_type: {
        type: 'string',
        enum: ['finding', 'hypothesis', 'idea', 'action', 'all'],
        description: 'Type of artifact to search. Omit for all types.'
      },
      finding_status: {
        type: 'string',
        enum: ['observed', 'investigating', 'analyzed', 'improving', 'resolved', 'any'],
        description: 'Filter findings by status. Omit or use any for no filter. Only applies to findings.'
      },
      hypothesis_status: {
        type: 'string',
        enum: ['untested', 'supported', 'contradicted', 'partial', 'any'],
        description: 'Filter hypotheses by validation status. Omit or use any for no filter. Only applies to hypotheses.'
      }
    },
    required: ['query'],
    additionalProperties: false
  },
  strict: true
}
```

**Defaults in handler:** `artifact_type` → `'all'`, `finding_status` → `'any'`, `hypothesis_status` → `'any'`.

### Return shape

```typescript
interface SearchResult {
  type: 'finding' | 'hypothesis' | 'idea' | 'action';
  id: string;
  text: string;
  status: string;
  // Hypothesis-specific
  etaSquared?: number;
  factor?: string;
  linkedFindingCount?: number;
  causeRole?: 'primary' | 'contributing';
  childCount?: number;
  // Finding-specific
  tag?: 'key-driver' | 'low-impact';
  filterContext?: string; // Human-readable: "Operator → Night Shift"
  // Idea-specific
  parentHypothesisText?: string;
  timeframe?: string;
  // Action-specific
  dueDate?: string;
  completed?: boolean;
  parentFindingText?: string;
}
```

### Implementation

Pure function `searchProjectArtifacts()` in `@variscout/core/ai/searchProject.ts`:

- Case-insensitive substring match across all text fields
- Status filtering: `finding_status` applies only to findings, `hypothesis_status` only to hypotheses. When `artifact_type` is `'all'`, unmatched entity types are included unfiltered.
- Results sorted by: exact match > starts-with > contains, then by recency
- **Max 5 results** (token budget ~250-400 tokens based on ~50-80 tokens per result)
- No embeddings — project data is small (max ~30 hypotheses, ~50 findings)

### Phase-gating

Available in: SCOUT, INVESTIGATE, IMPROVE. Not in FRAME (no artifacts to search).

---

## Layer 3: CoScout Tool — `navigate_to`

### Tool definition (Hybrid: auto-execute for views, proposal for filter restoration)

```typescript
{
  name: 'navigate_to',
  description: 'Navigate to a specific finding, hypothesis, chart view, or workspace. Auto-executes for panel navigation. Shows a proposal card when restoring filter context from a finding.',
  parameters: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        enum: ['finding', 'hypothesis', 'chart', 'improvement_workspace', 'report', 'dashboard'],
        description: 'What to navigate to'
      },
      target_id: {
        type: 'string',
        description: 'ID of the finding or hypothesis (for finding/hypothesis targets)'
      },
      chart_type: {
        type: 'string',
        enum: ['ichart', 'boxplot', 'pareto', 'capability', 'stats'],
        description: 'Which chart to focus (for chart target)'
      },
      restore_filters: {
        type: 'boolean',
        description: 'Restore the filter context from when the finding was created. When true, requires user confirmation via proposal card.'
      },
      factor: {
        type: 'string',
        description: 'Factor context to restore (for boxplot/pareto factor selection)'
      }
    },
    required: ['target'],
    additionalProperties: false
  },
  strict: true
}
```

**Defaults in handler:** `restore_filters` → `false`, `factor` → `undefined`.

Note: `'dashboard'` target added — CoScout can navigate back to the Project Dashboard (e.g., "show me the project overview").

### Execution modes

| `restore_filters` | Behavior                                                                            | Rationale                                                                          |
| ----------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `false` (default) | **Auto-execute** — opens panel/view immediately, switches to Editor if on Dashboard | Panel switching is low-risk, reversible. No friction for "show me the hypothesis." |
| `true`            | **Proposal pattern** — shows ActionProposalCard with filter preview                 | Filter restoration mutates data pipeline state. User should confirm.               |

### Proposal card (when `restore_filters: true`)

Shows: "Navigate to Finding: '[text]' — will apply filters: Operator → Night Shift (47 samples, Cpk 0.83)"

Preview stats computed by existing `computeFilterPreview()` from `actionTools.ts`.

### Implementation — required store changes

**`panelsStore` (in `apps/azure/src/features/panels/panelsStore.ts`):**

- Existing actions sufficient: `toggleFindings()`, `setFocusedChart()`, `openImprovement()`, `openReport()`
- New field: `activeView: 'dashboard' | 'editor'` (default `'editor'` for backward compat)
- New actions: `showDashboard()`, `showEditor()` — sets `activeView`
- `activeView` included in `ViewState` for persistence

**`findingsStore` (in `apps/azure/src/features/findings/findingsStore.ts`):**

- Existing: `setHighlightedFindingId(id)` — reuse for selection
- New field: `statusFilter: FindingStatus | null` — for "show investigating findings" from dashboard
- New action: `setStatusFilter(status: FindingStatus | null)` — filters findings panel by status

**`investigationStore` (in `apps/azure/src/features/investigation/investigationStore.ts`):**

- New field: `expandedHypothesisId: string | null` — scroll-to and highlight target
- New action: `expandToHypothesis(id: string)` — sets `expandedHypothesisId`, also expands parent nodes in the tree view to make the target visible
- Note: Tree expand/collapse state currently lives in `HypothesisTreeView` component state. This refactor promotes the "expand to target" capability to the store so `navigate_to` and the dashboard can trigger it.

**`aiStore` (in `apps/azure/src/features/ai/aiStore.ts`):**

- New field: `pendingDashboardQuestion: string | null` — question from dashboard "Ask CoScout..." input
- New action: `setPendingDashboardQuestion(question)` — CoScout panel checks this on mount and auto-sends

### Filter restoration

Uses `finding.context` which contains the persisted `filterStack: FilterAction[]` (not `activeFilters`). Restoration via existing `filterStackToFilters()` from `@variscout/core/navigation.ts`.

**Stale filter handling:** If a filter category no longer exists in current data (e.g., factor was removed), skip that filter level and show a toast: "Some filter context could not be restored (data has changed)."

### Phase-gating

Available in: SCOUT, INVESTIGATE, IMPROVE. Not in FRAME.

---

## Conversation Flow Examples

### From Dashboard "Ask CoScout..."

```
User types "have we checked the material?" in dashboard input
→ Stores question, switches to Editor, opens CoScout panel
→ CoScout receives question, auto-calls search_project

CoScout: [auto-executes search_project({query: "material", artifact_type: "hypothesis"})]
→ Returns: { type: 'hypothesis', text: 'Material supplier batch variation',
             status: 'contradicted', etaSquared: 0.02, factor: 'Supplier' }

CoScout: "Yes — you tested a 'Material supplier batch variation' hypothesis and
          it was contradicted (η²=2%, negligible contribution). Want to see the details?"

User: "Yes, show me"

CoScout: [auto-executes navigate_to({target: "hypothesis", target_id: "hyp-abc123"})]
→ Investigation sidebar opens instantly with that hypothesis highlighted and expanded
```

### Filter restoration with proposal

```
User: "Take me back to where I found the Night Shift issue"

CoScout: [search_project({query: "night shift"})]
→ Returns: Finding "Night Shift operators show 3x higher spread"

CoScout: [ACTION:navigate_to:{"target":"finding","target_id":"find-xyz","restore_filters":true}]
→ Proposal card: "Navigate to Finding and restore filters: Operator → Night Shift (47 samples)"
User clicks ✓ → Findings panel opens, filters restored, finding highlighted
```

### Navigate to dashboard

```
User: "Show me the project overview"
CoScout: [auto-executes navigate_to({target: "dashboard"})]
→ Switches to Project Dashboard view
```

---

## AI Summary Prompt (Dashboard)

### Location

New file: `packages/core/src/ai/prompts/dashboardSummary.ts`

### Design

- Reuses existing `buildAIContext()` output — no new context collection needed
- Fast tier (gpt-5.4-nano, reasoning: none) — same as narration
- **State-aware cache key**: hash of `findingCount + hypothesisStatusCounts + actionCompletionCount` — invalidates when project state changes meaningfully, not on a fixed 24h TTL
- `prompt_cache_key`: `'variscout-dashboard'`
- **Refreshes on dashboard view** — not just on first load. When user returns to dashboard mid-session, checks cache staleness and re-fetches if state changed.

### Prompt structure

- System: VariScout role + glossary (Tier 1, cached)
- User: Structured project summary from AIContext + instruction to produce 1-3 sentence summary highlighting current investigation status, overdue items, and suggested next step

---

## Files to Create/Modify

### New files

| File                                                 | Purpose                                  |
| ---------------------------------------------------- | ---------------------------------------- |
| `apps/azure/src/components/ProjectDashboard.tsx`     | Full dashboard view                      |
| `apps/azure/src/components/ProjectStatusCard.tsx`    | Status summary component                 |
| `apps/azure/src/components/DashboardSummaryCard.tsx` | AI summary card + quick ask              |
| `packages/core/src/ai/prompts/dashboardSummary.ts`   | Dashboard summary prompt builder         |
| `packages/core/src/ai/searchProject.ts`              | `searchProjectArtifacts()` pure function |

### Modified files

| File                                                                     | Change                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `packages/core/src/ai/actionTools.ts`                                    | Add `search_project` + `navigate_to` tool type unions           |
| `apps/azure/src/features/ai/useAIOrchestration.ts`                       | Wire new tool handlers                                          |
| `apps/azure/src/features/panels/panelsStore.ts`                          | Add `activeView: 'dashboard' \| 'editor'` + navigation actions  |
| `apps/azure/src/features/findings/findingsStore.ts`                      | Add `statusFilter` field + action                               |
| `apps/azure/src/features/investigation/investigationStore.ts`            | Add `expandedHypothesisId` + `expandToHypothesis()` action      |
| `apps/azure/src/features/ai/aiStore.ts`                                  | Add `pendingDashboardQuestion` field + action                   |
| `packages/core/src/ai/prompts/coScout.ts`                                | Add new tools to CoScout system prompt tool definitions         |
| `packages/core/src/ai/responsesApi.ts`                                   | Add new tools to function definitions sent to API               |
| `apps/azure/src/components/Editor.tsx`                                   | Conditional render: Dashboard vs analysis based on `activeView` |
| `packages/ui/src/components/InvestigationSidebar/HypothesisTreeView.tsx` | Read `expandedHypothesisId` from store, auto-scroll + highlight |
| `packages/core/src/types.ts`                                             | Add `activeView` to `ViewState` interface                       |

### Existing utilities to reuse

| Utility                      | Location                                            | Reuse                                         |
| ---------------------------- | --------------------------------------------------- | --------------------------------------------- |
| `buildAIContext()`           | `packages/core/src/ai/buildAIContext.ts`            | Context for AI summary                        |
| `fetchNarration()`           | `apps/azure/src/services/aiService.ts`              | Infrastructure for dashboard summary call     |
| `filterStackToFilters()`     | `packages/core/src/navigation.ts`                   | Filter restoration                            |
| `computeFilterPreview()`     | `packages/core/src/ai/actionTools.ts`               | Preview stats for filter restore proposals    |
| `ActionProposal` pattern     | `packages/core/src/ai/actionTools.ts`               | Proposal for navigate_to with restore_filters |
| `panelsStore` actions        | `apps/azure/src/features/panels/panelsStore.ts`     | Panel navigation                              |
| `findingsStore`              | `apps/azure/src/features/findings/findingsStore.ts` | Finding highlighting                          |
| `useEditorDataFlow`          | `apps/azure/src/hooks/useEditorDataFlow.ts`         | Data append flow                              |
| `detectInvestigationPhase()` | `packages/core/src/ai/buildAIContext.ts`            | Journey phase for status                      |
| `hashFilterStack()`          | `packages/core/src/ai/actionTools.ts`               | Proposal expiry detection                     |
| `detectJourneyPhase()`       | `packages/hooks/src/useJourneyPhase.ts`             | Journey phase detection for dashboard         |

---

## Documentation Plan

### New documents

| Document                                              | Purpose                                                                                                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **`docs/07-decisions/adr-042-project-dashboard.md`**  | ADR: Project Dashboard concept, `activeView` navigation model, CoScout tool design choices (atomic tools, hybrid execution), deep link bypass |
| **`docs/03-features/workflows/project-dashboard.md`** | Feature doc: what the dashboard shows, connection to investigation phases, quick actions, CoScout search, persona mapping                     |
| **`docs/02-journeys/flows/project-reopen.md`**        | User flow: open saved project → dashboard → navigate to analysis. Expands "Flow 5: Return Visitor"                                            |

### Updated documents

| Document                                                             | Changes                                                                                                                                                                       |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`docs/05-technical/architecture/ai-architecture.md`**              | Add `search_project` + `navigate_to` to tool tables (§ Package Responsibilities, § AI Collaborator Capabilities), update hook composition diagram with dashboard summary flow |
| **`docs/05-technical/architecture/ai-context-engineering.md`**       | Add dashboard summary to Three-Tier table (fast tier), document state-aware cache key                                                                                         |
| **`docs/05-technical/architecture/ai-journey-integration.md`**       | Add dashboard as cross-phase AI touch point — summary works in all phases                                                                                                     |
| **`docs/05-technical/architecture/journey-phase-screen-mapping.md`** | Add Project Dashboard view, document `activeView` toggle as navigation model                                                                                                  |
| **`docs/05-technical/architecture/mental-model-hierarchy.md`**       | Add dashboard as entry point for saved projects in journey flow                                                                                                               |
| **`docs/02-journeys/traceability.md`**                               | Update Flow 5 (Return Visitor) + Flow 7 (Azure Daily Use) with dashboard as entry point                                                                                       |
| **`docs/06-design-system/patterns/navigation.md`**                   | Add dashboard ↔ editor tab navigation pattern                                                                                                                                 |
| **`docs/08-products/feature-parity.md`**                             | Add Project Dashboard row (Azure-only, both Standard and Team)                                                                                                                |
| **`docs/07-decisions/index.md`**                                     | Add ADR-042 entry                                                                                                                                                             |
| **`CLAUDE.md`**                                                      | Add Project Dashboard to task-to-documentation table, update Key Entry Points for azure app                                                                                   |
| **`.claude/rules/monorepo.md`**                                      | Add `ProjectDashboard`, `ProjectStatusCard`, `DashboardSummaryCard` to azure component listing                                                                                |

### Persona/journey updates

| Document                                          | Changes                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **`docs/02-journeys/personas/opex-olivia.md`**    | Add dashboard as primary entry for "monitor KPIs and investigation progress"         |
| **`docs/02-journeys/personas/greenbelt-gary.md`** | Add dashboard for hypothesis tracking and orientation across sessions                |
| **`docs/02-journeys/personas/field-fiona.md`**    | Note mobile dashboard layout (single-column) for quick investigation status on phone |

---

## Verification

### Unit tests

- `searchProjectArtifacts()`: text matching, status filtering (separate finding/hypothesis filters), result ranking, empty results, max 5 cap
- `buildDashboardSummaryPrompt()`: prompt structure with various project states (no findings, all resolved, overdue actions, empty project)
- `navigate_to` handler: auto-execute for panel targets, proposal for filter restoration, `'dashboard'` target
- `ProjectStatusCard`: renders correctly with various project states
- `panelsStore.activeView`: dashboard ↔ editor transitions, persistence in ViewState

### Integration tests

- Dashboard renders after `loadProject()` with correct status counts
- Clicking status items switches to Editor with correct panel/view state
- "Ask CoScout..." input stores question in aiStore, switches to Editor, CoScout auto-sends
- Tab switching: Dashboard ↔ Editor preserves state in both directions
- `search_project` returns correct results; `finding_status` only filters findings; `hypothesis_status` only filters hypotheses
- `navigate_to` auto-executes for panel navigation; shows proposal for filter restoration
- Stale filter handling: skip missing categories, show toast
- Deep link with `initialFindingId` → skips dashboard, lands in Editor

### E2E verification

- Open saved project → dashboard appears → verify status matches project
- Click hypothesis → switches to Editor, Investigation sidebar shows that hypothesis expanded
- Click "Overview" tab → returns to dashboard with updated status
- In Editor, ask CoScout "have we checked X?" → search_project fires → results shown
- CoScout suggests navigate_to → view opens (auto-execute) or proposal shown (with filters)
- Deep link from Teams → lands directly in Editor at target

### Manual verification

- Dashboard hidden for new/empty projects (straight to Editor FRAME)
- AI summary card hidden when AI unavailable (layout adapts to single-column)
- Works offline (status from IndexedDB, AI card hidden)
- Mobile responsive: single-column stacked layout on phone
- Dashboard summary refreshes when returning to dashboard after making changes in Editor
