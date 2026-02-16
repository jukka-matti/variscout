import React from 'react';
import { SpecsPopover as SpecsPopoverBase, specsPopoverAzureColorScheme } from '@variscout/ui';
import type { SpecsPopoverProps } from '@variscout/ui';

type Props = Omit<SpecsPopoverProps, 'colorScheme'>;

const SpecsPopover: React.FC<Props> = props => (
  <SpecsPopoverBase {...props} colorScheme={specsPopoverAzureColorScheme} />
);

export default SpecsPopover;
