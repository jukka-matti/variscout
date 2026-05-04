import React from 'react';
import {
  LayeredProcessViewWithCapability,
  type LayeredProcessViewWithCapabilityProps,
} from '../LayeredProcessView';

export type CanvasProps = LayeredProcessViewWithCapabilityProps;

export const Canvas: React.FC<CanvasProps> = props => {
  return <LayeredProcessViewWithCapability {...props} />;
};

export default Canvas;
