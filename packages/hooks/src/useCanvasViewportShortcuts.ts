import { useEffect } from 'react';
import { useCanvasViewportStore, type ProcessHubId } from '@variscout/stores';
import type { CanvasLevel } from '@variscout/core/canvas';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable ||
    target.contentEditable === 'true' ||
    target.getAttribute('contenteditable') === 'true'
  );
}

function fitNowAndAfterRender(
  fitToContent: (hubId: ProcessHubId, targetLevel?: CanvasLevel) => void,
  hubId: ProcessHubId,
  targetLevel?: CanvasLevel
): void {
  fitToContent(hubId, targetLevel);
  if (typeof window.requestAnimationFrame !== 'function') return;
  window.requestAnimationFrame(() => {
    const viewport = useCanvasViewportStore.getState().getViewport(hubId);
    if (targetLevel === 'l3' && !viewport.focalStepId) return;
    fitToContent(hubId, targetLevel);
  });
}

export function useCanvasViewportShortcuts({
  hubId,
  disabled = false,
  fitToContent: fitToContentOverride,
}: {
  hubId: ProcessHubId;
  disabled?: boolean;
  fitToContent?: (hubId: ProcessHubId, targetLevel?: CanvasLevel) => void;
}): void {
  const storeFitToContent = useCanvasViewportStore(s => s.fitToContent);
  const fitToContent = fitToContentOverride ?? storeFitToContent;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;
      if (event.defaultPrevented || isEditableTarget(event.target)) return;
      if (!event.metaKey && !event.ctrlKey) return;

      if (event.key === '1') {
        event.preventDefault();
        fitNowAndAfterRender(fitToContent, hubId, 'l1');
        return;
      }

      if (event.key === '2') {
        event.preventDefault();
        fitNowAndAfterRender(fitToContent, hubId, 'l2');
        return;
      }

      if (event.key === '3') {
        const viewport = useCanvasViewportStore.getState().getViewport(hubId);
        if (!viewport.focalStepId) return;

        event.preventDefault();
        fitNowAndAfterRender(fitToContent, hubId, 'l3');
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        fitNowAndAfterRender(fitToContent, hubId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, fitToContent, hubId]);
}
