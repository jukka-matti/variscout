export interface TimelinePreviewProps {
  existing?: { startISO: string; endISO: string };
  incoming?: { startISO: string; endISO: string };
  overlap?: { startISO: string; endISO: string };
}

export function TimelinePreview({ existing, incoming, overlap }: TimelinePreviewProps) {
  const all: number[] = [];
  for (const r of [existing, incoming, overlap]) {
    if (!r) continue;
    all.push(new Date(r.startISO).getTime(), new Date(r.endISO).getTime());
  }
  if (all.length === 0) return null;

  let min = Infinity;
  let max = -Infinity;
  for (const t of all) {
    if (t < min) min = t;
    if (t > max) max = t;
  }
  const span = max - min || 1;

  const seg = (
    range: { startISO: string; endISO: string } | undefined,
    color: string,
    testId: string
  ) => {
    if (!range) return null;
    const left = ((new Date(range.startISO).getTime() - min) / span) * 100;
    const width = Math.max(
      1,
      ((new Date(range.endISO).getTime() - new Date(range.startISO).getTime()) / span) * 100
    );
    return (
      <div
        data-testid={testId}
        className={`absolute h-3 ${color} rounded`}
        style={{ left: `${left}%`, width: `${width}%` }}
      />
    );
  };

  return (
    <div
      className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded my-2"
      data-testid="timeline-preview"
    >
      {seg(existing, 'bg-green-400', 'timeline-existing')}
      {seg(incoming, 'bg-blue-400', 'timeline-incoming')}
      {seg(overlap, 'bg-orange-400', 'timeline-overlap')}
    </div>
  );
}
