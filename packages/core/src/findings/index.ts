/**
 * Findings domain — re-exports from modular subfiles.
 *
 * Split from monolithic findings.ts (828 LOC) into:
 *   types.ts      — All type definitions, interfaces, constants
 *   factories.ts  — Object creation functions (createFinding, createHypothesis, etc.)
 *   helpers.ts    — Status helpers, filter comparison, duplicate detection
 *   migration.ts  — Schema migration functions
 */
export * from './types';
export * from './factories';
export * from './helpers';
export * from './migration';
