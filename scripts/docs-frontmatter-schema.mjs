// Schema for docs/** frontmatter. Single source of truth.
// ADR-083 (2026-05-16): collapsed to 8 purposes × 4 tiers.
//
// STATUS collapsed from 22 → 4 canonical values.
// CATEGORY replaced by free-form `topic` tags.
// AUDIENCE collapsed from 14 → 3 canonical values.
// PURPOSE and TIER are new required-for-new-docs enums.
// STATUS_ALIAS_MAP and AUDIENCE_ALIAS_MAP support the transitional cycle.

// === Canonical enums (new schema) ===

export const PURPOSE = [
  'orient',
  'decide',
  'design',
  'build',
  'system',
  'constrain',
  'agent-context',
  'remember',
];

export const TIER = ['stable', 'living', 'ephemeral', 'card'];

export const STATUS = ['draft', 'active', 'named-future', 'superseded', 'archived'];

// Free-form topic tags replace CATEGORY enum.
// Dominant tags from the 2026-05-16 audit (for documentation; not enforced):
//   adr, stats, charts, ux, projects, investigation, canvas, ax, coscout,
//   methodology, azure, capability, response-paths, stores, marketplace, i18n, tier-gating
// Any kebab-case value is valid.

export const AUDIENCE = ['human', 'agent', 'both'];

// === Alias maps for the transitional cycle (old → new) ===
// Old values warn but pass; after Play 2 they hard-fail.

export const STATUS_ALIAS_MAP = {
  accepted: 'active',
  'in-progress': 'active',
  delivered: 'active',
  reference: 'active',
  template: 'active',
  stable: 'active',
  living: 'active',
  review: 'draft',
  design: 'draft',
  raw: 'draft',
  deferred: 'superseded',
};

export const AUDIENCE_ALIAS_MAP = {
  developer: 'human',
  engineer: 'human',
  analyst: 'human',
  business: 'human',
  architect: 'human',
  admin: 'human',
  designer: 'human',
  product: 'human',
  manager: 'human',
  compliance: 'human',
  procurement: 'human',
  infosec: 'human',
  'quality-manager': 'human',
  auditor: 'human',
};

// === Schema rules ===
// Per doc-type rules. `general` covers docs/** except ADRs and specs.
// ADRs have a permissive rule because historical conventions vary.
// Enforcing the full shape retroactively happens via docs-frontmatter-fix.mjs.

export const schema = {
  general: {
    required: ['title'],
    optional: [
      'purpose',
      'tier',
      'status',
      'audience',
      'topic',
      'related',
      'last-verified',
      'verified-against-commit',
      'supersedes',
      'date',
    ],
    enums: { status: STATUS, audience: AUDIENCE, purpose: PURPOSE, tier: TIER },
  },
  adr: {
    required: ['title'],
    optional: [
      'status',
      'purpose',
      'tier',
      'date',
      'related',
      'audience',
      'topic',
      'last-verified',
      'verified-against-commit',
      'supersedes',
      'superseded-by',
    ],
    enums: { status: STATUS, audience: AUDIENCE, purpose: PURPOSE, tier: TIER },
  },
  spec: {
    required: ['title', 'status'],
    optional: [
      'purpose',
      'tier',
      'audience',
      'topic',
      'related',
      'last-verified',
      'verified-against-commit',
      'supersedes',
      'date',
      'type',
    ],
    enums: { status: STATUS, audience: AUDIENCE, purpose: PURPOSE, tier: TIER },
  },
};

// === Doc-discipline constants (Phase 2 — Play 2b) ===
// Loaded by check-doc-frontmatter.mjs; kept here so the validator + toolbox
// scripts share a single source of truth.

// Anti-pattern filename regex: forbidden under docs/superpowers/specs/.
// (Archive dir is exempt because the file is no longer canonical-claimant.)
export const ANTI_PATTERN_FILENAME_RE = /(-amendment-|-revision-|-update-|-followup-).*\.md$/;
export const ANTI_PATTERN_SCOPE_PREFIX = 'docs/superpowers/specs/';

// Banner-presence checks: lenient regex against first BANNER_BODY_LINES of body.
// Matches markdown blockquote lines that mention the status keyword.
// DELIVERED_BANNER_RE is pre-positioned for T2's `delivered-by` WARN check.
export const BANNER_BODY_LINES = 15;
export const SUPERSEDED_BANNER_RE = /^>.*\b(SUPERSEDED|Superseded|superseded)\b/m;
export const ARCHIVED_BANNER_RE = /^>.*\b(ARCHIVED|Archived|archived)\b/m;
export const DELIVERED_BANNER_RE = /^>.*\b(Delivered|DELIVERED|delivered)\b/m;

// Canonical edit-type vocabulary for decision-log entries (consumed by T2 + T3).
// Match exactly (case-sensitive) per discipline doc.
export const EDIT_TYPES = [
  'spec edit',
  'ADR amendment',
  'new ADR',
  'supersession',
  'archived',
  'new spec',
];

// === Path classifier ===
// Updated for Play 1 new folder structure.
// Old paths are kept for backward-compat during transition.

export function classify(relPath) {
  // New structure (Play 1)
  if (relPath.startsWith('docs/living/decide/')) return 'adr';
  if (relPath.startsWith('docs/living/design/specs/')) return 'spec';

  // Legacy paths (still valid during transition)
  if (relPath.startsWith('docs/07-decisions/')) return 'adr';
  if (relPath.startsWith('docs/archive/adrs/')) return 'adr';
  // Specs, plans, and other superpowers artifacts share the lighter rule.
  if (relPath.startsWith('docs/superpowers/')) return 'spec';
  if (relPath.startsWith('docs/archive/specs/')) return 'spec';
  if (relPath.startsWith('docs/archive/plans/')) return 'spec';

  return 'general';
}
