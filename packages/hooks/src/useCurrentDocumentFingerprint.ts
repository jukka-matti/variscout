import type { ProcessHub } from '@variscout/core';
import {
  buildDocumentSnapshot,
  documentSnapshotFingerprint,
  useAnalyzeStore,
  useCanvasStore,
  useImprovementProjectStore,
  useProjectStore,
} from '@variscout/stores';

export function useCurrentDocumentFingerprint(activeHub?: ProcessHub | null): string {
  useProjectStore(state => state);
  useAnalyzeStore(state => state);
  useCanvasStore(state => state.canonicalMap);
  useCanvasStore(state => state.outcomes);
  useCanvasStore(state => state.primaryScopeDimensions);
  useCanvasStore(state => state.canonicalMapVersion);
  useImprovementProjectStore(state =>
    activeHub
      ? Object.values(state.projectsById).find(
          project => project.hubId === activeHub.id && project.deletedAt === null
        )
      : null
  );

  return documentSnapshotFingerprint(buildDocumentSnapshot({ activeHub }));
}
