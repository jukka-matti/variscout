export type TimelineWindow =
  | { kind: 'fixed'; startISO: string; endISO: string }
  | { kind: 'rolling'; windowDays: number }
  | { kind: 'openEnded'; startISO: string }
  | { kind: 'cumulative' };

export type TimelineWindowKind = TimelineWindow['kind'];

export function isFixedWindow(w: TimelineWindow): w is Extract<TimelineWindow, { kind: 'fixed' }> {
  return w.kind === 'fixed';
}
export function isRollingWindow(
  w: TimelineWindow
): w is Extract<TimelineWindow, { kind: 'rolling' }> {
  return w.kind === 'rolling';
}
export function isOpenEndedWindow(
  w: TimelineWindow
): w is Extract<TimelineWindow, { kind: 'openEnded' }> {
  return w.kind === 'openEnded';
}
export function isCumulativeWindow(
  w: TimelineWindow
): w is Extract<TimelineWindow, { kind: 'cumulative' }> {
  return w.kind === 'cumulative';
}
