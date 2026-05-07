import React from 'react';
import { useProjectStore } from '@variscout/stores';

interface CharterPanelProps {
  onBack: () => void;
}

const CharterPanel: React.FC<CharterPanelProps> = ({ onBack }) => {
  const processContext = useProjectStore(s => s.processContext);
  const charters = (processContext as { charters?: unknown[] } | null)?.charters ?? [];

  return (
    <div
      data-testid="charter-panel"
      className="bg-surface-primary text-content border border-edge rounded-md px-4 py-3 flex flex-col gap-4"
    >
      <h2 className="text-lg font-semibold">Charter</h2>
      <p className="text-content-secondary">
        A Charter formalizes a process improvement project: problem statement, goals, scope, team,
        and timeline. The full authoring surface ships in a future release.
      </p>
      {charters.length === 0 && <p className="text-content-secondary text-sm">No charter yet.</p>}
      <p className="text-content-secondary text-sm italic">Available in a future release.</p>
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm underline text-content-secondary"
      >
        Back to FRAME
      </button>
    </div>
  );
};

export default CharterPanel;
