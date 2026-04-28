/**
 * LayeredProcessViewWithCapability — composition wrapper.
 *
 * Mounts ProductionLineGlanceDashboard inside LayeredProcessView's Operations
 * band slot, the dashboard's filter strip above the Outcome band, and a
 * "Show/Hide temporal trends" affordance for progressive reveal.
 *
 * Pure props-based composition — state (mode, filter) owned by the consumer.
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
 * section "Three surfaces / 1. LayeredProcessView Operations band".
 */
import React from 'react';
import { LayeredProcessView, type LayeredProcessViewProps } from './LayeredProcessView';
import { ProductionLineGlanceDashboard } from '../ProductionLineGlanceDashboard/ProductionLineGlanceDashboard';
import {
  ProductionLineGlanceFilterStrip,
  type ProductionLineGlanceFilterStripProps,
} from '../ProductionLineGlanceDashboard/ProductionLineGlanceFilterStrip';
import type { ProductionLineGlanceDashboardProps } from '../ProductionLineGlanceDashboard/types';

export type ProductionLineGlanceOpsMode = 'spatial' | 'full';

export interface LayeredProcessViewWithCapabilityProps extends Omit<
  LayeredProcessViewProps,
  'operationsBandContent' | 'filterStripContent'
> {
  data: Pick<
    ProductionLineGlanceDashboardProps,
    'cpkTrend' | 'cpkGapTrend' | 'capabilityNodes' | 'errorSteps'
  >;
  filter: ProductionLineGlanceFilterStripProps;
  mode: ProductionLineGlanceOpsMode;
  onModeChange: (next: ProductionLineGlanceOpsMode) => void;
  onStepClick?: (nodeId: string) => void;
}

export const LayeredProcessViewWithCapability: React.FC<LayeredProcessViewWithCapabilityProps> = ({
  data,
  filter,
  mode,
  onModeChange,
  onStepClick,
  ...layeredProps
}) => {
  const isFull = mode === 'full';
  const affordanceLabel = isFull ? 'Hide temporal trends' : 'Show temporal trends';
  const affordanceArrow = isFull ? '↓' : '↑';

  return (
    <LayeredProcessView
      {...layeredProps}
      filterStripContent={<ProductionLineGlanceFilterStrip {...filter} />}
      operationsBandContent={
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onModeChange(isFull ? 'spatial' : 'full')}
            className="self-start rounded text-xs font-medium text-content-secondary transition-colors hover:text-content"
          >
            {affordanceLabel} {affordanceArrow}
          </button>
          <div data-testid="ops-band-dashboard">
            <ProductionLineGlanceDashboard {...data} mode={mode} onStepClick={onStepClick} />
          </div>
        </div>
      }
    />
  );
};

export default LayeredProcessViewWithCapability;
