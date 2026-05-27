const PREFIX = 'column:';

export function encodeColumnDragId(columnName: string): string {
  return `${PREFIX}${columnName}`;
}

export function isColumnDragId(value: unknown): value is `column:${string}` {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function decodeColumnDragId(value: string): string | null {
  if (!isColumnDragId(value)) return null;
  return value.slice(PREFIX.length);
}
