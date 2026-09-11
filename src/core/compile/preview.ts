import * as opentype from 'opentype.js';
import type {
  DiacriticTemplate,
  AutoPositionRules,
  GlyphOverrideState,
  AutoSpacingRules
} from '../session';
import { buildVietnameseGlyphs } from './glyphs';
import { STEP2_RECIPES, type ComponentRecipe } from '../viet/recipes';
import { PRECOMPOSED_BASE_MAP } from '../viet/compose';
import {
  invalidateGlyphIndexCache,
  calculateAutoSpacingAdjustments,
  applySpacingDelta
} from '../kerning/engine';

export interface PreviewInput {
  /** The pristine uploaded bytes. A scratch font is parsed from these. */
  rawFontBuffer: ArrayBuffer;
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  overrides: Record<string, GlyphOverrideState>;
  preserveExistingGlyphs: boolean;
  /** Omit to read outlines before spacing is applied. */
  spacingRules?: AutoSpacingRules;
}

export interface PreviewSession {
  font: opentype.Font;
  composedChars: Set<string>;
  /** Last inputs, kept so updatePreviewSession can diff against them. */
  input: PreviewInput;
  /** Pristine glyph of every recipe character, captured before the first build. */
  pristine: Map<string, { path: opentype.Path; advanceWidth: number } | null>;
  spacingMap: Record<string, number>;
  /** Characters whose outline is stale. Rebuilt on read, not on settings change. */
  dirty: Set<string>;
  stats: {
    /** Time spent in the last updatePreviewSession diff - not a rebuild cost. */
    lastUpdateMs: number;
    /** How many characters that update invalidated. */
    lastInvalidated: number;
    /** Time spent in the last on-demand rebuild triggered by a read. */
    lastRebuildMs: number;
    lastRebuiltChars: number;
    fullBuilds: number;
  };
}

export interface GlyphPreview {
  char: string;
  path: opentype.Path;
  advanceWidth: number;
  /** 'original' means the exporter keeps the font's own glyph for this character. */
  source: 'composed' | 'original';
}

// ============================================================================
// DEPENDENCY MAPS
// ============================================================================
//
// Built once at module load from the recipe tables, so a change to one control
// resolves to the handful of characters it can actually reach.

/** Diacritic template id -> characters whose recipe uses it. */
const TEMPLATE_TO_CHARS = new Map<string, Set<string>>();

/** Character -> characters composed on top of it (ê -> ế ề ể ễ ệ). */
const CHAR_DEPENDENTS = new Map<string, Set<string>>();

for (const recipe of STEP2_RECIPES as ComponentRecipe[]) {
  for (const component of recipe.components) {
    if (!TEMPLATE_TO_CHARS.has(component)) TEMPLATE_TO_CHARS.set(component, new Set());
    TEMPLATE_TO_CHARS.get(component)!.add(recipe.char);
  }
}

for (const [char, info] of Object.entries(PRECOMPOSED_BASE_MAP)) {
  const base = info.precomposedBaseChar;
  if (!CHAR_DEPENDENTS.has(base)) CHAR_DEPENDENTS.set(base, new Set());
  CHAR_DEPENDENTS.get(base)!.add(char);
}

/** Character -> the precomposed character it is built on top of (ế -> ê). */
const CHAR_ANCESTOR = new Map<string, string>();
for (const [char, info] of Object.entries(PRECOMPOSED_BASE_MAP)) {
  CHAR_ANCESTOR.set(char, info.precomposedBaseChar);
}

const ALL_RECIPE_CHARS = new Set((STEP2_RECIPES as ComponentRecipe[]).map(r => r.char));

function charsUsing(...templateIds: string[]): Set<string> {
  const out = new Set<string>();
  for (const id of templateIds) {
    for (const c of TEMPLATE_TO_CHARS.get(id) ?? []) out.add(c);
  }
  return out;
}

function charsWithTwoComponents(): Set<string> {
  const out = new Set<string>();
  for (const r of STEP2_RECIPES as ComponentRecipe[]) {
    if (r.components.length >= 2) out.add(r.char);
  }
  return out;
}

function charsByCase(upper: boolean): Set<string> {
  const out = new Set<string>();
  for (const r of STEP2_RECIPES as ComponentRecipe[]) {
    if (r.components.length === 0) continue;
    const b = r.baseChar;
    const isUpper = b === b.toUpperCase() && b !== b.toLowerCase();
    if (isUpper === upper) out.add(r.char);
  }
  return out;
}

/**
 * Which characters each auto-position rule can move.
 *
 * A rule missing from this table forces a full rebuild. That is the safe
 * default: adding a rule later costs performance until it is mapped here, never
 * correctness.
 */
const RULE_SCOPE: Record<string, () => Set<string>> = {
  hornScale: () => charsUsing('horn_o', 'horn_u', 'horn'),
  hornOffsetX: () => charsUsing('horn_o', 'horn_u', 'horn'),
  hornOffsetY: () => charsUsing('horn_o', 'horn_u', 'horn'),
  barScale: () => charsUsing('bar'),
  barOffsetX: () => charsUsing('bar'),
  barOffsetY: () => charsUsing('bar'),
  dotBelowGap: () => charsUsing('dot_below'),
  dotBelowScale: () => charsUsing('dot_below'),
  doubleAccentStyle: () => charsWithTwoComponents(),
  doubleAccentGap: () => charsWithTwoComponents(),
  doubleAccentCustomX: () => charsWithTwoComponents(),
  doubleAccentCustomY: () => charsWithTwoComponents(),
  lowercaseAccentGap: () => charsByCase(false),
  lowercaseAccentScale: () => charsByCase(false),
  uppercaseAccentGap: () => charsByCase(true),
  uppercaseAccentScale: () => charsByCase(true)
};

/** Expands a rebuild set to include everything composed on top of its members. */
function closeOverDependents(chars: Set<string>): Set<string> {
  const out = new Set(chars);
  const queue = [...chars];
  while (queue.length) {
    const c = queue.pop()!;
    for (const dep of CHAR_DEPENDENTS.get(c) ?? []) {
      if (!out.has(dep)) {
        out.add(dep);
        queue.push(dep);
      }
    }
  }
  return out;
}

// ============================================================================
// SESSION
// ============================================================================

/**
 * Runs everything the exporter does to glyphs, and nothing it does to tables.
 *
 * A full compile costs roughly 1.000 ms on a 1.100 glyph font, of which about
 * 530 ms is font.toArrayBuffer() and 290 ms the kern and GPOS builders. None of
 * that is needed to draw a canvas.
 *
 * Spacing is deliberately NOT baked into the session font. applySpacingDelta
 * translates the outline, so applying it twice would shift twice; keeping it as
 * a read-time transform means changing a spacing preset costs nothing and can
 * never accumulate.
 */
export function createPreviewSession(input: PreviewInput): PreviewSession {
  const t0 = Date.now();
  const font = opentype.parse(input.rawFontBuffer.slice(0));

  // Snapshot the untouched glyph of every recipe character. Partial rebuilds
  // restore from here, because the preserveExistingGlyphs check must see the
  // font's own outline and not the one a previous build wrote into that slot.
  const pristine = new Map<string, { path: opentype.Path; advanceWidth: number } | null>();
  for (const char of ALL_RECIPE_CHARS) {
    const idx = font.charToGlyphIndex(char);
    const g = idx > 0 ? font.glyphs.get(idx) : null;
    pristine.set(char, g ? { path: clonePath(g.path), advanceWidth: g.advanceWidth ?? 0 } : null);
  }

  const { composedChars } = buildVietnameseGlyphs(font, {
    templates: input.templates,
    rules: input.rules,
    overrides: input.overrides,
    preserveExistingGlyphs: input.preserveExistingGlyphs
  });
  invalidateGlyphIndexCache(font);

  const spacingMap = input.spacingRules
    ? calculateAutoSpacingAdjustments(font, input.spacingRules)
    : {};

  return {
    font,
    composedChars,
    input,
    pristine,
    spacingMap,
    dirty: new Set<string>(),
    stats: {
      lastUpdateMs: 0,
      lastInvalidated: 0,
      lastRebuildMs: Date.now() - t0,
      lastRebuiltChars: ALL_RECIPE_CHARS.size,
      fullBuilds: 1
    }
  };
}

/**
 * Applies changed settings to an existing session, rebuilding only the glyphs
 * the change can reach.
 *
 * Dragging the horn offset touches 24 characters, not 134. Editing one
 * character's override touches that character plus anything composed on top of
 * it. Changing a spacing preset touches no outline at all.
 *
 * Returns the current session - callers should use the return value, since a
 * font change produces a new object rather than mutating the old one.
 */
export function updatePreviewSession(session: PreviewSession, next: PreviewInput): PreviewSession {
  const t0 = Date.now();
  const prev = session.input;

  // A different font, or a changed preserve rule, invalidates everything.
  if (next.rawFontBuffer !== prev.rawFontBuffer ||
      next.preserveExistingGlyphs !== prev.preserveExistingGlyphs) {
    const fresh = createPreviewSession(next);
    fresh.stats.fullBuilds = session.stats.fullBuilds + 1;
    return fresh;
  }

  const affected = new Set<string>();
  let needsFull = false;

  const templateIds = new Set([...Object.keys(prev.templates), ...Object.keys(next.templates)]);
  for (const id of templateIds) {
    if (!shallowEqual(prev.templates[id], next.templates[id])) {
      for (const c of TEMPLATE_TO_CHARS.get(id) ?? []) affected.add(c);
    }
  }

  const ruleKeys = new Set([...Object.keys(prev.rules), ...Object.keys(next.rules)]);
  for (const key of ruleKeys) {
    if ((prev.rules as any)[key] === (next.rules as any)[key]) continue;
    const scope = RULE_SCOPE[key];
    if (!scope) { needsFull = true; break; }
    for (const c of scope()) affected.add(c);
  }

  if (!needsFull) {
    const chars = new Set([...Object.keys(prev.overrides), ...Object.keys(next.overrides)]);
    for (const c of chars) {
      if (!shallowEqual(prev.overrides[c], next.overrides[c])) affected.add(c);
    }
  }

  const invalidated = needsFull ? ALL_RECIPE_CHARS : closeOverDependents(affected);

  // Nothing is recomposed here. The characters are only marked stale, and the
  // work happens when something actually reads them. Dragging a slider while
  // looking at one glyph should not cost 24 boolean unions for glyphs that are
  // not on screen.
  for (const c of invalidated) session.dirty.add(c);

  session.spacingMap = next.spacingRules
    ? calculateAutoSpacingAdjustments(session.font, next.spacingRules)
    : {};

  session.input = next;
  session.stats.lastUpdateMs = Date.now() - t0;
  session.stats.lastInvalidated = invalidated.size;
  if (needsFull) session.stats.fullBuilds++;

  return session;
}

/**
 * Rebuilds the requested characters if they are stale, along with any character
 * they are composed on top of.
 *
 * Composition is order dependent - ế consults ê - so a stale ancestor has to be
 * rebuilt first. STEP2_RECIPES already lists base-with-accent characters before
 * the double-accent ones, so passing the whole chain to one build call gets the
 * order right.
 */
function ensureBuilt(session: PreviewSession, chars: string[]): void {
  if (session.dirty.size === 0) return;

  const needed = new Set<string>();
  for (const char of chars) {
    let c: string | undefined = char;
    while (c) {
      if (session.dirty.has(c)) needed.add(c);
      c = CHAR_ANCESTOR.get(c);
    }
  }
  if (needed.size === 0) return;

  const t0 = Date.now();
  for (const c of needed) restorePristine(session, c);

  const { composedChars } = buildVietnameseGlyphs(session.font, {
    templates: session.input.templates,
    rules: session.input.rules,
    overrides: session.input.overrides,
    preserveExistingGlyphs: session.input.preserveExistingGlyphs,
    onlyChars: needed
  });

  for (const c of needed) {
    session.composedChars.delete(c);
    session.dirty.delete(c);
  }
  for (const c of composedChars) session.composedChars.add(c);

  invalidateGlyphIndexCache(session.font);
  session.stats.lastRebuildMs = Date.now() - t0;
  session.stats.lastRebuiltChars = needed.size;
}

/** Forces every stale character to be rebuilt. Call before exporting a session. */
export function flushPreviewSession(session: PreviewSession): void {
  ensureBuilt(session, [...session.dirty]);
}

export function previewGlyph(session: PreviewSession, char: string): GlyphPreview | null {
  ensureBuilt(session, [char]);
  const glyph = lookupGlyph(session.font, char);
  if (!glyph) return null;

  let path = glyph.path;
  let advanceWidth = glyph.advanceWidth ?? 0;

  const delta = session.spacingMap[char];
  if (delta) {
    const holder: any = { path: clonePath(path), advanceWidth };
    applySpacingDelta(holder, delta);
    path = holder.path;
    advanceWidth = holder.advanceWidth;
  }

  return {
    char,
    path,
    advanceWidth,
    source: session.composedChars.has(char) ? 'composed' : 'original'
  };
}

export function previewGlyphs(session: PreviewSession, chars: string[]): GlyphPreview[] {
  // One batched rebuild for the whole grid rather than one per cell
  ensureBuilt(session, chars);
  const out: GlyphPreview[] = [];
  for (const char of chars) {
    const p = previewGlyph(session, char);
    if (p) out.push(p);
  }
  return out;
}

// ============================================================================
// HELPERS
// ============================================================================

function restorePristine(session: PreviewSession, char: string): void {
  const snapshot = session.pristine.get(char);
  const glyph = lookupGlyph(session.font, char);
  if (!glyph) return;

  if (snapshot) {
    glyph.path = clonePath(snapshot.path);
    glyph.advanceWidth = snapshot.advanceWidth;
  } else {
    // The character had no glyph in the original font; blank the slot so the
    // preserve check treats it as absent, exactly as a fresh build would.
    glyph.path = new opentype.Path();
  }
}

// charToGlyphIndex reads the cmap parsed from the original file, so glyphs this
// pass appended are invisible to it.
function lookupGlyph(font: any, char: string): any | null {
  const idx = font.charToGlyphIndex(char);
  if (idx > 0) return font.glyphs.get(idx);

  const code = char.codePointAt(0);
  for (let i = font.glyphs.length - 1; i >= 0; i--) {
    const g = font.glyphs.get(i);
    if (!g) continue;
    if (g.name === char || g.unicode === code) return g;
  }
  return null;
}

function clonePath(src: any): opentype.Path {
  const p = new opentype.Path();
  p.commands = (src?.commands ?? []).map((c: any) => ({ ...c }));
  return p;
}

function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}
