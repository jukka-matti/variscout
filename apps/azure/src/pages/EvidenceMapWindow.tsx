/**
 * EvidenceMapWindow — Pop-out window for the Evidence Map
 *
 * Rendered at ?view=evidence-map route. Receives initial state via
 * localStorage hydration and ongoing sync via BroadcastChannel.
 *
 * Follows the same pattern as FindingsWindow and ImprovementWindow.
 */

import React, { useEffect, useRef, useState } from 'react';
import { EvidenceMap } from '@variscout/charts';
import type {
  FactorNodeData,
  RelationshipEdgeData,
  OutcomeNodeData,
  EquationData,
  CausalEdgeData,
  ConvergencePointData,
} from '@variscout/core/evidenceMap';

const HYDRATION_KEY = 'variscout_evidence_map_hydration';

interface HydrationState {
  outcomeNode: OutcomeNodeData | null;
  factorNodes: FactorNodeData[];
  relationshipEdges: RelationshipEdgeData[];
  equation: EquationData | null;
  causalEdges: CausalEdgeData[];
  convergencePoints: ConvergencePointData[];
}

function readHydrationState(): HydrationState | null {
  try {
    const raw = localStorage.getItem(HYDRATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function EvidenceMapWindow() {
  const [mapData, setMapData] = useState<HydrationState | null>(readHydrationState);
  const [isDark] = useState(() => localStorage.getItem('variscout_theme') === 'dark');
  const [highlightedFactor, setHighlightedFactor] = useState<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // BroadcastChannel for ongoing sync
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('variscout-sync');
    channelRef.current = channel;

    channel.onmessage = event => {
      const msg = event.data;
      if (msg.target && msg.target !== 'all' && msg.target !== 'evidence-map') return;

      switch (msg.type) {
        case 'evidence-map-update':
          setMapData(msg.payload);
          break;
        case 'factor-selected':
          setHighlightedFactor(msg.payload?.factor ?? null);
          break;
      }
    };

    // Send heartbeat
    const heartbeat = setInterval(() => {
      channel.postMessage({ type: 'heartbeat', source: 'evidence-map' });
    }, 5000);

    // Announce we're open
    channel.postMessage({ type: 'window-opened', source: 'evidence-map' });

    return () => {
      channel.postMessage({ type: 'window-closing', source: 'evidence-map' });
      clearInterval(heartbeat);
      channel.close();
      channelRef.current = null;
    };
  }, []);

  // Handle factor click — broadcast to main window via existing channel
  const handleFactorClick = (factor: string) => {
    channelRef.current?.postMessage({
      type: 'factor-selected',
      source: 'evidence-map',
      target: 'main',
      payload: { factor },
    });
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
