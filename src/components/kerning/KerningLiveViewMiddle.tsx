import React, { useState, useEffect } from 'react';
import {
  Columns,
  Layers,
  Maximize2,
  Sun,
  Moon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Check,
  Info
} from 'lucide-react';
import { AutoSpacingRules, FontMetadata } from '../../types';

interface KerningLiveViewMiddleProps {
  sampleText: string;
  setSampleText: (text: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  spacingRules: AutoSpacingRules;
  fontMetadata: FontMetadata | null;
  kerningPairsCount: number;
  compiledRegistered: boolean;
  compiledFamilyName: string | null;
  originalRegistered: boolean;
  originalFamilyName: string | null;
}

export const KerningLiveViewMiddle: React.FC<KerningLiveViewMiddleProps> = ({
  sampleText,
  setSampleText,
  fontSize,
  setFontSize,
  spacingRules,
  fontMetadata,
  kerningPairsCount,
  compiledRegistered,
  compiledFamilyName,
  originalRegistered,
  originalFamilyName
}) => {
  const [previewMode, setPreviewMode] = useState<'side_by_side' | 'overlay' | 'single'>('side_by_side');
  const [canvasTheme, setCanvasTheme] = useState<'dark' | 'light'>(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setCanvasTheme(isDark ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [isMultiLine, setIsMultiLine] = useState<boolean>(true);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  const textPresetCategories = [
    { label: 'Tiếng Việt', text: 'Việt Nam Thịnh Vượng — Tình Yêu & Trí Tuệ • Thành Phố Vô Tận • Vũ Trụ Rạng Rỡ' },
    { label: 'All Caps', text: 'AVATAR WAVE TAXI TYPOGRAPHY WALTZ YOUTH' },
    { label: 'Cơ bản', text: 'Ta To Te Va Ve Vo Vê Vô Vơ Vư vo ve va wo we wa yà ý' },
    { label: 'Số & Dấu', text: 'L\'Amour T.T.S. (012) 345-6789 [1/2] 90% + $100 = €85' },
    { label: 'Đoạn văn', text: 'Tự động quét toàn bộ ký tự trong font, tính toán khoảng cách quang học và tự động tạo Kerning cho tất cả cụm chữ kinh điển & tiếng Việt.' }
  ];

  return (
    <div className="flex flex-col h-full space-y-3 overflow-hidden text-neutral-900">
     {/* Controls Toolbar */}
<div className="flex flex-wrap items-center justify-between gap-2 px-0 py-2 bg-neutral-50/0 shrink-0">
  {/* View Mode */}
  <div className="flex items-center bg-white p-0.5 rounded-lg border border-neutral-200 text-xs font-bold">
    <button
      type="button"
      onClick={() => setPreviewMode('side_by_side')}
      className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition cursor-pointer text-[11px] ${
        previewMode === 'side_by_side'
          ? 'bg-neutral-200 text-neutral-950'
          : 'text-neutral-400 hover:text-neutral-900'
      }`}
      title="So sánh Trước & Sau"
    >
      <Columns className="w-3 h-3" />
      <span>Song song</span>
    </button>

    <button
      type="button"
      onClick={() => setPreviewMode('overlay')}
      className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition cursor-pointer text-[11px] ${
        previewMode === 'overlay'
          ? 'bg-neutral-200 text-neutral-950'
          : 'text-neutral-400 hover:text-neutral-900'
      }`}
      title="Đè bóng so sánh dịch chuyển"
    >
      <Layers className="w-3 h-3" />
      <span>Đè bóng</span>
    </button>

    <button
      type="button"
      onClick={() => setPreviewMode('single')}
      className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition cursor-pointer text-[11px] ${
        previewMode === 'single'
          ? 'bg-neutral-200 text-neutral-950'
          : 'text-neutral-400 hover:text-neutral-900'
      }`}
      title="Xem kết quả sau Kerning"
    >
      <Maximize2 className="w-3 h-3" />
      <span>Solo</span>
    </button>
  </div>

  {/* Font size & Theme & Align controls */}
  <div className="flex items-center gap-2">

      {/* Preset Categories */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 shrink-0 text-xs">
        {textPresetCategories.map((cat, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSampleText(cat.text)}
            className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold transition cursor-pointer shrink-0 ${
              sampleText === cat.text
                ? 'bg-neutral-900 text-white border-neutral-700'
                : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

    {/* Font Size */}
    <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-neutral-200 text-[11px]">
      
      <input
        type="range"
        min="16"
        max="72"
        step="2"
        value={fontSize}
        onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
        className="w-14 accent-neutral-900 cursor-pointer h-1 bg-neutral-200 rounded"
      />

      <span className="font-mono text-neutral-900 font-bold">
        {fontSize}px
      </span>
    </div>

    {/* Theme Switcher */}
    <button
      id="kerning-theme-toggle-btn"
      type="button"
      onClick={() => setCanvasTheme(canvasTheme === 'dark' ? 'light' : 'dark')}
      className="p-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-900 transition cursor-pointer flex items-center gap-1"
      title={canvasTheme === 'dark' ? 'Đang hiển thị nền Tối. Bấm để đổi sang nền Sáng (trắng)' : 'Đang hiển thị nền Sáng. Bấm để đổi sang nền Tối (đen)'}
    >
      {canvasTheme === 'dark' ? (
        <Sun className="w-3.5 h-3.5 text-amber-500" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-neutral-600" />
      )}
    </button>

    {/* Alignment */}
    <div className="flex items-center bg-white p-0.5 rounded-lg border border-neutral-200">
      <button
        type="button"
        onClick={() => setTextAlign('left')}
        className={`p-1 rounded transition cursor-pointer ${
          textAlign === 'left'
            ? 'bg-neutral-200 text-neutral-950'
            : 'text-neutral-400 hover:text-neutral-900'
        }`}
      >
        <AlignLeft className="w-3 h-3" />
      </button>

      <button
        type="button"
        onClick={() => setTextAlign('center')}
        className={`p-1 rounded transition cursor-pointer ${
          textAlign === 'center'
            ? 'bg-neutral-200 text-neutral-950'
            : 'text-neutral-400 hover:text-neutral-900'
        }`}
      >
        <AlignCenter className="w-3 h-3" />
      </button>

      <button
        type="button"
        onClick={() => setTextAlign('right')}
        className={`p-1 rounded transition cursor-pointer ${
          textAlign === 'right'
            ? 'bg-neutral-200 text-neutral-950'
            : 'text-neutral-400 hover:text-neutral-900'
        }`}
      >
        <AlignRight className="w-3 h-3" />
      </button>
    </div>

    {/* Multi-line toggle */}
    <button
      type="button"
      onClick={() => setIsMultiLine(!isMultiLine)}
      className={`p-1 rounded-lg border transition cursor-pointer ${
        isMultiLine
          ? 'bg-neutral-200 text-neutral-950 border-neutral-300'
          : 'bg-white text-neutral-400 border-neutral-200 hover:text-neutral-900'
      }`}
      title="Chế độ nhiều dòng"
    >
      <Type className="w-3.5 h-3.5" />
    </button>
  </div>
</div>
  
      {/* Sample Text Input */}
      <div className="shrink-0">
        {isMultiLine ? (
          <textarea
            rows={6}
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="Nhập hoặc dán văn bản kiểm thử..."
            className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-medium focus:border-neutral-900 outline-hidden resize-none"
          />
        ) : (
          <input
            type="text"
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="Nhập dòng văn bản kiểm thử..."
            className="w-full text-xs px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-medium focus:border-neutral-900 outline-hidden"
          />
        )}
      </div>

      {/* Live Canvas Comparison Area */}
      <div className="flex-1 overflow-y-auto rounded-xl">
        {previewMode === 'overlay' ? (
          <div
            id="kerning-overlay-canvas"
            data-kerning-canvas={canvasTheme}
            className={`h-full min-h-[300px] p-5 rounded-xl border relative overflow-x-auto transition-colors duration-200 ${
              canvasTheme === 'dark'
                ? 'bg-neutral-950 border-neutral-800 text-white'
                : 'bg-white border-neutral-200 text-neutral-900 shadow-inner'
            }`}
          >
            <div className="flex items-center gap-4 mb-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Đỏ Bóng: Font Gốc
              </span>
              <span className="flex items-center gap-1.5 text-cyan-500 dark:text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 inline-block" />
                Xanh Lam: Sau Auto Kerning
              </span>
            </div>

            <div className="relative min-w-max" style={{ textAlign }}>
              {/* Layer 1: ORIGINAL */}
              <div
                className="whitespace-pre select-none leading-relaxed kerning-overlay-layer1"
                style={{
                  fontSize: `${fontSize}px`,
                  fontFamily:
                    originalRegistered && originalFamilyName
                      ? `"${originalFamilyName}", sans-serif`
                      : 'sans-serif',
                  fontKerning: 'none',
                  fontFeatureSettings: '"kern" 0',
                  color: canvasTheme === 'dark' ? 'rgba(244, 63, 94, 0.75)' : 'rgba(225, 29, 72, 0.7)',
                  fontWeight: 400,
                  fontSynthesis: 'none',
                  WebkitTextStroke: '0px',
                  textShadow: 'none',
                  whiteSpace: isMultiLine ? 'pre-wrap' : 'nowrap'
                }}
              >
                {sampleText}
              </div>

              {/* Layer 2: KERNED */}
              <div
                className="absolute inset-0 pointer-events-none leading-relaxed kerning-overlay-layer2"
                style={{
                  fontSize: `${fontSize}px`,
                  fontFamily:
                    compiledRegistered && compiledFamilyName
                      ? `"${compiledFamilyName}", sans-serif`
                      : originalRegistered && originalFamilyName
                      ? `"${originalFamilyName}", sans-serif`
                      : 'sans-serif',
                  fontKerning: 'normal',
                  fontFeatureSettings: '"kern" 1, "liga" 1',
                  WebkitFontFeatureSettings: '"kern" 1, "liga" 1',
                  letterSpacing: `${spacingRules.globalTrackingOffset}px`,
                  color: canvasTheme === 'dark' ? '#06b6d4' : '#0284c7',
                  mixBlendMode: canvasTheme === 'dark' ? 'screen' : 'multiply',
                  fontWeight: 400,
                  fontSynthesis: 'none',
                  WebkitTextStroke: '0px',
                  textShadow: 'none',
                  whiteSpace: isMultiLine ? 'pre-wrap' : 'nowrap'
                }}
              >
                {sampleText}
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 ${
              previewMode === 'side_by_side' ? 'md:grid-cols-2' : ''
            } gap-3 h-full min-h-[300px]`}
          >
            {/* Box 1: Before */}
            {previewMode === 'side_by_side' && (
              <div
                id="kerning-box-original"
                data-kerning-canvas={canvasTheme}
                className={`p-4 rounded-xl border flex flex-col h-full transition-colors duration-200 ${
                  canvasTheme === 'dark'
                    ? 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    : 'bg-white border-neutral-200 text-neutral-900 shadow-2xs'
                }`}
              >
                <div className="h-7 shrink-0 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider border-b border-neutral-200/40 kerning-header-bar">
                  <span className="text-rose-500 flex items-center gap-1 font-mono">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    1. Gốc (Chưa Kerning)
                  </span>

                  <span className="font-mono text-[9px] text-neutral-400 kerning-meta-family">
                    {fontMetadata?.family || 'Font Gốc'}
                  </span>
                </div>

                <div
                  className="flex-1 min-h-0 overflow-x-auto px-2 py-3 font-normal leading-relaxed kerning-canvas-text"
                  style={{
                    fontSize: `${fontSize}px`,
                    fontFamily:
                      originalRegistered && originalFamilyName
                        ? `"${originalFamilyName}", sans-serif`
                        : 'sans-serif',
                    fontKerning: 'none',
                    fontFeatureSettings: '"kern" 0',
                    textAlign,
                    color: canvasTheme === 'dark' ? '#f4f4f5' : '#18181b',
                    fontWeight: 400,
                    fontSynthesis: 'none',
                    WebkitTextStroke: '0px',
                    textShadow: 'none',
                    whiteSpace: isMultiLine ? 'pre-wrap' : 'nowrap'
                  }}
                >
                  {sampleText}
                </div>
              </div>
            )}

            {/* Box 2: After */}
            <div
              id="kerning-box-kerned"
              data-kerning-canvas={canvasTheme}
              className={`p-4 rounded-xl border flex flex-col h-full transition-colors duration-200 ${
                canvasTheme === 'dark'
                  ? 'bg-neutral-950 border-indigo-500/50 text-white shadow-indigo-950/20'
                  : 'bg-white border-indigo-400 text-neutral-900 shadow-sm'
              }`}
            >
              <div className="h-7 shrink-0 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider border-b border-neutral-200/40 kerning-header-bar">
                <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1 font-mono">
                  <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  {previewMode === 'single'
                    ? 'Kết quả Auto Kerning'
                    : '2. Sau Auto Kerning'}{' '}
                  ({kerningPairsCount} cặp)
                </span>

                <span className="font-mono text-[9px] text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800 kerning-meta-badge">
                  {spacingRules.globalTrackingOffset > 0
                    ? `Tracking +${spacingRules.globalTrackingOffset}`
                    : 'Kerning Enabled'}
                </span>
              </div>

              <div
                className="flex-1 min-h-0 overflow-x-auto px-2 py-3 font-normal leading-relaxed kerning-canvas-text"
                style={{
                  fontSize: `${fontSize}px`,
                  fontFamily:
                    compiledRegistered && compiledFamilyName
                      ? `"${compiledFamilyName}", sans-serif`
                      : originalRegistered && originalFamilyName
                      ? `"${originalFamilyName}", sans-serif`
                      : 'sans-serif',
                  fontKerning: 'normal',
                  fontFeatureSettings: '"kern" 1, "liga" 1',
                  WebkitFontFeatureSettings: '"kern" 1, "liga" 1',
                  letterSpacing: `${spacingRules.globalTrackingOffset}px`,
                  textAlign,
                  color: canvasTheme === 'dark' ? '#f4f4f5' : '#18181b',
                  fontWeight: 400,
                  fontSynthesis: 'none',
                  WebkitTextStroke: '0px',
                  textShadow: 'none',
                  whiteSpace: isMultiLine ? 'pre-wrap' : 'nowrap'
                }}
              >
                {sampleText}
              </div>

              {!compiledRegistered && (
                <p className="text-[10px] text-amber-500 dark:text-amber-400 pt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>Đang biên dịch hiển thị kerning trực tiếp...</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
