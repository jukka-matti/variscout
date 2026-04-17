---
title: Navigation Architecture + Invisible Phase Intelligence
audience: [developer, designer]
category: architecture
status: draft
related: [navigation, mobile, teams, accessibility, phase-detection, toolbar]
date: 2026-03-17
---

# Navigation Architecture + Invisible Phase Intelligence

## 1. Problem Statement

The navigation audit (docs/archive/specs/2026-03-17-navigation-audit.md) found 30 issues across 6 POVs. Beyond mechanical fixes (touch targets, focus traps), it revealed a structural gap:

**VariScout's documentation describes a 4-phase analysis workflow (FRAME→SCOUT→INVESTIGATE→IMPROVE) with 5 feedback loops. But the app is a flat dashboard with bolt-on panels, no router, no phase awareness, and no shared navigation abstraction.**

This design warrants an ADR (proposed ADR-026) to record the architectural decisions: no router library, invisible phases, shared navigation hook, pushState ownership.

Current navigation issues:

- No browser back support (state-based views, no `pushState`)
- Panel stacking conflicts (8 independent booleans, no mutual exclusion)
- What-If/Report/Presentation tracked as panel booleans but behave as views
- Each app manages navigation independently (no shared hook)
- Mobile menu shows 7+ items regardless of context
- Teams mobile consumes 24% viewport with double header

## 2. Expert Analysis Summary

Four expert perspectives evaluated whether phases should be visible UI:

| Expert                  | Verdict   | Key Argument                                                                                                                       |
| ----------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Quality Professional    | Invisible | "I already know where I am. Phases belong in reports, not dashboards."                                                             |
| UX/Interaction Designer | Invisible | "Workspace, not wizard. Figma/Tableau/VS Code succeed without mode labels."                                                        |
| Learning Science        | Invisible | "Visible phases short-circuit productive struggle. Existing scaffolding (yellow glow, breadcrumbs, η²) is pedagogically superior." |
| Product Strategy        | Invisible | "Phase labels add perceived complexity. Natural upgrade ceilings work better than labeled friction."                               |

**Unanimous conclusion: Phases should be invisible intelligence that drives contextual adaptation — toolbar emphasis, panel priority, NarrativeBar tone, mobile filtering — without explicit labels.**

## 3. Benchmarking

| Tool            | Pattern                                                                  | Lesson for VariScout                                                         |
| --------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Figma           | Context-aware properties panel; adapts to selection type                 | Phase adaptation should be tied to selection/action state, not abstract mode |
| VS Code         | Activity Bar with sidebar context switching + badge counts               | Toolbar actions stay visible; badges signal state without mode labels        |
| Linear          | Color saturation signals status (dim=future, vibrant=active, desat=done) | Finding status colors already do this; extend to toolbar emphasis            |
| Tableau         | Device-specific layout adapters (auto-detect, no mode toggle)            | Mobile layout should auto-adapt without explicit mobile mode                 |
| Adobe Photoshop | Contextual Task Bar (floating, updates per active tool)                  | Tools surface based on current action, not global mode                       |
| GitHub          | PR merge button changes based on review state                            | Button state (disabled→enabled→emphasized) signals workflow phase            |
| Slack           | Thread containment (sidebar isolation = implicit phase signal)           | Where content lives signals phase without labels                             |

## 4. Strategic Hypothesis Alignment

| Hypothesis                             | How Design Supports It                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| H2: Linked Filtering is differentiator | `useNavigation` + `historyDelegate` preserves drill-down history. Browser back undoes drills. |
| H5: Free PWA drives paid conversion    | Shared `ToolbarBase` + `useNavigation` → PWA has same professional feel.                      |
| H7: Struggle is the point (PWA)        | Phase detection is deterministic. PWA gets toolbar emphasis but no AI prompts. No labels.     |
| H8: AI augments, never replaces        | NarrativeBar phase tone is ~20 token suffix. AI narrates, doesn't gate.                       |
| H9: Closed-loop findings create moat   | Phase tracks full journey. Toolbar surfaces next actions naturally.                           |

## 5. Research Validation

| Topic                                  | Finding                                                                                                   | Impact on Design                                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Invisible UI (NNG)                     | Adaptive help that predicts wrong loses trust. Make adaptations discoverable, not hidden.                 | Emphasis opacity should be noticeable (1.0 vs 0.5, not 1.0 vs 0.85)                                   |
| History API (MDN)                      | State must be serializable. Manual UI restoration needed on popstate.                                     | Store minimal state in URL; complex state in IndexedDB                                                |
| Touch targets (W3C, Material Design 3) | 44px = WCAG AA minimum. Material Design 3 recommends 48dp.                                                | Primary actions: 48px. Secondary: 44px minimum.                                                       |
| Focus traps (CSS-Tricks)               | Native `<dialog>` with `showModal()` handles focus trap automatically.                                    | Use `<dialog>` for true modals; `focus-trap-react` for overlays                                       |
| Teams mobile (Microsoft Learn)         | Minimum 320px viewport. Must test at 200% zoom. Three-stage model (Consumption→Quick Actions→Enablement). | Add 320px breakpoint test. Teams three-stage aligns with our phases.                                  |
| Phase-based UX in SPC (ASQ, Kaizen)    | No SPC competitor uses phase-based navigation. Phases are reporting artifacts, not live navigation.       | Confirms: phases in reports (existing ReportStepMarker), not in live dashboard. Novel differentiator. |

**Sources:** NNG: Pop-ups and Adaptive Help; MDN: History API; W3C WAI: WCAG 2.5.5; CSS-Tricks: Dialog Focus; Microsoft Learn: Teams Tabs Design; Figma Blog: UI3 Redesign; Adobe: Contextual Task Bar; Kaizen: DMAIC; ASQ: SPC

## 6. Design Principles

1. **Phases for storytelling, not navigation** — Reports use step markers (existing ReportStepMarker). Live dashboard never labels phases.
2. **Workspace, not wizard** — No gating, no "next" buttons. All tools always accessible.
3. **Discoverable, not invisible** — Phase adaptations (emphasis, badges, NarrativeBar) must be noticeable but non-intrusive. Opacity: 1.0 vs 0.5.
4. **Works without AI first** — Phase intelligence is deterministic. AI enhances but never replaces.
5. **Same product, different depth** — PWA and Azure share `useNavigation` + `ToolbarBase`.
6. **48px primary, 44px minimum** — Material Design 3 standard for touch targets.
7. **Native `<dialog>` for modals** — Browser handles focus trap. `focus-trap-react` for non-modal overlays.
8. **No router library** — Lightweight `pushState` + `popstate`. Minimal URL state.

## 7. Architecture: Shared Navigation Hook

### 7.1 `useNavigation<V>` (packages/hooks)

Manages a view stack mirroring `history.pushState`. Panel state remains in `useEditorPanels`. Fullscreen "views" (What-If, Report, Presentation) move FROM panel booleans TO navigation views.

```typescript
// Views available in both apps
type CommonView = 'home' | 'paste' | 'manual-entry' | 'column-map' | 'dashboard' | 'what-if';

// App-specific extensions
type AzureView =
  | CommonView
  | 'editor'
  | 'report'
  | 'presentation'
  | 'admin-teams'
  | 'admin-knowledge';
type PWAView = CommonView;

interface NavParams {
  // Azure-specific
  projectId?: string;
  projectName?: string;
  // PWA-specific
  embed?: boolean;
  sample?: string;
  // Shared
  chart?: 'ichart' | 'boxplot' | 'pareto' | 'stats';
  findingId?: string;
}

interface NavEntry<V> {
  view: V;
  params: NavParams;
  id: number;
}

type BeforeNavigateGuard = (from: NavEntry, to: NavEntry) => Promise<boolean> | boolean;

interface UseNavigationReturn<V> {
  currentView: V;
  params: NavParams;
  navigate: (view: V, params?: Partial<NavParams>) => void;
  replace: (view: V, params?: Partial<NavParams>) => void;
  goBack: () => void;
  canGoBack: boolean;
  buildShareUrl: () => string;
  consumeDeepLink: () => NavParams;
}
```

**Key:** `beforeNavigate` guard enables Azure to auto-save before leaving editor.

**Guard + popstate recovery:** When `popstate` fires and the guard rejects, `useNavigation` calls `history.pushState()` to restore the previous URL (push-to-restore pattern). This re-pushes the prior entry, keeping the URL bar consistent with app state. The guard receives the attempted navigation and can show a confirmation dialog (e.g., "Unsaved changes — leave anyway?").

### 7.2 History Ownership: pushState + popstate

**`useNavigation` is the sole owner of `pushState` and `popstate`.** No other hook calls `history.pushState()` or registers a `popstate` listener.

`useFilterNavigation` gains an `externalHistory: true` option that disables its internal `pushState`/`popstate` handling. When enabled, filter changes are reported upward via callbacks instead of pushed to the history stack directly.

```typescript
// Merged history state — single pushState entry contains both view and filter state
interface NavigationHistoryState {
  view: string;
  params: NavParams;
  drillFilters: Record<string, (string | number)[]>;
}

// useNavigation delegates filter state management via callbacks
historyDelegate?: {
  getDrillFilters: () => Record<string, (string | number)[]>;
  onFiltersChanged: (filters: Record<string, (string | number)[]>) => void;
  onFiltersRestored: (filters: Record<string, (string | number)[]>) => void;
};
```

**popstate flow:**

```
popstate fires
  → useNavigation receives event
  → Extracts NavigationHistoryState from event.state
  → Runs beforeNavigate guard (push-to-restore if rejected)
  → Updates view + params
  → Calls historyDelegate.onFiltersRestored(state.drillFilters)
    → useFilterNavigation applies filters without pushing history
```

**Azure migration:** Azure Editor currently uses `enableHistory: false, enableUrlSync: false` on `useFilterNavigation`. When `useNavigation` is wired in:

- Azure Editor switches from `enableHistory: false` to `externalHistory: true`
- `useNavigation` handles all `pushState` calls, including drill filter state
- Filter URL sync happens through `useNavigation`'s URL serialization, not `useFilterNavigation`'s own sync

### 7.3 URL Structure

| State                            | URL                                                    | Notes                                  |
| -------------------------------- | ------------------------------------------------------ | -------------------------------------- |
| Azure home (project list)        | `/?`                                                   | Azure `home` = project list            |
| Azure editor (project workspace) | `/?view=editor&project=CoffeeWeights`                  | Azure `editor` = analysis workspace    |
| Azure + chart deep link          | `/?view=editor&project=CoffeeWeights&chart=boxplot`    |                                        |
| Azure + finding                  | `/?view=editor&project=CoffeeWeights&finding=f-abc123` |                                        |
| Azure report                     | `/?view=report&project=CoffeeWeights`                  |                                        |
| Azure what-if                    | `/?view=whatif&project=CoffeeWeights`                  |                                        |
| PWA home                         | `/?`                                                   |                                        |
| PWA dashboard (with sample)      | `/?sample=coffee-weights`                              | PWA `dashboard` = single-view analysis |
| PWA + filters                    | `/?sample=coffee-weights&filter_Shift=Morning`         |                                        |
| Teams subPageId                  | `project=CoffeeWeights&chart=boxplot`                  | Same format as URL params              |

## 8. Architecture: Phase Detection

Pure function in `@variscout/core`. Both apps use it.

**File:** `packages/core/src/phase.ts` — new file alongside existing domain modules (stats/, parser/, tier.ts).

```typescript
type AnalysisPhase = 'frame' | 'scout' | 'investigate' | 'improve';

interface PhaseSignals {
  hasData: boolean;
  hasOutcome: boolean;
  filterCount: number;
  findingsCount: number;
  activeFindingsCount: number;
  hasHypotheses: boolean;
  hasSupportedHypothesis: boolean;
  currentView: string; // View name from useNavigation (app-specific union)
  hasActions: boolean;
  hasStagedData: boolean;
}

function detectAnalysisPhase(signals: PhaseSignals): AnalysisPhase;
```

`currentView` is typed as `string` intentionally — `@variscout/core` has no React dependencies and shouldn't import app-level view types. The phase detection only checks for specific values like `'what-if'` and `'report'`.

**Detection (first match):** `frame` if no data/outcome → `improve` if What-If/Report open or has actions/staged data → `investigate` if has findings → `scout` default.

**Key:** Heuristic, not gate. Indicates dominant activity. No wizard.

## 9. Architecture: Panel Reducer (Simplified)

With What-If/Report/Presentation in `useNavigation`, panel state simplifies to:

```typescript
interface EditorPanelState {
  isDataPanelOpen: boolean;
  isDataTableOpen: boolean;
  isFindingsOpen: boolean;
  isCoScoutOpen: boolean;
  highlightRowIndex: number | null;
  highlightedChartPoint: number | null;
}
```

**Scope:** `EditorPanelState` covers **shared analysis panels only**. Each app retains app-specific panel state alongside — e.g., PWA keeps `isSettingsOpen`, `showExcludedOnly`, `showResetConfirm`, `openSpecEditorRequested` in its own `useAppPanels`. Settings panels remain as transient overlays managed by app-specific panel state, outside both `useNavigation` and `EditorPanelState`.

**Mobile mutual exclusion:** Findings OR CoScout as full-screen overlay (not both).

**Z-Index Strategy:**

| Layer                      | Z-Index   | Components                           |
| -------------------------- | --------- | ------------------------------------ |
| Skip-to-content            | `z-[100]` | Both apps                            |
| Mobile fullscreen overlays | `z-[60]`  | Findings, CoScout (phone)            |
| Header + dropdowns         | `z-50`    | Header, toolbar menus                |
| Mobile backdrops           | `z-40`    | Sheet backdrops                      |
| Side panels                | `z-30`    | Desktop Findings, CoScout, DataPanel |
| Default                    | `z-0`     | Dashboard                            |

## 10. Architecture: ToolbarBase (Shared Component)

**File:** `packages/ui/src/components/ToolbarBase/`

```typescript
interface ToolbarAction {
  id: string;
  group: 'data' | 'analysis' | 'investigation' | 'output';
  icon: React.ComponentType<{ size: number }>;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  badge?: number;
  requiresData?: boolean;
  phaseEmphasis?: AnalysisPhase[];
  alwaysVisible?: boolean;
  minBreakpoint?: 'phone' | 'tablet' | 'desktop';
}
```

**Action groups:**

| Group         | Actions                              | Phase emphasis         |
| ------------- | ------------------------------------ | ---------------------- |
| Data          | Add Data, Edit Data, CSV Export      | `frame`, `scout`       |
| Analysis      | Findings, Data Table                 | `scout`, `investigate` |
| Investigation | CoScout (Azure)                      | `investigate`          |
| Output        | What-If, Report, Presentation, Share | `improve`              |

**Responsive behavior:**

| Width      | Layout                                                             |
| ---------- | ------------------------------------------------------------------ |
| < 640px    | 3-4 phase-filtered icons + overflow. 48px primary, 44px secondary. |
| 640-1023px | All icons, labels on primary. Group separators.                    |
| 1024px+    | All with labels. Dividers between groups.                          |

**Phase emphasis:** `data-emphasis="primary|secondary|default"` attribute → CSS opacity (1.0 / 0.5 / 0.7).

**Findings pulse:** In `scout` with 2+ filters and 0 findings → CSS glow animation (2 cycles). Respects `prefers-reduced-motion`.

**AppHeader migration:** PWA's `AppHeader` contains non-toolbar elements (logo, filename, sample selector). These move to a `HeaderBar` above `ToolbarBase`, or `ToolbarBase` accepts `leading`/`trailing` slot props for app-specific branding. Implementation detail deferred to Step 10.

**Teams mobile:** When `isTeamsMobile`, hide app header. Toolbar is sole chrome. Teams mobile back button uses `microsoftTeams.pages.backStack.navigateBack()` from `@microsoft/teams-js` SDK.

## 11. Architecture: NarrativeBar Phase Tone (Azure Only)

~20 token phase suffix in prompt template:

| Phase                            | Prompt Suffix                                                     |
| -------------------------------- | ----------------------------------------------------------------- |
| `scout` (0 findings)             | "Suggest patterns to investigate. Mention drilling."              |
| `scout` (2+ filters, 0 findings) | "Suggest pinning a finding to track this pattern."                |
| `investigate`                    | "Reference existing findings. Suggest next validation step."      |
| `improve`                        | "Summarize improvement progress. Suggest verification or report." |

Works without AI: NarrativeBar doesn't render → no fallback needed.

## 12. Cross-Mode Behavior

| Capability         | No AI (PWA) | No AI (Azure) | With AI | Teams Desktop |   Teams Mobile   |
| ------------------ | :---------: | :-----------: | :-----: | :-----------: | :--------------: |
| useNavigation      |     Yes     |      Yes      |   Yes   |      Yes      |       Yes        |
| Browser back       |     Yes     |      Yes      |   Yes   |      Yes      |    Teams back    |
| Phase detection    |     Yes     |      Yes      |   Yes   |      Yes      |       Yes        |
| Toolbar emphasis   |     Yes     |      Yes      |   Yes   |      Yes      |       Yes        |
| Mobile menu filter |     Yes     |       —       |    —    |       —       | Yes (3-4 items)  |
| NarrativeBar tone  |      —      |       —       |   Yes   |      Yes      |       Yes        |
| Header hidden      |      —      |       —       |    —    |       —       | Yes (saves 56px) |

## 13. Navigation Audit Fixes (Incorporated)

**Touch targets (F-03, F-04, F-05, F-06, F-07):** 48px primary, 44px minimum. FilterBreadcrumb, MobileCategorySheet highlights, carousel pills, overflow menu items, FilterChipDropdown close.

**Focus traps (F-18, F-19, F-26):** Native `<dialog>` for DataTableModalBase, SettingsPanelBase, MobileCategorySheet. `focus-trap-react` for CoScoutPanelBase (mobile), FilterChipDropdown (mobile), MobileMenu. All accept `triggerRef` for focus return.

**Accessibility (F-20, F-23, F-24, F-27):** `focus-visible:opacity-100` on chart nav buttons. `aria-label` on close buttons. `scroll-behavior: auto` in reduced-motion. ARIA on AIOnboardingTooltip.

**Teams (F-13, F-16, F-17):** High-contrast CSS overrides. Theme sync before mount. `console.warn` on deep link failure.

**Panel/nav (F-01, F-02, F-15, F-30):** Solved by `useNavigation` (browser back, before-navigate guard, URL persistence). Functional update edge case in reducer.

## 14. Composition Diagram

```
App Shell (Azure/PWA)
  └── useNavigation<AppView>          ← NEW: view stack + history + deep links
        ├── useFilterNavigation        ← MODIFIED: externalHistory + historyDelegate
        ├── useEditorPanels            ← SIMPLIFIED: panels only (no views)
        ├── useEditorDataFlow          ← unchanged
        └── detectAnalysisPhase()      ← NEW: deterministic phase from signals
              ├── → ToolbarBase        ← NEW: shared component, phase emphasis
              ├── → NarrativeBar       ← MODIFIED: phase-conditioned prompts
              └── → Mobile menu        ← MODIFIED: phase-filtered items
```

## 15. Documentation Updates

Existing navigation docs need updating alongside the design spec:

| File                                                   | Updates                                                                                                                                                                           |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/06-design-system/patterns/navigation.md`         | Add: view navigation (`useNavigation`), phase-based toolbar emphasis, panel hierarchy + z-index strategy, mobile navigation patterns. Restructure to cover all navigation layers. |
| `docs/03-features/navigation/progressive-filtering.md` | Add: `historyDelegate` option, touch target sizes (48px primary, 44px minimum), remove Excel/Power BI from platform support (shelved).                                            |
| `docs/05-technical/architecture/component-map.md`      | Add `ToolbarBase`, `useNavigation` to component inventory.                                                                                                                        |
| `.claude/rules/monorepo.md`                            | Add `useNavigation` to hooks list.                                                                                                                                                |
| `CLAUDE.md`                                            | Add navigation task-to-documentation mapping.                                                                                                                                     |
| `docs/superpowers/specs/index.md`                      | Add this design spec entry.                                                                                                                                                       |

## 16. Implementation Sequence

| Step | What                                                     | Effort | New Files |
| ---- | -------------------------------------------------------- | ------ | --------- |
| 1    | Write design spec + spec review                          | S      | 1         |
| 2    | `detectAnalysisPhase()` + types + tests                  | S      | 2         |
| 3    | `useNavigation` hook + types + tests                     | M      | 3         |
| 4    | Wire `useNavigation` in Azure App.tsx                    | M      | —         |
| 5    | Simplify `useEditorPanels` (remove 3 view booleans)      | S      | —         |
| 6    | Wire `useNavigation` in PWA App.tsx                      | S      | —         |
| 7    | Add `historyDelegate` to `useFilterNavigation`           | S      | —         |
| 8    | `ToolbarBase` shared component                           | M      | 3         |
| 9    | Refactor EditorToolbar → ToolbarBase                     | M      | —         |
| 10   | Refactor AppHeader → ToolbarBase                         | S      | —         |
| 11   | Touch targets (6 components)                             | S      | —         |
| 12   | Focus traps (native dialog + focus-trap-react)           | M      | —         |
| 13   | Accessibility quick fixes (4 items)                      | S      | —         |
| 14   | NarrativeBar phase tone                                  | S      | —         |
| 15   | Teams fixes (contrast, FOUC, deep link)                  | M      | —         |
| 16   | Z-index strategy + mobile overlay fix                    | S      | —         |
| 17   | Update project docs (navigation.md, drill-down.md, etc.) | S      | —         |
| 18   | Update CLAUDE.md + monorepo.md + specs index             | S      | —         |

## 17. Verification

```bash
pnpm test                              # All unit tests
pnpm --filter @variscout/core test     # Phase detection
pnpm --filter @variscout/hooks test    # useNavigation, useFilterNavigation
pnpm --filter @variscout/azure-app test # Panel reducer, toolbar
pnpm --filter @variscout/ui test       # ToolbarBase, focus traps
```

Manual: browser back/forward, deep link URLs, phase transitions, mobile at 375px + 320px + 200% zoom, Teams mobile (no header), keyboard focus traps, high-contrast mode, reduced motion.
