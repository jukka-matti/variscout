/**
 * Entity cascade rules for the hub domain.
 * Data-only — no implementation classes.
 * Used by F3 Dexie migration and F5 action-log replay to determine
 * which dependent entities must be soft-deleted when a parent is archived.
 */

export type EntityKind =
  | 'hub'
  | 'outcome'
  | 'evidenceSnapshot'
  | 'rowProvenance'
  | 'evidenceSource'
  | 'evidenceSourceCursor'
  | 'investigation'
  | 'finding'
  | 'question'
  | 'causalLink'
  | 'suspectedCause'
  | 'canvasState';

export interface CascadeRule {
  cascadesTo: readonly EntityKind[];
}

export type CascadeRuleset = Readonly<Record<EntityKind, CascadeRule>>;

export const cascadeRules: CascadeRuleset = {
  hub: {
    cascadesTo: ['outcome', 'evidenceSnapshot', 'evidenceSource', 'investigation', 'canvasState'],
  },
  outcome: { cascadesTo: [] },
  evidenceSnapshot: { cascadesTo: ['rowProvenance'] },
  rowProvenance: { cascadesTo: [] },
  evidenceSource: { cascadesTo: ['evidenceSourceCursor'] },
  evidenceSourceCursor: { cascadesTo: [] },
  investigation: { cascadesTo: ['finding', 'question', 'causalLink', 'suspectedCause'] },
  finding: { cascadesTo: [] },
  question: { cascadesTo: [] },
  causalLink: { cascadesTo: [] },
  suspectedCause: { cascadesTo: [] },
  canvasState: { cascadesTo: [] },
};

/**
 * Returns all entity kinds that would be transitively soft-deleted when
 * an entity of the given kind is archived. Performs a BFS over cascadeRules.
 *
 * Example: `transitiveCascade('hub')` returns all hub-descendant kinds.
 * Example: `transitiveCascade('outcome')` returns `[]` (leaf node).
 */
export function transitiveCascade(kind: EntityKind): readonly EntityKind[] {
  const visited = new Set<EntityKind>();
  const queue: EntityKind[] = [...cascadeRules[kind].cascadesTo];
  while (queue.length > 0) {
    const next = queue.shift()!;
    if (!visited.has(next)) {
      visited.add(next);
      queue.push(...cascadeRules[next].cascadesTo);
    }
  }
  return Array.from(visited);
}
