import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as opentype from 'opentype.js';
import {
  ZoomIn,
  ZoomOut,
  ArrowLeftRight,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Check,
  Tag,
  Sparkles,
  Layers
} from 'lucide-react';
import { GlyphEditState, FontMetadata, CompareMode } from '../../core/session';
import {
  parseSvgPath,
  transformCommands,
  getExactBoundingBox
} from '../../core/index';

interface GlyphCanvasProps {
  font: opentype.Font;
  fontMetadata: FontMetadata;
  editState: GlyphEditState;
  onUpdateState: (id: string, updated: Partial<GlyphEditState>) => void;
  onSelectPrevGlyph?: () => void;
  onSelectNextGlyph?: () => void;
  hasPrevGlyph?: boolean;
  hasNextGlyph?: boolean;
}

export const GlyphCanvas: React.FC<GlyphCanvasProps> = ({
  font,
  fontMetadata,
  editState,
  onUpdateState,
  onSelectPrevGlyph,
  onSelectNextGlyph,
  hasPrevGlyph = false,
  hasNextGlyph = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1.0);
  const [compareMode, setCompareMode] = useState<CompareMode>('overlay');
  const [ghostOpacity, setGhostOpacity] = useState(40);
  const [showGuides, setShowGuides] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showDotGrid, setShowDotGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 480
  });

  const [toggleActive, setToggleActive] = useState<'new' | 'original'>('new');
  const [isDragging, setIsDragging] = useState(false);
  const [activeSnapLabel, setActiveSnapLabel] = useState<{ x: string | null; y: string | null }>({ x: null, y: null });
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; offsetX: number; offsetY: number } | null>(null);

  // Observe container size for responsive, crisp canvas rendering
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(320, Math.floor(rect.height));
      setCanvasDimensions({ width: w, height: h });
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Original glyph path commands
  const originalCmds = useMemo(() => {
    if (!editState.originalPath) return [];
    return parseSvgPath(editState.originalPath);
  }, [editState.originalPath]);

  // Parsed and transformed new commands
  const transformedNewCmds = useMemo(() => {
    if (!editState.svgPath) return [];
    const parsed = parseSvgPath(editState.svgPath);
    return transformCommands(
      parsed,
      editState.scaleX,
      editState.scaleY,
      editState.offsetX,
      editState.offsetY,
      editState.flipY
    );
  }, [
    editState.svgPath,
    editState.scaleX,
    editState.scaleY,
    editState.offsetX,
    editState.offsetY,
    editState.flipY
  ]);

  // Exact bounding box of the transformed glyph
  const newBoundingBox = useMemo(() => {
    if (transformedNewCmds.length === 0) return null;
    return getExactBoundingBox(transformedNewCmds);
  }, [transformedNewCmds]);

  // Calculate canvas metrics & scale factors
  const getCanvasMetrics = () => {
    const width = canvasDimensions.width;
    const height = canvasDimensions.height;
    const padding = 54;
    const drawHeight = height - padding * 2;
    const totalFontHeight = Math.max(1, fontMetadata.ascender - fontMetadata.descender);
    const baseScale = drawHeight / totalFontHeight;
    const scaleFactor = baseScale * zoom;
    const centerX = width / 2;
    const centerY = height / 2;
    const baselineY = centerY + ((fontMetadata.ascender + fontMetadata.descender) / 2) * scaleFactor;
    const glyphW = editState.advanceWidth * scaleFactor;
    const fontStartX = centerX - glyphW / 2;

    return { scaleFactor, centerX, centerY, baselineY, fontStartX, width, height };
  };

  // Render on Canvas with High-DPI Retina sharpness & professional typography guidelines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const { scaleFactor, fontStartX, baselineY, width, height } = getCanvasMetrics();

    // Configure exact physical pixel buffer for High-DPI screens
    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Apply Retina scaling transform
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // High quality canvas background
    ctx.fillStyle = '#fafbfe';
    ctx.fillRect(0, 0, width, height);

    const toCanvasX = (fontX: number) => fontStartX + fontX * scaleFactor;
    const toCanvasY = (fontY: number) => baselineY - fontY * scaleFactor;

    const leftX = Math.round(toCanvasX(0));
    const rightX = Math.round(toCanvasX(editState.advanceWidth));
    const baseY = Math.round(toCanvasY(0));
    const ascY = Math.round(toCanvasY(fontMetadata.ascender));
    const capY = Math.round(toCanvasY(fontMetadata.capHeight));
    const xhY = Math.round(toCanvasY(fontMetadata.xHeight));
    const descY = Math.round(toCanvasY(fontMetadata.descender));

    // 1. Shaded Typographic Optical Zones
    if (showGuides && showZones) {
      ctx.save();
      // Left sidebearing zone
      if (leftX > 0) {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.035)';
        ctx.fillRect(0, 0, leftX, height);
      }
      // Right sidebearing zone
      if (rightX < width) {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.035)';
        ctx.fillRect(rightX, 0, width - rightX, height);
      }
      // Lowercase optical body zone (Baseline -> X-Height)
      if (baseY > xhY && rightX > leftX) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.032)';
        ctx.fillRect(leftX, xhY, rightX - leftX, baseY - xhY);
      }
      // Descender zone (Baseline -> Descender)
      if (descY > baseY && rightX > leftX) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.022)';
        ctx.fillRect(leftX, baseY, rightX - leftX, descY - baseY);
      }
      ctx.restore();
    }

    // 2. Precision Metric Dot Grid
    if (showGuides && showDotGrid) {
      ctx.save();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.42)';
      const stepUnits = zoom >= 1.4 ? 50 : 100;
      const startX = Math.floor((-fontStartX / scaleFactor) / stepUnits) * stepUnits;
      const endX = Math.ceil(((width - fontStartX) / scaleFactor) / stepUnits) * stepUnits;
      const startY = Math.floor((fontMetadata.descender - 150) / stepUnits) * stepUnits;
      const endY = Math.ceil((fontMetadata.ascender + 150) / stepUnits) * stepUnits;

      for (let gx = startX; gx <= endX; gx += stepUnits) {
        const cx = Math.round(toCanvasX(gx));
        if (cx < 20 || cx > width - 20) continue;
        for (let gy = startY; gy <= endY; gy += stepUnits) {
          const cy = Math.round(toCanvasY(gy));
          if (cy < 15 || cy > height - 15) continue;
          ctx.fillRect(cx - 0.75, cy - 0.75, 1.5, 1.5);
        }
      }
      ctx.restore();
    }

    // Helper: Draw crisp rounded pill badge
    const drawGuidePill = (
      text: string,
      x: number,
      y: number,
      bg: string,
      border: string,
      color: string,
      align: 'left' | 'right' | 'center' = 'left'
    ) => {
      ctx.save();
      ctx.font = '600 9.5px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      const m = ctx.measureText(text);
      const textW = m.width;
      const badgeH = 17;
      const badgeW = textW + 10;
      let startX = x;
      if (align === 'right') startX = x - badgeW;
      else if (align === 'center') startX = x - badgeW / 2;
      const startY = Math.round(y - badgeH / 2);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;

      ctx.fillStyle = bg;
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(startX, startY, badgeW, badgeH, 4.5);
      } else {
        ctx.rect(startX, startY, badgeW, badgeH);
      }
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.fillText(text, startX + 5, startY + badgeH / 2);
      ctx.restore();
    };

    // 3. Draw Horizontal Typography Guidelines
    if (showGuides) {
      const drawHGuide = (
        yValue: number,
        lineColor: string,
        tag: string,
        badgeBg: string,
        badgeBorder: string,
        badgeText: string,
        lineStyle: 'solid' | 'dashed' | 'dotted' = 'dashed',
        lineWidth = 1
      ) => {
        const cY = Math.round(toCanvasY(yValue)) + 0.5;
        if (cY < 8 || cY > height - 8) return;

        ctx.save();
        ctx.beginPath();
        if (lineStyle === 'dashed') ctx.setLineDash([5, 4]);
        else if (lineStyle === 'dotted') ctx.setLineDash([2, 3]);
        else ctx.setLineDash([]);

        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        ctx.moveTo(10, cY);
        ctx.lineTo(width - 10, cY);
        ctx.stroke();
        ctx.restore();

        drawGuidePill(
          `${tag} ${yValue >= 0 ? '+' : ''}${yValue}`,
          14,
          cY,
          badgeBg,
          badgeBorder,
          badgeText,
          'left'
        );
      };

      // Descender
      drawHGuide(
        fontMetadata.descender,
        'rgba(220, 38, 38, 0.75)',
        'DESCENDER',
        '#fef2f2',
        '#fecaca',
        '#b91c1c',
        'dashed',
        1
      );

      // Baseline (solid prominent line)
      drawHGuide(
        0,
        '#0f172a',
        'BASELINE',
        '#0f172a',
        '#0f172a',
        '#ffffff',
        'solid',
        1.5
      );

      // X-Height
      drawHGuide(
        fontMetadata.xHeight,
        'rgba(5, 150, 105, 0.75)',
        'X-HEIGHT',
        '#ecfdf5',
        '#a7f3d0',
        '#047857',
        'dashed',
        1
      );

      // Cap Height
      drawHGuide(
        fontMetadata.capHeight,
        'rgba(124, 58, 237, 0.75)',
        'CAP HEIGHT',
        '#f5f3ff',
        '#ddd6fe',
        '#6d28d9',
        'dashed',
        1
      );

      // Ascender
      drawHGuide(
        fontMetadata.ascender,
        'rgba(37, 99, 235, 0.75)',
        'ASCENDER',
        '#eff6ff',
        '#bfdbfe',
        '#1d4ed8',
        'dashed',
        1
      );

      // 4. Vertical Sidebearing Lines
      const drawVGuide = (
        cX: number,
        tag: string,
        badgeBg: string,
        badgeBorder: string,
        badgeText: string
      ) => {
        const snapX = Math.round(cX) + 0.5;
        if (snapX < 8 || snapX > width - 8) return;

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.moveTo(snapX, 8);
        ctx.lineTo(snapX, height - 28);
        ctx.stroke();
        ctx.restore();

        drawGuidePill(tag, snapX, 18, badgeBg, badgeBorder, badgeText, 'center');
      };

      drawVGuide(leftX, 'LSB 0', '#f8fafc', '#cbd5e1', '#334155');
      drawVGuide(rightX, `RSB ${Math.round(editState.advanceWidth)}`, '#f8fafc', '#cbd5e1', '#334155');

      // 5. Advance Width Dimension Ruler at bottom
      const dimY = height - 16;
      ctx.save();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftX, dimY);
      ctx.lineTo(rightX, dimY);
      ctx.moveTo(leftX, dimY - 4);
      ctx.lineTo(leftX, dimY + 4);
      ctx.moveTo(rightX, dimY - 4);
      ctx.lineTo(rightX, dimY + 4);
      ctx.stroke();
      ctx.restore();

      drawGuidePill(
        `Advance: ${Math.round(editState.advanceWidth)} UPM`,
        (leftX + rightX) / 2,
        dimY,
        '#ffffff',
        '#cbd5e1',
        '#1e293b',
        'center'
      );

      // 6. Origin Crosshair (0, 0)
      const originX = Math.round(leftX) + 0.5;
      const originY = Math.round(baseY) + 0.5;
      ctx.save();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(originX, originY, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(originX - 7, originY);
      ctx.lineTo(originX + 7, originY);
      ctx.moveTo(originX, originY - 7);
      ctx.lineTo(originX, originY + 7);
      ctx.stroke();
      ctx.restore();
    }

    // Helper to draw glyph paths
    const drawCommands = (
      cmds: any[],
      fillStyle: string,
      strokeStyle?: string,
      offsetX = 0,
      offsetY = 0
    ) => {
      ctx.save();
      ctx.translate(fontStartX + offsetX, baselineY + offsetY);
      ctx.scale(scaleFactor, -scaleFactor);

      ctx.beginPath();
      for (const cmd of cmds) {
        if (cmd.type === 'M') {
          ctx.moveTo(cmd.x, cmd.y);
        } else if (cmd.type === 'L') {
          ctx.lineTo(cmd.x, cmd.y);
        } else if (cmd.type === 'C') {
          ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        } else if (cmd.type === 'Q') {
          ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
        } else if (cmd.type === 'Z') {
          ctx.closePath();
        }
      }

      ctx.fillStyle = fillStyle;
      ctx.fill();

      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 1.5 / scaleFactor;
        ctx.stroke();
      }
      ctx.restore();
    };

    // 7. Render Based on Compare Mode
    if (compareMode === 'overlay') {
      if (originalCmds.length > 0) {
        const ghostAlpha = (ghostOpacity / 100) * 0.45;
        drawCommands(originalCmds, `rgba(59, 130, 246, ${ghostAlpha})`);
      }
      if (transformedNewCmds.length > 0) {
        drawCommands(transformedNewCmds, '#171717');
      }
    } else if (compareMode === 'toggle') {
      if (toggleActive === 'original' && originalCmds.length > 0) {
        drawCommands(originalCmds, '#2563eb');
      } else if (toggleActive === 'new' && transformedNewCmds.length > 0) {
        drawCommands(transformedNewCmds, '#171717');
      }
    } else if (compareMode === 'side_by_side') {
      const halfW = width / 2;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, height);
      ctx.stroke();

      ctx.save();
      ctx.rect(0, 0, halfW, height);
      ctx.clip();
      if (originalCmds.length > 0) {
        drawCommands(originalCmds, '#475569', undefined, -halfW / 4);
      }
      ctx.restore();

      ctx.save();
      ctx.rect(halfW, 0, halfW, height);
      ctx.clip();
      if (transformedNewCmds.length > 0) {
        drawCommands(transformedNewCmds, '#171717', undefined, halfW / 4);
      }
      ctx.restore();
    }

    // 8. Highlight Bounding Box of New Glyph
    if (newBoundingBox && showGuides) {
      const bx1 = toCanvasX(newBoundingBox.xMin);
      const bx2 = toCanvasX(newBoundingBox.xMax);
      const by1 = toCanvasY(newBoundingBox.yMax);
      const by2 = toCanvasY(newBoundingBox.yMin);

      const bw = Math.round(newBoundingBox.xMax - newBoundingBox.xMin);
      const bh = Math.round(newBoundingBox.yMax - newBoundingBox.yMin);
      const lBearing = Math.round(newBoundingBox.xMin);
      const rBearing = Math.round(editState.advanceWidth - newBoundingBox.xMax);

      ctx.save();
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.strokeRect(bx1, by1, bx2 - bx1, by2 - by1);
      ctx.restore();

      drawGuidePill(
        `${bw} × ${bh} UPM`,
        (bx1 + bx2) / 2,
        by1 - 10,
        '#fffbeb',
        '#fde68a',
        '#92400e',
        'center'
      );

      if (bx1 - leftX > 32) {
        drawGuidePill(
          `+${lBearing}`,
          (leftX + bx1) / 2,
          (by1 + by2) / 2,
          '#f8fafc',
          '#e2e8f0',
          '#64748b',
          'center'
        );
      }
      if (rightX - bx2 > 32) {
        drawGuidePill(
          `+${rBearing}`,
          (bx2 + rightX) / 2,
          (by1 + by2) / 2,
          '#f8fafc',
          '#e2e8f0',
          '#64748b',
          'center'
        );
      }
    }
  }, [
    originalCmds,
    transformedNewCmds,
    editState.advanceWidth,
    zoom,
    compareMode,
    ghostOpacity,
    showGuides,
    showZones,
    showDotGrid,
    toggleActive,
    newBoundingBox,
    fontMetadata,
    canvasDimensions
  ]);

  // Snapping calculations
  const calculateSnappedOffsets = (rawOffsetX: number, rawOffsetY: number) => {
    if (!snapEnabled || !newBoundingBox) {
      return { snappedX: rawOffsetX, snappedY: rawOffsetY, snapLabelX: null, snapLabelY: null };
    }

    const SNAP_THRESHOLD_UPM = 15;
    let snappedX = rawOffsetX;
    let snappedY = rawOffsetY;
    let snapLabelX: string | null = null;
    let snapLabelY: string | null = null;

    const deltaX = rawOffsetX - editState.offsetX;
    const currentXMin = newBoundingBox.xMin + deltaX;
    const currentXMax = newBoundingBox.xMax + deltaX;
    const currentCenterX = (currentXMin + currentXMax) / 2;
    const targetCenterX = editState.advanceWidth / 2;

    if (Math.abs(currentCenterX - targetCenterX) < SNAP_THRESHOLD_UPM) {
      snappedX = rawOffsetX + (targetCenterX - currentCenterX);
      snapLabelX = 'Căn giữa (Center X)';
    } else if (Math.abs(currentXMin) < SNAP_THRESHOLD_UPM) {
      snappedX = rawOffsetX - currentXMin;
      snapLabelX = 'Biên trái (LSB: 0)';
    } else if (Math.abs(currentXMax - editState.advanceWidth) < SNAP_THRESHOLD_UPM) {
      snappedX = rawOffsetX + (editState.advanceWidth - currentXMax);
      snapLabelX = 'Biên phải (RSB)';
    }

    const deltaY = rawOffsetY - editState.offsetY;
    const currentYMin = newBoundingBox.yMin + deltaY;
    const currentYMax = newBoundingBox.yMax + deltaY;

    if (Math.abs(currentYMin) < SNAP_THRESHOLD_UPM) {
      snappedY = rawOffsetY - currentYMin;
      snapLabelY = 'Đường cơ sở (Baseline: 0)';
    } else if (Math.abs(currentYMax - fontMetadata.capHeight) < SNAP_THRESHOLD_UPM) {
      snappedY = rawOffsetY + (fontMetadata.capHeight - currentYMax);
      snapLabelY = `Cap Height (+${fontMetadata.capHeight})`;
    } else if (Math.abs(currentYMax - fontMetadata.xHeight) < SNAP_THRESHOLD_UPM) {
      snappedY = rawOffsetY + (fontMetadata.xHeight - currentYMax);
      snapLabelY = `X-Height (+${fontMetadata.xHeight})`;
    } else if (Math.abs(currentYMax - fontMetadata.ascender) < SNAP_THRESHOLD_UPM) {
      snappedY = rawOffsetY + (fontMetadata.ascender - currentYMax);
      snapLabelY = `Ascender (+${fontMetadata.ascender})`;
    } else if (Math.abs(currentYMin - fontMetadata.descender) < SNAP_THRESHOLD_UPM) {
      snappedY = rawOffsetY + (fontMetadata.descender - currentYMin);
      snapLabelY = `Descender (${fontMetadata.descender})`;
    }

    return { snappedX, snappedY, snapLabelX, snapLabelY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      offsetX: editState.offsetX,
      offsetY: editState.offsetY
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseCanvasX = e.clientX - rect.left;
      const mouseCanvasY = e.clientY - rect.top;
      const { scaleFactor, fontStartX, baselineY } = getCanvasMetrics();
      const fontX = Math.round((mouseCanvasX - fontStartX) / scaleFactor);
      const fontY = Math.round((baselineY - mouseCanvasY) / scaleFactor);
      setHoverCoords({ x: fontX, y: fontY });
    }

    if (!isDragging || !dragStartRef.current) return;
    const { scaleFactor } = getCanvasMetrics();

    const dx = (e.clientX - dragStartRef.current.mouseX) / scaleFactor;
    const dy = (dragStartRef.current.mouseY - e.clientY) / scaleFactor;

    const rawOffsetX = Math.round(dragStartRef.current.offsetX + dx);
    const rawOffsetY = Math.round(dragStartRef.current.offsetY + dy);

    const { snappedX, snappedY, snapLabelX, snapLabelY } = calculateSnappedOffsets(rawOffsetX, rawOffsetY);

    setActiveSnapLabel({ x: snapLabelX, y: snapLabelY });

    onUpdateState(editState.id, {
      offsetX: Math.round(snappedX),
      offsetY: Math.round(snappedY),
      isModified: true
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    setActiveSnapLabel({ x: null, y: null });
  };

  const handleMouseLeave = () => {
    setHoverCoords(null);
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
      setActiveSnapLabel({ x: null, y: null });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-100/60 overflow-hidden relative select-none">
      {/* Top Bar of Liveview: Glyph Info, Nav, Compare Modes, Zoom */}
      <div className="h-13 bg-white border-b border-neutral-200/80 px-4 flex items-center justify-between gap-3 shrink-0">
        {/* Active Glyph Badge & Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              disabled={!hasPrevGlyph}
              onClick={onSelectPrevGlyph}
              className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Ký tự trước (←)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={!hasNextGlyph}
              onClick={onSelectNextGlyph}
              className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Ký tự tiếp theo (→)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-base shadow-2xs font-mono">
              {editState.originalChar || '?'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-neutral-900">{editState.originalName}</span>
                {editState.originalUnicode && (
                  <span className="font-mono text-[10px] px-1.5 py-0.2 bg-neutral-100 border border-neutral-200 rounded text-neutral-600">
                    U+{editState.originalUnicode.toString(16).toUpperCase()}
                  </span>
                )}
                {editState.mode === 'alt' && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded font-medium">
                    Bản Alt ({editState.altName})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compare Mode Switcher & Zoom */}
        <div className="flex items-center gap-3">
          {/* Compare Toolbar */}
          <div className="flex items-center gap-1 bg-neutral-100/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setCompareMode('overlay')}
              className={`px-2 py-1 rounded-md font-medium transition ${
                compareMode === 'overlay' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Chồng lớp
            </button>
            <button
              onClick={() => setCompareMode('side_by_side')}
              className={`px-2 py-1 rounded-md font-medium transition ${
                compareMode === 'side_by_side' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Song song
            </button>
            <button
              onClick={() => setCompareMode('toggle')}
              className={`px-2 py-1 rounded-md font-medium transition ${
                compareMode === 'toggle' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              A/B
            </button>
          </div>

          {/* Secondary compare controls */}
          {compareMode === 'overlay' && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-500">
              <span>Bóng:</span>
              <input
                type="range"
                min={10}
                max={90}
                value={ghostOpacity}
                onChange={(e) => setGhostOpacity(Number(e.target.value))}
                className="w-14 h-1 accent-neutral-900"
              />
              <span className="font-mono text-[10px] w-6">{ghostOpacity}%</span>
            </div>
          )}

          {compareMode === 'toggle' && (
            <div className="flex items-center gap-1 bg-neutral-200 p-0.5 rounded-md text-[11px]">
              <button
                onClick={() => setToggleActive('original')}
                className={`px-1.5 py-0.5 rounded font-medium ${
                  toggleActive === 'original' ? 'bg-blue-600 text-white' : 'text-neutral-700'
                }`}
              >
                Gốc
              </button>
              <button
                onClick={() => setToggleActive('new')}
                className={`px-1.5 py-0.5 rounded font-medium ${
                  toggleActive === 'new' ? 'bg-neutral-900 text-white' : 'text-neutral-700'
                }`}
              >
                Mới
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border-l border-neutral-200 pl-2">
            <button
              onClick={() => setZoom(z => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
              className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
              title="Thu nhỏ (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="font-mono text-[10px] w-9 text-center hover:bg-neutral-100 rounded py-0.5 text-neutral-700"
              title="Đặt lại 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom(z => Math.min(2.5, Number((z + 0.1).toFixed(1))))}
              className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
              title="Phóng to (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-neutral-50 flex items-center justify-center min-h-[300px]"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className={`block cursor-${isDragging ? 'grabbing' : 'grab'} select-none`}
        />

        {/* Top Left HUD: Realtime Coordinates & Landmarks */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {hoverCoords && (
            <div className="bg-neutral-900/90 backdrop-blur-xs text-white text-[11px] px-2.5 py-1.5 rounded-lg font-mono flex items-center gap-2 shadow-xs border border-neutral-800">
              <div className="flex items-center gap-1">
                <span className="text-neutral-400">X:</span>
                <span className="font-semibold text-neutral-100">{hoverCoords.x >= 0 ? `+${hoverCoords.x}` : hoverCoords.x}</span>
              </div>
              <span className="text-neutral-600">|</span>
              <div className="flex items-center gap-1">
                <span className="text-neutral-400">Y:</span>
                <span className="font-semibold text-neutral-100">{hoverCoords.y >= 0 ? `+${hoverCoords.y}` : hoverCoords.y}</span>
              </div>
              {hoverCoords.y === 0 && (
                <span className="text-white bg-neutral-800 px-1.5 py-0.5 rounded text-[9px] font-sans font-medium">
                  Baseline
                </span>
              )}
              {Math.abs(hoverCoords.y - fontMetadata.xHeight) < 15 && (
                <span className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded text-[9px] font-sans font-medium">
                  X-Height
                </span>
              )}
              {Math.abs(hoverCoords.y - fontMetadata.capHeight) < 15 && (
                <span className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded text-[9px] font-sans font-medium">
                  Cap Height
                </span>
              )}
              {Math.abs(hoverCoords.y - fontMetadata.ascender) < 15 && (
                <span className="text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded text-[9px] font-sans font-medium">
                  Ascender
                </span>
              )}
              {Math.abs(hoverCoords.y - fontMetadata.descender) < 15 && (
                <span className="text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded text-[9px] font-sans font-medium">
                  Descender
                </span>
              )}
            </div>
          )}

          {/* Snap Indicator */}
          {(activeSnapLabel.x || activeSnapLabel.y) && (
            <div className="bg-amber-500/95 backdrop-blur-xs text-neutral-950 text-[11px] px-2.5 py-1 rounded-lg font-mono font-medium flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-950 animate-pulse" />
              <span>Snap: {[activeSnapLabel.x, activeSnapLabel.y].filter(Boolean).join(' + ')}</span>
            </div>
          )}
        </div>

        {/* Bottom Floating Bar: View & Guideline Toggles */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white/95 backdrop-blur-xs border border-neutral-200/90 px-3 py-1.5 rounded-xl text-xs text-neutral-600 shadow-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none hover:text-neutral-900 transition">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
              className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Đường gióng</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none hover:text-neutral-900 transition">
            <input
              type="checkbox"
              checked={showZones}
              onChange={(e) => setShowZones(e.target.checked)}
              className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Vùng đo</span>
          </label>
          <span className="text-neutral-300">|</span>
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none hover:text-neutral-900 transition">
            <input
              type="checkbox"
              checked={showDotGrid}
              onChange={(e) => setShowDotGrid(e.target.checked)}
              className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Lưới điểm</span>
          </label>
          <span className="text-neutral-300">|</span>
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none hover:text-neutral-900 transition">
            <input
              type="checkbox"
              checked={snapEnabled}
              onChange={(e) => setSnapEnabled(e.target.checked)}
              className="rounded text-neutral-900 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Bắt dính</span>
          </label>
        </div>
      </div>

      {/* Live Metrics Readout Strip */}
      <div className="h-10 bg-white border-t border-neutral-200/80 px-4 flex items-center justify-between text-xs text-neutral-600 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-medium">Bề rộng:</span>
            <span className="font-semibold font-mono text-neutral-900">{Math.round(editState.advanceWidth)}</span>
            <span className="text-neutral-400 font-mono text-[11px]">/ {editState.originalAdvanceWidth} UPM</span>
          </div>

          <div className="h-3.5 w-px bg-neutral-200" />

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-medium">Dời (X, Y):</span>
            <span className="font-semibold font-mono text-neutral-800">
              {Math.round(editState.offsetX)}, {Math.round(editState.offsetY)}
            </span>
          </div>

          <div className="h-3.5 w-px bg-neutral-200" />

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-medium">Tỷ lệ:</span>
            <span className="font-semibold font-mono text-neutral-800">
              {Math.round(editState.scaleX * 100)}% {editState.scaleX !== editState.scaleY && `× ${Math.round(editState.scaleY * 100)}%`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            {editState.inheritKerning ? 'Kế thừa kerning gốc' : 'Kerning độc lập'}
          </span>
        </div>
      </div>
    </div>
  );
};
