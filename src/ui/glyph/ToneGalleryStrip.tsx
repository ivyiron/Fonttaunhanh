import React, { useMemo } from 'react';
import type { PreviewSession } from '../../core/index';
import { previewGlyphs, STEP2_RECIPES } from '../../core/index';

// The five tones of a double-accent vowel are the hardest set in the whole job:
// the tone has to clear the circumflex or breve underneath it, and the five marks
// have different widths. Judging them one at a time is how inconsistency gets in,
// so they are always shown together, at one scale, on one baseline.

interface ToneGalleryStripProps {
  session: PreviewSession | null;
  activeChar: string;
  onSelectChar: (char: string) => void;
}

export const ToneGalleryStrip: React.FC<ToneGalleryStripProps> = ({
  session, activeChar, onSelectChar
}) => {
  const siblings = useMemo(() => {
    const recipe = (STEP2_RECIPES as any[]).find(r => r.char === activeChar);
    if (!recipe || recipe.components.length < 2) return [];
    const stack = recipe.components.slice(0, -1).join('+');
    return (STEP2_RECIPES as any[])
      .filter(r =>
        r.components.length === recipe.components.length &&
        r.baseChar === recipe.baseChar &&
        r.components.slice(0, -1).join('+') === stack
      )
      .map(r => r.char);
  }, [activeChar]);

  const previews = useMemo(
    () => (session && siblings.length ? previewGlyphs(session, siblings) : []),
    [session, siblings, session?.stats.lastRebuildMs]
  );

  if (previews.length < 2) return null;

  // One shared scale and one shared baseline across all five, otherwise the
  // comparison is worthless.
  const boxes = previews.map(p => p.path.getBoundingBox());
  const top = Math.max(...boxes.map(b => b.y2));
  const bottom = Math.min(...boxes.map(b => b.y1));
  const height = Math.max(1, top - bottom);
  const pad = height * 0.12;
  const median = [...boxes.map(b => b.y2)].sort((a, b) => a - b)[Math.floor(boxes.length / 2)];

  return (
    <div className="border-t border-neutral-100 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[11px] font-medium text-neutral-700">Năm thanh cùng tầng dấu</span>
        <span className="text-[10px] text-neutral-400">cùng tỉ lệ, cùng baseline</span>
      </div>
      <div className="flex gap-2">
        {previews.map((p, i) => {
          const dev = boxes[i].y2 - median;
          const off = Math.abs(dev) > 1;
          const active = p.char === activeChar;
          const width = Math.max(1, p.advanceWidth);
          return (
            <button
              key={p.char}
              onClick={() => onSelectChar(p.char)}
              className={[
                'relative flex-1 min-w-0 rounded-lg border p-1.5 transition',
                active ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'
              ].join(' ')}
            >
              <svg
                viewBox={`0 ${-(top + pad)} ${width} ${height + pad * 2}`}
                className="w-full h-14"
                preserveAspectRatio="xMidYMid meet"
              >
                <line
                  x1={0} y1={-median} x2={width} y2={-median}
                  stroke={off ? '#f59e0b' : '#e5e5e5'} strokeWidth={height * 0.012}
                  strokeDasharray={`${height * 0.03} ${height * 0.03}`}
                />
                <path d={pathData(p.path.commands as any[])} fill="#171717" transform="scale(1,-1)" />
              </svg>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className="text-[11px] text-neutral-700">{p.char}</span>
                {off ? (
                  <span className="text-[9px] font-mono text-amber-700">
                    {dev > 0 ? '+' : ''}{Math.round(dev)}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

function pathData(commands: any[]): string {
  let d = '';
  for (const c of commands) {
    if (c.type === 'M') d += `M${c.x} ${c.y}`;
    else if (c.type === 'L') d += `L${c.x} ${c.y}`;
    else if (c.type === 'Q') d += `Q${c.x1} ${c.y1} ${c.x} ${c.y}`;
    else if (c.type === 'C') d += `C${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x} ${c.y}`;
    else if (c.type === 'Z') d += 'Z';
  }
  return d;
}
