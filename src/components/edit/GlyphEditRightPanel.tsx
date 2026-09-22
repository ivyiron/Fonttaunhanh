import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as opentype from 'opentype.js';
import {
  Upload,
  Clipboard,
  Copy,
  Link,
  Unlink,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyEnd,
  Code2,
  FlipHorizontal,
  FlipVertical
} from 'lucide-react';
import { CustomGlyphDesign, GlyphEditMode, FontMetadata } from '../../types';
import { NumericInput } from '../NumericInput';
import {
  extractPathDataFromSvg,
  parseSvgPath,
  transformCommands,
  getExactBoundingBox
} from '../../utils';

interface GlyphEditRightPanelProps {
  font: opentype.Font | null;
  fontMetadata: FontMetadata | null;
  selectedGlyphKey: string;
  customDesign: CustomGlyphDesign | null;
  onUpdateDesign: (updates: Partial<CustomGlyphDesign>) => void;
  onResetDesign: () => void;
  onApplyAndCompile: () => void;
  compiling: boolean;
}

export const GlyphEditRightPanel: React.FC<GlyphEditRightPanelProps> = ({
  font,
  fontMetadata,
  selectedGlyphKey,
  customDesign,
  onUpdateDesign,
  onResetDesign,
  onApplyAndCompile,
  compiling
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aspectLocked, setAspectLocked] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Auto-clear toast
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Find original glyph in font
  const originalGlyph = useMemo<opentype.Glyph | null>(() => {
    if (!font || !selectedGlyphKey) return null;
    if (selectedGlyphKey.length === 1) {
      const idx = font.charToGlyphIndex(selectedGlyphKey);
      if (idx > 0) return font.glyphs.get(idx);
    }
    for (let i = 0; i < font.glyphs.length; i++) {
      const g = font.glyphs.get(i);
      if (g && (g.name === selectedGlyphKey || (g.unicode && String.fromCharCode(g.unicode) === selectedGlyphKey))) {
        return g;
      }
    }
    return null;
  }, [font, selectedGlyphKey]);

  const unitsPerEm = font?.unitsPerEm || fontMetadata?.unitsPerEm || 1000;
  const ascender = font?.ascender || fontMetadata?.ascender || Math.round(unitsPerEm * 0.8);
  const capHeight = fontMetadata?.capHeight || Math.round(unitsPerEm * 0.7);
  const xHeight = fontMetadata?.xHeight || Math.round(unitsPerEm * 0.5);

  const originalAdvanceWidth = originalGlyph?.advanceWidth || Math.round(unitsPerEm * 0.6);

  // Active or fallback values for current design
  const currentSvgPath = customDesign?.svgPath || '';
  const currentScaleX = customDesign?.scaleX ?? 1.0;
  const currentScaleY = customDesign?.scaleY ?? 1.0;
  const currentOffsetX = customDesign?.offsetX ?? 0;
  const currentOffsetY = customDesign?.offsetY ?? 0;
  const currentAdvanceWidth = customDesign?.advanceWidth ?? originalAdvanceWidth;
  const currentFlipY = customDesign?.flipY ?? true;
  const currentFlipX = customDesign?.flipX ?? false;
  const currentMode: GlyphEditMode = customDesign?.mode || 'replace';

  // Calculate bounding box and metrics for the custom SVG
  const glyphMetrics = useMemo(() => {
    if (!currentSvgPath) {
      return {
        xMin: 0,
        xMax: 0,
        yMin: 0,
        yMax: 0,
        width: 0,
        height: 0,
        lsb: 0,
        rsb: currentAdvanceWidth
      };
    }

    try {
      const rawCmds = parseSvgPath(currentSvgPath);
      if (rawCmds.length === 0) {
        return { xMin: 0, xMax: 0, yMin: 0, yMax: 0, width: 0, height: 0, lsb: 0, rsb: currentAdvanceWidth };
      }

      const transformed = transformCommands(
        rawCmds,
        currentScaleX,
        currentScaleY,
        currentOffsetX,
        currentOffsetY,
        currentFlipY,
        currentFlipX
      );
      const bbox = getExactBoundingBox(transformed);
      const width = Math.round(bbox.xMax - bbox.xMin);
      const height = Math.round(bbox.yMax - bbox.yMin);
      const lsb = Math.round(bbox.xMin);
      const rsb = Math.round(currentAdvanceWidth - bbox.xMax);

      return {
        ...bbox,
        width,
        height,
        lsb,
        rsb
      };
    } catch {
      return { xMin: 0, xMax: 0, yMin: 0, yMax: 0, width: 0, height: 0, lsb: 0, rsb: currentAdvanceWidth };
    }
  }, [currentSvgPath, currentScaleX, currentScaleY, currentOffsetX, currentOffsetY, currentFlipY, currentFlipX, currentAdvanceWidth]);

  // Handle pasting or inputting SVG code
  const handleSvgInput = (rawText: string) => {
    const extracted = extractPathDataFromSvg(rawText);
    if (extracted) {
      // If no custom design yet, initialize defaults centered nicely
      const rawCmds = parseSvgPath(extracted);
      let initialScale = 1.0;
      let initialOffsetX = 0;
      let initialOffsetY = 0;

      if (rawCmds.length > 0) {
        const bbox = getExactBoundingBox(rawCmds);
        const rawH = bbox.yMax - bbox.yMin;
        const targetH = capHeight > 0 ? capHeight : unitsPerEm * 0.7;

        // Auto scale to capHeight if raw SVG is huge or tiny
        if (rawH > 0 && Math.abs(rawH - targetH) > 100) {
          initialScale = Number((targetH / rawH).toFixed(3));
        }

        // Auto center horizontally in advance width
        const scaledW = (bbox.xMax - bbox.xMin) * initialScale;
        initialOffsetX = Math.round((originalAdvanceWidth - scaledW) / 2 - bbox.xMin * initialScale);
        initialOffsetY = Math.round(-bbox.yMin * initialScale);
      }

      onUpdateDesign({
        svgPath: extracted,
        scaleX: initialScale,
        scaleY: initialScale,
        offsetX: initialOffsetX,
        offsetY: initialOffsetY,
        advanceWidth: originalAdvanceWidth,
        flipY: true,
        mode: currentMode
      });
      setToastMsg('Đã nạp vector SVG thành công!');
    } else {
      setToastMsg('Không tìm thấy đường vẽ trong SVG');
    }
  };

  // Paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleSvgInput(text);
      } else {
        setToastMsg('Clipboard trống');
      }
    } catch {
      setToastMsg('Trình duyệt chặn truy cập Clipboard');
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleSvgInput(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Copy original glyph SVG path to clipboard so user can edit in Figma/Illustrator
  const handleCopyOriginalSvg = async () => {
    if (!originalGlyph) {
      setToastMsg('Không có ký tự gốc để sao chép');
      return;
    }

    try {
      const pathData = originalGlyph.path ? originalGlyph.path.toPathData(2) : '';
      if (!pathData) {
        setToastMsg('Ký tự không có nét vẽ');
        return;
      }

      const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${-ascender} ${originalAdvanceWidth} ${ascender - (font?.descender || -200)}">\n  <path d="${pathData}" fill="black" transform="scale(1, -1) translate(0, ${-ascender})" />\n</svg>`;
      await navigator.clipboard.writeText(fullSvg);
      setToastMsg('Đã sao chép SVG gốc vào Clipboard!');
    } catch {
      setToastMsg('Không thể sao chép');
    }
  };

  // Quick auto-fit scale helpers
  const handleFitToCapHeight = () => {
    if (!currentSvgPath) return;
    const rawCmds = parseSvgPath(currentSvgPath);
    if (rawCmds.length === 0) return;
    const bbox = getExactBoundingBox(rawCmds);
    const rawH = bbox.yMax - bbox.yMin;
    if (rawH > 0) {
      const targetScale = Number((capHeight / rawH).toFixed(3));
      onUpdateDesign({
        scaleX: targetScale,
        scaleY: targetScale,
        offsetY: Math.round(-bbox.yMin * targetScale)
      });
      setToastMsg('Đã căn vừa Cap-Height');
    }
  };

  const handleFitToXHeight = () => {
    if (!currentSvgPath) return;
    const rawCmds = parseSvgPath(currentSvgPath);
    if (rawCmds.length === 0) return;
    const bbox = getExactBoundingBox(rawCmds);
    const rawH = bbox.yMax - bbox.yMin;
    if (rawH > 0) {
      const targetScale = Number((xHeight / rawH).toFixed(3));
      onUpdateDesign({
        scaleX: targetScale,
        scaleY: targetScale,
        offsetY: Math.round(-bbox.yMin * targetScale)
      });
      setToastMsg('Đã căn vừa x-Height');
    }
  };

  // Quick alignment helpers
  const handleCenterInAdvanceWidth = () => {
    if (!currentSvgPath) return;
    const rawCmds = parseSvgPath(currentSvgPath);
    if (rawCmds.length === 0) return;
    const rawTransformed = transformCommands(rawCmds, currentScaleX, currentScaleY, 0, currentOffsetY, currentFlipY);
    const bbox = getExactBoundingBox(rawTransformed);
    const glyphW = bbox.xMax - bbox.xMin;
    const newOffsetX = Math.round((currentAdvanceWidth - glyphW) / 2 - bbox.xMin);
    onUpdateDesign({ offsetX: newOffsetX });
    setToastMsg('Đã căn giữa chiều rộng');
  };

  const handleAlignBottomBaseline = () => {
    if (!currentSvgPath) return;
    const rawCmds = parseSvgPath(currentSvgPath);
    if (rawCmds.length === 0) return;
    const rawTransformed = transformCommands(rawCmds, currentScaleX, currentScaleY, currentOffsetX, 0, currentFlipY);
    const bbox = getExactBoundingBox(rawTransformed);
    const newOffsetY = Math.round(-bbox.yMin);
    onUpdateDesign({ offsetY: newOffsetY });
    setToastMsg('Đã căn đáy chạm Baseline');
  };

  const handleAutoAdvanceWidth = () => {
    if (!currentSvgPath) return;
    const rawCmds = parseSvgPath(currentSvgPath);
    if (rawCmds.length === 0) return;
    const transformed = transformCommands(rawCmds, currentScaleX, currentScaleY, currentOffsetX, currentOffsetY, currentFlipY);
    const bbox = getExactBoundingBox(transformed);
    const defaultSidebearing = Math.max(30, Math.round(unitsPerEm * 0.05));
    const newWidth = Math.max(50, Math.round(bbox.xMax + defaultSidebearing));
    onUpdateDesign({ advanceWidth: newWidth });
    setToastMsg(`Đã đặt độ rộng: ${newWidth}`);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-neutral-200 select-none overflow-y-auto">
      {/* Hidden File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".svg"
        className="hidden"
      />

      <div className="p-3 space-y-3 pb-24 text-neutral-900">
        {/* Header & Stats Banner - Đồng bộ cấu trúc với Việt hóa & Kerning */}
        <div className="border-b border-neutral-100 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-neutral-900">
                Chỉnh sửa ký tự: <span className="text-indigo-600 font-extrabold">{selectedGlyphKey}</span>
              </h3>
            </div>

            {toastMsg && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-fade-in flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                {toastMsg}
              </span>
            )}
          </div>

          {/* Stats Row Card */}
          <div className="grid grid-cols-3 gap-2 mt-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200/80 text-center">
            <div>
              <span className="text-[10px] text-neutral-500 font-medium block">Tên Glyph</span>
              <span className="text-xs font-black text-neutral-900 truncate block">
                {originalGlyph?.name || selectedGlyphKey}
              </span>
            </div>
            <div className="border-x border-neutral-200">
              <span className="text-[10px] text-neutral-500 font-medium block">Mã Unicode</span>
              <span className="text-xs font-mono font-bold text-neutral-700">
                {selectedGlyphKey.length === 1
                  ? `U+${selectedGlyphKey.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 font-medium block">Trạng thái</span>
              <span className={`text-xs font-black ${customDesign?.svgPath ? 'text-emerald-600' : 'text-neutral-500'}`}>
                {customDesign?.svgPath ? 'Đã tùy biến' : 'Gốc font'}
              </span>
            </div>
          </div>
        </div>

        {/* THẺ 1: Nạp Vector SVG Ký Tự */}
<div className="space-y-1">
  <div className="flex items-center justify-between gap-1 flex-wrap">
    
    {/* Nút bên trái */}
    <button
      type="button"
      onClick={handleCopyOriginalSvg}
      className="text-[10px] font-bold text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer"
      title="Sao chép toàn bộ thẻ SVG ký tự gốc để dán vào Figma / Illustrator vẽ tiếp"
    >
      <Code2 className="w-2.5 h-2.5 text-neutral-500" />
      <span>Copy thẻ SVG</span>
    </button>

    {/* Label bên phải */}
    <label className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1 ml-0.5">
      <Upload className="w-2.5 h-2.5" />
      Tải lên SVG
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg"
        onChange={handleFileUpload}
        className="hidden"
      />
    </label>
  </div>

  <textarea
    rows={5}
    placeholder="Dán mã thẻ <svg>...</svg>, thẻ <path d='...'/> hoặc chuỗi tọa độ M... Z tại đây..."
    value={currentSvgPath}
    onChange={(e) => handleSvgInput(e.target.value)}
    className="w-full text-[10px] font-mono p-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900 transition resize-none text-neutral-900 leading-relaxed placeholder:text-neutral-400"
  />
          
        </div>

        {/* THẺ 2: Kích Thước (Scale) - Gồm Sliders & NumericInputs đồng bộ */}
        <div className="space-y-2 bg-neutral-50/70 p-2.5 rounded-xl border border-neutral-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800">Kích thước</span>
            <button
              type="button"
              onClick={() => setAspectLocked(!aspectLocked)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                aspectLocked
                  ? 'bg-neutral-900 dark:bg-amber-500 text-white  border-neutral-900  font-extrabold'
                  : 'bg-white dark:bg-[#282834] text-neutral-600  border-neutral-200  hover:border-neutral-400'
              }`}
              title="Khóa tỷ lệ đồng dạng X/Y"
            >
              {aspectLocked ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
              <span>{aspectLocked ? 'Khóa X/Y' : 'Tự do'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Scale X Card với Slider */}
            <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
                <span>Scale X</span>
                <NumericInput
                  size="sm"
                  value={Math.round(currentScaleX * 100)}
                  onChange={(val) => {
                    const newX = Number((val / 100).toFixed(3));
                    if (aspectLocked) {
                      onUpdateDesign({ scaleX: newX, scaleY: newX });
                    } else {
                      onUpdateDesign({ scaleX: newX });
                    }
                  }}
                  step={1}
                  min={10}
                  max={500}
                  unit="%"
                />
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.02"
                value={currentScaleX}
                onChange={(e) => {
                  const newX = parseFloat(e.target.value);
                  if (aspectLocked) {
                    onUpdateDesign({ scaleX: newX, scaleY: newX });
                  } else {
                    onUpdateDesign({ scaleX: newX });
                  }
                }}
                className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
            </div>

            {/* Scale Y Card với Slider */}
            <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
                <span>Scale Y</span>
                <NumericInput
                  size="sm"
                  value={Math.round(currentScaleY * 100)}
                  onChange={(val) => {
                    const newY = Number((val / 100).toFixed(3));
                    if (aspectLocked) {
                      onUpdateDesign({ scaleX: newY, scaleY: newY });
                    } else {
                      onUpdateDesign({ scaleY: newY });
                    }
                  }}
                  step={1}
                  min={10}
                  max={500}
                  unit="%"
                />
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.02"
                value={currentScaleY}
                onChange={(e) => {
                  const newY = parseFloat(e.target.value);
                  if (aspectLocked) {
                    onUpdateDesign({ scaleX: newY, scaleY: newY });
                  } else {
                    onUpdateDesign({ scaleY: newY });
                  }
                }}
                className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
            </div>
          </div>

          {/* Quick Fit Scale Buttons */}
          <div className="grid grid-cols-2 gap-1 pt-0.5">
            <button
              type="button"
              onClick={handleFitToCapHeight}
              className="py-1 px-1 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md text-[10px] font-bold transition cursor-pointer text-center truncate"
            >
              Vừa Cap-Height
            </button>

            <button
              type="button"
              onClick={handleFitToXHeight}
              className="py-1 px-1 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md text-[10px] font-bold transition cursor-pointer text-center truncate"
            >
              Vừa x-Height
            </button>
          </div>

          {/* Lật trục X & Lật trục Y (Flip X & Flip Y toggle buttons) */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-neutral-200/60">
            <button
              type="button"
              onClick={() => onUpdateDesign({ flipX: !currentFlipX })}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                currentFlipX
                  ? 'bg-neutral-900 text-amber-400 border-neutral-900 shadow-xs'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
              }`}
              title="Lật đối xứng qua trục dọc X (Click để lật, click lại để hoàn nguyên)"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>{currentFlipX ? 'Đã lật trục X' : 'Lật trục X'}</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateDesign({ flipY: !currentFlipY })}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                !currentFlipY
                  ? 'bg-neutral-900 text-amber-400 border-neutral-900 shadow-xs'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
              }`}
              title="Lật đối xứng qua trục ngang Y (Click để lật, click lại để hoàn nguyên)"
            >
              <FlipVertical className="w-3.5 h-3.5" />
              <span>{!currentFlipY ? 'Đã lật trục Y' : 'Lật trục Y'}</span>
            </button>
          </div>
        </div>

        {/* THẺ 3: Vị Trí & Căn Lề (Position) - Gồm Sliders & NumericInputs đồng bộ */}
        <div className="space-y-2 bg-neutral-50/70 p-2.5 rounded-xl border border-neutral-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800">Vị trí</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Offset X Card với Slider */}
            <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
                <span>Ngang (X)</span>
                <NumericInput
                  size="sm"
                  value={currentOffsetX}
                  onChange={(val) => onUpdateDesign({ offsetX: Math.round(val) })}
                  step={5}
                  min={-unitsPerEm}
                  max={unitsPerEm}
                  unit="px"
                />
              </div>
              <input
                type="range"
                min={-Math.round(unitsPerEm * 0.6)}
                max={Math.round(unitsPerEm * 0.6)}
                step="2"
                value={currentOffsetX}
                onChange={(e) => onUpdateDesign({ offsetX: parseInt(e.target.value, 10) })}
                className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
            </div>

            {/* Offset Y Card với Slider */}
            <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
                <span>Dọc (Y)</span>
                <NumericInput
                  size="sm"
                  value={currentOffsetY}
                  onChange={(val) => onUpdateDesign({ offsetY: Math.round(val) })}
                  step={5}
                  min={-unitsPerEm}
                  max={unitsPerEm}
                  unit="px"
                />
              </div>
              <input
                type="range"
                min={-Math.round(unitsPerEm * 0.6)}
                max={Math.round(unitsPerEm * 0.6)}
                step="2"
                value={currentOffsetY}
                onChange={(e) => onUpdateDesign({ offsetY: parseInt(e.target.value, 10) })}
                className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
            </div>
          </div>

          {/* Quick Alignment Actions */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleCenterInAdvanceWidth}
              className="flex items-center justify-center gap-1.5 py-1 px-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md text-[10px] font-bold transition cursor-pointer"
              title="Căn giữa theo độ rộng Advance Width"
            >
              <AlignHorizontalJustifyCenter className="w-3 h-3 text-neutral-600" />
              <span>Căn giữa chiều rộng</span>
            </button>

            <button
              type="button"
              onClick={handleAlignBottomBaseline}
              className="flex items-center justify-center gap-1.5 py-1 px-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-md text-[10px] font-bold transition cursor-pointer"
              title="Căn đáy chạm đường Baseline Y=0"
            >
              <AlignVerticalJustifyEnd className="w-3 h-3 text-neutral-600" />
              <span>Đáy = Baseline</span>
            </button>
          </div>
        </div>

        {/* THẺ 4: Độ Rộng Ký Tự (Advance Width & Sidebearings) */}
        <div className="space-y-2 bg-neutral-50/70 p-2.5 rounded-xl border border-neutral-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800">
              Độ rộng ký tự
            </span>
            <button
              type="button"
              onClick={handleAutoAdvanceWidth}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >              
              <span>Tự động tính</span>
            </button>
          </div>

          {/* Advance Width Control Box với Slider */}
          <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
              <span>Độ rộng</span>
              <div className="flex items-center gap-1">
                <NumericInput
                  size="sm"
                  value={currentAdvanceWidth}
                  onChange={(val) => onUpdateDesign({ advanceWidth: Math.max(10, Math.round(val)) })}
                  min={10}
                  max={unitsPerEm * 2}
                  step={10}
                  unit="UPM"
                />
                <button
                  type="button"
                  onClick={() => onUpdateDesign({ advanceWidth: originalAdvanceWidth })}
                  className="px-1.5 py-0.5 text-[9px] font-bold text-neutral-500 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded transition cursor-pointer"
                  title="Khôi phục độ rộng gốc của font"
                >
                  Gốc: {originalAdvanceWidth}
                </button>
              </div>
            </div>
            <input
              type="range"
              min="50"
              max={Math.max(unitsPerEm * 1.5, originalAdvanceWidth * 2)}
              step="5"
              value={currentAdvanceWidth}
              onChange={(e) => onUpdateDesign({ advanceWidth: Math.max(10, parseInt(e.target.value, 10)) })}
              className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
            />
          </div>

          {/* Realtime Metrics Summary Box */}
          <div className="grid grid-cols-3 gap-1.5 p-2 bg-white rounded-lg border border-neutral-200/70 text-[10px] font-mono text-center">
            <div>
              <span className="block text-neutral-500 text-[9px] font-sans font-medium">Left Sidebearing</span>
              <span className="font-bold text-neutral-900">{glyphMetrics.lsb}</span>
            </div>
            <div className="border-x border-neutral-200">
              <span className="block text-neutral-500 text-[9px] font-sans font-medium">Chiều rộng nét</span>
              <span className="font-bold text-neutral-900">{glyphMetrics.width}</span>
            </div>
            <div>
              <span className="block text-neutral-500 text-[9px] font-sans font-medium">Right Sidebearing</span>
              <span className="font-bold text-neutral-900">{glyphMetrics.rsb}</span>
            </div>
          </div>
        </div>

        {/* THẺ 5: Chế Độ Thay Thế Khi Xuất Font */}
        <div className="space-y-2 bg-neutral-50/70 p-2.5 rounded-xl border border-neutral-200/80">
          <span className="text-xs font-bold text-neutral-800 block">
            Thay thế ký tự 
          </span>

          <div className="space-y-1.5">
            {[
              {
                id: 'replace' as GlyphEditMode,
                title: 'Thay thế hoàn toàn ký tự cũ',                
              },
              {
                id: 'old_is_alt' as GlyphEditMode,
                title: 'Cho ký tự cũ là alt',                
              },
              {
                id: 'new_is_alt' as GlyphEditMode,
                title: 'Cho ký tự mới là alt',                
              }
            ].map((opt) => (
              <label
                key={opt.id}
                className={`flex items-start gap-2.5 p-2 rounded-lg border transition cursor-pointer ${
                  currentMode === opt.id
                    ? 'bg-neutral-950 text-white border-neutral-950 shadow-2xs'
                    : 'bg-white text-neutral-700 border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <input
                  type="radio"
                  name="glyph-edit-mode"
                  checked={currentMode === opt.id}
                  onChange={() => onUpdateDesign({ mode: opt.id })}
                  className="mt-0.5 accent-neutral-950 cursor-pointer"
                />
                <div className="min-w-0">
                  <span className={`block font-bold text-[11px] leading-tight ${currentMode === opt.id ? 'text-white' : 'text-neutral-900'}`}>
                    {opt.title}
                  </span>                  
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* THẺ 6: Các Thao Tác Cập Nhật & Reset */}
        <div className="pt-2 space-y-2">
         
          {customDesign && (
            <button
              type="button"
              onClick={onResetDesign}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white text-rose-700 border border-rose-200 rounded-lg font-bold text-xs hover:bg-rose-50 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục ký tự gốc</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
