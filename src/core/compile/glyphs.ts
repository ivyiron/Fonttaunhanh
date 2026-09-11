import * as opentype from 'opentype.js';
import type {
  DiacriticTemplate,
  AutoPositionRules,
  GlyphOverrideState,
  AutoSpacingRules
} from '../session';
import { composeGlyphPath } from '../viet/compose';
import { STEP2_RECIPES } from '../viet/recipes';
import { findGlyphIndex, calculateAutoSpacingAdjustments, applySpacingDelta } from '../kerning/engine';

export interface GlyphBuildOptions {
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  overrides: Record<string, GlyphOverrideState>;
  preserveExistingGlyphs: boolean;
  /**
   * Rebuild only these characters. Used by the incremental preview path.
   * The caller must restore the pristine glyph for each of them first, otherwise
   * the preserveExistingGlyphs check sees the previously composed outline and
   * skips the rebuild.
   */
  onlyChars?: Set<string>;
}

export interface GlyphBuildResult {
  charHornInfo: Record<string, { yMin: number; yMax: number; excessRight: number }>;
  getGlyphIndexForChar: (c: string) => number;
  composedChars: Set<string>;
}

/**
 * Builds the Vietnamese glyphs into a font, in place.
 *
 * Both compileVietnameseFont and the preview path call this, and that is the
 * point. Composition is order dependent - composing ế consults the ê that an
 * earlier recipe may just have added - so a preview that recomposes a single
 * glyph against the pristine font produces a different outline than the export.
 * Two mirrored implementations cannot stay equal; one implementation can.
 */
export function buildVietnameseGlyphs(font: any, opts: GlyphBuildOptions): GlyphBuildResult {
  const { templates, rules, overrides, preserveExistingGlyphs } = opts;
  const composedChars = new Set<string>();

  // Pre-compute a mapping from character to glyph index
  const charToGlyphIndexMap: Record<string, number> = {};
  let simulatedGlyphsLength = font.glyphs.length;

  STEP2_RECIPES.forEach(recipe => {
    const existingIndex = font.charToGlyphIndex(recipe.char);
    if (existingIndex > 0) {
      charToGlyphIndexMap[recipe.char] = existingIndex;
    } else {
      charToGlyphIndexMap[recipe.char] = simulatedGlyphsLength;
      simulatedGlyphsLength++;
    }
  });

  const getGlyphIndexForChar = (c: string): number => {
    if (charToGlyphIndexMap[c] !== undefined) {
      return charToGlyphIndexMap[c];
    }
    return findGlyphIndex(font, c);
  };

  const charHornInfo: Record<string, { yMin: number; yMax: number; excessRight: number }> = {};

  // Compose and inject all Vietnamese composite glyphs & base character tracking tweaks
  STEP2_RECIPES.forEach(recipe => {
    if (opts.onlyChars && !opts.onlyChars.has(recipe.char)) return;

    const unicode = recipe.char.charCodeAt(0);
    const existingIndex = font.charToGlyphIndex(recipe.char);
    const existingGlyph = existingIndex > 0 ? font.glyphs.get(existingIndex) : null;
    const hasOriginalPath = existingGlyph && existingGlyph.path && existingGlyph.path.commands && existingGlyph.path.commands.length > 0;

    const isBaseChar = recipe.components.length === 0;

    // If character already exists natively in the font and preserve option is enabled, DO NOT overwrite it
    if (!isBaseChar && preserveExistingGlyphs && hasOriginalPath) {
      return;
    }

    const override = overrides[recipe.char];
  
    // If it's a base character with no tracking tweak, do not overwrite font's native glyph
    if (isBaseChar && (!override || !override.advanceWidthTweak)) {
      return;
    }

    // Bake composite path and compute customized tracking
    composedChars.add(recipe.char);
    const { path, advanceWidth, hornInfo } = composeGlyphPath(font, recipe, templates, rules, override, preserveExistingGlyphs);
    if (hornInfo) {
      charHornInfo[recipe.char] = hornInfo;
    }

    const glyphOptions = {
      name: recipe.char,
      unicode: unicode,
      unicodes: [unicode],
      advanceWidth: advanceWidth,
      path: path
    };

    if (existingIndex > 0) {
      // Overwrite existing slot
      const newGlyph = new opentype.Glyph({
        ...glyphOptions,
        index: existingIndex
      });
      (font.glyphs as any).glyphs[existingIndex] = newGlyph;
    } else {
      // Append new glyph
      const newIndex = font.glyphs.length;
      const newGlyph = new opentype.Glyph({
        ...glyphOptions,
        index: newIndex
      });
      (font.glyphs as any).glyphs[newIndex] = newGlyph;
      font.glyphs.length++;
    }
  });

  return { charHornInfo, getGlyphIndexForChar, composedChars };
}

/**
 * Applies the auto-spacing deltas. Split out for the same reason: the preview
 * canvas must show the outline shifted exactly as the exported font shifts it.
 */
export function applyAutoSpacing(font: any, spacingRules: AutoSpacingRules): Record<string, number> {
  // Apply Full Font Auto Spacing Adjustments (Sidebearings / Tracking)
  const autoSpacingMap = calculateAutoSpacingAdjustments(font, spacingRules);
  for (let i = 0; i < font.glyphs.length; i++) {
    const g = font.glyphs.get(i);
    if (g && g.name) {
      const charStr = g.unicode ? String.fromCharCode(g.unicode) : g.name;
      if (autoSpacingMap[charStr]) {
        applySpacingDelta(g, autoSpacingMap[charStr]);
      }
    }
  }

  return autoSpacingMap;
}
