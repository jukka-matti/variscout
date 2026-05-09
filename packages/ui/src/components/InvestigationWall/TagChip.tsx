import React from 'react';
import { operatorColors } from '@variscout/charts';

export interface TagChipProps {
  tag: string;
}

const colorForTag = (tag: string): (typeof operatorColors)[number] => {
  const normalized = tag.trim().toLocaleLowerCase();
  let hash = 0;

  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }

  return operatorColors[hash % operatorColors.length];
};

export const TagChip: React.FC<TagChipProps> = ({ tag }) => {
  const label = tag.trim();
  const color = colorForTag(label);

  return (
    <span
      className="inline-flex max-w-full items-center gap-1 rounded border bg-surface px-1.5 py-0.5 text-[10px] font-medium leading-none text-content"
      data-theme-color={color}
      style={{ borderColor: color }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0 truncate">#{label}</span>
    </span>
  );
};
