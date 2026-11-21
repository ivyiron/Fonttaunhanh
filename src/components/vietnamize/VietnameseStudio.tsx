import React, { useMemo, useState } from 'react';
import * as opentype from 'opentype.js';
import { DiacriticTemplate, AutoPositionRules, GlyphOverrideState, FontMetadata } from '../../types';
import { VietnameseLeftPanel, VietnamizeSubTab } from './VietnameseLeftPanel';
import { DiacriticCanvas } from './DiacriticCanvas';
import { DoubleAccentCanvas } from './DoubleAccentCanvas';
import { GlyphInspectorCanvas } from './GlyphInspectorCanvas';
import { DiacriticProperties } from './DiacriticProperties';
import { DoubleAccentProperties } from './DoubleAccentProperties';
import { GlyphProperties } from './GlyphProperties';
import { FontDiacriticsLibraryModal } from './FontDiacriticsLibraryModal';
import { ResizableDivider } from '../ResizableDivider';
import { StackGroupCanvas } from './StackGroupCanvas';
import { getStackCell, VIETNAMESE_RECIPES } from '../../utils';

interface VietnameseStudioProps {
  font: opentype.Font | null;
  fontMetadata: FontMetadata | null;
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  overrides: Record<string, GlyphOverrideState>;
  preserveExistingGlyphs: boolean;
  regenerateChars: string[];
  onSetRegenerateChars: (chars: string[]) => void;
  existingGlyphInfo: { count: number; total: number; samples: string[] };
  onTogglePreserveExisting: (val: boolean) => void;
  onUpdateTemplate: (id: string, updates: Partial<DiacriticTemplate>) => void;
  onUpdateRules: (updates: Partial<AutoPositionRules>) => void;
  onUpdateOverride: (char: string, updates: Partial<GlyphOverrideState>) => void;
  onResetOverride: (char: string) => void;
  onBatchApproveOverrides: () => void;
}

export const VietnameseStudio: React.FC<VietnameseStudioProps> = ({
  font,
  fontMetadata,
  templates,
  rules,
  overrides,
  preserveExistingGlyphs,
  regenerateChars,
  onSetRegenerateChars,
  existingGlyphInfo,
  onTogglePreserveExisting,
  onUpdateTemplate,
  onUpdateRules,
  onUpdateOverride,
  onResetOverride,
  onBatchApproveOverrides
}) => {
  // Navigation sub-tab state for left panel
  const [activeSubTab, setActiveSubTab] = useState<VietnamizeSubTab>('diacritics');

  // Sub-tab 1 active selection
  const [activeDiaId, setActiveDiaId] = useState<string>('acute');
  const [showLibraryModal, setShowLibraryModal] = useState<boolean>(false);
  const [isCapitalPreview, setIsCapitalPreview] = useState<boolean>(false);

  // Sub-tab 2 active selection (default: 'ấ')
  const [selectedDoubleChar, setSelectedDoubleChar] = useState<string>('ấ');
  // a rule-table cell shows its whole group (â ê ô + Â Ê Ô); a letter from the list shows that letter
  const [doubleView, setDoubleView] = useState<'group' | 'single'>('group');
  const selectStackCell = (char: string) => {
    setSelectedDoubleChar(char);
    setDoubleView('group');
  };
  const selectDoubleLetter = (char: string) => {
    setSelectedDoubleChar(char);
    setDoubleView('single');
  };
  const ruleTableCell = getStackCell(selectedDoubleChar);

  // Vietnamese letters the font already draws, and which of them are kept as drawn
  const nativeChars = useMemo(() => {
    if (!font) return [] as string[];
    return VIETNAMESE_RECIPES.filter((r) => {
      if (r.components.length === 0) return false;
      const idx = font.charToGlyphIndex(r.char);
      if (idx <= 0) return false;
      const g = font.glyphs.get(idx);
      return !!(g && g.path && g.path.commands && g.path.commands.length > 0);
    }).map((r) => r.char);
  }, [font]);
  const keptChars = useMemo(() => {
    if (!preserveExistingGlyphs) return new Set<string>();
    const regen = new Set(regenerateChars);
    return new Set(nativeChars.filter((c) => !regen.has(c)));
  }, [nativeChars, regenerateChars, preserveExistingGlyphs]);
  const setKeepChar = (char: string, keep: boolean) => {
    const next = new Set(regenerateChars);
    if (keep) next.delete(char);
    else next.add(char);
    onSetRegenerateChars(nativeChars.filter((c) => next.has(c)));
  };

  // Sub-tab 3 active selection (default: 'á')
  const [selectedGlyphChar, setSelectedGlyphChar] = useState<string>('á');

  // Panel widths (resizable)
  const [leftWidth, setLeftWidth] = useState<number>(400);
  const [rightWidth, setRightWidth] = useState<number>(500);

  const handleLeftResize = (delta: number) => {
    setLeftWidth((prev) => Math.min(500, Math.max(300, prev + delta)));
  };

  const handleRightResize = (delta: number) => {
    setRightWidth((prev) => Math.min(650, Math.max(450, prev - delta)));
  };

  const activeTemplate = templates[activeDiaId] || {
    id: activeDiaId,
    name: activeDiaId,
    svgPath: '',
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col lg:flex-row overflow-hidden bg-neutral-100 min-h-0">
      {/* 1. LEFT PANEL: 3 Sub-tabs ("Thanh dấu" / "Dấu Kép" / "Ký tự") */}
      <div
        style={{ width: `${leftWidth}px` }}
        className="hidden lg:flex flex-col shrink-0 bg-white border-r border-neutral-200 p-2.5 shadow-xs overflow-hidden"
      >
        <VietnameseLeftPanel
          font={font}
          keptChars={keptChars}
          regeneratedChars={preserveExistingGlyphs ? regenerateChars : []}
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
          activeDiaId={activeDiaId}
          setActiveDiaId={setActiveDiaId}
          templates={templates}
          onOpenLibraryModal={() => setShowLibraryModal(true)}
          rules={rules}
          onUpdateRules={onUpdateRules}
          selectedDoubleChar={selectedDoubleChar}
          setSelectedDoubleChar={selectDoubleLetter}
          onSelectStackCell={selectStackCell}
          doubleView={doubleView}
          selectedGlyphChar={selectedGlyphChar}
          setSelectedGlyphChar={setSelectedGlyphChar}
          overrides={overrides}
          onBatchApproveOverrides={onBatchApproveOverrides}
        />
      </div>

      {/* Mobile left-panel fallback */}
      <div className="lg:hidden bg-white border-b border-neutral-200 p-2.5 shrink-0 max-h-72 overflow-y-auto">
        <VietnameseLeftPanel
          font={font}
          keptChars={keptChars}
          regeneratedChars={preserveExistingGlyphs ? regenerateChars : []}
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
          activeDiaId={activeDiaId}
          setActiveDiaId={setActiveDiaId}
          templates={templates}
          onOpenLibraryModal={() => setShowLibraryModal(true)}
          rules={rules}
          onUpdateRules={onUpdateRules}
          selectedDoubleChar={selectedDoubleChar}
          setSelectedDoubleChar={selectDoubleLetter}
          onSelectStackCell={selectStackCell}
          doubleView={doubleView}
          selectedGlyphChar={selectedGlyphChar}
          setSelectedGlyphChar={setSelectedGlyphChar}
          overrides={overrides}
          onBatchApproveOverrides={onBatchApproveOverrides}
        />
      </div>

      {/* Left Resizer */}
      <ResizableDivider
        direction="horizontal"
        onResize={handleLeftResize}
        className="hidden lg:flex"
      />

      {/* 2. MIDDLE PANEL: Context-aware Vector Stage Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-white p-2.5 shadow-xs overflow-hidden">
        {activeSubTab === 'diacritics' && (
          <DiacriticCanvas
            font={font}
            fontMetadata={fontMetadata}
            templates={templates}
            rules={rules}
            activeDiaId={activeDiaId}
            isCapital={isCapitalPreview}
            onToggleCapital={setIsCapitalPreview}
          />
        )}

        {activeSubTab === 'double_accents' && ruleTableCell && doubleView === 'group' && (
          <StackGroupCanvas
            font={font}
            fontMetadata={fontMetadata}
            templates={templates}
            rules={rules}
            overrides={overrides}
            selectedChar={selectedDoubleChar}
          />
        )}

        {activeSubTab === 'double_accents' && !(ruleTableCell && doubleView === 'group') && (
          <DoubleAccentCanvas
            font={font}
            fontMetadata={fontMetadata}
            templates={templates}
            rules={rules}
            selectedChar={selectedDoubleChar}
            override={overrides[selectedDoubleChar]}
          />
        )}

        {activeSubTab === 'glyphs' && (
          <GlyphInspectorCanvas
            font={font}
            fontMetadata={fontMetadata}
            templates={templates}
            rules={rules}
            overrides={overrides}
            selectedChar={selectedGlyphChar}
            isKeptNative={keptChars.has(selectedGlyphChar)}
          />
        )}
      </div>

      {/* Right Resizer */}
      <ResizableDivider
        direction="horizontal"
        onResize={handleRightResize}
        className="hidden lg:flex"
      />

      {/* 3. RIGHT PANEL: Context-aware Properties with Vietnamese Font Status & Preserve Option */}
      <div
        style={{ width: `${rightWidth}px` }}
        className="w-full lg:w-auto flex flex-col shrink-0 bg-white border-l border-neutral-200 p-2 shadow-xs overflow-y-auto h-full min-h-0 custom-scrollbar"
      >
        {activeSubTab === 'diacritics' && (
          <DiacriticProperties
            font={font}
            activeDiaId={activeDiaId}
            template={activeTemplate}
            rules={rules}
            onUpdateTemplate={onUpdateTemplate}
            onUpdateRules={onUpdateRules}
            onOpenLibraryModal={() => setShowLibraryModal(true)}
            isCapitalEditing={isCapitalPreview}
            onToggleCapitalEditing={setIsCapitalPreview}
            existingGlyphInfo={existingGlyphInfo}
            preserveExistingGlyphs={preserveExistingGlyphs}
            onTogglePreserveExisting={onTogglePreserveExisting}
            nativeChars={nativeChars}
            regenerateChars={regenerateChars}
            onSetRegenerateChars={onSetRegenerateChars}
          />
        )}

        {activeSubTab === 'double_accents' && (
          <DoubleAccentProperties
            font={font}
            templates={templates}
            onSelectChar={selectStackCell}
            doubleView={ruleTableCell && doubleView === 'group' ? 'group' : 'single'}
            rules={rules}
            onUpdateRules={onUpdateRules}
            selectedChar={selectedDoubleChar}
            override={overrides[selectedDoubleChar]}
            onUpdateOverride={onUpdateOverride}
            onResetOverride={onResetOverride}
          />
        )}

        {activeSubTab === 'glyphs' && (
          <GlyphProperties
            font={font}
            selectedChar={selectedGlyphChar}
            isNative={preserveExistingGlyphs && nativeChars.includes(selectedGlyphChar)}
            isKept={keptChars.has(selectedGlyphChar)}
            onSetKept={(keep: boolean) => setKeepChar(selectedGlyphChar, keep)}
            override={overrides[selectedGlyphChar]}
            onUpdateOverride={onUpdateOverride}
            onResetOverride={onResetOverride}
          />
        )}
      </div>

      {/* Font Diacritics Library Modal */}
      {font && (
        <FontDiacriticsLibraryModal
          isOpen={showLibraryModal}
          onClose={() => setShowLibraryModal(false)}
          font={font}
          templates={templates}
          onApplySvgToTemplate={(diaId, svgPath) => {
            onUpdateTemplate(diaId, { svgPath });
            setShowLibraryModal(false);
          }}
        />
      )}
    </div>
  );
};
