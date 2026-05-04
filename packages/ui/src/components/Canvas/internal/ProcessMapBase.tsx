/**
 * ProcessMapBase — the interactive river-styled SIPOC Process Map rendered
 * inside the Canvas surface.
 *
 * See ADR-070 and the design spec `docs/superpowers/specs/2026-04-18-frame-
 * process-map-design.md`. Composes three regions on one canvas:
 *
 *   - a left→right spine of process steps (SIPOC temporal axis),
 *   - tributaries (little xs / factors) feeding each step from both banks,
 *   - an ocean at the right with the CTS (customer-felt outcome) + specs.
 *
 * V1 interactions are deliberately structured (buttons, dropdowns, inline
 * inputs) — not a freeform drag-and-drop canvas. That comes in V2+.
 *
 * Props-based. No store coupling. Parent Canvas owns the map state and
 * passes `onChange` callbacks + detected gaps.
 */

import React from 'react';
import type { Gap, ProcessMap, ProcessMapTributary, ProcessMapHunch } from '@variscout/core/frame';
import type { SpecLimits } from '@variscout/core';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface ProcessMapBaseProps {
  /** The current map. Parent owns state; pass a new object on every edit. */
  map: ProcessMap;
  /** Column names available from the uploaded dataset. */
  availableColumns: string[];
  /** Called with the next map whenever the user edits. */
  onChange: (next: ProcessMap) => void;
  /** Gaps detected by `detectGaps()` in the parent — rendered inline. */
  gaps?: Gap[];
  /** Disable all edits (read-only mode, e.g. Analysis sidebar thumbnail). */
  disabled?: boolean;
  /** Optional target value for the CTS (current UI: delegated to parent form). */
  target?: number;
  /** Optional USL. */
  usl?: number;
  /** Optional LSL. */
  lsl?: number;
  /** Optional per-characteristic Cpk target ("capability bar" for the CTS column). */
  cpkTarget?: number;
  /** Called when target/usl/lsl/cpkTarget change. Single shape; callers refactor. */
  onSpecsChange?: (next: {
    target?: number;
    usl?: number;
    lsl?: number;
    cpkTarget?: number;
  }) => void;
  /**
   * Per-CTQ-column specs lookup. Each StepCard reads `stepSpecs[step.ctqColumn]`
   * to render its own USL / LSL / target / cpkTarget editor. Mirrors the Ocean
   * pattern (V1 Phase D) — AIAG control plans assume each step's CTQ has its
   * own quality requirement.
   */
  stepSpecs?: Record<string, SpecLimits>;
  /**
   * Called when a StepCard's specs change. `column` is the CTQ column for that
   * step. The full `SpecLimits` shape is passed so consumers can `setMeasureSpec(column, next)`.
   */
  onStepSpecsChange?: (column: string, next: SpecLimits) => void;
  /**
   * Whether to render the GapStrip warning bar. Defaults to `true` for backward
   * compatibility with b1+ (process-map authoring) flows. The b0 FrameView passes
   * `false` because the lightweight investigator entry uses inline `+ add spec`
   * affordances and a soft Capability-tab prompt instead of upfront warnings.
   */
  showGaps?: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const uid = (prefix: string): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const bumpUpdated = (map: ProcessMap): ProcessMap => ({
  ...map,
  updatedAt: new Date().toISOString(),
});

/** Gaps scoped to a given step, for inline rendering next to the step card. */
const gapsForStep = (gaps: Gap[] | undefined, stepId: string): Gap[] =>
  (gaps ?? []).filter(g => g.stepId === stepId);

/** Gaps that apply to the whole map (no stepId) — rendered in the GapStrip. */
const globalGaps = (gaps: Gap[] | undefined): Gap[] => (gaps ?? []).filter(g => !g.stepId);

// ────────────────────────────────────────────────────────────────────────────
// Sub-components (co-located; not exported from the package)
// ────────────────────────────────────────────────────────────────────────────

/**
 * SpecsGrid — shared 2x2 input grid for editing USL / LSL / target / cpkTarget.
 *
 * Used by both `OceanCard` (CTS column) and `StepCard` (per-step CTQ column).
 * The grid is fully controlled: it renders the four numeric inputs and emits
 * the full `SpecLimits` shape on each change so callers can route to either
 * the project-wide `setSpecs` or the per-column `setMeasureSpec(column, …)`.
 *
 * `idPrefix` and `ariaPrefix` parameterise the data-testid + aria-label values
 * so the same grid renders distinct accessibility names per surface.
 */
interface SpecsGridProps {
  target?: number;
  usl?: number;
  lsl?: number;
  cpkTarget?: number;
  disabled?: boolean;
  idPrefix: string;
  ariaPrefix: string;
  onChange: (next: SpecLimits) => void;
}

const toNum = (s: string): number | undefined => {
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const SpecsGrid: React.FC<SpecsGridProps> = ({
  target,
  usl,
  lsl,
  cpkTarget,
  disabled,
  idPrefix,
  ariaPrefix,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-2 gap-1">
      <label className="text-xs text-content-secondary">
        LSL
        <input
          type="number"
          value={lsl ?? ''}
          onChange={e => onChange({ target, usl, lsl: toNum(e.target.value), cpkTarget })}
          disabled={disabled}
          aria-label={
            ariaPrefix ? `${ariaPrefix} lower specification limit` : 'Lower specification limit'
          }
          className="mt-1 w-full text-xs bg-surface-primary border border-edge rounded px-1 py-0.5 disabled:opacity-60"
          data-testid={`${idPrefix}-lsl`}
        />
      </label>
      <label className="text-xs text-content-secondary">
        Target
        <input
          type="number"
          value={target ?? ''}
          onChange={e => onChange({ target: toNum(e.target.value), usl, lsl, cpkTarget })}
          disabled={disabled}
          aria-label={ariaPrefix ? `${ariaPrefix} target value` : 'Target value'}
          className="mt-1 w-full text-xs bg-surface-primary border border-edge rounded px-1 py-0.5 disabled:opacity-60"
          data-testid={`${idPrefix}-target`}
        />
      </label>
      <label className="text-xs text-content-secondary">
        USL
        <input
          type="number"
          value={usl ?? ''}
          onChange={e => onChange({ target, usl: toNum(e.target.value), lsl, cpkTarget })}
          disabled={disabled}
          aria-label={
            ariaPrefix ? `${ariaPrefix} upper specification limit` : 'Upper specification limit'
          }
          className="mt-1 w-full text-xs bg-surface-primary border border-edge rounded px-1 py-0.5 disabled:opacity-60"
          data-testid={`${idPrefix}-usl`}
        />
      </label>
      <label className="text-xs text-content-secondary">
        Cpk target
        <input
          type="number"
          step="0.01"
          value={cpkTarget ?? ''}
          onChange={e => onChange({ target, usl, lsl, cpkTarget: toNum(e.target.value) })}
          disabled={disabled}
          aria-label={
            ariaPrefix ? `${ariaPrefix} capability target (Cpk)` : 'Capability target (Cpk)'
          }
          className="mt-1 w-full text-xs bg-surface-primary border border-edge rounded px-1 py-0.5 disabled:opacity-60"
          data-testid={`${idPrefix}-cpk-target`}
        />
      </label>
    </div>
  );
};

interface StepCardProps {
  step: ProcessMap['nodes'][number];
  tributaries: ProcessMapTributary[];
  subgroupAxes: string[];
  availableColumns: string[];
  gaps: Gap[];
  disabled?: boolean;
  /** Per-step CTQ specs (USL/LSL/target/cpkTarget). Only rendered when ctqColumn is set. */
  ctqSpecs?: SpecLimits;
  onRename: (name: string) => void;
  onCtqChange: (column: string | undefined) => void;
  onRemove: () => void;
  onAddTributary: (column: string) => void;
  onRemoveTributary: (tributaryId: string) => void;
  onToggleSubgroupAxis: (tributaryId: string) => void;
  /** Called with the full new SpecLimits shape when any per-step spec input changes. */
  onCtqSpecsChange?: (next: SpecLimits) => void;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  tributaries,
  subgroupAxes,
  availableColumns,
  gaps,
  disabled,
  ctqSpecs,
  onRename,
  onCtqChange,
  onRemove,
  onAddTributary,
  onRemoveTributary,
  onToggleSubgroupAxis,
  onCtqSpecsChange,
}) => {
  const [newTribCol, setNewTribCol] = React.useState('');
  const availableForTrib = availableColumns.filter(
    c => !tributaries.some(t => t.column === c) && c !== step.ctqColumn
  );

  return (
    <div
      className="flex flex-col gap-2 min-w-[180px] p-3 bg-surface-primary border border-edge rounded-lg"
      data-testid={`process-map-step-${step.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          value={step.name}
          onChange={e => onRename(e.target.value)}
          disabled={disabled}
          placeholder="Step name"
          aria-label={`Step ${step.order + 1} name`}
          className="flex-1 text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-edge-strong rounded px-1 disabled:text-content-secondary"
          data-testid={`process-map-step-name-${step.id}`}
        />
        {!disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="text-content-secondary hover:text-content text-xs"
            aria-label={`Remove step ${step.name || 'unnamed'}`}
          >
            ×
          </button>
        )}
      </div>

      <label className="text-xs text-content-secondary">
        CTQ
        <select
          value={step.ctqColumn ?? ''}
          onChange={e => onCtqChange(e.target.value || undefined)}
          disabled={disabled}
          aria-label={`CTQ column for ${step.name || 'step'}`}
          className="mt-1 w-full text-xs bg-surface-secondary border border-edge rounded px-1 py-0.5 disabled:opacity-60"
          data-testid={`process-map-step-ctq-${step.id}`}
        >
          <option value="">— none —</option>
          {availableColumns.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {step.ctqColumn !== undefined && onCtqSpecsChange && (
        <SpecsGrid
          target={ctqSpecs?.target}
          usl={ctqSpecs?.usl}
          lsl={ctqSpecs?.lsl}
          cpkTarget={ctqSpecs?.cpkTarget}
          disabled={disabled}
          idPrefix={`process-map-step-specs-${step.id}`}
          ariaPrefix={`Step ${step.name || 'unnamed'} CTQ`}
          onChange={next =>
            onCtqSpecsChange({ ...next, characteristicType: ctqSpecs?.characteristicType })
          }
        />
      )}

      {tributaries.length > 0 && (
        <ul className="flex flex-col gap-1">
          {tributaries.map(t => {
            const isAxis = subgroupAxes.includes(t.id);
            return (
              <li
                key={t.id}
                className="flex items-center gap-1 text-xs"
                data-testid={`process-map-tributary-${t.id}`}
              >
                <label className="flex items-center gap-1 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAxis}
                    onChange={() => onToggleSubgroupAxis(t.id)}
                    disabled={disabled}
                    aria-label={`Use ${t.label || t.column} as subgroup axis`}
                  />
                  <span className={isAxis ? 'text-content font-medium' : 'text-content-secondary'}>
                    {t.label || t.column}
                  </span>
                </label>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemoveTributary(t.id)}
                    className="text-content-secondary hover:text-content"
                    aria-label={`Remove tributary ${t.label || t.column}`}
                  >
                    ×
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!disabled && availableForTrib.length > 0 && (
        <div className="flex items-center gap-1">
          <select
            value={newTribCol}
            onChange={e => setNewTribCol(e.target.value)}
            aria-label={`Add tributary to ${step.name || 'step'}`}
            className="flex-1 text-xs bg-surface-secondary border border-edge rounded px-1 py-0.5"
            data-testid={`process-map-step-add-tributary-select-${step.id}`}
          >
            <option value="">+ add tributary…</option>
            {availableForTrib.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!newTribCol}
            onClick={() => {
              onAddTributary(newTribCol);
              setNewTribCol('');
            }}
            className="text-xs px-2 py-0.5 bg-surface-secondary hover:bg-surface-tertiary border border-edge rounded disabled:opacity-40"
            aria-label={`Confirm add tributary to ${step.name || 'step'}`}
          >
            add
          </button>
        </div>
      )}

      {gaps.length > 0 && (
        <ul className="flex flex-col gap-0.5" data-testid={`process-map-step-gaps-${step.id}`}>
          {gaps.map((g, i) => (
            <li key={`${g.kind}-${i}`} className="text-[11px] text-amber-700">
              ⚠ {g.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface OceanCardProps {
  ctsColumn?: string;
  availableColumns: string[];
  target?: number;
  usl?: number;
  lsl?: number;
  cpkTarget?: number;
  disabled?: boolean;
  onCtsChange: (column: string | undefined) => void;
  onSpecsChange?: (next: {
    target?: number;
    usl?: number;
    lsl?: number;
    cpkTarget?: number;
  }) => void;
}

const OceanCard: React.FC<OceanCardProps> = ({
  ctsColumn,
  availableColumns,
  target,
  usl,
  lsl,
  cpkTarget,
  disabled,
  onCtsChange,
  onSpecsChange,
}) => {
  return (
    <div
      className="flex flex-col gap-2 min-w-[200px] p-3 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-700 rounded-2xl"
      data-testid="process-map-ocean"
    >
      <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
        Customer outcome (CTS)
      </div>
      <label className="text-xs text-content-secondary">
        Measure
        <select
          value={ctsColumn ?? ''}
          onChange={e => onCtsChange(e.target.value || undefined)}
          disabled={disabled}
          aria-label="Customer-felt outcome column (CTS)"
          className="mt-1 w-full text-xs bg-surface-primary border border-edge rounded px-1 py-0.5 disabled:opacity-60"
          data-testid="process-map-ocean-cts"
        >
          <option value="">— pick a column —</option>
          {availableColumns.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      {onSpecsChange && (
        <SpecsGrid
          target={target}
          usl={usl}
          lsl={lsl}
          cpkTarget={cpkTarget}
          disabled={disabled}
          idPrefix="process-map-ocean"
          ariaPrefix=""
          onChange={next =>
            onSpecsChange({
              target: next.target,
              usl: next.usl,
              lsl: next.lsl,
              cpkTarget: next.cpkTarget,
            })
          }
        />
      )}
    </div>
  );
};

interface HunchListProps {
  hunches: ProcessMapHunch[];
  steps: ProcessMap['nodes'];
  tributaries: ProcessMapTributary[];
  disabled?: boolean;
  onAdd: (text: string, pin: { stepId?: string; tributaryId?: string }) => void;
  onRemove: (id: string) => void;
}

const HunchList: React.FC<HunchListProps> = ({
  hunches,
  steps,
  tributaries,
  disabled,
  onAdd,
  onRemove,
}) => {
  const [text, setText] = React.useState('');
  const [pinKey, setPinKey] = React.useState('');

  const pinOptions = [
    ...steps.map(s => ({ key: `step:${s.id}`, label: `step · ${s.name || '(unnamed)'}` })),
    ...tributaries.map(t => ({ key: `trib:${t.id}`, label: `x · ${t.label || t.column}` })),
  ];

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    const [kind, id] = pinKey.split(':');
    onAdd(t, kind === 'step' ? { stepId: id } : kind === 'trib' ? { tributaryId: id } : {});
    setText('');
    setPinKey('');
  };

  const labelForHunch = (h: ProcessMapHunch): string | undefined => {
    if (h.stepId) return steps.find(s => s.id === h.stepId)?.name;
    if (h.tributaryId) {
      const t = tributaries.find(x => x.id === h.tributaryId);
      return t?.label || t?.column;
    }
    return undefined;
  };

  return (
    <section className="flex flex-col gap-2" data-testid="process-map-hunches">
      <h4 className="text-sm font-medium">Hunches</h4>
      {hunches.length > 0 && (
        <ul className="flex flex-col gap-1">
          {hunches.map(h => {
            const pin = labelForHunch(h);
            return (
              <li
                key={h.id}
                className="flex items-center gap-2 text-xs p-1 bg-surface-secondary rounded"
                data-testid={`process-map-hunch-${h.id}`}
              >
                <span className="flex-1 text-content">⚑ {h.text}</span>
                {pin && <span className="text-content-secondary">pinned · {pin}</span>}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemove(h.id)}
                    className="text-content-secondary hover:text-content"
                    aria-label={`Remove hunch ${h.text}`}
                  >
                    ×
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!disabled && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') submit();
            }}
            placeholder="What do you think is causing the variation?"
            aria-label="Hunch text"
            className="flex-1 text-xs bg-surface-primary border border-edge rounded px-2 py-1"
            data-testid="process-map-hunch-text"
          />
          <select
            value={pinKey}
            onChange={e => setPinKey(e.target.value)}
            aria-label="Pin hunch to"
            className="text-xs bg-surface-primary border border-edge rounded px-1 py-1"
            data-testid="process-map-hunch-pin"
          >
            <option value="">(no pin)</option>
            {pinOptions.map(o => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!text.trim()}
            onClick={submit}
            className="text-xs px-2 py-1 bg-surface-secondary hover:bg-surface-tertiary border border-edge rounded disabled:opacity-40"
            data-testid="process-map-hunch-add"
          >
            + hunch
          </button>
        </div>
      )}
    </section>
  );
};

interface GapStripProps {
  gaps: Gap[];
}

const GapStrip: React.FC<GapStripProps> = ({ gaps }) => {
  if (gaps.length === 0) return null;
  const required = gaps.filter(g => g.severity === 'required');
  const recommended = gaps.filter(g => g.severity === 'recommended');
  return (
    <section
      className="flex flex-col gap-1 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg"
      data-testid="process-map-gap-strip"
    >
      <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">
        Missing from your map ({gaps.length})
      </h4>
      {required.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {required.map((g, i) => (
            <li
              key={`req-${g.kind}-${i}`}
              className="text-xs text-red-700 dark:text-red-400"
              data-testid={`process-map-gap-required-${g.kind}`}
            >
              ● required · {g.message}
            </li>
          ))}
        </ul>
      )}
      {recommended.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {recommended.map((g, i) => (
            <li
              key={`rec-${g.kind}-${i}`}
              className="text-xs text-amber-700 dark:text-amber-300"
              data-testid={`process-map-gap-recommended-${g.kind}`}
            >
              ○ recommended · {g.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────

export const ProcessMapBase: React.FC<ProcessMapBaseProps> = ({
  map,
  availableColumns,
  onChange,
  gaps,
  disabled,
  target,
  usl,
  lsl,
  cpkTarget,
  onSpecsChange,
  stepSpecs,
  onStepSpecsChange,
  showGaps = true,
}) => {
  const sortedSteps = React.useMemo(
    () => [...map.nodes].sort((a, b) => a.order - b.order),
    [map.nodes]
  );

  const update = (next: ProcessMap) => onChange(bumpUpdated(next));

  const addStep = () => {
    const newOrder = sortedSteps.length;
    update({
      ...map,
      nodes: [...map.nodes, { id: uid('step'), name: '', order: newOrder }],
    });
  };

  const renameStep = (stepId: string, name: string) => {
    update({
      ...map,
      nodes: map.nodes.map(n => (n.id === stepId ? { ...n, name } : n)),
    });
  };

  const setStepCtq = (stepId: string, ctqColumn: string | undefined) => {
    update({
      ...map,
      nodes: map.nodes.map(n => (n.id === stepId ? { ...n, ctqColumn } : n)),
    });
  };

  const removeStep = (stepId: string) => {
    const remaining = map.nodes.filter(n => n.id !== stepId);
    // Re-pack `order` so it stays 0..N-1 monotonic.
    const reordered = [...remaining]
      .sort((a, b) => a.order - b.order)
      .map((n, i) => ({ ...n, order: i }));
    update({
      ...map,
      nodes: reordered,
      tributaries: map.tributaries.filter(t => t.stepId !== stepId),
      hunches: (map.hunches ?? []).filter(h => h.stepId !== stepId),
    });
  };

  const addTributary = (stepId: string, column: string) => {
    const newT: ProcessMapTributary = { id: uid('trib'), stepId, column };
    update({ ...map, tributaries: [...map.tributaries, newT] });
  };

  const removeTributary = (tributaryId: string) => {
    update({
      ...map,
      tributaries: map.tributaries.filter(t => t.id !== tributaryId),
      subgroupAxes: (map.subgroupAxes ?? []).filter(id => id !== tributaryId),
      hunches: (map.hunches ?? []).filter(h => h.tributaryId !== tributaryId),
    });
  };

  const toggleSubgroupAxis = (tributaryId: string) => {
    const current = map.subgroupAxes ?? [];
    const next = current.includes(tributaryId)
      ? current.filter(id => id !== tributaryId)
      : [...current, tributaryId];
    update({ ...map, subgroupAxes: next });
  };

  const setCts = (ctsColumn: string | undefined) => {
    update({ ...map, ctsColumn });
  };

  const addHunch = (text: string, pin: { stepId?: string; tributaryId?: string }) => {
    const hunch: ProcessMapHunch = { id: uid('hunch'), text, ...pin };
    update({ ...map, hunches: [...(map.hunches ?? []), hunch] });
  };

  const removeHunch = (hunchId: string) => {
    update({
      ...map,
      hunches: (map.hunches ?? []).filter(h => h.id !== hunchId),
    });
  };

  return (
    <div
      className="flex flex-col gap-4 p-4 bg-surface-background"
      aria-label="Process map"
      data-testid="process-map"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Process Map</h3>
        {!disabled && (
          <button
            type="button"
            onClick={addStep}
            className="text-xs px-2 py-1 bg-surface-secondary hover:bg-surface-tertiary border border-edge rounded"
            data-testid="process-map-add-step"
          >
            + step
          </button>
        )}
      </div>

      <div className="flex items-start gap-3 overflow-x-auto pb-2" data-testid="process-map-spine">
        {sortedSteps.map((step, i) => (
          <React.Fragment key={step.id}>
            <StepCard
              step={step}
              tributaries={map.tributaries.filter(t => t.stepId === step.id)}
              subgroupAxes={map.subgroupAxes ?? []}
              availableColumns={availableColumns}
              gaps={gapsForStep(gaps, step.id)}
              disabled={disabled}
              ctqSpecs={step.ctqColumn ? stepSpecs?.[step.ctqColumn] : undefined}
              onRename={name => renameStep(step.id, name)}
              onCtqChange={col => setStepCtq(step.id, col)}
              onRemove={() => removeStep(step.id)}
              onAddTributary={col => addTributary(step.id, col)}
              onRemoveTributary={removeTributary}
              onToggleSubgroupAxis={toggleSubgroupAxis}
              onCtqSpecsChange={
                onStepSpecsChange && step.ctqColumn
                  ? next => onStepSpecsChange(step.ctqColumn!, next)
                  : undefined
              }
            />
            {i < sortedSteps.length - 1 && (
              <div
                aria-hidden="true"
                className="pt-6 text-content-secondary select-none"
                data-testid={`process-map-arrow-${i}`}
              >
                →
              </div>
            )}
          </React.Fragment>
        ))}
        {sortedSteps.length > 0 && (
          <div
            aria-hidden="true"
            className="pt-6 text-content-secondary select-none"
            data-testid="process-map-ocean-arrow"
          >
            →
          </div>
        )}
        <OceanCard
          ctsColumn={map.ctsColumn}
          availableColumns={availableColumns}
          target={target}
          usl={usl}
          lsl={lsl}
          cpkTarget={cpkTarget}
          disabled={disabled}
          onCtsChange={setCts}
          onSpecsChange={onSpecsChange}
        />
      </div>

      <HunchList
        hunches={map.hunches ?? []}
        steps={map.nodes}
        tributaries={map.tributaries}
        disabled={disabled}
        onAdd={addHunch}
        onRemove={removeHunch}
      />

      {showGaps && <GapStrip gaps={globalGaps(gaps)} />}
    </div>
  );
};
