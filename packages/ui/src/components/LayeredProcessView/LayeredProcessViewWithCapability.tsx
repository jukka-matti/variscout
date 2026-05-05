/**
 * LayeredProcessViewWithCapability — legacy composition wrapper.
 *
 * Canvas is the canonical FRAME surface. This wrapper remains public during
 * the canvas migration and delegates to Canvas without changing props.
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
 * section "Three surfaces / 1. LayeredProcessView Operations band".
 */
import React from 'react';
import { Canvas, type CanvasProps, type ProductionLineGlanceOpsMode } from '../Canvas';

export type { ProductionLineGlanceOpsMode };

export type LayeredProcessViewWithCapabilityProps = CanvasProps;

export const LayeredProcessViewWithCapability: React.FC<LayeredProcessViewWithCapabilityProps> = ({
  ...props
}) => {
  return <Canvas {...props} />;
};

export default LayeredProcessViewWithCapability;
