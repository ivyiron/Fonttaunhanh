import * as opentype from 'opentype.js';
import type { AutoKerningSettings } from '../session';
import { ensureKerningPairsPopulated } from './classes';
import {
  findGlyphIndex,
  generateFullFontKerningPairs,
  calculateOpticalPairDistance,
  getVietnameseVariantsMap
} from './engine';
import { VIETNAMESE_BASE_MAP, STEP2_RECIPES } from '../viet/recipes';

// ============================================================================
// INTERVENTION LEVELS
// ============================================================================
//
// A one-time warning dialog is easy to click past, and afterwards the user has
// no idea how much of the designer's work has been overwritten. The level is a
// value the tool carries, and every level reports exactly what it touched.

export type InterventionLevel = 0 | 1 | 2 | 3;

export const LEVEL_INFO: Record<InterventionLevel, { name: string; detail: string }> = {
  0: {
    name: 'Kế thừa',
    detail: 'GPOS gốc giữ nguyên tuyệt đối. Glyph mới không có kerning.'
  },
  1: {
    name: 'Mở rộng',
    detail: 'Nhân bản kerning của chữ nền sang glyph mới. Không sửa một cặp gốc nào.'
  },
  2: {
    name: 'Sửa va chạm',
    detail: 'Thêm việc sửa những cặp đo được là chạm nhau. Danh sách hữu hạn, duyệt từng cái.'
  },
  3: {
    name: 'Dựng lại',
    detail: 'Bỏ kerning gốc, sinh lại toàn bộ. Chỉ nên dùng khi font gốc không có kerning.'
  }
};

export interface PairEntry {
  key: string;              // "leftGlyphIndex,rightGlyphIndex"
  leftChar: string;
  rightChar: string;
  value: number;
  /** Where the value came from. */
  origin: 'original' | 'inherited' | 'repair' | 'rebuilt' | 'manual';
  /** For repairs, the measured optical gap that triggered the flag. */
  measuredGap?: number;
  /** The original font's value, when this pair overwrites one. */
  previousValue?: number;
}

export interface KerningPlan {
  /** Final pair table, ready to hand to buildKernTable / buildGPOSTable. */
  pairs: Record<string, number>;
  entries: PairEntry[];
  report: {
    originalPairsKept: number;
    pairsAddedForNewGlyphs: number;
    originalPairsOverwritten: number;
    /** Level 3 only: size of the regenerated table. Not "added to" anything. */
    pairsRebuilt: number;
    collisionsFound: number;
    collisionsFixed: number;
  };
}

export interface KerningPlanInput {
  font: opentype.Font;
  level: InterventionLevel;
  settings: AutoKerningSettings;
  /** Explicit per-pair overrides from the inspector, keyed "leftChar,rightChar". */
  manualPairs?: Record<string, number>;
  /** Repairs the user has approved, keyed "leftGlyphIndex,rightGlyphIndex". */
  approvedRepairs?: Set<string>;
  /**
   * Lets the caller tune an inherited value for the glyph it is being cloned onto.
   * The Việt hóa pipeline uses it to loosen pairs where a horn (ơ, ư) sticks out
   * to the right - a value copied from plain o would let the horn touch its
   * neighbour.
   */
  adjustInherited?: (leftGlyphIndex: number, rightGlyphIndex: number, value: number) => number;
}

/**
 * Produces the kerning table for a compile, plus the numbers the status bar shows.
 *
 * The font passed in must already carry the generated Vietnamese glyphs, because
 * level 1 needs to know which glyph indices are new.
 */
export function buildKerningPlan(input: KerningPlanInput): KerningPlan {
  const { font, level, settings, manualPairs = {}, approvedRepairs, adjustInherited } = input;

  ensureKerningPairsPopulated(font);
  const original: Record<string, number> = { ...(font as any).kerningPairs };
  const originalKeys = new Set(Object.keys(original));

  const pairs: Record<string, number> = {};
  const entries: PairEntry[] = [];

  const charOfIndex = buildIndexToChar(font);
  const record = (
    key: string, value: number, origin: PairEntry['origin'],
    extra?: Partial<PairEntry>
  ) => {
    pairs[key] = value;
    const [l, r] = key.split(',');
    entries.push({
      key,
      leftChar: charOfIndex.get(Number(l)) ?? `#${l}`,
      rightChar: charOfIndex.get(Number(r)) ?? `#${r}`,
      value,
      origin,
      ...extra
    });
  };

  let overwritten = 0;

  // --- level 3: throw the original away and regenerate ----------------------
  if (level === 3) {
    const generated = generateFullFontKerningPairs(font, settings);
    for (const p of generated) {
      const key = `${p.indexLeft},${p.indexRight}`;
      const previous = original[key];
      if (previous !== undefined && previous !== p.value) overwritten++;
      record(key, p.value, 'rebuilt', previous !== undefined ? { previousValue: previous } : undefined);
    }
    applyManual(font, manualPairs, record, original, () => { overwritten++; });
    return {
      pairs,
      entries,
      report: {
        originalPairsKept: 0,
        pairsAddedForNewGlyphs: 0,
        originalPairsOverwritten: overwritten,
        pairsRebuilt: entries.length,
        collisionsFound: 0,
        collisionsFixed: 0
      }
    };
  }

  // --- levels 0-2 all start by keeping every original pair untouched --------
  for (const [key, value] of Object.entries(original)) {
    record(key, value, 'original');
  }
  const kept = originalKeys.size;

  // --- level 1+: clone base-letter kerning onto the generated glyphs --------
  let inherited = 0;
  if (level >= 1) {
    inherited = inheritOntoNewGlyphs(font, original, pairs, record, settings, adjustInherited);
  }

  // --- level 2: repair measured collisions ---------------------------------
  let collisionsFound = 0;
  let collisionsFixed = 0;
  if (level >= 2) {
    const collisions = findCollisions(font, pairs);
    collisionsFound = collisions.length;
    for (const c of collisions) {
      if (approvedRepairs && !approvedRepairs.has(c.key)) continue;
      const previous = original[c.key];
      if (previous !== undefined && previous !== c.value) overwritten++;
      record(c.key, c.value, 'repair', {
        measuredGap: c.measuredGap,
        previousValue: previous
      });
      collisionsFixed++;
    }
  }

  applyManual(font, manualPairs, record, original, () => { overwritten++; });

  return {
    pairs,
    entries: dedupe(entries),
    report: {
      originalPairsKept: kept - overwritten,
      pairsAddedForNewGlyphs: inherited,
      originalPairsOverwritten: overwritten,
      pairsRebuilt: 0,
      collisionsFound,
      collisionsFixed
    }
  };
}

// ============================================================================
// LEVEL 1 - INHERITANCE
// ============================================================================

/**
 * Copies each base letter's pairs onto its Vietnamese variants.
 *
 * This never modifies an existing pair: it only writes keys that involve at least
 * one glyph the app generated, and skips any key the original font already had.
 * That is what makes level 1 safe to leave on by default - it extends the
 * designer's intent into the characters they never drew.
 */
function inheritOntoNewGlyphs(
  font: opentype.Font,
  original: Record<string, number>,
  pairs: Record<string, number>,
  record: (key: string, value: number, origin: PairEntry['origin'], extra?: Partial<PairEntry>) => void,
  settings: AutoKerningSettings,
  adjustInherited?: (l: number, r: number, v: number) => number
): number {
  const variants = getVietnameseVariantsMap();
  const strength = settings.intensityMultiplier ?? 1;

  // base glyph index -> variant glyph indices
  const expansion = new Map<number, number[]>();
  for (const [base, chars] of Object.entries(variants)) {
    const baseIdx = findGlyphIndex(font, base);
    if (baseIdx <= 0) continue;
    const targets: number[] = [];
    for (const ch of chars) {
      const idx = findGlyphIndex(font, ch);
      if (idx > 0 && idx !== baseIdx) targets.push(idx);
    }
    if (targets.length) expansion.set(baseIdx, targets);
  }

  let added = 0;
  for (const [key, value] of Object.entries(original)) {
    const [ls, rs] = key.split(',');
    const l = Number(ls);
    const r = Number(rs);
    const leftTargets = expansion.get(l) ?? [];
    const rightTargets = expansion.get(r) ?? [];
    if (!leftTargets.length && !rightTargets.length) continue;

    const scaled = Math.round(value * strength);
    const lefts = [l, ...leftTargets];
    const rights = [r, ...rightTargets];

    for (const nl of lefts) {
      for (const nr of rights) {
        if (nl === l && nr === r) continue;          // the original pair itself
        const k = `${nl},${nr}`;
        if (original[k] !== undefined) continue;      // never touch a designer's pair
        if (pairs[k] !== undefined) continue;
        const tuned = adjustInherited ? adjustInherited(nl, nr, scaled) : scaled;
        record(k, tuned, 'inherited');
        added++;
      }
    }
  }
  return added;
}

// ============================================================================
// LEVEL 2 - COLLISION REPAIR
// ============================================================================

export interface Collision {
  key: string;
  leftChar: string;
  rightChar: string;
  measuredGap: number;
  value: number;
}

/**
 * Measures the pairs most likely to clash and returns the finite list of ones
 * that do. Deliberately narrow: this is targeted repair, not a full-font sweep.
 *
 * The candidates are the ones Vietnamese actually creates trouble with - a horn
 * or a tall tone mark followed by a capital or an ascender - plus the classic
 * diagonal pairs.
 */
export function findCollisions(font: opentype.Font, currentPairs: Record<string, number>): Collision[] {
  const upm = font.unitsPerEm || 1000;
  const threshold = Math.round(upm * 0.012); // ~12 units at 1000 upm

  const risky = new Set<string>();
  for (const r of STEP2_RECIPES as any[]) {
    if (!r.components?.length) continue;
    const hasHorn = r.components.some((c: string) => c.startsWith('horn'));
    const hasTall = r.components.some((c: string) => c === 'hook' || c === 'tilde' || c === 'acute' || c === 'grave');
    if (hasHorn || hasTall) risky.add(r.char);
  }

  const rightNeighbours = ['T', 'V', 'W', 'Y', 'A', 'X', 'f', 'l', 'b', 'h', 'k', 't', '"', "'", ')', ']'];
  const leftNeighbours = ['T', 'V', 'W', 'Y', 'F', 'P', '(', '[', '"', "'"];

  const out: Collision[] = [];
  const seen = new Set<string>();

  const test = (a: string, b: string) => {
    const il = findGlyphIndex(font, a);
    const ir = findGlyphIndex(font, b);
    if (il <= 0 || ir <= 0) return;
    const key = `${il},${ir}`;
    if (seen.has(key)) return;
    seen.add(key);

    const measured = calculateOpticalPairDistance(font, a, b);
    if (measured === null) return;

    // calculateOpticalPairDistance returns the suggested adjustment; a strongly
    // negative value means the outlines are closer than the design intends.
    const existing = currentPairs[key] ?? 0;
    const residual = measured - existing;
    if (residual >= -threshold) return;

    out.push({ key, leftChar: a, rightChar: b, measuredGap: measured, value: Math.round(measured) });
  };

  for (const ch of risky) {
    for (const n of rightNeighbours) test(ch, n);
    for (const n of leftNeighbours) test(n, ch);
  }

  out.sort((a, b) => a.measuredGap - b.measuredGap);
  return out;
}

// ============================================================================
// HELPERS
// ============================================================================

function applyManual(
  font: opentype.Font,
  manualPairs: Record<string, number>,
  record: (key: string, value: number, origin: PairEntry['origin'], extra?: Partial<PairEntry>) => void,
  original: Record<string, number>,
  onOverwrite: () => void
): void {
  for (const [charKey, value] of Object.entries(manualPairs)) {
    const [a, b] = charKey.split(',');
    if (!a || !b) continue;
    const il = findGlyphIndex(font, a);
    const ir = findGlyphIndex(font, b);
    if (il <= 0 || ir <= 0) continue;
    const key = `${il},${ir}`;
    const previous = original[key];
    if (previous !== undefined && previous !== value) onOverwrite();
    record(key, value, 'manual', previous !== undefined ? { previousValue: previous } : undefined);
  }
}

function buildIndexToChar(font: any): Map<number, string> {
  const map = new Map<number, string>();
  for (let i = 0; i < font.glyphs.length; i++) {
    const g = font.glyphs.get(i);
    if (!g) continue;
    if (typeof g.unicode === 'number') map.set(i, String.fromCodePoint(g.unicode));
    else if (typeof g.name === 'string' && [...g.name].length === 1) map.set(i, g.name);
  }
  return map;
}

/** Later entries win, matching the order values were written into `pairs`. */
function dedupe(entries: PairEntry[]): PairEntry[] {
  const byKey = new Map<string, PairEntry>();
  for (const e of entries) byKey.set(e.key, e);
  return [...byKey.values()];
}

export { VIETNAMESE_BASE_MAP };
