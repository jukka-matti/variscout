/**
 * Pure byte-level JPEG EXIF/GPS metadata stripping.
 *
 * Defense-in-depth for photo uploads: canvas re-encoding strips EXIF as a
 * side effect, but this module provides an explicit, testable guarantee.
 *
 * Strips APP1 (EXIF, XMP — may contain GPS) and APP13 (IPTC) segments.
 * Preserves APP0 (JFIF) and APP2 (ICC color profile).
 */

// JPEG markers
const SOI_0 = 0xff;
const SOI_1 = 0xd8;
const MARKER_PREFIX = 0xff;
const APP1 = 0xe1; // EXIF / XMP
const APP13 = 0xed; // IPTC
const SOS = 0xda; // Start of Scan (image data follows)

/** Return true if `data` is a JPEG containing APP1 or APP13 segments. */
export function hasExifData(data: Uint8Array): boolean {
  if (data.length < 4 || data[0] !== SOI_0 || data[1] !== SOI_1) return false;

  let offset = 2;
  while (offset + 3 < data.length) {
    if (data[offset] !== MARKER_PREFIX) break;
    const marker = data[offset + 1];
    if (marker === SOS) break;
    if (marker === APP1 || marker === APP13) return true;
    // Segment length is big-endian uint16 (includes length bytes themselves)
    const segLen = (data[offset + 2] << 8) | data[offset + 3];
    if (segLen < 2) break; // malformed
    offset += 2 + segLen;
  }
  return false;
}

/** Remove APP1 and APP13 segments from a JPEG byte array. Non-JPEG input is returned unchanged. */
export function stripExifSegments(data: Uint8Array): Uint8Array {
  if (data.length < 4 || data[0] !== SOI_0 || data[1] !== SOI_1) return data;

  // Quick check: if no EXIF data, return input unchanged
  if (!hasExifData(data)) return data;

  // Collect output chunks
  const chunks: Uint8Array[] = [new Uint8Array([SOI_0, SOI_1])];

  let offset = 2;
  while (offset + 3 < data.length) {
    if (data[offset] !== MARKER_PREFIX) break;
    const marker = data[offset + 1];

    // SOS: copy everything from here to end (compressed image data)
    if (marker === SOS) {
      chunks.push(data.slice(offset));
      offset = data.length;
      break;
    }

    const segLen = (data[offset + 2] << 8) | data[offset + 3];
    if (segLen < 2) break; // malformed

    const totalSegLen = 2 + segLen; // marker (2) + length field + data

    if (marker === APP1 || marker === APP13) {
      // Skip this segment entirely
      offset += totalSegLen;
      continue;
    }

    // Preserve segment
    chunks.push(data.slice(offset, offset + totalSegLen));
    offset += totalSegLen;
  }

  // If we broke out early (malformed), append trailing bytes
  if (offset < data.length) {
    chunks.push(data.slice(offset));
  }

  // Concat chunks
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
}

/** Convenience: strip EXIF from a Blob, returning a new Blob with the same MIME type. */
export async function stripExifFromBlob(blob: Blob): Promise<Blob> {
  const buffer = await blob.arrayBuffer();
  const input = new Uint8Array(buffer);
  const stripped = stripExifSegments(input);
  // Return original blob if nothing changed (same reference = same length & no EXIF found)
  if (stripped === input) return blob;
  return new Blob([stripped.buffer as ArrayBuffer], { type: blob.type });
}
