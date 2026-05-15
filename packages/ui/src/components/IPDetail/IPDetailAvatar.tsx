import React from 'react';
import type { ProcessParticipantRef } from '@variscout/core/processHub';

interface IPDetailAvatarProps {
  person: ProcessParticipantRef;
  className?: string;
}

export function avatarColor(name: string): string {
  const palette = ['bg-amber-200', 'bg-green-200', 'bg-blue-200', 'bg-rose-200', 'bg-purple-200'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length] ?? palette[0]!;
}

export function participantInitial(person: ProcessParticipantRef): string {
  return person.displayName.slice(0, 1).toUpperCase();
}

const IPDetailAvatar: React.FC<IPDetailAvatarProps> = ({ person, className = '' }) => (
  <div
    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-xs font-semibold text-content ${avatarColor(person.displayName)} ${className}`}
    title={person.displayName}
  >
    {participantInitial(person)}
  </div>
);

export default IPDetailAvatar;
