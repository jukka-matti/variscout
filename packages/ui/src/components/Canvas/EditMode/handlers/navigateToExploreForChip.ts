import { useAnalysisScopeStore } from '@variscout/stores';

export type ChipNavigationTarget =
  | { kind: 'outcome'; columnName: string; stepId?: string }
  | { kind: 'factor'; columnName: string; stepId?: string }
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
      scope.setBoxplotFactor(target.columnName);
      if (target.stepId) scope.setStepId(target.stepId);
      break;
    case 'step':
      scope.setStepId(target.stepId);
      break;
  }

  onNavigateToExplore();
}
