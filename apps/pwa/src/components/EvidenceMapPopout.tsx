/**
 * EvidenceMapPopout — PWA pop-out window for Evidence Map (Layer 1 only)
 *
 * Rendered at ?view=evidence-map route. Shows statistical constellation only
 * (no causal links or synthesis — those are Azure features).
 */

import React, { useEffect, useState } from 'react';
import { EvidenceMap } from '@variscout/charts';
import { usePopoutChannel, HYDRATION_KEYS } from '@variscout/hooks';
import type {
  EvidenceMapSyncMessage,
  FactorSelectedMessage,
  EvidenceMapSyncData,
} from '@variscout/hooks';

export function EvidenceMapPopout() {
  const [isDark] = useState(() => localStorage.getItem('variscout_theme') === 'dark');

  const { lastMessage, sendMessage, hydrationData } = usePopoutChannel<
    EvidenceMapSyncMessage | FactorSelectedMessage
  >({
    windowId: 'evidence-map',
    hydrationKey: HYDRATION_KEYS.evidenceMap,
  });

  const [mapData, setMapData] = useState<EvidenceMapSyncData | null>(null);

  useEffect(() => {
    if (hydrationData) setMapData(hydrationData as EvidenceMapSyncData);
  }, [hydrationData]);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === 'evidence-map-update') {
      setMapData((lastMessage as EvidenceMapSyncMessage).payload);
    }
  }, [lastMessage]);

  const handleFactorClick = (factor: string) => {
    sendMessage({ type: 'factor-selected', target: 'main', payload: { factor } });
  };

  if (!mapData) {
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
      >
        <p>Waiting for data...</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', padding: 16 }}>
      <div style={{ width: '100%', height: '100%' }}>
        <EvidenceMap
          outcomeNode={mapData.outcomeNode}
          factorNodes={mapData.factorNodes}
          relationshipEdges={mapData.relationshipEdges}
          equation={mapData.equation}
          onFactorClick={handleFactorClick}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

export default EvidenceMapPopout;
