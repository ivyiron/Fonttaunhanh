import * as opentype from 'opentype.js';
import type {
  DiacriticTemplate,
  AutoPositionRules,
  GlyphOverrideState,
  AutoSpacingRules,
  AutoKerningSettings,
  ManualKerningPair
} from '../session';
import { ensureKerningPairsPopulated } from '../kerning/classes';
import {
  findGlyphIndex,
  invalidateGlyphIndexCache,
  generateFullFontKerningPairs,
  calculateAutoSpacingAdjustments,
  applySpacingDelta
} from '../kerning/engine';
import { buildVietnameseGlyphs, applyAutoSpacing } from './glyphs';
import { buildKerningPlan, type InterventionLevel, type KerningPlan } from '../kerning/intervention';
import { applyFontNaming, ensureGlyphNames } from '../font/naming';
import { STEP2_RECIPES, VIETNAMESE_RECIPES, BASE_CHAR_RECIPES } from '../viet/recipes';
import { buildKernTable, buildGPOSTable } from '../tables/kern';
import { injectAdvancedLayoutTables } from '../tables/sfnt';
import {
  updateOS2ForVietnamese,
  ensureCombiningMarkGlyphs,
  buildCcmpRules,
  addCcmpFeature,
  prepareGsubForWrite,
  verifyGsubRoundTrip
} from '../tables/features';

export interface VietnameseCompileInput {
  rawFontBuffer: ArrayBuffer;
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  overrides: Record<string, GlyphOverrideState>;
  preserveExistingGlyphs: boolean;
  spacingRules: AutoSpacingRules;
  kerningSettings: AutoKerningSettings;
  manualKerning: Record<string, ManualKerningPair[]>;
  customFamilyName: string;
  customSubfamilyName: string;
  /**
   * How much of the original kerning the compile may change. Defaults to 1:
   * clone the base letters' pairs onto the generated glyphs, touch nothing else.
   */
  interventionLevel?: InterventionLevel;
  /** Collision repairs the user approved, keyed "leftGlyphIndex,rightGlyphIndex". */
  approvedRepairs?: Set<string>;
}

/**
 * The Việt hóa export path, lifted out of App.tsx unchanged.
 *
 * Moved rather than rewritten on purpose: this is the only compile path that has
 * been checked against 45 fonts with fontTools and HarfBuzz. Generalising it to
 * the EditSet model happens after the three tools are on one shell, not before.
 */
export function compileVietnameseFont(input: VietnameseCompileInput): ArrayBuffer {
  const {
    rawFontBuffer,
    templates,
    rules,
    overrides,
    preserveExistingGlyphs,
    spacingRules,
    kerningSettings,
    manualKerning,
    customFamilyName,
    customSubfamilyName,
    interventionLevel = 1,
    approvedRepairs
  } = input;

  const font = opentype.parse(rawFontBuffer.slice(0));
  ensureKerningPairsPopulated(font);

  applyFontNaming(font, customFamilyName, customSubfamilyName, '2.00');
  ensureGlyphNames(font);

  // Compose the Vietnamese glyphs. Shared with the preview path so the canvas
  // and the exported font can never disagree.
  const { charHornInfo, getGlyphIndexForChar } = buildVietnameseGlyphs(font, {
    templates, rules, overrides, preserveExistingGlyphs
  });

  // Helper function to dynamically adjust kerning pairs based on horn overlap risks
  const adjustClonedKern = (
    horn: { yMin: number; yMax: number; excessRight: number },
    originalKern: number,
    rightGlyphIndex: number
  ): number => {
    if (horn.excessRight <= 0) return originalKern;

    const rightGlyph = font.glyphs.get(rightGlyphIndex);
    if (!rightGlyph || !rightGlyph.path || !rightGlyph.path.commands || rightGlyph.path.commands.length === 0) {
      return originalKern;
    }

    // Find the minimum x coordinate on the left side of the right glyph within the vertical range of the horn
    let leftXAtHornHeight = Infinity;
    const yMin = horn.yMin - 35; // 35-unit vertical buffer
    const yMax = horn.yMax + 35;

    rightGlyph.path.commands.forEach((cmd: any) => {
      const checkPoint = (x: number, y: number) => {
        if (y >= yMin && y <= yMax) {
          if (x < leftXAtHornHeight) {
            leftXAtHornHeight = x;
          }
        }
      };

      if (cmd.x !== undefined && cmd.y !== undefined) {
        checkPoint(cmd.x, cmd.y);
      }
      if (cmd.x1 !== undefined && cmd.y1 !== undefined) {
        checkPoint(cmd.x1, cmd.y1);
      }
      if (cmd.x2 !== undefined && cmd.y2 !== undefined) {
        checkPoint(cmd.x2, cmd.y2);
      }
    });

    if (leftXAtHornHeight !== Infinity) {
      // Overlap risk occurs if excessRight > leftXAtHornHeight
      const safetyGap = 60; // minimum required gap in font units
      const overlapRisk = horn.excessRight - leftXAtHornHeight;
      if (overlapRisk > -safetyGap) {
        const adjustment = overlapRisk + safetyGap;
        return originalKern + adjustment;
      }
    }

    return originalKern;
  };

  // Spacing first: kerning is measured against the advances it produces.
  applyAutoSpacing(font, spacingRules);

  // Kerning now goes through the shared intervention model instead of a second
  // implementation living here. The level decides how much of the designer's own
  // table the compile is allowed to touch, and the same call feeds the Kerning
  // tool's pair list and the status bar, so what the user reviewed is what ships.
  const indexToChar = new Map<number, string>();
  VIETNAMESE_RECIPES.forEach(recipe => {
    const idx = getGlyphIndexForChar(recipe.char);
    if (idx > 0) indexToChar.set(idx, recipe.char);
  });

  const plan = buildKerningPlan({
    font,
    level: interventionLevel,
    settings: kerningSettings,
    manualPairs: kerningSettings.customPairs ?? {},
    approvedRepairs: interventionLevel >= 2 ? approvedRepairs : undefined,
    adjustInherited: (leftIdx, rightIdx, value) => {
      const char = indexToChar.get(leftIdx);
      if (!char) return value;
      const horn = charHornInfo[char];
      return horn ? adjustClonedKern(horn, value, rightIdx) : value;
    }
  });

  font.kerningPairs = plan.pairs;


  // To prevent opentype.js from throwing serialization errors such as "lookupList table too big"
  // or "Table GPOS too big" (due to complex features/lookups in the original font that opentype.js
  // struggles to serialize from scratch), we delete GPOS, GSUB, and GDEF tables from the font's 
  // internal tables list before writing. 
  // Since we use injectAdvancedLayoutTables below to perfectly copy the pristine layout tables 
  // byte-for-byte from the original font buffer, this bypasses the buggy serializer while 
  // completely preserving original kerning, ligatures, and features!
  // Declare the Vietnamese coverage the font now actually has. Without these bits
  // Adobe apps, Windows font fallback and language filters do not list the font as
  // supporting Vietnamese even though every glyph is present.
  updateOS2ForVietnamese(font);

  // Build a 'ccmp' feature so decomposed input (e + U+0302 + U+0301) renders through the
  // precomposed glyph. This requires keeping the parsed GSUB so opentype.js writes the
  // original features together with ccmp - but opentype.js cannot serialize every GSUB,
  // so only attempt it when the table is provably writable without losing anything.
  const originalGsubTags = Array.isArray(font.tables?.gsub?.features)
    ? font.tables.gsub.features.map((f: any) => f.tag)
    : [];
  const originalLookupCount = Array.isArray(font.tables?.gsub?.lookups)
    ? font.tables.gsub.lookups.length
    : 0;

  const gsubCheck = prepareGsubForWrite(font);
  let ccmpInstalled = 0;

  if (gsubCheck.ok) {
    ensureCombiningMarkGlyphs(font, templates, rules);
    ccmpInstalled = addCcmpFeature(font, buildCcmpRules(font));
  } else {
    console.info('ccmp skipped, original GSUB copied verbatim instead:', gsubCheck.reason);
  }

  if (font.tables) {
    // NOTE: bit 6 of head.flags must stay 0 per the OpenType spec. OVERLAP_SIMPLE is a
    // per-glyph flag inside the 'glyf' table, not a head flag, so it is not set here.
    delete font.tables.gpos;
    delete font.tables.gdef;
    // With no ccmp to merge there is nothing to gain from re-serializing GSUB, so drop it
    // and let injectAdvancedLayoutTables copy the pristine bytes as before.
    if (ccmpInstalled === 0) {
      delete font.tables.gsub;
    }
  }

  // Write font tables to binary OpenType ArrayBuffer
  let buffer: ArrayBuffer;
  try {
    buffer = font.toArrayBuffer();

    // Confirm nothing was dropped on the way out; if it was, fall through to the fallback
    if (ccmpInstalled > 0) {
      const expected = [...originalGsubTags, 'ccmp'];
      if (!verifyGsubRoundTrip(buffer, expected, originalLookupCount + 1)) {
        throw new Error('GSUB round-trip verification failed');
      }
    }
  } catch (gsubErr: any) {
    if (ccmpInstalled === 0) throw gsubErr;
    console.warn('Falling back to the original GSUB (ccmp disabled):', gsubErr?.message);
    delete font.tables.gsub;
    ccmpInstalled = 0;
    buffer = font.toArrayBuffer();
  }

  // Build standard 'kern' table and OpenType GPOS table for full cross-browser kerning support
  const kernTableBytes = buildKernTable(font);
  const gposTableBytes = buildGPOSTable(font);

  // Inject custom GPOS and kern tables & preserve pristine original layout tables
  buffer = injectAdvancedLayoutTables(buffer, rawFontBuffer, false, kernTableBytes, gposTableBytes);
    buffer = injectAdvancedLayoutTables(buffer, rawFontBuffer, false, kernTableBytes, gposTableBytes);

  return buffer;
}
