// Learn how this font puts accents on letters, from the accented letters it already has
// (á à â ã é ó … Á É …), and use that as the starting point for the Vietnamese marks.
//
//  - size and stroke: every mark is measured against the font's letters. Marks taken from an
//    accented letter are already right. Any other mark (a stand-alone accent like ^ ~, a
//    placeholder, an SVG the user pastes) is brought to the height and stroke weight the font's
//    letters call for: its own accents when it has some, else its x-height and letter weight, with
//    the proportions measured on ~100 fonts that have full Vietnamese (EXPECT_H, EXPECT_W).
//  - place: the gap above the letter and the sideways shift of each mark (acute leaning right,
//    grave left) are measured on the font's own á é ó ú … and become the marks' default position
//    (the X / Y sliders start there). Marks the font never put on a letter borrow from the closest.
//
// Nothing here is a fixed factor: every number is measured on the font, the table below only says
// how big each mark is compared with the others.

import type { AutoPositionRules, DiacriticTemplate } from '../types';
import { strokeWeight, offsetOutline, rowIntervals } from './geometry';
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

/** Mark stroke weight / the letter's stroke weight (o), medians over the same fonts. */
export const EXPECT_W: Record<string, number> = {
  acute: 0.58,
  grave: 0.6,
  circumflex: 0.61,
  tilde: 0.64,
  breve: 0.64,
  hook: 0.54,
  horn_o: 0.7,
  horn_u: 0.7
};
/** Horn height / x-height (row scan of ơ ư vs o u). */
export const EXPECT_HORN_H = { horn_o: 0.373, horn_u: 0.38 };

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
  letterWeight: number; // stroke weight of the font's o
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
  let letterWeight = 0;
  try {
    const o = font.charToGlyph('o');
    if (o && o.path && o.path.commands.length) letterWeight = strokeWeight(o.path.commands);
  } catch {
    letterWeight = 0;
  }

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
    letterWeight,
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
 * Bring a mark (1000-unit, y-down template path) to the height and stroke weight this font's letters
 * call for. Baked into the path: Scale 100 % and stroke 0 then mean "as the font would have it".
 * Returns the path unchanged when there is nothing to measure against.
 */
export function fitMarkSvgToFont(font: any, id: string, svgPath: string, learn: FontMarkLearning, scale = 1): string {
  const upm = font.unitsPerEm || 1000;
  const toFont = upm / 1000;
  const cmds = parseSvgPath(svgPath);
  if (!cmds.length) return svgPath;
  const b = getExactBoundingBox(cmds);
  const h = (b.yMax - b.yMin) * scale;
  if (!(h > 0)) return svgPath;
  let targetH = 0;
  if (EXPECT_H[id]) targetH = learn.sizeIndex * EXPECT_H[id].l * learn.xHeight;
  else if (id === 'horn_o' || id === 'horn_u') targetH = learn.sizeIndex * EXPECT_HORN_H[id] * learn.xHeight;
  if (!(targetH > 0)) return svgPath;
  // font units, y up
  const k = targetH / (h * toFont);
  let f = transformCommands(cmds, scale * k * toFont, scale * k * toFont, 0, 0, true);
  const wTarget = (EXPECT_W[id] || 0) * learn.letterWeight;
  if (wTarget > 0) {
    const w = strokeWeight(f);
    const d = (wTarget - w) / 2;
    // only a real difference; never thin a mark into nothing
    if (Math.abs(d) > Math.max(1, wTarget * 0.06) && w + 2 * d > wTarget * 0.5) f = offsetOutline(f, d);
  }
  return commandsToSvgPathD(transformCommands(f, 1 / toFont, 1 / toFont, 0, 0, true));
}

/** Every mark that did not come from an accented letter is fitted to the font (size + stroke). */
export function fitMarksToFont(
  font: any,
  templates: Record<string, DiacriticTemplate>,
  sourceKind: Record<string, 'composed' | 'spacing' | 'placeholder'>,
  learn: FontMarkLearning
): Record<string, DiacriticTemplate> {
  const out: Record<string, DiacriticTemplate> = { ...templates };
  for (const id of Object.keys(out)) {
    if (sourceKind[id] === 'composed') continue;
    if (!EXPECT_H[id] && id !== 'horn_o' && id !== 'horn_u') continue;
    const t = out[id];
    const sx = t.scaleX || 1;
    const fitted = fitMarkSvgToFont(font, id, t.svgPath, learn, sx);
    if (fitted !== t.svgPath) out[id] = { ...t, svgPath: fitted, scaleX: 1, scaleY: 1 };
  }
  return out;
}

/**
 * The measured position becomes each mark's default: Y slider = gap change, X slider = sideways
 * shift (auto-centre stays on when there is no shift). Capitals get their own values only when
 * they really differ from lowercase.
 */
export function applyLearnedPositions(
  templates: Record<string, DiacriticTemplate>,
  learn: FontMarkLearning
): Record<string, DiacriticTemplate> {
  const out: Record<string, DiacriticTemplate> = { ...templates };
  for (const id of Object.keys(learn.fit)) {
    const t = out[id];
    if (!t) continue;
    const lo = learn.fit[id].lower, up = learn.fit[id].upper;
    const lx = Math.round(lo.dx), ly = Math.round(lo.dy);
    const ux = Math.round(up.dx), uy = Math.round(up.dy);
    const next: DiacriticTemplate = { ...t, offsetX: lx, offsetY: ly, autoCenterX: Math.abs(lx) < 2 };
    if (Math.abs(ux - lx) > 6 || Math.abs(uy - ly) > 6) {
      next.hasCapVariant = true;
      next.capOffsetX = ux;
      next.capOffsetY = uy;
      next.capAutoCenterX = Math.abs(ux) < 2;
    }
    out[id] = next;
  }
  return out;
}

/** Rules starting values from what was measured (gaps, capital scale); the rest stays default. */
export function rulesFromLearning(rules: AutoPositionRules, learn: FontMarkLearning): AutoPositionRules {
  const out: AutoPositionRules = { ...rules };
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

/**
 * The font's own Ð tells how its designer crosses the D: bar height, how far it reaches left of
 * the stem and right of it (in stems), and its thickness. Used to place the bar on D and to size
 * it on d. Null when the font has no Ð.
 */
export function learnDBar(font: any): { cy: number; left: number; right: number; thick: number } | null {
  const get = (ch: string) => {
    const i = font.charToGlyphIndex(ch);
    const g = i > 0 ? font.glyphs.get(i) : null;
    return g && g.path && g.path.commands.length ? g.path.commands : null;
  };
  const eth = get('Ð'), D = get('D');
  if (!eth || !D) return null;
  const H = getExactBoundingBox(D).yMax;
  const rows: Array<{ y: number; x0: number; x1: number; s0: number; s1: number }> = [];
  for (let y = H * 0.15; y < H * 0.85; y += H / 400) {
    const e = rowIntervals(eth, y), d = rowIntervals(D, y);
    if (!e.length || !d.length) continue;
    const stem = d[0];
    // the Eth interval that contains the D stem; a bar row reaches clearly left of the stem
    const iv = e.find((v) => v[0] <= stem[1] && v[1] >= stem[0]);
    if (iv && iv[0] < stem[0] - (stem[1] - stem[0]) * 0.2) {
      // a bar that runs into the bowl ends where the counter ends
      const bowl = d[1];
      const x1 = bowl && iv[1] >= bowl[0] - 1 ? bowl[0] : iv[1];
      rows.push({ y, x0: iv[0], x1, s0: stem[0], s1: stem[1] });
    }
  }
  if (rows.length < 2) return null;
  const y0 = rows[0].y, y1 = rows[rows.length - 1].y;
  const mid = rows[Math.floor(rows.length / 2)];
  const sw = Math.max(1, mid.s1 - mid.s0);
  // the right end of the bar: where the bar row's interval ends (inside the bowl)
  const x1 = Math.min(...rows.map((r) => r.x1));
  return {
    cy: (y0 + y1) / 2 / H,
    left: (mid.s0 - Math.min(...rows.map((r) => r.x0))) / sw,
    right: Math.max(0, (x1 - mid.s1) / sw),
    thick: y1 - y0
  };
}
