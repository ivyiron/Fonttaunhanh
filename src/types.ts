export interface ManualKerningPair {
  companion: string;
  isCompanionLeft: boolean;
  value: number;
}

export interface GlyphEditState {
  char: string;          // e.g., 'â'
  baseChar: string;      // e.g., 'a'
  unicode: number;       // e.g., 226
  svgPath: string;       // Raw path data 'd'
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  flipY: boolean;
  advanceWidth: number;
  useSmartKerning: boolean;
  manualKerning?: ManualKerningPair[];
  isCompleted: boolean;
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
