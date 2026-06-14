import React from 'react';
import { withResponsiveSize } from '@variscout/charts';
import { ProbabilityPlot, type ProbabilityPlotProps } from '@variscout/ui';

// PWA defaults to showing branding (free tier per ADR-082 wedge); Azure does not.
const ProbabilityPlotPwa = ({ showBranding = true, ...props }: ProbabilityPlotProps) => (
  <ProbabilityPlot {...props} showBranding={showBranding} />
);

export default withResponsiveSize(ProbabilityPlotPwa);
