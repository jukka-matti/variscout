import type { ProblemStatementScope } from '../findings/types';
import type { ProcessHubAnalyze } from '../processHub';

/**
 * Problem-Statement scope write operations (ADR-085 — the WHERE, first-class).
 * Mirrors the FINDING and HYPOTHESIS action shapes. No-op Dexie cases in both
 * apps — scopes persist via the serialized blob slot that `questions` vacated.
 */
export type ScopeAction =
  | {
      kind: 'SCOPE_ADD';
      investigationId: ProcessHubAnalyze['id'];
      scope: ProblemStatementScope;
    }
  | {
      kind: 'SCOPE_UPDATE';
      scopeId: ProblemStatementScope['id'];
      patch: Partial<Omit<ProblemStatementScope, 'id' | 'createdAt' | 'deletedAt'>>;
    }
  | { kind: 'SCOPE_ARCHIVE'; scopeId: ProblemStatementScope['id'] };
