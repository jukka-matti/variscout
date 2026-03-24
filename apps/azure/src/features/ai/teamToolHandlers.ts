/**
 * Navigation + team-only tool handlers.
 *
 * navigate_to is hybrid (auto-execute or proposal). Team tools are
 * conditionally included when isTeamPlan() is true.
 */
import type {
  StatsResult,
  DataRow,
  Finding,
  FilterAction,
  ActionProposal,
  ToolHandlerMap,
} from '@variscout/core';
import { isTeamPlan, hashFilterStack, generateProposalId } from '@variscout/core';
import { usePanelsStore } from '../panels/panelsStore';
import { useFindingsStore } from '../findings/findingsStore';
import { useInvestigationStore } from '../investigation/investigationStore';

export type NavigationTarget =
  | 'dashboard'
  | 'finding'
  | 'hypothesis'
  | 'chart'
  | 'improvement_workspace'
  | 'report';

export interface NavTeamToolDeps {
  stats?: StatsResult;
  filteredData: DataRow[];
  findings: Finding[];
  filterStack: FilterAction[];
}

export function buildNavTeamToolHandlers({
  stats,
  filteredData,
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
        'hypothesis',
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
          panels.showEditor();
          panels.setFindingsOpen(true);
          if (targetId) {
            useFindingsStore.getState().setHighlightedFindingId(targetId);
          }
          break;
        case 'hypothesis':
          panels.showEditor();
          panels.setFindingsOpen(true);
          if (targetId) {
            useInvestigationStore.getState().expandToHypothesis(targetId);
          }
          break;
        case 'chart':
          panels.showEditor();
          if (chartType) {
            panels.setPendingChartFocus(chartType);
          }
          break;
        case 'improvement_workspace':
          panels.showEditor();
          panels.setImprovementOpen(true);
          break;
        case 'report':
          panels.showEditor();
          panels.openReport();
          break;
      }
      return JSON.stringify({
        navigated: target,
        ...(targetId && { id: targetId }),
        ...(chartType && { chartType }),
      });
    },
  };

  // Team-only sharing tools
  if (isTeamPlan()) {
    handlers.share_finding = async (args: Record<string, unknown>) => {
      const findingId = args.finding_id as string;
      if (!findingId) return JSON.stringify({ error: 'Missing finding_id' });
      const targetFinding = findings.find(f => f.id === findingId);
      if (!targetFinding) return JSON.stringify({ error: `Finding not found: ${findingId}` });

      const proposal: ActionProposal = {
        id: generateProposalId(),
        tool: 'share_finding',
        params: { finding_id: findingId },
        preview: {
          findingText: targetFinding.text,
          stats: { mean: stats?.mean, cpk: stats?.cpk, samples: filteredData.length },
        },
        status: 'pending',
        filterStackHash: hashFilterStack(filterStack),
        timestamp: Date.now(),
      };
      return JSON.stringify({ proposal: true, ...proposal });
    };

    handlers.publish_report = async () => {
      const proposal: ActionProposal = {
        id: generateProposalId(),
        tool: 'publish_report',
        params: {},
        preview: {
          findingCount: findings.length,
        },
        status: 'pending',
        filterStackHash: hashFilterStack(filterStack),
        timestamp: Date.now(),
      };
      return JSON.stringify({ proposal: true, ...proposal });
    };

    handlers.notify_action_owners = async (args: Record<string, unknown>) => {
      const findingId = args.finding_id as string;
      if (!findingId) return JSON.stringify({ error: 'Missing finding_id' });
      const targetFinding = findings.find(f => f.id === findingId);
      if (!targetFinding) return JSON.stringify({ error: `Finding not found: ${findingId}` });

      const actions = targetFinding.actions ?? [];
      const assignedActions = actions.filter(a => a.assignee);
      const unassignedCount = actions.length - assignedActions.length;

      const proposal: ActionProposal = {
        id: generateProposalId(),
        tool: 'notify_action_owners',
        params: { finding_id: findingId },
        preview: {
          findingText: targetFinding.text,
          actions: assignedActions.map(a => ({
            text: a.text,
            assigneeDisplayName: a.assignee?.displayName,
            dueDate: a.dueDate,
          })),
          unassignedCount,
        },
        status: 'pending',
        filterStackHash: hashFilterStack(filterStack),
        timestamp: Date.now(),
      };
      return JSON.stringify({ proposal: true, ...proposal });
    };
  }

  return handlers;
}
