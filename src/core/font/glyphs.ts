import * as opentype from 'opentype.js';
import type { GlyphCategory, FontGlyphItem } from '../session';

export function categorizeGlyph(unicode?: number, name?: unknown): GlyphCategory {
  // Some fonts carry non-string glyph names; coerce rather than throw
  const safeName = typeof name === 'string' ? name : undefined;
  if (unicode === undefined || unicode === null) {
    if (safeName) {
      const lower = safeName.toLowerCase();
      if (/^[a-z]$/.test(lower) || lower.includes('letter')) return 'latin';
      if (/^\d$/.test(lower) || lower.includes('zero') || lower.includes('nine')) return 'digits';
      if (lower.includes('comma') || lower.includes('period') || lower.includes('colon') || lower.includes('quote')) return 'punctuation';
      if (lower.includes('currency') || lower.includes('dollar') || lower.includes('euro') || lower.includes('plus')) return 'symbols';
    }
    return 'other';
  }

  // Digits: 0-9 (U+0030 to U+0039)
  if (unicode >= 0x0030 && unicode <= 0x0039) {
    return 'digits';
  }

  // Basic Latin & Latin-1 Supplement & Extended: A-Z, a-z, accents
  if (
    (unicode >= 0x0041 && unicode <= 0x005A) ||
    (unicode >= 0x0061 && unicode <= 0x007A) ||
    (unicode >= 0x00C0 && unicode <= 0x024F) ||
    (unicode >= 0x1E00 && unicode <= 0x1EFF)
  ) {
    return 'latin';
  }

  // Punctuation
  if (
    (unicode >= 0x0021 && unicode <= 0x002F) ||
    (unicode >= 0x003A && unicode <= 0x0040) ||
    (unicode >= 0x005B && unicode <= 0x0060) ||
    (unicode >= 0x007B && unicode <= 0x007E) ||
    (unicode >= 0x2000 && unicode <= 0x206F)
  ) {
    return 'punctuation';
  }

  // Symbols, Currency, Math
  if (
    (unicode >= 0x0024 && unicode <= 0x0025) || // $, %
    (unicode >= 0x00A2 && unicode <= 0x00AF) || // ¢, £, ¥, §, etc.
    (unicode >= 0x20A0 && unicode <= 0x20CF) || // Currency symbols (₫, €, etc.)
    (unicode >= 0x2100 && unicode <= 0x214F) || // Letterlike symbols
    (unicode >= 0x2190 && unicode <= 0x21FF) || // Arrows
    (unicode >= 0x2200 && unicode <= 0x22FF)    // Mathematical Operators
  ) {
    return 'symbols';
  }

  // Extended alphabets: Greek, Cyrillic, etc.
  if (unicode >= 0x0370 && unicode <= 0x1CFF) {
    return 'extended';
  }

  return 'other';
}

/**
 * Extracts and catalogues all glyphs from the loaded opentype.Font.
 */
export function getGlyphsFromFont(font: opentype.Font): FontGlyphItem[] {
  if (!font || !font.glyphs) return [];
  const items: FontGlyphItem[] = [];
  const unitsPerEm = font.unitsPerEm || 1000;

  for (let i = 0; i < font.glyphs.length; i++) {
    const glyph = font.glyphs.get(i);
    if (!glyph) continue;

    let char = '';
    const unicode = glyph.unicode;
    if (unicode !== undefined && unicode > 0) {
      try {
        char = String.fromCodePoint(unicode);
      } catch {
        char = '';
      }
    }

    let svgPath = '';
    try {
      // Extract native upright path in font design units (baseline at 0, Y > 0 for ascender)
      const rawPath = typeof (glyph as any).path === 'function' ? (glyph as any).path() : glyph.path;
      if (rawPath && rawPath.commands && rawPath.commands.length > 0) {
        svgPath = rawPath.toPathData(2);
      } else {
        const p = glyph.getPath(0, 0, unitsPerEm);
        if (p && p.commands && p.commands.length > 0) {
          // getPath inverts Y (-cmd.y), so flip it back to upright font coordinates
          p.commands.forEach((c: any) => {
            if (c.y !== undefined) c.y = -c.y;
            if (c.y1 !== undefined) c.y1 = -c.y1;
            if (c.y2 !== undefined) c.y2 = -c.y2;
          });
          svgPath = p.toPathData(2);
        }
      }
    } catch {
      svgPath = '';
    }

    const unicodes = glyph.unicodes && glyph.unicodes.length > 0
      ? glyph.unicodes
      : (unicode ? [unicode] : []);

    const category = categorizeGlyph(unicode, glyph.name);

    items.push({
      index: i,
      name: glyph.name || (char ? `uni${(unicode || 0).toString(16).toUpperCase()}` : `glyph_${i}`),
      unicode,
      unicodes,
      char,
      advanceWidth: glyph.advanceWidth || 0,
      svgPath,
      category
    });
  }

  return items;
}

/**
 * Finds the next available Unicode codepoint in the Private Use Area (0xE000 - 0xF8FF)
 * that is not currently assigned to any glyph in the font.
 */
export function getNextAvailablePuaCodepoint(font: opentype.Font, reservedCodes: Set<number>): number {
  let candidate = 0xE000;
  while (candidate <= 0xF8FF) {
    if (!reservedCodes.has(candidate)) {
      try {
        const char = String.fromCodePoint(candidate);
        if (font.charToGlyphIndex(char) === 0) {
          return candidate;
        }
      } catch {
        // Continue
      }
    }
    candidate++;
  }
  return 0xF000;
}

/**
 * Extracts raw SVG path 'd' string from pasted SVG tags or raw coordinate strings.
 */

export function cloneKerningPairs(
  kerningPairs: Record<string, number>,
  sourceIndex: number,
  targetIndex: number,
  trackingOffset: number = 0
): void {
  if (sourceIndex === targetIndex && trackingOffset === 0) return;
  const newPairs: Record<string, number> = {};

  for (const [key, val] of Object.entries(kerningPairs)) {
    const parts = key.split(',');
    if (parts.length !== 2) continue;
    const idx1 = parseInt(parts[0], 10);
    const idx2 = parseInt(parts[1], 10);

    const adjustedVal = Math.round(val + trackingOffset);

    if (idx1 === sourceIndex && idx2 === sourceIndex) {
      newPairs[`${targetIndex},${targetIndex}`] = adjustedVal;
      newPairs[`${targetIndex},${sourceIndex}`] = adjustedVal;
      newPairs[`${sourceIndex},${targetIndex}`] = adjustedVal;
    } else if (idx1 === sourceIndex) {
      newPairs[`${targetIndex},${idx2}`] = adjustedVal;
    } else if (idx2 === sourceIndex) {
      newPairs[`${idx1},${targetIndex}`] = adjustedVal;
    }
  }

  Object.assign(kerningPairs, newPairs);
}

/**
 * Calculates the checksum of a font table according to OpenType specifications.
 */
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
 * Builds a binary legacy 'kern' table (format 0, version 0) from font.kerningPairs.
 * Returns null if there are no valid pairs, preventing empty/malformed table injection.
 */
