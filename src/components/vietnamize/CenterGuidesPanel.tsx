import React, { useMemo, useRef, useState } from 'react';
import { RotateCcw, Minus, Plus } from 'lucide-react';
import { AutoPositionRules } from '../../types';
import { baseAxisX, commandsToSvgPathD, getExactBoundingBox, getGroupReferenceHeights } from '../../utils';
import { CENTER_LETTERS, baseLetterCommands } from '../../utils/markFit';

interface CenterGuidesPanelProps {
  font: any;
  rules: AutoPositionRules;
  onUpdateRules: (updates: Partial<AutoPositionRules>) => void;
}

/**
 * Centre axis of each base letter (the line marks are centred on, leaning with the font).
 * Drag the letter's card sideways, or nudge with − / +. Values in font units.
 */
export const CenterGuidesPanel: React.FC<CenterGuidesPanelProps> = ({ font, rules, onUpdateRules }) => {
  const centers = rules.baseCenters || {};
  const learned = rules.baseCentersLearned || {};
  const upm = font.unitsPerEm || 1000;
  const step = Math.max(1, Math.round(upm / 200));
  const tan = Math.tan(((rules.slantAngle || 0) * Math.PI) / 180);
  const heights = useMemo(() => getGroupReferenceHeights(font), [font]);
  const descender = Math.min(font.descender || -upm * 0.25, -upm * 0.15);
  const top = Math.max(heights.capHeightMax || upm * 0.7, heights.xHeightMax || 0) + upm * 0.32;
  const viewW = upm * 0.95;
  const viewH = top - descender;

  const [drag, setDrag] = useState<{ letter: string; value: number } | null>(null);
  const dragRef = useRef<{ letter: string; startX: number; startVal: number; unitsPerPx: number } | null>(null);

  const glyphs = useMemo(
    () =>
      CENTER_LETTERS.map((letter) => {
        const cmds = baseLetterCommands(font, letter);
        if (!cmds) return { letter, d: '', box: null as any };
        const b = getExactBoundingBox(cmds);
        return { letter, d: commandsToSvgPathD(cmds), box: { x1: b.xMin, y1: b.yMin, x2: b.xMax, y2: b.yMax } };
      }),
    [font]
  );

  const valueOf = (letter: string) => (drag && drag.letter === letter ? drag.value : centers[letter] || 0);
  const commit = (letter: string, v: number) => onUpdateRules({ baseCenters: { ...centers, [letter]: Math.round(v) } });

  const onDown = (e: React.PointerEvent<SVGSVGElement>, letter: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = { letter, startX: e.clientX, startVal: centers[letter] || 0, unitsPerPx: viewW / rect.width };
    setDrag({ letter, value: centers[letter] || 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setDrag({ letter: d.letter, value: Math.round(d.startVal + (e.clientX - d.startX) * d.unitsPerPx) });
  };
  const onUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && drag) commit(d.letter, drag.value);
    setDrag(null);
  };

  const changed = CENTER_LETTERS.some((l) => (centers[l] || 0) !== (learned[l] || 0));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Kéo ngang để dời trục tâm của chữ.
        </p>
        {changed && (
          <button
            type="button"
            onClick={() => onUpdateRules({ baseCenters: { ...learned } })}
            className="text-[11px] font-bold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Đặt lại tất cả
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {glyphs.map(({ letter, d, box }) => {
          const v = valueOf(letter);
          const isCap = letter !== letter.toLowerCase();
          const learnedV = learned[letter] || 0;
          if (!box) {
            return (
              <div key={letter} className="rounded-xl border border-dashed border-neutral-200 dark:border-[#323242] aspect-[3/4] flex items-center justify-center text-neutral-300 dark:text-neutral-600 text-2xl font-black">
                {letter}
              </div>
            );
          }
          const cx = (box.x1 + box.x2) / 2;
          const x0 = cx - viewW / 2;
          const axis = baseAxisX(box, letter, isCap, { ...rules, baseCenters: { ...centers, [letter]: v } });
          const midY = (box.y1 + box.y2) / 2;
          // font y-up → svg y-down: y_svg = top - y
          const ax = (y: number) => axis + tan * (y - midY);
          const markY = (isCap ? heights.capHeightMax : heights.xHeightMax) + upm * 0.12;
          const active = drag && drag.letter === letter;
          return (
            <div
              key={letter}
              className={`rounded-xl border bg-white dark:bg-[#20202a] overflow-hidden transition ${
                active ? 'border-amber-500' : 'border-neutral-200 dark:border-[#323242] hover:border-neutral-400 dark:hover:border-amber-500/50'
              }`}
            >
              <svg
                viewBox={`${x0} 0 ${viewW} ${viewH}`}
                className="w-full aspect-[3/4] touch-none cursor-ew-resize select-none text-neutral-900 dark:text-neutral-100"
                onPointerDown={(e) => onDown(e, letter)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
              >
                <line x1={x0} x2={x0 + viewW} y1={top} y2={top} stroke="currentColor" strokeOpacity="0.15" strokeWidth={upm / 400} />
                <path d={d} transform={`translate(0 ${top}) scale(1 -1)`} fill="currentColor" />
                {/* bbox centre (reference) */}
                <line
                  x1={cx + tan * (descender - midY)} y1={top - descender}
                  x2={cx + tan * (top - midY)} y2={0}
                  stroke="currentColor" strokeOpacity="0.18" strokeWidth={upm / 300} strokeDasharray={`${upm / 60} ${upm / 60}`}
                />
                {/* the axis */}
                <line
                  x1={ax(descender)} y1={top - descender}
                  x2={ax(top)} y2={0}
                  stroke="#f59e0b" strokeWidth={upm / 160}
                />
                {/* where a mark sits */}
                <path
                  d={`M ${ax(markY) - upm * 0.07} ${top - markY} L ${ax(markY)} ${top - markY - upm * 0.07} L ${ax(markY) + upm * 0.07} ${top - markY}`}
                  fill="none" stroke="#f59e0b" strokeWidth={upm / 90} strokeLinejoin="round" strokeLinecap="round"
                />
              </svg>
              <div className="flex items-center justify-between px-1.5 py-1 border-t border-neutral-100 dark:border-[#2d2d3a]">
                <button type="button" onClick={() => commit(letter, v - step)} className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer" title="Sang trái">
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => commit(letter, learnedV)}
                  disabled={v === learnedV}
                  className={`font-mono text-[11px] font-bold tabular-nums flex items-center gap-1 ${v === learnedV ? 'text-neutral-500 dark:text-neutral-400 cursor-default' : 'text-amber-600 dark:text-amber-400 cursor-pointer'}`}
                  title={v === learnedV ? undefined : 'Đặt lại'}
                >
                  {v > 0 ? `+${v}` : v}
                  {v !== learnedV && <RotateCcw className="w-2.5 h-2.5" />}
                </button>
                <button type="button" onClick={() => commit(letter, v + step)} className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer" title="Sang phải">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
