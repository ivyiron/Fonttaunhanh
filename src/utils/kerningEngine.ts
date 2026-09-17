import * as opentype from 'opentype.js';
import { AutoSpacingRules, AutoKerningSettings } from '../types';
import { VIETNAMESE_BASE_MAP, VIETNAMESE_RECIPES, TRACKING_FAMILIES } from '../utils';

/**
 * Returns all character family group members (base character + all accented/diacritic variants)
 * For instance, 'A' -> ['A', 'Á', 'À', 'Ả', 'Ạ', 'Ã', 'Â', 'Ấ', 'Ầ', 'Ẩ', 'Ậ', 'Ẫ', 'Ă', 'Ắ', 'Ằ', 'Ẳ', 'Ặ', 'Ẵ']
 * 'u' -> ['u', 'ú', 'ù', 'ủ', 'ụ', 'ũ', 'ư', 'ứ', 'ừ', 'ử', 'ự', 'ữ']
 * 'y' -> ['y', 'ý', 'ỳ', 'ỷ', 'ỵ', 'ỹ']
 */
export function getCharacterFamilyGroup(char: string): string[] {
  if (!char) return [];

  const nfd = char.normalize('NFD');
  const baseFromNfd = nfd[0];

  const baseChar = VIETNAMESE_BASE_MAP[char] || VIETNAMESE_BASE_MAP[baseFromNfd] || baseFromNfd || char;

  const familySet = new Set<string>();
  familySet.add(char);
  familySet.add(baseChar);

  for (const [variant, base] of Object.entries(VIETNAMESE_BASE_MAP)) {
    if (base === baseChar || variant === char) {
      familySet.add(variant);
    }
  }

  for (const family of TRACKING_FAMILIES) {
    if (family.includes(char) || family.includes(baseChar)) {
      family.forEach((c) => familySet.add(c));
    }
  }

  return Array.from(familySet);
}

export interface GeneratedKerningPair {
  charLeft: string;
  charRight: string;
  indexLeft: number;
  indexRight: number;
  value: number;
  category: 'upper_upper' | 'upper_lower' | 'vietnamese' | 'punctuation' | 'number' | 'custom';
}

// Comprehensive catalog of classic high-frequency kerning pairs across typography
export const CLASSIC_UPPER_UPPER_PAIRS = [
  'AV', 'AW', 'AY', 'AT', 'VA', 'WA', 'YA', 'TA',
  'LT', 'PA', 'FA', 'WO', 'TO', 'KO', 'VO', 'YO',
  'AC', 'AO', 'AG', 'FO', 'PO', 'TL', 'TT', 'TU',
  'TV', 'TW', 'TY', 'LV', 'LW', 'LY', 'CY', 'DC',
  'DG', 'DO', 'FC', 'FG', 'FJ', 'FO', 'FR', 'FT',
  'OT', 'OV', 'OW', 'OY', 'PT', 'PV', 'PW', 'PY',
  'ST', 'TC', 'TD', 'TG', 'TJ', 'TR', 'TS', 'VC',
  'VD', 'VG', 'VJ', 'VR', 'VS', 'WC', 'WD', 'WG',
  'WJ', 'WR', 'WS', 'YC', 'YD', 'YG', 'YJ', 'YR',
  'YS', 'ZA', 'ZO'
];

export const CLASSIC_UPPER_LOWER_PAIRS = [
  'Ta', 'To', 'Te', 'Tr', 'Tu', 'Ti', 'Ty', 'Tâ', 'Tê', 'Tô', 'Tơ', 'Tư',
  'Va', 'Ve', 'Vo', 'Vi', 'Vy', 'Vê', 'Vô', 'Vơ', 'Vư',
  'Wa', 'We', 'Wo', 'Wi', 'Wy',
  'Fa', 'Fe', 'Fo', 'Fi', 'Fy',
  'Pa', 'Pe', 'Po', 'Pi', 'Py',
  'Ya', 'Ye', 'Yo', 'Yi', 'Yê', 'Yơ',
  'Ca', 'Co', 'Ce', 'Da', 'Do', 'De', 'Ra', 'Ro', 'Re',
  'Na', 'No', 'Ne', 'Ka', 'Ko', 'Ke', 'Bâ', 'Bơ', 'Đâ', 'Đê'
];

export const CLASSIC_LOWER_LOWER_PAIRS = [
  'va', 've', 'vo', 'vi', 'vê', 'vơ', 'vư',
  'wa', 'we', 'wo', 'wi',
  'ya', 'ye', 'yo', 'yi', 'yê', 'yơ', 'yư',
  'fa', 'fe', 'fo',
  'ta', 'te', 'to', 'tr', 'tu', 'ti', 'tâ', 'tê', 'tô',
  'rc', 'rg', 'ro', 'rt', 'rv', 'rw', 'ry', 'r.', 'r,'
];

export const CLASSIC_PUNCTUATION_PAIRS = [
  'A.', 'A,', 'A\'', 'A"', 'A?', 'A!',
  'F.', 'F,', 'P.', 'P,', 'T.', 'T,', 'T\'', 'T"', 'T?', 'T!',
  'V.', 'V,', 'V\'', 'V"', 'W.', 'W,', 'W\'', 'W"', 'Y.', 'Y,', 'Y\'', 'Y"',
  'L\'', 'L"', '.V', ',V', '.W', ',W', '.Y', ',Y',
  'r.', 'r,', 'v.', 'v,', 'w.', 'w,', 'y.', 'y,',
  'L.', 'L,', 'D.', 'D,', 'O.', 'O,', 'K.', 'K,'
];

export const CLASSIC_NUMBER_PAIRS = [
  '11', '74', '47', '70', '90', '10', '27', '37', '78', '1/', '/1', '10', '00'
];

/**
 * Gets exact 2D bounding contour slice distances between left and right glyphs.
 * Calculates optical overhang distance to generate crisp, proportional kerning values.
 */
export function getGlyphContourPoints(glyph: opentype.Glyph): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  if (!glyph || !glyph.path || !glyph.path.commands) return points;

  let curX = 0;
  let curY = 0;
  let startX = 0;
  let startY = 0;

  // Straight segments carry no intermediate control points, so sampling only their
  // endpoints leaves the whole edge unmeasured. That matters most for V, A, W, Y, T and L
  // - exactly the letters where kerning is decided - so lines are flattened like curves.
  const sampleLine = (x0: number, y0: number, x1: number, y1: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.min(64, Math.round(len / 15)));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      points.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t });
    }
  };

  glyph.path.commands.forEach((cmd: any) => {
    switch (cmd.type) {
      case 'M':
        curX = cmd.x;
        curY = cmd.y;
        startX = curX;
        startY = curY;
        points.push({ x: curX, y: curY });
        break;
      case 'L':
        sampleLine(curX, curY, cmd.x, cmd.y);
        curX = cmd.x;
        curY = cmd.y;
        break;
      case 'Q': {
        const x0 = curX, y0 = curY;
        const x1 = cmd.x1, y1 = cmd.y1;
        const x2 = cmd.x, y2 = cmd.y;
        for (let t = 0.1; t <= 1; t += 0.1) {
          const invT = 1 - t;
          const x = invT * invT * x0 + 2 * invT * t * x1 + t * t * x2;
          const y = invT * invT * y0 + 2 * invT * t * y1 + t * t * y2;
          points.push({ x, y });
        }
        curX = x2;
        curY = y2;
        break;
      }
      case 'C': {
        const x0 = curX, y0 = curY;
        const x1 = cmd.x1, y1 = cmd.y1;
        const x2 = cmd.x2, y2 = cmd.y2;
        const x3 = cmd.x, y3 = cmd.y;
        for (let t = 0.1; t <= 1; t += 0.1) {
          const invT = 1 - t;
          const x = invT * invT * invT * x0 + 3 * invT * invT * t * x1 + 3 * invT * t * t * x2 + t * t * t * x3;
          const y = invT * invT * invT * y0 + 3 * invT * invT * t * y1 + 3 * invT * t * t * y2 + t * t * t * y3;
          points.push({ x, y });
        }
        curX = x3;
        curY = y3;
        break;
      }
      case 'Z': {
        // The implicit segment back to the contour start is an edge too
        if (curX !== startX || curY !== startY) {
          sampleLine(curX, curY, startX, startY);
        }
        curX = startX;
        curY = startY;
        break;
      }
    }
  });

  return points;
}

export function getClassicPairDefaultKerning(
  font: opentype.Font,
  charL: string,
  charR: string
): number {
  const upm = font.unitsPerEm || 1000;
  const pairStr = charL + charR;

  // Major wedge / diagonal collisions
  if (['AV', 'VA', 'AW', 'WA', 'AY', 'YA', 'AT', 'TA'].includes(pairStr)) {
    return Math.round(-upm * 0.085); // -85 UPM
  }
  if (['LT', 'LV', 'LW', 'LY', 'PA', 'FA', 'WO', 'TO', 'VO', 'YO'].includes(pairStr)) {
    return Math.round(-upm * 0.06); // -60 UPM
  }
  if (['Ta', 'To', 'Te', 'Tr', 'Tu', 'Tâ', 'Tê', 'Tô', 'Tơ', 'Tư', 'Va', 'Ve', 'Vo', 'Vê', 'Vô', 'Wa', 'We'].includes(pairStr)) {
    return Math.round(-upm * 0.05); // -50 UPM
  }
  if (['A.', 'A,', 'F.', 'F,', 'P.', 'P,', 'T.', 'T,', 'V.', 'V,', 'W.', 'W,', 'Y.', 'Y,', 'L\'', 'r.', 'r,'].includes(pairStr)) {
    return Math.round(-upm * 0.065); // -65 UPM
  }
  if (['11', '74', '47', '70', '90', '10', '27', '37', '78', '1/', '/1'].includes(pairStr)) {
    return Math.round(-upm * 0.04); // -40 UPM
  }

  return Math.round(-upm * 0.035); // -35 UPM
}

export function calculateOpticalPairDistance(
  font: opentype.Font,
  charLeft: string,
  charRight: string
): number | null {
  try {
    const idxL = font.charToGlyphIndex(charLeft);
    const idxR = font.charToGlyphIndex(charRight);
    if (idxL <= 0 || idxR <= 0) return null;

    const glyphL = font.glyphs.get(idxL);
    const glyphR = font.glyphs.get(idxR);

    if (!glyphL || !glyphR) return null;

    const boxL = glyphL.getBoundingBox();
    const boxR = glyphR.getBoundingBox();

    if (boxL.x1 === boxL.x2 || boxR.x1 === boxR.x2) return null;

    const upm = font.unitsPerEm || 1000;

    const pointsL = getGlyphContourPoints(glyphL);
    const pointsR = getGlyphContourPoints(glyphR);

    if (pointsL.length < 3 || pointsR.length < 3) {
      return getClassicPairDefaultKerning(font, charLeft, charRight);
    }

    // Overlapping vertical region between the two glyphs
    const overlapYMin = Math.max(boxL.y1, boxR.y1);
    const overlapYMax = Math.min(boxL.y2, boxR.y2);

    if (overlapYMax <= overlapYMin) {
      return getClassicPairDefaultKerning(font, charLeft, charRight);
    }

    const numSlices = 10;
    const step = (overlapYMax - overlapYMin) / numSlices;
    let minGap = Infinity;
    let sumGap = 0;
    let validSlices = 0;

    for (let i = 0; i <= numSlices; i++) {
      const ySample = overlapYMin + i * step;

      let maxXL = -Infinity;
      pointsL.forEach(pt => {
        if (Math.abs(pt.y - ySample) <= step * 0.9) {
          if (pt.x > maxXL) maxXL = pt.x;
        }
      });

      let minXR = Infinity;
      pointsR.forEach(pt => {
        if (Math.abs(pt.y - ySample) <= step * 0.9) {
          if (pt.x < minXR) minXR = pt.x;
        }
      });

      if (maxXL !== -Infinity && minXR !== Infinity) {
        const gap = (glyphL.advanceWidth - maxXL) + minXR;
        if (gap > -upm * 0.5 && gap < upm * 1.5) {
          if (gap < minGap) minGap = gap;
          sumGap += gap;
          validSlices++;
        }
      }
    }

    if (validSlices === 0 || minGap === Infinity) {
      return getClassicPairDefaultKerning(font, charLeft, charRight);
    }

    const avgGap = sumGap / validSlices;
    const opticalGap = minGap * 0.45 + avgGap * 0.55;
    
    // Standard straight stem gap baseline (~20% UPM)
    const stemBaseline = upm * 0.20;

    let kernVal = Math.round((stemBaseline - opticalGap) * 0.45);

    // Cap extreme values safely
    if (kernVal < -upm * 0.16) kernVal = -Math.round(upm * 0.16);
    if (kernVal > upm * 0.04) kernVal = Math.round(upm * 0.04);

    return kernVal;
  } catch (err) {
    return getClassicPairDefaultKerning(font, charLeft, charRight);
  }
}

/**
 * Builds a comprehensive mapping of Vietnamese character variants from plain Latin base characters.
 */
export function getVietnameseVariantsMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  VIETNAMESE_RECIPES.forEach(recipe => {
    const base = recipe.baseChar;
    if (!map[base]) map[base] = [];
    if (!map[base].includes(recipe.char)) {
      map[base].push(recipe.char);
    }
  });
  return map;
}

// findGlyphIndex used to scan every glyph in the font on every call, and it is called twice
// per kerning pair inside nested loops - tens of millions of glyph fetches on a large font.
// The scan result is cached per font and rebuilt whenever the glyph count changes (which is
// what happens when the Vietnamese glyphs are appended).
const glyphIndexCache = new WeakMap<object, { count: number; byName: Map<string, number>; byCode: Map<number, number> }>();

function getGlyphIndexMaps(font: any) {
  const cached = glyphIndexCache.get(font);
  if (cached && cached.count === font.glyphs.length) return cached;

  const byName = new Map<string, number>();
  const byCode = new Map<number, number>();

  for (let i = 0; i < font.glyphs.length; i++) {
    const g = font.glyphs.get(i);
    if (!g) continue;
    if (g.name && !byName.has(g.name)) byName.set(g.name, i);
    if (typeof g.unicode === 'number' && !byCode.has(g.unicode)) byCode.set(g.unicode, i);
    if (Array.isArray(g.unicodes)) {
      for (const u of g.unicodes) {
        if (!byCode.has(u)) byCode.set(u, i);
      }
    }
  }

  const entry = { count: font.glyphs.length, byName, byCode };
  glyphIndexCache.set(font, entry);
  return entry;
}

/**
 * Drops the cached glyph lookup maps for a font. Call this after mutating glyphs in place
 * without changing the glyph count (for example replacing an existing glyph's outline).
 */
export function invalidateGlyphIndexCache(font: opentype.Font): void {
  glyphIndexCache.delete(font as unknown as object);
}

export function findGlyphIndex(font: opentype.Font, char: string): number {
  if (!font || !char) return 0;

  const code = char.codePointAt(0);
  const maps = getGlyphIndexMaps(font as any);

  // 1. Locate newly generated glyphs by exact name or unicode.
  //    The original scan walked glyphs in index order and returned the first match on
  //    either criterion, so take the lower of the two hits to keep behaviour identical.
  const byName = maps.byName.get(char);
  const byCode = code !== undefined ? maps.byCode.get(code) : undefined;
  if (byName !== undefined && byCode !== undefined) return Math.min(byName, byCode);
  if (byName !== undefined) return byName;
  if (byCode !== undefined) return byCode;

  // 2. Fallback to charToGlyphIndex
  const direct = font.charToGlyphIndex(char);
  if (direct > 0) return direct;

  return 0;
}

/**
 * Scans the font and generates all classic, punctuation, number, and Vietnamese auto-kerning pairs.
 */
export function generateFullFontKerningPairs(
  font: opentype.Font | null,
  settings: AutoKerningSettings
): GeneratedKerningPair[] {
  if (!font) return [];

  const pairsMap = new Map<string, GeneratedKerningPair>();
  const vietMap = getVietnameseVariantsMap();

  const addOrUpdatePair = (
    charL: string,
    charR: string,
    baseVal: number,
    cat: GeneratedKerningPair['category']
  ) => {
    const idxL = findGlyphIndex(font, charL);
    const idxR = findGlyphIndex(font, charR);
    if (idxL <= 0 || idxR <= 0) return;

    const pairKey = `${charL},${charR}`;

    // Check if user has explicitly set a custom value for this pair
    const customVal = settings.customPairs?.[pairKey];
    let finalVal: number;
    let finalCat = cat;

    if (customVal !== undefined) {
      finalVal = customVal; // Use exact custom value set by user
      finalCat = 'custom';
    } else {
      finalVal = Math.round(baseVal * settings.intensityMultiplier);
      if (Math.abs(finalVal) < settings.minThreshold) {
        pairsMap.delete(pairKey);
        return;
      }
    }

    pairsMap.set(pairKey, {
      charLeft: charL,
      charRight: charR,
      indexLeft: idxL,
      indexRight: idxR,
      value: finalVal,
      category: finalCat
    });
  };

  // 1. Process Uppercase-Uppercase Classic Pairs
  if (settings.applyClassics) {
    CLASSIC_UPPER_UPPER_PAIRS.forEach(pairStr => {
      if (pairStr.length !== 2) return;
      const cL = pairStr[0];
      const cR = pairStr[1];

      let val = calculateOpticalPairDistance(font, cL, cR);
      if (val === null) {
        val = getClassicPairDefaultKerning(font, cL, cR);
      }

      addOrUpdatePair(cL, cR, val, 'upper_upper');

      // Expand to Vietnamese variants if enabled
      if (settings.applyVietnameseVariants) {
        const variantsL = [cL, ...(vietMap[cL] || [])];
        const variantsR = [cR, ...(vietMap[cR] || [])];

        variantsL.forEach(varL => {
          variantsR.forEach(varR => {
            if (varL === cL && varR === cR) return;
            addOrUpdatePair(varL, varR, val!, 'vietnamese');
          });
        });
      }
    });
  }

  // 2. Process Uppercase-Lowercase Pairs
  if (settings.applyUpperLower) {
    CLASSIC_UPPER_LOWER_PAIRS.forEach(pairStr => {
      const cL = pairStr[0];
      const cR = pairStr.substring(1);

      let val = calculateOpticalPairDistance(font, cL, cR);
      if (val === null) {
        val = getClassicPairDefaultKerning(font, cL, cR);
      }

      addOrUpdatePair(cL, cR, val, 'upper_lower');

      if (settings.applyVietnameseVariants) {
        const variantsL = [cL, ...(vietMap[cL] || [])];
        const baseR = VIETNAMESE_BASE_MAP[cR] || cR;
        const variantsR = [cR, ...(vietMap[baseR] || [])];

        variantsL.forEach(varL => {
          variantsR.forEach(varR => {
            if (varL === cL && varR === cR) return;
            addOrUpdatePair(varL, varR, val!, 'vietnamese');
          });
        });
      }
    });

    CLASSIC_LOWER_LOWER_PAIRS.forEach(pairStr => {
      const cL = pairStr[0];
      const cR = pairStr.substring(1);

      let val = calculateOpticalPairDistance(font, cL, cR);
      if (val === null) {
        val = getClassicPairDefaultKerning(font, cL, cR);
      }

      addOrUpdatePair(cL, cR, val, 'upper_lower');

      if (settings.applyVietnameseVariants) {
        const baseL = VIETNAMESE_BASE_MAP[cL] || cL;
        const baseR = VIETNAMESE_BASE_MAP[cR] || cR;
        const variantsL = [cL, ...(vietMap[baseL] || [])];
        const variantsR = [cR, ...(vietMap[baseR] || [])];

        variantsL.forEach(varL => {
          variantsR.forEach(varR => {
            if (varL === cL && varR === cR) return;
            addOrUpdatePair(varL, varR, val!, 'vietnamese');
          });
        });
      }
    });
  }

  // 3. Process Punctuation Pairs
  if (settings.applyPunctuation) {
    CLASSIC_PUNCTUATION_PAIRS.forEach(pairStr => {
      const cL = pairStr[0];
      const cR = pairStr.substring(1);

      let val = calculateOpticalPairDistance(font, cL, cR);
      if (val === null) {
        val = getClassicPairDefaultKerning(font, cL, cR);
      }

      addOrUpdatePair(cL, cR, val, 'punctuation');

      if (settings.applyVietnameseVariants) {
        const baseL = VIETNAMESE_BASE_MAP[cL] || cL;
        const variantsL = [cL, ...(vietMap[baseL] || [])];
        variantsL.forEach(varL => {
          if (varL === cL) return;
          addOrUpdatePair(varL, cR, val!, 'vietnamese');
        });
      }
    });
  }

  // 4. Process Number Pairs
  if (settings.applyNumbers) {
    CLASSIC_NUMBER_PAIRS.forEach(pairStr => {
      if (pairStr.length !== 2) return;
      const cL = pairStr[0];
      const cR = pairStr[1];

      let val = calculateOpticalPairDistance(font, cL, cR);
      if (val === null) {
        val = getClassicPairDefaultKerning(font, cL, cR);
      }

      addOrUpdatePair(cL, cR, val, 'number');
    });
  }

  // 5. Merge Custom Pairs from user settings that were not in auto lists
  if (settings.customPairs) {
    Object.entries(settings.customPairs).forEach(([pairKey, val]) => {
      const parts = pairKey.split(',');
      if (parts.length === 2) {
        const cL = parts[0];
        const cR = parts[1];
        if (!pairsMap.has(pairKey)) {
          addOrUpdatePair(cL, cR, val, 'custom');
        }
      }
    });
  }

  return Array.from(pairsMap.values());
}

/**
 * Calculates auto-sidebearings and advance widths across the entire font.
 * Dynamically adjusts curved letters (O, C, o, e) to sit closer than straight stems (H, I, n).
 */
export function calculateAutoSpacingAdjustments(
  font: opentype.Font | null,
  rules: AutoSpacingRules
): Record<string, number> {
  if (!font) return {};

  const adjustments: Record<string, number> = {};

  const presetMultiplier = rules.spacingPreset === 'compact' ? -15 : rules.spacingPreset === 'spacious' ? 25 : 0;
  const curveFactor = rules.curveTighteningPercent / 100;

  const roundLetters = new Set(['O', 'C', 'Q', 'G', 'o', 'c', 'e', '0', '8']);

  // Strip Vietnamese diacritics so that ó, ô, ọ, ộ are tightened exactly like o.
  // Without this, o and ó end up with different spacing inside the same font.
  const toBaseLetter = (ch: string): string => {
    const stripped = ch.normalize('NFD').replace(/[\u0300-\u036F]/g, '');
    return stripped.length > 0 ? stripped[0] : ch;
  };

  for (let i = 0; i < font.glyphs.length; i++) {
    try {
      const glyph = font.glyphs.get(i);
      if (!glyph || !glyph.name) continue;

      const charStr = glyph.unicode ? String.fromCharCode(glyph.unicode) : glyph.name;

      let delta = rules.globalTrackingOffset + presetMultiplier;

      // Tighten sidebearings on round glyphs optically
      if (roundLetters.has(toBaseLetter(charStr))) {
        delta -= Math.round((font.unitsPerEm || 1000) * 0.02 * curveFactor);
      }

      if (delta !== 0) {
        adjustments[charStr] = delta;
      }
    } catch (err) {
      // Ignore individual glyph calculation errors
    }
  }

  return adjustments;
}

/**
 * Applies a spacing delta to a glyph as real sidebearings rather than pure tracking.
 *
 * Adding the delta to advanceWidth alone puts all the new space on the right of the glyph,
 * which visibly shifts every letter towards the left of its own slot. Half the delta is
 * therefore added to the left sidebearing by translating the outline, and the full delta to
 * the advance width, so both sides grow equally.
 */
export function applySpacingDelta(glyph: any, delta: number): void {
  if (!glyph || !delta) return;

  const half = Math.round(delta / 2);

  if (half !== 0 && glyph.path && Array.isArray(glyph.path.commands)) {
    glyph.path.commands = glyph.path.commands.map((cmd: any) => {
      const next: any = { ...cmd };
      if (next.x !== undefined) next.x += half;
      if (next.x1 !== undefined) next.x1 += half;
      if (next.x2 !== undefined) next.x2 += half;
      return next;
    });
  }

  glyph.advanceWidth = Math.max(50, (glyph.advanceWidth || 500) + delta);
}
