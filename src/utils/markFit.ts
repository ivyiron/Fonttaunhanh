// Learn how this font puts accents on letters, from the accented letters it already has
// (á à â ã é ó … Á É …), and use that as the starting point for the Vietnamese marks.
//
//  - size: marks taken from an accented letter keep their size. Marks taken from a stand-alone
//    accent (´ ^ ~ often drawn bigger for use on their own) and placeholders get the size the font's
//    own accents suggest. With no accented letter at all, the size comes from the x-height, using
//    the proportions measured on ~100 fonts that have full Vietnamese (see EXPECT_H).
//  - place: the gap above the letter and the sideways shift of each mark (acute leaning right,
//    grave left) are measured on the font's own á é ó ú … and applied to the same mark everywhere.
//    Marks the font never put on a letter (the hook, usually) borrow from the closest one it did.
//
// Nothing here is a fixed factor: every number is measured on the font, the table below only says
// how big each mark is compared with the others.

import type { AutoPositionRules, DiacriticTemplate } from '../types';
import {
  extractDiacriticFromComposedGlyph,
  getExactBoundingBox,
  getGroupReferenceHeights,
  parseSvgPath,
  transformCommands,
  commandsToSvgPathD
} from '../utils';

/** Mark height / x-height (lowercase) and / cap height (uppercase): medians over 102 fonts with full Vietnamese. */
export const EXPECT_H: Record<string, { l: number; U: number }> = {
  acute: { l: 0.295, U: 0.2 },
  grave: { l: 0.296, U: 0.2 },
  circumflex: { l: 0.286, U: 0.187 },
  tilde: { l: 0.24, U: 0.167 },
  breve: { l: 0.274, U: 0.195 },
  hook: { l: 0.351, U: 0.251 }
};

const COMB: Record<string, string> = {
  acute: '́',
  grave: '̀',
  circumflex: '̂',
  tilde: '̃',
  breve: '̆'
};
const LOWER_BASES = ['a', 'e', 'o', 'u'];
const UPPER_BASES = ['A', 'E', 'O', 'U'];

export interface MarkFit {
  dx: number; // font units, added to the auto (centred, slant-following) X
  dy: number; // font units, added to the rule gap
  n: number; // letters it was measured on (0 = borrowed / defaulted)
}

export interface FontMarkLearning {
  xHeight: number;
  capHeight: number;
  sizeIndex: number; // this font's accents vs the typical proportion (1 = typical)
  sizeFrom: 'letters' | 'x-height';
  lowerGap: number | null;
  upperGap: number | null;
  upperScale: number | null; // capital marks vs lowercase marks
  fit: Record<string, { lower: MarkFit; upper: MarkFit }>;
  samples: string[]; // accented letters measured
}

const median = (v: number[]) => {
  if (!v.length) return NaN;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function bboxOf(cmds: any[]) {
  const b = getExactBoundingBox(cmds);
  return { x1: b.xMin, y1: b.yMin, x2: b.xMax, y2: b.yMax };
}

/** Measure the font's own accented letters. */
export function learnFromFont(font: any, slantAngle: number): FontMarkLearning {
  const heights = getGroupReferenceHeights(font);
  const xHeight = heights.xHeightMax || (font.unitsPerEm || 1000) * 0.5;
  const capHeight = heights.capHeightMax || (font.unitsPerEm || 1000) * 0.7;
  const tn = Math.tan((slantAngle * Math.PI) / 180);

  const per: Record<string, { lower: { gap: number[]; dx: number[]; h: number[] }; upper: { gap: number[]; dx: number[]; h: number[] } }> = {};
  const samples: string[] = [];

  for (const mark of Object.keys(COMB)) {
    per[mark] = { lower: { gap: [], dx: [], h: [] }, upper: { gap: [], dx: [], h: [] } };
    for (const base of [...LOWER_BASES, ...UPPER_BASES]) {
      const composed = (base + COMB[mark]).normalize('NFC');
      if (composed.length !== 1 || font.charToGlyphIndex(composed) <= 0) continue;
      const baseIdx = font.charToGlyphIndex(base);
      if (baseIdx <= 0) continue;
      const extracted = extractDiacriticFromComposedGlyph(font, mark, composed);
      if (!extracted) continue;
      const baseGlyph = font.glyphs.get(baseIdx);
      const bb = bboxOf(baseGlyph.path.commands);
      const mb = bboxOf(extracted.path.commands);
      if (!(mb.y2 > mb.y1) || !(bb.x2 > bb.x1)) continue;
      const upper = base === base.toUpperCase();
      const ref = upper ? capHeight : xHeight;
      const midY = (bb.y1 + bb.y2) / 2;
      const autoCx = (bb.x1 + bb.x2) / 2 + tn * (mb.y1 - midY);
      const slot = upper ? per[mark].upper : per[mark].lower;
      slot.gap.push(mb.y1 - ref);
      slot.dx.push((mb.x1 + mb.x2) / 2 - autoCx);
      slot.h.push(mb.y2 - mb.y1);
      samples.push(composed);
    }
  }

  // size: how this font's accents compare with the typical proportion of the letter height
  const idx: number[] = [];
  const caseRatios: number[] = [];
  for (const mark of Object.keys(per)) {
    const e = EXPECT_H[mark];
    if (!e) continue;
    const hl = median(per[mark].lower.h);
    const hu = median(per[mark].upper.h);
    if (hl > 0) idx.push(hl / (e.l * xHeight));
    if (hl > 0 && hu > 0) caseRatios.push(hu / hl);
  }
  const sizeIndex = idx.length ? Math.max(0.6, Math.min(1.6, median(idx))) : 1;

  // gaps: the font's usual distance between letter and mark, per case
  const gapsOf = (key: 'lower' | 'upper') =>
    ['acute', 'grave', 'circumflex'].flatMap((m) => per[m][key].gap);
  const lowerGapRaw = median(gapsOf('lower'));
  const upperGapRaw = median(gapsOf('upper'));
  const lowerGap = isFinite(lowerGapRaw) ? lowerGapRaw : null;
  const upperGap = isFinite(upperGapRaw) ? upperGapRaw : null;

  const fitOf = (mark: string, key: 'lower' | 'upper', ruleGap: number | null): MarkFit => {
    const s = per[mark]?.[key];
    if (!s || !s.dx.length) return { dx: NaN, dy: NaN, n: 0 };
    const g = median(s.gap);
    return { dx: median(s.dx), dy: ruleGap === null ? 0 : g - ruleGap, n: s.dx.length };
  };
  const fit: FontMarkLearning['fit'] = {};
  for (const mark of [...Object.keys(COMB), 'hook']) {
    fit[mark] = { lower: fitOf(mark, 'lower', lowerGap), upper: fitOf(mark, 'upper', upperGap) };
  }
  // marks the font never put on a letter borrow from the nearest one it did
  const borrow = (mark: string, from: string, dxFactor: number) => {
    for (const key of ['lower', 'upper'] as const) {
      const f = fit[mark][key];
      if (f.n) continue;
      const src = fit[from][key];
      fit[mark][key] = {
        dx: isFinite(src.dx) ? src.dx * dxFactor : 0,
        dy: isFinite(src.dy) ? src.dy : 0,
        n: 0
      };
    }
  };
  // the hook and tilde sit like the circumflex (symmetric marks; measured on 400 letters: within
  // ~4 units); without a circumflex, halfway between acute and grave
  for (const key of ['lower', 'upper'] as const) {
    const a = fit.acute[key], g = fit.grave[key];
    if (!fit.circumflex[key].n && a.n && g.n) {
      fit.circumflex[key] = { dx: (a.dx + g.dx) / 2, dy: (a.dy + g.dy) / 2, n: 0 };
    }
  }
  borrow('hook', 'circumflex', 1);
  borrow('acute', 'grave', -1);
  borrow('grave', 'acute', -1);
  borrow('tilde', 'circumflex', 1);
  borrow('breve', 'circumflex', 1);
  for (const mark of Object.keys(fit)) {
    for (const key of ['lower', 'upper'] as const) {
      const f = fit[mark][key];
      if (!isFinite(f.dx)) f.dx = 0;
      if (!isFinite(f.dy)) f.dy = 0;
    }
  }

  return {
    xHeight,
    capHeight,
    sizeIndex,
    sizeFrom: idx.length ? 'letters' : 'x-height',
    lowerGap,
    upperGap,
    upperScale: caseRatios.length ? median(caseRatios) : null,
    fit,
    samples: [...new Set(samples)]
  };
}

/**
 * Give marks that did not come from an accented letter the size the font's accents suggest:
 * stand-alone accents (often oversized) and placeholders. Baked into the path, like before.
 */
export function sizeMarksToFont(
  font: any,
  templates: Record<string, DiacriticTemplate>,
  sourceKind: Record<string, 'composed' | 'spacing' | 'placeholder'>,
  learn: FontMarkLearning
): Record<string, DiacriticTemplate> {
  const toTpl = 1000 / (font.unitsPerEm || 1000);
  const out: Record<string, DiacriticTemplate> = { ...templates };
  for (const id of Object.keys(out)) {
    const e = EXPECT_H[id];
    if (!e || sourceKind[id] === 'composed') continue;
    const t = out[id];
    const cmds = parseSvgPath(t.svgPath);
    const b = getExactBoundingBox(cmds);
    const h = (b.yMax - b.yMin) * (t.scaleY || 1);
    if (!(h > 0)) continue;
    const target = learn.sizeIndex * e.l * learn.xHeight * toTpl;
    const k = target / h;
    out[id] = {
      ...t,
      svgPath: commandsToSvgPathD(transformCommands(cmds, (t.scaleX || 1) * k, (t.scaleY || 1) * k, 0, 0, false)),
      scaleX: 1,
      scaleY: 1
    };
  }
  return out;
}

/** Rules starting values from what was measured (gaps, capital scale); the rest stays default. */
export function rulesFromLearning(rules: AutoPositionRules, learn: FontMarkLearning): AutoPositionRules {
  const out: AutoPositionRules = { ...rules, markFit: learn.fit };
  if (learn.lowerGap !== null) out.lowercaseAccentGap = Math.round(learn.lowerGap);
  if (learn.upperGap !== null) out.uppercaseAccentGap = Math.round(learn.upperGap);
  // capital marks: measured on Á vs á when the font has both, else the typical proportion
  if (learn.upperScale !== null) {
    out.uppercaseAccentScale = Math.round(learn.upperScale * 100) / 100;
  } else {
    const typical = median(
      Object.values(EXPECT_H).map((e) => (e.U * learn.capHeight) / (e.l * learn.xHeight))
    );
    if (isFinite(typical)) out.uppercaseAccentScale = Math.round(Math.max(0.6, Math.min(1.2, typical)) * 100) / 100;
  }
  return out;
}
