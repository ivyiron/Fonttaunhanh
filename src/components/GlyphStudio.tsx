import React, { useEffect, useRef, useState } from 'react';
import * as opentype from 'opentype.js';
import { AlignCenter, Shrink, Maximize2, Sparkles, Copy, Trash2, ArrowLeftRight, Link, Link2Off, ZoomIn, ZoomOut, Plus } from 'lucide-react';
import { GlyphEditState, FontMetadata } from '../types';
import { getBoundingBox, parseSvgPath, extractPathDataFromSvg, transformCommands, getExactBoundingBox } from '../utils';

interface GlyphStudioProps {
  font: opentype.Font;
  fontMetadata: FontMetadata;
  activeChar: string;
  editState: GlyphEditState;
  onUpdateState: (char: string, updated: Partial<GlyphEditState>) => void;
  onSaveSlot: (char: string) => void;
  onClearSlot: (char: string) => void;
}

export const GlyphStudio: React.FC<GlyphStudioProps> = ({
  font,
  fontMetadata,
  activeChar,
  editState,
  onUpdateState,
  onSaveSlot,
  onClearSlot
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pastedValue, setPastedValue] = useState(editState.svgPath);
  const [scaleLinked, setScaleLinked] = useState(true);
  const [showReference, setShowReference] = useState(true);
  const [bgOpacity, setBgOpacity] = useState<number>(30);
  const [pastedOpacity, setPastedOpacity] = useState<number>(100);
  const [zoom, setZoom] = useState<number>(1.0);
  const [newCompanion, setNewCompanion] = useState('');
  const [newIsCompanionLeft, setNewIsCompanionLeft] = useState(false);
  const [newKernValue, setNewKernValue] = useState(0);

  // States for interactive drag & auto snap
  const [isDragging, setIsDragging] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [activeSnaps, setActiveSnaps] = useState<{ x: string | null; y: string | null }>({ x: null, y: null });
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; offsetX: number; offsetY: number } | null>(null);

  // Update paste box value when active slot changes
  useEffect(() => {
    setPastedValue(editState.svgPath);
    setActiveSnaps({ x: null, y: null });
  }, [activeSlotChangedKey(editState)]);

  function activeSlotChangedKey(state: GlyphEditState) {
    return `${state.char}-${state.svgPath}`;
  }

  // Handle direct vector path or full SVG code paste
  const handleVectorPaste = (val: string) => {
    setPastedValue(val);
    const cleanedPath = extractPathDataFromSvg(val);
    onUpdateState(activeChar, { svgPath: cleanedPath });
  };

  // Helper to resolve scaling factors and baseline positioning dynamically
  const getScaleFactorAndStartX = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { scaleFactor: 1, fontStartX: 0, baselineY: 0, width: 440, height: 440 };
    }
    const height = canvas.height;
    const width = canvas.width;
    const padding = 60;
    const drawHeight = height - padding * 2;
    const baseScaleFactor = drawHeight / (fontMetadata.ascender - fontMetadata.descender);
    const scaleFactor = baseScaleFactor * zoom;
    const centerX = width / 2;
    const centerY = height / 2;
    const fontStartX = centerX - (editState.advanceWidth / 2) * scaleFactor;
    const baselineY = centerY + ((fontMetadata.ascender + fontMetadata.descender) / 2) * scaleFactor;
    return { scaleFactor, fontStartX, baselineY, width, height };
  };

  // Helper to compute snap offsets based on guidelines
  const calculateSnaps = (
    rawOffsetX: number,
    rawOffsetY: number,
    vBBox: { xMin: number; xMax: number; yMin: number; yMax: number },
    scaleFactor: number
  ) => {
    if (!snapEnabled) return { offsetX: rawOffsetX, offsetY: rawOffsetY, snapX: null, snapY: null };

    const snapThreshold = 14 / scaleFactor; // 14 design units threshold (approx 7-8 canvas pixels)
    let offsetX = rawOffsetX;
    let offsetY = rawOffsetY;
    let snapX: string | null = null;
    let snapY: string | null = null;

    const baseGlyph = font.charToGlyph(editState.baseChar);
    const baseBBox = baseGlyph ? baseGlyph.getBoundingBox() : null;

    // 1. Horizontal Snapping Checks
    const currentXMin = vBBox.xMin + rawOffsetX;
    const currentXMax = vBBox.xMax + rawOffsetX;
    const currentXCenter = (vBBox.xMin + vBBox.xMax) / 2 + rawOffsetX;

    // A. Check Base Glyph Horizontal Center (priority for accents placement)
    if (baseBBox) {
      const baseXCenter = (baseBBox.x1 + baseBBox.x2) / 2;
      if (Math.abs(currentXCenter - baseXCenter) < snapThreshold) {
        offsetX = Math.round(baseXCenter - (vBBox.xMin + vBBox.xMax) / 2);
        snapX = 'base_center_x';
      }
    }

    // B. Check standard guidelines if not snapped to base center
    if (!snapX) {
      if (Math.abs(currentXMin - 0) < snapThreshold) {
        offsetX = Math.round(-vBBox.xMin);
        snapX = 'left_border';
      } else if (Math.abs(currentXMax - editState.advanceWidth) < snapThreshold) {
        offsetX = Math.round(editState.advanceWidth - vBBox.xMax);
        snapX = 'right_border';
      } else if (Math.abs(currentXCenter - editState.advanceWidth / 2) < snapThreshold) {
        offsetX = Math.round((editState.advanceWidth / 2) - (vBBox.xMin + vBBox.xMax) / 2);
        snapX = 'center_x';
      }
    }

    // 2. Vertical Snapping Checks
    const currentYMin = vBBox.yMin + rawOffsetY;
    const currentYMax = vBBox.yMax + rawOffsetY;

    // A. Check Base Glyph Top (for accents resting on top of letters)
    if (baseBBox) {
      if (Math.abs(currentYMin - baseBBox.y2) < snapThreshold) {
        offsetY = Math.round(baseBBox.y2 - vBBox.yMin);
        snapY = 'base_top';
      } else if (Math.abs(currentYMin - (baseBBox.y2 + 40)) < snapThreshold) {
        // Comfort margin gap on top
        offsetY = Math.round((baseBBox.y2 + 40) - vBBox.yMin);
        snapY = 'base_top_gap';
      }
    }

    // B. Check standard vertical lines
    if (!snapY) {
      if (Math.abs(currentYMin - 0) < snapThreshold) {
        offsetY = Math.round(-vBBox.yMin);
        snapY = 'baseline';
      } else if (Math.abs(currentYMax - fontMetadata.xHeight) < snapThreshold) {
        offsetY = Math.round(fontMetadata.xHeight - vBBox.yMax);
        snapY = 'x_height';
      } else if (Math.abs(currentYMax - fontMetadata.capHeight) < snapThreshold) {
        offsetY = Math.round(fontMetadata.capHeight - vBBox.yMax);
        snapY = 'cap_height';
      }
    }

    return { offsetX, offsetY, snapX, snapY };
  };

  const hasVector = editState.svgPath.length > 0;

  // Mouse / Pointer Event Drag Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hasVector) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setIsDragging(true);
    dragStartRef.current = {
      mouseX,
      mouseY,
      offsetX: editState.offsetX,
      offsetY: editState.offsetY
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Mouse distance delta (pixels)
    const dx = mouseX - dragStartRef.current.mouseX;
    const dy = mouseY - dragStartRef.current.mouseY;

    const { scaleFactor } = getScaleFactorAndStartX();

    // Map canvas pixel delta into font design units (dx / rect.width * canvas.width is for high-DPI scaling preservation)
    const renderScaleRatio = canvas.width / rect.width;
    const newOffsetXRaw = Math.round(dragStartRef.current.offsetX + (dx * renderScaleRatio) / scaleFactor);
    const newOffsetYRaw = Math.round(dragStartRef.current.offsetY - (dy * renderScaleRatio) / scaleFactor);

    // Bounding Box to calculate smart snaps
    const cmds = parseSvgPath(editState.svgPath);
    const transformed = transformCommands(
      cmds,
      editState.scaleX,
      editState.scaleY,
      0,
      0,
      editState.flipY
    );
    const vBBox = getExactBoundingBox(transformed);

    let finalOffsetX = newOffsetXRaw;
    let finalOffsetY = newOffsetYRaw;
    let snapX: string | null = null;
    let snapY: string | null = null;

    if (vBBox) {
      const snapResult = calculateSnaps(newOffsetXRaw, newOffsetYRaw, vBBox, scaleFactor);
      finalOffsetX = snapResult.offsetX;
      finalOffsetY = snapResult.offsetY;
      snapX = snapResult.snapX;
      snapY = snapResult.snapY;
    }

    const clampedX = Math.max(-1200, Math.min(1200, finalOffsetX));
    const clampedY = Math.max(-1200, Math.min(1200, finalOffsetY));

    setActiveSnaps({ x: snapX, y: snapY });

    onUpdateState(activeChar, {
      offsetX: clampedX,
      offsetY: clampedY
    });
  };

  const handleCanvasMouseUpOrLeave = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    setActiveSnaps({ x: null, y: null });
  };

  // Touch handlers for mobile/tablets support
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!hasVector || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    setIsDragging(true);
    dragStartRef.current = {
      mouseX,
      mouseY,
      offsetX: editState.offsetX,
      offsetY: editState.offsetY
    };
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStartRef.current || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    const dx = mouseX - dragStartRef.current.mouseX;
    const dy = mouseY - dragStartRef.current.mouseY;

    const { scaleFactor } = getScaleFactorAndStartX();
    const renderScaleRatio = canvas.width / rect.width;

    const newOffsetXRaw = Math.round(dragStartRef.current.offsetX + (dx * renderScaleRatio) / scaleFactor);
    const newOffsetYRaw = Math.round(dragStartRef.current.offsetY - (dy * renderScaleRatio) / scaleFactor);

    const cmds = parseSvgPath(editState.svgPath);
    const transformed = transformCommands(
      cmds,
      editState.scaleX,
      editState.scaleY,
      0,
      0,
      editState.flipY
    );
    const vBBox = getExactBoundingBox(transformed);

    let finalOffsetX = newOffsetXRaw;
    let finalOffsetY = newOffsetYRaw;
    let snapX: string | null = null;
    let snapY: string | null = null;

    if (vBBox) {
      const snapResult = calculateSnaps(newOffsetXRaw, newOffsetYRaw, vBBox, scaleFactor);
      finalOffsetX = snapResult.offsetX;
      finalOffsetY = snapResult.offsetY;
      snapX = snapResult.snapX;
      snapY = snapResult.snapY;
    }

    const clampedX = Math.max(-1200, Math.min(1200, finalOffsetX));
    const clampedY = Math.max(-1200, Math.min(1200, finalOffsetY));

    setActiveSnaps({ x: snapX, y: snapY });

    onUpdateState(activeChar, {
      offsetX: clampedX,
      offsetY: clampedY
    });
  };

  const handleCanvasTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    setActiveSnaps({ x: null, y: null });
  };

  // Mathematical Quick Action: Auto Center Horizontally
  const handleAutoCenter = () => {
    const cmds = parseSvgPath(editState.svgPath);
    if (cmds.length === 0) return;
    const { xMin, xMax } = getExactBoundingBox(cmds);
    
    // Aligns the horizontal center of the vector path to the center of the advance width
    const newOffsetX = (editState.advanceWidth / 2) - ((xMin + xMax) / 2) * editState.scaleX;
    onUpdateState(activeChar, { offsetX: Math.round(newOffsetX) });
  };

  // Mathematical Quick Action: Auto Scale to x-Height (for lowercase)
  const handleAutoScaleXHeight = () => {
    const cmds = parseSvgPath(editState.svgPath);
    if (cmds.length === 0) return;
    const { yMin, yMax } = getExactBoundingBox(cmds);
    const height = yMax - yMin;
    if (height === 0) return;

    const newScaleY = fontMetadata.xHeight / height;
    const newScaleX = scaleLinked ? newScaleY : editState.scaleX;
    
    onUpdateState(activeChar, { 
      scaleY: parseFloat(newScaleY.toFixed(3)),
      scaleX: parseFloat(newScaleX.toFixed(3))
    });
  };

  // Mathematical Quick Action: Auto Scale to Cap-Height (for uppercase)
  const handleAutoScaleCapHeight = () => {
    const cmds = parseSvgPath(editState.svgPath);
    if (cmds.length === 0) return;
    const { yMin, yMax } = getExactBoundingBox(cmds);
    const height = yMax - yMin;
    if (height === 0) return;

    const newScaleY = fontMetadata.capHeight / height;
    const newScaleX = scaleLinked ? newScaleY : editState.scaleX;

    onUpdateState(activeChar, { 
      scaleY: parseFloat(newScaleY.toFixed(3)),
      scaleX: parseFloat(newScaleX.toFixed(3))
    });
  };

  // Smart Snap Action: Instantly snap to base glyph's horizontal center & sit exactly on its top
  const handleSnapToBase = () => {
    const baseGlyph = font.charToGlyph(editState.baseChar);
    if (!baseGlyph) return;
    const baseBBox = baseGlyph.getBoundingBox();
    const cmds = parseSvgPath(editState.svgPath);
    if (cmds.length === 0) return;

    const transformed = transformCommands(
      cmds,
      editState.scaleX,
      editState.scaleY,
      0,
      0,
      editState.flipY
    );
    const vBBox = getExactBoundingBox(transformed);

    const baseXCenter = (baseBBox.x1 + baseBBox.x2) / 2;
    const newOffsetX = Math.round(baseXCenter - (vBBox.xMin + vBBox.xMax) / 2);
    
    // Sitting exactly on top of the base glyph (e.g. 30 UPM comfortable spacing)
    const newOffsetY = Math.round(baseBBox.y2 + 30 - vBBox.yMin);

    onUpdateState(activeChar, {
      offsetX: newOffsetX,
      offsetY: newOffsetY
    });
  };

  // Smart Fill: Copy Advance Width & bearings from the Base character
  const handleCopyBaseMetrics = () => {
    const baseGlyph = font.charToGlyph(editState.baseChar);
    if (baseGlyph) {
      onUpdateState(activeChar, { 
        advanceWidth: baseGlyph.advanceWidth 
      });
    }
  };

  // Render baseline, side bearings, and parsed path to HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and handle scaling for high DPI screens
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const { scaleFactor, fontStartX, baselineY, width, height } = getScaleFactorAndStartX();
    const upm = fontMetadata.unitsPerEm;
    const padding = 60;
    const drawHeight = height - padding * 2;

    // Draw grid background (subtle dots)
    ctx.strokeStyle = '#f1f1f1';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 20) {
      for (let y = 0; y < height; y += 20) {
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // 1. Draw Reference Guides (baseline, cap height, etc.)
    const drawGuideLine = (yVal: number, label: string, color: string, isDashed = true) => {
      const yCanvas = baselineY - yVal * scaleFactor;
      ctx.beginPath();
      if (isDashed) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.moveTo(10, yCanvas);
      ctx.lineTo(width - 10, yCanvas);
      ctx.stroke();

      // Draw label
      ctx.fillStyle = color;
      ctx.font = '10px monospace';
      ctx.fillText(`${label} (${yVal})`, 15, yCanvas - 4);
    };

    // Reference lines
    drawGuideLine(fontMetadata.ascender, 'Ascender', '#ef4444', true);
    drawGuideLine(fontMetadata.capHeight, 'Cap Height', '#f97316', true);
    drawGuideLine(fontMetadata.xHeight, 'x-Height', '#a855f7', true);
    drawGuideLine(0, 'Baseline', '#3b82f6', false);
    drawGuideLine(fontMetadata.descender, 'Descender', '#ef4444', true);

    // 2. Draw Side Bearings (Vertical boundary lines)
    const drawVerticalGuide = (xVal: number, label: string, color: string) => {
      const xCanvas = fontStartX + xVal * scaleFactor;
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.moveTo(xCanvas, 20);
      ctx.lineTo(xCanvas, height - 20);
      ctx.stroke();

      // Draw label rotated or at bottom
      ctx.fillStyle = color;
      ctx.font = '10px monospace';
      ctx.fillText(label, xCanvas + 4, height - 25);
    };

    drawVerticalGuide(0, 'Left Border (X=0)', '#3b82f6');
    drawVerticalGuide(editState.advanceWidth, 'Right Border (Width)', '#3b82f6');

    // 3. Draw original base glyph outline as faint transparent background with customizable opacity
    if (showReference) {
      const baseGlyph = font.charToGlyph(editState.baseChar);
      if (baseGlyph) {
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(100, 116, 139, ${bgOpacity / 100})`; // use slate color with user opacity
        ctx.strokeStyle = `rgba(100, 116, 139, ${Math.min(0.9, (bgOpacity + 20) / 100)})`; // outline slightly sharper
        ctx.lineWidth = 1;
        
        // Let's draw using opentype.js native rendering relative to our coordinates
        const fontPath = baseGlyph.getPath(fontStartX, baselineY, scaleFactor * upm);
        fontPath.fill = `rgba(100, 116, 139, ${bgOpacity / 100})`;
        fontPath.stroke = `rgba(100, 116, 139, ${Math.min(0.9, (bgOpacity + 20) / 100)})`;
        fontPath.draw(ctx);
      }
    }

    // 3b. Draw vertical center guidelines to make aligning pasted character super easy
    if (showReference) {
      const baseGlyph = font.charToGlyph(editState.baseChar);
      if (baseGlyph) {
        const baseBBox = baseGlyph.getBoundingBox();
        const baseXCenter = (baseBBox.x1 + baseBBox.x2) / 2;
        const baseXCanvas = fontStartX + baseXCenter * scaleFactor;
        
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = '#0284c7'; // Clear sky blue
        ctx.beginPath();
        ctx.moveTo(baseXCanvas, 20);
        ctx.lineTo(baseXCanvas, height - 20);
        ctx.stroke();

        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('Tâm chữ gốc', baseXCanvas + 5, 30);
      }
    }

    // 4. Draw User Vector Shape as crisp, solid silhouette
    const rawCmds = parseSvgPath(editState.svgPath);
    if (rawCmds.length > 0) {
      const transformed = transformCommands(
        rawCmds,
        editState.scaleX,
        editState.scaleY,
        editState.offsetX,
        editState.offsetY,
        editState.flipY
      );

      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(15, 23, 42, ${pastedOpacity / 100})`; // Deep crisp charcoal outline with customizable opacity
      ctx.fillStyle = `rgba(30, 41, 59, ${pastedOpacity / 100})`; // Slate/black fill with customizable opacity
      ctx.lineWidth = 1.5;

      // Draw each command scaled and offset
      transformed.forEach(cmd => {
        const cx = fontStartX + cmd.x * scaleFactor;
        const cy = baselineY - cmd.y * scaleFactor;

        if (cmd.type === 'M') {
          ctx.moveTo(cx, cy);
        } else if (cmd.type === 'L') {
          ctx.lineTo(cx, cy);
        } else if (cmd.type === 'Q') {
          const cx1 = fontStartX + cmd.x1 * scaleFactor;
          const cy1 = baselineY - cmd.y1 * scaleFactor;
          ctx.quadraticCurveTo(cx1, cy1, cx, cy);
        } else if (cmd.type === 'C') {
          const cx1 = fontStartX + cmd.x1 * scaleFactor;
          const cy1 = baselineY - cmd.y1 * scaleFactor;
          const cx2 = fontStartX + cmd.x2 * scaleFactor;
          const cy2 = baselineY - cmd.y2 * scaleFactor;
          ctx.bezierCurveTo(cx1, cy1, cx2, cy2, cx, cy);
        } else if (cmd.type === 'Z') {
          ctx.closePath();
        }
      });

      ctx.fill();
      ctx.stroke();

      // Draw vertical center of the pasted shape
      const vBBox = getExactBoundingBox(transformed);
      const pastedXCenter = (vBBox.xMin + vBBox.xMax) / 2;
      const pastedXCanvas = fontStartX + pastedXCenter * scaleFactor;

      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = '#ec4899'; // Magenta/pink
      ctx.beginPath();
      ctx.moveTo(pastedXCanvas, 20);
      ctx.lineTo(pastedXCanvas, height - 20);
      ctx.stroke();

      ctx.fillStyle = '#db2777';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Tâm chữ mới', pastedXCanvas + 5, 45);
    }

    // 5. Draw Active Snapping Guidelines dynamically over the elements
    const baseGlyph = font.charToGlyph(editState.baseChar);
    const baseBBox = baseGlyph ? baseGlyph.getBoundingBox() : null;

    if (activeSnaps.x || activeSnaps.y) {
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = '#db2777'; // Vibrant pink/magenta
      ctx.fillStyle = '#db2777';
      ctx.font = 'bold 9px sans-serif';

      if (activeSnaps.x) {
        let snapXVal = 0;
        let label = '';
        if (activeSnaps.x === 'base_center_x' && baseBBox) {
          snapXVal = (baseBBox.x1 + baseBBox.x2) / 2;
          label = 'HÍT TRUNG TÂM CHỮ GỐC';
        } else if (activeSnaps.x === 'left_border') {
          snapXVal = 0;
          label = 'HÍT BIÊN TRÁI (X=0)';
        } else if (activeSnaps.x === 'right_border') {
          snapXVal = editState.advanceWidth;
          label = 'HÍT BIÊN PHẢI (W)';
        } else if (activeSnaps.x === 'center_x') {
          snapXVal = editState.advanceWidth / 2;
          label = 'HÍT GIỮA KHUNG ĐỘ RỘNG';
        }

        const xCanvas = fontStartX + snapXVal * scaleFactor;
        ctx.beginPath();
        ctx.moveTo(xCanvas, 15);
        ctx.lineTo(xCanvas, height - 15);
        ctx.stroke();
        ctx.fillText(label, xCanvas + 5, 60);
      }

      if (activeSnaps.y) {
        let snapYVal = 0;
        let label = '';
        if (activeSnaps.y === 'base_top' && baseBBox) {
          snapYVal = baseBBox.y2;
          label = 'HÍT ĐỈNH CHỮ GỐC';
        } else if (activeSnaps.y === 'base_top_gap' && baseBBox) {
          snapYVal = baseBBox.y2 + 40;
          label = 'HÍT ĐỈNH (+40 UPM GAP)';
        } else if (activeSnaps.y === 'baseline') {
          snapYVal = 0;
          label = 'HÍT DÒNG BASELINE';
        } else if (activeSnaps.y === 'x_height') {
          snapYVal = fontMetadata.xHeight;
          label = 'HÍT DÒNG X-HEIGHT';
        } else if (activeSnaps.y === 'cap_height') {
          snapYVal = fontMetadata.capHeight;
          label = 'HÍT DÒNG CAP-HEIGHT';
        }

        const yCanvas = baselineY - snapYVal * scaleFactor;
        ctx.beginPath();
        ctx.moveTo(15, yCanvas);
        ctx.lineTo(width - 15, yCanvas);
        ctx.stroke();
        ctx.fillText(label, width - 150, yCanvas - 5);
      }
    }

  }, [font, fontMetadata, editState, showReference, activeSnaps, snapEnabled, bgOpacity, pastedOpacity, zoom]);

  return (
    <div id="glyph-studio-panel" className="bg-white border border-neutral-100 rounded-xl p-6 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Visual Workspace Canvas (Left 7 Columns) */}
      <div className="lg:col-span-7 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              Bàn làm việc: <span className="text-xl text-neutral-950 font-sans font-extrabold">{editState.char}</span>
              <span className="text-xs font-normal text-neutral-500 font-mono">({editState.description})</span>
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={snapEnabled}
                onChange={(e) => setSnapEnabled(e.target.checked)}
                className="rounded-sm border-neutral-300 text-neutral-800 focus:ring-neutral-800"
              />
              <span className="font-medium text-neutral-700">Tự động hít điểm (Auto Snap)</span>
            </label>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showReference}
                  onChange={(e) => setShowReference(e.target.checked)}
                  className="rounded-sm border-neutral-300 text-neutral-800 focus:ring-neutral-800"
                />
                <span>Hiện chữ gốc [{editState.baseChar}]</span>
              </label>

              {showReference && (
                <div className="flex items-center gap-1.5 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 font-medium">Độ mờ nền:</span>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="10"
                    value={bgOpacity}
                    onChange={(e) => setBgOpacity(Number(e.target.value))}
                    className="w-16 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-800"
                  />
                  <span className="text-[10px] text-neutral-600 font-mono font-bold">{bgOpacity}%</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-100">
                <span className="text-[10px] text-neutral-500 font-medium">Độ mờ nét mới:</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={pastedOpacity}
                  onChange={(e) => setPastedOpacity(Number(e.target.value))}
                  className="w-16 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-800"
                />
                <span className="text-[10px] text-neutral-600 font-mono font-bold">{pastedOpacity}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Canvas Container with Pointer Event Listeners for direct drag & drop */}
        <div className="relative border border-neutral-100 rounded-xl bg-neutral-50 overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={440}
            height={440}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUpOrLeave}
            onMouseLeave={handleCanvasMouseUpOrLeave}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
            style={{ cursor: isDragging ? 'grabbing' : hasVector ? 'grab' : 'default' }}
            className="w-full aspect-square max-w-[440px] block transition-shadow touch-none select-none"
          />

          {/* Zoom Controls Overlay */}
          <div 
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-neutral-200 p-1.5 rounded-lg shadow-sm z-10 select-none"
          >
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(0.5, parseFloat((prev - 0.25).toFixed(2))))}
              title="Thu nhỏ"
              className="p-1 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-neutral-700 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(5.0, parseFloat((prev + 0.25).toFixed(2))))}
              title="Phóng to"
              className="p-1 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1.0)}
              title="Khôi phục 100%"
              className="text-[10px] font-bold text-neutral-500 hover:text-neutral-950 px-1.5 py-0.5 hover:bg-neutral-100 rounded-md transition-colors border-l border-neutral-100 ml-0.5 cursor-pointer"
            >
              100%
            </button>
          </div>

          {!hasVector && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <Sparkles className="w-8 h-8 text-neutral-400 mb-2 animate-bounce" />
              <h5 className="font-bold text-neutral-800 text-sm mb-1">Chưa có dữ liệu vector</h5>
              <p className="text-xs text-neutral-500 max-w-xs">
                Hãy dán mã vector Illustrator hoặc gõ path <span className="font-mono">d</span> của ký tự <strong className="text-neutral-700 font-bold">{editState.char}</strong> ở ô bên phải để hiển thị.
              </p>
            </div>
          )}
        </div>

        {/* Keyboard movement helper notes */}
        <div className="mt-2 text-[11px] text-neutral-400 font-medium">
          * Mẹo: Bạn có thể nhấn và giữ chuột trái kéo trực tiếp trên màn vẽ Liveview để căn chỉnh vị trí mượt mà kết hợp tự động hít điểm.
        </div>
      </div>

      {/* Adjustments & Code Input (Right 5 Columns) */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        
        {/* 1. Vector XML Input Box */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-neutral-800">
            Dán Vector / Mã SVG từ Adobe Illustrator
          </label>
          <textarea
            id="vector-input-area"
            rows={4}
            value={pastedValue}
            onChange={(e) => handleVectorPaste(e.target.value)}
            placeholder="Dán mã SVG (<svg>...) hoặc chuỗi path d (M100 200 L...)"
            className="w-full text-xs font-mono p-3 border border-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-neutral-800 rounded-lg placeholder-neutral-400"
          />
          <p className="text-[10px] text-neutral-500">
            Hỗ trợ tự động trích xuất thuộc tính <span className="font-mono">d="..."</span> của thẻ path từ Illustrator clipboard.
          </p>
        </div>

        {/* 2. Transformation Sliders */}
        <div className="space-y-4 border-y border-neutral-100 py-4">
          <h5 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Căn Chỉnh Tọa Độ & Tỉ Lệ Vector
          </h5>

          {/* Scale Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-neutral-700 flex items-center gap-1">
                Tỉ lệ (Scale)
                <button 
                  onClick={() => setScaleLinked(!scaleLinked)}
                  className="text-neutral-400 hover:text-neutral-800 transition"
                  title={scaleLinked ? 'Hủy liên kết X/Y' : 'Liên kết X/Y'}
                >
                  {scaleLinked ? <Link className="w-3 h-3 text-neutral-700" /> : <Link2Off className="w-3 h-3 text-neutral-400" />}
                </button>
              </span>
              <span className="font-mono text-neutral-500 font-bold">
                X: {editState.scaleX.toFixed(2)} | Y: {editState.scaleY.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] text-neutral-500 font-mono">Scale X</span>
                  <input
                    type="number"
                    min="0.1"
                    max="10.0"
                    step="0.01"
                    value={editState.scaleX}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        onUpdateState(activeChar, { 
                          scaleX: val,
                          ...(scaleLinked ? { scaleY: val } : {})
                        });
                      }
                    }}
                    className="w-16 text-[10px] font-mono font-bold text-right px-1 py-0.5 border border-neutral-200 bg-white rounded-md focus:outline-hidden focus:ring-1 focus:ring-neutral-800"
                  />
                </div>
                <input
                  id="slider-scale-x"
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.05"
                  value={editState.scaleX}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onUpdateState(activeChar, { 
                      scaleX: val,
                      ...(scaleLinked ? { scaleY: val } : {})
                    });
                  }}
                  className="w-full accent-neutral-800 cursor-pointer"
                />
              </div>
              <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] text-neutral-500 font-mono">Scale Y</span>
                  <input
                    type="number"
                    min="0.1"
                    max="10.0"
                    step="0.01"
                    value={editState.scaleY}
                    disabled={scaleLinked}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        onUpdateState(activeChar, { scaleY: val });
                      }
                    }}
                    className="w-16 text-[10px] font-mono font-bold text-right px-1 py-0.5 border border-neutral-200 bg-white rounded-md focus:outline-hidden focus:ring-1 focus:ring-neutral-800 disabled:opacity-50"
                  />
                </div>
                <input
                  id="slider-scale-y"
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.05"
                  value={editState.scaleY}
                  disabled={scaleLinked}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onUpdateState(activeChar, { scaleY: val });
                  }}
                  className="w-full accent-neutral-800 disabled:opacity-50 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Offset X Slider & Input */}
          <div className="space-y-1 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-medium text-neutral-700">Dịch ngang (Offset X)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="-1200"
                  max="1200"
                  step="1"
                  value={editState.offsetX}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      onUpdateState(activeChar, { offsetX: val });
                    }
                  }}
                  className="w-16 text-[10px] font-mono font-bold text-right px-1 py-0.5 border border-neutral-200 bg-white rounded-md focus:outline-hidden focus:ring-1 focus:ring-neutral-800"
                />
                <span className="text-[9px] text-neutral-400 font-mono">UPM</span>
              </div>
            </div>
            <input
              id="slider-offset-x"
              type="range"
              min="-1200"
              max="1200"
              step="5"
              value={editState.offsetX}
              onChange={(e) => onUpdateState(activeChar, { offsetX: parseInt(e.target.value) })}
              className="w-full accent-neutral-800 cursor-pointer"
            />
          </div>

          {/* Offset Y Slider & Input */}
          <div className="space-y-1 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-medium text-neutral-700">Dịch dọc (Offset Y)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="-1200"
                  max="1200"
                  step="1"
                  value={editState.offsetY}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      onUpdateState(activeChar, { offsetY: val });
                    }
                  }}
                  className="w-16 text-[10px] font-mono font-bold text-right px-1 py-0.5 border border-neutral-200 bg-white rounded-md focus:outline-hidden focus:ring-1 focus:ring-neutral-800"
                />
                <span className="text-[9px] text-neutral-400 font-mono">UPM</span>
              </div>
            </div>
            <input
              id="slider-offset-y"
              type="range"
              min="-1200"
              max="1200"
              step="5"
              value={editState.offsetY}
              onChange={(e) => onUpdateState(activeChar, { offsetY: parseInt(e.target.value) })}
              className="w-full accent-neutral-800 cursor-pointer"
            />
          </div>

          {/* Flip Y */}
          <div className="flex justify-between items-center text-xs pt-1">
            <span className="font-medium text-neutral-700">Lật ngược trục Y (Illustrator chuẩn)</span>
            <input
              id="checkbox-flip-y"
              type="checkbox"
              checked={editState.flipY}
              onChange={(e) => onUpdateState(activeChar, { flipY: e.target.checked })}
              className="rounded-sm border-neutral-300 text-neutral-800 focus:ring-neutral-800"
            />
          </div>
        </div>

        {/* 3. Mathematical Quick-Alignment Buttons */}
        <div className="space-y-2">
          <span className="block text-xs font-bold text-neutral-800">Căn Chỉnh Thông Minh (AI Smart Align)</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              id="btn-auto-center"
              onClick={handleAutoCenter}
              disabled={!hasVector}
              className="py-2 px-1 text-[11px] font-semibold border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed text-center"
              title="Căn giữa hình vector vào giữa vùng chiều rộng glyph"
            >
              <AlignCenter className="w-3.5 h-3.5 shrink-0" />
              <span>Căn Giữa X</span>
            </button>
            <button
              id="btn-auto-scale-xheight"
              onClick={handleAutoScaleXHeight}
              disabled={!hasVector}
              className="py-2 px-1 text-[11px] font-semibold border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed text-center"
              title="Tự động thu phóng chiều cao vector bằng với chiều cao x-height"
            >
              <Shrink className="w-3.5 h-3.5 shrink-0" />
              <span>Khớp x-Height</span>
            </button>
            <button
              id="btn-auto-scale-capheight"
              onClick={handleAutoScaleCapHeight}
              disabled={!hasVector}
              className="py-2 px-1 text-[11px] font-semibold border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed text-center"
              title="Tự động thu phóng chiều cao vector bằng với chiều cao chữ hoa"
            >
              <Maximize2 className="w-3.5 h-3.5 shrink-0" />
              <span>Khớp CapHeight</span>
            </button>
            <button
              id="btn-snap-to-base"
              onClick={handleSnapToBase}
              disabled={!hasVector}
              className="py-2 px-1 text-[11px] font-bold border border-pink-100 bg-pink-50/50 hover:bg-pink-50 text-pink-700 hover:border-pink-300 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed text-center"
              title="Đặt tức thì lên đỉnh trung tâm chữ cái gốc"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-pink-600" />
              <span>Đặt lên Chữ Gốc</span>
            </button>
          </div>
        </div>

        {/* 4. Tracking / Metrics Adjuster & Smart Cloning */}
        <div className="bg-neutral-50 p-4 border border-neutral-100 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-neutral-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
              Chỉ Số Tracking (Chiều Rộng Phím)
            </span>
            <button
              id="btn-copy-metrics"
              onClick={handleCopyBaseMetrics}
              className="text-[10px] font-bold text-neutral-800 hover:text-neutral-950 flex items-center gap-1 py-1 px-2 border border-neutral-200 bg-white hover:bg-neutral-50 rounded-md transition"
              title="Sao chép chiều rộng của chữ cái gốc"
            >
              <Copy className="w-3 h-3" />
              Sao chép từ [{editState.baseChar}]
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-600">Advance Width:</span>
              <span className="font-mono text-neutral-800 font-bold">{editState.advanceWidth} UPM</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="slider-advance-width"
                type="range"
                min="100"
                max="1800"
                step="10"
                value={editState.advanceWidth}
                onChange={(e) => onUpdateState(activeChar, { advanceWidth: parseInt(e.target.value) })}
                className="w-full accent-neutral-800"
              />
              <input
                type="number"
                value={editState.advanceWidth}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onUpdateState(activeChar, { advanceWidth: val });
                }}
                className="w-16 text-center text-xs p-1 border border-neutral-200 rounded-sm font-mono font-bold"
              />
            </div>
          </div>

          {/* Smart Kerning Checkbox */}
          <label className="flex items-start gap-2 text-xs text-neutral-600 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={editState.useSmartKerning}
              onChange={(e) => onUpdateState(activeChar, { useSmartKerning: e.target.checked })}
              className="rounded-sm border-neutral-300 text-neutral-800 focus:ring-neutral-800 mt-0.5"
            />
            <div>
              <span className="block font-bold text-neutral-800">Đồng bộ Kerning tự động</span>
              <span className="block text-[10px] text-neutral-500 leading-normal">
                Tự sao chép các cặp căn khoảng cách (Kerning pairs) của chữ gốc [{editState.baseChar}] sang chữ [{editState.char}] khi tải về.
              </span>
            </div>
          </label>

          {/* Manual Kerning Panel */}
          {!editState.useSmartKerning && (
            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-3 mt-2">
              <div className="flex justify-between items-center border-b border-neutral-200 pb-1.5">
                <span className="font-bold text-xs text-neutral-800">Kerning thủ công cho [{editState.char}]</span>
                <span className="text-[10px] text-neutral-500 font-mono">Đơn vị: UPM</span>
              </div>

              {/* Current manual kerning list */}
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {(editState.manualKerning || []).length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic text-center py-2">
                    Chưa có cặp kerning thủ công nào. Hãy thêm ở dưới.
                  </p>
                ) : (
                  (editState.manualKerning || []).map((pair, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-2 py-1 rounded-md border border-neutral-150 text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-neutral-700">
                        {pair.isCompanionLeft ? (
                          <>
                            <span className="bg-neutral-100 px-1.5 py-0.5 rounded font-bold text-neutral-800">{pair.companion}</span>
                            <span className="text-neutral-400">+</span>
                            <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded font-bold">{editState.char}</span>
                          </>
                        ) : (
                          <>
                            <span className="bg-neutral-800 text-white px-1.5 py-0.5 rounded font-bold">{editState.char}</span>
                            <span className="text-neutral-400">+</span>
                            <span className="bg-neutral-100 px-1.5 py-0.5 rounded font-bold text-neutral-800">{pair.companion}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={pair.value}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              const updated = (editState.manualKerning || []).map((p, i) => i === idx ? { ...p, value: val } : p);
                              onUpdateState(activeChar, { manualKerning: updated });
                            }
                          }}
                          className="w-14 text-right px-1 py-0.5 border border-neutral-200 rounded text-xs bg-neutral-50"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editState.manualKerning || []).filter((_, i) => i !== idx);
                            onUpdateState(activeChar, { manualKerning: updated });
                          }}
                          className="text-neutral-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add form */}
              <div className="bg-white p-2 rounded-md border border-neutral-200 space-y-2">
                <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Thêm cặp mới</span>
                <div className="grid grid-cols-12 gap-1.5 items-center">
                  {/* Pair Layout Selection */}
                  <select
                    value={newIsCompanionLeft ? 'left' : 'right'}
                    onChange={(e) => setNewIsCompanionLeft(e.target.value === 'left')}
                    className="col-span-6 text-xs p-1 bg-neutral-50 border border-neutral-200 rounded outline-hidden"
                  >
                    <option value="right">[{editState.char}] đứng trước (Trái)</option>
                    <option value="left">[{editState.char}] đứng sau (Phải)</option>
                  </select>

                  {/* Companion char input */}
                  <input
                    type="text"
                    maxLength={1}
                    placeholder="Ký tự phụ"
                    value={newCompanion}
                    onChange={(e) => setNewCompanion(e.target.value)}
                    className="col-span-3 text-center text-xs p-1 border border-neutral-200 rounded font-bold bg-neutral-50"
                    title="Nhập 1 chữ cái đồng hành, ví dụ: v, y, T, V"
                  />

                  {/* Kern value input */}
                  <input
                    type="number"
                    placeholder="UPM"
                    value={newKernValue === 0 ? '' : newKernValue}
                    onChange={(e) => setNewKernValue(parseInt(e.target.value, 10) || 0)}
                    className="col-span-3 text-right text-xs p-1 border border-neutral-200 rounded font-mono font-bold bg-neutral-50"
                    title="Giá trị chỉnh khoảng cách (ví dụ -40, 20)"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!newCompanion.trim()) return;
                    const charToKerning = newCompanion.trim()[0];
                    const existing = (editState.manualKerning || []).find(p => p.companion === charToKerning && p.isCompanionLeft === newIsCompanionLeft);
                    if (existing) {
                      alert(`Đã tồn tại cấu hình kerning cho cặp này!`);
                      return;
                    }
                    const updated = [...(editState.manualKerning || []), {
                      companion: charToKerning,
                      isCompanionLeft: newIsCompanionLeft,
                      value: newKernValue
                    }];
                    onUpdateState(activeChar, { manualKerning: updated });
                    setNewCompanion('');
                    setNewKernValue(0);
                  }}
                  className="w-full py-1 px-2 text-[10px] font-bold bg-neutral-800 text-white rounded hover:bg-neutral-900 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Xác nhận thêm cặp kerning
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Save & Reset Action row */}
        <div className="flex items-center gap-3 pt-2">
          <button
            id="btn-save-slot"
            onClick={() => onSaveSlot(activeChar)}
            disabled={!hasVector}
            className="flex-1 py-3 px-4 font-bold text-xs bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition shadow-sm disabled:opacity-45 disabled:cursor-not-allowed"
          >
            Lưu ký tự này
          </button>
          
          <button
            id="btn-clear-slot"
            onClick={() => {
              onClearSlot(activeChar);
              setPastedValue('');
            }}
            className="p-3 border border-neutral-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 rounded-lg text-neutral-500 transition"
            title="Xóa trống dữ liệu ký tự này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
