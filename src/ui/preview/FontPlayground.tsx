import React, { useEffect, useState, useMemo } from 'react';
import {
  Type,
  ChevronUp,
  ChevronDown,
  ArrowLeftRight,
  Sliders,
  Sparkles,
  Copy,
  Check,
  Maximize2
} from 'lucide-react';
import * as opentype from 'opentype.js';
import { GlyphEditState } from '../../core/session';

interface FontPlaygroundProps {
  fontBuffer: ArrayBuffer | null;
  originalBuffer: ArrayBuffer | null;
  editedGlyphs: Record<string, GlyphEditState>;
  fontFamilyName?: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const DEFAULT_TEST_TEXT = 'Sphinx of black quartz, judge my vow! Tiếng Việt: Hoàng tử bé và chim chích chòe. 0123456789 (Typography & Kerning: AV, WA, To, Ta, We, Yo).';

const PRESET_PANGRAMS = [
  { label: 'Tiếng Việt', text: 'Hoàng tử bé bước đi trong sự tĩnh lặng của sa mạc mênh mông bát ngát. Ăn quả nhớ kẻ trồng cây.' },
  { label: 'English', text: 'The quick brown fox jumps over the lazy dog. Sphinx of black quartz, judge my vow!' },
  { label: 'Alphabet', text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789' },
  { label: 'Kerning Test', text: 'AV WA VA AT Ta To We Yo Te Tr Tu Vo Ya Ye Ty FA PA LT LV LW' },
];

export const FontPlayground: React.FC<FontPlaygroundProps> = ({
  fontBuffer,
  originalBuffer,
  editedGlyphs,
  fontFamilyName = 'CustomFontStudio',
  isExpanded,
  onToggleExpanded
}) => {
  const [inputText, setInputText] = useState(DEFAULT_TEST_TEXT);
  const [fontSize, setFontSize] = useState(28);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [viewMode, setViewMode] = useState<'compiled' | 'compare' | 'original'>('compiled');

  const [activeFamilyName, setActiveFamilyName] = useState(fontFamilyName);
  const [originalFamilyName, setOriginalFamilyName] = useState(fontFamilyName + '_orig');
  const [parsedFont, setParsedFont] = useState<any>(null);
  const [parsedOriginalFont, setParsedOriginalFont] = useState<any>(null);

  // Parse fonts into opentype.js instances
  useEffect(() => {
    if (!fontBuffer) {
      setParsedFont(null);
      return;
    }
    try {
      const parsed = opentype.parse(fontBuffer.slice(0));
      setParsedFont(parsed);
    } catch (e) {
      console.warn('Lỗi đọc fontBuffer trong dock:', e);
      setParsedFont(null);
    }
  }, [fontBuffer]);

  useEffect(() => {
    if (!originalBuffer) {
      setParsedOriginalFont(null);
      return;
    }
    try {
      const parsed = opentype.parse(originalBuffer.slice(0));
      setParsedOriginalFont(parsed);
    } catch (e) {
      console.warn('Lỗi đọc originalBuffer trong dock:', e);
      setParsedOriginalFont(null);
    }
  }, [originalBuffer]);

  // Register dynamic FontFaces in document
  useEffect(() => {
    if (!fontBuffer) return;

    const registerFaces = async () => {
      try {
        const safeName = (fontFamilyName || 'CustomFont').replace(/[^a-zA-Z0-9_-]/g, '_');
        const uniqueCompiled = `${safeName}_c${Date.now()}`;
        const faceCompiled = new FontFace(uniqueCompiled, fontBuffer);
        const loadedCompiled = await faceCompiled.load();
        document.fonts.add(loadedCompiled);
        setActiveFamilyName(uniqueCompiled);

        if (originalBuffer) {
          const uniqueOrig = `${safeName}_orig_${Date.now()}`;
          const faceOrig = new FontFace(uniqueOrig, originalBuffer);
          const loadedOrig = await faceOrig.load();
          document.fonts.add(loadedOrig);
          setOriginalFamilyName(uniqueOrig);
        }
      } catch (err) {
        console.warn('FontFace registration notice:', err);
      }
    };

    registerFaces();
  }, [fontBuffer, originalBuffer, fontFamilyName]);

  // List of modified or alt glyphs
  const altOrEditedList = useMemo(() => {
    return (Object.values(editedGlyphs) as GlyphEditState[]).filter(
      (g) => g.isCompleted || g.isModified
    );
  }, [editedGlyphs]);

  // Insert character or alt code into text
  const handleInsertChar = (charOrCode: string | number) => {
    const toInsert = typeof charOrCode === 'number' ? String.fromCodePoint(charOrCode) : charOrCode;
    setInputText(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + toInsert);
  };

  // Kerning calculation renderer
  const renderTextWithKerning = (fontObj: any, customFamily: string) => {
    if (!inputText) return null;
    if (!fontObj) {
      return (
        <div style={{ fontFamily: customFamily, fontSize: `${fontSize}px`, lineHeight, letterSpacing: `${letterSpacing}px` }}>
          {inputText}
        </div>
      );
    }

    const lines = inputText.split('\n');
    const unitsPerEm = fontObj.unitsPerEm || 1000;
    const scale = fontSize / unitsPerEm;

    return (
      <div style={{ fontFamily: customFamily, fontSize: `${fontSize}px`, lineHeight }}>
        {lines.map((line, lIdx) => {
          const chars = Array.from(line);
          const charKernings: number[] = [];

          for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const nextChar = chars[i + 1];
            let kernVal = 0;
            if (nextChar) {
              const leftIdx = fontObj.charToGlyphIndex(char);
              const rightIdx = fontObj.charToGlyphIndex(nextChar);
              if (leftIdx > 0 && rightIdx > 0) {
                const pairKey = `${leftIdx},${rightIdx}`;
                if (fontObj.kerningPairs && fontObj.kerningPairs[pairKey] !== undefined) {
                  kernVal = fontObj.kerningPairs[pairKey];
                } else if (typeof fontObj.getKerningValue === 'function') {
                  kernVal = fontObj.getKerningValue(leftIdx, rightIdx) || 0;
                }
              }
            }
            charKernings.push(kernVal * scale + letterSpacing);
          }

          return (
            <div key={lIdx} className="break-words">
              {chars.map((char, cIdx) => {
                const kern = charKernings[cIdx];
                return (
                  <span
                    key={cIdx}
                    style={{
                      marginRight: kern !== 0 ? `${kern}px` : undefined,
                      display: 'inline-block',
                      whiteSpace: 'pre'
                    }}
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="border-t border-neutral-200/90 bg-white shadow-lg shrink-0 select-none z-20 transition-all duration-200">
      {/* Dock Bar Header (Always visible) */}
      <div className="h-11 px-4 flex items-center justify-between gap-3 bg-neutral-50/70 border-b border-neutral-200/60">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleExpanded}
            className="flex items-center gap-1.5 font-bold text-xs text-neutral-900 hover:text-neutral-700 transition"
          >
            <div className="w-5 h-5 rounded-md bg-neutral-900 text-white flex items-center justify-center">
              <Type className="w-3 h-3" />
            </div>
            <span>Khung Chạy Thử Font (Live Playground)</span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
            )}
          </button>

          {/* Quick Pangram Presets when collapsed */}
          <div className="hidden md:flex items-center gap-1 text-[11px] ml-3">
            <span className="text-neutral-400">Mẫu:</span>
            {PRESET_PANGRAMS.map((p) => (
              <button
                key={p.label}
                onClick={() => setInputText(p.text)}
                className="px-2 py-0.5 rounded bg-white hover:bg-neutral-100 border border-neutral-200/80 text-neutral-600 font-medium"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* View mode toggle & expand trigger */}
        <div className="flex items-center gap-2">
          {/* View mode */}
          <div className="flex items-center gap-1 bg-neutral-200/70 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('compiled')}
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition ${
                viewMode === 'compiled' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Font Mới
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition flex items-center gap-1 ${
                viewMode === 'compare' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>So Sánh</span>
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition ${
                viewMode === 'original' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Font Gốc
            </button>
          </div>

          <button
            onClick={onToggleExpanded}
            className="p-1 rounded-md text-neutral-500 hover:bg-neutral-200/80 text-xs font-medium flex items-center gap-1"
            title={isExpanded ? 'Thu gọn playground' : 'Mở rộng playground'}
          >
            <span className="text-[11px] hidden sm:inline">{isExpanded ? 'Thu gọn' : 'Mở rộng'}</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="p-3.5 space-y-3 max-h-72 overflow-y-auto bg-white">
          {/* Controls Bar: Font size, Line height, Letter spacing */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-neutral-50/80 p-2.5 rounded-xl border border-neutral-200/80">
            {/* Input preview text bar */}
            <div className="flex-1 min-w-[240px]">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập văn bản thử nghiệm..."
                className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Typography sliders */}
            <div className="flex items-center gap-4 text-[11px] text-neutral-600">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">Cỡ:</span>
                <input
                  type="range"
                  min={12}
                  max={72}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-16 accent-neutral-900 h-1.5"
                />
                <span className="font-mono font-semibold w-7">{fontSize}px</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">Khoảng cách:</span>
                <input
                  type="range"
                  min={-4}
                  max={20}
                  value={letterSpacing}
                  onChange={(e) => setLetterSpacing(Number(e.target.value))}
                  className="w-14 accent-neutral-900 h-1.5"
                />
                <span className="font-mono font-semibold w-6">{letterSpacing}px</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">Dòng:</span>
                <input
                  type="range"
                  min={1.0}
                  max={2.4}
                  step={0.1}
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-14 accent-neutral-900 h-1.5"
                />
                <span className="font-mono font-semibold w-6">{lineHeight.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Quick Insert Badges for Modified / Alt Glyphs */}
          {altOrEditedList.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-neutral-400 shrink-0 font-medium">Chèn ký tự đã sửa:</span>
              {altOrEditedList.map((g) => (
                <button
                  key={g.id}
                  onClick={() =>
                    handleInsertChar(g.mode === 'alt' && g.altUnicode ? g.altUnicode : g.originalChar || g.originalName)
                  }
                  className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 font-mono text-neutral-800 shrink-0 flex items-center gap-1 transition"
                  title={`Chèn ${g.mode === 'alt' ? g.altName : g.originalName}`}
                >
                  <span className="font-bold">
                    {g.mode === 'alt' && g.altUnicode ? String.fromCodePoint(g.altUnicode) : g.originalChar || g.originalName}
                  </span>
                  <span className="text-[9px] text-neutral-400">({g.mode === 'alt' ? 'alt' : 'mod'})</span>
                </button>
              ))}
            </div>
          )}

          {/* Live Render Area */}
          <div className="border border-neutral-200 rounded-xl p-4 min-h-[90px] bg-white">
            {viewMode === 'compare' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
                    Font Gốc (Original)
                  </div>
                  {renderTextWithKerning(parsedOriginalFont, originalFamilyName)}
                </div>
                <div className="space-y-1 md:pl-4 pt-2 md:pt-0">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Font Đã Sửa (Compiled)</span>
                  </div>
                  {renderTextWithKerning(parsedFont, activeFamilyName)}
                </div>
              </div>
            ) : viewMode === 'original' ? (
              <div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono mb-1">
                  Font Gốc (Original)
                </div>
                {renderTextWithKerning(parsedOriginalFont, originalFamilyName)}
              </div>
            ) : (
              <div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Font Đã Sửa (Compiled)</span>
                </div>
                {renderTextWithKerning(parsedFont, activeFamilyName)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
