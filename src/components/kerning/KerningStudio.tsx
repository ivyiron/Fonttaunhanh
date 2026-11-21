import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import * as opentype from 'opentype.js';
import { AutoSpacingRules, AutoKerningSettings, FontMetadata } from '../../types';
import {
  generateFullFontKerningPairs,
  getCharacterFamilyGroup,
  GeneratedKerningPair
} from '../../utils/kerningEngine';
import { KerningPairsLeftPanel, KerningPairFilter } from './KerningPairsLeftPanel';
import { KerningLiveViewMiddle } from './KerningLiveViewMiddle';
import { KerningSettingsRightPanel } from './KerningSettingsRightPanel';
import { ResizableDivider } from '../ResizableDivider';

interface KerningStudioProps {
  font: opentype.Font | null;
  rawFontBuffer: ArrayBuffer | null;
  compiledBuffer: ArrayBuffer | null;
  fontMetadata: FontMetadata | null;
  spacingRules: AutoSpacingRules;
  kerningSettings: AutoKerningSettings;
  onUpdateSpacingRules: (rules: Partial<AutoSpacingRules>) => void;
  onUpdateKerningSettings: (settings: Partial<AutoKerningSettings>) => void;
  onCompileFont: () => void;
  compiling: boolean;
  autoSpacingActive: boolean;
  autoKerningActive: boolean;
  onSetAutoSpacingActive: (on: boolean) => void;
  onSetAutoKerningActive: (on: boolean) => void;
}

export const KerningStudio: React.FC<KerningStudioProps> = ({
  font,
  rawFontBuffer,
  compiledBuffer,
  fontMetadata,
  spacingRules,
  kerningSettings,
  onUpdateSpacingRules,
  onUpdateKerningSettings,
  onCompileFont,
  compiling,
  autoSpacingActive,
  autoKerningActive,
  onSetAutoSpacingActive,
  onSetAutoKerningActive
}) => {
  // Panel resizing widths
  const [leftWidth, setLeftWidth] = useState<number>(470);
  const [rightWidth, setRightWidth] = useState<number>(420);

  const handleLeftResize = (delta: number) => {
    setLeftWidth((prev) => Math.min(500, Math.max(460, prev + delta)));
  };

  const handleRightResize = (delta: number) => {
    setRightWidth((prev) => Math.min(500, Math.max(400, prev - delta)));
  };

  // State for Kerning Pairs
  const [selectedCategory, setSelectedCategory] = useState<KerningPairFilter>('all');
  const [selectedPairKey, setSelectedPairKey] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [smartGroupEdit, setSmartGroupEdit] = useState<boolean>(true);

  // Custom Pair Input Form State
  const [newCharLeft, setNewCharLeft] = useState<string>('');
  const [newCharRight, setNewCharRight] = useState<string>('');
  const [newValue, setNewValue] = useState<number>(-40);

  // Live comparison sample text & font size
  const [sampleText, setSampleText] = useState<string>(
    'Tự động quét toàn bộ ký tự trong font, tính toán khoảng cách quang học và tự động tạo Kerning cho tất cả cụm chữ kinh điển & tiếng Việt.\n\nAVATAR WAVE TAXI TYPOGRAPHY WALTZ YOUTH — Việt Nam Thịnh Vượng • Tình Yêu & Trí Tuệ • (012) 345-6789 [1/2] 90%'
  );
  const [fontSize, setFontSize] = useState<number>(36);

  // Register raw original font face for Box 1 comparison
  const [originalFamilyName, setOriginalFamilyName] = useState<string | null>(null);
  const [originalRegistered, setOriginalRegistered] = useState<boolean>(false);

  useEffect(() => {
    if (!rawFontBuffer) {
      setOriginalRegistered(false);
      return;
    }

    let isMounted = true;
    const registerOriginal = async () => {
      try {
        const uniqueName = `OriginalFont_Preview_${Date.now()}`;
        const fontFace = new FontFace(uniqueName, rawFontBuffer);
        const loadedFace = await fontFace.load();

        if (!isMounted) return;

        const toRemove: FontFace[] = [];
        document.fonts.forEach((face) => {
          if (face.family.startsWith('OriginalFont_Preview_')) {
            toRemove.push(face);
          }
        });
        toRemove.forEach((face) => document.fonts.delete(face));

        document.fonts.add(loadedFace);
        setOriginalFamilyName(uniqueName);
        setOriginalRegistered(true);
      } catch (err) {
        console.warn('Error registering original preview font:', err);
        if (isMounted) setOriginalRegistered(false);
      }
    };

    registerOriginal();
    return () => {
      isMounted = false;
    };
  }, [rawFontBuffer]);

  // Register compiled font face for Box 2 comparison
  const [compiledFamilyName, setCompiledFamilyName] = useState<string | null>(null);
  const [compiledRegistered, setCompiledRegistered] = useState<boolean>(false);

  useEffect(() => {
    if (!compiledBuffer) {
      setCompiledRegistered(false);
      return;
    }

    let isMounted = true;
    const registerCompiled = async () => {
      try {
        const uniqueName = `CompiledKerningFont_Preview_${Date.now()}`;
        const fontFace = new FontFace(uniqueName, compiledBuffer);
        const loadedFace = await fontFace.load();

        if (!isMounted) return;

        const toRemove: FontFace[] = [];
        document.fonts.forEach((face) => {
          if (face.family.startsWith('CompiledKerningFont_Preview_')) {
            toRemove.push(face);
          }
        });
        toRemove.forEach((face) => document.fonts.delete(face));

        document.fonts.add(loadedFace);
        setCompiledFamilyName(uniqueName);
        setCompiledRegistered(true);
      } catch (err) {
        console.warn('Error registering compiled preview font:', err);
        if (isMounted) setCompiledRegistered(false);
      }
    };

    registerCompiled();
    return () => {
      isMounted = false;
    };
  }, [compiledBuffer]);

  // Generate All Kerning Pairs with full Unicode support
  const kerningPairs = useMemo<GeneratedKerningPair[]>(() => {
    if (!font) return [];
    return generateFullFontKerningPairs(font, kerningSettings);
  }, [font, kerningSettings]);

  // The original font's own kerning for a pair (0 when it has none or lacks the glyph).
  const originalValueOf = useCallback(
    (pair: GeneratedKerningPair): number => {
      if (!font) return 0;
      try {
        const gl = font.glyphs.get(pair.indexLeft);
        const gr = font.glyphs.get(pair.indexRight);
        if (!gl || !gr || pair.indexLeft >= font.glyphs.length || pair.indexRight >= font.glyphs.length) return 0;
        return Math.round(font.getKerningValue(gl, gr) || 0);
      } catch {
        return 0;
      }
    },
    [font]
  );

  const changedKeys = useMemo(() => {
    const set = new Set<string>();
    kerningPairs.forEach((p) => {
      if (p.value !== originalValueOf(p)) set.add(`${p.charLeft},${p.charRight}`);
    });
    return set;
  }, [kerningPairs, originalValueOf]);

  const customCount = useMemo(() => kerningPairs.filter((p) => p.category === 'custom').length, [kerningPairs]);

  // Filtered Kerning Pairs based on Category and Search Query
  const filteredPairs = useMemo<GeneratedKerningPair[]>(() => {
    return kerningPairs.filter((pair) => {
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'custom') {
          const pairKey = `${pair.charLeft},${pair.charRight}`;
          const isCustom = Object.prototype.hasOwnProperty.call(kerningSettings.customPairs, pairKey);
          if (!isCustom) return false;
        } else if (selectedCategory === 'changed') {
          if (!changedKeys.has(`${pair.charLeft},${pair.charRight}`)) return false;
        } else if (pair.category !== selectedCategory) {
          return false;
        }
      }
      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        const pairName = (pair.charLeft + pair.charRight).toLowerCase();
        const valStr = pair.value.toString();
        return pairName.includes(query) || valStr.includes(query);
      }
      return true;
    });
  }, [kerningPairs, selectedCategory, searchFilter, kerningSettings.customPairs, changedKeys]);

  // Handle individual pair value edit
  const handleEditPairValue = useCallback(
    (charLeft: string, charRight: string, newVal: number) => {
      const nextCustomPairs = { ...kerningSettings.customPairs };

      if (smartGroupEdit) {
        const groupL = getCharacterFamilyGroup(charLeft);
        const groupR = getCharacterFamilyGroup(charRight);

        for (const l of groupL) {
          for (const r of groupR) {
            const pairKey = `${l},${r}`;
            nextCustomPairs[pairKey] = newVal;
          }
        }
      } else {
        const pairKey = `${charLeft},${charRight}`;
        nextCustomPairs[pairKey] = newVal;
      }

      onUpdateKerningSettings({ customPairs: nextCustomPairs });
    },
    [kerningSettings, onUpdateKerningSettings, smartGroupEdit]
  );

  // Handle individual pair removal
  const handleRemovePair = useCallback(
    (charLeft: string, charRight: string) => {
      const nextCustomPairs = { ...kerningSettings.customPairs };

      if (smartGroupEdit) {
        const groupL = getCharacterFamilyGroup(charLeft);
        const groupR = getCharacterFamilyGroup(charRight);

        for (const l of groupL) {
          for (const r of groupR) {
            const pairKey = `${l},${r}`;
            nextCustomPairs[pairKey] = 0;
          }
        }
      } else {
        const pairKey = `${charLeft},${charRight}`;
        nextCustomPairs[pairKey] = 0;
      }

      onUpdateKerningSettings({ customPairs: nextCustomPairs });
    },
    [kerningSettings, onUpdateKerningSettings, smartGroupEdit]
  );

  // Drop the hand-set value so the pair goes back to what auto kerning / the font gives
  const handleClearCustomPair = useCallback(
    (charLeft: string, charRight: string) => {
      const next = { ...kerningSettings.customPairs };
      const groupL = smartGroupEdit ? getCharacterFamilyGroup(charLeft) : [charLeft];
      const groupR = smartGroupEdit ? getCharacterFamilyGroup(charRight) : [charRight];
      for (const l of groupL) for (const r of groupR) delete next[`${l},${r}`];
      onUpdateKerningSettings({ customPairs: next });
    },
    [kerningSettings, onUpdateKerningSettings, smartGroupEdit]
  );

  const selectedPair = useMemo(() => {
    if (!selectedPairKey) return null;
    const p = kerningPairs.find((x) => `${x.charLeft},${x.charRight}` === selectedPairKey);
    return p ? { left: p.charLeft, right: p.charRight, original: originalValueOf(p), value: p.value } : null;
  }, [selectedPairKey, kerningPairs, originalValueOf]);

  // Handle adding custom pair
  const handleAddCustomPair = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const charsL = Array.from(newCharLeft.trim());
      const charsR = Array.from(newCharRight.trim());
      const charL = (charsL[0] as string) || '';
      const charR = (charsR[0] as string) || '';
      if (!charL || !charR) return;

      const nextCustomPairs = { ...kerningSettings.customPairs };

      if (smartGroupEdit) {
        const groupL = getCharacterFamilyGroup(charL);
        const groupR = getCharacterFamilyGroup(charR);

        for (const l of groupL) {
          for (const r of groupR) {
            const pairKey = `${l},${r}`;
            nextCustomPairs[pairKey] = newValue;
          }
        }
      } else {
        const pairKey = `${charL},${charR}`;
        nextCustomPairs[pairKey] = newValue;
      }

      onUpdateKerningSettings({ customPairs: nextCustomPairs });
      setNewCharLeft('');
      setNewCharRight('');
    },
    [newCharLeft, newCharRight, newValue, kerningSettings, onUpdateKerningSettings, smartGroupEdit]
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-neutral-100 min-h-0">
      {/* 1. LEFT PANEL: Danh Sách Cặp Kerning Đã Tạo */}
      <div
        style={{ width: `${leftWidth}px` }}
        className="hidden lg:flex flex-col shrink-0 bg-white border-r border-neutral-200 p-2.5 shadow-xs overflow-hidden"
      >
        <KerningPairsLeftPanel
          kerningPairs={kerningPairs}
          filteredPairs={filteredPairs}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchFilter={searchFilter}
          setSearchFilter={setSearchFilter}
          smartGroupEdit={smartGroupEdit}
          setSmartGroupEdit={setSmartGroupEdit}
          newCharLeft={newCharLeft}
          setNewCharLeft={setNewCharLeft}
          newCharRight={newCharRight}
          setNewCharRight={setNewCharRight}
          newValue={newValue}
          setNewValue={setNewValue}
          onAddCustomPair={handleAddCustomPair}
          onEditPairValue={handleEditPairValue}
          onRemovePair={handleRemovePair}
          onClearCustomPair={handleClearCustomPair}
          selectedPairKey={selectedPairKey}
          onSelectPair={setSelectedPairKey}
          originalValueOf={originalValueOf}
          customCount={customCount}
          changedCount={changedKeys.size}
          compiledRegistered={compiledRegistered}
          compiledFamilyName={compiledFamilyName}
          originalRegistered={originalRegistered}
          originalFamilyName={originalFamilyName}
        />
      </div>

      {/* Mobile left fallback */}
      <div className="lg:hidden bg-white border-b border-neutral-200 p-2.5 shrink-0 max-h-72 overflow-y-auto">
        <KerningPairsLeftPanel
          kerningPairs={kerningPairs}
          filteredPairs={filteredPairs}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchFilter={searchFilter}
          setSearchFilter={setSearchFilter}
          smartGroupEdit={smartGroupEdit}
          setSmartGroupEdit={setSmartGroupEdit}
          newCharLeft={newCharLeft}
          setNewCharLeft={setNewCharLeft}
          newCharRight={newCharRight}
          setNewCharRight={setNewCharRight}
          newValue={newValue}
          setNewValue={setNewValue}
          onAddCustomPair={handleAddCustomPair}
          onEditPairValue={handleEditPairValue}
          onRemovePair={handleRemovePair}
          onClearCustomPair={handleClearCustomPair}
          selectedPairKey={selectedPairKey}
          onSelectPair={setSelectedPairKey}
          originalValueOf={originalValueOf}
          customCount={customCount}
          changedCount={changedKeys.size}
          compiledRegistered={compiledRegistered}
          compiledFamilyName={compiledFamilyName}
          originalRegistered={originalRegistered}
          originalFamilyName={originalFamilyName}
        />
      </div>

      {/* Left Resizer */}
      <ResizableDivider
        direction="horizontal"
        onResize={handleLeftResize}
        className="hidden lg:flex"
      />

      {/* 2. MIDDLE PANEL: Live view */}
      <div className="flex-1 flex flex-col min-w-0 bg-white p-2.5 shadow-xs overflow-hidden">
        <KerningLiveViewMiddle
          sampleText={sampleText}
          setSampleText={setSampleText}
          fontSize={fontSize}
          setFontSize={setFontSize}
          spacingRules={spacingRules}
          fontMetadata={fontMetadata}
          kerningPairsCount={kerningPairs.length}
          compiledRegistered={compiledRegistered}
          compiledFamilyName={compiledFamilyName}
          originalRegistered={originalRegistered}
          originalFamilyName={originalFamilyName}
          selectedPair={selectedPair}
        />
      </div>

      {/* Right Resizer */}
      <ResizableDivider
        direction="horizontal"
        onResize={handleRightResize}
        className="hidden lg:flex"
      />

      {/* 3. RIGHT PANEL: Cài đặt Auto Spacing & Auto Kerning */}
      <div
        style={{ width: `${rightWidth}px` }}
        className="w-full lg:w-auto flex flex-col shrink-0 bg-white border-l border-neutral-200 p-3 shadow-xs overflow-y-auto h-full min-h-0 custom-scrollbar"
      >
        <KerningSettingsRightPanel
          fontMetadata={fontMetadata}
          totalGlyphsCount={font?.glyphs.length || 0}
          kerningPairsCount={kerningPairs.length}
          spacingRules={spacingRules}
          kerningSettings={kerningSettings}
          onUpdateSpacingRules={onUpdateSpacingRules}
          onUpdateKerningSettings={onUpdateKerningSettings}
          onCompileFont={onCompileFont}
          compiling={compiling}
          autoSpacingActive={autoSpacingActive}
          autoKerningActive={autoKerningActive}
          onSetAutoSpacingActive={onSetAutoSpacingActive}
          onSetAutoKerningActive={onSetAutoKerningActive}
        />
      </div>
    </div>
  );
};
