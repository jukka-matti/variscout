/**
 * useToolHandlers - Thin composer for CoScout tool handler modules.
 *
 * Merges read, action, and navigation/team tool handlers into a single
 * ToolHandlerMap for CoScout function calling (ADR-028, ADR-029).
 *
 * Logic lives in:
 * - readToolHandlers.ts   — 7 auto-execute data tools
 * - actionToolHandlers.ts — 7 proposal-returning action tools
 * - teamToolHandlers.ts   — navigate_to + 3 team-only tools
 */
import { useMemo } from 'react';
import type {
  ToolHandlerMap,
  StatsResult,
  SpecLimits,
  DataRow,
  Finding,
  Question,
  FilterAction,
} from '@variscout/core';
import type { UseKnowledgeSearchReturn } from '@variscout/hooks';
import { buildReadToolHandlers } from './readToolHandlers';
import { buildActionToolHandlers } from './actionToolHandlers';
import { buildNavTeamToolHandlers } from './teamToolHandlers';

export type { NavigationTarget } from './teamToolHandlers';

export interface UseToolHandlersOptions {
  aiAvailable: boolean;
  coscoutEnabled: boolean;
  stats?: StatsResult;
  filteredData: DataRow[];
  rawData?: DataRow[];
  outcome?: string | null;
  specs?: SpecLimits;
  findings: Finding[];
  questions: Question[];
  factors: string[];
  filters: Record<string, (string | number)[]>;
  filterStack: FilterAction[];
  knowledgeSearch: UseKnowledgeSearchReturn;
}

export function useToolHandlers({
  aiAvailable,
  coscoutEnabled,
  stats,
  filteredData,
  rawData,
  outcome,
  specs,
  findings,
  questions,
  factors,
  filters,
  filterStack,
  knowledgeSearch,
}: UseToolHandlersOptions): ToolHandlerMap | undefined {
  return useMemo((): ToolHandlerMap | undefined => {
    if (!aiAvailable || !coscoutEnabled) return undefined;

    const readTools = buildReadToolHandlers({
      stats,
      filteredData,
      outcome,
      specs,
      findings,
      questions,
      factors,
      filters,
      knowledgeSearch,
    });

    const actionTools = buildActionToolHandlers({
      stats,
      filteredData,
      rawData,
      outcome,
      specs,
      findings,
      questions,
      filters,
      filterStack,
    });

    const navTeamTools = buildNavTeamToolHandlers({
      stats,
      filteredData,
      findings,
      filterStack,
    });

    return { ...readTools, ...actionTools, ...navTeamTools } as ToolHandlerMap;
  }, [
    aiAvailable,
    coscoutEnabled,
    stats,
    filteredData,
    rawData,
    outcome,
    factors,
    filters,
    filterStack,
    specs,
    findings,
    questions,
    knowledgeSearch,
  ]);
}
