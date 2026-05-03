// packages/core/src/serialization/vrsImport.ts
import { VRS_VERSION, type VrsFile } from './vrsFormat';

export function vrsImport(json: string): VrsFile {
  let parsed: Partial<VrsFile>;
  try {
    parsed = JSON.parse(json) as Partial<VrsFile>;
  } catch (e) {
    throw new Error(`Invalid .vrs: not valid JSON (${(e as Error).message})`);
  }

  if (parsed.version !== VRS_VERSION) {
    throw new Error(
      `Unsupported .vrs version: ${parsed.version}. This build supports ${VRS_VERSION}.`
    );
  }
  if (!parsed.hub) {
    throw new Error('Invalid .vrs: missing hub field.');
  }
  return parsed as VrsFile;
}
