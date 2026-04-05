import React, { useCallback, useRef, useState } from 'react';
import { EvidenceMapBase } from '@variscout/charts';
import { useEvidenceMapData } from '@variscout/hooks';
import type { UseEvidenceMapDataOptions } from '@variscout/hooks';
import { usePanelsStore } from '../../features/panels/panelsStore';

interface InvestigationMapViewProps {
  /** All options for useEvidenceMapData EXCEPT containerSize (computed internally) */
  mapOptions: Omit<UseEvidenceMapDataOptions, 'containerSize'>;
}

export const InvestigationMapView: React.FC<InvestigationMapViewProps> = ({ mapOptions }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const mapData = useEvidenceMapData({ ...mapOptions, containerSize });

  const handleFactorClick = useCallback((factor: string) => {
    usePanelsStore.getState().setHighlightedFactor(factor);
  }, []);

  return (
    <div ref={containerRef} className="flex-1 min-h-0 bg-surface-secondary relative">
      {mapData.isEmpty ? (
        <div className="flex items-center justify-center h-full text-content-tertiary text-sm">
          Select at least 2 factors to see the Evidence Map
        </div>
      ) : (
        <EvidenceMapBase
          parentWidth={containerSize.width}
          parentHeight={containerSize.height}
          outcomeNode={mapData.outcomeNode}
          factorNodes={mapData.factorNodes}
          relationshipEdges={mapData.relationshipEdges}
          equation={mapData.equation}
          causalEdges={mapData.causalEdges}
          convergencePoints={mapData.convergencePoints}
          enableZoom
          onFactorClick={handleFactorClick}
        />
      )}
    </div>
  );
};
