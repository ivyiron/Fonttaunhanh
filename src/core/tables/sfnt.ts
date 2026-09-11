import { collectKerningPairs } from './kern';
import * as opentype from 'opentype.js';
function calculateTableChecksum(data: Uint8Array): number {
  let sum = 0;
  const len = data.length;
  const paddedLen = Math.ceil(len / 4) * 4;
  
  for (let i = 0; i < paddedLen; i += 4) {
    const b0 = i < len ? data[i] : 0;
    const b1 = i + 1 < len ? data[i + 1] : 0;
    const b2 = i + 2 < len ? data[i + 2] : 0;
    const b3 = i + 3 < len ? data[i + 3] : 0;
    
    const val = ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
    sum = (sum + val) >>> 0;
  }
  return sum;
}

/**
 * Collects and normalizes kerning pairs from font.kerningPairs,
 * grouped by left glyph index and sorted by right glyph index.
 */
function stripFontTables(buffer: ArrayBuffer, drop: string[]): ArrayBuffer {
  const view = new DataView(buffer);
  const numTables = view.getUint16(4);
  const entries: { tag: string; data: Uint8Array }[] = [];

  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    const tag = String.fromCharCode(
      view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2), view.getUint8(o + 3)
    );
    if (drop.includes(tag)) continue;
    const start = view.getUint32(o + 8);
    const length = view.getUint32(o + 12);
    entries.push({ tag, data: new Uint8Array(buffer.slice(start, start + length)) });
  }

  entries.sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const n = entries.length;

  let maxPowerOf2 = 1;
  while (maxPowerOf2 * 2 <= n) maxPowerOf2 *= 2;

  let offset = 12 + n * 16;
  const offsets = entries.map(e => {
    const start = offset;
    offset += Math.ceil(e.data.length / 4) * 4;
    return start;
  });

  const output = new ArrayBuffer(offset);
  const outView = new DataView(output);
  const outBytes = new Uint8Array(output);

  outView.setUint32(0, view.getUint32(0));
  outView.setUint16(4, n);
  outView.setUint16(6, maxPowerOf2 * 16);
  outView.setUint16(8, Math.log2(maxPowerOf2));
  outView.setUint16(10, n * 16 - maxPowerOf2 * 16);

  entries.forEach((e, i) => {
    const rec = 12 + i * 16;
    for (let j = 0; j < 4; j++) outView.setUint8(rec + j, e.tag.charCodeAt(j));
    outView.setUint32(rec + 4, 0);
    outView.setUint32(rec + 8, offsets[i]);
    outView.setUint32(rec + 12, e.data.length);
    outBytes.set(e.data, offsets[i]);
  });

  return output;
}

/**
 * Parses a font, tolerating broken advanced layout tables.
 * Fonts exported by older builds of this app carry a corrupt GPOS table and make
 * opentype.parse() throw; dropping the layout tables lets them be re-opened.
 * Returns degraded = true when the fallback path was used.
 */
export function parseFontResilient(buffer: ArrayBuffer): { font: opentype.Font; degraded: boolean } {
  try {
    return { font: opentype.parse(buffer.slice(0)), degraded: false };
  } catch (err) {
    const cleaned = stripFontTables(buffer, ['GPOS', 'GSUB', 'GDEF', 'BASE', 'kern']);
    return { font: opentype.parse(cleaned), degraded: true };
  }
}

/**
 * Merges advanced OpenType layout tables (GPOS, GSUB, GDEF, BASE) from the original font 
 * into the compiled font buffer to guarantee pristine original kerning and substitution features.
 * Also injects custom GPOS and kern tables for full cross-browser kerning compatibility.
 */
export function injectAdvancedLayoutTables(
  compiledBuffer: ArrayBuffer, 
  originalBuffer: ArrayBuffer, 
  skipGPOS: boolean = false,
  kernTableBytes?: Uint8Array,
  gposTableBytes?: Uint8Array
): ArrayBuffer {
  try {
    const parseTables = (buf: ArrayBuffer) => {
      const view = new DataView(buf);
      const sfntVersion = view.getUint32(0);
      const numTables = view.getUint16(4);
      
      const tables: Record<string, Uint8Array> = {};
      let offset = 12;
      for (let i = 0; i < numTables; i++) {
        const tagBytes = [
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3)
        ];
        const tag = String.fromCharCode(...tagBytes);
        const tableOffset = view.getUint32(offset + 8);
        const length = view.getUint32(offset + 12);
        
        const data = new Uint8Array(buf.slice(tableOffset, tableOffset + length));
        tables[tag] = data;
        
        offset += 16;
      }
      return { sfntVersion, tables };
    };

    const original = parseTables(originalBuffer);
    const compiled = parseTables(compiledBuffer);

    let injectedAny = false;

    // Inject/overwrite custom GPOS table if provided
    if (gposTableBytes && gposTableBytes.length > 0) {
      compiled.tables['GPOS'] = gposTableBytes;
      injectedAny = true;
    } else if (skipGPOS && compiled.tables['GPOS']) {
      delete compiled.tables['GPOS'];
      injectedAny = true;
    }

    // Inject/overwrite the custom legacy kern table if provided
    if (kernTableBytes && kernTableBytes.length > 0) {
      compiled.tables['kern'] = kernTableBytes;
      injectedAny = true;
    }

    const tagsToInject = ['GSUB', 'GDEF', 'BASE'];
    if (!gposTableBytes && !skipGPOS) {
      tagsToInject.push('GPOS');
    }

    tagsToInject.forEach(tag => {
      if (original.tables[tag] && !compiled.tables[tag]) {
        compiled.tables[tag] = original.tables[tag];
        injectedAny = true;
      }
    });

    if (!injectedAny) {
      return compiledBuffer;
    }

    const tableTags = Object.keys(compiled.tables).sort();
    const numTables = tableTags.length;

    let maxPowerOf2 = 1;
    while (maxPowerOf2 * 2 <= numTables) {
      maxPowerOf2 *= 2;
    }
    const searchRange = maxPowerOf2 * 16;
    const entrySelector = Math.log2(maxPowerOf2);
    const rangeShift = numTables * 16 - searchRange;

    const directoryOffset = 12;
    const firstTableOffset = directoryOffset + numTables * 16;

    let currentOffset = firstTableOffset;
    const offsets: Record<string, number> = {};
    const paddedLengths: Record<string, number> = {};

    tableTags.forEach(tag => {
      offsets[tag] = currentOffset;
      const data = compiled.tables[tag];
      const length = data.length;
      const paddedLength = Math.ceil(length / 4) * 4;
      paddedLengths[tag] = paddedLength;
      currentOffset += paddedLength;
    });

    const outputBuffer = new ArrayBuffer(currentOffset);
    const outputView = new DataView(outputBuffer);
    const outputBytes = new Uint8Array(outputBuffer);

    outputView.setUint32(0, compiled.sfntVersion);
    outputView.setUint16(4, numTables);
    outputView.setUint16(6, searchRange);
    outputView.setUint16(8, entrySelector);
    outputView.setUint16(10, rangeShift);

    let recOffset = directoryOffset;
    tableTags.forEach(tag => {
      const data = compiled.tables[tag];
      const offset = offsets[tag];
      const length = data.length;
      const checksum = calculateTableChecksum(data);

      for (let j = 0; j < 4; j++) {
        outputView.setUint8(recOffset + j, tag.charCodeAt(j));
      }
      outputView.setUint32(recOffset + 4, checksum);
      outputView.setUint32(recOffset + 8, offset);
      outputView.setUint32(recOffset + 12, length);

      outputBytes.set(data, offset);
      const paddedLength = paddedLengths[tag];
      for (let p = length; p < paddedLength; p++) {
        outputBytes[offset + p] = 0;
      }

      recOffset += 16;
    });

    const headData = compiled.tables['head'];
    if (headData) {
      const headOffset = offsets['head'];
      if (headOffset + 12 <= outputBuffer.byteLength) {
        outputView.setUint32(headOffset + 8, 0);
      }

      const fileChecksum = calculateTableChecksum(new Uint8Array(outputBuffer));
      const checksumAdjustment = (0xB1B0AFBA - fileChecksum) >>> 0;

      if (headOffset + 12 <= outputBuffer.byteLength) {
        outputView.setUint32(headOffset + 8, checksumAdjustment);
      }
    }

    return outputBuffer;
  } catch (err) {
    console.error('Failed to inject advanced layout tables:', err);
    return compiledBuffer;
  }
}

// ============================================================================
// VERSION 2.0 AUTOMATED COMPOSITION ENGINE UTILITIES
// ============================================================================


// Default professional vector shapes for 9 Vietnamese diacritics
