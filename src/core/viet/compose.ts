import type { DiacriticTemplate, AutoPositionRules, GlyphOverrideState } from '../session';
import { parseSvgPath, transformCommands, getExactBoundingBox, getBoundingBox, commandsToSvgPathD, orientContours, getContourSignedArea, getGlyphContours } from '../geometry/path';
import { unionSvgPaths, removeDotFromICommands } from '../geometry/boolean';
import { calculateAutoPosition } from './position';
import { getGroupReferenceHeights, getXHeightFromFont } from '../font/metrics';
import { VIETNAMESE_RECIPES, BASE_CHAR_RECIPES, VIETNAMESE_BASE_MAP, type ComponentRecipe } from './recipes';
import { findCandidateGlyph } from '../font/extract';
import * as opentype from 'opentype.js';
export const PRECOMPOSED_BASE_MAP: Record<string, { precomposedBaseChar: string; remainingComponent: string }> = {
  // â (a-circumflex) group
  'ầ': { precomposedBaseChar: 'â', remainingComponent: 'grave' },
  'ấ': { precomposedBaseChar: 'â', remainingComponent: 'acute' },
  'ẩ': { precomposedBaseChar: 'â', remainingComponent: 'hook' },
  'ẫ': { precomposedBaseChar: 'â', remainingComponent: 'tilde' },
  'ậ': { precomposedBaseChar: 'â', remainingComponent: 'dot_below' },

  // Â (A-circumflex) group
  'Ầ': { precomposedBaseChar: 'Â', remainingComponent: 'grave' },
  'Ấ': { precomposedBaseChar: 'Â', remainingComponent: 'acute' },
  'Ẩ': { precomposedBaseChar: 'Â', remainingComponent: 'hook' },
  'Ẫ': { precomposedBaseChar: 'Â', remainingComponent: 'tilde' },
  'Ậ': { precomposedBaseChar: 'Â', remainingComponent: 'dot_below' },

  // ă (a-breve) group
  'ằ': { precomposedBaseChar: 'ă', remainingComponent: 'grave' },
  'ắ': { precomposedBaseChar: 'ă', remainingComponent: 'acute' },
  'ẳ': { precomposedBaseChar: 'ă', remainingComponent: 'hook' },
  'ẵ': { precomposedBaseChar: 'ă', remainingComponent: 'tilde' },
  'ặ': { precomposedBaseChar: 'ă', remainingComponent: 'dot_below' },

  // Ă (A-breve) group
  'Ằ': { precomposedBaseChar: 'Ă', remainingComponent: 'grave' },
  'Ắ': { precomposedBaseChar: 'Ă', remainingComponent: 'acute' },
  'Ẳ': { precomposedBaseChar: 'Ă', remainingComponent: 'hook' },
  'Ẵ': { precomposedBaseChar: 'Ă', remainingComponent: 'tilde' },
  'Ặ': { precomposedBaseChar: 'Ă', remainingComponent: 'dot_below' },

  // ê (e-circumflex) group
  'ề': { precomposedBaseChar: 'ê', remainingComponent: 'grave' },
  'ế': { precomposedBaseChar: 'ê', remainingComponent: 'acute' },
  'ể': { precomposedBaseChar: 'ê', remainingComponent: 'hook' },
  'ễ': { precomposedBaseChar: 'ê', remainingComponent: 'tilde' },
  'ệ': { precomposedBaseChar: 'ê', remainingComponent: 'dot_below' },

  // Ê (E-circumflex) group
  'Ề': { precomposedBaseChar: 'Ê', remainingComponent: 'grave' },
  'Ế': { precomposedBaseChar: 'Ê', remainingComponent: 'acute' },
  'Ể': { precomposedBaseChar: 'Ê', remainingComponent: 'hook' },
  'Ễ': { precomposedBaseChar: 'Ê', remainingComponent: 'tilde' },
  'Ệ': { precomposedBaseChar: 'Ê', remainingComponent: 'dot_below' },

  // ô (o-circumflex) group
  'ồ': { precomposedBaseChar: 'ô', remainingComponent: 'grave' },
  'ố': { precomposedBaseChar: 'ô', remainingComponent: 'acute' },
  'ổ': { precomposedBaseChar: 'ô', remainingComponent: 'hook' },
  'ỗ': { precomposedBaseChar: 'ô', remainingComponent: 'tilde' },
  'ộ': { precomposedBaseChar: 'ô', remainingComponent: 'dot_below' },

  // Ô (O-circumflex) group
  'Ồ': { precomposedBaseChar: 'Ô', remainingComponent: 'grave' },
  'Ố': { precomposedBaseChar: 'Ô', remainingComponent: 'acute' },
  'Ổ': { precomposedBaseChar: 'Ô', remainingComponent: 'hook' },
  'Ỗ': { precomposedBaseChar: 'Ô', remainingComponent: 'tilde' },
  'Ộ': { precomposedBaseChar: 'Ô', remainingComponent: 'dot_below' },

  // ơ (o-horn) group
  'ờ': { precomposedBaseChar: 'ơ', remainingComponent: 'grave' },
  'ớ': { precomposedBaseChar: 'ơ', remainingComponent: 'acute' },
  'ở': { precomposedBaseChar: 'ơ', remainingComponent: 'hook' },
  'ỡ': { precomposedBaseChar: 'ơ', remainingComponent: 'tilde' },
  'ợ': { precomposedBaseChar: 'ơ', remainingComponent: 'dot_below' },

  // Ơ (O-horn) group
  'Ờ': { precomposedBaseChar: 'Ơ', remainingComponent: 'grave' },
  'Ớ': { precomposedBaseChar: 'Ơ', remainingComponent: 'acute' },
  'Ở': { precomposedBaseChar: 'Ơ', remainingComponent: 'hook' },
  'Ỡ': { precomposedBaseChar: 'Ơ', remainingComponent: 'tilde' },
  'Ợ': { precomposedBaseChar: 'Ơ', remainingComponent: 'dot_below' },

  // ư (u-horn) group
  'ừ': { precomposedBaseChar: 'ư', remainingComponent: 'grave' },
  'ứ': { precomposedBaseChar: 'ư', remainingComponent: 'acute' },
  'ử': { precomposedBaseChar: 'ư', remainingComponent: 'hook' },
  'ữ': { precomposedBaseChar: 'ư', remainingComponent: 'tilde' },
  'ự': { precomposedBaseChar: 'ư', remainingComponent: 'dot_below' },

  // Ư (U-horn) group
  'Ừ': { precomposedBaseChar: 'Ư', remainingComponent: 'grave' },
  'Ứ': { precomposedBaseChar: 'Ư', remainingComponent: 'acute' },
  'Ử': { precomposedBaseChar: 'Ư', remainingComponent: 'hook' },
  'Ữ': { precomposedBaseChar: 'Ư', remainingComponent: 'tilde' },
  'Ự': { precomposedBaseChar: 'Ư', remainingComponent: 'dot_below' }
};

/**
 * Builds a composite path for a character by merging the base glyph and its required diacritics.
 * When preserveExistingGlyphs is enabled and a precomposed base character (e.g., 'â', 'ô', 'ă') exists in the font,
 * it uses that precomposed glyph directly as the base character to inherit its native circumflex/breve mark.
 */
export function composeGlyphPath(
  font: opentype.Font,
  recipe: ComponentRecipe,
  templates: Record<string, DiacriticTemplate>,
  rules: AutoPositionRules,
  overrides?: GlyphOverrideState,
  preserveExistingGlyphs: boolean = true
): { 
  path: opentype.Path; 
  advanceWidth: number; 
  hornInfo?: { yMin: number; yMax: number; excessRight: number } 
} {
  let baseCharToUse = recipe.baseChar;
  let componentsToUse = [...recipe.components];

  const hasUserOverrides = overrides && (
    (overrides.offsetX !== undefined && overrides.offsetX !== 0) ||
    (overrides.offsetY !== undefined && overrides.offsetY !== 0) ||
    (overrides.scaleX !== undefined && overrides.scaleX !== 1.0) ||
    (overrides.scaleY !== undefined && overrides.scaleY !== 1.0) ||
    (overrides.advanceWidthTweak !== undefined && overrides.advanceWidthTweak !== 0) ||
    overrides.comp1OffsetX !== undefined ||
    overrides.comp1OffsetY !== undefined ||
    overrides.comp2OffsetX !== undefined ||
    overrides.comp2OffsetY !== undefined
  );

  // If preserveExistingGlyphs is enabled and the target character itself is available in the font (and no manual override exists),
  // use the native precomposed glyph directly from the font.
  if (preserveExistingGlyphs && font && !hasUserOverrides) {
    const existingIdx = font.charToGlyphIndex(recipe.char);
    if (existingIdx > 0) {
      const existingGlyph = font.glyphs.get(existingIdx);
      if (existingGlyph && existingGlyph.path && existingGlyph.path.commands && existingGlyph.path.commands.length > 0) {
        return {
          path: existingGlyph.path,
          advanceWidth: existingGlyph.advanceWidth || 500
        };
      }
    }
  }

  // If preserveExistingGlyphs is enabled, check if a precomposed base character (like 'â', 'ô', 'ă', 'ê', 'ơ', 'ư')
  // is available in the font. Using it as the base glyph preserves the font's native circumflex/breve/horn.
  let precomposedFirstAccentBox: { xMin: number; yMin: number; xMax: number; yMax: number } | undefined = undefined;

  if (preserveExistingGlyphs && font) {
    const preInfo = PRECOMPOSED_BASE_MAP[recipe.char];
    if (preInfo) {
      const preIdx = font.charToGlyphIndex(preInfo.precomposedBaseChar);
      if (preIdx > 0) {
        const preGlyph = font.glyphs.get(preIdx);
        if (preGlyph && preGlyph.path && preGlyph.path.commands && preGlyph.path.commands.length > 0) {
          baseCharToUse = preInfo.precomposedBaseChar;
          componentsToUse = [preInfo.remainingComponent];

          // For top-accent precomposed bases ('â', 'Â', 'ă', 'Ă', 'ê', 'Ê', 'ô', 'Ô'),
          // extract the native top mark's bounding box so double accent rules ('stacked', 'side', 'custom') apply seamlessly!
          const preCharLower = preInfo.precomposedBaseChar.toLowerCase();
          if (['â', 'ă', 'ê', 'ô'].includes(preCharLower)) {
            const unaccentedBaseChar = recipe.baseChar;
            const unaccentedGlyph = font.charToGlyph(unaccentedBaseChar);
            let unaccentedTopY = getXHeightFromFont(font);
            if (unaccentedGlyph && unaccentedGlyph.path && unaccentedGlyph.path.commands && unaccentedGlyph.path.commands.length > 0) {
              const uBox = unaccentedGlyph.getBoundingBox();
              unaccentedTopY = uBox.y2;
            }

            const contours = getGlyphContours(preGlyph.path.commands);
            const topMarkCmds: any[] = [];
            for (const contour of contours) {
              const cBox = getExactBoundingBox(contour);
              if (cBox.yMin >= unaccentedTopY - 30) {
                topMarkCmds.push(...contour);
              }
            }

            if (topMarkCmds.length > 0) {
              precomposedFirstAccentBox = getExactBoundingBox(topMarkCmds);
            } else {
              const pBox = preGlyph.getBoundingBox();
              const pHeight = pBox.y2 - pBox.y1;
              precomposedFirstAccentBox = {
                xMin: pBox.x1,
                xMax: pBox.x2,
                yMin: pBox.y2 - pHeight * 0.35,
                yMax: pBox.y2
              };
            }
          }
        }
      }
    }
  }

  let baseGlyph = font.charToGlyph(baseCharToUse);
  
  // For lowercase 'i', remove the original dot only when adding top diacritics (ì, í, ỉ, ĩ),
  // but keep the dot on 'i' when adding bottom diacritics like dot_below (ị)
  const shouldRemoveDotOnI = baseCharToUse === 'i' && componentsToUse.some(comp => comp !== 'dot_below' && comp !== 'bar');

  if (shouldRemoveDotOnI) {
    const dotlessGlyph = font.charToGlyph('ı');
    if (dotlessGlyph && dotlessGlyph.index > 0 && dotlessGlyph.name !== '.notdef') {
      baseGlyph = dotlessGlyph;
    } else {
      const glyphNames = (font as any).glyphNames;
      const glyphIndex = glyphNames && typeof glyphNames.nameToGlyph === 'function' 
        ? glyphNames.nameToGlyph('dotlessi') 
        : 0;
      if (glyphIndex > 0) {
        const glyph = font.glyphs.get(glyphIndex);
        if (glyph) {
          baseGlyph = glyph;
        }
      }
    }
  }

  if (!baseGlyph) {
    return { path: new opentype.Path(), advanceWidth: 500 };
  }

  const upm = font.unitsPerEm || 1000;
  
  // Get base commands and programmatically strip dot if it's 'i' with top diacritics
  let baseCmds = baseGlyph.path.commands;
  if (shouldRemoveDotOnI) {
    baseCmds = removeDotFromICommands(baseCmds);
  }

  // Recalculate bounding box based on actual dotless commands if we stripped it
  const baseBBox = baseGlyph.getBoundingBox();
  if (shouldRemoveDotOnI) {
    const tightBox = getExactBoundingBox(baseCmds);
    baseBBox.x1 = tightBox.xMin;
    baseBBox.y1 = tightBox.yMin;
    baseBBox.x2 = tightBox.xMax;
    baseBBox.y2 = tightBox.yMax;
  }

  // Determine target winding direction from base glyph (TrueType default: Clockwise >0)
  const baseContours = getGlyphContours(baseCmds);
  let targetOuterClockwise = true;
  if (baseContours.length > 0) {
    let maxArea = 0;
    let maxAreaSigned = 0;
    baseContours.forEach(c => {
      const a = getContourSignedArea(c);
      if (Math.abs(a) > maxArea) {
        maxArea = Math.abs(a);
        maxAreaSigned = a;
      }
    });
    if (maxArea > 0) {
      targetOuterClockwise = maxAreaSigned > 0;
    }
  }

  // Ensure base commands contours have consistent outer orientation
  baseCmds = orientContours(baseCmds, targetOuterClockwise);

  // Initialize accumulated SVG path d string with base commands
  let currentSvgD = commandsToSvgPathD(baseCmds);

  const isCapital = recipe.baseChar === recipe.baseChar.toUpperCase() && recipe.baseChar !== recipe.baseChar.toLowerCase();
  let previousBox: { xMin: number; yMin: number; xMax: number; yMax: number } | undefined = undefined;
  let autoHornAdvanceWidthTweak = 0;
  let hornInfo: { yMin: number; yMax: number; excessRight: number } | undefined = undefined;

  componentsToUse.forEach((diaId, idx) => {
    const template = templates[diaId];
    if (!template) return;

    const useCapVariant = isCapital && template.hasCapVariant;
    const svgPathToUse = useCapVariant && template.capSvgPath ? template.capSvgPath : template.svgPath;
    const scaleXToUse = useCapVariant && template.capScaleX !== undefined ? template.capScaleX : template.scaleX;
    const scaleYToUse = useCapVariant && template.capScaleY !== undefined ? template.capScaleY : template.scaleY;
    const offsetXToUse = useCapVariant && template.capOffsetX !== undefined ? template.capOffsetX : template.offsetX;
    const offsetYToUse = useCapVariant && template.capOffsetY !== undefined ? template.capOffsetY : template.offsetY;
    const autoCenterXToUse = useCapVariant && template.capAutoCenterX !== undefined ? template.capAutoCenterX : (template.autoCenterX !== false);

    const diaRawCmds = parseSvgPath(svgPathToUse);
    if (diaRawCmds.length === 0) return;

    // Apply template scale first
    const templateTransformed = transformCommands(
      diaRawCmds,
      scaleXToUse,
      scaleYToUse,
      0,
      0,
      true // flip Y to ensure Illustrator compatibility
    );

    const diaBBox = getExactBoundingBox(templateTransformed);
    
    // Auto align the diacritic based on the bounding boxes and group reference heights
    const prevBoxToPass = idx === 0 ? precomposedFirstAccentBox : previousBox;
    const groupHeights = getGroupReferenceHeights(font);
    const autoPos = calculateAutoPosition(diaId, baseBBox, diaBBox, rules, isCapital, prevBoxToPass, groupHeights, recipe.baseChar);

    // Apply template offsets and individual character override tweaks if present
    let finalScaleX = autoPos.scaleX;
    let finalScaleY = autoPos.scaleY;
    
    const useAutoCenterX = autoCenterXToUse;
    let finalOffsetX = autoPos.offsetX + (useAutoCenterX ? 0 : offsetXToUse);
    let finalOffsetY = autoPos.offsetY + offsetYToUse;

    if (overrides) {
      // Robust safeguard against undefined or NaN scale/offset values
      const oScaleX = overrides.scaleX !== undefined && !isNaN(overrides.scaleX) ? overrides.scaleX : 1.0;
      const oScaleY = overrides.scaleY !== undefined && !isNaN(overrides.scaleY) ? overrides.scaleY : 1.0;
      const oOffsetX = overrides.offsetX !== undefined && !isNaN(overrides.offsetX) ? overrides.offsetX : 0;
      const oOffsetY = overrides.offsetY !== undefined && !isNaN(overrides.offsetY) ? overrides.offsetY : 0;

      finalScaleX *= oScaleX;
      finalScaleY *= oScaleY;
      finalOffsetX += oOffsetX;
      finalOffsetY += oOffsetY;

      // Component-specific offsets
      if (idx === 0) {
        if (overrides.comp1OffsetX !== undefined && !isNaN(overrides.comp1OffsetX)) {
          finalOffsetX += overrides.comp1OffsetX;
        }
        if (overrides.comp1OffsetY !== undefined && !isNaN(overrides.comp1OffsetY)) {
          finalOffsetY += overrides.comp1OffsetY;
        }
        // If we switched to precomposed base, the single remaining component corresponds to the 2nd component in the original recipe
        if (recipe.components.length === 2) {
          if (overrides.comp2OffsetX !== undefined && !isNaN(overrides.comp2OffsetX)) {
            finalOffsetX += overrides.comp2OffsetX;
          }
          if (overrides.comp2OffsetY !== undefined && !isNaN(overrides.comp2OffsetY)) {
            finalOffsetY += overrides.comp2OffsetY;
          }
        }
      } else if (idx === 1) {
        if (overrides.comp2OffsetX !== undefined && !isNaN(overrides.comp2OffsetX)) {
          finalOffsetX += overrides.comp2OffsetX;
        }
        if (overrides.comp2OffsetY !== undefined && !isNaN(overrides.comp2OffsetY)) {
          finalOffsetY += overrides.comp2OffsetY;
        }
      }
    }

    // Final composition transformation for this diacritic
    const finalCmds = transformCommands(
      templateTransformed,
      finalScaleX,
      finalScaleY,
      finalOffsetX,
      finalOffsetY,
      false // Already flipped Y in templateTransformed, don't flip again
    );

    // Ensure diacritic contour winding directions match target orientation
    const orientedFinalCmds = orientContours(finalCmds, targetOuterClockwise);
    const diaSvgD = commandsToSvgPathD(orientedFinalCmds);

    // Merge diacritic with accumulated glyph path using 2D Boolean Union!
    // This permanently eliminates boolean cutout holes when shapes overlap!
    currentSvgD = unionSvgPaths(currentSvgD, diaSvgD);

    // Update previous bounding box to handle stacked double accents (only for circumflex & breve)
    const composedDiaBBox = getExactBoundingBox(orientedFinalCmds);
    if (diaId === 'circumflex' || diaId === 'breve') {
      previousBox = composedDiaBBox;
    } else {
      previousBox = undefined;
    }

    if (diaId === 'horn_o' || diaId === 'horn_u' || diaId.startsWith('horn')) {
      const excessRight = composedDiaBBox.xMax - baseBBox.x2;
      if (excessRight > 0) {
        autoHornAdvanceWidthTweak = Math.max(autoHornAdvanceWidthTweak, excessRight);
        hornInfo = {
          yMin: composedDiaBBox.yMin,
          yMax: composedDiaBBox.yMax,
          excessRight: excessRight
        };
      }
    }
  });

  // Convert final merged SVG path string back to opentype.Path
  const finalMergedCmds = parseSvgPath(currentSvgD);
  const compositePath = new opentype.Path();
  finalMergedCmds.forEach(cmd => {
    if (cmd.type === 'M') compositePath.moveTo(cmd.x, cmd.y);
    else if (cmd.type === 'L') compositePath.lineTo(cmd.x, cmd.y);
    else if (cmd.type === 'Q') compositePath.quadTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
    else if (cmd.type === 'C') compositePath.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
    else if (cmd.type === 'Z') compositePath.closePath();
  });

  // Calculate advance width (tracking)
  let advanceWidth = baseGlyph.advanceWidth;
  if (autoHornAdvanceWidthTweak > 0) {
    advanceWidth += autoHornAdvanceWidthTweak;
  }
  if (overrides && overrides.advanceWidthTweak !== undefined) {
    advanceWidth += overrides.advanceWidthTweak;
  }

  return { path: compositePath, advanceWidth, hornInfo };
}

/**
 * Searches the loaded font for the best candidate glyph matching a diacritic ID,
 * checking standard Unicodes and a list of alternative glyph names.
 */
