import { useEffect } from 'react';
import { useCanvasViewportStore, type ProcessHubId } from '@variscout/stores';

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

export function useCanvasViewportShortcuts({
  hubId,
  disabled = false,
}: {
  hubId: ProcessHubId;
  disabled?: boolean;
}): void {
  const fitToContent = useCanvasViewportStore(s => s.fitToContent);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;
      if (event.defaultPrevented || isEditableTarget(event.target)) return;
      if (!event.metaKey && !event.ctrlKey) return;

      if (event.key === '1') {
        event.preventDefault();
        fitToContent(hubId, 'l1');
        return;
      }

      if (event.key === '2') {
        event.preventDefault();
        fitToContent(hubId, 'l2');
        return;
      }

      if (event.key === '3') {
        const viewport = useCanvasViewportStore.getState().getViewport(hubId);
        if (!viewport.focalStepId) return;

        event.preventDefault();
        fitToContent(hubId, 'l3');
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        fitToContent(hubId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, fitToContent, hubId]);
}
