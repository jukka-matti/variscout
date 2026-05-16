import type { Finding } from '../findings/types';
import type { MeasurementPlan } from './types';

/**
 * `id`, `createdAt`, `deletedAt`, and `hypothesisId` are immutable
 * (excluded from patch typing). Enforcement is type-level via `Omit<>`.
 */
export type MeasurementPlanPatch = Partial<
  Omit<MeasurementPlan, 'id' | 'createdAt' | 'deletedAt' | 'hypothesisId'>
>;

export type MeasurementPlanAction =
  | { kind: 'MEASUREMENT_PLAN_ADD'; plan: MeasurementPlan }
  | { kind: 'MEASUREMENT_PLAN_UPDATE'; planId: MeasurementPlan['id']; patch: MeasurementPlanPatch }
  | { kind: 'MEASUREMENT_PLAN_REMOVE'; planId: MeasurementPlan['id']; removedAt: number }
  | {
      kind: 'MEASUREMENT_PLAN_LINK_FINDING';
      planId: MeasurementPlan['id'];
      findingId: Finding['id'];
    };

export function reduceMeasurementPlans(
  state: MeasurementPlan[],
  action: MeasurementPlanAction
): MeasurementPlan[] {
  switch (action.kind) {
    case 'MEASUREMENT_PLAN_ADD':
      return [...state, action.plan];
    case 'MEASUREMENT_PLAN_UPDATE':
      return state.map(p => (p.id === action.planId ? { ...p, ...action.patch } : p));
    case 'MEASUREMENT_PLAN_REMOVE':
      return state.map(p => (p.id === action.planId ? { ...p, deletedAt: action.removedAt } : p));
    case 'MEASUREMENT_PLAN_LINK_FINDING':
      return state.map(p => {
        if (p.id !== action.planId) return p;
        const existing = p.linkedFindingIds ?? [];
        if (existing.includes(action.findingId)) return p;
        return { ...p, linkedFindingIds: [...existing, action.findingId] };
      });
  }
}
