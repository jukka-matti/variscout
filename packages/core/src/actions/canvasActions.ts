// Re-export the existing CanvasAction from canvas/types.ts as-is.
// R2: discriminator is `kind` with SCREAMING_SNAKE_CASE — the canvas
// convention was the source-of-truth that drove the whole-union alignment.
export type { CanvasAction } from '../canvas/types';
