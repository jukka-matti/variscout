/**
 * useDataRouter — Multi-level SCOUT V1 router hook.
 *
 * Resolves the active analysis-mode strategy and asks its dataRouter which
 * data hook (`useFilteredData` vs `useProductionLineGlanceData`) and which
 * transforms apply for the given (scope × phase × window × context) tuple.
 *
 * The hook returns metadata only — callers are responsible for invoking the
 * named hook themselves. This keeps useDataRouter cheap and avoids conditional
 * hook calls (which React forbids).
 */

import { useMemo } from 'react';
import type { TimelineWindow } from '@variscout/core';
import type { AnalysisMode, SpecLookupContext } from '@variscout/core/types';
import {
  getStrategy,
  resolveMode,
  type RouterArgs,
  type RouterResult,
  type RouterScope,
  type RouterPhase,
} from '@variscout/core/strategy';

export interface UseDataRouterArgs {
  mode: AnalysisMode;
  /** Forwarded to resolveMode (e.g. `{ standardIChartMetric: 'capability' }`). */
  modeOptions?: { standardIChartMetric?: string };
  scope: RouterScope;
  phase: RouterPhase;
  window: TimelineWindow;
  context: SpecLookupContext;
}

const FALLBACK: RouterResult = { hook: 'useFilteredData' };

export function useDataRouter(args: UseDataRouterArgs): RouterResult {
  const resolved = useMemo(
    () => resolveMode(args.mode, args.modeOptions),
    [args.mode, args.modeOptions]
  );
  const strategy = useMemo(() => getStrategy(resolved), [resolved]);

  return useMemo(() => {
    const router = strategy.dataRouter;
    if (!router) return FALLBACK;
    const routerArgs: RouterArgs = {
      scope: args.scope,
      phase: args.phase,
      window: args.window,
      context: args.context,
    };
    const out = router(routerArgs);
    // Normalize: callers may rely on transforms being defined.
    return { transforms: [], ...out };
  }, [strategy, args.scope, args.phase, args.window, args.context]);
}
