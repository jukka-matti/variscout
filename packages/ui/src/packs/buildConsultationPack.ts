/**
 * CL-3: Consultation pack builder
 *
 * Converts a `Consultation` entity (plus caller-resolved views) into a
 * `PackModel` ready for `renderPackHtml`.  Kept pure/testable here; no DOM or
 * React dependency — those live in `exportConsultationPack` in paidArtifacts.ts.
 *
 * PackId strategy: We use the consultation's own `id` as the packId.  This is
 * the stable round-trip key — the CL-4 importer will parse the MD template and
 * can match it back to a consultation by id without any secondary mapping.
 */

import type { Consultation } from '@variscout/core/consultations';
import type {
  ChartSection,
  ConditionSection,
  PackModel,
  PackSection,
  QuestionSection,
} from './renderPackHtml';
import type { StaticBoxplotInput } from './staticChartSvg';

// ── ResolvedView ──────────────────────────────────────────────────────────────

/**
 * A pre-resolved view that the CALLER (CL-5, later) supplies.
 *
 * The builder does not know how to fetch stats or chart data — those live in
 * the Zustand stores and hooks.  The caller resolves what to show and passes
 * concrete view descriptors here.  This keeps the builder pure and testable.
 */
export type ResolvedView =
  | {
      kind: 'condition';
      /** Human-readable filter label, e.g. "Day_of_Week = Monday". */
      label: string;
      /** Precomputed stats text, e.g. "Cpk 0.77 · 12 events". */
      statsText: string;
    }
  | {
      kind: 'chart';
      title: string;
      chartType: 'ichart' | 'boxplot';
      /** For ichart: array of {x, y} data points. */
      data?: Array<{ x: number; y: number }>;
      /** For boxplot: group statistics. */
      groups?: StaticBoxplotInput['groups'];
      /** Control chart parameters (ichart). */
      mean?: number;
      ucl?: number;
      lcl?: number;
      /** Render dimensions — defaults to 480×240 if omitted. */
      width?: number;
      height?: number;
      yAxisLabel?: string;
      xAxisLabel?: string;
    };

// ── buildConsultationPack ────────────────────────────────────────────────────

/**
 * Builds a `PackModel` from a `Consultation` entity + caller-resolved views.
 *
 * Section order: views (conditions then charts, preserving relative order)
 * followed by question cards.
 *
 * PackId = consultationId — the stable round-trip key for CL-4 import.
 */
export function buildConsultationPack(input: {
  consultation: Consultation;
  views: ResolvedView[];
  from?: string;
}): PackModel {
  const { consultation, views, from } = input;
  const packId = consultation.id;

  // Map resolved views → PackSections.
  const viewSections: PackSection[] = views.map(v => {
    if (v.kind === 'condition') {
      const section: ConditionSection = {
        kind: 'condition',
        label: v.label,
        statsText: v.statsText,
      };
      return section;
    }
    // chart
    const section: ChartSection = {
      kind: 'chart',
      title: v.title,
      chartType: v.chartType,
      data: v.data,
      groups: v.groups,
      mean: v.mean,
      ucl: v.ucl,
      lcl: v.lcl,
      width: v.width ?? 480,
      height: v.height ?? 240,
      yAxisLabel: v.yAxisLabel,
      xAxisLabel: v.xAxisLabel,
    };
    return section;
  });

  // Map consultation questions → QuestionSection cards.
  // M1: SKIP questions whose text is empty/whitespace — they would otherwise
  // ship as blank `### Qn [id:...]` blocks the expert cannot answer.
  const questionSections: PackSection[] = consultation.questions
    .filter(q => q.text.trim().length > 0)
    .map(q => {
      const section: QuestionSection = {
        kind: 'question',
        questionId: q.id,
        text: q.text,
        // If the question has an anchor, surface a label derived from it.
        anchorLabel: q.anchor ? `${q.anchor.kind} ${q.anchor.id}` : undefined,
      };
      return section;
    });

  const responseTemplateMarkdown = buildResponseTemplateMarkdown(consultation);

  return {
    title: consultation.title,
    meta: {
      packId,
      consultationId: consultation.id,
      ...(from ? { from } : {}),
    },
    sections: [...viewSections, ...questionSections],
    responseTemplateMarkdown,
  };
}

// ── buildResponseTemplateMarkdown ────────────────────────────────────────────

/**
 * Produces the editable Markdown response template the expert fills in.
 *
 * STABLE ANCHORS: each question has `[id: <questionId>]` in its section
 * heading.  The questionId is the machine key the CL-4 importer uses to
 * match answers back to questions.  The Q1 / Q2 numbers are for human
 * readability only.
 *
 * Example output:
 * ```
 * ## Consultation <packId> — responses
 * respondent: <your name>
 *
 * ### Q1 [id: <questionId>]
 * > (type your answer here)
 *
 * ### Q2 [id: <questionId>]
 * > (type your answer here)
 * ```
 */
export function buildResponseTemplateMarkdown(consultation: Consultation): string {
  const packId = consultation.id;

  const lines: string[] = [
    `## Consultation ${packId} — responses`,
    `respondent: <your name>`,
    ``,
  ];

  // M1: skip blank questions so the response template never carries an
  // unanswerable `### Qn` block. Numbering stays sequential over the non-blank
  // questions actually emitted.
  const answerable = consultation.questions.filter(q => q.text.trim().length > 0);
  for (let i = 0; i < answerable.length; i++) {
    const q = answerable[i];
    const num = i + 1;
    lines.push(`### Q${num} [id: ${q.id}]`);
    lines.push(`> (type your answer here)`);
    lines.push(``);
  }

  return lines.join('\n');
}
