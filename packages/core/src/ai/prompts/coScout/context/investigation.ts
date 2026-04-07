/**
 * Investigation context formatter for CoScout Tier 2 (semi-static context).
 *
 * Formats investigation state into human-readable text blocks.
 * CRITICAL: Uses ONLY suspectedCauseHubs — ignores legacy causeRole-based
 * suspectedCauses from question fields (contradiction resolution #1).
 */

import type { AIContext } from '../../../types';

/** Minimum R²adj coverage for a suspected cause hub to be considered sufficiently evidenced */
export const EVIDENCE_SUFFICIENCY_THRESHOLD = 0.25;

/**
 * Format investigation context into a human-readable text block for CoScout.
 *
 * Includes:
 * - Problem statement with stage
 * - Question tree summary (counts by status, top 3 by priority)
 * - Suspected cause hubs (ONLY hub entities, not legacy causeRole)
 * - Evidence Map topology summary
 * - Causal links
 *
 * Returns empty string when no investigation context is available.
 */
export function formatInvestigationContext(
  investigation: AIContext['investigation'] | undefined
): string {
  if (!investigation) return '';

  const lines: string[] = [];

  // Phase transition announcement — prepended before everything else
  if (
    investigation.previousPhase &&
    investigation.phase &&
    investigation.previousPhase !== investigation.phase
  ) {
    lines.push(`⚡ Phase transition: ${investigation.previousPhase} → ${investigation.phase}`);
    if (investigation.transitionReason) {
      lines.push(investigation.transitionReason);
    }
  }

  // Problem statement with stage
  if (investigation.liveStatement) {
    const stage = investigation.problemStatementStage
      ? ` (${investigation.problemStatementStage})`
      : '';
    lines.push(`Problem: "${investigation.liveStatement}"${stage}`);
  } else if (investigation.problemStatement?.fullText) {
    const stage = investigation.problemStatementStage
      ? ` (${investigation.problemStatementStage})`
      : '';
    lines.push(`Problem: "${investigation.problemStatement.fullText}"${stage}`);
  }

  // Question tree summary
  if (investigation.questionTree && investigation.questionTree.length > 0) {
    const statusCounts: Record<string, number> = {};
    for (const q of investigation.questionTree) {
      statusCounts[q.status] = (statusCounts[q.status] || 0) + 1;
      if (q.children) {
        for (const child of q.children) {
          statusCounts[child.status] = (statusCounts[child.status] || 0) + 1;
        }
      }
    }

    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const statusParts = Object.entries(statusCounts)
      .map(([status, count]) => `${count} ${status}`)
      .join(', ');
    lines.push(`Questions: ${total} total (${statusParts})`);

    // Top 3 open questions by priority (open status, factor-linked first)
    const openQuestions = investigation.questionTree.filter(q => q.status === 'open').slice(0, 3);
    if (openQuestions.length > 0) {
      const topList = openQuestions
        .map(q => {
          const factorTag = q.factor ? ` [${q.factor}]` : '';
          return `  - "${q.text}"${factorTag}`;
        })
        .join('\n');
      lines.push(`Top open questions:\n${topList}`);
    }
  }

  // Suspected cause hubs (ONLY hub entities — not legacy causeRole)
  if (investigation.suspectedCauseHubs && investigation.suspectedCauseHubs.length > 0) {
    const hubLines = investigation.suspectedCauseHubs.map(hub => {
      const parts = [`  - "${hub.name}" [${hub.status}]`];
      if (hub.questionCount > 0 || hub.findingCount > 0) {
        parts.push(`(${hub.questionCount}Q, ${hub.findingCount}F)`);
      }
      if (hub.evidence) {
        parts.push(`evidence: ${hub.evidence.label}`);
      }
      if (hub.selectedForImprovement) {
        parts.push('[selected for improvement]');
      }
      return parts.join(' ');
    });
    lines.push(`Suspected cause hubs:\n${hubLines.join('\n')}`);

    // Evidence sufficiency warning: check coveragePercent or per-hub rSquaredAdj
    const coverage = investigation.coveragePercent;
    if (coverage !== undefined && coverage < EVIDENCE_SUFFICIENCY_THRESHOLD * 100) {
      const openCount =
        investigation.questionsTotal !== undefined && investigation.questionsChecked !== undefined
          ? investigation.questionsTotal - investigation.questionsChecked
          : undefined;
      const openSuffix =
        openCount !== undefined && openCount > 0
          ? ` Consider investigating the ${openCount} remaining open question${openCount === 1 ? '' : 's'}.`
          : '';
      lines.push(
        `⚠ Evidence note: Combined suspected causes explain ~${Math.round(coverage)}% of variation — significant sources may remain unexplored.${openSuffix}`
      );
    } else if (coverage === undefined) {
      // Fall back to per-hub rSquaredAdj when coveragePercent is not set
      for (const hub of investigation.suspectedCauseHubs) {
        const hubR2 = hub.evidence?.value;
        if (hubR2 !== undefined && hubR2 < EVIDENCE_SUFFICIENCY_THRESHOLD) {
          const pct = Math.round(hubR2 * 100);
          const openCount =
            investigation.questionsTotal !== undefined &&
            investigation.questionsChecked !== undefined
              ? investigation.questionsTotal - investigation.questionsChecked
              : undefined;
          const openSuffix =
            openCount !== undefined && openCount > 0
              ? ` Consider investigating the ${openCount} remaining open question${openCount === 1 ? '' : 's'}.`
              : '';
          lines.push(
            `⚠ Evidence note: Hub "${hub.name}" explains ~${pct}% of variation — significant sources may remain unexplored.${openSuffix}`
          );
        }
      }
    }
  }

  // Evidence Map topology summary
  if (investigation.evidenceMapTopology) {
    const topo = investigation.evidenceMapTopology;
    const nodeCount = topo.factorNodes.length;
    const edgeCount = topo.relationships.length;
    const convergenceCount = topo.convergencePoints.length;
    const exploredCount = topo.factorNodes.filter(n => n.explored).length;

    let mapLine = `Evidence Map: ${nodeCount} factor nodes`;
    if (exploredCount < nodeCount) {
      mapLine += ` (${exploredCount} explored)`;
    }
    mapLine += `, ${edgeCount} relationships`;
    if (convergenceCount > 0) {
      mapLine += `, ${convergenceCount} convergence points`;
    }
    lines.push(mapLine);
  }

  // Causal links
  if (investigation.causalLinks && investigation.causalLinks.length > 0) {
    const linkLines = investigation.causalLinks.map(
      l => `  - ${l.fromFactor} \u2192 ${l.toFactor} [${l.direction}] (${l.evidenceType})`
    );
    lines.push(`Causal links:\n${linkLines.join('\n')}`);
  }

  // Interaction effects
  if (investigation.interactionEffects?.length) {
    const significant = investigation.interactionEffects.filter(ie => ie.deltaRSquaredAdj > 0.02);
    if (significant.length > 0) {
      lines.push('Interaction effects detected:');
      for (const ie of significant) {
        const deltaStr = Number.isFinite(ie.deltaRSquaredAdj)
          ? (ie.deltaRSquaredAdj * 100).toFixed(1)
          : '?';
        const pStr = Number.isFinite(ie.pValue) ? ie.pValue.toFixed(3) : '?';
        lines.push(
          `- ${ie.factors[0]} \u00d7 ${ie.factors[1]}: ${ie.plainLanguage} (\u0394R\u00b2adj=${deltaStr}%, p=${pStr})`
        );
      }
    }
  }

  // Coverage and progress
  if (investigation.coveragePercent !== undefined) {
    const checked =
      investigation.questionsChecked !== undefined && investigation.questionsTotal !== undefined
        ? ` (${investigation.questionsChecked}/${investigation.questionsTotal} questions checked)`
        : '';
    lines.push(`Investigation coverage: ${Math.round(investigation.coveragePercent)}%${checked}`);
  }

  if (lines.length === 0) return '';

  return `── Investigation Context ──\n${lines.join('\n')}`;
}
