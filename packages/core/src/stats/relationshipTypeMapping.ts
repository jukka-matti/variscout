import type { RelationshipType } from './causalGraph';

/** 3 user-facing relationship types mapped from the 5 engine types. */
export type UIRelationshipType = 'interact' | 'overlap' | 'independent';

export interface UIRelationshipInfo {
  label: string;
  guidance: string;
}

const mapping: Record<RelationshipType, UIRelationshipType> = {
  interactive: 'interact',
  synergistic: 'interact',
  overlapping: 'overlap',
  independent: 'independent',
  redundant: 'independent',
};

const info: Record<UIRelationshipType, UIRelationshipInfo> = {
  interact: { label: 'Interact', guidance: 'Optimize together' },
  overlap: { label: 'Overlap', guidance: 'Shared variation — investigate what connects them' },
  independent: { label: 'Independent', guidance: 'Optimize separately' },
};

/** Map engine RelationshipType to UI type. With `withInfo`, returns label + guidance. */
export function mapRelationshipType(type: RelationshipType): UIRelationshipType;
// eslint-disable-next-line no-redeclare
export function mapRelationshipType(type: RelationshipType, withInfo: true): UIRelationshipInfo;
// eslint-disable-next-line no-redeclare
export function mapRelationshipType(
  type: RelationshipType,
  withInfo?: boolean
): UIRelationshipType | UIRelationshipInfo {
  const uiType = mapping[type];
  if (withInfo) return info[uiType];
  return uiType;
}
