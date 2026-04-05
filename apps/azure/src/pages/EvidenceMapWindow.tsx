/**
 * EvidenceMapWindow — Pop-out window for the Evidence Map
 *
 * Rendered at ?view=evidence-map route. Receives initial state via
 * localStorage hydration and ongoing sync via BroadcastChannel.
 *
 * Follows the same pattern as FindingsWindow and ImprovementWindow.
 */

import React, { useEffect, useState } from 'react';
import { EvidenceMap } from '@variscout/charts';
import { usePopoutChannel, HYDRATION_KEYS } from '@variscout/hooks';
import type {
  EvidenceMapSyncMessage,
  FactorSelectedMessage,
  EvidenceMapSyncData,
} from '@variscout/hooks';

export function EvidenceMapWindow() {
  const [isDark] = useState(() => localStorage.getItem('variscout_theme') === 'dark');
  const [highlightedFactor, setHighlightedFactor] = useState<string | null>(null);

  const { lastMessage, sendMessage, hydrationData } = usePopoutChannel<
    EvidenceMapSyncMessage | FactorSelectedMessage
  >({
    windowId: 'evidence-map',
    hydrationKey: HYDRATION_KEYS.evidenceMap,
    heartbeatInterval: 5000,
  });

  const [mapData, setMapData] = useState<EvidenceMapSyncData | null>(null);

  useEffect(() => {
    if (hydrationData) setMapData(hydrationData as EvidenceMapSyncData);
  }, [hydrationData]);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === 'evidence-map-update') {
      setMapData((lastMessage as EvidenceMapSyncMessage).payload);
    } else if (lastMessage.type === 'factor-selected') {
      setHighlightedFactor((lastMessage as FactorSelectedMessage).payload?.factor ?? null);
    }
  }, [lastMessage]);

  const handleFactorClick = (factor: string) => {
    sendMessage({ type: 'factor-selected', target: 'main', payload: { factor } });
  };

  if (!mapData) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-primary text-content">
        <div className="text-center">
          <p className="text-lg font-medium">Evidence Map</p>
          <p className="text-sm text-content-secondary mt-2">
            Waiting for data from main window...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-surface-primary overflow-hidden">
      <div className="h-full w-full p-4" style={{ width: '100%', height: '100%' }}>
        <EvidenceMap
          outcomeNode={mapData.outcomeNode}
          factorNodes={mapData.factorNodes}
          relationshipEdges={mapData.relationshipEdges}
          equation={mapData.equation}
          causalEdges={mapData.causalEdges}
          convergencePoints={mapData.convergencePoints}
          highlightedFactor={highlightedFactor}
          onFactorClick={handleFactorClick}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

export default EvidenceMapWindow;
