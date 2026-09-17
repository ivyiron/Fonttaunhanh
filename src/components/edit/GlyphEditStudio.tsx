import React, { useState } from 'react';
import * as opentype from 'opentype.js';
import { CustomGlyphDesign, FontMetadata } from '../../types';
import { GlyphEditLeftPanel } from './GlyphEditLeftPanel';
import { GlyphEditCanvas } from './GlyphEditCanvas';
import { GlyphEditRightPanel } from './GlyphEditRightPanel';
import { ResizableDivider } from '../ResizableDivider';

interface GlyphEditStudioProps {
  font: opentype.Font | null;
  rawFontBuffer: ArrayBuffer | null;
  compiledBuffer: ArrayBuffer | null;
  fontMetadata: FontMetadata | null;
  customDesigns: Record<string, CustomGlyphDesign>;
  onUpdateCustomDesign: (key: string, updates: Partial<CustomGlyphDesign>) => void;
  onResetCustomDesign: (key: string) => void;
  onCompileFont: () => void;
  compiling: boolean;
}

export const GlyphEditStudio: React.FC<GlyphEditStudioProps> = ({
  font,
  rawFontBuffer,
  compiledBuffer,
  fontMetadata,
  customDesigns,
  onUpdateCustomDesign,
  onResetCustomDesign,
  onCompileFont,
  compiling
}) => {
  // Resizable panel widths
  const [leftWidth, setLeftWidth] = useState<number>(440);
  const [rightWidth, setRightWidth] = useState<number>(440);

  // Selected glyph key (character or glyph name, e.g. 'A')
  const [selectedGlyphKey, setSelectedGlyphKey] = useState<string>('A');

  const handleLeftResize = (delta: number) => {
    setLeftWidth((prev) => Math.min(520, Math.max(340, prev + delta)));
  };

  const handleRightResize = (delta: number) => {
    setRightWidth((prev) => Math.min(540, Math.max(380, prev - delta)));
  };

  const activeDesign = customDesigns[selectedGlyphKey] || null;

  return (
    <div className="flex-1 flex overflow-hidden min-h-0 bg-neutral-100">
      {/* 1. Left Panel: Glyphs List & Filter */}
      <div
        style={{ width: `${leftWidth}px` }}
        className="shrink-0 flex flex-col h-full overflow-hidden"
      >
        <GlyphEditLeftPanel
          font={font}
          fontBuffer={compiledBuffer || rawFontBuffer}
          selectedGlyphKey={selectedGlyphKey}
          onSelectGlyphKey={setSelectedGlyphKey}
          customDesigns={customDesigns}
        />
      </div>

      {/* Left Resizable Divider */}
      <ResizableDivider
        direction="horizontal"
        onResize={handleLeftResize}
      />

      {/* 2. Middle Panel: Interactive Canvas with Guideline System & Overlay Comparison */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-white p-2.5 shadow-xs">
        <GlyphEditCanvas
          font={font}
          fontMetadata={fontMetadata}
          selectedGlyphKey={selectedGlyphKey}
          customDesign={activeDesign}
          onUpdateDesign={(updates) => onUpdateCustomDesign(selectedGlyphKey, updates)}
          onResetDesign={() => onResetCustomDesign(selectedGlyphKey)}
        />
      </div>

      {/* Right Resizable Divider */}
      <ResizableDivider
        direction="horizontal"
        onResize={handleRightResize}
      />

      {/* 3. Right Panel: Vector SVG Input, Transform & Replacement Modes */}
      <div
        style={{ width: `${rightWidth}px` }}
        className="shrink-0 flex flex-col h-full overflow-hidden"
      >
        <GlyphEditRightPanel
          font={font}
          fontMetadata={fontMetadata}
          selectedGlyphKey={selectedGlyphKey}
          customDesign={activeDesign}
          onUpdateDesign={(updates) => onUpdateCustomDesign(selectedGlyphKey, updates)}
          onResetDesign={() => onResetCustomDesign(selectedGlyphKey)}
          onApplyAndCompile={onCompileFont}
          compiling={compiling}
        />
      </div>
    </div>
  );
};
