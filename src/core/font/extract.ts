import type { DiacriticTemplate } from '../session';
import { parseSvgPath, transformCommands, getExactBoundingBox, getBoundingBox, commandsToSvgPathD, orientContours, getGlyphContours } from '../geometry/path';
import { removeDotFromICommands } from '../geometry/boolean';
export { getGlyphContours } from '../geometry/path';
import { getXHeightFromFont, getGroupReferenceHeights } from '../font/metrics';
import { VIETNAMESE_BASE_MAP } from '../viet/recipes';
import * as opentype from 'opentype.js';
export function findCandidateGlyph(font: any, diaId: string): any {
  if (!font) return null;

  // 1. Try extracting diacritic shape directly from existing precomposed Vietnamese characters in the font (e.g. 'â', 'ô', 'ă', etc.)
  const extractedGlyph = extractDiacriticFromComposedGlyph(font, diaId);
  if (extractedGlyph) {
    return extractedGlyph;
  }

  const searchConfig: Record<string, { unicodes: number[]; names: string[] }> = {
    grave: {
      unicodes: [0x0060, 0x0300, 0x02CB],
      names: ['grave', 'graveaccent', 'uni0300', 'uni0060', 'dauhuyen']
    },
    acute: {
      unicodes: [0x00B4, 0x0301, 0x02CA],
      names: ['acute', 'acuteaccent', 'uni0301', 'uni00B4', 'dausac']
    },
    hook: {
      unicodes: [0x0309, 0x02C0],
      names: ['hookabove', 'hookabovecomb', 'uni0309', 'hook', 'dauhoi']
    },
    tilde: {
      unicodes: [0x007E, 0x02DC, 0x0303],
      names: ['tilde', 'tildeaccent', 'uni0303', 'uni007E', 'daunga']
    },
    dot_below: {
      unicodes: [0x0323, 0x2024],
      names: ['dotbelow', 'dotbelowcomb', 'uni0323', 'dot', 'daunang']
    },
    circumflex: {
      unicodes: [0x005E, 0x02C6, 0x0302],
      names: ['circumflex', 'circumflexaccent', 'uni0302', 'uni005E', 'hat', 'daumu']
    },
    breve: {
      unicodes: [0x02D8, 0x0306],
      names: ['breve', 'breveaccent', 'uni0306', 'uni02D8', 'dautrang']
    },
    horn_o: {
      unicodes: [0x031B, 0x002C],
      names: ['horn', 'horncomb', 'uni031B', 'daumoc', 'comma', 'uni002C']
    },
    horn_u: {
      unicodes: [0x031B, 0x002C],
      names: ['horn', 'horncomb', 'uni031B', 'daumoc', 'comma', 'uni002C']
    },
    bar: {
      unicodes: [0x00AF, 0x002D, 0x2212, 0x0304],
      names: ['macron', 'hyphen', 'minus', 'uni002D', 'uni00AF', 'bar', 'gachngang']
    }
  };

  const config = searchConfig[diaId];
  if (!config) return null;

  // 2. Try search by character codes in the font mapping
  for (const unicode of config.unicodes) {
    try {
      const charStr = String.fromCharCode(unicode);
      const idx = font.charToGlyphIndex(charStr);
      if (idx > 0) {
        const glyph = font.glyphs.get(idx);
        if (glyph && glyph.path && glyph.path.commands && glyph.path.commands.length > 0) {
          return glyph;
        }
      }
    } catch (e) {
      // Ignored
    }
  }

  // 3. Scan font glyph names sequentially
  if (font.glyphs && font.glyphs.length > 0) {
    for (let i = 0; i < font.glyphs.length; i++) {
      try {
        const glyph = font.glyphs.get(i);
        if (glyph && glyph.name) {
          const lowerName = glyph.name.toLowerCase();
          if (config.names.includes(lowerName)) {
            if (glyph.path && glyph.path.commands && glyph.path.commands.length > 0) {
              return glyph;
            }
          }
        }
      } catch (e) {
        // Ignored
      }
    }
  }

  return null;
}

/**
 * Splits path commands into separate closed/open contours (grouped by MoveTo commands).
 */

/**
 * Extracts a specific diacritic mark from existing precomposed Vietnamese characters in the font
 * (e.g., isolating the acute mark from 'á', tilde from 'ẽ', horn from 'ơ'/'ư', etc.)
 */
export function extractDiacriticFromComposedGlyph(font: any, diaId: string): any {
  if (!font) return null;

  const PRECOMPOSED_MAP: Record<string, {
    targetType: 'upper' | 'lower' | 'horn' | 'bar';
    candidates: Array<{ composedChar: string; baseChar: string }>;
  }> = {
    grave: {
      targetType: 'upper',
      candidates: [
        { composedChar: 'à', baseChar: 'a' },
        { composedChar: 'è', baseChar: 'e' },
        { composedChar: 'ò', baseChar: 'o' },
        { composedChar: 'ù', baseChar: 'u' },
        { composedChar: 'ì', baseChar: 'i' },
        { composedChar: 'ỳ', baseChar: 'y' },
        { composedChar: 'À', baseChar: 'A' },
        { composedChar: 'È', baseChar: 'E' },
        { composedChar: 'Ò', baseChar: 'O' },
        { composedChar: 'Ù', baseChar: 'U' },
        { composedChar: 'Ỳ', baseChar: 'Y' },
        { composedChar: 'ầ', baseChar: 'â' },
        { composedChar: 'ề', baseChar: 'ê' },
        { composedChar: 'ồ', baseChar: 'ô' },
        { composedChar: 'ằ', baseChar: 'ă' },
        { composedChar: 'ờ', baseChar: 'ơ' },
        { composedChar: 'ừ', baseChar: 'ư' },
        { composedChar: 'Ầ', baseChar: 'Â' },
        { composedChar: 'Ề', baseChar: 'Ê' },
        { composedChar: 'Ồ', baseChar: 'Ô' },
        { composedChar: 'Ằ', baseChar: 'Ă' },
        { composedChar: 'Ờ', baseChar: 'Ơ' },
        { composedChar: 'Ừ', baseChar: 'Ư' }
      ]
    },
    acute: {
      targetType: 'upper',
      candidates: [
        { composedChar: 'á', baseChar: 'a' },
        { composedChar: 'é', baseChar: 'e' },
        { composedChar: 'ó', baseChar: 'o' },
        { composedChar: 'ú', baseChar: 'u' },
        { composedChar: 'í', baseChar: 'i' },
        { composedChar: 'ý', baseChar: 'y' },
        { composedChar: 'Á', baseChar: 'A' },
        { composedChar: 'É', baseChar: 'E' },
        { composedChar: 'Ó', baseChar: 'O' },
        { composedChar: 'Ú', baseChar: 'U' },
        { composedChar: 'Ý', baseChar: 'Y' },
        { composedChar: 'ấ', baseChar: 'â' },
        { composedChar: 'ế', baseChar: 'ê' },
        { composedChar: 'ố', baseChar: 'ô' },
        { composedChar: 'ắ', baseChar: 'ă' },
        { composedChar: 'ớ', baseChar: 'ơ' },
        { composedChar: 'ứ', baseChar: 'ư' },
        { composedChar: 'Ấ', baseChar: 'Â' },
        { composedChar: 'Ế', baseChar: 'Ê' },
        { composedChar: 'Ố', baseChar: 'Ô' },
        { composedChar: 'Ắ', baseChar: 'Ă' },
        { composedChar: 'Ớ', baseChar: 'Ơ' },
        { composedChar: 'Ứ', baseChar: 'Ư' }
      ]
    },
    hook: {
      targetType: 'upper',
      candidates: [
        { composedChar: 'ả', baseChar: 'a' },
        { composedChar: 'ẻ', baseChar: 'e' },
        { composedChar: 'ỏ', baseChar: 'o' },
        { composedChar: 'ủ', baseChar: 'u' },
        { composedChar: 'ỉ', baseChar: 'i' },
        { composedChar: 'ỷ', baseChar: 'y' },
        { composedChar: 'Ả', baseChar: 'A' },
        { composedChar: 'Ẻ', baseChar: 'E' },
        { composedChar: 'Ỏ', baseChar: 'O' },
        { composedChar: 'Ủ', baseChar: 'U' },
        { composedChar: 'Ỷ', baseChar: 'Y' },
        { composedChar: 'ẩ', baseChar: 'â' },
        { composedChar: 'ể', baseChar: 'ê' },
        { composedChar: 'ổ', baseChar: 'ô' },
        { composedChar: 'ẳ', baseChar: 'ă' },
        { composedChar: 'ở', baseChar: 'ơ' },
        { composedChar: 'ử', baseChar: 'ư' },
        { composedChar: 'Ẩ', baseChar: 'Â' },
        { composedChar: 'Ể', baseChar: 'Ê' },
        { composedChar: 'Ổ', baseChar: 'Ô' },
        { composedChar: 'Ẳ', baseChar: 'Ă' },
        { composedChar: 'Ở', baseChar: 'Ơ' },
        { composedChar: 'Ử', baseChar: 'Ư' }
      ]
    },
    tilde: {
      targetType: 'upper',
      candidates: [
        { composedChar: 'ã', baseChar: 'a' },
        { composedChar: 'ẽ', baseChar: 'e' },
        { composedChar: 'õ', baseChar: 'o' },
        { composedChar: 'ũ', baseChar: 'u' },
        { composedChar: 'ĩ', baseChar: 'i' },
        { composedChar: 'ỹ', baseChar: 'y' },
        { composedChar: 'Ã', baseChar: 'A' },
        { composedChar: 'Ẽ', baseChar: 'E' },
        { composedChar: 'Õ', baseChar: 'O' },
        { composedChar: 'Ũ', baseChar: 'U' },
        { composedChar: 'Ỹ', baseChar: 'Y' },
        { composedChar: 'ẫ', baseChar: 'â' },
        { composedChar: 'ễ', baseChar: 'ê' },
        { composedChar: 'ỗ', baseChar: 'ô' },
        { composedChar: 'ẵ', baseChar: 'ă' },
        { composedChar: 'ỡ', baseChar: 'ơ' },
        { composedChar: 'ữ', baseChar: 'ư' },
        { composedChar: 'Ẫ', baseChar: 'Â' },
        { composedChar: 'Ễ', baseChar: 'Ê' },
        { composedChar: 'Ỗ', baseChar: 'Ô' },
        { composedChar: 'Ẵ', baseChar: 'Ă' },
        { composedChar: 'Ỡ', baseChar: 'Ơ' },
        { composedChar: 'Ữ', baseChar: 'Ư' }
      ]
    },
    dot_below: {
      targetType: 'lower',
      candidates: [
        { composedChar: 'ạ', baseChar: 'a' },
        { composedChar: 'ẹ', baseChar: 'e' },
        { composedChar: 'ọ', baseChar: 'o' },
        { composedChar: 'ụ', baseChar: 'u' },
        { composedChar: 'ị', baseChar: 'i' },
        { composedChar: 'ỵ', baseChar: 'y' },
        { composedChar: 'Ạ', baseChar: 'A' },
        { composedChar: 'Ẹ', baseChar: 'E' },
        { composedChar: 'Ọ', baseChar: 'O' },
        { composedChar: 'Ụ', baseChar: 'U' },
        { composedChar: 'Ỵ', baseChar: 'Y' },
        { composedChar: 'ậ', baseChar: 'â' },
        { composedChar: 'ệ', baseChar: 'ê' },
        { composedChar: 'ộ', baseChar: 'ô' },
        { composedChar: 'ặ', baseChar: 'ă' },
        { composedChar: 'ợ', baseChar: 'ơ' },
        { composedChar: 'ự', baseChar: 'ư' },
        { composedChar: 'Ậ', baseChar: 'Â' },
        { composedChar: 'Ệ', baseChar: 'Ê' },
        { composedChar: 'Ộ', baseChar: 'Ô' },
        { composedChar: 'Ặ', baseChar: 'Ă' },
        { composedChar: 'Ợ', baseChar: 'Ơ' },
        { composedChar: 'Ự', baseChar: 'Ư' }
      ]
    },
    circumflex: {
      targetType: 'upper',
      candidates: [
        { composedChar: 'â', baseChar: 'a' },
        { composedChar: 'ê', baseChar: 'e' },
        { composedChar: 'ô', baseChar: 'o' },
        { composedChar: 'Â', baseChar: 'A' },
        { composedChar: 'Ê', baseChar: 'E' },
        { composedChar: 'Ô', baseChar: 'O' }
      ]
    },
    breve: {
      targetType: 'upper',
      candidates: [
        { composedChar: 'ă', baseChar: 'a' },
        { composedChar: 'Ă', baseChar: 'A' }
      ]
    },
    horn_o: {
      targetType: 'horn',
      candidates: [
        { composedChar: 'ơ', baseChar: 'o' },
        { composedChar: 'Ơ', baseChar: 'O' }
      ]
    },
    horn_u: {
      targetType: 'horn',
      candidates: [
        { composedChar: 'ư', baseChar: 'u' },
        { composedChar: 'Ư', baseChar: 'U' }
      ]
    },
    bar: {
      targetType: 'bar',
      candidates: [
        { composedChar: 'đ', baseChar: 'd' },
        { composedChar: 'Đ', baseChar: 'D' }
      ]
    }
  };

  const config = PRECOMPOSED_MAP[diaId];
  if (!config) return null;

  for (const { composedChar, baseChar } of config.candidates) {
    try {
      const compIdx = font.charToGlyphIndex(composedChar);
      if (compIdx <= 0) continue;

      const compGlyph = font.glyphs.get(compIdx);
      if (!compGlyph || !compGlyph.path || !compGlyph.path.commands || compGlyph.path.commands.length === 0) {
        continue;
      }

      const baseIdx = font.charToGlyphIndex(baseChar);
      let baseBBox = { xMin: 50, xMax: 450, yMin: 0, yMax: getXHeightFromFont(font) };

      let baseGlyph: any = null;
      if (baseIdx > 0) {
        baseGlyph = font.glyphs.get(baseIdx);
        if (baseGlyph && baseGlyph.path && baseGlyph.path.commands && baseGlyph.path.commands.length > 0) {
          const baseCmds = baseChar === 'i' ? removeDotFromICommands(baseGlyph.path.commands) : baseGlyph.path.commands;
          baseBBox = getExactBoundingBox(baseCmds);
        }
      }

      const contours = getGlyphContours(compGlyph.path.commands);
      if (contours.length <= 1 && config.targetType !== 'bar') {
        // If single contour and not a bar, diacritic is merged into body, hard to split safely
        continue;
      }

      const matchedCmds: any[] = [];

      for (const contour of contours) {
        const cBBox = getExactBoundingBox(contour);
        const baseHeight = Math.max(100, baseBBox.yMax - baseBBox.yMin);
        const baseWidth = Math.max(100, baseBBox.xMax - baseBBox.xMin);

        let isMatch = false;

        if (config.targetType === 'upper') {
          const isAccentBase = ['â', 'ê', 'ô', 'ă', 'ơ', 'ư', 'Â', 'Ê', 'Ô', 'Ă', 'Ơ', 'Ư'].includes(baseChar);
          if (isAccentBase) {
            // Secondary tone mark sitting above/on top of a precomposed base character (like 'â', 'ă')
            if (cBBox.yMin >= baseBBox.yMax - 100 && cBBox.yMax > baseBBox.yMax - 30) {
              isMatch = true;
            }
          } else {
            // Primary tone mark sitting in the upper region of a simple base character (like 'a', 'e', 'o')
            if (
              cBBox.yMin >= baseBBox.yMin + baseHeight * 0.35 &&
              cBBox.yMax >= baseBBox.yMin + baseHeight * 0.55 &&
              cBBox.yMin >= baseBBox.yMax - 150
            ) {
              isMatch = true;
            }
          }
        } else if (config.targetType === 'lower') {
          // Contour sits below bottom of base glyph
          if (cBBox.yMax <= baseBBox.yMin + baseHeight * 0.45 && cBBox.yMin < baseBBox.yMin + 30) {
            isMatch = true;
          }
        } else if (config.targetType === 'horn') {
          // Contour sits near top-right of base glyph (for ơ / ư)
          if (
            cBBox.xMin >= baseBBox.xMin + baseWidth * 0.3 &&
            cBBox.yMin >= baseBBox.yMin + baseHeight * 0.3 &&
            cBBox.yMax > baseBBox.yMin + baseHeight * 0.45 &&
            (cBBox.xMax - cBBox.xMin) < baseWidth * 0.85
          ) {
            isMatch = true;
          }
        } else if (config.targetType === 'bar') {
          // Contour is horizontal crossbar on d/D
          if (
            cBBox.yMin >= baseBBox.yMin + baseHeight * 0.15 &&
            cBBox.yMax <= baseBBox.yMax * 0.95 &&
            (cBBox.xMin <= baseBBox.xMin + 20 || cBBox.xMax >= baseBBox.xMax - 20)
          ) {
            isMatch = true;
          }
        }

        if (isMatch) {
          matchedCmds.push(...contour);
        }
      }

      if (matchedCmds.length > 0) {
        // Construct extracted glyph using opentype.Path instance
        const path = new opentype.Path();
        path.commands = matchedCmds;
        const dummyGlyph = new opentype.Glyph({
          name: diaId + '_extracted',
          advanceWidth: baseGlyph?.advanceWidth || compGlyph.advanceWidth || 500,
          path: path
        });
        return dummyGlyph;
      }
    } catch (err) {
      // Ignore individual character extraction errors and continue to next candidate
    }
  }

  return null;
}

/**
 * Extracts the contour path commands from an existing font glyph,
 * centers it horizontally, normalizes coordinates uniformly to a standard 1000-UPM bounding scale
 * to preserve original designer proportions, and converts it into a standard Y-down SVG path string.
 */
export function extractSvgFromGlyph(glyph: any, fontUnitsPerEm: number = 1000): string {
  if (!glyph || !glyph.path || !glyph.path.commands || glyph.path.commands.length === 0) {
    return '';
  }

  const baseCmds = glyph.path.commands;

  // Compute bounding box manually to ensure high precision
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  baseCmds.forEach((cmd: any) => {
    if (cmd.x !== undefined) {
      if (cmd.x < xMin) xMin = cmd.x;
      if (cmd.x > xMax) xMax = cmd.x;
    }
    if (cmd.y !== undefined) {
      if (cmd.y < yMin) yMin = cmd.y;
      if (cmd.y > yMax) yMax = cmd.y;
    }
    if (cmd.x1 !== undefined) {
      if (cmd.x1 < xMin) xMin = cmd.x1;
      if (cmd.x1 > xMax) xMax = cmd.x1;
    }
    if (cmd.y1 !== undefined) {
      if (cmd.y1 < yMin) yMin = cmd.y1;
      if (cmd.y1 > yMax) yMax = cmd.y1;
    }
    if (cmd.x2 !== undefined) {
      if (cmd.x2 < xMin) xMin = cmd.x2;
      if (cmd.x2 > xMax) xMax = cmd.x2;
    }
    if (cmd.y2 !== undefined) {
      if (cmd.y2 < yMin) yMin = cmd.y2;
      if (cmd.y2 > yMax) yMax = cmd.y2;
    }
  });

  if (xMin === Infinity || yMin === Infinity) return '';

  const cx = (xMin + xMax) / 2;

  // Uniformly scale to a standard 1000 UPM space, and apply 0.5 reduction to make extracted diacritics smaller by 1/2 of their current size.
  const targetScale = (1000 / (fontUnitsPerEm || 1000)) * 0.5;

  const parts: string[] = [];

  baseCmds.forEach((cmd: any) => {
    // Horizontal alignment relative to center of glyph; vertical flip and offset relative to yMax, then scaled
    const tX = (x: number) => (x - cx) * targetScale;
    const tY = (y: number) => (yMax - y) * targetScale;

    if (cmd.type === 'M') {
      parts.push(`M${tX(cmd.x).toFixed(1)},${tY(cmd.y).toFixed(1)}`);
    } else if (cmd.type === 'L') {
      parts.push(`L${tX(cmd.x).toFixed(1)},${tY(cmd.y).toFixed(1)}`);
    } else if (cmd.type === 'Q') {
      parts.push(`Q${tX(cmd.x1).toFixed(1)},${tY(cmd.y1).toFixed(1)} ${tX(cmd.x).toFixed(1)},${tY(cmd.y).toFixed(1)}`);
    } else if (cmd.type === 'C') {
      parts.push(`C${tX(cmd.x1).toFixed(1)},${tY(cmd.y1).toFixed(1)} ${tX(cmd.x2).toFixed(1)},${tY(cmd.y2).toFixed(1)} ${tX(cmd.x).toFixed(1)},${tY(cmd.y).toFixed(1)}`);
    } else if (cmd.type === 'Z') {
      parts.push('Z');
    }
  });

  return parts.join('');
}

/**
 * Gets the SVG path string d="..." for a full native character glyph in the font.
 */
export function getNativeCharSvgPath(font: any, char: string): string {
  if (!font) return '';
  const idx = font.charToGlyphIndex(char);
  if (idx <= 0) return '';
  const glyph = font.glyphs.get(idx);
  if (!glyph || !glyph.path) return '';
  const ascender = font.tables?.os2?.sTypoAscender || font.ascender || 800;
  const upm = font.unitsPerEm || 1000;
  const path = glyph.getPath(0, ascender, upm);
  return path.toPathData(2);
}

/**
 * Gets the full <svg>...</svg> element string for a full native character glyph in the font.
 */
export function getNativeCharFullSvg(font: any, char: string): string {
  const d = getNativeCharSvgPath(font, char);
  if (!d) return '';
  const upm = font?.unitsPerEm || 1000;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${upm} ${upm}" width="100%" height="100%">\n  <path d="${d}" fill="currentColor" />\n</svg>`;
}

/**
 * Isolates and extracts the diacritic contour from a specific precomposed character (e.g. 'ã' relative to 'a') in the font.
 */
export function extractDiacriticFromSpecificChar(font: any, composedChar: string, baseChar: string): any {
  if (!font) return null;
  const compIdx = font.charToGlyphIndex(composedChar);
  if (compIdx <= 0) return null;
  const compGlyph = font.glyphs.get(compIdx);
  if (!compGlyph || !compGlyph.path || !compGlyph.path.commands || compGlyph.path.commands.length === 0) {
    return null;
  }

  const baseIdx = font.charToGlyphIndex(baseChar);
  let baseBBox = { xMin: 50, xMax: 450, yMin: 0, yMax: getXHeightFromFont(font) };
  let baseGlyph: any = null;
  if (baseIdx > 0) {
    baseGlyph = font.glyphs.get(baseIdx);
    if (baseGlyph && baseGlyph.path && baseGlyph.path.commands && baseGlyph.path.commands.length > 0) {
      const baseCmds = baseChar === 'i' ? removeDotFromICommands(baseGlyph.path.commands) : baseGlyph.path.commands;
      baseBBox = getExactBoundingBox(baseCmds);
    }
  }

  const contours = getGlyphContours(compGlyph.path.commands);
  const matchedCmds: any[] = [];
  const baseHeight = baseBBox.yMax - baseBBox.yMin;

  for (const contour of contours) {
    const cBBox = getExactBoundingBox(contour);
    // Diacritic sits above base glyph or below
    const isUpper = (cBBox.yMin >= baseBBox.yMin + baseHeight * 0.35 && cBBox.yMax >= baseBBox.yMin + baseHeight * 0.55 && cBBox.yMin >= baseBBox.yMax - 150);
    const isLower = (cBBox.yMax <= baseBBox.yMin + baseHeight * 0.45 && cBBox.yMin < baseBBox.yMin + 30);
    const isHorn = (cBBox.xMin >= baseBBox.xMin + (baseBBox.xMax - baseBBox.xMin) * 0.3 && cBBox.yMin >= baseBBox.yMin + baseHeight * 0.3);

    if (isUpper || isLower || isHorn) {
      matchedCmds.push(...contour);
    }
  }

  if (matchedCmds.length === 0) return null;

  const path = new opentype.Path();
  path.commands = matchedCmds;
  return new opentype.Glyph({
    name: `${composedChar}_extracted_mark`,
    advanceWidth: compGlyph.advanceWidth || 500,
    path: path
  });
}

/**
 * Gets extracted diacritic SVG path string for a specific composed character.
 */
export function getExtractedDiacriticSvgPathFromChar(font: any, composedChar: string, baseChar: string): string {
  const extractedGlyph = extractDiacriticFromSpecificChar(font, composedChar, baseChar);
  if (!extractedGlyph) return '';
  return extractSvgFromGlyph(extractedGlyph, font.unitsPerEm || 1000);
}

/**
 * Gets full <svg>...</svg> code string for an extracted diacritic path.
 */
export function formatSvgPathToFullSvg(pathD: string): string {
  if (!pathD) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-250 -250 500 500" width="100%" height="100%">\n  <path d="${pathD}" fill="currentColor" />\n</svg>`;
}
