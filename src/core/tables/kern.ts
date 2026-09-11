import * as opentype from 'opentype.js';
export function collectKerningPairs(font: any): Map<number, { right: number; value: number }[]> {
  const leftToPairs = new Map<number, { right: number; value: number }[]>();
  if (!font || !font.kerningPairs) return leftToPairs;

  for (const [key, val] of Object.entries(font.kerningPairs)) {
    if (typeof val !== 'number' || val === 0) continue;
    const parts = key.split(',');
    if (parts.length !== 2) continue;
    const left = parseInt(parts[0], 10);
    const right = parseInt(parts[1], 10);
    if (isNaN(left) || isNaN(right) || left <= 0 || right <= 0) continue;
    if (left > 0xFFFF || right > 0xFFFF) continue;

    const clamped = Math.max(-32768, Math.min(32767, Math.round(val)));
    if (!leftToPairs.has(left)) leftToPairs.set(left, []);
    leftToPairs.get(left)!.push({ right, value: clamped });
  }

  for (const list of leftToPairs.values()) {
    list.sort((a, b) => a.right - b.right);
  }
  return leftToPairs;
}

/**
 * Builds a binary legacy 'kern' table (format 0, version 0) from font.kerningPairs.
 *
 * IMPORTANT: both nPairs and subtableLength are uint16, so a single subtable cannot
 * hold more than ~10.900 pairs. A Vietnamese build routinely produces 20.000 - 80.000
 * pairs (class-based kerning expanded to individual pairs, then cloned onto 134 new
 * glyphs), which used to silently wrap around and corrupt the table.
 * The pairs are therefore split across several format 0 subtables.
 */
export function buildKernTable(font: any): Uint8Array {
  const leftToPairs = collectKerningPairs(font);

  const flat: { left: number; right: number; value: number }[] = [];
  for (const [left, list] of leftToPairs) {
    for (const p of list) flat.push({ left, right: p.right, value: p.value });
  }
  if (flat.length === 0) return new Uint8Array(0);

  // Sort by left glyph index, then right glyph index as mandated by the TrueType specification
  flat.sort((a, b) => (a.left !== b.left ? a.left - b.left : a.right - b.right));

  const MAX_PAIRS_PER_SUBTABLE = 10000; // 14 + 6 * 10000 = 60.014 < 65.536
  const groups: { left: number; right: number; value: number }[][] = [];
  for (let i = 0; i < flat.length; i += MAX_PAIRS_PER_SUBTABLE) {
    groups.push(flat.slice(i, i + MAX_PAIRS_PER_SUBTABLE));
  }

  const totalSize = 4 + groups.reduce((sum, g) => sum + 14 + 6 * g.length, 0);
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // Main header
  view.setUint16(0, 0);              // version 0
  view.setUint16(2, groups.length);  // number of subtables

  let offset = 4;
  for (const group of groups) {
    const nPairs = group.length;
    const subtableSize = 14 + 6 * nPairs;

    // Subtable header
    view.setUint16(offset, 0);             // subtable version 0
    view.setUint16(offset + 2, subtableSize);
    view.setUint16(offset + 4, 1);         // coverage: horizontal, format 0

    // Format 0 search values
    const maxPowerOf2 = Math.pow(2, Math.floor(Math.log2(nPairs)));
    view.setUint16(offset + 6, nPairs);
    view.setUint16(offset + 8, maxPowerOf2 * 6);
    view.setUint16(offset + 10, Math.floor(Math.log2(maxPowerOf2)));
    view.setUint16(offset + 12, (nPairs - maxPowerOf2) * 6);

    // Pair records
    let q = offset + 14;
    for (const pair of group) {
      view.setUint16(q, pair.left);
      view.setUint16(q + 2, pair.right);
      view.setInt16(q + 4, pair.value);
      q += 6;
    }
    offset += subtableSize;
  }

  return new Uint8Array(buffer);
}

// Every offset inside a PairPos subtable is a uint16, so one subtable must stay
// below 65.536 bytes. Keep a safety margin.
const MAX_PAIRPOS_SUBTABLE_BYTES = 60000;

/**
 * Splits left glyphs into groups so that each PairPos subtable stays under 64 KB.
 */
function chunkLeftGlyphs(leftToPairs: Map<number, { right: number; value: number }[]>): number[][] {
  const sortedLeft = Array.from(leftToPairs.keys()).sort((a, b) => a - b);
  const chunks: number[][] = [];
  let current: number[] = [];
  let currentBytes = 14; // 10 bytes subtable header + 4 bytes coverage header

  for (const g of sortedLeft) {
    const pairs = leftToPairs.get(g)!;
    // 2 (pairSetOffset) + 2 (coverage glyph) + 2 (pairValueCount) + 4 per pair
    const cost = 6 + 4 * pairs.length;
    if (current.length > 0 && currentBytes + cost > MAX_PAIRPOS_SUBTABLE_BYTES) {
      chunks.push(current);
      current = [];
      currentBytes = 14;
    }
    current.push(g);
    currentBytes += cost;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

/**
 * Serializes one PairPos Format 1 subtable for the given left glyphs.
 */
function buildPairPosSubtable(
  leftGlyphs: number[],
  leftToPairs: Map<number, { right: number; value: number }[]>
): Uint8Array {
  const numLeft = leftGlyphs.length;
  let totalPairSetBytes = 0;
  for (const g of leftGlyphs) totalPairSetBytes += 2 + 4 * leftToPairs.get(g)!.length;

  const size = (10 + 2 * numLeft) + (4 + 2 * numLeft) + totalPairSetBytes;
  const buffer = new ArrayBuffer(size);
  const view = new DataView(buffer);

  view.setUint16(0, 1);                // posFormat = 1
  view.setUint16(2, 10 + 2 * numLeft); // coverageOffset
  view.setUint16(4, 0x0004);           // valueFormat1 = XAdvance
  view.setUint16(6, 0x0000);           // valueFormat2 = 0
  view.setUint16(8, numLeft);          // pairSetCount

  let o = 10;
  const pairSetOffsetsAt = o;
  o += 2 * numLeft;

  // Coverage table (format 1)
  view.setUint16(o, 1);
  view.setUint16(o + 2, numLeft);
  o += 4;
  for (let i = 0; i < numLeft; i++) {
    view.setUint16(o, leftGlyphs[i]);
    o += 2;
  }

  // PairSet tables
  for (let i = 0; i < numLeft; i++) {
    const pairs = leftToPairs.get(leftGlyphs[i])!;
    if (o > 0xFFFF) {
      throw new Error('PairPos subtable exceeded 64KB - chunking logic is broken');
    }
    view.setUint16(pairSetOffsetsAt + 2 * i, o);
    view.setUint16(o, pairs.length);
    o += 2;
    for (const pair of pairs) {
      view.setUint16(o, pair.right);
      view.setInt16(o + 2, pair.value);
      o += 4;
    }
  }

  return new Uint8Array(buffer);
}

/**
 * Builds a binary OpenType GPOS table (Pair Adjustment) from font.kerningPairs.
 * Modern browsers (Chrome/Blink/HarfBuzz, Firefox, Safari) require a GPOS table with
 * 'kern' feature enabled to apply CSS kerning (font-kerning: normal / font-feature-settings: "kern" 1).
 *
 * IMPORTANT: a PairPos subtable addresses its internal content with uint16 offsets, so it cannot
 * exceed 64 KB. Vietnamese builds regularly produce 100 KB - 400 KB of kerning data, which
 * used to wrap around silently and produce a corrupt GPOS table (the font still installed in
 * Windows, but opentype.js refused to re-open it).
 * The pairs are therefore split into several PairPos subtables, each wrapped in a
 * lookup type 9 (Extension Positioning) whose offset is 32-bit.
 */
export function buildGPOSTable(font: any): Uint8Array {
  const leftToPairs = collectKerningPairs(font);
  if (leftToPairs.size === 0) return new Uint8Array(0);

  const chunks = chunkLeftGlyphs(leftToPairs);
  const subtables = chunks.map(c => buildPairPosSubtable(c, leftToPairs));
  const numLookups = subtables.length;

  // Layout:
  //   GPOS Header      : 10 bytes
  //   ScriptList       : offset 10, 38 bytes (DFLT + latn) -> 10..47
  //   FeatureList      : offset 48, 2 + 6 + (6 + 2 * numLookups) bytes
  //   LookupList       : 2 + 2 * numLookups + 16 * numLookups bytes
  //                      (each Lookup is 8 bytes + an 8 byte ExtensionPos subtable)
  //   PairPos subtables: appended at the end, addressed with 32-bit extension offsets
  const scriptListOffset = 10;
  const featureListOffset = 48;
  const featureListSize = 2 + 6 + (6 + 2 * numLookups);
  const lookupListOffset = featureListOffset + featureListSize;
  const lookupListSize = 2 + 2 * numLookups + numLookups * 16;

  const subtableOffsets: number[] = [];
  let totalSize = lookupListOffset + lookupListSize;
  for (const st of subtables) {
    totalSize = Math.ceil(totalSize / 2) * 2; // keep 16-bit alignment
    subtableOffsets.push(totalSize);
    totalSize += st.length;
  }

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const writeTag = (off: number, tag: string) => {
    for (let i = 0; i < 4; i++) view.setUint8(off + i, tag.charCodeAt(i));
  };

  // --- 1. GPOS Header ---
  view.setUint16(0, 1); // majorVersion
  view.setUint16(2, 0); // minorVersion
  view.setUint16(4, scriptListOffset);
  view.setUint16(6, featureListOffset);
  view.setUint16(8, lookupListOffset);

  // --- 2. ScriptList (DFLT + latn) ---
  let o = scriptListOffset;
  view.setUint16(o, 2); o += 2;          // scriptCount
  writeTag(o, 'DFLT'); view.setUint16(o + 4, 14); o += 6;
  writeTag(o, 'latn'); view.setUint16(o + 4, 26); o += 6;
  // DFLT Script Table + LangSys
  view.setUint16(o, 4); view.setUint16(o + 2, 0); o += 4;
  view.setUint16(o, 0); view.setUint16(o + 2, 0xFFFF);
  view.setUint16(o + 4, 1); view.setUint16(o + 6, 0); o += 8;
  // latn Script Table + LangSys
  view.setUint16(o, 4); view.setUint16(o + 2, 0); o += 4;
  view.setUint16(o, 0); view.setUint16(o + 2, 0xFFFF);
  view.setUint16(o + 4, 1); view.setUint16(o + 6, 0); o += 8;

  // --- 3. FeatureList: a single 'kern' feature referencing every lookup ---
  o = featureListOffset;
  view.setUint16(o, 1); o += 2;          // featureCount
  writeTag(o, 'kern'); view.setUint16(o + 4, 8); o += 6;
  view.setUint16(o, 0);                  // featureParamsOffset
  view.setUint16(o + 2, numLookups);     // lookupIndexCount
  o += 4;
  for (let i = 0; i < numLookups; i++) {
    view.setUint16(o, i);
    o += 2;
  }

  // --- 4. LookupList: each lookup is type 9 (Extension) wrapping a type 2 PairPos ---
  view.setUint16(lookupListOffset, numLookups);
  const lookupBase = lookupListOffset + 2 + 2 * numLookups;
  for (let i = 0; i < numLookups; i++) {
    const lookupOffset = lookupBase + i * 16;
    view.setUint16(lookupListOffset + 2 + 2 * i, lookupOffset - lookupListOffset);

    view.setUint16(lookupOffset, 9);     // lookupType = Extension Positioning
    view.setUint16(lookupOffset + 2, 0); // lookupFlag
    view.setUint16(lookupOffset + 4, 1); // subTableCount
    view.setUint16(lookupOffset + 6, 8); // subTableOffset

    const ext = lookupOffset + 8;
    view.setUint16(ext, 1);              // posFormat = 1
    view.setUint16(ext + 2, 2);          // extensionLookupType = 2 (Pair Adjustment)
    view.setUint32(ext + 4, subtableOffsets[i] - ext); // 32-bit offset, cannot overflow
  }

  // --- 5. PairPos subtables ---
  for (let i = 0; i < numLookups; i++) {
    bytes.set(subtables[i], subtableOffsets[i]);
  }

  return new Uint8Array(buffer);
}

/**
 * Rebuilds an sfnt buffer without the given tables.
 */
