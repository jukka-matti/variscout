import React from 'react';
import { PasteScreenBase, type PasteScreenBaseProps } from '@variscout/ui';

/**
 * PWA PasteScreen — uses default semantic color scheme from @variscout/ui
 */
const PasteScreen: React.FC<Omit<PasteScreenBaseProps, 'colorScheme'>> = props => (
  <PasteScreenBase {...props} />
);

export default PasteScreen;
