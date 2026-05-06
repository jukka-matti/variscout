/**
 * useEvidenceMapTimeline — timeline animation hook for report view replay.
 *
 * Builds a chronological sequence of frames from investigation artifacts
 * (causal links, suspected causes, questions, findings) and provides
 * play/pause/seek controls for animated replay in the report view.
 *
 * Each frame represents a point in time showing which factors, links,
 * and hubs were visible at that moment in the investigation.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { CausalLink, Question, Finding, SuspectedCause } from '@variscout/core/findings';

// ============================================================================
// Types
// ============================================================================

/** A single frame in the timeline animation. */
export interface TimelineFrame {
  /** ISO timestamp for this frame */
  timestamp: string;
  /** Human-readable label (e.g., "Day 1", "Mar 15", or artifact name) */
  label: string;
  /** Factor names visible up to this frame */
  visibleFactors: string[];
  /** CausalLink IDs visible up to this frame */
  visibleLinks: string[];
  /** SuspectedCause IDs visible up to this frame */
  visibleHubs: string[];
}

export interface UseEvidenceMapTimelineOptions {
  /** Causal links with createdAt timestamps */
  causalLinks?: CausalLink[];
  /** Investigation questions with createdAt timestamps */
  questions?: Question[];
  /** Findings with createdAt timestamps (numeric, converted to ISO) */
  findings?: Finding[];
  /** Suspected cause hubs with createdAt timestamps */
  suspectedCauses?: SuspectedCause[];
  /** Playback interval in milliseconds (default: 1500) */
  intervalMs?: number;
  /** Maximum number of frames before grouping by day (default: 30) */
  maxFrames?: number;
}

export interface UseEvidenceMapTimelineReturn {
  /** All computed frames */
  frames: TimelineFrame[];
  /** Current frame index (0-based) */
  currentFrame: number;
  /** Start or resume playback */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Jump to a specific frame */
  seek: (frame: number) => void;
  /** Whether playback is active */
  isPlaying: boolean;
  /** Progress as a fraction (0-1) */
  progress: number;
}

// ============================================================================
// Internal helpers
// ============================================================================

interface TimestampedArtifact {
  timestamp: string;
  type: 'link' | 'question' | 'finding' | 'hub';
  id: string;
  factors: string[];
}

/** Extract ISO timestamp string from various artifact types. */
function collectArtifacts(
  causalLinks: CausalLink[],
  questions: Question[],
  findings: Finding[],
  suspectedCauses: SuspectedCause[]
): TimestampedArtifact[] {
  const artifacts: TimestampedArtifact[] = [];

  for (const link of causalLinks) {
    const factors = [link.fromFactor, link.toFactor];
    artifacts.push({
      timestamp: new Date(link.createdAt).toISOString(),
      type: 'link',
      id: link.id,
      factors,
    });
  }

  for (const q of questions) {
    const factors = q.factor ? [q.factor] : [];
    artifacts.push({
      timestamp: new Date(q.createdAt).toISOString(),
      type: 'question',
      id: q.id,
      factors,
    });
  }

  for (const f of findings) {
    artifacts.push({
      timestamp: new Date(f.createdAt).toISOString(),
      type: 'finding',
      id: f.id,
      factors: [], // Findings don't directly reference factors
    });
  }

  for (const sc of suspectedCauses) {
    artifacts.push({
      timestamp: new Date(sc.createdAt).toISOString(),
      type: 'hub',
      id: sc.id,
      factors: [], // Hub factors come from connected links
    });
  }

  return artifacts;
}

/** Group artifacts by date string (YYYY-MM-DD) for day-level grouping. */
function getDateKey(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10);
}

/** Format a date key or timestamp into a human-readable label. */
function formatFrameLabel(timestamp: string, index: number, _total: number): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return `Frame ${index + 1}`;

    // Use short month + day format
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return `Frame ${index + 1}`;
  }
}

/**
 * Build timeline frames from sorted artifacts.
 *
 * Each frame accumulates all visible artifacts up to its timestamp.
 * If there are too many unique timestamps, groups by day.
 */
function buildFrames(artifacts: TimestampedArtifact[], maxFrames: number): TimelineFrame[] {
  if (artifacts.length === 0) return [];

  // Sort chronologically
  const sorted = [...artifacts].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Determine grouping: by exact timestamp or by day
  const uniqueTimestamps = new Set(sorted.map(a => a.timestamp));
  const groupByDay = uniqueTimestamps.size > maxFrames;

  // Group artifacts into buckets
  const buckets = new Map<string, TimestampedArtifact[]>();
  for (const artifact of sorted) {
    const key = groupByDay ? getDateKey(artifact.timestamp) : artifact.timestamp;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(artifact);
    } else {
      buckets.set(key, [artifact]);
    }
  }

  // Build cumulative frames
  const frames: TimelineFrame[] = [];
  const cumulativeFactors = new Set<string>();
  const cumulativeLinks = new Set<string>();
  const cumulativeHubs = new Set<string>();

  let frameIndex = 0;
  for (const [key, bucketArtifacts] of buckets) {
    // Add this bucket's artifacts to cumulative sets
    for (const artifact of bucketArtifacts) {
      for (const factor of artifact.factors) {
        cumulativeFactors.add(factor);
      }
      if (artifact.type === 'link') {
        cumulativeLinks.add(artifact.id);
      }
      if (artifact.type === 'hub') {
        cumulativeHubs.add(artifact.id);
      }
    }

    frames.push({
      timestamp: groupByDay ? `${key}T00:00:00.000Z` : key,
      label: formatFrameLabel(key, frameIndex, buckets.size),
      visibleFactors: [...cumulativeFactors],
      visibleLinks: [...cumulativeLinks],
      visibleHubs: [...cumulativeHubs],
    });

    frameIndex++;
  }

  return frames;
}

// ============================================================================
// Hook
// ============================================================================

export function useEvidenceMapTimeline(
  options: UseEvidenceMapTimelineOptions = {}
): UseEvidenceMapTimelineReturn {
  const {
    causalLinks = [],
    questions = [],
    findings = [],
    suspectedCauses = [],
    intervalMs = 1500,
    maxFrames = 30,
  } = options;

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute frames from all investigation artifacts
  const frames = useMemo(() => {
    const artifacts = collectArtifacts(causalLinks, questions, findings, suspectedCauses);
    return buildFrames(artifacts, maxFrames);
  }, [causalLinks, questions, findings, suspectedCauses, maxFrames]);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Manage playback interval
  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentFrame(prev => {
        const next = prev + 1;
        if (next >= frames.length) {
          // Reached the end — stop playback
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, frames.length, intervalMs]);

  const play = useCallback(() => {
    if (frames.length === 0) return;

    // If at the end, restart from the beginning
    setCurrentFrame(prev => {
      if (prev >= frames.length - 1) return 0;
      return prev;
    });
    setIsPlaying(true);
  }, [frames.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const seek = useCallback(
    (frame: number) => {
      const clamped = Math.max(0, Math.min(frame, frames.length - 1));
      setCurrentFrame(clamped);
      setIsPlaying(false);
    },
    [frames.length]
  );

  const progress = frames.length > 1 ? currentFrame / (frames.length - 1) : 0;

  return {
    frames,
    currentFrame,
    play,
    pause,
    seek,
    isPlaying,
    progress,
  };
}
