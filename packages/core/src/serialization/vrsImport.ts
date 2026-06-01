import { VRS_DOCUMENT_KIND, VRS_VERSION, type VrsFile } from './vrsFormat';

export function vrsImport(json: string): VrsFile {
  let parsed: Partial<VrsFile>;
  try {
    parsed = JSON.parse(json) as Partial<VrsFile>;
  } catch (e) {
    throw new Error(`Invalid .vrs: not valid JSON (${(e as Error).message})`);
  }

  if (parsed.kind !== VRS_DOCUMENT_KIND || parsed.version !== VRS_VERSION) {
    throw new Error('Invalid .vrs: expected a VariScout document snapshot file.');
  }
  if (!parsed.documentSnapshot || typeof parsed.documentSnapshot !== 'object') {
    throw new Error('Invalid .vrs: missing documentSnapshot.');
  }
  return parsed as VrsFile;
}
