/**
 * INVESTIGATE phase coaching — question-driven EDA, Evidence Map, hub synthesis.
 *
 * The analyst is building an investigation tree, validating evidence, and
 * synthesizing suspected causes. This is the longest phase with three sub-phases:
 * diverging (explore), validating (assess evidence), converging (synthesize).
 */

import type { AnalysisMode } from '../../../../types';
import type { InvestigationPhase, EntryScenario } from '../../../types';

const MODE_QUESTION_GUIDANCE: Record<AnalysisMode, string> = {
  standard: `Question and evidence guidance:
- Factor-linked questions get auto-answered by ANOVA: eta-squared >= 15% = answered, < 5% = ruled-out, 5-15% = investigating.
- Rank investigation priorities by R-squared-adj from Best Subsets regression.
- When a data-answered question has weak evidence (p >= 0.05), suggest gemba or expert validation.
- Evidence strength = R-squared-adj contribution from the factor in the regression model.`,

  yamazumi: `Question and evidence guidance:
- Frame questions around waste elimination: "Does [activity] contribute significant waste at [station]?"
- Evidence strength = waste percentage contribution. A station with > 20% waste is a strong signal.
- Questions can be validated by time study observation (gemba) — suggest timing specific activities.
- Lean questions: "Can this NVA Required activity be automated?", "What causes wait time at this station?"`,

  performance: `Question and evidence guidance:
- Frame questions around channel health: "Why does channel [X] have lower Cpk than its neighbors?"
- Evidence strength = Cpk deviation from the fleet average.
- Suggest checking whether bad channels share maintenance history, position, or operating conditions.
- Cross-channel questions: "Is the same root cause affecting multiple channels?"`,
};

const SUB_PHASE_COACHING: Record<InvestigationPhase, string> = {
  initial: `Sub-phase: Initial — The investigation is just starting. Factor Intelligence has ranked which factors to check first. Help the analyst:
- Review the top-ranked questions from Factor Intelligence.
- Formulate their concern clearly using Watson's questions (What? Where? When? Scope?).
- Point out what the problem statement still needs — the first significant factor from data.`,

  diverging: `Sub-phase: Diverging — The investigation is exploring broadly. Some questions have been answered, new follow-up questions are emerging. Help the analyst:
- Check open questions systematically, starting with the highest-ranked ones.
- Encourage checking unexplored factors — mention coverage progress if available.
- Suggest gemba walks or expert input for factors that data alone cannot explain.
- Create follow-up sub-questions when answers reveal deeper layers.`,

  validating: `Sub-phase: Validating — Evidence is building. Some questions are answered, some ruled out. Help the analyst:
- Focus on evidence quality — suggest gemba validation for statistical findings.
- Suggest expert input where data is inconclusive.
- When you see 2+ answered questions pointing to the same mechanism, use suggest_suspected_cause to help them name it.
- Validate each evidence type: data (auto eta-squared), gemba (go-see observation), expert (domain knowledge).`,

  converging: `Sub-phase: Converging — The investigation is narrowing down to suspected causes. Help the analyst:
- Name suspected causes — use suggest_suspected_cause when you see evidence clustering.
- Connect new evidence to existing hubs with connect_hub_evidence.
- Highlight coverage progress — which areas have been thoroughly investigated vs gaps.
- Begin transitioning to improvement thinking: "What would it take to address this cause?"`,

  improving: `Sub-phase: Improving — Transitioned to the IMPROVE phase. See IMPROVE coaching.`,
};

/**
 * Build coaching instructions for the INVESTIGATE phase.
 *
 * INVESTIGATE is the core analytical phase with question trees, evidence validation,
 * Evidence Map interactions, and hub synthesis. Sub-phase awareness drives the
 * specific guidance CoScout provides.
 */
export function buildInvestigateCoaching(
  mode: AnalysisMode,
  investigationPhase?: InvestigationPhase,
  entryScenario?: EntryScenario
): string {
  const parts: string[] = [];

  parts.push(`## INVESTIGATE Phase Coaching
The analyst is in the INVESTIGATE phase — building questions, gathering evidence, and synthesizing causes.

${MODE_QUESTION_GUIDANCE[mode]}`);

  // Sub-phase specific coaching
  if (investigationPhase && SUB_PHASE_COACHING[investigationPhase]) {
    parts.push(SUB_PHASE_COACHING[investigationPhase]);
  }

  // Question tree mechanics
  parts.push(`Question tree guidance:
- Root questions (parent_id=null) start new lines of inquiry.
- Sub-questions (parent_id=existing_id) break down causes into deeper layers.
- Never create sub-questions more than 3 levels deep or more than 8 siblings per parent.
- Link questions to factors whenever possible — this enables auto-answering via ANOVA.
- For questions that cannot be tested with data, set validation_type to "gemba" or "expert" with a clear validation_task.
- Never advise "collect more data and wait" — suggest gemba or expert validation instead.`);

  // Evidence Map coaching
  parts.push(`Evidence Map coaching:
- When you see interaction terms with delta-R-squared > 2%, consider suggesting a causal link using suggest_causal_link.
- When you see a convergence point (factor with 2+ incoming causal links) without a SuspectedCause hub, suggest creating one.
- When you see a causal link with evidenceType "unvalidated", suggest what evidence would validate it (gemba observation, expert consultation, or additional data).
- Use [REF:evidence-node:FACTOR_NAME]factor text[/REF] to create clickable highlights on the Evidence Map.
- Use [REF:evidence-edge:LINK_ID]link description[/REF] to highlight a specific causal link on the map.`);

  // Hub synthesis coaching (validating + converging)
  if (investigationPhase === 'validating' || investigationPhase === 'converging') {
    parts.push(`Hub synthesis coaching:
- When 2+ answered questions point to the same root cause, use suggest_suspected_cause to name the mechanism.
- Each suspected cause hub connects related questions and findings into a named mechanism.
- Evidence validation types: data (auto eta-squared), gemba (go-see + photos), expert (domain knowledge).
- Multiple suspected causes are normal — real investigations often identify several contributing factors.
- Use causeRole classification: "suspected-cause" for strong evidence, "contributing" for moderate, "ruled-out" for eliminated.
- Ruled-out factors are valuable negative learnings — always acknowledge what was checked and eliminated.`);
  }

  // Entry scenario routing for INVESTIGATE
  if (entryScenario === 'problem') {
    parts.push(
      `Entry scenario (problem): Guide the analyst to check open questions systematically, starting with the highest-ranked ones. Create follow-up questions as answers emerge.`
    );
  } else if (entryScenario === 'exploration') {
    parts.push(
      `Entry scenario (exploration): The upfront theory should be the root question. Suggest follow-up questions based on answers. Explore whether other factors interact with the theory factor.`
    );
  } else if (entryScenario === 'routine') {
    parts.push(
      `Entry scenario (routine): Only reached if the analyst manually created a finding. Follow their lead — do not push an investigation agenda.`
    );
  }

  return parts.join('\n\n');
}
