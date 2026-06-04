import { useAnalysisScopeStore } from '@variscout/stores';

export type ChipNavigationTarget =
  | { kind: 'outcome'; columnName: string; stepId?: string }
  | {
      kind: 'factor';
      columnName: string;
      stepId?: string;
      /**
       * CS-13 crossing-back — when the firing surface knows the investigation
       * outcome (the Analyze Wall does; the Process-tab chips don't), carry it
       * so Explore lands on the full local y=f(x), not factor-vs-whatever-Y-
       * Explore-last-had. Optional: omitting preserves chip-path behavior.
       */
      outcomeColumn?: string;
    }
  | { kind: 'step'; stepId: string };

export function navigateToExploreForChip(
  target: ChipNavigationTarget,
  onNavigateToExplore: () => void
): void {
  const scope = useAnalysisScopeStore.getState();

  switch (target.kind) {
    case 'outcome':
      scope.setY(target.columnName);
      if (target.stepId) scope.setStepId(target.stepId);
      break;
    case 'factor':
      if (target.outcomeColumn) scope.setY(target.outcomeColumn);
      scope.setBoxplotFactor(target.columnName);
      if (target.stepId) scope.setStepId(target.stepId);
      break;
    case 'step':
      scope.setStepId(target.stepId);
      break;
  }

  onNavigateToExplore();
}
