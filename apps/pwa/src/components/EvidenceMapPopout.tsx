/**
 * EvidenceMapPopout — PWA pop-out window for Evidence Map (Layer 1 only)
 *
 * Rendered at ?view=evidence-map route. Shows statistical constellation only
 * (no causal links or synthesis — those are Azure features).
 */

import React, { useEffect, useState } from 'react';
import { EvidenceMapBase } from '@variscout/charts';
import type {
  FactorNodeData,
  RelationshipEdgeData,
  OutcomeNodeData,
  EquationData,
} from '@variscout/charts';

const HYDRATION_KEY = 'variscout_evidence_map_hydration';

interface HydrationState {
  outcomeNode: OutcomeNodeData | null;
  factorNodes: FactorNodeData[];
  relationshipEdges: RelationshipEdgeData[];
  equation: EquationData | null;
}

function readHydrationState(): HydrationState | null {
  try {
    const raw = localStorage.getItem(HYDRATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function EvidenceMapPopout() {
  const [mapData, setMapData] = useState<HydrationState | null>(readHydrationState);
  const [isDark] = useState(() => localStorage.getItem('variscout_theme') === 'dark');

  // BroadcastChannel for ongoing sync
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('variscout-sync');

    channel.onmessage = event => {
      const msg = event.data;
      if (msg.target && msg.target !== 'all' && msg.target !== 'evidence-map') return;
      if (msg.type === 'evidence-map-update') {
        setMapData(msg.payload);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const handleFactorClick = (factor: string) => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('variscout-sync');
    channel.postMessage({
      type: 'factor-selected',
      source: 'evidence-map',
      target: 'main',
      payload: { factor },
    });
    channel.close();
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
      <EvidenceMapBase
        parentWidth={window.innerWidth - 32}
        parentHeight={window.innerHeight - 32}
        outcomeNode={mapData.outcomeNode}
        factorNodes={mapData.factorNodes}
        relationshipEdges={mapData.relationshipEdges}
        equation={mapData.equation}
        onFactorClick={handleFactorClick}
        isDark={isDark}
      />
    </div>
  );
}

export default EvidenceMapPopout;
