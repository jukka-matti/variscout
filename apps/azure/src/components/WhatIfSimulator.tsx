import React, { forwardRef } from 'react';
import {
  WhatIfSimulator as WhatIfSimulatorBase,
  type WhatIfSimulatorProps,
  type WhatIfSimulatorHandle,
} from '@variscout/ui';

/**
 * Azure WhatIfSimulator — forwards ref to shared @variscout/ui component.
 */
const WhatIfSimulator = forwardRef<WhatIfSimulatorHandle, WhatIfSimulatorProps>((props, ref) => (
  <WhatIfSimulatorBase ref={ref} {...props} />
));

WhatIfSimulator.displayName = 'WhatIfSimulator';

export default WhatIfSimulator;
export type { WhatIfSimulatorProps, WhatIfSimulatorHandle };
export type { SimulatorPreset } from '@variscout/ui';
