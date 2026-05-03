/**
 * InlineSpecEditor — FRAME b0 inline spec popover.
 *
 * Lightweight inline popover that lets a user set USL / LSL / Target /
 * Cpk target for one measure column. Pre-populates fields from a
 * "suggested from data" computation (mean ± 3σ) supplied by the caller,
 * but the user MUST confirm to save (no auto-write — the b0 vision is
 * "structured investigation, never silent assumptions").
 *
 * Used by the Y-picker chip's `+ add spec` link (W3-3) and by the
 * Capability/Distribution tab's soft prompt (wired in W3-8).
 *
 * Scope vs. SpecEditor: SpecEditor is the per-characteristic full editor
 * (with characteristic-type selector, mobile bottom sheet, etc.) used
 * inside ProcessMap step cards. InlineSpecEditor is intentionally narrower:
 * a four-input popover with suggestion + confirm semantics, anchor-positioned
 * by the caller. Both share the same SpecLimits-shaped output but no code.
 *
 * Hard rules:
 * - Presentational primitive — props-based, no Zustand access.
 * - i18n via useTranslation hook — no hardcoded English strings.
 * - Semantic Tailwind only (no color-scheme props).
 * - role="dialog" + aria-modal="false": this is an inline popover, not a
 *   true modal — keep the page interactive behind it.
 */

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { useTranslation } from '@variscout/hooks';

export interface SpecValues {
  usl?: number;
  lsl?: number;
  target?: number;
  cpkTarget?: number;
}

export interface SpecSuggestion {
  /** Suggested USL — typically mean + 3*sigma. Optional (omit if unknown). */
  usl?: number;
  /** Suggested LSL — typically mean - 3*sigma. */
  lsl?: number;
  /** Suggested target — typically mean. */
  target?: number;
}

export interface InlineSpecEditorProps {
  /** Name of the measure being spec'd (shown in popover title). */
  measure: string;
  /** Current spec values (may be empty / partial). Pre-fills inputs. */
  current?: SpecValues;
  /** Suggested values from data — shown as placeholders + "use suggestion" affordance. */
  suggestion?: SpecSuggestion;
  /** Default Cpk target value to suggest in the cpkTarget field. Project default is 1.33. */
  defaultCpkTarget?: number;
  /** Fired with the new spec when user clicks Save. */
  onConfirm: (values: SpecValues) => void;
  /** Fired when user clicks Cancel or hits Escape. */
  onCancel: () => void;
  /** Optional aria-label override; defaults to "Set spec for {measure}". */
  ariaLabel?: string;
  /** Optional className for layout. */
  className?: string;
  /** Optional inline style for positioning (e.g. anchor-positioned popover). */
  style?: CSSProperties;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/** Parse a number-input string to `number | undefined`. Empty / non-finite → undefined. */
function parseNumberInput(raw: string): number | undefined {
  if (raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Format a possibly-undefined number for an `<input type="number">`. */
function toInputString(n: number | undefined): string {
  return n === undefined ? '' : String(n);
}

/**
 * Derive the initial input string for one slot, preferring `current` over
 * `suggestion` over empty. Numeric type-checks guard against accidental
 * NaN propagation from upstream computations.
 */
function initialFor(current: number | undefined, suggestion: number | undefined): string {
  if (current !== undefined && Number.isFinite(current)) return toInputString(current);
  if (suggestion !== undefined && Number.isFinite(suggestion)) return toInputString(suggestion);
  return '';
}

/**
 * Cpk-target initial value cascade:
 *   current.cpkTarget → defaultCpkTarget → empty
 *
 * Note: `suggestion` does not carry a cpkTarget; the data-driven suggestion
 * only covers USL/LSL/Target (the engineering envelope). Cpk target is a
 * project-level convention (1.33 industry default).
 */
function initialCpkTarget(currentCpk: number | undefined, defaultCpk: number | undefined): string {
  if (currentCpk !== undefined && Number.isFinite(currentCpk)) return toInputString(currentCpk);
  if (defaultCpk !== undefined && Number.isFinite(defaultCpk)) return toInputString(defaultCpk);
  return '';
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export function InlineSpecEditor({
  measure,
  current,
  suggestion,
  defaultCpkTarget,
  onConfirm,
  onCancel,
  ariaLabel,
  className,
  style,
}: InlineSpecEditorProps) {
  const { t, tf } = useTranslation();

  const [uslStr, setUslStr] = useState(() => initialFor(current?.usl, suggestion?.usl));
  const [lslStr, setLslStr] = useState(() => initialFor(current?.lsl, suggestion?.lsl));
  const [targetStr, setTargetStr] = useState(() => initialFor(current?.target, suggestion?.target));
  const [cpkTargetStr, setCpkTargetStr] = useState(() =>
    initialCpkTarget(current?.cpkTarget, defaultCpkTarget)
  );

  // Parse on every render so validation reads live values without an effect.
  const parsedUsl = parseNumberInput(uslStr);
  const parsedLsl = parseNumberInput(lslStr);
  const isInvalidRange =
    parsedUsl !== undefined && parsedLsl !== undefined && parsedUsl <= parsedLsl;

  // Escape key → onCancel. Only listen while mounted; we don't trap focus
  // (this is an inline popover, not a modal — the page stays interactive).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isInvalidRange) return;
    onConfirm({
      usl: parsedUsl,
      lsl: parsedLsl,
      target: parseNumberInput(targetStr),
      cpkTarget: parseNumberInput(cpkTargetStr),
    });
  };

  const titleText = useMemo(() => tf('frame.spec.editor.title', { measure }), [tf, measure]);
  const dialogAriaLabel = ariaLabel ?? titleText;

  const containerClass = [
    'flex flex-col gap-3 p-4 rounded-lg border border-edge bg-surface-secondary shadow-lg w-80',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputClass =
    'w-full bg-surface border border-edge rounded px-2 py-1 text-sm text-content outline-none focus:border-blue-500';
  const labelClass = 'block text-xs text-content-secondary mb-1';

  return (
    <form
      role="dialog"
      aria-modal="false"
      aria-label={dialogAriaLabel}
      className={containerClass}
      style={style}
      data-testid="inline-spec-editor"
      onSubmit={handleSubmit}
    >
      <h3 className="text-sm font-semibold text-content" data-testid="inline-spec-editor-title">
        {titleText}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="inline-spec-usl" className={labelClass}>
            {t('frame.spec.editor.usl')}
          </label>
          <input
            id="inline-spec-usl"
            name="inline-spec-usl"
            type="number"
            step="any"
            value={uslStr}
            onChange={e => setUslStr(e.target.value)}
            className={inputClass}
            aria-label={t('frame.spec.editor.usl')}
            data-testid="inline-spec-editor-usl"
          />
        </div>

        <div>
          <label htmlFor="inline-spec-lsl" className={labelClass}>
            {t('frame.spec.editor.lsl')}
          </label>
          <input
            id="inline-spec-lsl"
            name="inline-spec-lsl"
            type="number"
            step="any"
            value={lslStr}
            onChange={e => setLslStr(e.target.value)}
            className={inputClass}
            aria-label={t('frame.spec.editor.lsl')}
            data-testid="inline-spec-editor-lsl"
          />
        </div>

        <div>
          <label htmlFor="inline-spec-target" className={labelClass}>
            {t('frame.spec.editor.target')}
          </label>
          <input
            id="inline-spec-target"
            name="inline-spec-target"
            type="number"
            step="any"
            value={targetStr}
            onChange={e => setTargetStr(e.target.value)}
            className={inputClass}
            aria-label={t('frame.spec.editor.target')}
            data-testid="inline-spec-editor-target"
          />
        </div>

        <div>
          <label htmlFor="inline-spec-cpktarget" className={labelClass}>
            {t('frame.spec.editor.cpkTarget')}
          </label>
          <input
            id="inline-spec-cpktarget"
            name="inline-spec-cpktarget"
            type="number"
            step="any"
            min="0"
            value={cpkTargetStr}
            onChange={e => setCpkTargetStr(e.target.value)}
            className={inputClass}
            aria-label={t('frame.spec.editor.cpkTarget')}
            data-testid="inline-spec-editor-cpktarget"
          />
        </div>
      </div>

      {isInvalidRange && (
        <p
          role="alert"
          className="text-xs text-red-700 dark:text-red-400"
          data-testid="inline-spec-editor-error"
        >
          {t('frame.spec.editor.invalidRange')}
        </p>
      )}

      {suggestion && (
        <p
          role="note"
          className="text-xs text-content-muted"
          data-testid="inline-spec-editor-suggestion-hint"
        >
          {t('frame.spec.editor.suggestedFromData')}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1 rounded border border-edge text-content-secondary hover:bg-surface-tertiary"
          data-testid="inline-spec-editor-cancel"
        >
          {t('frame.spec.editor.cancel')}
        </button>
        <button
          type="submit"
          disabled={isInvalidRange}
          className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="inline-spec-editor-save"
        >
          {t('frame.spec.editor.confirm')}
        </button>
      </div>
    </form>
  );
}
