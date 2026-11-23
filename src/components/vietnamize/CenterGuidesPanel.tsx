import React, { useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AutoPositionRules } from '../../types';
import { baseAxisX, commandsToSvgPathD, getExactBoundingBox } from '../../utils';
import { CENTER_LETTERS, baseLetterCommands } from '../../utils/markFit';
import { NumericInput } from '../NumericInput';
import { GlyphSvg, Tile, DetailPanel, PanelCard, GlyphFrame } from './libraryShared';

interface CenterGuidesPanelProps {
  font: any;
  rules: AutoPositionRules;
  onUpdateRules: (updates: Partial<AutoPositionRules>) => void;
}

/**
 * Centre axis of each base letter: the line marks are centred on, leaning with the font.
 * Pick a letter, then drag its axis in the large view or use the slider. Font units.
 */
export const CenterGuidesPanel: React.FC<CenterGuidesPanelProps> = ({ font, rules, onUpdateRules }) => {
  const centers = rules.baseCenters || {};
  const learned = rules.baseCentersLearned || {};
  const upm = font.unitsPerEm || 1000;
  const range = Math.round(upm * 0.3);
  const tan = Math.tan(((rules.slantAngle || 0) * Math.PI) / 180);

  const [selected, setSelected] = useState<string>('A');
  const [drag, setDrag] = useState<{ letter: string; value: number } | null>(null);
  const dragRef = useRef<{ letter: string; startX: number; startVal: number; unitsPerPx: number } | null>(null);

  const glyphs = useMemo(
    () =>
      CENTER_LETTERS.map((letter) => {
        const cmds = baseLetterCommands(font, letter);
        if (!cmds) return { letter, d: '', box: null as null | { x1: number; x2: number; y1: number; y2: number } };
        const b = getExactBoundingBox(cmds);
        return { letter, d: commandsToSvgPathD(cmds), box: { x1: b.xMin, y1: b.yMin, x2: b.xMax, y2: b.yMax } };
      }),
    [font]
  );

  const frame: GlyphFrame = useMemo(() => {
    const boxes = glyphs.filter((g) => g.box).map((g) => g.box!);
    if (!boxes.length) return { top: upm, bottom: -upm * 0.25 };
    const top = Math.max(...boxes.map((b) => b.y2));
    const bottom = Math.min(...boxes.map((b) => b.y1), 0);
    const pad = (top - bottom) * 0.12;
    return { top: top + pad, bottom: bottom - pad };
  }, [glyphs, upm]);

  const valueOf = (letter: string) => (drag && drag.letter === letter ? drag.value : centers[letter] || 0);
  const commit = (letter: string, v: number) => onUpdateRules({ baseCenters: { ...centers, [letter]: Math.round(v) } });
  const changedAny = CENTER_LETTERS.some((l) => (centers[l] || 0) !== (learned[l] || 0));

  /** Axis lines for one letter, in the GlyphSvg frame. */
  const axisLines = (letter: string, box: { x1: number; x2: number; y1: number; y2: number }, v: number, strong: boolean) =>
    ({ y }: { x0: number; size: number; y: (fy: number) => number }) => {
      const isCap = letter !== letter.toLowerCase();
      const midY = (box.y1 + box.y2) / 2;
      const cx = (box.x1 + box.x2) / 2;
      const axis = baseAxisX(box, letter, isCap, { ...rules, baseCenters: { ...centers, [letter]: v } });
      const at = (x: number, fy: number) => x + tan * (fy - midY);
      const t = frame.top, b = frame.bottom, s = frame.top - frame.bottom;
      return (
        <>
          <line x1={-1e5} x2={1e5} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity="0.12" strokeWidth={s / 400} />
          {strong && (
            <line x1={at(cx, b)} y1={y(b)} x2={at(cx, t)} y2={y(t)} stroke="currentColor" strokeOpacity="0.2" strokeWidth={s / 400} strokeDasharray={`${s / 80} ${s / 80}`} />
          )}
          <line x1={at(axis, b)} y1={y(b)} x2={at(axis, t)} y2={y(t)} stroke="#f59e0b" strokeWidth={strong ? s / 220 : s / 160} />
        </>
      );
    };

  const cur = glyphs.find((g) => g.letter === selected && g.box) || glyphs.find((g) => g.box) || null;
  const curV = cur ? valueOf(cur.letter) : 0;
  const curLearned = cur ? learned[cur.letter] || 0 : 0;

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!cur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = { letter: cur.letter, startX: e.clientX, startVal: centers[cur.letter] || 0, unitsPerPx: (frame.top - frame.bottom) / rect.width };
    setDrag({ letter: cur.letter, value: centers[cur.letter] || 0 });
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

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left: the 12 letters */}
      <div className="flex-1 overflow-y-auto p-4 bg-neutral-50/60 dark:bg-[#16161f]">
        <div className="grid grid-cols-6 gap-2 max-w-[600px]">
          {glyphs.map(({ letter, d, box }) => {
            if (!box) {
              return (
                <div key={letter} className="rounded-xl border border-dashed border-neutral-200 dark:border-[#323242] aspect-square flex items-center justify-center text-neutral-300 dark:text-neutral-600 text-xl font-black">
                  {letter}
                </div>
              );
            }
            const v = valueOf(letter);
            const off = v !== (learned[letter] || 0);
            return (
              <Tile
                key={letter}
                active={!!cur && cur.letter === letter}
                onClick={() => setSelected(letter)}
                label={letter}
                badge={
                  <span className={`font-mono text-[10px] font-bold tabular-nums ${off ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
                    {v > 0 ? `+${v}` : v}
                  </span>
                }
              >
                <GlyphSvg d={d} box={box} frame={frame} className="w-full aspect-square">
                  {axisLines(letter, box, v, false)}
                </GlyphSvg>
              </Tile>
            );
          })}
        </div>
      </div>

      {/* Right: selected letter */}
      <DetailPanel>
        {cur && cur.box ? (
          <div className="p-4 space-y-3 flex-1 flex flex-col">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-extrabold">Tâm chữ {cur.letter}</span>
              {rules.slantAngle ? <span className="font-mono text-[10px] text-neutral-400">nghiêng {Math.round(rules.slantAngle * 10) / 10}°</span> : null}
            </div>
            <div className="rounded-xl border border-neutral-200 dark:border-[#353545] bg-neutral-50 dark:bg-[#20202a] text-neutral-900 dark:text-neutral-100">
              <GlyphSvg
                d={cur.d}
                box={cur.box}
                frame={frame}
                className="w-full aspect-square touch-none select-none cursor-ew-resize"
                svgProps={{ onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp }}
              >
                {axisLines(cur.letter, cur.box, curV, true)}
              </GlyphSvg>
            </div>

            <PanelCard
              title="Lệch tâm"
              right={
                curV !== curLearned ? (
                  <button
                    type="button"
                    onClick={() => commit(cur.letter, curLearned)}
                    className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                    title="Đặt lại"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                ) : null
              }
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="range"
                  min={-range}
                  max={range}
                  step={1}
                  value={curV}
                  onChange={(e) => setDrag({ letter: cur.letter, value: parseInt(e.target.value, 10) })}
                  onPointerUp={() => {
                    if (drag) commit(drag.letter, drag.value);
                    setDrag(null);
                  }}
                  onKeyUp={() => {
                    if (drag) commit(drag.letter, drag.value);
                    setDrag(null);
                  }}
                  className="flex-1 min-w-0 h-1.5 accent-neutral-900 dark:accent-amber-500 cursor-pointer rounded-lg bg-neutral-200 dark:bg-neutral-700"
                />
                <NumericInput size="sm" value={curV} onChange={(v) => commit(cur.letter, v)} step={Math.max(1, Math.round(upm / 200))} min={-range} max={range} />
              </div>
            </PanelCard>

            <div className="flex-1" />
            {changedAny && (
              <button
                type="button"
                onClick={() => onUpdateRules({ baseCenters: { ...learned } })}
                className="w-full py-2 text-[11px] font-bold rounded-xl border border-neutral-200 dark:border-[#3a3a4c] text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-[#5a5a70] flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" /> Đặt lại cả 12 chữ
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-neutral-400 p-6 text-center">Font thiếu các chữ gốc</div>
        )}
      </DetailPanel>
    </div>
  );
};
