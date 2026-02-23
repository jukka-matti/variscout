import React from 'react';
import {
  PasteScreenBase,
  pasteScreenAzureColorScheme,
  type PasteScreenBaseProps,
} from '@variscout/ui';

/**
 * Azure PasteScreen — uses Azure slate color scheme from @variscout/ui
 */
const PasteScreen: React.FC<Omit<PasteScreenBaseProps, 'colorScheme'>> = props => (
  <PasteScreenBase {...props} colorScheme={pasteScreenAzureColorScheme} />
);

export default PasteScreen;
