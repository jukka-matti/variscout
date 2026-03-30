/**
 * useReportSections — Dynamic section composition for workspace-aligned reports.
 *
 * Reads findings, hypotheses, and staged data to derive:
 *   - Report type: analysis-snapshot | investigation-report | improvement-story
 *   - Ordered section descriptors with workspace grouping and audience mode support
 */

import { useMemo } from 'react';
import type { Finding, Hypothesis, AnalysisMode } from '@variscout/core';
import { resolveMode } from '@variscout/core/strategy';
import type { ResolvedMode } from '@variscout/core/strategy';

// ============================================================================
// Types
// ============================================================================

export type ReportSectionId =
  | 'current-condition'
  | 'drivers'
  | 'evidence-trail'
  | 'improvement-plan'
  | 'actions-taken'
  | 'verification';

export type SectionStatus = 'done' | 'active' | 'future';

export type ReportType = 'analysis-snapshot' | 'investigation-report' | 'improvement-story';

export type ReportWorkspace = 'analysis' | 'findings' | 'improvement';

export type AudienceMode = 'technical' | 'summary';

export interface ReportSectionDescriptor {
  id: ReportSectionId;
  stepNumber: number;
  title: string;
  status: SectionStatus;
  workspace: ReportWorkspace;
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
  /** Audience mode for content level (defaults to 'technical') */
  audienceMode?: AudienceMode;
  /** Analysis mode — overrides section titles for yamazumi/performance */
  analysisMode?: AnalysisMode;
  /** True when standard mode I-Chart is showing Cp/Cpk per subgroup */
  isCapabilityMode?: boolean;
}

export interface UseReportSectionsReturn {
  reportType: ReportType;
  sections: ReportSectionDescriptor[];
  audienceMode: AudienceMode;
}

// ============================================================================
// Helpers
// ============================================================================

/** Derive the report type from the current state of findings. */
function deriveReportType(findings: Finding[]): ReportType {
  if (findings.length === 0) return 'analysis-snapshot';

  const hasActions = findings.some(f => f.actions && f.actions.length > 0);
  const hasOutcome = findings.some(f => f.outcome != null);

  if (hasActions && hasOutcome) return 'improvement-story';
  return 'investigation-report';
}

/** Build the title for the evidence trail section, adapting to primary cause or first hypothesis text. */
function buildEvidenceTrailTitle(hypotheses: Hypothesis[]): string {
  if (hypotheses.length === 0) return 'Why is this happening?';

  // Prefer the primary cause hypothesis if one is marked
  const primary = hypotheses.find(h => h.causeRole === 'suspected-cause');
  const subject = primary ? primary.text.trim() : hypotheses[0].text?.trim() || null;

  if (!subject) return 'Why is this happening?';
  return `What causes ${subject}?`;
}

/** Determine per-section status based on report type and section id. */
function sectionStatus(sectionId: ReportSectionId, reportType: ReportType): SectionStatus {
  if (reportType === 'improvement-story') return 'done';

  if (reportType === 'analysis-snapshot') {
    if (sectionId === 'current-condition' || sectionId === 'drivers') return 'active';
    return 'future';
  }

  // investigation-report: analysis + findings sections active, improvement sections future
  if (
    sectionId === 'current-condition' ||
    sectionId === 'drivers' ||
    sectionId === 'evidence-trail'
  ) {
    return 'active';
  }
  return 'future';
}

/** Map section ID to workspace. */
function sectionWorkspace(sectionId: ReportSectionId): ReportWorkspace {
  switch (sectionId) {
    case 'current-condition':
    case 'drivers':
      return 'analysis';
    case 'evidence-trail':
      return 'findings';
    case 'improvement-plan':
    case 'actions-taken':
    case 'verification':
      return 'improvement';
  }
}

// ============================================================================
// Section title lookups (report-section–specific, not part of strategy interface)
// ============================================================================

const currentConditionTitles: Record<ResolvedMode, string> = {
  yamazumi: 'What does the time composition look like?',
  performance: 'How do channels perform?',
  capability: 'Is capability meeting target?',
  standard: 'What does the process look like?',
};

const driversTitles: Record<ResolvedMode, string> = {
  yamazumi: 'What is driving the activity composition?',
  performance: 'Which channels are failing?',
  capability: 'What drives capability differences?',
  standard: 'What is driving the variation?',
};

// ============================================================================
// Hook
// ============================================================================

export function useReportSections({
  findings,
  hypotheses,
  stagedComparison,
  aiEnabled,
  audienceMode = 'technical',
  analysisMode,
  isCapabilityMode,
}: UseReportSectionsOptions): UseReportSectionsReturn {
  return useMemo(() => {
    const resolved = resolveMode(analysisMode ?? 'standard', {
      standardIChartMetric: isCapabilityMode ? 'capability' : undefined,
    });

    const reportType = deriveReportType(findings);

    // Build sections based on report type
    const allSections: ReportSectionDescriptor[] = [];

    // --- Analysis workspace sections (all report types) ---
    allSections.push({
      id: 'current-condition',
      stepNumber: 1,
      title: currentConditionTitles[resolved],
      status: sectionStatus('current-condition', reportType),
      workspace: sectionWorkspace('current-condition'),
      findings: findings.filter(f => !f.hypothesisId),
      hypotheses: [],
      hasAIContent: aiEnabled,
    });

    allSections.push({
      id: 'drivers',
      stepNumber: 2,
      title:
        resolved === 'standard' && reportType === 'improvement-story'
          ? 'Where does variation hide?'
          : driversTitles[resolved],
      status: sectionStatus('drivers', reportType),
      workspace: sectionWorkspace('drivers'),
      findings: findings.filter(f => !f.hypothesisId),
      hypotheses: [],
      hasAIContent: aiEnabled || stagedComparison,
    });

    // --- Findings workspace section (investigation-report + improvement-story) ---
    if (reportType !== 'analysis-snapshot') {
      allSections.push({
        id: 'evidence-trail',
        stepNumber: 3,
        title:
          reportType === 'improvement-story'
            ? 'What did we find?'
            : buildEvidenceTrailTitle(hypotheses),
        status: sectionStatus('evidence-trail', reportType),
        workspace: sectionWorkspace('evidence-trail'),
        findings: findings.filter(f => f.hypothesisId != null),
        hypotheses,
        hasAIContent: aiEnabled,
      });
    }

    // --- Improvement workspace sections (improvement-story only) ---
    if (reportType === 'improvement-story') {
      allSections.push({
        id: 'improvement-plan',
        stepNumber: 4,
        title: 'What did we plan?',
        status: sectionStatus('improvement-plan', reportType),
        workspace: sectionWorkspace('improvement-plan'),
        findings: findings.filter(
          f => f.actions && f.actions.length > 0 && f.actions.some(a => a.ideaId)
        ),
        hypotheses: hypotheses.filter(h => h.ideas && h.ideas.length > 0),
        hasAIContent: false,
      });

      allSections.push({
        id: 'actions-taken',
        stepNumber: 5,
        title: 'What did we do?',
        status: sectionStatus('actions-taken', reportType),
        workspace: sectionWorkspace('actions-taken'),
        findings: findings.filter(f => f.actions && f.actions.length > 0),
        hypotheses: [],
        hasAIContent: false,
      });

      allSections.push({
        id: 'verification',
        stepNumber: 6,
        title: 'Did it work?',
        status: sectionStatus('verification', reportType),
        workspace: sectionWorkspace('verification'),
        findings: findings.filter(f => f.outcome != null),
        hypotheses: [],
        hasAIContent: aiEnabled || stagedComparison,
      });
    }

    return { reportType, sections: allSections, audienceMode };
  }, [
    findings,
    hypotheses,
    stagedComparison,
    aiEnabled,
    audienceMode,
    analysisMode,
    isCapabilityMode,
  ]);
}
