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

  // Uppercase double accent customizations
  doubleAccentCapCustomEnabled?: boolean; // Bật chỉnh riêng thông số cho chữ Hoa
  doubleAccentCapCustomX?: number;        // Vị trí X riêng cho dấu 2 tầng chữ Hoa (default: 0)
  doubleAccentCapCustomY?: number;        // Vị trí Y (Gap) riêng cho dấu 2 tầng chữ Hoa (default: 20)
  doubleAccentCapCompressY?: number;      // Nén dấu chữ HOA (mặc định: 100%, min: 10%)
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
  hasCustomDoubleAccent?: boolean;
  doubleAccentStyle?: 'stacked' | 'side' | 'custom';
  doubleAccentGap?: number;
  doubleAccentCustomX?: number;
  doubleAccentCustomY?: number;
  doubleAccentCapCustomEnabled?: boolean;
  doubleAccentCapCustomX?: number;
  doubleAccentCapCustomY?: number;
  doubleAccentCapCompressY?: number;
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
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  overrides: Record<string, GlyphOverrideState>;
  spacingRules?: AutoSpacingRules;
  kerningSettings?: AutoKerningSettings;
  customGlyphDesigns?: Record<string, CustomGlyphDesign>;
  skipVietnamize?: boolean;
  saveSessionEnabled?: boolean;
}
