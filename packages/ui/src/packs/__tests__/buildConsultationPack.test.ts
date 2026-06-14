/**
 * CL-3: Tests for buildConsultationPack + buildResponseTemplateMarkdown
 *
 * Test intent:
 * - Every question becomes a question PackSection carrying its id + text.
 * - Views map to condition/chart PackSection kinds.
 * - meta.packId and meta.consultationId are set from the consultation.
 * - buildResponseTemplateMarkdown contains one [id: <questionId>] anchor per
 *   question, and those anchor ids EXACTLY equal the consultation's question ids
 *   (round-trip key stability).
 */
import { describe, expect, it } from 'vitest';
import { createConsultation, createConsultationQuestion } from '@variscout/core/consultations';
import {
  buildConsultationPack,
  buildResponseTemplateMarkdown,
  type ResolvedView,
} from '../buildConsultationPack';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeConsultation() {
  const c = createConsultation('Why does Line 3 drift on Mondays?');
  const q1 = createConsultationQuestion('Does the Monday startup differ?', {
    kind: 'hypothesis',
    id: 'hyp-1',
  });
  const q2 = createConsultationQuestion('What is the machine warm-up time?');
  return {
    ...c,
    questions: [q1, q2],
  };
}

const conditionView: ResolvedView = {
  kind: 'condition',
  label: 'Day_of_Week = Monday',
  statsText: 'Cpk 0.77 · 12 events',
};

const chartView: ResolvedView = {
  kind: 'chart',
  title: 'Individual Values — Line 3',
  chartType: 'ichart',
  data: [
    { x: 1, y: 10.2 },
    { x: 2, y: 10.5 },
  ],
  mean: 10.2,
  ucl: 11.0,
  lcl: 9.4,
  width: 480,
  height: 240,
};

// ── buildConsultationPack ────────────────────────────────────────────────────

describe('buildConsultationPack', () => {
  it('sets meta.packId equal to consultation.id and meta.consultationId', () => {
    const consultation = makeConsultation();
    const model = buildConsultationPack({ consultation, views: [] });

    expect(model.meta.packId).toBe(consultation.id);
    expect(model.meta.consultationId).toBe(consultation.id);
  });

  it('carries the consultation title as the pack title', () => {
    const consultation = makeConsultation();
    const model = buildConsultationPack({ consultation, views: [] });

    expect(model.title).toBe('Why does Line 3 drift on Mondays?');
  });

  it('propagates the optional from field into meta', () => {
    const consultation = makeConsultation();
    const model = buildConsultationPack({
      consultation,
      views: [],
      from: 'Anna Analyst',
    });

    expect(model.meta.from).toBe('Anna Analyst');
  });

  it('maps each question to a question PackSection with the correct id + text', () => {
    const consultation = makeConsultation();
    const model = buildConsultationPack({ consultation, views: [] });

    const questionSections = model.sections.filter(s => s.kind === 'question');
    expect(questionSections).toHaveLength(2);

    const [q1, q2] = questionSections as Array<{
      kind: 'question';
      questionId: string;
      text: string;
    }>;
    expect(q1.questionId).toBe(consultation.questions[0].id);
    expect(q1.text).toBe('Does the Monday startup differ?');
    expect(q2.questionId).toBe(consultation.questions[1].id);
    expect(q2.text).toBe('What is the machine warm-up time?');
  });

  it('maps a condition view to a condition PackSection', () => {
    const consultation = makeConsultation();
    const model = buildConsultationPack({
      consultation,
      views: [conditionView],
    });

    const conditionSections = model.sections.filter(s => s.kind === 'condition');
    expect(conditionSections).toHaveLength(1);
    const cs = conditionSections[0] as { kind: 'condition'; label: string; statsText: string };
    expect(cs.label).toBe('Day_of_Week = Monday');
    expect(cs.statsText).toBe('Cpk 0.77 · 12 events');
  });

  it('maps a chart view to a chart PackSection', () => {
    const consultation = makeConsultation();
    const model = buildConsultationPack({
      consultation,
      views: [chartView],
    });

    const chartSections = model.sections.filter(s => s.kind === 'chart');
    expect(chartSections).toHaveLength(1);
    const cs = chartSections[0] as { kind: 'chart'; title: string; chartType: string };
    expect(cs.title).toBe('Individual Values — Line 3');
    expect(cs.chartType).toBe('ichart');
  });

  it('places views before question sections in the output', () => {
    const consultation = makeConsultation();
    const model = buildConsultationPack({
      consultation,
      views: [conditionView, chartView],
    });

    const kinds = model.sections.map(s => s.kind);
    const firstQuestion = kinds.indexOf('question');
    const lastView = Math.max(kinds.lastIndexOf('condition'), kinds.lastIndexOf('chart'));
    // All views come before all questions.
    expect(lastView).toBeLessThan(firstQuestion);
  });

  it('sets responseTemplateMarkdown on the model', () => {
    const consultation = makeConsultation();
    const model = buildConsultationPack({ consultation, views: [] });

    expect(typeof model.responseTemplateMarkdown).toBe('string');
    expect(model.responseTemplateMarkdown!.length).toBeGreaterThan(0);
  });

  it('handles a consultation with no questions (no question sections)', () => {
    const consultation = createConsultation('Empty consultation');
    const model = buildConsultationPack({ consultation, views: [] });

    const questionSections = model.sections.filter(s => s.kind === 'question');
    expect(questionSections).toHaveLength(0);
  });

  it('derives anchorLabel as "<kind> <id>" for a question WITH an anchor', () => {
    const q = createConsultationQuestion('Does the Monday startup differ?', {
      kind: 'hypothesis',
      id: 'hyp-1',
    });
    const consultation = { ...createConsultation('Line 3 drift'), questions: [q] };
    const model = buildConsultationPack({ consultation, views: [] });

    const questionSections = model.sections.filter(s => s.kind === 'question') as Array<{
      kind: 'question';
      questionId: string;
      text: string;
      anchorLabel?: string;
    }>;
    expect(questionSections).toHaveLength(1);
    // Builder derives anchorLabel as `${anchor.kind} ${anchor.id}`.
    expect(questionSections[0].anchorLabel).toBe('hypothesis hyp-1');
  });

  it('leaves anchorLabel undefined for a question WITHOUT an anchor', () => {
    const q = createConsultationQuestion('What is the machine warm-up time?');
    const consultation = { ...createConsultation('Line 3 drift'), questions: [q] };
    const model = buildConsultationPack({ consultation, views: [] });

    const questionSections = model.sections.filter(s => s.kind === 'question') as Array<{
      kind: 'question';
      questionId: string;
      text: string;
      anchorLabel?: string;
    }>;
    expect(questionSections).toHaveLength(1);
    expect(questionSections[0].anchorLabel).toBeUndefined();
  });
});

// ── buildResponseTemplateMarkdown ────────────────────────────────────────────

describe('buildResponseTemplateMarkdown', () => {
  it('contains one [id: <questionId>] anchor per question', () => {
    const consultation = makeConsultation();
    const md = buildResponseTemplateMarkdown(consultation);

    for (const q of consultation.questions) {
      expect(md).toContain(`[id: ${q.id}]`);
    }
  });

  it('anchor ids EXACTLY equal the consultation question ids (round-trip key stability)', () => {
    const consultation = makeConsultation();
    const md = buildResponseTemplateMarkdown(consultation);

    // Extract all [id: ...] anchors from the template.
    const anchorRe = /\[id: ([^\]]+)\]/g;
    const found: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = anchorRe.exec(md)) !== null) {
      found.push(m[1]);
    }

    // Must have exactly as many anchors as questions.
    expect(found).toHaveLength(consultation.questions.length);

    // Each anchor must equal the real question id — order-stable.
    for (let i = 0; i < consultation.questions.length; i++) {
      expect(found[i]).toBe(consultation.questions[i].id);
    }
  });

  it('includes human-readable Q1, Q2 numbering alongside machine ids', () => {
    const consultation = makeConsultation();
    const md = buildResponseTemplateMarkdown(consultation);

    expect(md).toContain('Q1');
    expect(md).toContain('Q2');
  });

  it('includes a respondent placeholder line', () => {
    const consultation = makeConsultation();
    const md = buildResponseTemplateMarkdown(consultation);

    expect(md.toLowerCase()).toMatch(/respondent/);
  });

  it('includes the packId (=consultation id) in the heading', () => {
    const consultation = makeConsultation();
    const md = buildResponseTemplateMarkdown(consultation);

    // The heading references the pack/consultation id.
    expect(md).toContain(consultation.id);
  });

  it('produces an empty anchor list for a no-question consultation', () => {
    const consultation = createConsultation('Empty');
    const md = buildResponseTemplateMarkdown(consultation);

    const anchorRe = /\[id: ([^\]]+)\]/g;
    const found: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = anchorRe.exec(md)) !== null) {
      found.push(m[1]);
    }
    expect(found).toHaveLength(0);
  });
});
