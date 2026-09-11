import React, { useEffect, useRef } from 'react';
import type { FontMetadata } from '../../core/session';
import type { GlyphPreview } from '../../core/index';

// Draws one glyph from the preview session. It never touches the compiler, so it
// can repaint on every keystroke.

export type ViewMode = 'composed' | 'native' | 'overlay';

interface PreviewCanvasProps {
  preview: GlyphPreview | null;
  metadata: FontMetadata;
  /**
   * The font's own outline for this character, in font units, when it has one.
   * Overlay mode is the only reliable way to answer "does the accent I generated
   * match the one the designer drew" - side-by-side comparison hides differences
   * of a few units that overlay makes obvious.
   */
  nativePath?: { commands: any[] } | null;
  viewMode?: ViewMode;
  /** Baseline the whole vowel group is aligned to, drawn as a reference line. */
  groupTopY?: number;
  showGuides?: boolean;
  zoom?: number;
  /** Distance of this glyph's accent top from the group median, in font units. */
  offsetFromGroup?: number;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  preview, metadata, nativePath, viewMode = 'composed',
  groupTopY, showGuides = true, zoom = 1, offsetFromGroup
}) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 400;
    const h = canvas.clientHeight || 400;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const upm = metadata.unitsPerEm || 1000;
    const scale = ((h * 0.62) / upm) * zoom;
    const originX = w / 2 - ((preview?.advanceWidth ?? upm * 0.5) * scale) / 2;
    const originY = h * 0.72;

    const toY = (y: number) => originY - y * scale;

    if (showGuides) {
      const lines: [number, string, string][] = [
        [0, '#d4d4d4', 'baseline'],
        [metadata.xHeight, '#e5e5e5', 'x-height'],
        [metadata.capHeight, '#e5e5e5', 'cap'],
        [metadata.ascender, '#f0f0f0', 'asc'],
        [metadata.descender, '#f0f0f0', 'desc']
      ];
      ctx.lineWidth = 1;
      for (const [y, color, label] of lines) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, toY(y));
        ctx.lineTo(w, toY(y));
        ctx.stroke();
        ctx.fillStyle = '#a3a3a3';
        ctx.font = '9px ui-sans-serif, system-ui';
        ctx.fillText(label, 4, toY(y) - 3);
      }

      // The group reference line: every á é í ó ú ý should touch it.
      if (groupTopY !== undefined) {
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(0, toY(groupTopY));
        ctx.lineTo(w, toY(groupTopY));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#b45309';
        ctx.fillText('đỉnh dấu của nhóm', 4, toY(groupTopY) - 3);
      }
    }

    const trace = (commands: any[]) => {
      ctx.beginPath();
      for (const cmd of commands) {
        if (cmd.type === 'M') ctx.moveTo(cmd.x, cmd.y);
        else if (cmd.type === 'L') ctx.lineTo(cmd.x, cmd.y);
        else if (cmd.type === 'Q') ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
        else if (cmd.type === 'C') ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        else if (cmd.type === 'Z') ctx.closePath();
      }
    };

    const withGlyphTransform = (draw: () => void) => {
      ctx.save();
      ctx.translate(originX, originY);
      ctx.scale(scale, -scale);
      draw();
      ctx.restore();
    };

    const showNative = (viewMode === 'native' || viewMode === 'overlay') && nativePath?.commands?.length;
    const showComposed = viewMode !== 'native' && preview;

    if (showNative) {
      withGlyphTransform(() => {
        trace(nativePath!.commands);
        if (viewMode === 'native') {
          ctx.fillStyle = '#171717';
          ctx.fill('nonzero');
        } else {
          ctx.fillStyle = 'rgba(220, 38, 38, 0.22)';
          ctx.fill('nonzero');
          ctx.lineWidth = 1 / scale;
          ctx.strokeStyle = 'rgba(185, 28, 28, 0.9)';
          ctx.stroke();
        }
      });
    }

    if (showComposed) {
      withGlyphTransform(() => {
        trace(preview!.path.commands as any[]);
        if (viewMode === 'overlay') {
          ctx.fillStyle = 'rgba(23, 23, 23, 0.12)';
          ctx.fill('nonzero');
          ctx.lineWidth = 1.4 / scale;
          ctx.strokeStyle = '#171717';
          ctx.stroke();
        } else {
          ctx.fillStyle = '#171717';
          ctx.fill('nonzero');
        }
      });
    }

    if (!preview) return;

    // Advance width markers
    if (showGuides) {
      ctx.strokeStyle = '#e5e5e5';
      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, h);
      ctx.moveTo(originX + preview.advanceWidth * scale, 0);
      ctx.lineTo(originX + preview.advanceWidth * scale, h);
      ctx.stroke();
    }
  }, [preview, metadata, groupTopY, showGuides, zoom]);

  return (
    <div className="relative h-full w-full bg-neutral-50/50">
      <canvas ref={ref} className="w-full h-full" />
      {viewMode === 'overlay' ? (
        <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-white/95 border border-neutral-200 px-2.5 py-1.5 rounded-lg text-[10px] text-neutral-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm border border-neutral-900 bg-neutral-900/10" /> Dựng mới
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm border border-red-700 bg-red-600/20" /> Glyph gốc
          </span>
        </div>
      ) : null}
      {preview ? (
        <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
          <div className="bg-neutral-900/90 text-white text-[10px] px-2 py-1 rounded-md font-mono">
            {preview.char} · advance {Math.round(preview.advanceWidth)}
            {preview.source === 'original' ? ' · giữ glyph gốc' : ''}
          </div>
          {offsetFromGroup !== undefined && Math.abs(offsetFromGroup) > 0.5 ? (
            <div className="bg-amber-500/95 text-neutral-950 text-[10px] px-2 py-1 rounded-md font-mono">
              lệch {offsetFromGroup > 0 ? '+' : ''}{Math.round(offsetFromGroup)} so với nhóm
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
