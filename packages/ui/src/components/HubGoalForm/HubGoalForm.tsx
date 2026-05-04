// packages/ui/src/components/HubGoalForm/HubGoalForm.tsx
import { useState } from 'react';
import { EXAMPLE_GOALS } from './HubGoalForm.examples';

export interface HubGoalFormProps {
  initialValue?: string;
  onConfirm: (narrative: string) => void;
  onSkip?: () => void;
}

const SCAFFOLDS = [
  { label: '+ Purpose', insertText: 'Purpose: ' },
  { label: '+ Customer', insertText: 'Customer: ' },
  { label: '+ What matters', insertText: 'What matters: ' },
];

export function HubGoalForm({ initialValue = '', onConfirm, onSkip }: HubGoalFormProps) {
  const [value, setValue] = useState(initialValue);
  const [showExamples, setShowExamples] = useState(false);

  const insertScaffold = (text: string) => {
    setValue(prev => (prev.trim() ? `${prev}\n${text}` : text));
  };

  return (
    <div className="hub-goal-form" data-testid="hub-goal-form">
      <label htmlFor="hub-goal-narrative" className="block font-medium mb-2">
        Why does this process exist?
      </label>
      <div className="flex gap-2 mb-2">
        {SCAFFOLDS.map(s => (
          <button
            key={s.label}
            type="button"
            onClick={() => insertScaffold(s.insertText)}
            className="text-xs px-2 py-1 border border-dashed rounded"
          >
            {s.label}
          </button>
        ))}
      </div>
      <textarea
        id="hub-goal-narrative"
        aria-label="process goal"
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={5}
        className="w-full border rounded p-2"
        placeholder="What does this process produce? For whom? What matters about the output?"
      />
      <button
        type="button"
        className="text-xs underline text-blue-600 mt-2"
        onClick={() => setShowExamples(s => !s)}
      >
        {showExamples ? 'Hide examples' : 'See examples →'}
      </button>
      {showExamples && (
        <div className="text-xs mt-2 space-y-2 border-l-2 pl-3">
          {EXAMPLE_GOALS.map(ex => (
            <div key={ex.title}>
              <div className="font-semibold">{ex.title}</div>
              <div className="text-gray-600">{ex.narrative}</div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => onConfirm(value)}
          disabled={!value.trim()}
        >
          Continue →
        </button>
        {onSkip && (
          <button type="button" className="text-xs underline text-gray-500" onClick={onSkip}>
            Skip framing (advanced)
          </button>
        )}
      </div>
    </div>
  );
}
