import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import type { ProcessHubInvestigation, ProcessHubRollup } from '@variscout/core';
import { processQuestionAnswers } from './ProcessHubFormat';

interface ProcessHubCadenceQuestionsProps {
  rollup: ProcessHubRollup<ProcessHubInvestigation>;
}

const QuestionBand: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <div className="rounded-md border border-edge bg-surface px-3 py-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
      {question}
    </p>
    <p className="mt-2 text-sm font-medium text-content">{answer}</p>
  </div>
);

const ProcessHubCadenceQuestions: React.FC<ProcessHubCadenceQuestionsProps> = ({ rollup }) => {
  const answers = processQuestionAnswers(rollup);

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-content">
        <ClipboardCheck size={16} />
        <h4>Cadence Questions</h4>
      </div>
      <div className="grid gap-2 lg:grid-cols-3">
        <QuestionBand question="Are we meeting the requirement?" answer={answers.requirement} />
        <QuestionBand question="What changed?" answer={answers.change} />
        <QuestionBand question="Where should we focus?" answer={answers.focus} />
      </div>
    </div>
  );
};

export default ProcessHubCadenceQuestions;
