/**
 * CL-4: Parser → store integration test.
 *
 * Verifies the no-mutation-without-accept invariant:
 * feeding parser output through importResponse produces only pending insights;
 * findings is untouched until acceptInsight is explicitly called.
 *
 * Lives in @variscout/stores because core cannot import stores
 * (dependency direction rule: core → hooks → ui → apps).
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { useAnalyzeStore } from '../analyzeStore';
import { parseMarkdownResponse } from '@variscout/core/consultations';
import type { Consultation } from '@variscout/core/consultations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTemplate(
  consultationId: string,
  questions: Array<{ id: string }>,
  answers: Record<string, string | null> = {}
): string {
  const lines: string[] = [
    `## Consultation ${consultationId} — responses`,
    `respondent: J. Operator`,
    ``,
  ];
  questions.forEach((q, i) => {
    const num = i + 1;
    lines.push(`### Q${num} [id: ${q.id}]`);
    const answer = answers[q.id];
    if (answer === null) {
      lines.push(`> (type your answer here)`);
    } else if (answer !== undefined) {
      lines.push(`> ${answer}`);
    } else {
      lines.push(`> (type your answer here)`);
    }
    lines.push(``);
  });
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parser → store: no-mutation-without-accept invariant', () => {
  beforeEach(() => {
    useAnalyzeStore.setState(
      (useAnalyzeStore as unknown as { getInitialState: () => object }).getInitialState()
    );
  });

  it('importResponse with parsed output produces only pending insights; findings is untouched', () => {
    // Create a consultation in the store
    const storeConsultation = useAnalyzeStore.getState().createConsultation('Line 3 drift');

    // Add questions to it
    useAnalyzeStore.getState().addConsultationQuestion(
      storeConsultation.id,
      'Does Monday startup differ?'
    );
    useAnalyzeStore.getState().addConsultationQuestion(
      storeConsultation.id,
      'Is the oven preheated?'
    );

    // Read back the store consultation with its auto-generated question IDs
    const storeQ = useAnalyzeStore.getState().consultations[0];
    const q1Id = storeQ.questions[0].id;
    const q2Id = storeQ.questions[1].id;

    // Build a Consultation object matching the store entity for the parser
    const consultationForParser: Consultation = {
      ...storeQ,
    };

    // Build a filled template using the exact question IDs
    const raw = buildTemplate(
      storeConsultation.id,
      [{ id: q1Id }, { id: q2Id }],
      {
        [q1Id]: 'Cold oven on Mondays.',
        [q2Id]: 'No preheat on weekends.',
      }
    );

    // Parse deterministically
    const parsed = parseMarkdownResponse(raw, consultationForParser);

    expect(parsed.respondentLabel).toBe('J. Operator');
    expect(parsed.insights).toHaveLength(2);

    // Feed through the store's importResponse action
    useAnalyzeStore.getState().importResponse(storeConsultation.id, {
      source: 'typed',
      respondentLabel: parsed.respondentLabel,
      insights: parsed.insights,
    });

    const updated = useAnalyzeStore.getState().consultations[0];

    // All insights must be PENDING — none accepted yet
    expect(updated.proposedInsights).toHaveLength(2);
    updated.proposedInsights.forEach(insight => {
      expect(insight.status).toBe('pending');
    });

    // Findings MUST NOT be touched — only acceptInsight creates a Finding
    expect(useAnalyzeStore.getState().findings).toHaveLength(0);
  });

  it('acceptInsight after parsing creates an expert Finding with provenance', () => {
    const storeConsultation = useAnalyzeStore.getState().createConsultation('Monday drift');
    useAnalyzeStore.getState().addConsultationQuestion(
      storeConsultation.id,
      'Is the oven preheated?'
    );

    const storeQ = useAnalyzeStore.getState().consultations[0];
    const q1Id = storeQ.questions[0].id;

    const consultationForParser: Consultation = { ...storeQ };
    const raw = buildTemplate(storeConsultation.id, [{ id: q1Id }], {
      [q1Id]: 'The oven is never preheated on Monday mornings.',
    });

    const parsed = parseMarkdownResponse(raw, consultationForParser);
    useAnalyzeStore.getState().importResponse(storeConsultation.id, {
      source: 'typed',
      respondentLabel: parsed.respondentLabel,
      insights: parsed.insights,
    });

    // Findings still empty before accept
    expect(useAnalyzeStore.getState().findings).toHaveLength(0);

    // Accept the single insight
    const insight = useAnalyzeStore.getState().consultations[0].proposedInsights[0];
    const finding = useAnalyzeStore.getState().acceptInsight(storeConsultation.id, insight.id);

    // Now a Finding exists with expert evidence type and consultation provenance
    expect(useAnalyzeStore.getState().findings).toHaveLength(1);
    expect(finding.evidenceType).toBe('expert');
    expect(finding.provenance).toMatchObject({
      kind: 'consultation',
      consultationId: storeConsultation.id,
      respondentLabel: 'J. Operator',
    });

    // Insight is marked accepted
    const acceptedInsight = useAnalyzeStore.getState().consultations[0].proposedInsights[0];
    expect(acceptedInsight.status).toBe('accepted');
    expect(acceptedInsight.acceptedAs).toEqual({ kind: 'finding', id: finding.id });
  });
});
