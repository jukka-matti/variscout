import { useMemo } from 'react';
import { useInvestigationStore, useWallLayoutStore } from '@variscout/stores';
import type { Finding, Question, Hypothesis } from '@variscout/core';
import type { ProcessMap } from '@variscout/core/frame';

export interface UseSharedWallPropsArgs {
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
  const hubs = useInvestigationStore(s => s.hypotheses);
  const questions = useInvestigationStore(s => s.questions);
  const zoom = useWallLayoutStore(s => s.zoom);
  const pan = useWallLayoutStore(s => s.pan);
  const groupByTributary = useWallLayoutStore(s => s.groupByTributary);

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
