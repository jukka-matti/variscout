export interface ColumnShape {
  matched: string[];
  added: string[];
  missing: string[];
}

export function ColumnShapeSubSummary({ shape }: { shape: ColumnShape }) {
  return (
    <div className="text-sm space-y-1" data-testid="column-shape-summary">
      {shape.matched.length > 0 && (
        <div>
          <span className="text-green-700 font-medium">matched:</span> {shape.matched.join(', ')}
        </div>
      )}
      {shape.added.length > 0 && (
        <div>
          <span className="text-blue-700 font-medium">new:</span> {shape.added.join(', ')}
        </div>
      )}
      {shape.missing.length > 0 && (
        <div>
          <span className="text-amber-700 font-medium">missing:</span> {shape.missing.join(', ')}
        </div>
      )}
    </div>
  );
}
