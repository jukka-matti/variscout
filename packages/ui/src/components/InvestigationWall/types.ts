export interface Point {
  x: number;
  y: number;
}

export type WallStatus = 'proposed' | 'evidenced' | 'confirmed' | 'refuted';
