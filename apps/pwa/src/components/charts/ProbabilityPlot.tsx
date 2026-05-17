import React from 'react';
import { withParentSize } from '@visx/responsive';
import { ProbabilityPlot, type ProbabilityPlotProps } from '@variscout/ui';

// PWA defaults to showing branding (free tier per ADR-082 wedge); Azure does not.
const ProbabilityPlotPwa = ({ showBranding = true, ...props }: ProbabilityPlotProps) => (
  <ProbabilityPlot {...props} showBranding={showBranding} />
);

export default withParentSize(ProbabilityPlotPwa);
