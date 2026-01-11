/**
 * Simplified case steps display component for React Islands migration.
 * Replaces CaseStudyController - displays steps without iframe communication.
 */

type ChartId = 'ichart' | 'boxplot' | 'pareto' | 'stats' | 'regression' | 'gagerr';

export interface CaseStep {
  title: string;
  content: string;
  interactive: boolean;
  targetChart?: ChartId;
}

interface CaseStepsDisplayProps {
  steps: CaseStep[];
}

export default function CaseStepsDisplay({ steps }: CaseStepsDisplayProps) {
  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`
            flex gap-6 p-6 rounded-xl border transition-all duration-300
            ${
              step.interactive
                ? 'border-brand-primary bg-brand-primary/5'
                : 'border-neutral-200 bg-white'
            }
          `}
        >
          <div
            className={`
              shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
              ${step.interactive ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-600'}
            `}
          >
            {index + 1}
          </div>
          <div>
            <h3 className="font-bold mb-2">{step.title}</h3>
            <p className="text-neutral-600 leading-relaxed">{step.content}</p>
            {step.interactive && (
              <p className="text-sm text-brand-primary font-medium mt-2">
                &uarr; Try this in the interactive demo above
              </p>
            )}
            {step.targetChart && (
              <span className="inline-block mt-2 text-xs px-2 py-1 bg-neutral-100 text-neutral-500 rounded">
                View: {step.targetChart === 'ichart' ? 'I-Chart' : step.targetChart}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
