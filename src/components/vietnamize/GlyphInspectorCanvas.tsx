import React, { useEffect, useRef, useState } from 'react';
import * as opentype from 'opentype.js';
import { ZoomIn, ZoomOut, RotateCcw, Copy } from 'lucide-react';
import { DiacriticTemplate, AutoPositionRules, GlyphOverrideState, FontMetadata } from '../../types';
import { composeGlyphPath, VIETNAMESE_RECIPES, getNativeCharSvgPath } from '../../utils';

interface GlyphInspectorCanvasProps {
  font: opentype.Font | null;
  fontMetadata: FontMetadata | null;
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  overrides: Record<string, GlyphOverrideState>;
  selectedChar: string;
}

export const GlyphInspectorCanvas: React.FC<GlyphInspectorCanvasProps> = ({
  font,
  fontMetadata,
  templates,
  rules,
  overrides,
  selectedChar
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1.0);
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

  const recipe = VIETNAMESE_RECIPES.find((r) => r.char === selectedChar);
  const override = overrides[selectedChar];

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

    // Background
    ctx.fillStyle = isDarkMode ? '#1b1b24' : '#fafafa';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // Subtle dots grid
    ctx.fillStyle = isDarkMode ? '#2e2e3c' : '#e2e8f0';
    for (let x = 15; x < cssWidth; x += 24) {
      for (let y = 15; y < cssHeight; y += 24) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    try {
      let finalPath: any;
      let finalAdvanceWidth = 500;

      if (recipe) {
        const comp = composeGlyphPath(font, recipe, templates, rules, override, false);
        finalPath = comp.path;
        finalAdvanceWidth = comp.advanceWidth;
      } else {
        const g = font.charToGlyph(selectedChar);
        if (g) {
          finalPath = g.path;
          finalAdvanceWidth = g.advanceWidth;
        }
      }

      if (!finalPath) return;

      let xMin = Infinity;
      let xMax = -Infinity;
      if (finalPath.commands) {
        finalPath.commands.forEach((cmd: any) => {
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
      const glyphCenterX = xMin !== Infinity && xMax !== -Infinity ? (xMin + xMax) / 2 : finalAdvanceWidth / 2;

      const ascender = fontMetadata?.ascender || font.ascender || 800;
      const descender = fontMetadata?.descender || font.descender || -200;
      const capHeight = fontMetadata?.capHeight || Math.round(ascender * 0.9);
      const xHeight = fontMetadata?.xHeight || Math.round(ascender * 0.55);

      const padding = 40;
      const drawHeight = (cssHeight - padding * 2) * zoom;
      const scaleFactor = drawHeight / Math.max(1, ascender - descender);
      const fontStartX = cssWidth / 2 - glyphCenterX * scaleFactor;
      const baselineY = cssHeight / 2 + ((ascender + descender) / 2) * scaleFactor;

      // Draw Guidelines
      if (showGuides) {
        const drawHGuide = (yVal: number, label: string, color: string, isDashed = true, isBaseline = false) => {
          const yCanvas = baselineY - yVal * scaleFactor;
          ctx.beginPath();
          if (isDashed) ctx.setLineDash([4, 4]);
          else ctx.setLineDash([]);
          ctx.strokeStyle = color;
          ctx.lineWidth = isBaseline ? 1.5 : 1;
          ctx.moveTo(8, yCanvas);
          ctx.lineTo(cssWidth - 8, yCanvas);
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

        // Vertical guides (LSB, RSB)
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
          ctx.fillStyle = isDarkMode ? 'rgba(18, 18, 21, 0.9)' : 'rgba(255, 255, 255, 0.9)';
          
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.5;
          
          ctx.fillStyle = color;
          ctx.fillText(labelText, xCanvas + 5, cssHeight - 10);
        };

        drawVGuide(0, 'LSB', '#64748b');
        drawVGuide(finalAdvanceWidth, 'RSB', '#64748b');

        // Center line
        const centerX = cssWidth / 2;
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX, 10);
        ctx.lineTo(centerX, cssHeight - 10);
        ctx.stroke();
      }

      // Draw Glyph
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.fillStyle = isDarkMode ? '#f4f4f5' : '#0f172a';
      ctx.strokeStyle = isDarkMode ? '#e4e4e7' : '#020617';
      ctx.lineWidth = 1.2;

      finalPath.commands.forEach((cmd: any) => {
        if (cmd.type === 'M') ctx.moveTo(fontStartX + cmd.x * scaleFactor, baselineY - cmd.y * scaleFactor);
        else if (cmd.type === 'L') ctx.lineTo(fontStartX + cmd.x * scaleFactor, baselineY - cmd.y * scaleFactor);
        else if (cmd.type === 'Q') ctx.quadraticCurveTo(fontStartX + cmd.x1 * scaleFactor, baselineY - cmd.y1 * scaleFactor, fontStartX + cmd.x * scaleFactor, baselineY - cmd.y * scaleFactor);
        else if (cmd.type === 'C') ctx.bezierCurveTo(fontStartX + cmd.x1 * scaleFactor, baselineY - cmd.y1 * scaleFactor, fontStartX + cmd.x2 * scaleFactor, baselineY - cmd.y2 * scaleFactor, fontStartX + cmd.x * scaleFactor, baselineY - cmd.y * scaleFactor);
        else if (cmd.type === 'Z') ctx.closePath();
      });

      ctx.fill();
      ctx.stroke();
    } catch (e) {
      console.error('Error drawing glyph canvas', e);
    } finally {
      ctx.restore();
    }
  }, [font, fontMetadata, templates, rules, overrides, selectedChar, recipe, override, showGuides, zoom, containerSize, isDarkMode]);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Liveview ký tự:
          </span>
          <span className="text-base font-bold font-mono bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 px-2.5 py-0.5 rounded-md shadow-xs">
            {selectedChar}
          </span>
          {recipe && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              (Gốc: <strong className="text-amber-600 dark:text-amber-400">{recipe.baseChar}</strong> + Dấu: <span className="text-indigo-600 dark:text-indigo-400">{recipe.components.join(', ')}</span>)
            </span>
          )}
        </div>

        {/* Guides & Zoom */}
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

        {/* Bottom Tag */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
          <div className="bg-white/90 dark:bg-[#262632]/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-neutral-200 dark:border-[#3a3a4c] text-neutral-700 dark:text-neutral-200 shadow-xs flex items-center gap-2">
            <span className={override?.isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-neutral-500 dark:text-neutral-400'}>
              {override?.isCompleted ? '✓ Đã duyệt' : 'Chưa duyệt'}
            </span>
            <span>|</span>
            <span>Bề rộng Advance: <strong className="text-neutral-900 dark:text-white">{(font?.charToGlyph(selectedChar)?.advanceWidth || 500) + (override?.advanceWidthTweak || 0)}</strong></span>
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
