import * as opentype from 'opentype.js';
export function getXHeightFromFont(font: any): number {
  if (!font) return 500;

  const measured: number[] = [];
  for (const ch of ['x', 'a', 'e', 'o', 'u']) {
    try {
      const idx = font.charToGlyphIndex(ch);
      if (idx > 0) {
        const box = font.glyphs.get(idx)?.getBoundingBox();
        if (box && box.y2 > 100) measured.push(box.y2);
      }
    } catch {
      // ignore individual glyph failures
    }
  }

  if (measured.length > 0) {
    measured.sort((a, b) => a - b);
    return measured[Math.floor(measured.length / 2)];
  }

  // NOTE: the OS/2 field is sxHeight. There is no sTypoXHeight - reading that name
  // returned undefined for every font and silently fell through to a hardcoded 500.
  const sxHeight = font.tables?.os2?.sxHeight;
  if (typeof sxHeight === 'number' && sxHeight > 100) return sxHeight;

  return Math.round((font.unitsPerEm || 1000) * 0.5);
}

export function getGroupReferenceHeights(font: opentype.Font | null): { xHeightMax: number; capHeightMax: number } {
  if (!font) return { xHeightMax: 500, capHeightMax: 700 };

  // Use flat lowercase vowels/letters without ascenders or dots
  const lowercaseFlatVowels = ['x', 'a', 'e', 'o', 'u'];
  const uppercaseFlatVowels = ['X', 'A', 'E', 'O', 'U', 'H'];

  let measuredXHeights: number[] = [];
  lowercaseFlatVowels.forEach(ch => {
    const gIndex = font.charToGlyphIndex(ch);
    if (gIndex > 0) {
      const g = font.glyphs.get(gIndex);
      if (g) {
        const bbox = g.getBoundingBox();
        if (bbox && bbox.y2 > 100) {
          measuredXHeights.push(bbox.y2);
        }
      }
    }
  });

  let measuredCapHeights: number[] = [];
  uppercaseFlatVowels.forEach(ch => {
    const gIndex = font.charToGlyphIndex(ch);
    if (gIndex > 0) {
      const g = font.glyphs.get(gIndex);
      if (g) {
        const bbox = g.getBoundingBox();
        if (bbox && bbox.y2 > 200) {
          measuredCapHeights.push(bbox.y2);
        }
      }
    }
  });

  let xHeightMax = 0;
  if (measuredXHeights.length > 0) {
    xHeightMax = Math.max(...measuredXHeights);
  } else if (font.tables.os2 && font.tables.os2.sxHeight && font.tables.os2.sxHeight > 200) {
    xHeightMax = font.tables.os2.sxHeight;
  } else {
    xHeightMax = 500;
  }

  let capHeightMax = 0;
  if (measuredCapHeights.length > 0) {
    capHeightMax = Math.max(...measuredCapHeights);
  } else if (font.tables.os2 && font.tables.os2.sCapHeight && font.tables.os2.sCapHeight > 300) {
    capHeightMax = font.tables.os2.sCapHeight;
  } else {
    capHeightMax = font.ascender || 700;
  }

  return { xHeightMax, capHeightMax };
}

/**
 * Calculates the exact translation scaling and offsets required to automatically align a diacritic on top/bottom of a base glyph.
 * Uses bounding boxes and Group Reference Heights for highly professional type design results.
 */
