import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export interface ReportEvidenceMapProps {
  /** Evidence Map rendered element */
  evidenceMap: React.ReactNode;
  /** Timeline controls — matches UseEvidenceMapTimelineReturn from @variscout/hooks */
  timeline: {
    frames: Array<{
      timestamp: string;
      label: string;
      visibleFactors: string[];
      visibleLinks: string[];
      visibleHubs: string[];
    }>;
    currentFrame: number;
    progress: number;
    isPlaying: boolean;
    play: () => void;
    pause: () => void;
    seek: (frame: number) => void;
  };
}

export const ReportEvidenceMap: React.FC<ReportEvidenceMapProps> = ({ evidenceMap, timeline }) => {
  if (timeline.frames.length === 0) return null;

  return (
    <div className="border border-edge rounded-lg overflow-hidden">
      {/* Map */}
      <div className="h-[400px] bg-surface-secondary">{evidenceMap}</div>

      {/* Playback controls */}
      <div className="flex items-center gap-3 px-4 py-2 bg-surface border-t border-edge">
        <button
          onClick={timeline.isPlaying ? timeline.pause : timeline.play}
          className="p-1.5 rounded-md hover:bg-surface-secondary transition-colors text-content"
          aria-label={timeline.isPlaying ? 'Pause' : 'Play'}
        >
          {timeline.isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          onClick={() => timeline.seek(0)}
          className="p-1.5 rounded-md hover:bg-surface-secondary transition-colors text-content"
          aria-label="Restart"
        >
          <RotateCcw size={14} />
        </button>

        {/* Progress bar */}
        <div className="flex-1 relative h-1.5 bg-surface-secondary rounded-full">
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${timeline.progress * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={Math.max(0, timeline.frames.length - 1)}
            value={timeline.currentFrame}
            onChange={e => timeline.seek(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Frame label */}
        <span className="text-xs text-content-secondary min-w-[60px] text-right">
          {timeline.frames[timeline.currentFrame]?.label ?? ''}
        </span>
      </div>
    </div>
  );
};
