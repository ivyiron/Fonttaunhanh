import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as opentype from 'opentype.js';
import { ZoomIn, ZoomOut, RotateCcw, Layers, Eye, Move } from 'lucide-react';
import { CustomGlyphDesign, FontMetadata } from '../../types';
import {
  parseSvgPath,
  transformCommands,
  getExactBoundingBox
} from '../../utils';

interface GlyphEditCanvasProps {
  font: opentype.Font | null;
  fontMetadata: FontMetadata | null;
  selectedGlyphKey: string;
  customDesign: CustomGlyphDesign | null;
  onUpdateDesign: (updates: Partial<CustomGlyphDesign>) => void;
  onResetDesign: () => void;
}

export const GlyphEditCanvas: React.FC<GlyphEditCanvasProps> = ({
  font,
  fontMetadata,
  selectedGlyphKey,
  customDesign,
  onUpdateDesign,
  onResetDesign
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // View state
  const [viewMode, setViewMode] = useState<'overlay' | 'new' | 'original'>('overlay');
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1.0);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.5);

  // Dragging state for direct canvas interactive positioning
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; initialOffsetX: number; initialOffsetY: number }>({
    x: 0,
    y: 0,
    initialOffsetX: 0,
    initialOffsetY: 0
  });

  // Track container sizing
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
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Find original glyph in font
  const originalGlyph = useMemo<opentype.Glyph | null>(() => {
    if (!font || !selectedGlyphKey) return null;

    // Try charToGlyph if it's a 1-character string
    if (selectedGlyphKey.length === 1) {
      const idx = font.charToGlyphIndex(selectedGlyphKey);
      if (idx > 0) return font.glyphs.get(idx);
    }

    // Try name lookup
    for (let i = 0; i < font.glyphs.length; i++) {
      const g = font.glyphs.get(i);
      if (g && (g.name === selectedGlyphKey || (g.unicode && String.fromCharCode(g.unicode) === selectedGlyphKey))) {
        return g;
      }
    }

    return null;
  }, [font, selectedGlyphKey]);

  // Original glyph metrics
  const unitsPerEm = font?.unitsPerEm || fontMetadata?.unitsPerEm || 1000;
  const ascender = font?.ascender || fontMetadata?.ascender || Math.round(unitsPerEm * 0.8);
  const descender = font?.descender || fontMetadata?.descender || -Math.round(unitsPerEm * 0.2);
  const capHeight = fontMetadata?.capHeight || Math.round(unitsPerEm * 0.7);
  const xHeight = fontMetadata?.xHeight || Math.round(unitsPerEm * 0.5);

  const originalAdvanceWidth = originalGlyph?.advanceWidth || Math.round(unitsPerEm * 0.6);
  const currentAdvanceWidth = customDesign?.advanceWidth !== undefined ? customDesign.advanceWidth : originalAdvanceWidth;

  // Selected glyph character / name display
  const glyphTitle = useMemo(() => {
    if (originalGlyph) {
      const unicode = originalGlyph.unicode;
      const charStr = unicode ? String.fromCharCode(unicode) : selectedGlyphKey;
      const hex = unicode ? `U+${unicode.toString(16).toUpperCase().padStart(4, '0')}` : '';
      return {
        char: charStr,
        name: originalGlyph.name || selectedGlyphKey,
        hex
      };
    }
    return {
      char: selectedGlyphKey,
      name: selectedGlyphKey,
      hex: ''
    };
  }, [originalGlyph, selectedGlyphKey]);

  // Main Canvas render function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cssWidth = containerSize.width || 600;
    const cssHeight = containerSize.height || 500;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // Subtle background grid
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // Compute coordinate mapping:
    // We want the font design box to center neatly with padding
    const paddingX = 70;
    const totalFontHeight = ascender - descender;
    const availableH = cssHeight - 120;
    const baseScale = Math.min((cssWidth - paddingX * 2) / (unitsPerEm * 1.2), availableH / totalFontHeight);
    const scaleFactor = Math.max(0.1, baseScale * zoom);

    // Baseline placement: placed so ascender and descender are centered vertically
    const fontStartX = Math.max(paddingX, (cssWidth - currentAdvanceWidth * scaleFactor) / 2);
    const baselineY = cssHeight / 2 + (ascender + descender) * 0.5 * scaleFactor;

    // 1. Draw Guidelines
    if (showGuides) {
      const drawHGuide = (yUnits: number, color: string, label: string, isDashed = false) => {
        const yCanvas = baselineY - yUnits * scaleFactor;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        if (isDashed) {
          ctx.setLineDash([4, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.beginPath();
        ctx.moveTo(15, yCanvas);
        ctx.lineTo(cssWidth - 15, yCanvas);
        ctx.stroke();

        // Label
        ctx.font = '500 10px monospace';
        ctx.fillStyle = color;
        ctx.fillText(`${label} (${yUnits})`, 20, yCanvas - 4);
        ctx.restore();
      };

      // Ascender (emerald)
      drawHGuide(ascender, '#059669', 'Ascender', true);
      // Cap Height (blue)
      drawHGuide(capHeight, '#2563eb', 'Cap Height', true);
      // x-Height (indigo)
      drawHGuide(xHeight, '#7c3aed', 'x-Height', true);
      // Baseline (dark slate solid)
      drawHGuide(0, '#0f172a', 'Baseline', false);
      // Descender (rose)
      drawHGuide(descender, '#e11d48', 'Descender', true);

      // Vertical sidebearings
      const drawVGuide = (xCanvas: number, color: string, label: string) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(xCanvas, 20);
        ctx.lineTo(xCanvas, cssHeight - 20);
        ctx.stroke();

        ctx.font = '500 10px monospace';
        ctx.fillStyle = color;
        ctx.fillText(label, xCanvas + 4, 32);
        ctx.restore();
      };

      // LSB (X = 0)
      drawVGuide(fontStartX, '#64748b', 'LSB (0)');
      // RSB / Advance Width
      const rsbX = fontStartX + currentAdvanceWidth * scaleFactor;
      drawVGuide(rsbX, '#64748b', `RSB (${currentAdvanceWidth})`);

      // Centerline
      const centerX = fontStartX + (currentAdvanceWidth * scaleFactor) / 2;
      ctx.save();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(centerX, 20);
      ctx.lineTo(centerX, cssHeight - 20);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Original Glyph (in 'overlay' or 'original' view mode)
    const shouldDrawOriginal = (viewMode === 'overlay' || viewMode === 'original') && originalGlyph;
    if (shouldDrawOriginal && originalGlyph) {
      try {
        const origPath = originalGlyph.getPath(fontStartX, baselineY, unitsPerEm * scaleFactor);
        ctx.save();
        if (viewMode === 'overlay') {
          // Amber / Orange ghost overlay for comparison
          origPath.fill = `rgba(245, 158, 11, ${overlayOpacity * 0.5})`;
          origPath.stroke = '#d97706';
          origPath.lineWidth = 1.2;
        } else {
          // Pure original view
          origPath.fill = '#0f172a';
          origPath.stroke = '#020617';
          origPath.lineWidth = 0.5;
        }
        origPath.draw(ctx);
        ctx.restore();
      } catch (err) {
        console.error('Error drawing original glyph:', err);
      }
    }

    // 3. Draw New / Custom Design (in 'overlay' or 'new' view mode)
    const shouldDrawNew = (viewMode === 'overlay' || viewMode === 'new') && customDesign?.svgPath;
    if (shouldDrawNew && customDesign && customDesign.svgPath) {
      try {
        const rawCmds = parseSvgPath(customDesign.svgPath);
        if (rawCmds.length > 0) {
          const flipY = customDesign.flipY !== false; // default true for SVG import
          const flipX = customDesign.flipX === true;
          const transformed = transformCommands(
            rawCmds,
            customDesign.scaleX,
            customDesign.scaleY,
            customDesign.offsetX,
            customDesign.offsetY,
            flipY,
            flipX
          );

          ctx.save();
          ctx.beginPath();
          ctx.fillStyle = viewMode === 'overlay' ? 'rgba(15, 23, 42, 0.85)' : '#0f172a';
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 1.2;

          transformed.forEach((cmd) => {
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

          // Draw bounding box & center guide for custom glyph if guides enabled
          if (showGuides) {
            const bbox = getExactBoundingBox(transformed);
            const bxMin = fontStartX + bbox.xMin * scaleFactor;
            const bxMax = fontStartX + bbox.xMax * scaleFactor;
            const byMin = baselineY - bbox.yMax * scaleFactor;
            const byMax = baselineY - bbox.yMin * scaleFactor;

            ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            ctx.strokeRect(bxMin, byMin, bxMax - bxMin, byMax - byMin);

            // Center marker
            const diaCenter = (bbox.xMin + bbox.xMax) / 2;
            const diaCenterCanvas = fontStartX + diaCenter * scaleFactor;
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(diaCenterCanvas, byMin - 10);
            ctx.lineTo(diaCenterCanvas, byMax + 10);
            ctx.stroke();
          }

          ctx.restore();
        }
      } catch (err) {
        console.error('Error drawing custom glyph:', err);
      }
    }

    // 4. Overlay legend banner
    if (viewMode === 'overlay' && customDesign?.svgPath && originalGlyph) {
      ctx.save();
      const legendText = '🟧 Ký tự gốc (Font)   |   ⬛ Thiết kế mới (SVG)';
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      const textW = ctx.measureText(legendText).width;
      const pillW = textW + 24;
      const pillH = 26;
      const pillX = (cssWidth - pillW) / 2;
      const pillY = 12;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.9)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.fillText(legendText, pillX + 12, pillY + 17);
      ctx.restore();
    }

    ctx.restore();
  }, [
    font,
    fontMetadata,
    originalGlyph,
    customDesign,
    containerSize,
    zoom,
    showGuides,
    viewMode,
    overlayOpacity,
    currentAdvanceWidth,
    unitsPerEm,
    ascender,
    descender,
    capHeight,
    xHeight
  ]);

  // Handle canvas mouse drag to adjust offsetX and offsetY interactively
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!customDesign?.svgPath) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffsetX: customDesign.offsetX || 0,
      initialOffsetY: customDesign.offsetY || 0
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !customDesign?.svgPath) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // Convert pixel delta to font units delta
    const cssWidth = containerSize.width || 600;
    const paddingX = 70;
    const totalFontHeight = ascender - descender;
    const availableH = (containerSize.height || 500) - 120;
    const baseScale = Math.min((cssWidth - paddingX * 2) / (unitsPerEm * 1.2), availableH / totalFontHeight);
    const scaleFactor = Math.max(0.1, baseScale * zoom);

    const fontDeltaX = Math.round(deltaX / scaleFactor);
    // In canvas Y goes down, in font Y goes up
    const fontDeltaY = Math.round(-deltaY / scaleFactor);

    onUpdateDesign({
      offsetX: dragStartRef.current.initialOffsetX + fontDeltaX,
      offsetY: dragStartRef.current.initialOffsetY + fontDeltaY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col h-full bg-white select-none space-y-3">
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap gap-2 items-center justify-between shrink-0 bg-white border-b border-neutral-100 pb-2">
        
        {/* View Mode Segmented Controls */}
        <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
          <button
            type="button"
            onClick={() => setViewMode('overlay')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              viewMode === 'overlay'
                ? 'bg-white text-neutral-950 font-bold shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Overlay</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('new')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              viewMode === 'new'
                ? 'bg-white text-neutral-950 font-bold shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            
            <span>Mới</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              viewMode === 'original'
                ? 'bg-white text-neutral-950 font-bold shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>Gốc</span>
          </button>
        </div>

        {/* Right: Actions (Guides, Zoom, Reset) */}
        <div className="flex items-center gap-2">
          {/* Overlay Opacity slider when in overlay mode */}
          {viewMode === 'overlay' && (
            <div className="hidden lg:flex items-center gap-1.5 mr-2 text-[11px] text-neutral-600 whitespace-nowrap">
              <span>Độ mờ gốc:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-16 h-1 bg-neutral-200 rounded accent-neutral-900 cursor-pointer"
              />
            </div>
          )}

          {/* Guides Toggle */}
          <button
            type="button"
            onClick={() => setShowGuides(!showGuides)}
            className={`px-2 py-1 text-xs font-medium whitespace-nowrap rounded-md border transition cursor-pointer ${
              showGuides
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-neutral-600 border-neutral-200 hover:text-neutral-900'
            }`}
          >
            Đường gióng
          </button>

          {/* Zoom buttons */}
          <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10))}
              className="p-1 hover:bg-white text-neutral-700 rounded-md transition cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-[10px] text-neutral-900 px-1 min-w-[32px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3.5, Math.round((prev + 0.1) * 10) / 10))}
              className="p-1 hover:bg-white text-neutral-700 rounded-md transition cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom !== 1.0 && (
              <button
                type="button"
                onClick={() => setZoom(1.0)}
                className="p-1 hover:bg-white text-neutral-500 hover:text-neutral-900 rounded-md transition cursor-pointer"
                title="Reset zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
          
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[300px] border border-neutral-200/90 rounded-2xl bg-neutral-50 overflow-hidden shadow-inner flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="absolute inset-0 w-full h-full block"
        />

        {/* Tip overlay at bottom */}
        <div className="absolute bottom-2 left-3 pointer-events-none text-[10px] text-neutral-400 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded border border-neutral-200/60 flex items-center gap-1.5">
          <Move className="w-2.5 h-2.5 text-neutral-500" />
          <span>Kéo chuột trên canvas để di chuyển nhanh vị trí ký tự SVG</span>
        </div>
      </div>
    </div>
  );
};
