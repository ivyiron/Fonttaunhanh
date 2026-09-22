import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as opentype from 'opentype.js';
import { ZoomIn, ZoomOut, RotateCcw, Copy, Sparkles, Layers } from 'lucide-react';
import { DiacriticTemplate, AutoPositionRules, FontMetadata } from '../../types';
import {
  parseSvgPath,
  transformCommands,
  getExactBoundingBox,
  removeDotFromICommands,
  calculateAutoPosition,
  getGroupReferenceHeights,
  VIETNAMESE_RECIPES,
  DEFAULT_DIACRITICS,
  getNativeCharSvgPath,
  getExtractedDiacriticSvgPathFromChar
} from '../../utils';

const APPLICABLE_CHARS: Record<string, string[]> = {
  acute: ['a', 'e', 'i', 'o', 'u', 'y'],
  grave: ['a', 'e', 'i', 'o', 'u', 'y'],
  hook: ['a', 'e', 'i', 'o', 'u', 'y'],
  tilde: ['a', 'e', 'i', 'o', 'u', 'y'],
  dot_below: ['a', 'e', 'i', 'o', 'u', 'y'],
  circumflex: ['a', 'e', 'o'],
  breve: ['a'],
  horn_o: ['o'],
  horn_u: ['u'],
  bar: ['d']
};

interface DiacriticCanvasProps {
  font: opentype.Font | null;
  fontMetadata: FontMetadata | null;
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  activeDiaId: string;
  isCapital?: boolean;
  onToggleCapital?: (val: boolean) => void;
}

export const DiacriticCanvas: React.FC<DiacriticCanvasProps> = ({
  font,
  fontMetadata,
  templates,
  rules,
  activeDiaId,
  isCapital: isCapitalProp,
  onToggleCapital
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBaseChar, setSelectedBaseChar] = useState<string>('a');
  const [internalIsCapital, setInternalIsCapital] = useState<boolean>(false);

  const isCapital = onToggleCapital !== undefined ? (isCapitalProp ?? false) : internalIsCapital;
  const setIsCapital = (val: boolean) => {
    if (onToggleCapital) {
      onToggleCapital(val);
    } else {
      setInternalIsCapital(val);
    }
  };

  const [showReference, setShowReference] = useState<boolean>(true);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'composed' | 'native' | 'overlay'>('composed');
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Keep selected base char in valid range for active diacritic
  useEffect(() => {
    const list = APPLICABLE_CHARS[activeDiaId] || ['a'];
    if (!list.includes(selectedBaseChar.toLowerCase())) {
      setSelectedBaseChar(list[0]);
    }
  }, [activeDiaId, selectedBaseChar]);

  // Observe container resizing for accurate dynamic canvas dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      }
    };

    updateSize();
    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const activeTemplate = templates[activeDiaId] || DEFAULT_DIACRITICS.find((d) => d.id === activeDiaId) || {
    id: activeDiaId,
    name: activeDiaId,
    svgPath: '',
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0
  };
  const refChar = isCapital ? selectedBaseChar.toUpperCase() : selectedBaseChar.toLowerCase();

  // Find corresponding composite character in font (e.g., 'a' + 'acute' = 'á' or 'Á')
  const testTargetChar = useMemo(() => {
    const normBase = refChar.toLowerCase();
    const isCap = refChar !== normBase;

    if (activeDiaId === 'bar') return isCap ? 'Đ' : 'đ';
    if (activeDiaId === 'horn_o' || (activeDiaId === 'horn' && normBase === 'o')) return isCap ? 'Ơ' : 'ơ';
    if (activeDiaId === 'horn_u' || (activeDiaId === 'horn' && normBase === 'u')) return isCap ? 'Ư' : 'ư';

    const match = VIETNAMESE_RECIPES.find((r) => {
      if (r.baseChar.toLowerCase() !== normBase) return false;
      if (r.components.length !== 1) return false;
      const c = r.components[0];
      if (c === activeDiaId) return true;
      if (activeDiaId === 'horn' && (c === 'horn_o' || c === 'horn_u')) return true;
      return false;
    });

    if (!match) return null;
    return isCap ? match.char.toUpperCase() : match.char.toLowerCase();
  }, [refChar, activeDiaId]);

  const testNativeGlyph = useMemo(() => {
    if (!font || !testTargetChar) return null;
    const idx = font.charToGlyphIndex(testTargetChar);
    if (idx <= 0) return null;
    const g = font.glyphs.get(idx);
    return g && g.path && g.path.commands && g.path.commands.length > 0 ? g : null;
  }, [font, testTargetChar]);

  const isNativeAvailable = !!testNativeGlyph;

  // Wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom((prev) => Math.min(3.5, Math.max(0.5, Math.round((prev + delta) * 10) / 10)));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !font) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container ? container.getBoundingClientRect() : canvas.getBoundingClientRect();
    const cssWidth = Math.max(280, Math.floor(rect.width || canvas.clientWidth || 400));
    const cssHeight = Math.max(260, Math.floor(rect.height || canvas.clientHeight || 400));
    const dpr = Math.max(2, window.devicePixelRatio || 1);

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // Subtle background
    ctx.fillStyle = isDarkMode ? '#1b1b24' : '#fafafa';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // Grid dots
    ctx.fillStyle = isDarkMode ? '#2e2e3c' : '#e2e8f0';
    for (let x = 15; x < cssWidth; x += 24) {
      for (let y = 15; y < cssHeight; y += 24) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const ascender = fontMetadata?.ascender || font.ascender || 800;
    const descender = fontMetadata?.descender || font.descender || -200;
    const capHeight = fontMetadata?.capHeight || Math.round(ascender * 0.9);
    const xHeight = fontMetadata?.xHeight || Math.round(ascender * 0.55);
    const upm = fontMetadata?.unitsPerEm || font.unitsPerEm || 1000;

    const padding = 45;
    const drawHeight = (cssHeight - padding * 2) * zoom;
    const scaleFactor = drawHeight / Math.max(1, ascender - descender);
    const centerX = cssWidth / 2;
    const centerY = cssHeight / 2;

    const baseGlyph = font.charToGlyph(refChar);
    const advanceWidth = baseGlyph ? baseGlyph.advanceWidth : 500;
    const fontStartX = centerX - (advanceWidth / 2) * scaleFactor;
    const baselineY = centerY + ((ascender + descender) / 2) * scaleFactor;

    // Draw Guidelines
    if (showGuides) {
      const drawHGuide = (yVal: number, label: string, color: string, isDashed = true, isBaseline = false) => {
        const yCanvas = baselineY - yVal * scaleFactor;
        ctx.beginPath();
        if (isDashed) ctx.setLineDash([4, 4]);
        else ctx.setLineDash([]);
        ctx.strokeStyle = color;
        ctx.lineWidth = isBaseline ? 1.5 : 1;
        ctx.moveTo(15, yCanvas);
        ctx.lineTo(cssWidth - 15, yCanvas);
        ctx.stroke();

        ctx.font = '500 10px monospace';
        const labelText = `${label} (${Math.round(yVal)})`;
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = isDarkMode ? 'rgba(18, 18, 21, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        
        ctx.fillStyle = color;
        ctx.fillText(labelText, 20, yCanvas - 4);
      };

      drawHGuide(ascender, 'Ascender', '#059669', true);
      drawHGuide(capHeight, 'Cap Height', '#2563eb', true);
      drawHGuide(xHeight, 'x-Height', '#7c3aed', true);
      drawHGuide(0, 'Baseline', isDarkMode ? '#f4f4f5' : '#0f172a', false, true);
      drawHGuide(descender, 'Descender', '#e11d48', true);

      // Vertical guides
      const drawVGuide = (xVal: number, label: string, color: string) => {
        const xCanvas = fontStartX + xVal * scaleFactor;
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.moveTo(xCanvas, 10);
        ctx.lineTo(xCanvas, cssHeight - 10);
        ctx.stroke();

        const labelText = `${label} (${Math.round(xVal)})`;
        ctx.font = '500 10px monospace';
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.fillStyle = color;
        ctx.fillText(labelText, xCanvas + 5, cssHeight - 10);
      };

      drawVGuide(0, 'LSB', '#64748b');
      drawVGuide(advanceWidth, 'RSB', '#64748b');
    }

    let baseBBox = baseGlyph ? baseGlyph.getBoundingBox() : { x1: 50, y1: 0, x2: 450, y2: xHeight };
    if (refChar === 'i' && baseGlyph) {
      const dotlessCmds = removeDotFromICommands(baseGlyph.path.commands);
      const tightBox = getExactBoundingBox(dotlessCmds);
      baseBBox = { x1: tightBox.xMin, y1: tightBox.yMin, x2: tightBox.xMax, y2: tightBox.yMax };
    }

    // Render Native Glyph if native or overlay mode
    if ((viewMode === 'native' || viewMode === 'overlay') && isNativeAvailable && testNativeGlyph) {
      const nativePath = testNativeGlyph.getPath(fontStartX, baselineY, scaleFactor * upm);
      nativePath.fill = viewMode === 'overlay' ? 'rgba(245, 158, 11, 0.35)' : (isDarkMode ? '#f4f4f5' : '#0f172a');
      nativePath.stroke = viewMode === 'overlay' ? '#d97706' : (isDarkMode ? '#e4e4e7' : '#020617');
      nativePath.lineWidth = 1.5;
      nativePath.draw(ctx);
    }

    // Draw reference letter outline and composed diacritic
    if (viewMode === 'composed' || viewMode === 'overlay' || !isNativeAvailable) {
      // Reference letter outline
      if (showReference && baseGlyph) {
        ctx.setLineDash([]);
        let fontPath: any;
        if (refChar === 'i') {
          const dotlessCmds = removeDotFromICommands(baseGlyph.path.commands);
          fontPath = new opentype.Path();
          dotlessCmds.forEach((cmd: any) => {
            if (cmd.type === 'M') fontPath.moveTo(fontStartX + cmd.x * scaleFactor, baselineY - cmd.y * scaleFactor);
            else if (cmd.type === 'L') fontPath.lineTo(fontStartX + cmd.x * scaleFactor, baselineY - cmd.y * scaleFactor);
            else if (cmd.type === 'Q') fontPath.quadTo(fontStartX + cmd.x1 * scaleFactor, baselineY - cmd.y1 * scaleFactor, fontStartX + cmd.x * scaleFactor, baselineY - cmd.y * scaleFactor);
            else if (cmd.type === 'C') fontPath.curveTo(fontStartX + cmd.x1 * scaleFactor, baselineY - cmd.y1 * scaleFactor, fontStartX + cmd.x2 * scaleFactor, baselineY - cmd.y2 * scaleFactor, fontStartX + cmd.x * scaleFactor, baselineY - cmd.y * scaleFactor);
            else if (cmd.type === 'Z') fontPath.closePath();
          });
        } else {
          fontPath = baseGlyph.getPath(fontStartX, baselineY, scaleFactor * upm);
        }

        fontPath.fill = viewMode === 'overlay' ? (isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.25)') : (isDarkMode ? '#f4f4f5' : '#0f172a');
        fontPath.stroke = viewMode === 'overlay' ? (isDarkMode ? 'rgba(148, 163, 184, 0.5)' : 'rgba(71, 85, 105, 0.5)') : (isDarkMode ? '#e4e4e7' : 'rgba(71, 85, 105, 0.7)');
        fontPath.lineWidth = 1;
        fontPath.draw(ctx);

        // Center line of base character
        if (showGuides) {
          const baseXCenter = (baseBBox.x1 + baseBBox.x2) / 2;
          const baseXCanvas = fontStartX + baseXCenter * scaleFactor;
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(baseXCanvas, 15);
          ctx.lineTo(baseXCanvas, cssHeight - 15);
          ctx.stroke();
        }
      }

      // Draw composed diacritic mark
      if (activeTemplate) {
        const useCapVariant = isCapital && activeTemplate.hasCapVariant;
        const svgPathToUse = useCapVariant && activeTemplate.capSvgPath ? activeTemplate.capSvgPath : activeTemplate.svgPath;
        const scaleXToUse = useCapVariant && activeTemplate.capScaleX !== undefined ? activeTemplate.capScaleX : activeTemplate.scaleX;
        const scaleYToUse = useCapVariant && activeTemplate.capScaleY !== undefined ? activeTemplate.capScaleY : activeTemplate.scaleY;
        const offsetXToUse = useCapVariant && activeTemplate.capOffsetX !== undefined ? activeTemplate.capOffsetX : activeTemplate.offsetX;
        const offsetYToUse = useCapVariant && activeTemplate.capOffsetY !== undefined ? activeTemplate.capOffsetY : activeTemplate.offsetY;
        const autoCenterXToUse = useCapVariant && activeTemplate.capAutoCenterX !== undefined ? activeTemplate.capAutoCenterX : (activeTemplate.autoCenterX !== false);

        const rawCmds = parseSvgPath(svgPathToUse);
        if (rawCmds.length > 0) {
          const templateTransformed = transformCommands(rawCmds, scaleXToUse, scaleYToUse, 0, 0, true);
          const diaBBox = getExactBoundingBox(templateTransformed);
          const groupHeights = getGroupReferenceHeights(font);
          const autoPos = calculateAutoPosition(
            activeDiaId,
            baseBBox,
            diaBBox,
            rules,
            isCapital,
            undefined,
            groupHeights,
            refChar
          );

          const finalOffsetX = autoPos.offsetX + (autoCenterXToUse ? 0 : offsetXToUse);
          const finalOffsetY = autoPos.offsetY + offsetYToUse;

          const finalCmds = transformCommands(
            templateTransformed,
            autoPos.scaleX,
            autoPos.scaleY,
            finalOffsetX,
            finalOffsetY,
            false
          );

          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.strokeStyle = viewMode === 'overlay' ? (isDarkMode ? '#fbbf24' : '#0f172a') : (isDarkMode ? '#f59e0b' : '#020617');
          ctx.fillStyle = viewMode === 'overlay' ? (isDarkMode ? 'rgba(251, 191, 36, 0.9)' : 'rgba(15, 23, 42, 0.85)') : (isDarkMode ? '#fbbf24' : '#0f172a');
          ctx.lineWidth = 1.5;

          finalCmds.forEach((cmd) => {
            const cx = fontStartX + cmd.x * scaleFactor;
            const cy = baselineY - cmd.y * scaleFactor;

            if (cmd.type === 'M') ctx.moveTo(cx, cy);
            else if (cmd.type === 'L') ctx.lineTo(cx, cy);
            else if (cmd.type === 'Q') {
              const cx1 = fontStartX + cmd.x1 * scaleFactor;
              const cy1 = baselineY - cmd.y1 * scaleFactor;
              ctx.quadraticCurveTo(cx1, cy1, cx, cy);
            } else if (cmd.type === 'C') {
              const cx1 = fontStartX + cmd.x1 * scaleFactor;
              const cy1 = baselineY - cmd.y1 * scaleFactor;
              const cx2 = fontStartX + cmd.x2 * scaleFactor;
              const cy2 = baselineY - cmd.y2 * scaleFactor;
              ctx.bezierCurveTo(cx1, cy1, cx2, cy2, cx, cy);
            } else if (cmd.type === 'Z') ctx.closePath();
          });

          ctx.fill();
          ctx.stroke();

          // Diacritic center marker
          if (showGuides) {
            const finalDiaBBox = getExactBoundingBox(finalCmds);
            const diaCenter = (finalDiaBBox.xMin + finalDiaBBox.xMax) / 2;
            const diaCenterCanvas = fontStartX + diaCenter * scaleFactor;
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(diaCenterCanvas, 15);
            ctx.lineTo(diaCenterCanvas, cssHeight - 15);
            ctx.stroke();
          }
        }
      }
    }

    // Overlay legend
    if (viewMode === 'overlay' && isNativeAvailable) {
      const legendText = isDarkMode ? '🟧 Design gốc font   |   ⬜ Dấu design mới' : '🟧 Design gốc font   |   ⬛ Dấu design mới';
      ctx.font = 'bold 10px sans-serif';
      const textW = ctx.measureText(legendText).width;
      ctx.fillStyle = isDarkMode ? 'rgba(28, 28, 38, 0.95)' : 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(cssWidth / 2 - textW / 2 - 8, 10, textW + 16, 20);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.strokeRect(cssWidth / 2 - textW / 2 - 8, 10, textW + 16, 20);
      ctx.fillStyle = isDarkMode ? '#f4f4f5' : '#1e293b';
      ctx.fillText(legendText, cssWidth / 2 - textW / 2, 24);
    }

    ctx.restore();
  }, [font, fontMetadata, templates, rules, activeDiaId, zoom, showReference, showGuides, isCapital, selectedBaseChar, viewMode, isNativeAvailable, testNativeGlyph, containerSize, isDarkMode]);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/40">
            {activeTemplate?.name || activeDiaId}
          </span>
        </div>

        {/* Action Toggles: Reference & Guides & Zoom */}
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showReference}
              onChange={(e) => setShowReference(e.target.checked)}
              className="w-3.5 h-3.5 accent-neutral-900 dark:accent-amber-500 rounded cursor-pointer"
            />
            <span>Hiện chữ gốc</span>
          </label>

          <button
            type="button"
            onClick={() => setShowGuides(!showGuides)}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition cursor-pointer ${
              showGuides
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50'
                : 'bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {showGuides ? '✓ Đường gióng' : 'Đường gióng'}
          </button>

          {/* Zoom buttons */}
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10))}
              className="p-1 hover:bg-white dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-md transition cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-[10px] text-neutral-900 dark:text-neutral-100 px-1 min-w-[32px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3.5, Math.round((prev + 0.1) * 10) / 10))}
              className="p-1 hover:bg-white dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-md transition cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom !== 1.0 && (
              <button
                type="button"
                onClick={() => setZoom(1.0)}
                className="p-1 hover:bg-white dark:hover:bg-neutral-700 text-neutral-500 dark:text-amber-400 hover:text-neutral-900 dark:hover:text-amber-300 rounded-md transition cursor-pointer"
                title="Reset zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-bar: Base Character selector & Case & View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-50 dark:bg-[#1e1e26] p-2 rounded-xl border border-neutral-200/80 dark:border-[#353545]">
        {/* Applicable base chars */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">Chữ gốc:</span>
          <div className="flex items-center gap-1">
            {(APPLICABLE_CHARS[activeDiaId] || ['a']).map((char) => {
              const displayChar = isCapital ? char.toUpperCase() : char.toLowerCase();
              const isSel = selectedBaseChar.toLowerCase() === char.toLowerCase();
              return (
                <button
                  key={char}
                  type="button"
                  onClick={() => setSelectedBaseChar(char)}
                  className={`w-6 h-6 text-xs font-bold rounded-md border transition flex items-center justify-center cursor-pointer ${
                    isSel
                      ? 'bg-neutral-950 text-white border-neutral-950 dark:bg-amber-500 dark:text-neutral-950 dark:border-amber-400 font-black shadow-2xs'
                      : 'bg-white dark:bg-[#282834] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-[#3e3e50] hover:border-neutral-400 dark:hover:border-neutral-500'
                  }`}
                >
                  {displayChar}
                </button>
              );
            })}
          </div>
          {/* Case Toggle */}
          <div className="flex items-center bg-neutral-200/70 dark:bg-[#282834] p-0.5 rounded-lg border border-neutral-200 dark:border-[#3e3e50] text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setIsCapital(false)}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                !isCapital 
                  ? 'bg-white dark:bg-amber-500 text-neutral-950 dark:text-neutral-950 shadow-2xs font-extrabold' 
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              thường
            </button>
            <button
              type="button"
              onClick={() => setIsCapital(true)}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                isCapital 
                  ? 'bg-white dark:bg-amber-500 text-neutral-950 dark:text-neutral-950 shadow-2xs font-extrabold' 
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              HOA
            </button>
          </div>
        </div>

        {/* View Mode (if native glyph available) */}
        {isNativeAvailable ? (
          <div className="flex items-center p-0.5 bg-amber-100/80 dark:bg-[#282834] rounded-lg border border-amber-300/80 dark:border-[#3e3e50] text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('composed')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                viewMode === 'composed' 
                  ? 'bg-white dark:bg-amber-500 text-neutral-950 dark:text-neutral-950 shadow-2xs font-extrabold' 
                  : 'text-amber-900 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              Dấu design
            </button>
            <button
              type="button"
              onClick={() => setViewMode('native')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                viewMode === 'native' 
                  ? 'bg-white dark:bg-amber-500 text-neutral-950 dark:text-neutral-950 shadow-2xs font-extrabold' 
                  : 'text-amber-900 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              Font gốc ({testTargetChar})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('overlay')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                viewMode === 'overlay' 
                  ? 'bg-amber-900 dark:bg-amber-500 text-white dark:text-neutral-950 shadow-2xs font-extrabold' 
                  : 'text-amber-900 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              Overlay
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-neutral-400 dark:text-neutral-400 font-mono">
            Tự ghép: {testTargetChar || refChar}
          </span>
        )}
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="relative flex-1 min-h-[300px] border border-neutral-200/90 dark:border-[#353545] rounded-2xl bg-neutral-50 dark:bg-[#1b1b24] overflow-hidden shadow-inner flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Subtle Bottom Bar on Canvas */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
          <div className="bg-white/90 dark:bg-[#262632]/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-neutral-200/80 dark:border-[#3a3a4c] text-neutral-700 dark:text-neutral-200 shadow-xs">
            {isCapital ? 'Chữ Hoa' : 'Chữ thường'}: <strong className="text-amber-600 dark:text-amber-400">{refChar}</strong> | Ký tự kết quả:{' '}
            <strong className="text-indigo-600 dark:text-cyan-400">{testTargetChar || refChar}</strong>
          </div>

          {copyToast && (
            <div className="bg-neutral-950 text-white px-2.5 py-1 rounded-md text-xs shadow-md">
              {copyToast}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
