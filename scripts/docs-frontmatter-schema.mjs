// Schema for docs/** frontmatter. Single source of truth.
// Values reflect the current corpus minus drift (casing collapsed).
// Extend here when a new legitimate value is introduced; avoid widening
// to absorb mistakes — the point of the enum is to catch drift.

export const STATUS = [
  'draft',
  'active',
  'accepted',
  'in-progress',
  'design',
  'delivered',
  'stable',
  'deferred',
  'superseded',
  'archived',
  'reference',
  'template',
  'raw',
  'review',
  'living',
];

export const CATEGORY = [
  'ai',
  'analysis',
  'architecture',
  'compliance',
  'components',
  'data',
  'design-spec',
  'implementation',
  'learning',
  'living-index',
  'methodology',
  'navigation',
  'patterns',
  'reference',
  'strategy',
  'tutorial',
  'workflow',
];

export const AUDIENCE = [
  'analyst',
  'developer',
  'engineer',
  'business',
  'architect',
  'admin',
  'designer',
  'product',
  'manager',
  'compliance',
  'procurement',
  'infosec',
  'quality-manager',
  'auditor',
];

// Per doc-type rules. `general` covers docs/** except ADRs and specs.
// ADRs have a permissive rule because historical conventions vary
// (title-only is legal; adr-069 uses full general shape; adr-067 uses
// title+status+date). Enforcing the full shape retroactively is a
// separate ticket.
export const schema = {
  general: {
    required: ['title', 'audience', 'category', 'status'],
    optional: ['related', 'last-reviewed', 'date'],
    enums: { status: STATUS, category: CATEGORY, audience: AUDIENCE },
  },
  adr: {
    required: ['title'],
    optional: ['status', 'date', 'related', 'audience', 'category', 'last-reviewed', 'supersedes', 'superseded-by'],
    enums: { status: STATUS, category: CATEGORY, audience: AUDIENCE },
  },
  spec: {
    required: ['title', 'status'],
    optional: ['audience', 'category', 'related', 'last-reviewed', 'date', 'type'],
    enums: { status: STATUS, category: CATEGORY, audience: AUDIENCE },
  },
};

export function classify(relPath) {
  if (relPath.startsWith('docs/07-decisions/')) return 'adr';
  if (relPath.startsWith('docs/archive/adrs/')) return 'adr';
  // Specs, plans, and other superpowers artifacts share the lighter
  // required-fields rule (title + status) — they aren't published docs.
  if (relPath.startsWith('docs/superpowers/')) return 'spec';
  if (relPath.startsWith('docs/archive/specs/')) return 'spec';
  return 'general';
}
