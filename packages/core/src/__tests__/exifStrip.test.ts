import { describe, it, expect } from 'vitest';
import { hasExifData, stripExifSegments, stripExifFromBlob } from '../utils/exifStrip';

// ── Test helpers ──────────────────────────────────────────────────────────

/** Marker constants */
const SOI = [0xff, 0xd8];
const EOI = [0xff, 0xd9];
const SOS = [0xff, 0xda];
const APP0_MARKER = [0xff, 0xe0];
const APP1_MARKER = [0xff, 0xe1];
const APP13_MARKER = [0xff, 0xed];

/** Build a JPEG segment: marker (2 bytes) + length (2 bytes, big-endian) + payload */
function buildSegment(marker: number[], payload: number[]): number[] {
  const len = payload.length + 2; // length field includes itself
  return [...marker, (len >> 8) & 0xff, len & 0xff, ...payload];
}

/** Minimal APP0 (JFIF) segment */
function buildApp0(): number[] {
  // JFIF\0 identifier + minimal data
  return buildSegment(
    APP0_MARKER,
    [0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]
  );
}

/** Minimal APP1 (EXIF) with fake GPS data */
function buildExifSegment(): number[] {
  // Exif\0\0 header + fake TIFF header + fake GPS IFD tag
  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"
  const tiffHeader = [0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08]; // Big-endian TIFF
  // Fake GPS IFD: tag 0x8825 (GPSInfo), 1 entry
  const fakeGps = [
    0x00, 0x01, 0x88, 0x25, 0x00, 0x04, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x1a,
  ];
  // Fake GPS coordinates (latitude/longitude as rational values)
  const fakeCoords = [
    0x00,
    0x00,
    0x00,
    0x3c,
    0x00,
    0x00,
    0x00,
    0x01, // 60/1 = 60°N
    0x00,
    0x00,
    0x00,
    0x19,
    0x00,
    0x00,
    0x00,
    0x01,
  ]; // 25/1 = 25°E
  return buildSegment(APP1_MARKER, [...exifHeader, ...tiffHeader, ...fakeGps, ...fakeCoords]);
}

/** APP1 segment with XMP data (also contains metadata) */
function buildXmpSegment(): number[] {
  // XMP uses APP1 with "http://ns.adobe.com/xap/1.0/\0" namespace
  const xmpNs = Array.from(new TextEncoder().encode('http://ns.adobe.com/xap/1.0/\0'));
  const xmpData = Array.from(
    new TextEncoder().encode('<x:xmpmeta><rdf:Description gps:lat="60.0"/></x:xmpmeta>')
  );
  return buildSegment(APP1_MARKER, [...xmpNs, ...xmpData]);
}

/** Minimal APP13 (IPTC) segment */
function buildApp13(): number[] {
  // Photoshop 3.0\0 header + minimal IPTC record
  const header = Array.from(new TextEncoder().encode('Photoshop 3.0\0'));
  return buildSegment(APP13_MARKER, [
    ...header,
    0x1c,
    0x02,
    0x00,
    0x00,
    0x04,
    0x54,
    0x65,
    0x73,
    0x74,
  ]);
}

/** Minimal SOS + compressed image data */
function buildSosAndData(): number[] {
  // SOS header (simplified: length=12, 3 components)
  const sosHeader = buildSegment(SOS, [0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00]);
  // Fake compressed image data (entropy-coded bytes, no 0xFF bytes for simplicity)
  const imageData = [0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21, 0x42, 0x79, 0x74, 0x65, 0x73];
  return [...sosHeader, ...imageData, ...EOI];
}

/** Build a complete JPEG from segments */
function buildJpeg(...segments: number[][]): Uint8Array {
  return new Uint8Array([...SOI, ...segments.flat()]);
}

/** Build a clean JPEG (APP0 + image data, no EXIF) */
function buildCleanJpeg(): Uint8Array {
  return buildJpeg(buildApp0(), buildSosAndData());
}

/** Build a JPEG with EXIF (APP0 + APP1 + image data) */
function buildExifJpeg(): Uint8Array {
  return buildJpeg(buildApp0(), buildExifSegment(), buildSosAndData());
}

// ── hasExifData ───────────────────────────────────────────────────────────

describe('hasExifData', () => {
  it('detects APP1 (EXIF) segment', () => {
    expect(hasExifData(buildExifJpeg())).toBe(true);
  });

  it('detects APP13 (IPTC) segment', () => {
    const jpeg = buildJpeg(buildApp0(), buildApp13(), buildSosAndData());
    expect(hasExifData(jpeg)).toBe(true);
  });

  it('returns false for clean JPEG (no EXIF)', () => {
    expect(hasExifData(buildCleanJpeg())).toBe(false);
  });

  it('returns false for non-JPEG data', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(hasExifData(png)).toBe(false);
  });

  it('returns false for empty data', () => {
    expect(hasExifData(new Uint8Array([]))).toBe(false);
  });

  it('returns false for data shorter than JPEG minimum', () => {
    expect(hasExifData(new Uint8Array([0xff, 0xd8]))).toBe(false);
  });

  it('detects EXIF after APP0 segment', () => {
    // APP0 first, then APP1 — must walk past APP0 to find it
    const jpeg = buildJpeg(buildApp0(), buildExifSegment(), buildSosAndData());
    expect(hasExifData(jpeg)).toBe(true);
  });
});

// ── stripExifSegments ─────────────────────────────────────────────────────

describe('stripExifSegments', () => {
  it('strips APP1 (EXIF) segment', () => {
    const input = buildExifJpeg();
    expect(hasExifData(input)).toBe(true);
    const stripped = stripExifSegments(input);
    expect(hasExifData(stripped)).toBe(false);
  });

  it('strips APP13 (IPTC) segment', () => {
    const input = buildJpeg(buildApp0(), buildApp13(), buildSosAndData());
    expect(hasExifData(input)).toBe(true);
    const stripped = stripExifSegments(input);
    expect(hasExifData(stripped)).toBe(false);
  });

  it('strips both APP1 and APP13 when present', () => {
    const input = buildJpeg(buildApp0(), buildExifSegment(), buildApp13(), buildSosAndData());
    expect(hasExifData(input)).toBe(true);
    const stripped = stripExifSegments(input);
    expect(hasExifData(stripped)).toBe(false);
  });

  it('preserves APP0 (JFIF) segment', () => {
    const input = buildExifJpeg();
    const stripped = stripExifSegments(input);
    // APP0 marker should still be present
    const hasApp0 = findMarker(stripped, 0xe0);
    expect(hasApp0).toBe(true);
  });

  it('preserves image data after SOS', () => {
    const input = buildExifJpeg();
    const stripped = stripExifSegments(input);
    // The stripped output should still contain our fake image data bytes
    const imageDataSignature = [0x48, 0x65, 0x6c, 0x6c, 0x6f]; // "Hello"
    expect(containsBytes(stripped, imageDataSignature)).toBe(true);
  });

  it('is no-op for clean JPEG (no EXIF)', () => {
    const clean = buildCleanJpeg();
    const stripped = stripExifSegments(clean);
    expect(stripped.length).toBe(clean.length);
    expect(arraysEqual(stripped, clean)).toBe(true);
  });

  it('returns input unchanged for non-JPEG data', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const result = stripExifSegments(png);
    expect(result).toBe(png); // same reference
  });

  it('handles multiple APP1 segments (EXIF + XMP)', () => {
    const input = buildJpeg(buildApp0(), buildExifSegment(), buildXmpSegment(), buildSosAndData());
    // Should have 2 APP1 segments
    expect(countMarker(input, 0xe1)).toBe(2);
    const stripped = stripExifSegments(input);
    expect(countMarker(stripped, 0xe1)).toBe(0);
    expect(hasExifData(stripped)).toBe(false);
  });

  it('output starts with valid JPEG SOI marker', () => {
    const stripped = stripExifSegments(buildExifJpeg());
    expect(stripped[0]).toBe(0xff);
    expect(stripped[1]).toBe(0xd8);
  });

  it('removes GPS coordinate data', () => {
    const input = buildExifJpeg();
    // Our fake GPS has 60°N (0x3C = 60) embedded
    expect(containsBytes(input, [0x00, 0x00, 0x00, 0x3c, 0x00, 0x00, 0x00, 0x01])).toBe(true);
    const stripped = stripExifSegments(input);
    expect(containsBytes(stripped, [0x00, 0x00, 0x00, 0x3c, 0x00, 0x00, 0x00, 0x01])).toBe(false);
  });
});

// ── stripExifFromBlob ─────────────────────────────────────────────────────

describe('stripExifFromBlob', () => {
  it('strips EXIF from Blob', async () => {
    const input = buildExifJpeg();
    const blob = new Blob([input], { type: 'image/jpeg' });
    const result = await stripExifFromBlob(blob);
    const resultData = new Uint8Array(await result.arrayBuffer());
    expect(hasExifData(resultData)).toBe(false);
  });

  it('returns original Blob when no EXIF present', async () => {
    const clean = buildCleanJpeg();
    const blob = new Blob([clean], { type: 'image/jpeg' });
    const result = await stripExifFromBlob(blob);
    // Should be the exact same Blob reference (no copy)
    expect(result).toBe(blob);
  });

  it('preserves MIME type', async () => {
    const input = buildExifJpeg();
    const blob = new Blob([input], { type: 'image/jpeg' });
    const result = await stripExifFromBlob(blob);
    expect(result.type).toBe('image/jpeg');
  });

  it('handles non-JPEG Blob (passthrough)', async () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const blob = new Blob([pngHeader], { type: 'image/png' });
    const result = await stripExifFromBlob(blob);
    expect(result).toBe(blob);
  });
});

// ── Round-trip tests ──────────────────────────────────────────────────────

describe('round-trip', () => {
  it('full pipeline removes all metadata', () => {
    // Build JPEG with EXIF + IPTC + XMP
    const input = buildJpeg(
      buildApp0(),
      buildExifSegment(),
      buildXmpSegment(),
      buildApp13(),
      buildSosAndData()
    );
    expect(hasExifData(input)).toBe(true);

    const stripped = stripExifSegments(input);
    expect(hasExifData(stripped)).toBe(false);

    // Second pass should be no-op
    const doubleStripped = stripExifSegments(stripped);
    expect(arraysEqual(stripped, doubleStripped)).toBe(true);
  });

  it('stripped JPEG is smaller than original', () => {
    const input = buildExifJpeg();
    const stripped = stripExifSegments(input);
    expect(stripped.length).toBeLessThan(input.length);
  });
});

// ── Utility helpers ───────────────────────────────────────────────────────

/** Check if a specific JPEG marker byte exists in data */
function findMarker(data: Uint8Array, markerByte: number): boolean {
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i] === 0xff && data[i + 1] === markerByte) return true;
  }
  return false;
}

/** Count occurrences of a specific JPEG marker */
function countMarker(data: Uint8Array, markerByte: number): number {
  let count = 0;
  let offset = 2; // skip SOI
  while (offset + 3 < data.length) {
    if (data[offset] !== 0xff) break;
    const marker = data[offset + 1];
    if (marker === 0xda) break; // SOS — stop
    if (marker === markerByte) count++;
    const segLen = (data[offset + 2] << 8) | data[offset + 3];
    if (segLen < 2) break;
    offset += 2 + segLen;
  }
  return count;
}

/** Check if `needle` byte sequence exists anywhere in `haystack` */
function containsBytes(haystack: Uint8Array, needle: number[]): boolean {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

/** Compare two Uint8Arrays for equality */
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
