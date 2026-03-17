/**
 * useReportSections — Dynamic section composition for the scouting report.
 *
 * Reads findings, hypotheses, and staged data to derive:
 *   - Report type: quick-check | deep-dive | full-cycle
 *   - Ordered section descriptors (id, stepNumber, title, status, findings, hypotheses, hasAIContent)
 */

import { useMemo } from 'react';
import type { Finding, Hypothesis } from '@variscout/core';

// ============================================================================
// Types
// ============================================================================

export type ReportSectionId =
  | 'current-condition'
  | 'drivers'
  | 'hypotheses'
  | 'actions'
  | 'verification';

export type SectionStatus = 'done' | 'active' | 'future';

export type ReportType = 'quick-check' | 'deep-dive' | 'full-cycle';

export interface ReportSectionDescriptor {
  id: ReportSectionId;
  stepNumber: number;
  title: string;
  status: SectionStatus;
  findings: Finding[];
  hypotheses: Hypothesis[];
  hasAIContent: boolean;
}

export interface UseReportSectionsOptions {
  findings: Finding[];
  hypotheses: Hypothesis[];
  /** True when staged comparison data is present */
  stagedComparison: boolean;
  /** Whether AI narration/insights are available */
  aiEnabled: boolean;
}

export interface UseReportSectionsReturn {
  reportType: ReportType;
  sections: ReportSectionDescriptor[];
}

// ============================================================================
// Helpers
// ============================================================================

/** Derive the report type from the current state of findings. */
function deriveReportType(findings: Finding[]): ReportType {
  if (findings.length === 0) return 'quick-check';

  const hasActions = findings.some(f => f.actions && f.actions.length > 0);
  const hasOutcome = findings.some(f => f.outcome != null);

  if (hasActions && hasOutcome) return 'full-cycle';
  return 'deep-dive';
}

/** Build the title for the hypotheses section (Step 3), adapting to first hypothesis text. */
function buildHypothesesTitle(hypotheses: Hypothesis[]): string {
  if (hypotheses.length === 0) return 'Why is this happening?';
  const first = hypotheses[0];
  // Use the hypothesis text trimmed, up to ~60 chars, as the contextual subject
  const subject = first.text && first.text.trim().length > 0 ? first.text.trim() : null;
  if (!subject) return 'Why is this happening?';
  return `What causes ${subject}?`;
}

/** Determine per-section status based on report type and section index. */
function sectionStatus(sectionId: ReportSectionId, reportType: ReportType): SectionStatus {
  // quick-check: steps 1–2 active, rest future
  // deep-dive: steps 1–3 done/active, 4–5 future
  // full-cycle: steps 1–5 done

  if (reportType === 'full-cycle') return 'done';

  if (reportType === 'quick-check') {
    if (sectionId === 'current-condition' || sectionId === 'drivers') return 'active';
    return 'future';
  }

  // deep-dive
  if (sectionId === 'current-condition' || sectionId === 'drivers' || sectionId === 'hypotheses') {
    return 'active';
  }
  return 'future';
}

// ============================================================================
// Hook
// ============================================================================

export function useReportSections({
  findings,
  hypotheses,
  stagedComparison,
  aiEnabled,
}: UseReportSectionsOptions): UseReportSectionsReturn {
  return useMemo(() => {
    const reportType = deriveReportType(findings);

    const sections: ReportSectionDescriptor[] = [
      {
        id: 'current-condition',
        stepNumber: 1,
        title: 'What does the process look like?',
        status: sectionStatus('current-condition', reportType),
        findings: findings.filter(f => !f.hypothesisId),
        hypotheses: [],
        hasAIContent: aiEnabled,
      },
      {
        id: 'drivers',
        stepNumber: 2,
        title: 'What is driving the variation?',
        status: sectionStatus('drivers', reportType),
        findings: findings.filter(f => !f.hypothesisId),
        hypotheses: [],
        hasAIContent: aiEnabled || stagedComparison,
      },
      {
        id: 'hypotheses',
        stepNumber: 3,
        title: buildHypothesesTitle(hypotheses),
        status: sectionStatus('hypotheses', reportType),
        findings: findings.filter(f => f.hypothesisId != null),
        hypotheses,
        hasAIContent: aiEnabled,
      },
      {
        id: 'actions',
        stepNumber: 4,
        title: 'What actions were taken?',
        status: sectionStatus('actions', reportType),
        findings: findings.filter(f => f.actions && f.actions.length > 0),
        hypotheses: [],
        hasAIContent: false,
      },
      {
        id: 'verification',
        stepNumber: 5,
        title: 'Did the actions work?',
        status: sectionStatus('verification', reportType),
        findings: findings.filter(f => f.outcome != null),
        hypotheses: [],
        hasAIContent: aiEnabled || stagedComparison,
      },
    ];

    return { reportType, sections };
  }, [findings, hypotheses, stagedComparison, aiEnabled]);
}
