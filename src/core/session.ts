import * as opentype from 'opentype.js';

// ============================================================================
// FONT SESSION
// ============================================================================
//
// One font is loaded once, into one session, and all three tools read from it.
// Nothing in core/ imports React, so the same code runs in a worker and in Node
// tests. This is the boundary that stops the two utils.ts files from drifting
// apart again.

export interface FontMetrics {
  unitsPerEm: number;
  ascender: number;
  descender: number;
  capHeight: number;
  xHeight: number;
  /** Measured stem width of H/I at half x-height, in font units. */
  stemWidth: number;
  /** Thick/thin ratio measured on O. 1.0 = monoline. */
  contrast: number;
  /** Stress axis of O in degrees off vertical. */
  stressAngle: number;
  italicAngle: number;
}

export interface FontMeta {
  filename: string;
  family: string;
  subfamily: string;
  totalGlyphs: number;
  hasGpos: boolean;
  hasGsub: boolean;
  /** Codepoints in the Vietnamese set the original font already covered. */
  vietnameseCoverage: number;
}

export interface FontSession {
  /** Untouched bytes of the uploaded file. Never mutated - the source of truth. */
  rawBuffer: ArrayBuffer;
  /** Parsed pristine font. Treated as read-only; edits live in EditSet. */
  font: opentype.Font;
  metrics: FontMetrics;
  meta: FontMeta;
}

// ============================================================================
// EDIT MODEL
// ============================================================================
//
// Tools never mutate the font. They produce edits, and compileFont() applies
// them. Three consequences worth the discipline:
//   - undo/redo is a stack of EditSets, not a font clone
//   - a project file is JSON.stringify(EditSet), which is what .ftn already is
//   - the three tools can be used in one session because their edits merge

/** An outline supplied wholesale - the Sửa font tool, or a pasted SVG. */
export interface OutlineEdit {
  kind: 'outline';
  /** Target glyph. Index for replace, undefined when creating a new glyph. */
  targetGlyphIndex?: number;
  /** Codepoint the result should map to. */
  unicode: number;
  glyphName: string;
  svgPath: string;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  flipY: boolean;
  advanceWidth: number;
  /** 'replace' overwrites the glyph, 'alt' appends a new one (PUA codepoint). */
  mode: 'replace' | 'alt';
}

/** A glyph assembled from a base letter plus diacritic components - Việt hóa. */
export interface ComposeEdit {
  kind: 'compose';
  unicode: number;
  glyphName: string;
  recipeId: string;
  /** Per-component placement overrides on top of the auto-position result. */
  overrides: Record<string, ComponentPlacement>;
}

export interface ComponentPlacement {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  /** Custom outline replacing the template for this component only. */
  svgPath?: string;
}

/** Kerning and spacing - the Kerning tool, plus inheritance for new glyphs. */
export interface SpacingEdit {
  kind: 'spacing';
  /** Explicit pair overrides, keyed "leftGlyphIndex,rightGlyphIndex". */
  pairs: Record<string, number>;
  /** Per-glyph advance/sidebearing delta, keyed by codepoint. */
  glyphDeltas: Record<number, number>;
  /**
   * How far the tool is allowed to depart from the font's own kerning.
   *   0 inherit   - original GPOS untouched, new glyphs get nothing
   *   1 extend    - clone base-letter kerning onto new glyphs; no original pair changed
   *   2 repair    - additionally fix pairs measured as colliding
   *   3 rebuild   - regenerate the whole table, overwriting the original
   * Default is 1. Level 3 is the only one that overwrites the designer's work.
   */
  intervention: 0 | 1 | 2 | 3;
}

export type Edit = OutlineEdit | ComposeEdit | SpacingEdit;

export interface EditSet {
  /** Keyed by a stable id so tools can update one edit without touching others. */
  edits: Record<string, Edit>;
  /** Which tool authored each edit, for the intervention report and for undo. */
  origin: Record<string, ToolId>;
}

export type ToolId = 'viethoa' | 'editor' | 'kerning';

// ============================================================================
// INTERVENTION REPORT
// ============================================================================
//
// What the status line under the canvas shows. Turns "respect the original
// font" from a promise into four numbers the user can watch.

export interface InterventionReport {
  originalPairsKept: number;
  pairsAddedForNewGlyphs: number;
  originalPairsOverwritten: number;
  glyphsWithChangedAdvance: number;
  glyphsReplaced: number;
  glyphsAdded: number;
}

export const emptyEditSet = (): EditSet => ({ edits: {}, origin: {} });

// ============================================================================
// GLYPH INVENTORY (from the Sửa font tool)
// ============================================================================

export type GlyphCategory =
  | 'all' | 'latin' | 'digits' | 'punctuation'
  | 'symbols' | 'extended' | 'other' | 'modified';

export interface FontGlyphItem {
  index: number;
  name: string;
  unicode?: number;
  unicodes: number[];
  char: string;
  advanceWidth: number;
  svgPath: string;
  category: GlyphCategory;
}

// ============================================================================
// DIACRITIC TEMPLATES, RULES AND OVERRIDES (from Việt hóa src/types.ts)
// ============================================================================

export interface ManualKerningPair {
  companion: string;
  isCompanionLeft: boolean;
  value: number;
}

export interface DiacriticTemplate {
  id: string;          // 'acute' | 'grave' | 'hook' | 'tilde' | 'dot_below' | 'circumflex' | 'breve' | 'horn' | 'bar'
  name: string;        // e.g., 'Dấu sắc (Acute)'
  svgPath: string;     // Raw SVG path data
  scaleX: number;      // scale factor
  scaleY: number;
  offsetX: number;     // manual shift
  offsetY: number;
  autoCenterX?: boolean; // toggle auto horizontal center aligning
  
  // Optional uppercase-specific variant settings
  hasCapVariant?: boolean;
  capSvgPath?: string;
  capScaleX?: number;
  capScaleY?: number;
  capOffsetX?: number;
  capOffsetY?: number;
  capAutoCenterX?: boolean;
}

export interface AutoPositionRules {
  useGroupHeightAlignment?: boolean; // Align diacritic Y heights by vowel group (x-Height / Cap-Height / Baseline) for 100% consistent accent lines (default: true)
  lowercaseAccentGap: number;  // Distance above lowercase letter top (default: 45)
  uppercaseAccentGap: number;  // Distance above uppercase letter top (default: 55)
  lowercaseAccentScale: number; // Scale factor for accents on lowercase (default: 0.8)
  uppercaseAccentScale: number; // Scale factor for accents on uppercase (default: 1.0)
  dotBelowGap: number;          // Distance below baseline/bottom (default: 60)
  dotBelowScale: number;        // Scale of dot below (default: 0.8)
  hornScale: number;            // Scale of horn for ư/ơ (default: 0.85)
  hornOffsetX: number;          // Horizontal tweak for horn (default: 0)
  hornOffsetY: number;          // Vertical tweak for horn (default: 0)
  barScale: number;             // Scale of bar for đ/Đ (default: 1.0)
  barOffsetX: number;           // Horizontal tweak for bar (default: 0)
  barOffsetY: number;           // Vertical tweak for bar (default: 0)
  doubleAccentStyle: 'stacked' | 'side' | 'custom'; // 'stacked' (vertical stack), 'side' (angled offset), or 'custom' (custom relative X,Y)
  doubleAccentGap: number;      // Distance between circumflex/breve and accent above (default: 20)
  doubleAccentCustomX?: number; // Custom relative X offset for double accents (default: 0)
  doubleAccentCustomY?: number; // Custom relative Y offset for double accents (default: 0)
}

export interface GlyphOverrideState {
  char: string;
  offsetX: number;      // Extra offset on top of auto-position
  offsetY: number;
  scaleX: number;
  scaleY: number;
  advanceWidthTweak: number; // Add/subtract advance width (default: 0)
  isCompleted: boolean; // Marked as reviewed/approved
  comp1OffsetX?: number; // Extra horizontal offset for first component of composite accent
  comp1OffsetY?: number; // Extra vertical offset for first component of composite accent
  comp2OffsetX?: number; // Extra horizontal offset for second component of composite accent
  comp2OffsetY?: number; // Extra vertical offset for second component of composite accent
}

export interface FontMetadata {
  name: string;
  family: string;
  subfamily: string;
  unitsPerEm: number;
  ascender: number;
  descender: number;
  capHeight: number;
  xHeight: number;
  totalGlyphs: number;
}

export interface AutoSpacingRules {
  spacingPreset: 'compact' | 'normal' | 'spacious' | 'custom';
  globalTrackingOffset: number; // e.g., 0
  curveTighteningPercent: number; // e.g., 15 (%)
  applyToLatin: boolean;
  applyToVietnamese: boolean;
  applyToNumbers: boolean;
  applyToPunctuation: boolean;
}

export interface AutoKerningSettings {
  intensityMultiplier: number; // e.g. 1.0 (100%)
  minThreshold: number; // e.g. 10 font units
  applyClassics: boolean;
  applyUpperLower: boolean;
  applyPunctuation: boolean;
  applyNumbers: boolean;
  applyVietnameseVariants: boolean;
  customPairs: Record<string, number>; // "char1,char2": val
}

export interface VietnameseProjectFile {
  ftnVersion: string;
  appName: string;
  savedAt: string;
  filename: string;
  fontMetadata: FontMetadata;
  rawFontBufferBase64: string;
  customFamilyName?: string;
  customSubfamilyName?: string;
  preserveExistingGlyphs?: boolean;
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  overrides: Record<string, GlyphOverrideState>;
  spacingRules?: AutoSpacingRules;
  kerningSettings?: AutoKerningSettings;
}

// ============================================================================
// GLYPH EDIT STATE (from the Sửa font tool)
// ============================================================================

export type EditMode = 'replace' | 'alt';
export type CompareMode = 'overlay' | 'side_by_side' | 'toggle';

export interface GlyphEditState {
  id: string;
  originalGlyphIndex: number;
  originalName: string;
  originalUnicode?: number;
  originalChar: string;
  originalPath: string;
  originalAdvanceWidth: number;

  mode: EditMode;
  altName: string;
  altUnicode: number;

  svgPath: string;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  flipY: boolean;
  advanceWidth: number;

  inheritKerning: boolean;
  trackingOffset: number;
  isCompleted: boolean;
  isModified: boolean;
}
