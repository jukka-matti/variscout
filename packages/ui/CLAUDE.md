# @variscout/ui

80+ shared UI component modules. Base primitives, wrapper bases, store-aware PI Panel tabs.

## Hard rules

- Never nest `<button>` inside `<button>` or `<a>` inside `<a>` — HTML spec violation. Use Fluent UI focusMode pattern (see docs/06-design-system/patterns/interactions.md).
- Functional components only. Props interfaces named `{ComponentName}Props`.
- Use semantic Tailwind classes (`bg-surface-secondary`, `text-content`, `border-edge`) that adapt to `data-theme`. No per-component color-scheme props.

## Invariants

- Naming: `*Base` = shared primitive in @variscout/ui (props-based, no app logic). `*WrapperBase` = app-level composition (combines hooks + Base + app UI). App wrappers in apps/*/ import `*WrapperBase`or`\*Base` and add ~50 lines of app-specific wiring.
- @variscout/ui MAY import from @variscout/stores for store-aware tab content components (`StatsTabContent`, `QuestionsTabContent`, `JournalTabContent`). This is a documented exception per ADR-056. Props-based components remain preferred for purely presentational UI.
- PI Panel tabs config via `PIPanelBase` (PITabConfig API). Store-aware tab content is the default.
- `TimelineWindowPicker` lives in the `DashboardLayoutBase` chrome (above the chart grid), not in `FilterContextBar`. Slot ownership: chrome above grid = window; FilterContextBar = per-chart filter summary.
- Error service (`errorService`) and hooks (`useIsMobile`, `useTheme`, `useGlossary`, `BREAKPOINTS`) are also exported from @variscout/ui.
- `Canvas` is the canonical canvas surface for FRAME / Process Hub migration work. In PR1 it is a thin facade over `LayeredProcessViewWithCapability`; `LayeredProcessView`, `LayeredProcessViewWithCapability`, and `ProcessMapBase` remain public legacy internals until later canvas migration phases absorb them.

## Per-characteristic specs (Phase B)

- `SpecEditor` is the single per-characteristic spec form: edits `usl`, `lsl`, `target`, `characteristicType`, and `cpkTarget` for one column. Consumers wire it via `measureSpecs[outcome]` + `setMeasureSpec(outcome, partial)` from `@variscout/stores`.
- `ProcessHealthBar` exposes inline Cpk-target quick-tweak via `onCpkTargetCommit` (formerly `onCpkTargetChange`); pair it with `columnLabel` so the chip "for [column]" makes scope visible.
- `SpecsPopover` was deleted. Do not reintroduce it — `SpecEditor` is the canonical form.
- `PerformanceSetupPanelBase` keeps a single Cpk-target input but emits `onEnable(columns, label, cpkTargetPerChannel)` where `cpkTargetPerChannel: Record<string, number>` maps every selected channel to that input value. Consumers fan out via `setMeasureSpec(column, { cpkTarget })` — no project-wide `setCpkTarget` from this surface.

## Test command

```bash
pnpm --filter @variscout/ui test
```

## Skills to consult

- `editing-evidence-map` — for EvidenceMap components
- `editing-investigation-workflow` — for FindingsWindow, HubComposer, investigation UI
- `writing-tests` — RTL patterns, data-testid conventions

## Related

- ADR-045 Modular architecture
- ADR-056 PI Panel redesign
- ADR-061 HMW brainstorm ideation
