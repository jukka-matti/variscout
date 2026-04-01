/**
 * REF Marker Parser for CoScout Visual Grounding (ADR-050).
 * Parses [REF:type:id]display text[/REF] markers from CoScout messages.
 */

export type RefTargetType =
  | 'boxplot'
  | 'ichart'
  | 'pareto'
  | 'stats'
  | 'yamazumi'
  | 'finding'
  | 'hypothesis'
  | 'dashboard'
  | 'improvement';

export interface RefMarker {
  targetType: RefTargetType;
  targetId?: string;
  displayText: string;
  startIndex: number;
  endIndex: number;
}

export interface ParseRefResult {
  cleanText: string;
  refs: RefMarker[];
}

const REF_MARKER_REGEX = /\[REF:(\w+)(?::([^\]]*))?\]([\s\S]*?)\[\/REF\]/g;

export function parseRefMarkers(text: string): ParseRefResult {
  interface RawMatch {
    fullMatch: string;
    targetType: string;
    targetId: string | undefined;
    displayText: string;
    matchStart: number;
  }

  const rawMatches: RawMatch[] = [];
  let match: RegExpExecArray | null;
  REF_MARKER_REGEX.lastIndex = 0;

  while ((match = REF_MARKER_REGEX.exec(text)) !== null) {
    rawMatches.push({
      fullMatch: match[0],
      targetType: match[1],
      targetId: match[2] !== undefined && match[2] !== '' ? match[2] : undefined,
      displayText: match[3],
      matchStart: match.index,
    });
  }

  if (rawMatches.length === 0) {
    return { cleanText: text, refs: [] };
  }

  const refs: RefMarker[] = [];
  let cleanText = '';
  let lastEnd = 0;

  for (const raw of rawMatches) {
    cleanText += text.slice(lastEnd, raw.matchStart);
    const startIndex = cleanText.length;
    cleanText += raw.displayText;
    const endIndex = cleanText.length;

    refs.push({
      targetType: raw.targetType as RefTargetType,
      targetId: raw.targetId,
      displayText: raw.displayText,
      startIndex,
      endIndex,
    });

    lastEnd = raw.matchStart + raw.fullMatch.length;
  }

  cleanText += text.slice(lastEnd);
  return { cleanText, refs };
}

export function stripRefMarkers(text: string): string {
  return text.replace(/\[REF:(?:\w+)(?::[^\]]*)?\]([\s\S]*?)\[\/REF\]/g, '$1');
}
