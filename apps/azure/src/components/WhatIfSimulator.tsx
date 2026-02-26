import React, { forwardRef } from 'react';
import {
  WhatIfSimulator as WhatIfSimulatorBase,
  type WhatIfSimulatorProps,
  type WhatIfSimulatorHandle,
} from '@variscout/ui';

/**
 * Azure WhatIfSimulator — wraps @variscout/ui. Uses default semantic-token-based color scheme.
 */
const WhatIfSimulator = forwardRef<
  WhatIfSimulatorHandle,
  Omit<WhatIfSimulatorProps, 'colorScheme'>
>((props, ref) => <WhatIfSimulatorBase ref={ref} {...props} />);

WhatIfSimulator.displayName = 'WhatIfSimulator';

export default WhatIfSimulator;
export type { WhatIfSimulatorProps, WhatIfSimulatorHandle };
export type { SimulatorPreset } from '@variscout/ui';
