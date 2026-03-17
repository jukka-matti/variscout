/**
 * DJB2 hash function for string hashing (cache keys, dedup).
 * Shared across AI modules to avoid duplication.
 */
export function djb2Hash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return String(hash);
}
