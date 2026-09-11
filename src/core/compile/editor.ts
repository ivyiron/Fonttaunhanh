import * as opentype from 'opentype.js';
import type { GlyphEditState } from '../session';
import { parseSvgPath, transformCommands } from '../geometry/path';
import { ensureKerningPairsPopulated } from '../kerning/classes';
import { cloneKerningPairs } from '../font/glyphs';
import { applyFontNaming, ensureGlyphNames } from '../font/naming';
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
import { DEFAULT_DIACRITICS, DEFAULT_AUTO_RULES } from '../viet/recipes';

export interface EditorCompileInput {
  rawFontBuffer: ArrayBuffer;
  editedGlyphs: Record<string, GlyphEditState>;
  customFamilyName: string;
  customSubfamilyName: string;
}

export interface EditorCompileResult {
  buffer: ArrayBuffer;
  replaced: number;
  added: number;
  kerningPairs: number;
  ccmpRules: number;
  warnings: string[];
}

/**
 * The Sửa font export path.
 *
 * Behaviourally this is the tool's original compile, with one deliberate change:
 * it now calls the same buildKernTable and buildGPOSTable as Việt hóa. The fork
 * used to cap kerning at 10.920 pairs with pairs.slice() and shipped no GPOS at
 * all, so a font edited here lost most of its kerning in browsers. Sharing the
 * builders is the whole reason core exists.
 */
export function compileEditedFont(input: EditorCompileInput): EditorCompileResult {
  const { rawFontBuffer, editedGlyphs, customFamilyName, customSubfamilyName } = input;

  const font = opentype.parse(rawFontBuffer.slice(0));
  ensureKerningPairsPopulated(font);

  applyFontNaming(font, customFamilyName, customSubfamilyName);
  ensureGlyphNames(font);

  const active = (Object.values(editedGlyphs) as GlyphEditState[])
    .filter(g => (g.isCompleted || g.isModified) && g.svgPath);

  let replaced = 0;
  let added = 0;

  for (const state of active) {
    const transformed = transformCommands(
      parseSvgPath(state.svgPath),
      state.scaleX, state.scaleY, state.offsetX, state.offsetY, state.flipY
    );

    const path = new opentype.Path();
    for (const cmd of transformed) {
      if (cmd.type === 'M') path.moveTo(cmd.x, cmd.y);
      else if (cmd.type === 'L') path.lineTo(cmd.x, cmd.y);
      else if (cmd.type === 'Q') path.quadTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
      else if (cmd.type === 'C') path.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
      else if (cmd.type === 'Z') path.closePath();
    }

    if (state.mode === 'replace') {
      const targetIndex = state.originalGlyphIndex;
      (font.glyphs as any).glyphs[targetIndex] = new opentype.Glyph({
        name: state.originalName,
        unicode: state.originalUnicode,
        unicodes: state.originalUnicode ? [state.originalUnicode] : [],
        advanceWidth: state.advanceWidth,
        path,
        index: targetIndex
      });
      replaced++;

      if (state.inheritKerning && state.trackingOffset !== 0 && font.kerningPairs) {
        cloneKerningPairs(font.kerningPairs as any, targetIndex, targetIndex, state.trackingOffset);
      }
    } else {
      const newIndex = font.glyphs.length;
      (font.glyphs as any).glyphs[newIndex] = new opentype.Glyph({
        name: state.altName || `${state.originalName}.alt`,
        unicode: state.altUnicode,
        unicodes: [state.altUnicode],
        advanceWidth: state.advanceWidth,
        path,
        index: newIndex
      });
      font.glyphs.length++;
      added++;

      if (state.inheritKerning && font.kerningPairs) {
        cloneKerningPairs(
          font.kerningPairs as any, state.originalGlyphIndex, newIndex, state.trackingOffset
        );
      }
    }
  }

  // Alt glyphs land in the PUA, so the declared coverage moves with them
  updateOS2ForVietnamese(font);

  // A user drawing ế by hand here needs the same ccmp the Việt hóa path gets.
  // Same guard as there: only touch GSUB when it can be rewritten faithfully,
  // and fall back to copying the pristine bytes otherwise.
  const warnings: string[] = [];
  const originalGsubTags: string[] = (font.tables as any)?.gsub?.features?.map((x: any) => x.tag) ?? [];
  const originalLookupCount: number = (font.tables as any)?.gsub?.lookups?.length ?? 0;

  const templates: Record<string, any> = {};
  DEFAULT_DIACRITICS.forEach((t: any) => { templates[t.id] = t; });

  const gsubCheck = prepareGsubForWrite(font);
  let ccmpRules = 0;
  if (gsubCheck.ok) {
    ensureCombiningMarkGlyphs(font, templates, DEFAULT_AUTO_RULES);
    ccmpRules = addCcmpFeature(font, buildCcmpRules(font));
  } else {
    warnings.push(`ccmp bỏ qua, GSUB gốc chép nguyên: ${gsubCheck.reason}`);
  }

  const kernBytes = buildKernTable(font);
  const gposBytes = buildGPOSTable(font);

  delete (font.tables as any).gpos;
  delete (font.tables as any).gdef;
  if (ccmpRules === 0) delete (font.tables as any).gsub;

  let buffer: ArrayBuffer;
  try {
    buffer = font.toArrayBuffer();
    if (ccmpRules > 0 &&
        !verifyGsubRoundTrip(buffer, [...originalGsubTags, 'ccmp'], originalLookupCount + 1)) {
      throw new Error('GSUB round-trip verification failed');
    }
  } catch (err: any) {
    if (ccmpRules === 0) throw err;
    warnings.push(`Quay lại GSUB gốc, ccmp tắt: ${err?.message}`);
    delete (font.tables as any).gsub;
    ccmpRules = 0;
    buffer = font.toArrayBuffer();
  }

  buffer = injectAdvancedLayoutTables(buffer, rawFontBuffer, false, kernBytes, gposBytes);

  return {
    buffer,
    replaced,
    added,
    kerningPairs: Object.keys(font.kerningPairs ?? {}).length,
    ccmpRules,
    warnings
  };
}
