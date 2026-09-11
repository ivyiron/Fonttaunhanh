import type { AutoPositionRules } from '../session';
import { getGroupReferenceHeights } from '../font/metrics';
export function calculateAutoPosition(
  diaId: string,
  baseBBox: { x1: number; y1: number; x2: number; y2: number },
  diaBBox: { xMin: number; yMin: number; xMax: number; yMax: number },
  rules: AutoPositionRules,
  isCapital: boolean,
  previousPlacedBox?: { xMin: number; yMin: number; xMax: number; yMax: number },
  groupReferenceHeights?: { xHeightMax: number; capHeightMax: number },
  baseChar?: string
): { scaleX: number; scaleY: number; offsetX: number; offsetY: number } {
  let baseXCenter = (baseBBox.x1 + baseBBox.x2) / 2;

  // Optical X centering ONLY for lowercase 'y' (ỵ)
  // Lowercase 'y' has an asymmetric diagonal descender, whereas uppercase 'Y' (Ỵ) is horizontally symmetrical along X.
  const isLowercaseY = baseChar ? baseChar === 'y' : (!isCapital && baseChar === undefined);
  if (isLowercaseY) {
    // For lowercase 'y', the bottom descender stem/vertex is shifted slightly right (~58% of bounding box width)
    baseXCenter = baseBBox.x1 + (baseBBox.x2 - baseBBox.x1) * 0.58;
  }

  // Group Height Baseline Alignment eliminates vertical "bouncing" across á, é, ó, í, ý
  // by anchoring diacritics to a unified Group Reference Height (x-Height for lowercase, Cap-Height for uppercase).
  let baseYTop = baseBBox.y2;
  if (rules.useGroupHeightAlignment !== false && !previousPlacedBox && groupReferenceHeights) {
    if (isCapital && groupReferenceHeights.capHeightMax > 0) {
      baseYTop = groupReferenceHeights.capHeightMax;
    } else if (!isCapital && groupReferenceHeights.xHeightMax > 0) {
      baseYTop = groupReferenceHeights.xHeightMax;
    }
  }

  let baseYBottom = baseBBox.y1;
  // For standard non-descender vowels (a, e, o, u, i), anchor bottom to y = 0 for 100% consistent dot_below baseline
  if (rules.useGroupHeightAlignment !== false && !previousPlacedBox) {
    if (baseBBox.y1 > -50) {
      baseYBottom = 0;
    }
  }
  
  const diaWidth = diaBBox.xMax - diaBBox.xMin;
  const diaHeight = diaBBox.yMax - diaBBox.yMin;
  const diaXCenter = (diaBBox.xMin + diaBBox.xMax) / 2;

  let scale = isCapital ? rules.uppercaseAccentScale : rules.lowercaseAccentScale;
  let scaleX = scale;
  let scaleY = scale;
  
  let offsetX = 0;
  let offsetY = 0;

  if (diaId === 'dot_below') {
    scaleX = rules.dotBelowScale;
    scaleY = rules.dotBelowScale;
    offsetX = baseXCenter - (diaXCenter * scaleX);
    // Position below the baseline/bottom of letter
    offsetY = baseYBottom - (diaBBox.yMax * scaleY) - rules.dotBelowGap;
  } else if (diaId === 'horn' || diaId === 'horn_o' || diaId === 'horn_u') {
    scaleX = rules.hornScale;
    scaleY = rules.hornScale;
    // Align horn to upper right of vowel
    offsetX = baseBBox.x2 - (diaBBox.xMin * scaleX) - 10 + rules.hornOffsetX;
    offsetY = baseYTop - (diaBBox.yMax * scaleY) - 15 + rules.hornOffsetY;
  } else if (diaId === 'bar') {
    scaleX = rules.barScale;
    scaleY = rules.barScale;
    // Strike bar through d or Đ
    if (isCapital) {
      offsetX = baseXCenter - (diaXCenter * scaleX) + rules.barOffsetX;
      offsetY = baseBBox.y2 - 240 + rules.barOffsetY;
    } else {
      offsetX = baseBBox.x2 - (diaBBox.xMin * scaleX) - 80 + rules.barOffsetX;
      offsetY = baseBBox.y2 - 130 + rules.barOffsetY;
    }
  } else {
    // Normal top marks: acute, grave, hook, tilde, circumflex, breve
    offsetX = baseXCenter - (diaXCenter * scaleX);

    if (previousPlacedBox) {
      // Placing on top of another diacritic (Stacked vs Side-by-side vs Custom)
      const customX = rules.doubleAccentCustomX ?? 0;
      const customY = rules.doubleAccentCustomY ?? 0;

      if (rules.doubleAccentStyle === 'stacked') {
        const targetTopY = previousPlacedBox.yMax;
        offsetY = targetTopY - (diaBBox.yMin * scaleY) + rules.doubleAccentGap + customY;
        offsetX = offsetX + customX;
      } else if (rules.doubleAccentStyle === 'side') {
        // Angled/Side placement (very popular in high-end Vietnamese type design)
        offsetX = (previousPlacedBox.xMax - 10) - (diaBBox.xMin * scaleX) + customX;
        offsetY = previousPlacedBox.yMax - (diaBBox.yMax * scaleY) + 5 + customY;
      } else {
        // 'custom' mode: freely position relative to previous accent's center top
        const prevCenterX = (previousPlacedBox.xMin + previousPlacedBox.xMax) / 2;
        const targetTopY = previousPlacedBox.yMax;
        offsetX = prevCenterX - (diaXCenter * scaleX) + customX;
        offsetY = targetTopY - (diaBBox.yMin * scaleY) + rules.doubleAccentGap + customY;
      }
    } else {
      const gap = isCapital ? rules.uppercaseAccentGap : rules.lowercaseAccentGap;
      offsetY = baseYTop - (diaBBox.yMin * scaleY) + gap;
    }
  }

  return { scaleX, scaleY, offsetX, offsetY };
}

/**
 * Mapping of double-accented or compound Vietnamese characters to their existing precomposed base character
 * and the remaining secondary diacritic mark to add on top/bottom.
 * E.g., 'ấ' -> precomposed base 'â' + remaining mark 'acute'.
 */
