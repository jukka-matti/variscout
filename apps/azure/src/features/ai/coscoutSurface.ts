import type { CoScoutSurface } from '@variscout/core';
import type { WorkspaceView } from '../../components/AppHeader';

type EditorActiveView = WorkspaceView | 'charter' | 'sustainment';

export function getCoScoutSurfaceForView(activeView: EditorActiveView): CoScoutSurface | null {
  switch (activeView) {
    case 'frame':
      return 'process';
    case 'explore':
      return 'explore';
    case 'analyze':
      return 'analyze';
    case 'report':
      return 'report';
    default:
      return null;
  }
}
