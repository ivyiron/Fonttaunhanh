import * as opentype from 'opentype.js';
import {
  parseSvgPath,
  transformCommands,
  getExactBoundingBox,
  calculateAutoPosition,
  getGroupReferenceHeights,
  getXHeightFromFont,
  VIETNAMESE_RECIPES,
  BASE_CHAR_RECIPES
} from '../utils';
import { DiacriticTemplate, AutoPositionRules } from '../types';

// ============================================================================
// x-HEIGHT
// ============================================================================

/**
 * Returns the font's x-height in font units.
 * Measures flat lowercase letters first, then falls back to OS/2 sxHeight
 * (NOT sTypoXHeight - that field does not exist in the OS/2 table, so the
 * previous code silently fell back to the hardcoded 500 for every font).
 */
export { getXHeightFromFont as getXHeight } from '../utils';

// ============================================================================
// OS/2 UNICODE + CODEPAGE RANGES
// ============================================================================

// (startCodepoint, endCodepoint, bit index within the 128-bit ulUnicodeRange field)
const UNICODE_RANGE_BITS: [number, number, number][] = [
  [0x0020, 0x007E, 0],   // Basic Latin
  [0x00A0, 0x00FF, 1],   // Latin-1 Supplement
  [0x0100, 0x017F, 2],   // Latin Extended-A
  [0x0180, 0x024F, 3],   // Latin Extended-B
  [0x0250, 0x02AF, 4],   // IPA Extensions
  [0x02B0, 0x02FF, 5],   // Spacing Modifier Letters
  [0x0300, 0x036F, 6],   // Combining Diacritical Marks
  [0x0370, 0x03FF, 7],   // Greek and Coptic
  [0x0400, 0x04FF, 9],   // Cyrillic
  [0x1E00, 0x1EFF, 29],  // Latin Extended Additional  <- Vietnamese lives here
  [0x1F00, 0x1FFF, 30],  // Greek Extended
  [0x2000, 0x206F, 31],  // General Punctuation
  [0x2070, 0x209F, 32],  // Superscripts and Subscripts
  [0x20A0, 0x20CF, 33],  // Currency Symbols            <- U+20AB dong sign
  [0x2100, 0x214F, 35],  // Letterlike Symbols
  [0x2150, 0x218F, 36],  // Number Forms
  [0x2190, 0x21FF, 37],  // Arrows
  [0x2200, 0x22FF, 38],  // Mathematical Operators
  [0x2500, 0x257F, 41],  // Box Drawing
  [0x25A0, 0x25FF, 43],  // Geometric Shapes
  [0x2600, 0x26FF, 44],  // Miscellaneous Symbols
  [0xFB00, 0xFB4F, 63]   // Alphabetic Presentation Forms
];

// Windows codepage bits in ulCodePageRange1
const CODEPAGE_BITS: { bit: number; probe: number[] }[] = [
  { bit: 0, probe: [0x00C0, 0x00E9] },          // 1252 Latin 1
  { bit: 1, probe: [0x0154, 0x0158] },          // 1250 Latin 2
  { bit: 2, probe: [0x0410, 0x0411] },          // 1251 Cyrillic
  { bit: 3, probe: [0x0391, 0x0392] },          // 1253 Greek
  { bit: 4, probe: [0x011E, 0x0130] },          // 1254 Turkish
  { bit: 7, probe: [0x0104, 0x012E] },          // 1257 Baltic
  { bit: 8, probe: [0x01A0, 0x01AF, 0x1EA0] }   // 1258 Vietnamese
];

/**
 * Sets the OS/2 unicode range, codepage range and first/last char index bits that the
 * newly added Vietnamese glyphs imply. Bits are only ever turned ON - the original
 * designer's bits are never cleared, so this can never narrow a font's declared coverage.
 * Returns the number of bits newly set.
 */
export function updateOS2ForVietnamese(font: any): { unicodeBits: number; codepageBits: number } {
  const os2 = font?.tables?.os2;
  if (!os2) return { unicodeBits: 0, codepageBits: 0 };

  // Collect every codepoint the font actually maps
  const codepoints: number[] = [];
  for (let i = 0; i < font.glyphs.length; i++) {
    const g = font.glyphs.get(i);
    if (!g) continue;
    if (typeof g.unicode === 'number') codepoints.push(g.unicode);
    if (Array.isArray(g.unicodes)) codepoints.push(...g.unicodes);
  }
  if (codepoints.length === 0) return { unicodeBits: 0, codepageBits: 0 };

  const present = new Set(codepoints);

  const fields = ['ulUnicodeRange1', 'ulUnicodeRange2', 'ulUnicodeRange3', 'ulUnicodeRange4'];
  const before = fields.map(f => (os2[f] || 0) >>> 0);

  for (const [start, end, bit] of UNICODE_RANGE_BITS) {
    let hit = false;
    for (const cp of present) {
      if (cp >= start && cp <= end) { hit = true; break; }
    }
    if (!hit) continue;
    const fieldIdx = Math.floor(bit / 32);
    const bitInField = bit % 32;
    const key = fields[fieldIdx];
    os2[key] = ((os2[key] || 0) | (1 << bitInField)) >>> 0;
  }

  const cpBefore = (os2.ulCodePageRange1 || 0) >>> 0;
  for (const { bit, probe } of CODEPAGE_BITS) {
    if (probe.every(cp => present.has(cp))) {
      os2.ulCodePageRange1 = ((os2.ulCodePageRange1 || 0) | (1 << bit)) >>> 0;
    }
  }
  if (typeof os2.ulCodePageRange2 !== 'number') os2.ulCodePageRange2 = 0;

  // ulCodePageRange needs OS/2 version 1+, and opentype.js always serializes a 96 byte
  // (version 2 sized) table, so declare version 2 and fill the fields it requires.
  if (typeof os2.version !== 'number' || os2.version < 2) {
    os2.version = 2;
    if (!os2.sxHeight) os2.sxHeight = Math.round(getXHeightFromFont(font));
    if (!os2.sCapHeight) {
      const capBox = (() => {
        try {
          const idx = font.charToGlyphIndex('H');
          return idx > 0 ? font.glyphs.get(idx)?.getBoundingBox() : null;
        } catch {
          return null;
        }
      })();
      os2.sCapHeight = Math.round(capBox?.y2 || font.ascender || 700);
    }
    if (typeof os2.usDefaultChar !== 'number') os2.usDefaultChar = 0;
    if (typeof os2.usBreakChar !== 'number') os2.usBreakChar = 32;
  }

  // The ccmp ligatures introduced here match up to three glyphs
  os2.usMaxContext = Math.max(os2.usMaxContext || 0, 3);

  const mapped = codepoints.filter(cp => cp > 0 && cp <= 0xFFFF);
  if (mapped.length > 0) {
    os2.usFirstCharIndex = Math.min(...mapped);
    os2.usLastCharIndex = Math.max(...mapped);
  }

  let unicodeBits = 0;
  fields.forEach((f, i) => {
    let diff = (((os2[f] || 0) >>> 0) & ~before[i]) >>> 0;
    while (diff) { unicodeBits += diff & 1; diff >>>= 1; }
  });
  let cpDiff = (((os2.ulCodePageRange1 || 0) >>> 0) & ~cpBefore) >>> 0;
  let codepageBits = 0;
  while (cpDiff) { codepageBits += cpDiff & 1; cpDiff >>>= 1; }

  return { unicodeBits, codepageBits };
}

// ============================================================================
// COMBINING MARK GLYPHS
// ============================================================================

// Combining codepoint -> diacritic template id used to draw it
export const COMBINING_MARK_TEMPLATES: Record<number, string> = {
  0x0300: 'grave',
  0x0301: 'acute',
  0x0302: 'circumflex',
  0x0303: 'tilde',
  0x0306: 'breve',
  0x0309: 'hook',
  0x031B: 'horn_o',
  0x0323: 'dot_below'
};

const COMBINING_GLYPH_NAMES: Record<number, string> = {
  0x0300: 'gravecomb',
  0x0301: 'acutecomb',
  0x0302: 'circumflexcomb',
  0x0303: 'tildecomb',
  0x0306: 'brevecomb',
  0x0309: 'hookabovecomb',
  0x031B: 'horncomb',
  0x0323: 'dotbelowcomb'
};

/**
 * Adds zero-width combining mark glyphs (U+0300, U+0301, U+0302, U+0303, U+0306,
 * U+0309, U+031B, U+0323) for any that the font is missing.
 *
 * These are required for 'ccmp' to work: the shaper must be able to map a decomposed
 * codepoint to *some* glyph before the substitution rule can fire. They are drawn from
 * the same diacritic templates used for composition, positioned as they would sit over
 * a lowercase base and shifted so the mark is centred on the glyph origin.
 *
 * Returns the number of glyphs added.
 */
/**
 * Maps every codepoint the live glyph list carries to its glyph index, including glyphs
 * appended after the font was parsed (which the original cmap knows nothing about).
 */
function buildCodepointIndex(font: any): Map<number, number> {
  const byCode = new Map<number, number>();
  for (let i = 0; i < font.glyphs.length; i++) {
    const g = font.glyphs.get(i);
    if (!g) continue;
    if (typeof g.unicode === 'number' && !byCode.has(g.unicode)) byCode.set(g.unicode, i);
    if (Array.isArray(g.unicodes)) {
      for (const u of g.unicodes) {
        if (!byCode.has(u)) byCode.set(u, i);
      }
    }
  }
  return byCode;
}

export function ensureCombiningMarkGlyphs(
  font: any,
  templates: Record<string, DiacriticTemplate>,
  rules: AutoPositionRules
): number {
  if (!font) return 0;

  const existingByCode = buildCodepointIndex(font);

  const groupHeights = getGroupReferenceHeights(font);
  const xHeight = groupHeights.xHeightMax || getXHeightFromFont(font);

  // A synthetic zero-width base: origin-centred, baseline to x-height
  const baseBBox = { x1: 0, y1: 0, x2: 0, y2: xHeight };

  let added = 0;

  for (const [cpStr, templateId] of Object.entries(COMBINING_MARK_TEMPLATES)) {
    const cp = parseInt(cpStr, 10);
    if (existingByCode.has(cp)) continue;

    const template = templates[templateId];
    if (!template || !template.svgPath) continue;

    try {
      const rawCmds = parseSvgPath(template.svgPath);
      if (rawCmds.length === 0) continue;

      const scaled = transformCommands(rawCmds, template.scaleX, template.scaleY, 0, 0, true);
      const diaBBox = getExactBoundingBox(scaled);

      const pos = calculateAutoPosition(templateId, baseBBox, diaBBox, rules, false, undefined, groupHeights, 'a');
      const placed = transformCommands(scaled, pos.scaleX, pos.scaleY, pos.offsetX, pos.offsetY, false);

      // Centre the mark horizontally on the origin so it overlays the preceding glyph
      const placedBox = getExactBoundingBox(placed);
      const shiftX = -((placedBox.xMin + placedBox.xMax) / 2);
      const centred = transformCommands(placed, 1, 1, shiftX, 0, false);

      const path = new opentype.Path();
      centred.forEach((cmd: any) => {
        if (cmd.type === 'M') path.moveTo(cmd.x, cmd.y);
        else if (cmd.type === 'L') path.lineTo(cmd.x, cmd.y);
        else if (cmd.type === 'Q') path.quadTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
        else if (cmd.type === 'C') path.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        else if (cmd.type === 'Z') path.closePath();
      });

      const index = font.glyphs.length;
      font.glyphs.glyphs[index] = new opentype.Glyph({
        name: COMBINING_GLYPH_NAMES[cp] || `uni${cp.toString(16).toUpperCase().padStart(4, '0')}`,
        unicode: cp,
        unicodes: [cp],
        advanceWidth: 0,
        index,
        path
      });
      font.glyphs.length++;
      existingByCode.set(cp, index);
      added++;
    } catch {
      // A mark we cannot draw is simply skipped; ccmp rules needing it are dropped later.
    }
  }

  return added;
}

// ============================================================================
// ccmp FEATURE
// ============================================================================

export interface GsubWriteCheck {
  ok: boolean;
  reason?: string;
  flattenedExtensions: number;
  repairedScripts: number;
}

/**
 * opentype.js can only serialize GSUB lookup types 1-6, requires every script to carry a
 * default language system, and silently drops the FeatureVariations of a version 1.1 table.
 * Retaining GSUB so ccmp can be merged into it is therefore only safe for some fonts.
 *
 * This makes the table writable where that is possible without losing anything:
 *   - lookup type 7 (Extension Substitution) is flattened to the type it wraps. Extension is
 *     purely a 32-bit-offset device, so the inner lookup is an exact equivalent.
 *   - a script missing its default language system gets one, seeded from its first language
 *     system record.
 * and reports ok:false when the table cannot be rewritten faithfully, so the caller can fall
 * back to copying the original GSUB bytes and skip ccmp.
 *
 * Mutates font.tables.gsub. That is harmless: on the fallback path the table is discarded.
 */
export function prepareGsubForWrite(font: any): GsubWriteCheck {
  const result: GsubWriteCheck = { ok: true, flattenedExtensions: 0, repairedScripts: 0 };

  const gsub = font?.tables?.gsub;
  if (!gsub) return result;

  // Version 1.1 carries a FeatureVariations table that the writer does not emit
  if (gsub.version !== 1 || gsub.variations) {
    return { ...result, ok: false, reason: 'GSUB uses feature variations (version 1.1)' };
  }

  if (!Array.isArray(gsub.lookups) || !Array.isArray(gsub.scripts) || !Array.isArray(gsub.features)) {
    return { ...result, ok: false, reason: 'GSUB structure is not recognisable' };
  }

  // --- Flatten Extension Substitution lookups ---
  for (const lookup of gsub.lookups) {
    if (lookup.lookupType !== 7) continue;

    const subtables = lookup.subtables || [];
    if (subtables.length === 0) {
      return { ...result, ok: false, reason: 'empty Extension Substitution lookup' };
    }

    const innerTypes = new Set(subtables.map((s: any) => s.lookupType));
    if (innerTypes.size !== 1) {
      return { ...result, ok: false, reason: 'Extension lookup mixes substitution types' };
    }

    const innerType = subtables[0].lookupType;
    if (subtables.some((s: any) => !s.extension)) {
      return { ...result, ok: false, reason: 'Extension lookup has no inner subtable' };
    }

    lookup.lookupType = innerType;
    lookup.subtables = subtables.map((s: any) => s.extension);
    result.flattenedExtensions++;
  }

  const unsupported = gsub.lookups
    .map((l: any) => l.lookupType)
    .filter((t: number) => !(t >= 1 && t <= 6));
  if (unsupported.length > 0) {
    return { ...result, ok: false, reason: `unsupported GSUB lookup type ${unsupported[0]}` };
  }

  // --- Give every script a default language system ---
  for (const record of gsub.scripts) {
    const script = record?.script;
    if (!script || script.defaultLangSys) continue;

    const first = Array.isArray(script.langSysRecords) ? script.langSysRecords[0]?.langSys : null;
    script.defaultLangSys = {
      reserved: 0,
      reqFeatureIndex: typeof first?.reqFeatureIndex === 'number' ? first.reqFeatureIndex : 0xFFFF,
      featureIndexes: Array.isArray(first?.featureIndexes) ? first.featureIndexes.slice() : []
    };
    result.repairedScripts++;
  }

  return result;
}

/**
 * Re-reads a compiled buffer and confirms the GSUB it carries still holds every feature the
 * original font had, plus ccmp. Guards against the serializer quietly dropping something.
 */
export function verifyGsubRoundTrip(
  buffer: ArrayBuffer,
  expectedTags: string[],
  expectedLookupCount: number
): boolean {
  try {
    const written = opentype.parse(buffer.slice(0)) as any;
    const gsub = written?.tables?.gsub;
    if (!gsub || !Array.isArray(gsub.features) || !Array.isArray(gsub.lookups)) return false;
    if (gsub.lookups.length !== expectedLookupCount) return false;

    const got = gsub.features.map((f: any) => f.tag).sort();
    const want = expectedTags.slice().sort();
    if (got.length !== want.length) return false;
    return got.every((tag: string, i: number) => tag === want[i]);
  } catch {
    return false;
  }
}

export interface CcmpRule {
  sequence: number[]; // glyph indices, 2 or 3 long
  by: number;         // precomposed glyph index
}

/**
 * Builds the list of ccmp ligature rules that map decomposed Vietnamese input onto the
 * precomposed glyphs this app generated.
 *
 * Three input shapes are covered per character:
 *   - canonical NFD order          e + U+0302 + U+0301  ->  ế
 *   - typing order (marks swapped) a + U+0302 + U+0323  ->  ậ   (NFD puts U+0323 first)
 *   - partially composed           ê + U+0301           ->  ế
 *
 * Rules whose component glyphs are not all present in the font are dropped.
 */
export function buildCcmpRules(font: any): CcmpRule[] {
  if (!font) return [];

  // font.charToGlyphIndex reads the cmap parsed from the ORIGINAL file, so it cannot see
  // any glyph this app appended. Resolve against the live glyph list instead.
  const byCode = buildCodepointIndex(font);

  const glyphOf = (ch: string): number => {
    const cp = ch.codePointAt(0);
    if (cp === undefined) return 0;
    const hit = byCode.get(cp);
    if (hit !== undefined) return hit;
    try {
      return font.charToGlyphIndex(ch);
    } catch {
      return 0;
    }
  };

  const chars = new Set<string>();
  [...VIETNAMESE_RECIPES, ...BASE_CHAR_RECIPES].forEach(r => chars.add(r.char));

  const seen = new Set<string>();
  const rules: CcmpRule[] = [];

  const push = (parts: string[], target: string) => {
    const by = glyphOf(target);
    if (by <= 0) return;
    const sequence = parts.map(glyphOf);
    if (sequence.some(i => i <= 0)) return;
    if (sequence.length < 2) return;
    const key = sequence.join(',') + '>' + by;
    if (seen.has(key)) return;
    seen.add(key);
    rules.push({ sequence, by });
  };

  for (const ch of chars) {
    const nfd = ch.normalize('NFD');
    if (nfd.length < 2 || nfd === ch) continue;

    const base = nfd[0];
    const marks = Array.from(nfd.slice(1));

    // canonical order
    push([base, ...marks], ch);

    // swapped mark order (what most Vietnamese IMEs emit)
    if (marks.length === 2) {
      push([base, marks[1], marks[0]], ch);

      // partially composed: base + first mark already forms a precomposed glyph
      for (const [a, b] of [[marks[0], marks[1]], [marks[1], marks[0]]]) {
        const partial = (base + a).normalize('NFC');
        if (partial.length === 1 && partial !== base) push([partial, b], ch);
      }
    }
  }

  // Longer sequences must be matched before shorter ones inside a ligature set
  rules.sort((x, y) => y.sequence.length - x.sequence.length);
  return rules;
}

/**
 * Installs a 'ccmp' feature into font.tables.gsub containing the given rules.
 *
 * opentype.js's Substitution.add() cannot be used here: it asserts that new features are
 * appended in alphabetical order relative to the whole feature array, which real fonts
 * violate. The feature record is instead inserted at its correct alphabetical position and
 * every existing feature index is remapped so the FeatureList stays sorted.
 *
 * Returns the number of rules installed.
 */
export function addCcmpFeature(font: any, rules: CcmpRule[]): number {
  if (!font || rules.length === 0) return 0;

  if (!font.tables.gsub) {
    const emptyLangSys = () => ({ reserved: 0, reqFeatureIndex: 0xFFFF, featureIndexes: [] as number[] });
    font.tables.gsub = {
      version: 1,
      scripts: [
        { tag: 'DFLT', script: { defaultLangSys: emptyLangSys(), langSysRecords: [] } },
        { tag: 'latn', script: { defaultLangSys: emptyLangSys(), langSysRecords: [] } }
      ],
      features: [],
      lookups: []
    };
  }

  const gsub = font.tables.gsub;
  if (!Array.isArray(gsub.scripts) || !Array.isArray(gsub.features) || !Array.isArray(gsub.lookups)) {
    return 0;
  }

  // --- 1. Build the LigatureSubst subtable, grouped by first glyph ---
  const bySecondFirst = new Map<number, { components: number[]; ligGlyph: number }[]>();
  for (const rule of rules) {
    const first = rule.sequence[0];
    if (!bySecondFirst.has(first)) bySecondFirst.set(first, []);
    bySecondFirst.get(first)!.push({ components: rule.sequence.slice(1), ligGlyph: rule.by });
  }

  const coverageGlyphs = Array.from(bySecondFirst.keys()).sort((a, b) => a - b);
  const ligatureSets = coverageGlyphs.map(g => {
    const set = bySecondFirst.get(g)!;
    // longest component list first, as required for correct ligature matching
    return set
      .slice()
      .sort((a, b) => b.components.length - a.components.length)
      .map(entry => ({ ligGlyph: entry.ligGlyph, components: entry.components }));
  });

  const lookup = {
    lookupType: 4,
    lookupFlag: 0,
    subtables: [
      {
        substFormat: 1,
        coverage: { format: 1, glyphs: coverageGlyphs },
        ligatureSets
      }
    ],
    markFilteringSet: undefined
  };

  const lookupIndex = gsub.lookups.length;
  gsub.lookups.push(lookup);

  // --- 2. Insert the feature record alphabetically, remapping existing indexes ---
  let insertAt = gsub.features.length;
  for (let i = 0; i < gsub.features.length; i++) {
    if (gsub.features[i].tag > 'ccmp') { insertAt = i; break; }
  }

  gsub.features.splice(insertAt, 0, {
    tag: 'ccmp',
    feature: { featureParams: 0, lookupListIndexes: [lookupIndex] }
  });

  const remap = (idx: number) => (idx >= insertAt && idx !== 0xFFFF ? idx + 1 : idx);

  const patchLangSys = (langSys: any) => {
    if (!langSys) return;
    if (Array.isArray(langSys.featureIndexes)) {
      langSys.featureIndexes = langSys.featureIndexes.map(remap);
      if (!langSys.featureIndexes.includes(insertAt)) {
        langSys.featureIndexes.push(insertAt);
        langSys.featureIndexes.sort((a: number, b: number) => a - b);
      }
    }
    if (typeof langSys.reqFeatureIndex === 'number') {
      langSys.reqFeatureIndex = remap(langSys.reqFeatureIndex);
    }
  };

  gsub.scripts.forEach((s: any) => {
    if (!s || !s.script) return;
    patchLangSys(s.script.defaultLangSys);
    if (Array.isArray(s.script.langSysRecords)) {
      s.script.langSysRecords.forEach((r: any) => patchLangSys(r.langSys));
    }
  });

  return rules.length;
}
