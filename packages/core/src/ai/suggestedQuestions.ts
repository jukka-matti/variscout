/**
 * Build context-aware suggested questions for the CoScoutPanel.
 * Deterministic — no AI call. Examines AIContext and returns 3-5 questions.
 */

import type { AIContext } from './types';

const FALLBACK_QUESTIONS = [
  'What does this analysis tell me?',
  'What should I look at next?',
  'How do I interpret the I-Chart?',
];

const INVESTIGATION_FALLBACK_QUESTIONS = [
  'Summarize the investigation progress',
  'What should we investigate next?',
  'Are any hypotheses contradicted by the data?',
];

/** Phase-specific questions for hypothesis investigation */
const PHASE_QUESTIONS: Record<string, string[]> = {
  initial: [
    'Which chart should I examine first?',
    'What does the data suggest about possible causes?',
  ],
  diverging: [
    'What other causes should we consider?',
    "Are there factors we haven't explored yet?",
    'What gemba checks would help narrow things down?',
  ],
  validating: [
    'Which untested hypotheses are highest priority?',
    'How can we validate the remaining hypotheses?',
  ],
  converging: [
    'Do the supported hypotheses form a coherent story?',
    'What improvement options could reduce this variation?',
    "What's the simplest change to improve process capability?",
  ],
  acting: [
    'Are the corrective actions addressing the root cause?',
    'What does the Capability chart show — is Cpk improving?',
  ],
};

export function buildSuggestedQuestions(context: AIContext): string[] {
  // Investigation mode — different question set when on investigation page
  if (context.investigation) {
    return buildInvestigationQuestions(context);
  }

  const questions: string[] = [];

  // Out-of-control points
  if (context.violations && context.violations.outOfControl > 0) {
    const n = context.violations.outOfControl;
    questions.push(`Why are there ${n} out-of-control point${n > 1 ? 's' : ''}?`);
  }

  // Low Cpk
  if (context.stats?.cpk !== undefined && context.stats.cpk < 1.33) {
    questions.push(`How can I improve Cpk from ${context.stats.cpk.toFixed(2)}?`);
  }

  // Active filters
  if (context.filters.length > 0) {
    const filterValue = context.filters[0].values[0];
    if (filterValue !== undefined) {
      questions.push(`What makes ${String(filterValue)} different from others?`);
    }
  }

  // Findings with key drivers
  if (context.findings && context.findings.total > 0 && context.findings.keyDrivers.length > 0) {
    const driver = context.findings.keyDrivers[0];
    questions.push(`What should I investigate about ${driver}?`);
  }

  // Stable process
  if (context.stats?.cpk !== undefined && context.stats.cpk >= 1.33) {
    questions.push('Is this process stable enough to reduce inspection?');
  }

  // Cap at 5, pad with fallbacks to minimum 3
  const capped = questions.slice(0, 5);
  let fallbackIdx = 0;
  while (capped.length < 3 && fallbackIdx < FALLBACK_QUESTIONS.length) {
    const fb = FALLBACK_QUESTIONS[fallbackIdx];
    if (!capped.includes(fb)) {
      capped.push(fb);
    }
    fallbackIdx++;
  }

  return capped.slice(0, 5);
}

function buildInvestigationQuestions(context: AIContext): string[] {
  const inv = context.investigation!;
  const questions: string[] = [];

  // Phase-aware questions (highest priority)
  if (inv.phase && PHASE_QUESTIONS[inv.phase]) {
    const phaseQs = PHASE_QUESTIONS[inv.phase];
    questions.push(phaseQs[0]);
    if (phaseQs.length > 1 && questions.length < 3) {
      questions.push(phaseQs[1]);
    }
  }

  // Progress-aware
  if (inv.progressPercent !== undefined && inv.progressPercent < 100) {
    questions.push(`We're at ${Math.round(inv.progressPercent)}% of the target — what's missing?`);
  }

  // Hypothesis-aware — converging with supported hypotheses gets IDEOI questions
  if (inv.allHypotheses && inv.allHypotheses.length > 0) {
    const supported = inv.allHypotheses.filter(h => h.status === 'supported');
    const untested = inv.allHypotheses.filter(h => h.status === 'untested');

    if (supported.length > 0 && inv.phase === 'converging') {
      // IDEOI-specific: improvement ideation for supported hypotheses
      const ideasOnSupported = supported[0].ideas;
      if (ideasOnSupported && ideasOnSupported.length > 0) {
        // Idea-aware questions when ideas exist
        const firstIdea = ideasOnSupported[0];
        if (questions.length < 4) {
          questions.push(`Is the projected improvement from "${firstIdea.text}" realistic?`);
        }
        if (questions.length < 5) {
          questions.push('Which idea has the best effort-to-impact ratio?');
        }
      } else {
        // No ideas yet — prompt for ideation
        if (questions.length < 4) {
          questions.push(`What improvement options could address "${supported[0].text}"?`);
        }
        if (supported[0].contribution !== undefined && questions.length < 5) {
          questions.push('How might we reduce variation from this factor?');
        }
      }
    } else if (supported.length > 0 && questions.length < 4) {
      questions.push(`What actions would address "${supported[0].text}"?`);
    }

    if (untested.length > 0 && questions.length < 4) {
      questions.push(`How can we test the hypothesis: "${untested[0].text}"?`);
    }
  }

  // Uncovered investigation categories (diverge assistant)
  if (inv.phase === 'diverging' && inv.hypothesisTree) {
    // Prefer dynamic categories from investigation context
    const coveredCategories = new Set(
      inv.hypothesisTree.filter(h => h.category).map(h => h.category!)
    );
    const allCategories = inv.categories
      ? inv.categories.map(c => c.name)
      : ['Equipment', 'Temporal', 'People', 'Material', 'Location'];
    const uncovered = allCategories.filter(c => !coveredCategories.has(c));
    if (uncovered.length > 0 && questions.length < 5) {
      questions.push(`Have you considered ${uncovered[0]} factors?`);
    }
  }

  // Selected finding
  if (inv.selectedFinding) {
    if (questions.length < 4) {
      questions.push(`What do SOPs say about this type of issue?`);
    }
    if (inv.selectedFinding.projection && questions.length < 5) {
      questions.push(`Is this projection realistic?`);
    }
  }

  // Pad with investigation fallbacks
  const capped = questions.slice(0, 5);
  let idx = 0;
  while (capped.length < 3 && idx < INVESTIGATION_FALLBACK_QUESTIONS.length) {
    const fb = INVESTIGATION_FALLBACK_QUESTIONS[idx];
    if (!capped.includes(fb)) capped.push(fb);
    idx++;
  }

  return capped.slice(0, 5);
}
