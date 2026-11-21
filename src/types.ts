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

  // Stroke weight controls (font units). keepWeight: Scale X/Y and the case scale change the size of
  // the mark but not its stroke weight. strokeOffset: push the outline out (+) or in (-).
  keepWeight?: boolean;
  strokeOffset?: number;
  capKeepWeight?: boolean;
  capStrokeOffset?: number;
}

/** One cell of the double-accent rule table: where a tone mark sits on a circumflex or breve. */
export interface StackRule {
  pos: 'top' | 'side' | 'nest'; // above the mark / beside it / inside the breve cup
  anchor: 'center' | 'foot';    // align the tone's box centre, or its lowest point (the foot of á à)
  dx: number;                   // horizontal shift, % of the circumflex/breve width
  gap: number;                  // pos 'top': gap above the mark, in tone stroke weights
  rise: number;                 // pos 'side' | 'nest': foot height, % of the circumflex/breve height
  scale: number;                // tone size, %
}

export type StackTone = 'acute' | 'grave' | 'hook' | 'tilde';
export type StackMod = 'circumflex' | 'breve';
export type StackRuleSet = Record<StackMod, Record<StackTone, StackRule>>;

export interface StackMatrix {
  preset: 'stack' | 'right' | 'both' | 'custom';
  lower: StackRuleSet;
  upper: StackRuleSet;
  capsSeparate: boolean;  // false: capitals use the lowercase table
  autoClear: boolean;     // lift the tone until it clears the mark by minClear
  minClear: number;       // in tone stroke weights
  squeezeLowerMod: number; // % height of circumflex/breve in double accents (lowercase)
  squeezeUpperMod: number; // same for capitals
  squeezeTone: number;     // % height of the tone in double accents
  keepWeight: boolean;     // give squeezed marks back their stroke weight
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
  stackMatrix?: StackMatrix;  // double accents: one rule per circumflex/breve x tone pair
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

  // Custom double accent settings for this specific character
  // "Chỉnh riêng cho ký tự này" in the double-accent tab: nudge the tone of this letter on top of the rule table
  hasCustomDoubleAccent?: boolean;
  doubleAccentCustomX?: number;
  doubleAccentCustomY?: number;
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

export type GlyphEditMode = 'replace' | 'old_is_alt' | 'new_is_alt';

export interface CustomGlyphDesign {
  char: string;
  unicode?: number;
  glyphName?: string;
  svgPath: string;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  advanceWidth?: number;
  flipX?: boolean;
  flipY?: boolean;
  mode: GlyphEditMode;
  updatedAt?: string;
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
  regenerateChars?: string[]; // letters the font has that are rebuilt even though "keep" is on
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  overrides: Record<string, GlyphOverrideState>;
  spacingRules?: AutoSpacingRules;
  kerningSettings?: AutoKerningSettings;
  customGlyphDesigns?: Record<string, CustomGlyphDesign>;
  skipVietnamize?: boolean;
  saveSessionEnabled?: boolean;
  // true once the user has opened Kerning tàu nhanh; until then export never generates kerning/spacing
  autoKerningActive?: boolean;
  autoSpacingActive?: boolean;
  kerningToolVisited?: boolean;
  // 1000: mark templates are in a 1000-unit space and drawn at the font's UPM. Missing in files
  // saved before that change, whose template sizes were tuned in raw font units.
  templateUnits?: number;
}
