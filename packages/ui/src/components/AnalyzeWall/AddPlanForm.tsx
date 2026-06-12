/**
 * AddPlanForm — inline expansion form for creating a new MeasurementPlan on a Hypothesis.
 *
 * Pure DOM component (no SVG). Props-based — no store access. Mounted inside
 * <HypothesisCard> via foreignObject in Task 8.
 *
 * DCP-aligned fields (spec §7.1):
 *   - primaryFactor (required) — renamed from `factor`
 *   - outcome (optional pre-fill via defaultOutcome prop; else user-entered)
 *   - neededFactors[] — comma-separated tag entry; stored as dataset column names
 *   - processLocation — select from stepOptions ('' = no step assigned)
 *   - opDef? — optional operational-definition note
 *   - msaNote? — optional MSA/Gage R&R comment (replaces removed msaRequired checkbox)
 *   - scope — snapshot of active WHERE drill chips (passed as defaultScope; not user-editable)
 */

import { useState } from 'react';
import type { Hypothesis } from '@variscout/core';
import type { MeasurementPlan, MeasurementMethod } from '@variscout/core/measurementPlan';
import type { ConditionLeaf } from '@variscout/core/findings';
import type { ProjectContributor } from '@variscout/core/improvementProject';

/** A process-step option for the processLocation picker. */
export interface StepOption {
  id: string;
  label: string;
}

export interface AddPlanFormProps {
  hypothesisId: Hypothesis['id'];
  members: ProjectContributor[];
  onSave: (plan: Omit<MeasurementPlan, 'id' | 'createdAt' | 'deletedAt'>) => void;
  onCancel: () => void;
  /**
   * Process steps derived from `deriveProcessSteps(processMap)` at the WallCanvas level.
   * When provided, renders a select for processLocation.
   * When absent/empty, processLocation is set to `''` (no step).
   */
  stepOptions?: StepOption[];
  /**
   * Active WHERE drill-chip conditions captured at form-open time.
   * Stored as a snapshot on the plan `scope` field — NOT user-editable in the form.
   * Defaults to `[]` when absent.
   */
  defaultScope?: ConditionLeaf[];
  /**
   * Pre-fill for the outcome field (e.g. from the project/hypothesis outcome).
   * User can override. Defaults to `''` when absent.
   */
  defaultOutcome?: string;
  /**
   * Pre-fill for the primary-factor field (FE-2a — the gap-factor "+ Measurement
   * Plan" path seeds this from the cause's derived factor, killing the free-text
   * drift). User can override. Defaults to `''` when absent.
   */
  defaultPrimaryFactor?: string;
}

const METHODS: ReadonlyArray<MeasurementMethod> = [
  'sensor',
  'manual-count',
  'gemba-walk',
  'expert-assessment',
  'other',
];

export function AddPlanForm({
  hypothesisId,
  members,
  onSave,
  onCancel,
  stepOptions,
  defaultScope,
  defaultOutcome,
  defaultPrimaryFactor,
}: AddPlanFormProps) {
  const eligibleOwners = members.filter(m => m.deletedAt === null);
  const [primaryFactor, setPrimaryFactor] = useState(defaultPrimaryFactor ?? '');
  const [outcome, setOutcome] = useState(defaultOutcome ?? '');
  const [neededFactorsRaw, setNeededFactorsRaw] = useState('');
  const [method, setMethod] = useState<MeasurementMethod>('sensor');
  const [sampleSize, setSampleSize] = useState(30);
  const [owner, setOwner] = useState<string>(eligibleOwners[0]?.id ?? '');
  const [processLocation, setProcessLocation] = useState('');
  const [opDef, setOpDef] = useState('');
  const [msaNote, setMsaNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!primaryFactor.trim()) {
      setError('Primary factor is required');
      return;
    }
    if (sampleSize < 1) {
      setError('Sample size must be at least 1');
      return;
    }
    if (!owner) {
      setError('Owner is required');
      return;
    }
    setError(null);

    // Parse comma-separated neededFactors into trimmed non-empty strings.
    const neededFactors = neededFactorsRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    onSave({
      hypothesisId,
      // Use the user's current outcome value directly (state is seeded from defaultOutcome).
      // Do NOT fall back to defaultOutcome here — that would prevent the user from clearing
      // a prefilled outcome (outcome.trim() || defaultOutcome would always re-substitute it).
      outcome: outcome.trim(),
      primaryFactor: primaryFactor.trim(),
      neededFactors,
      method,
      sampleSize,
      owner,
      status: 'planned',
      scope: defaultScope ?? [],
      processLocation,
      ...(opDef.trim() ? { opDef: opDef.trim() } : {}),
      ...(msaNote.trim() ? { msaNote: msaNote.trim() } : {}),
      linkedFindingIds: [],
    });
  };

  const hasStepOptions = stepOptions && stepOptions.length > 0;

  return (
    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="add-plan-primary-factor" className="text-sm font-medium">
          Primary factor
        </label>
        <input
          id="add-plan-primary-factor"
          type="text"
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={primaryFactor}
          onChange={e => setPrimaryFactor(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="add-plan-outcome" className="text-sm font-medium">
          Outcome (Y)
        </label>
        <input
          id="add-plan-outcome"
          type="text"
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={outcome}
          onChange={e => setOutcome(e.target.value)}
          placeholder={defaultOutcome ?? ''}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="add-plan-needed-factors" className="text-sm font-medium">
          Needed factors (column names, comma-separated)
        </label>
        <input
          id="add-plan-needed-factors"
          type="text"
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={neededFactorsRaw}
          onChange={e => setNeededFactorsRaw(e.target.value)}
          placeholder="e.g. SHIFT, Operator"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="add-plan-method" className="text-sm font-medium">
          Method
        </label>
        <select
          id="add-plan-method"
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={method}
          onChange={e => setMethod(e.target.value as MeasurementMethod)}
        >
          {METHODS.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="add-plan-sample-size" className="text-sm font-medium">
          Sample size
        </label>
        <input
          id="add-plan-sample-size"
          type="number"
          min={1}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={sampleSize}
          onChange={e => setSampleSize(Number.parseInt(e.target.value, 10) || 0)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="add-plan-owner" className="text-sm font-medium">
          Owner
        </label>
        <select
          id="add-plan-owner"
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={owner}
          onChange={e => setOwner(e.target.value)}
        >
          {eligibleOwners.map(m => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
      </div>
      {hasStepOptions && (
        <div className="flex flex-col gap-1">
          <label htmlFor="add-plan-process-location" className="text-sm font-medium">
            Process step
          </label>
          <select
            id="add-plan-process-location"
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={processLocation}
            onChange={e => setProcessLocation(e.target.value)}
          >
            <option value="">— none —</option>
            {stepOptions.map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="add-plan-op-def" className="text-sm font-medium">
          Operational definition (optional)
        </label>
        <textarea
          id="add-plan-op-def"
          className="border border-gray-300 rounded px-2 py-1 text-sm resize-none"
          rows={2}
          value={opDef}
          onChange={e => setOpDef(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="add-plan-msa-note" className="text-sm font-medium">
          MSA / Gage R&R note (optional)
        </label>
        <textarea
          id="add-plan-msa-note"
          className="border border-gray-300 rounded px-2 py-1 text-sm resize-none"
          rows={2}
          value={msaNote}
          onChange={e => setMsaNote(e.target.value)}
        />
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleSave}
        >
          Save
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
