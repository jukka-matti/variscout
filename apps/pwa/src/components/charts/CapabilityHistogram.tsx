import React from 'react';
import { withParentSize } from '@visx/responsive';
import { CapabilityHistogram, type CapabilityHistogramProps } from '@variscout/ui';

// PWA defaults to showing branding (free tier per ADR-082 wedge); Azure does not.
const CapabilityHistogramPwa = ({ showBranding = true, ...props }: CapabilityHistogramProps) => (
  <CapabilityHistogram {...props} showBranding={showBranding} />
);

export default withParentSize(CapabilityHistogramPwa);
