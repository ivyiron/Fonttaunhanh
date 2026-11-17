import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as opentype from 'opentype.js';
import { AutoPositionRules, DiacriticTemplate, GlyphOverrideState, StackMod, StackTone } from '../../types';
import {
  composeGlyphPath,
  getStackCell,
  getStackMatrix,
  makeStackMatrix,
  STACK_TONES,
  StackInfo,
  VIETNAMESE_RECIPES
} from '../../utils';

const MOD_LABEL: Record<StackMod, string> = { circumflex: 'Mũ', breve: 'Trăng' };
const TONE_LABEL: Record<StackTone, string> = { acute: 'sắc', grave: 'huyền', hook: 'hỏi', tilde: 'ngã' };
export const STACK_CELL_CHARS: Record<'lower' | 'upper', Record<StackMod, string>> = {
  lower: { circumflex: 'ấầẩẫ', breve: 'ắằẳẵ' },
  upper: { circumflex: 'ẤẦẨẪ', breve: 'ẮẰẲẴ' }
};
const PRESETS = [
  { id: 'stack', label: 'Chồng trên' },
  { id: 'right', label: 'Bên phải' },
  { id: 'both', label: 'Hai bên' }
] as const;

export type StackStatus = 'ok' | 'warn' | 'bad';

export function stackStatus(info: StackInfo | undefined, minClear: number): StackStatus {
  if (!info) return 'ok';
  if (info.clearance < 0.25 * info.toneStroke) return 'bad';
  if (info.clearance < minClear * info.toneStroke - 0.5) return 'warn';
  return 'ok';
}

const STATUS_DOT: Record<StackStatus, string> = { ok: 'bg-emerald-500', warn: 'bg-amber-500', bad: 'bg-red-500' };

/** One rule cell: the lowercase and capital a-version drawn from the composer. */
const CellThumb: React.FC<{
  paths: (opentype.Path | null)[];
  advances: number[];
  top: number;
  bottom: number;
  active: boolean;
  isDarkMode: boolean;
}> = ({ paths, advances, top, bottom, active, isDarkMode }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const w = c.clientWidth || 60, h = c.clientHeight || 52;
    const dpr = Math.max(2, window.devicePixelRatio || 1);
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const total = advances.reduce((a, b) => a + b, 0) || 1;
    const s = Math.min((h - 8) / Math.max(1, top - bottom), (w - 8) / total);
    let x = (w - total * s) / 2;
    const base = h - 4 + bottom * s;
    ctx.fillStyle = active ? '#ffffff' : isDarkMode ? '#f4f4f5' : '#0f172a';
    paths.forEach((p, i) => {
      if (p) {
        ctx.beginPath();
        p.commands.forEach((cmd: any) => {
          if (cmd.type === 'M') ctx.moveTo(x + cmd.x * s, base - cmd.y * s);
          else if (cmd.type === 'L') ctx.lineTo(x + cmd.x * s, base - cmd.y * s);
          else if (cmd.type === 'Q') ctx.quadraticCurveTo(x + cmd.x1 * s, base - cmd.y1 * s, x + cmd.x * s, base - cmd.y * s);
          else if (cmd.type === 'C') ctx.bezierCurveTo(x + cmd.x1 * s, base - cmd.y1 * s, x + cmd.x2 * s, base - cmd.y2 * s, x + cmd.x * s, base - cmd.y * s);
          else if (cmd.type === 'Z') ctx.closePath();
        });
        ctx.fill('nonzero');
      }
      x += advances[i] * s;
    });
  }, [paths, advances, top, bottom, active, isDarkMode]);
  return <canvas ref={ref} className="w-full h-full block" />;
};

interface StackMatrixPanelProps {
  font: opentype.Font | null;
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  overrides: Record<string, GlyphOverrideState>;
  onUpdateRules: (updates: Partial<AutoPositionRules>) => void;
  selectedChar: string;
  onSelectChar: (char: string) => void;
}

/** Rule table at the top of the left panel: 2 marks x 4 tones, each cell drawn with the font. */
export const StackMatrixPanel: React.FC<StackMatrixPanelProps> = ({
  font,
  templates,
  rules,
  overrides,
  onUpdateRules,
  selectedChar,
  onSelectChar
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const o = new MutationObserver(() => setIsDarkMode(document.documentElement.classList.contains('dark')));
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => o.disconnect();
  }, []);

  const matrix = getStackMatrix(rules);
  const selectedCell = getStackCell(selectedChar);
  const caseOfSelection: 'lower' | 'upper' =
    selectedChar && selectedChar !== selectedChar.toLowerCase() ? 'upper' : 'lower';

  // compose the a / A version of every cell once per rules change
  const cells = useMemo(() => {
    const out: Record<string, { paths: (opentype.Path | null)[]; advances: number[]; status: StackStatus; top: number }> = {};
    if (!font) return out;
    (['circumflex', 'breve'] as StackMod[]).forEach((m) => {
      STACK_TONES.forEach((t, i) => {
        const chars = [STACK_CELL_CHARS.lower[m][i], STACK_CELL_CHARS.upper[m][i]];
        const paths: (opentype.Path | null)[] = [];
        const advances: number[] = [];
        let worst: StackStatus = 'ok';
        let top = 0;
        chars.forEach((ch) => {
          const recipe = VIETNAMESE_RECIPES.find((r) => r.char === ch);
          try {
            const res = recipe ? composeGlyphPath(font, recipe, templates, rules, overrides[ch], false) : null;
            paths.push(res ? res.path : null);
            advances.push(res ? res.advanceWidth : 0);
            const st = stackStatus(res?.stackInfo, matrix.minClear);
            if (st === 'bad' || (st === 'warn' && worst === 'ok')) worst = st;
            if (res?.stackInfo) top = Math.max(top, res.stackInfo.top);
          } catch {
            paths.push(null);
            advances.push(0);
          }
        });
        out[m + t] = { paths, advances, status: worst, top };
      });
    });
    return out;
  }, [font, templates, rules, overrides, matrix.minClear]);

  const top = Math.max(1, ...Object.keys(cells).map((k) => cells[k].top)) + (font?.unitsPerEm || 1000) * 0.04;
  const bottom = -(font?.unitsPerEm || 1000) * 0.04;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-neutral-500">Bảng quy tắc dấu kép</span>
        <div className="flex items-center gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onUpdateRules({ stackMatrix: makeStackMatrix(p.id, matrix) })}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                matrix.preset === p.id ? 'bg-neutral-900 text-white shadow-2xs' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[34px_repeat(4,1fr)] gap-1.5 items-center">
        <span />
        {STACK_TONES.map((t) => (
          <span key={t} className="text-[10px] font-bold text-neutral-500 text-center">
            {TONE_LABEL[t]}
          </span>
        ))}
        {(['circumflex', 'breve'] as StackMod[]).map((m) => (
          <React.Fragment key={m}>
            <span className="text-[10px] font-bold text-neutral-500">{MOD_LABEL[m]}</span>
            {STACK_TONES.map((t, i) => {
              const active = selectedCell?.mod === m && selectedCell?.tone === t;
              const cell = cells[m + t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onSelectChar(STACK_CELL_CHARS[caseOfSelection][m][i])}
                  title={`${MOD_LABEL[m]} + ${TONE_LABEL[t]}`}
                  className={`relative h-14 rounded-xl border transition overflow-hidden cursor-pointer ${
                    active
                      ? 'bg-neutral-950 border-neutral-950 shadow-xs'
                      : 'bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  {cell && (
                    <CellThumb paths={cell.paths} advances={cell.advances} top={top} bottom={bottom} active={active} isDarkMode={isDarkMode} />
                  )}
                  {cell && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full absolute top-1 left-1 ${STATUS_DOT[cell.status]}`}
                      title={cell.status === 'ok' ? 'Đủ hở' : cell.status === 'warn' ? 'Sát' : 'Chạm'}
                    />
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
