---
title: Navigation Audit — Findings & Action Items
audience: [developer, designer]
category: architecture
status: delivered
related: [navigation, mobile, teams, accessibility, onboarding]
date: 2026-03-17
---

# Navigation Audit — Findings & Action Items

## Executive Summary

**Total findings:** 30
**Teams mobile readiness:** 3/5 (functional but friction-heavy)

### Top 5 Actions

1. **Add focus traps to all modal/overlay components** — 5 components lack focus traps (DataTableModalBase, SettingsPanelBase, CoScoutPanelBase, MobileCategorySheet, FilterChipDropdown mobile sheet)
2. **Fix touch targets below 44px minimum** — FilterBreadcrumb chips (20×12px), overflow menu items (24×20px), carousel pills (24×36px), FilterChipDropdown close (26×26px)
3. **Close competing panels when entering Presentation/Report mode** — panelsStore allows Findings + CoScout to remain open under fullscreen overlays
4. **Implement Teams high-contrast theme** — `mapTeamsTheme()` collapses 'contrast' to 'light', losing accessibility benefit
5. **Add `focus-visible:opacity-100` to focused chart nav buttons** — currently hover-only, invisible to keyboard users

### Severity Distribution

| Severity   | Count | Description                                                      |
| ---------- | ----- | ---------------------------------------------------------------- |
| S1 Blocker | 3     | Panel stacking conflicts, z-index collision, contrast theme loss |
| S2 Major   | 14    | Touch targets, focus management, color-only indicators           |
| S3 Minor   | 10    | Polish, reduced motion gaps, onboarding friction                 |
| S4 Polish  | 3     | Silent failures, badge gaps, functional update edge case         |

---

## Findings by POV

### POV 1: Quality Professional (Domain User)

#### F-01: No Router — Browser Back Breaks View Navigation

- **Severity:** S2 | **Priority:** P2
- **Description:** Both apps use state-based navigation (`setCurrentView('dashboard')` / `setCurrentView('editor')`). Browser back button navigates away from the app entirely rather than returning to the previous view.
- **Files:** `apps/azure/src/App.tsx:90-98`, `apps/pwa/src/App.tsx`
- **Fix:** Add `history.pushState()` on view transitions and `popstate` listener to map back to view changes.

#### F-02: Before-Unload Not Called on In-App Navigation

- **Severity:** S2 | **Priority:** P2
- **Description:** `setBeforeUnloadHandler` in Editor only fires on browser-level navigation (tab close, refresh). Clicking "Back" to dashboard is a state change that bypasses the handler, risking unsaved analysis loss.
- **Files:** `apps/azure/src/pages/Editor.tsx:534-542`
- **Fix:** Call save handler explicitly in `navigateToDashboard()` before state transition.

---

### POV 2: Mobile UX

#### F-03: FilterBreadcrumb Touch Targets ~20×12px

- **Severity:** S2 | **Priority:** P1
- **Description:** Chip buttons use `px-2.5 py-1.5` (~20×12px padding area). Remove button uses `px-1.5 py-1.5` (~12×12px). Both far below 44×44px WCAG 2.5.5 AAA minimum.
- **Files:** `packages/ui/src/components/FilterBreadcrumb/FilterBreadcrumb.tsx:235-282`
- **Fix:** Add `min-h-[44px] min-w-[44px]` to both chip and remove buttons; increase padding to `px-3 py-2.5`.

#### F-04: MobileCategorySheet Highlight Buttons 36×36px

- **Severity:** S3 | **Priority:** P2
- **Description:** Color highlight and clear buttons set `minWidth: 36, minHeight: 36` inline — 82% of 44px minimum.
- **Files:** `packages/ui/src/components/MobileCategorySheet/MobileCategorySheet.tsx:236-281`
- **Fix:** Change to `minWidth: 44, minHeight: 44`.

#### F-05: MobileChartCarousel Pill Nav Buttons 36px Height

- **Severity:** S2 | **Priority:** P2
- **Description:** Chart type pills ("I-Chart", "Boxplot", "Pareto", "Stats") use `style={{ minHeight: 36 }}` — below 44px minimum.
- **Files:** `apps/azure/src/components/MobileChartCarousel.tsx:454-466`
- **Fix:** Change `minHeight: 36` to `minHeight: 44`.

#### F-06: EditorToolbar Overflow Menu Items ~20px Height

- **Severity:** S2 | **Priority:** P2
- **Description:** Overflow menu items use `py-2.5` (~20px total vertical padding). On phones, tapping adjacent items is error-prone.
- **Files:** `apps/azure/src/components/EditorToolbar.tsx:385-473`
- **Fix:** Add `style={{ minHeight: 44 }}` to each menu item button.

#### F-07: FilterChipDropdown Mobile Close Button ~26×26px

- **Severity:** S2 | **Priority:** P2
- **Description:** Close button in mobile bottom sheet uses `p-1` around 18px icon = ~26×26px total.
- **Files:** `packages/ui/src/components/FilterChipDropdown/FilterChipDropdown.tsx:234`
- **Fix:** Add `style={{ minWidth: 44, minHeight: 44 }}` and increase padding to `p-2`.

#### F-08: MobileChartCarousel — Confirmed to Exist

- **Severity:** — | **Priority:** —
- **Description:** PF-8 from preliminary findings resolved. Component exists at `apps/azure/src/components/MobileChartCarousel.tsx` (591 lines). Chevron nav buttons correctly set to 44×44px.
- **Status:** RESOLVED (not a finding)

---

### POV 3: Information Architecture

#### F-09: Panel Stacking — Presentation/Report Don't Close Findings/CoScout

- **Severity:** S1 | **Priority:** P1
- **Status:** RESOLVED
- **Description:** `panelsStore` correctly gates Presentation and Report as mutually exclusive, but does NOT close `isFindingsOpen` or `isCoScoutOpen`. On mobile, this creates z-40 + fullscreen conflicts. On desktop, resizable panels overlay presentation slides.
- **Files:** `apps/azure/src/features/panels/panelsStore.ts`
- **Fix:** Add compound close to OPEN_PRESENTATION and OPEN_REPORT actions:
  ```typescript
  case 'OPEN_PRESENTATION':
    return { ...state, isPresentationMode: true, isReportOpen: false, isFindingsOpen: false, isCoScoutOpen: false };
  ```
- **Implementation:** Compound closures added to `openPresentation` and `openReport` actions in `panelsStore`. Both actions now reset `isFindingsOpen` and `isCoScoutOpen` to `false` before entering fullscreen mode.

#### F-10: Mobile Findings Panel z-40 Under App Header z-50

- **Severity:** S1 | **Priority:** P1
- **Status:** RESOLVED
- **Description:** Mobile findings overlay uses `z-40` but sticky app header is `z-50`. Header overlaps top of findings panel, potentially intercepting touch events on close/navigation controls.
- **Files:** `apps/azure/src/pages/Editor.tsx:808`
- **Fix:** Raise mobile overlays to `z-50` or use `z-[60]` for fullscreen mobile panels that should cover the header.
- **Implementation:** Phone overlays (Findings, CoScout, IMPROVE workspace) raised to `z-[60]`, placing them above the app header (`z-50`) and eliminating touch interception conflicts.

#### F-11: Z-Index Hierarchy Undocumented

- **Severity:** S3 | **Priority:** P3
- **Description:** Z-index values scattered across components with no centralized strategy. Current mapping from codebase:
  - `z-[100]`: Skip-to-content (Azure + PWA)
  - `z-50`: App headers, dropdowns, popovers, DevTierSwitcher
  - `z-40`: Mobile fullscreen overlays (findings, CoScout), PWA mobile menu backdrop
  - No layer between 40 and 50 for stacking order conflicts
- **Files:** Multiple (see z-index grep results)
- **Fix:** Document z-index strategy in `.claude/rules/z-index.md` or `theme.css`.

#### F-12: PWA vs Azure Navigation Asymmetry

- **Severity:** S3 | **Priority:** P3
- **Description:** Azure has explicit back button (dashboard → editor → back). PWA has no "back to home" — users must complete or reset analysis. Logo click not wired to navigation.
- **Files:** `apps/pwa/src/App.tsx`, `apps/pwa/src/components/layout/AppHeader.tsx:100`
- **Fix:** Low priority — PWA is training-only; single-session model is intentional.

---

### POV 4: Teams Platform

#### F-13: Teams High-Contrast Theme Collapsed to Light

- **Severity:** S1 | **Priority:** P1
- **Description:** `mapTeamsTheme()` maps both 'default' and 'contrast' to 'light'. Teams users who need high-contrast accessibility mode are silently degraded.
- **Files:** `apps/azure/src/App.tsx:48-51`
- **Fix:** Add a third theme mode ('high-contrast') or at minimum map to 'light' with CSS custom property overrides for AAA contrast ratios.

#### F-14: Double Header on Teams Mobile (~24% Viewport)

- **Severity:** S2 | **Priority:** P1
- **Description:** Teams mobile frame adds its own header (~46px). Azure app header is `h-14` (56px) + EditorToolbar adds another bar. Combined with Teams chrome, ~160px consumed at top of a 667px viewport (24%).
- **Files:** `apps/azure/src/App.tsx:164` (app header), `apps/azure/src/components/EditorToolbar.tsx` (toolbar)
- **Fix:** Detect Teams mobile via `teamsContext.hostClientType === 'android' || 'ios'` and conditionally reduce/hide the app header, relying on EditorToolbar alone.

#### F-15: Deep Link Params Cleared Before Persistence

- **Severity:** S2 | **Priority:** P2
- **Description:** Deep link query params (`findingId`, `chart`) are consumed and immediately cleared via `history.replaceState`. If the browser crashes or refreshes before IndexedDB persistence completes, the deep link context is lost.
- **Files:** `apps/azure/src/pages/Editor.tsx:308-315`
- **Fix:** Defer URL cleanup until after view state is persisted.

#### F-16: TeamsThemeSync FOUC on Load

- **Severity:** S3 | **Priority:** P3
- **Description:** `TeamsThemeSync` component runs after `ThemeProvider` mounts. If Teams context is not yet initialized, ThemeProvider renders with default theme, then re-renders on sync — brief flash of wrong theme.
- **Files:** `apps/azure/src/App.tsx:149-152`
- **Fix:** Resolve Teams theme before mounting ThemeProvider, or add initial theme prop from Teams context.

#### F-17: Share Deep Link Registration Silent Failure

- **Severity:** S4 | **Priority:** P3
- **Description:** `pages.shareDeepLink()` call catches errors silently. If Teams SDK fails, the share link won't work but no diagnostic information is logged.
- **Files:** `apps/azure/src/hooks/useTeamsShare.ts:50-58`
- **Fix:** Add `console.warn` in catch block.

---

### POV 5: Accessibility

#### F-18: No Focus Traps in Modal/Overlay Components

- **Severity:** S2 | **Priority:** P1
- **Description:** No `FocusTrap`, `focus-trap-react`, or manual trap implementation exists in the codebase. Tab key can escape modals into background content. Affected components:
  - `DataTableModalBase` — full-screen modal
  - `SettingsPanelBase` — slide-over panel
  - `CoScoutPanelBase` — side panel
  - `MobileCategorySheet` — bottom sheet
  - `FilterChipDropdown` — mobile bottom sheet mode
- **WCAG:** 2.4.3 Focus Order (Level A)
- **Files:** See individual component paths in `packages/ui/src/components/`
- **Fix:** Add `focus-trap-react` dependency and wrap modal content. Add `aria-modal="true"` and `role="dialog"`.

#### F-19: No Focus Return on Panel Close

- **Severity:** S2 | **Priority:** P1
- **Description:** When panels close, focus is not returned to the trigger button. CoScoutPanelBase moves focus to textarea on open (good) but doesn't track the trigger element for return.
- **WCAG:** 2.4.3 Focus Order (Level A)
- **Files:** `packages/ui/src/components/CoScoutPanel/CoScoutPanelBase.tsx:137-141`, `packages/ui/src/components/DataTable/DataTableModalBase.tsx:48-56`, `packages/ui/src/components/SettingsPanel/SettingsPanelBase.tsx:58-66`
- **Fix:** Accept `triggerRef` prop; restore focus to it on close.

#### F-20: Focused Chart Nav Buttons Invisible to Keyboard

- **Severity:** S2 | **Priority:** P1
- **Description:** Prev/Next buttons in `FocusedViewOverlay` use `opacity-0 group-hover/focus:opacity-100`. The `/focus` is a Tailwind group name, not a focus pseudo-class. Buttons are only visible on mouse hover — keyboard-only users cannot see them (though they can still use arrow keys via `useFocusedChartNav`).
- **WCAG:** 2.4.7 Focus Visible (Level AA)
- **Files:** `packages/ui/src/components/DashboardBase/FocusedViewOverlay.tsx:20-28`
- **Fix:** Add `focus-visible:opacity-100` to the button classes.

#### F-21: Color-Only Indicators in Findings

- **Severity:** S2 | **Priority:** P2
- **Description:** Hypothesis validation status uses color-coded dots (`text-green-400` = supported, `text-red-400` = contradicted, `text-amber-400` = partial) without text labels. Cpk status uses `text-red-400`/`text-green-400` without "Below Target"/"Above Target" text.
- **WCAG:** 1.4.1 Use of Color (Level A)
- **Files:** `packages/ui/src/components/FindingsLog/FindingCard.tsx:139-141, 657`
- **Fix:** Add text labels or icon differentiation alongside color.

#### F-22: Color-Only in Chart Pass/Fail Regions

- **Severity:** S2 | **Priority:** P2
- **Description:** Chart fill regions (pass = green, fail = red, warning = amber) rely on color alone. No pattern, hatching, or label overlay for colorblind users.
- **WCAG:** 1.4.1 Use of Color (Level A)
- **Files:** `packages/charts/src/IChart.tsx`, `packages/charts/src/Boxplot.tsx`, `packages/charts/src/ParetoChart.tsx`
- **Fix:** Medium effort — add optional pattern fills or labeled regions. Consider colorblind-safe palette alternative.

#### F-23: DataTableModalBase Close Button Missing aria-label

- **Severity:** S3 | **Priority:** P2
- **Description:** Close button renders only an `<X>` icon with no `aria-label`, making it invisible to screen readers.
- **Files:** `packages/ui/src/components/DataTable/DataTableModalBase.tsx:186`
- **Fix:** Add `aria-label="Close data table"`.

#### F-24: Smooth Scroll Not Gated by prefers-reduced-motion

- **Severity:** S3 | **Priority:** P2
- **Description:** `components.css` sets `scroll-behavior: smooth` globally on `.overflow-y-auto` but doesn't disable it for reduced motion preference. The `@media (prefers-reduced-motion: reduce)` block covers animations but not scroll behavior.
- **WCAG:** 2.3.3 Animation from Interactions (Level AAA)
- **Files:** `packages/ui/src/styles/components.css:27, 119-126`
- **Fix:** Add `scroll-behavior: auto` inside the reduced-motion media query.

#### F-25: Skip-to-Content Links — Present in Both Apps

- **Severity:** — | **Priority:** —
- **Description:** Both apps correctly implement skip-to-content links with `sr-only focus:not-sr-only` pattern at z-[100].
- **Files:** `apps/pwa/src/App.tsx:393-395`, `apps/azure/src/App.tsx:157-159`
- **Status:** COMPLIANT (not a finding)

#### F-26: MobileMenu Lacks Focus Trap

- **Severity:** S3 | **Priority:** P3
- **Description:** PWA MobileMenu renders as a positioned dropdown (z-50) with backdrop (z-40) but no focus trap. Tab can escape to background.
- **Files:** `apps/pwa/src/components/layout/MobileMenu.tsx:109-114`
- **Fix:** Add focus trap and `aria-modal="true"`.

---

### POV 6: New User Onboarding

#### F-27: AIOnboardingTooltip Missing ARIA Attributes

- **Severity:** S3 | **Priority:** P2
- **Description:** Tooltip container lacks `role="status"` or `aria-live="polite"`. Screen readers won't announce the tooltip when it appears after 500ms delay.
- **WCAG:** 4.1.3 Status Messages (Level AAA)
- **Files:** `packages/ui/src/components/AIOnboardingTooltip/AIOnboardingTooltip.tsx:94-114`
- **Fix:** Add `role="status" aria-live="polite"` to tooltip container.

#### F-28: AIOnboardingTooltip May Overflow Small Viewports

- **Severity:** S3 | **Priority:** P3
- **Description:** Tooltip positions with fixed coordinates relative to anchor element. No viewport boundary check — may render off-screen on 375px phones.
- **Files:** `packages/ui/src/components/AIOnboardingTooltip/AIOnboardingTooltip.tsx:48-66`
- **Fix:** Add viewport boundary detection or use a positioning library.

#### F-29: Azure Post-Auth — No Guided Onboarding

- **Severity:** S3 | **Priority:** P3
- **Description:** After sign-in, Azure users land on project dashboard with no explanation of workflow or feature orientation. First-time users must discover the data input → analysis → investigation flow independently.
- **Files:** `apps/azure/src/App.tsx:148+`
- **Fix:** Consider a one-time "Getting Started" overlay or guided tour for first-time users.

#### F-30: usePanelsStore Functional Update Edge Case

- **Severity:** S4 | **Priority:** P3
- **Description:** `setIsDataTableOpen` and similar setters handle `typeof value === 'function'` by always dispatching OPEN, not evaluating the function with current state. If future code calls `setIsDataTableOpen(prev => !prev)`, it will always open.
- **Files:** `apps/azure/src/features/panels/panelsStore.ts`
- **Fix:** Capture current state in callback for proper toggle support.

---

## Cross-Cutting Themes

### 1. Touch Target Consistency

Multiple components set touch targets between 20px and 36px. The codebase has no shared constant or utility for enforcing 44px minimums. Several newer components (MobileCategorySheet drill-down, carousel chevrons) correctly use 44px+, suggesting awareness grew over time but wasn't backported.

### 2. Focus Management Gap

Focus traps and focus return are absent across the board. The codebase handles `Escape` key consistently but doesn't manage focus lifecycle (enter trap → initial focus → trap tab → return focus on close). This is the single largest accessibility gap.

### 3. Panel Competition

The panel state machine (`useEditorPanels`) handles some mutual exclusions (Presentation ↔ Report) but not all combinations. No z-index strategy document exists, making it easy to introduce layer conflicts as new overlays are added.

### 4. Teams Mobile Viewport

Teams mobile consumes ~46px for its own chrome. Combined with the app header (56px) and toolbar (~44px), ~146px is consumed before content begins on a 667px screen. Charts in the carousel get ~400px vertical space — functional but tight.

---

## Prioritized Action Items

| ID   | Title                                               | Sev | Pri | Effort | POVs | Findings   |
| ---- | --------------------------------------------------- | --- | --- | ------ | ---- | ---------- |
| A-01 | Add focus-trap-react to modal/overlay components    | S2  | P1  | M      | 5,2  | F-18, F-26 |
| A-02 | Fix FilterBreadcrumb touch targets to 44px          | S2  | P1  | S      | 2,1  | F-03       |
| A-03 | Close Findings/CoScout on Presentation/Report open  | S1  | P1  | S      | 3    | F-09       |
| A-04 | Fix mobile overlay z-index (z-40 → z-[60])          | S1  | P1  | S      | 3,2  | F-10       |
| A-05 | Implement Teams high-contrast theme mapping         | S1  | P1  | M      | 4,5  | F-13       |
| A-06 | Add focus-visible:opacity-100 to chart nav buttons  | S2  | P1  | S      | 5    | F-20       |
| A-07 | Implement focus return on panel close               | S2  | P1  | M      | 5    | F-19       |
| A-08 | Fix overflow menu item touch targets (44px min)     | S2  | P2  | S      | 2    | F-06       |
| A-09 | Fix carousel pill button height (36→44px)           | S2  | P2  | S      | 2    | F-05       |
| A-10 | Fix FilterChipDropdown close button (26→44px)       | S2  | P2  | S      | 2    | F-07       |
| A-11 | Add text labels to color-only status indicators     | S2  | P2  | M      | 5    | F-21       |
| A-12 | Fix MobileCategorySheet highlight buttons (36→44px) | S3  | P2  | S      | 2    | F-04       |
| A-13 | Add aria-label to DataTableModalBase close button   | S3  | P2  | S      | 5    | F-23       |
| A-14 | Gate smooth scroll by prefers-reduced-motion        | S3  | P2  | S      | 5    | F-24       |
| A-15 | Add ARIA to AIOnboardingTooltip                     | S3  | P2  | S      | 5,6  | F-27       |
| A-16 | Detect Teams mobile and reduce header height        | S2  | P1  | M      | 4,2  | F-14       |
| A-17 | Add history.pushState for view transitions          | S2  | P2  | M      | 1    | F-01       |
| A-18 | Call save handler on in-app back navigation         | S2  | P2  | S      | 1    | F-02       |
| A-19 | Defer deep link URL cleanup until after persistence | S2  | P2  | S      | 4    | F-15       |
| A-20 | Add colorblind-safe patterns to chart regions       | S2  | P2  | L      | 5    | F-22       |
| A-21 | Document z-index hierarchy                          | S3  | P3  | S      | 3    | F-11       |
| A-22 | Fix TeamsThemeSync FOUC                             | S3  | P3  | S      | 4    | F-16       |
| A-23 | Add debug logging to Teams share deep link          | S4  | P3  | S      | 4    | F-17       |
| A-24 | Fix useEditorPanels functional update handling      | S4  | P3  | S      | 3    | F-30       |
| A-25 | Add viewport boundary check to AIOnboardingTooltip  | S3  | P3  | S      | 6    | F-28       |
| A-26 | Consider Azure post-auth onboarding tour            | S3  | P3  | L      | 6    | F-29       |

**Effort key:** S = Small (< 1hr), M = Medium (1-4hr), L = Large (4hr+)

---

## Verification Notes

- **Touch targets** measured via Tailwind class → px conversion (1 unit = 4px)
- **Panel stacking** verified from `useEditorPanels.ts` reducer logic
- **Z-index values** confirmed via ripgrep across all app files
- **Skip-to-content** confirmed present in both `apps/pwa/src/App.tsx:393` and `apps/azure/src/App.tsx:157`
- **MobileChartCarousel** confirmed at `apps/azure/src/components/MobileChartCarousel.tsx` (591 lines)
- **Focus trap search** confirmed zero results for FocusTrap/focus-trap/trapFocus/focusLock across entire codebase
- **Teams contrast theme** verified in `mapTeamsTheme()` at `apps/azure/src/App.tsx:48-51`
