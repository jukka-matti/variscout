/**
 * AddPlanForm — inline expansion form for creating a new MeasurementPlan on a Hypothesis.
 *
 * Pure DOM component (no SVG). Props-based — no store access. Mounted inside
 * <HypothesisCard> via foreignObject in Task 8.
 */

import { useState } from 'react';
import type { Hypothesis } from '@variscout/core';
import type { MeasurementPlan, MeasurementMethod } from '@variscout/core/measurementPlan';
import type { ProjectMember } from '@variscout/core/projectMembership';

export interface AddPlanFormProps {
  hypothesisId: Hypothesis['id'];
  members: ProjectMember[];
  onSave: (plan: Omit<MeasurementPlan, 'id' | 'createdAt' | 'deletedAt'>) => void;
  onCancel: () => void;
}

const METHODS: ReadonlyArray<MeasurementMethod> = [
  'sensor',
  'manual-count',
  'gemba-walk',
  'expert-assessment',
  'other',
];

export function AddPlanForm({ hypothesisId, members, onSave, onCancel }: AddPlanFormProps) {
  const eligibleOwners = members.filter(m => m.role !== 'sponsor' && m.deletedAt === null);
  const [factor, setFactor] = useState('');
  const [method, setMethod] = useState<MeasurementMethod>('sensor');
  const [sampleSize, setSampleSize] = useState(30);
  const [owner, setOwner] = useState<string>(eligibleOwners[0]?.id ?? '');
  const [msaRequired, setMsaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!factor.trim()) {
      setError('Factor is required');
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
    onSave({
      hypothesisId,
      factor: factor.trim(),
      method,
      sampleSize,
      owner,
      status: 'planned',
      linkedFindingIds: [],
      msaRequired,
    });
  };

  return (
    <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="add-plan-factor" className="text-sm font-medium">
          Factor
        </label>
        <input
          id="add-plan-factor"
          type="text"
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={factor}
          onChange={e => setFactor(e.target.value)}
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
      <div className="flex items-center gap-2">
        <input
          id="add-plan-msa"
          type="checkbox"
          checked={msaRequired}
          onChange={e => setMsaRequired(e.target.checked)}
        />
        <label htmlFor="add-plan-msa" className="text-sm">
          MSA required
        </label>
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
