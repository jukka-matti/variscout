import { useMemo } from 'react';
import { useCanvasViewportStore, useAnalyzeStore } from '@variscout/stores';
import type { Finding, Question, Hypothesis } from '@variscout/core';
import type { ProcessHubId } from '@variscout/core/processHub';
import type { ProcessMap } from '@variscout/core/frame';

const DEFAULT_WALL_PAN = { x: 0, y: 0 };

export interface UseSharedWallPropsArgs {
  hubId: ProcessHubId;
  findings: Finding[];
  processMap: ProcessMap | undefined;
  problemCpk: number;
  eventsPerWeek: number;
  activeColumns: ReadonlyArray<string> | undefined;
}

export interface UseSharedWallPropsReturn {
  hubs: Hypothesis[];
  findings: Finding[];
  questions: Question[];
  processMap: ProcessMap | undefined;
  problemCpk: number;
  eventsPerWeek: number;
  activeColumns: ReadonlyArray<string> | undefined;
  zoom: number;
  pan: { x: number; y: number };
  groupByTributary: boolean;
}

export function useSharedWallProps(args: UseSharedWallPropsArgs): UseSharedWallPropsReturn {
  const hubs = useAnalyzeStore(s => s.hypotheses);
  const questions = useAnalyzeStore(s => s.questions);
  const zoom = useCanvasViewportStore(s => s.viewports[args.hubId]?.zoom ?? 1);
  const pan = useCanvasViewportStore(s => s.viewports[args.hubId]?.pan ?? DEFAULT_WALL_PAN);
  const groupByTributary = useCanvasViewportStore(
    s => s.viewports[args.hubId]?.groupByTributary ?? false
  );

  return useMemo(
    () => ({
      hubs,
      findings: args.findings,
      questions,
      processMap: args.processMap,
      problemCpk: args.problemCpk,
      eventsPerWeek: args.eventsPerWeek,
      activeColumns: args.activeColumns,
      zoom,
      pan,
      groupByTributary,
    }),
    [
      hubs,
      questions,
      args.findings,
      args.processMap,
      args.problemCpk,
      args.eventsPerWeek,
      args.activeColumns,
      zoom,
      pan,
      groupByTributary,
    ]
  );
}
