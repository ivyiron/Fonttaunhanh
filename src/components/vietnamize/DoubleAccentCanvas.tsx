import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as opentype from 'opentype.js';
import { ZoomIn, ZoomOut, RotateCcw, Copy, Sparkles } from 'lucide-react';
import { DiacriticTemplate, AutoPositionRules, FontMetadata, GlyphOverrideState } from '../../types';
import {
  composeGlyphPath,
  VIETNAMESE_RECIPES,
  getNativeCharSvgPath,
  getExtractedDiacriticSvgPathFromChar
} from '../../utils';

interface DoubleAccentCanvasProps {
  font: opentype.Font | null;
  fontMetadata: FontMetadata | null;
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  selectedChar: string;
  override?: GlyphOverrideState;
}

export const DoubleAccentCanvas: React.FC<DoubleAccentCanvasProps> = ({
  font,
  fontMetadata,
  templates,
  rules,
  selectedChar,
  override
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
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

  const activeRecipe = VIETNAMESE_RECIPES.find((r) => r.char === selectedChar);

  // ResizeObserver for canvas container
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

  const isNativeAvailable = useMemo(() => {
    if (!font) return false;
    const idx = font.charToGlyphIndex(selectedChar);
    if (idx <= 0) return false;
    const g = font.glyphs.get(idx);
    return !!(g && g.path && g.path.commands && g.path.commands.length > 0);
  }, [font, selectedChar]);

  // Wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoomLevel((prev) => Math.min(3.5, Math.max(0.5, Math.round((prev + delta) * 10) / 10)));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !font) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const recipe = activeRecipe || VIETNAMESE_RECIPES.find((r) => r.char === selectedChar);
    if (!recipe) return;

    const rect = container ? container.getBoundingClientRect() : canvas.getBoundingClientRect();
    const cssWidth = Math.max(280, Math.floor(rect.width || canvas.clientWidth || 400));
    const cssHeight = Math.max(260, Math.floor(rect.height || canvas.clientHeight || 400));
    const dpr = Math.max(2, window.devicePixelRatio || 1);

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // Canvas background
    ctx.fillStyle = isDarkMode ? '#1b1b24' : '#fafafa';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // Subtle dots
    ctx.fillStyle = isDarkMode ? '#2e2e3c' : '#e2e8f0';
    for (let x = 15; x < cssWidth; x += 24) {
      for (let y = 15; y < cssHeight; y += 24) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    try {
      const { path, advanceWidth } = composeGlyphPath(font, recipe, templates, rules, override, false);

      let xMin = Infinity;
      let xMax = -Infinity;
      if (path && path.commands) {
        path.commands.forEach((cmd: any) => {
          if (cmd.x !== undefined) {
            if (cmd.x < xMin) xMin = cmd.x;
            if (cmd.x > xMax) xMax = cmd.x;
          }
          if (cmd.x1 !== undefined) {
            if (cmd.x1 < xMin) xMin = cmd.x1;
            if (cmd.x1 > xMax) xMax = cmd.x1;
          }
          if (cmd.x2 !== undefined) {
            if (cmd.x2 < xMin) xMin = cmd.x2;
            if (cmd.x2 > xMax) xMax = cmd.x2;
          }
        });
      }
      const glyphCenterX = xMin !== Infinity && xMax !== -Infinity ? (xMin + xMax) / 2 : advanceWidth / 2;

      const ascender = fontMetadata?.ascender || font.ascender || 800;
      const descender = fontMetadata?.descender || font.descender || -200;

      const padding = 35;
      const drawHeight = (cssHeight - padding * 2) * zoomLevel;
      const scaleFactor = drawHeight / Math.max(1, ascender - descender);
      const fontStartX = cssWidth / 2 - glyphCenterX * scaleFactor;
      const baselineY = cssHeight / 2 + ((ascender + descender) / 2) * scaleFactor;

      const targetGlyphIdx = font ? font.charToGlyphIndex(selectedChar) : 0;
      const nativeGlyph = targetGlyphIdx > 0 ? font.glyphs.get(targetGlyphIdx) : null;

      // Draw Guidelines
      if (showGuides) {
        // Baseline (Emerald)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(10, baselineY);
        ctx.lineTo(cssWidth - 10, baselineY);
        ctx.stroke();

        // Cap height
        const capY = baselineY - ascender * scaleFactor;
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(10, capY);
        ctx.lineTo(cssWidth - 10, capY);
        ctx.stroke();

        // Center line
        const centerX = cssWidth / 2;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(centerX, 10);
        ctx.lineTo(centerX, cssHeight - 10);
        ctx.stroke();

        ctx.setLineDash([]);
      }

      const upm = fontMetadata.unitsPerEm;

      // Native glyph
      if ((viewMode === 'native' || viewMode === 'overlay') && isNativeAvailable && nativeGlyph) {
        const nativePath = nativeGlyph.getPath(fontStartX, baselineY, scaleFactor * upm);
        nativePath.fill = viewMode === 'overlay' ? 'rgba(245, 158, 11, 0.35)' : (isDarkMode ? '#f4f4f5' : '#0f172a');
        nativePath.stroke = viewMode === 'overlay' ? '#d97706' : (isDarkMode ? '#e4e4e7' : '#020617');
        nativePath.lineWidth = 1.5;
        nativePath.draw(ctx);
      }

      // Composed glyph
      if (viewMode === 'composed' || viewMode === 'overlay' || !isNativeAvailable) {
        ctx.beginPath();
        ctx.fillStyle = viewMode === 'overlay' ? (isDarkMode ? 'rgba(251, 191, 36, 0.9)' : 'rgba(15, 23, 42, 0.85)') : (isDarkMode ? '#f4f4f5' : '#0f172a');
        ctx.strokeStyle = viewMode === 'overlay' ? (isDarkMode ? '#fbbf24' : '#0f172a') : (isDarkMode ? '#e4e4e7' : '#020617');
        ctx.lineWidth = 1.2;

        path.commands.forEach((cmd: any) => {
          if (cmd.type === 'M') ctx.moveTo(fontStartX + cmd.x * scaleFactor, baselineY - cmd.y * scaleFactor);
          else if (cmd.type === 'L') ctx.lineTo(fontStartX + cmd.x * scaleFactor, baselineY - cmd.y * scaleFactor);
          else if (cmd.type === 'Q') ctx.quadraticCurveTo(fontStartX + cmd.x1 * scaleFactor, baselineY - cmd.y1 * scaleFactor, fontStartX + cmd.x * scaleFactor, baselineY - cmd.y * scaleFactor);
          else if (cmd.type === 'C') ctx.bezierCurveTo(fontStartX + cmd.x1 * scaleFactor, baselineY - cmd.y1 * scaleFactor, fontStartX + cmd.x2 * scaleFactor, baselineY - cmd.y2 * scaleFactor, fontStartX + cmd.x * scaleFactor, baselineY - cmd.y * scaleFactor);
          else if (cmd.type === 'Z') ctx.closePath();
        });
        ctx.fill();
        ctx.stroke();
      }

      // Overlay legend
      if (viewMode === 'overlay' && isNativeAvailable) {
        const legendText = '🟧 Design gốc font   |   ⬛ Dấu ghép mẫu';
        ctx.font = 'bold 9px sans-serif';
        const textW = ctx.measureText(legendText).width;
        ctx.fillStyle = isDarkMode ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(cssWidth / 2 - textW / 2 - 6, 8, textW + 12, 18);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.strokeRect(cssWidth / 2 - textW / 2 - 6, 8, textW + 12, 18);
        ctx.fillStyle = isDarkMode ? '#f4f4f5' : '#1e293b';
        ctx.fillText(legendText, cssWidth / 2 - textW / 2, 20);
      }
    } catch (e) {
      console.error('Failed to render double accent stage canvas', e);
    } finally {
      ctx.restore();
    }
  }, [font, fontMetadata, templates, rules, selectedChar, override, showGuides, zoomLevel, viewMode, activeRecipe, isNativeAvailable, containerSize, isDarkMode]);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Liveview dấu kép:
          </span>
          <span className="text-sm font-mono font-bold bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 px-2.5 py-0.5 rounded-md shadow-xs">
            {selectedChar}
          </span>
        </div>

        {/* View mode & Guides & Zoom */}
        <div className="flex items-center gap-2 text-xs">
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

          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10))}
              className="p-1 hover:bg-white dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-md transition cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-[10px] text-neutral-900 dark:text-neutral-100 px-1 min-w-[32px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(3.5, Math.round((prev + 0.1) * 10) / 10))}
              className="p-1 hover:bg-white dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-md transition cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 1.0 && (
              <button
                type="button"
                onClick={() => setZoomLevel(1.0)}
                className="p-1 hover:bg-white dark:hover:bg-neutral-700 text-neutral-500 dark:text-amber-400 hover:text-neutral-900 dark:hover:text-amber-300 rounded-md transition cursor-pointer"
                title="Reset zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Secondary bar: Native comparison info & 3-way toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-50 dark:bg-[#1e1e26] p-2 rounded-xl border border-neutral-200/80 dark:border-[#353545] text-xs">
        {isNativeAvailable ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
            <span className="text-[11px] font-extrabold text-amber-950 dark:text-amber-300">
              Font gốc ĐÃ CÓ chữ "{selectedChar}"
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
              Chưa có trong font gốc (Ghép tự động)
            </span>
          </div>
        )}

        {/* View toggle & Copy buttons */}
        <div className="flex items-center gap-1.5">
          {isNativeAvailable && (
            <div className="flex p-0.5 bg-amber-100/80 dark:bg-[#282834] rounded-lg border border-amber-300/60 dark:border-[#3e3e50] text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setViewMode('composed')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  viewMode === 'composed' 
                    ? 'bg-white dark:bg-amber-500 text-neutral-900 dark:text-neutral-950 font-extrabold shadow-2xs' 
                    : 'text-amber-900 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                Tự ghép
              </button>
              <button
                type="button"
                onClick={() => setViewMode('native')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  viewMode === 'native' 
                    ? 'bg-white dark:bg-amber-500 text-neutral-900 dark:text-neutral-950 font-extrabold shadow-2xs' 
                    : 'text-amber-900 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                Gốc
              </button>
              <button
                type="button"
                onClick={() => setViewMode('overlay')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  viewMode === 'overlay' 
                    ? 'bg-amber-900 dark:bg-amber-500 text-white dark:text-neutral-950 font-extrabold shadow-2xs' 
                    : 'text-amber-900 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                2 Lớp
              </button>
            </div>
          )}

          {font && (
            <button
              type="button"
              onClick={() => {
                const p = getNativeCharSvgPath(font, selectedChar);
                if (p) {
                  navigator.clipboard.writeText(p);
                  setCopyToast(`Đã copy path '${selectedChar}'`);
                  setTimeout(() => setCopyToast(null), 3000);
                }
              }}
              className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-[#282834] text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-[#3e3e50] hover:border-neutral-400 dark:hover:border-neutral-400 rounded-md transition cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Copy SVG path của ký tự này"
            >
              <Copy className="w-2.5 h-2.5 text-neutral-500 dark:text-amber-400" />
              Copy
            </button>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="relative flex-1 min-h-[300px] border border-neutral-200/90 dark:border-[#353545] rounded-2xl bg-neutral-50 dark:bg-[#1b1b24] overflow-hidden shadow-inner flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Legend info tag */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
          <div className="bg-neutral-900/85 dark:bg-[#262632]/95 text-white px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-2 border border-transparent dark:border-[#3e3e50] shadow-md">
            <span>Nón/Mũ: <strong className="text-amber-300">{activeRecipe?.components[0]}</strong></span>
            <span>•</span>
            <span>Thanh: <strong className="text-cyan-300">{activeRecipe?.components[1]}</strong></span>
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
