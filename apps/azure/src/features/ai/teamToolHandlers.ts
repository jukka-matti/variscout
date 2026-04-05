/**
 * Navigation + team-only tool handlers.
 *
 * navigate_to is hybrid (auto-execute or proposal). Team tools are
 * conditionally included when isTeamPlan() is true.
 */
import type { Finding, FilterAction, ActionProposal, ToolHandlerMap } from '@variscout/core';
import { hashFilterStack, generateProposalId } from '@variscout/core';
import { usePanelsStore } from '../panels/panelsStore';
import { useFindingsStore } from '../findings/findingsStore';
import { useInvestigationFeatureStore } from '../investigation/investigationStore';

export type NavigationTarget =
  | 'dashboard'
  | 'finding'
  | 'question'
  | 'chart'
  | 'improvement_workspace'
  | 'report';

export interface NavTeamToolDeps {
  findings: Finding[];
  filterStack: FilterAction[];
}

export function buildNavTeamToolHandlers({
  findings,
  filterStack,
}: NavTeamToolDeps): Partial<ToolHandlerMap> {
  const handlers: Partial<ToolHandlerMap> = {
    navigate_to: async (args: Record<string, unknown>) => {
      const target = args.target as NavigationTarget;
      const targetId = (args.target_id as string) || undefined;
      const restoreFilters = (args.restore_filters as boolean) ?? false;
      const chartType = args.chart_type as string;
      const factor = (args.factor as string) || undefined;

      if (restoreFilters && targetId) {
        const targetFinding = findings.find(f => f.id === targetId);
        const proposal: ActionProposal = {
          id: generateProposalId(),
          tool: 'navigate_to',
          params: { target, target_id: targetId, restore_filters: true, factor },
          preview: {
            findingText: targetFinding?.text,
            target,
            targetId,
          },
          status: 'pending',
          filterStackHash: hashFilterStack(filterStack),
          timestamp: Date.now(),
        };
        return JSON.stringify({ proposal: true, ...proposal });
      }

      const validTargets: NavigationTarget[] = [
        'dashboard',
        'finding',
        'question',
        'chart',
        'improvement_workspace',
        'report',
      ];
      if (!validTargets.includes(target)) {
        return JSON.stringify({ error: `Unknown navigation target: ${target}` });
      }

      const panels = usePanelsStore.getState();
      switch (target) {
        case 'dashboard':
          panels.showDashboard();
          break;
        case 'finding':
          panels.showInvestigation();
          if (targetId) {
            useFindingsStore.getState().setHighlightedFindingId(targetId);
          }
          break;
        case 'question':
          panels.showInvestigation();
          if (targetId) {
            useInvestigationFeatureStore.getState().expandToQuestion(targetId);
          }
          break;
        case 'chart':
          panels.showAnalysis();
          if (chartType) {
            panels.setPendingChartFocus(chartType);
          }
          break;
        case 'improvement_workspace':
          panels.showImprovement();
          break;
        case 'report':
          panels.showReport();
          break;
      }
      return JSON.stringify({
        navigated: target,
        ...(targetId && { id: targetId }),
        ...(chartType && { chartType }),
      });
    },
  };

  // Team-only sharing tools removed per ADR-059 (Teams SDK removed)

  return handlers;
}
