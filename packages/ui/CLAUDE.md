# @variscout/ui

80+ shared UI component modules. Base primitives, wrapper bases, store-aware PI Panel tabs.

## Hard rules

- Never nest `<button>` inside `<button>` or `<a>` inside `<a>` — HTML spec violation. Use Fluent UI focusMode pattern (see docs/06-design-system/patterns/interactions.md).
- Functional components only. Props interfaces named `{ComponentName}Props`.
- Use semantic Tailwind classes (`bg-surface-secondary`, `text-content`, `border-edge`) that adapt to `data-theme`. No per-component color-scheme props.

## Color discipline (V1)

- **Surfaces**: Tailwind 50-300 only — never 700+ fills. **Text/strokes**: 400-700 paired with darker 600-800 for label contrast (`feedback_green_400_light_contrast`).
- No dark mode, no deep saturation. Canonical invariant: `.claude/INVARIANTS.md` §Visual design + `docs/01-vision/constitution.md` §V1 Wedge Principles.

## Invariants

- Naming: `*Base` = shared primitive in @variscout/ui (props-based, no app logic). `*WrapperBase` = app-level composition (combines hooks + Base + app UI). App wrappers in apps/*/ import `*WrapperBase`or`\*Base` and add ~50 lines of app-specific wiring.
- @variscout/ui MAY import from @variscout/stores for store-aware tab content components (`StatsTabContent`, `QuestionsTabContent`, `JournalTabContent`). This is a documented exception per ADR-056. Props-based components remain preferred for purely presentational UI.
- PI Panel tabs config via `PIPanelBase` (PITabConfig API). Store-aware tab content is the default.
- `TimelineWindowPicker` lives in the `DashboardLayoutBase` chrome (above the chart grid), not in `FilterContextBar`. Slot ownership: chrome above grid = window; FilterContextBar = per-chart filter summary.
- Error service (`errorService`) and hooks (`useIsMobile`, `useTheme`, `useGlossary`, `BREAKPOINTS`) are also exported from @variscout/ui.
- `Canvas` is the canonical canvas implementation for FRAME / Process Hub work. `LayeredProcessViewWithCapability` and `ProcessMapBase` are deprecated compatibility wrappers; new work targets `Canvas` or `CanvasWorkspace`. Lens × level matrix (8f spec §10) covers L1 outcome / L2 process / L3 author across the lens dimensions; followup work tracked on `canvas-viewport-8f-followups`.
- **Canvas viewport principle (8f)**: viewport state ≠ rendering mechanism. Pan/zoom + active level/lens are unified in `useCanvasViewportStore` (Annotation hub layer); each level renderer paints in its native medium (SVG / DOM / future canvas). Mirrors Figma / Maps / Notion. Don't fork pan/zoom state per renderer.
- **Evidence Map context menus** live here in `components/EvidenceMapContextMenu/` (`EdgeContextMenu`, `NodeContextMenu`). Pattern: fixed position, viewport-clamped, auto-focus first item, Escape + backdrop-click close. **Mutual exclusion**: only one overlay open at a time across node/edge context menus, edge detail cards, and `SweetSpotCard`. Each handler resets the other state variables to `null`.

## Per-characteristic specs (Phase B)

- `SpecEditor` is the single per-characteristic spec form: edits `usl`, `lsl`, `target`, `characteristicType`, and `cpkTarget` for one column. Consumers wire it via `measureSpecs[outcome]` + `setMeasureSpec(outcome, partial)` from `@variscout/stores`.
- `ProcessHealthBar` exposes inline Cpk-target quick-tweak via `onCpkTargetCommit` (formerly `onCpkTargetChange`); pair it with `columnLabel` so the chip "for [column]" makes scope visible.
- `SpecsPopover` was deleted. Do not reintroduce it — `SpecEditor` is the canonical form.
- `PerformanceSetupPanelBase` keeps a single Cpk-target input but emits `onEnable(columns, label, cpkTargetPerChannel)` where `cpkTargetPerChannel: Record<string, number>` maps every selected channel to that input value. Consumers fan out via `setMeasureSpec(column, { cpkTarget })` — no project-wide `setCpkTarget` from this surface.

## Test command

```bash
pnpm --filter @variscout/ui test
```

## Test fixtures

- **Use factories, not literals, for domain types in tests.** `const x: Finding = { ... }` literals drift silently against the type — vitest accepts them, but `pnpm --filter @variscout/ui build` (tsc) catches them. Use `createFinding()` from `@variscout/core` (existing factory); similar: `createHypothesis()`, `createQuestion()`. Add `createTestProjectMember()` / `createTestMeasurementPlan()` helpers in `packages/ui/src/test-utils/` if needed — don't write bare literals.
- **Caught by:** `pnpm --filter @variscout/ui build`. Per `feedback_ui_build_before_merge` — the build catches what vitest misses.
- **Test utilities** (`packages/ui/src/test-utils/`): `color.ts` exports `normalizeColor()` for cross-DOM-impl inline-color assertions (jsdom returns `rgb()`, happy-dom preserves `#hex`). Import in tests that read `element.style.color` / `backgroundColor`. Extend with new helpers here for ui-specific test concerns.

## Related

- ADR-045 Modular architecture
- ADR-056 PI Panel redesign
- ADR-061 HMW brainstorm ideation
