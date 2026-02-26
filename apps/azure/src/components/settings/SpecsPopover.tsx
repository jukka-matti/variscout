import React from 'react';
import { SpecsPopover as SpecsPopoverBase } from '@variscout/ui';
import type { SpecsPopoverProps } from '@variscout/ui';

type Props = Omit<SpecsPopoverProps, 'colorScheme'>;

const SpecsPopover: React.FC<Props> = props => <SpecsPopoverBase {...props} />;

export default SpecsPopover;
