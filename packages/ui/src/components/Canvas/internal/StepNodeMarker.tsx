import { Flag } from 'lucide-react';
import type { Hypothesis } from '@variscout/core';

export interface StepNodeMarkerHub {
  id: string;
  name: string;
  status: Hypothesis['status'];
}

export interface StepNodeMarkerProps {
  hubs: ReadonlyArray<StepNodeMarkerHub>;
  onClick: () => void;
}

export function StepNodeMarker({ hubs, onClick }: StepNodeMarkerProps) {
  if (hubs.length === 0) return null;

  const anyOpen = hubs.some(hub => hub.status !== 'confirmed' && hub.status !== 'refuted');
  const colorClasses = anyOpen
    ? 'border-status-warning bg-status-warning-soft text-status-warning'
    : 'border-status-info bg-status-info-soft text-status-info';
  const names = hubs.map(hub => hub.name).join(', ');

  return (
    <button
      type="button"
      data-testid="step-node-marker"
      aria-label={`${hubs.length} promoted ${hubs.length === 1 ? 'hypothesis' : 'hypotheses'}: ${names}`}
      title={names}
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      className={[
        'inline-flex h-5 items-center gap-1 rounded-full border px-1.5 text-[11px] font-medium',
        colorClasses,
      ].join(' ')}
    >
      <Flag aria-hidden="true" size={10} />
      <span>{hubs.length}</span>
    </button>
  );
}
