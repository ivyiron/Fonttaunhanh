import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as opentype from 'opentype.js';
import { AutoPositionRules, DiacriticTemplate, FontMetadata, GlyphOverrideState, StackMod } from '../../types';
import { composeGlyphPath, getStackCell, getStackMatrix, VIETNAMESE_RECIPES } from '../../utils';
import { stackStatus } from './StackMatrixPanel';

const MOD_LABEL: Record<StackMod, string> = { circumflex: 'Mũ', breve: 'Trăng' };
const TONE_LABEL: Record<string, string> = { acute: 'sắc', grave: 'huyền', hook: 'hỏi', tilde: 'ngã' };
const TONE_MARK: Record<string, string> = { acute: '́', grave: '̀', hook: '̉', tilde: '̃' };
const MOD_MARK: Record<StackMod, string> = { circumflex: '̂', breve: '̆' };
const BASES: Record<StackMod, { lower: string[]; upper: string[] }> = {
  circumflex: { lower: ['a', 'e', 'o'], upper: ['A', 'E', 'O'] },
  breve: { lower: ['a'], upper: ['A'] }
};

interface StackGroupCanvasProps {
  font: opentype.Font | null;
  fontMetadata: FontMetadata | null;
  templates: Record<string, DiacriticTemplate>;
  rules: AutoPositionRules;
  overrides: Record<string, GlyphOverrideState>;
  selectedChar: string;
  onSelectChar: (char: string) => void;
  onShowSingle: () => void;
}

/** Every vowel that one rule-table cell applies to, lowercase and capitals together. */
export const StackGroupCanvas: React.FC<StackGroupCanvasProps> = ({
  font,
  fontMetadata,
  templates,
  rules,
  overrides,
  selectedChar,
  onSelectChar,
  onShowSingle
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hitBoxes = useRef<{ char: string; x: number; y: number; w: number; h: number }[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [showGuides, setShowGuides] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const o = new MutationObserver(() => setIsDarkMode(document.documentElement.classList.contains('dark')));
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => o.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize({ width: Math.floor(r.width), height: Math.floor(r.height) });
    };
    update();
    const o = new ResizeObserver(update);
    o.observe(el);
    return () => o.disconnect();
  }, []);

  const cell = getStackCell(selectedChar);
  const matrix = getStackMatrix(rules);

  const rows = useMemo(() => {
    if (!font || !cell) return [];
    return (['lower', 'upper'] as const).map((c) =>
      BASES[cell.mod][c].map((b) => {
        const char = (b + MOD_MARK[cell.mod] + TONE_MARK[cell.tone]).normalize('NFC');
        const recipe = VIETNAMESE_RECIPES.find((r) => r.char === char);
        const res = recipe ? composeGlyphPath(font, recipe, templates, rules, overrides[char], false) : null;
        return { char, res };
      })
    );
  }, [font, cell?.mod, cell?.tone, templates, rules, overrides]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !font || !rows.length || size.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = Math.max(280, size.width), H = Math.max(260, size.height);
    const dpr = Math.max(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = isDarkMode ? '#1b1b24' : '#fafafa';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = isDarkMode ? '#2e2e3c' : '#e2e8f0';
    for (let x = 15; x < W; x += 24) for (let y = 15; y < H; y += 24) ctx.fillRect(x, y, 1, 1);

    const upm = font.unitsPerEm || 1000;
    const xHeight = fontMetadata?.xHeight || upm * 0.5;
    const capHeight = fontMetadata?.capHeight || upm * 0.7;
    const all = rows.flat().filter((r) => r.res);
    const top = Math.max(capHeight, ...all.map((r) => r.res!.stackInfo?.top ?? 0)) + upm * 0.06;
    const bottom = -upm * 0.06;
    const rowH = H / 2;
    const widest = Math.max(...rows.map((row) => row.reduce((a, r) => a + (r.res?.advanceWidth || 0), 0)));
    const s = Math.min((rowH - 20) / (top - bottom), (W - 80) / (widest * 1.35));
    const gapPx = Math.min(60, W * 0.05);
    hitBoxes.current = [];

    rows.forEach((row, ri) => {
      const base = rowH * ri + rowH - 10 + bottom * s;
      const refLine = ri === 0 ? xHeight : capHeight;
      if (showGuides) {
        ctx.setLineDash([]);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(10, base);
        ctx.lineTo(W - 10, base);
        ctx.stroke();
        ctx.strokeStyle = ri === 0 ? '#8b5cf6' : '#3b82f6';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(10, base - refLine * s);
        ctx.lineTo(W - 10, base - refLine * s);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '10px monospace';
        ctx.fillStyle = ri === 0 ? '#8b5cf6' : '#3b82f6';
        ctx.fillText(`${ri === 0 ? 'x-Height' : 'Cap Height'} (${Math.round(refLine)})`, 14, base - refLine * s - 4);
      }

      const total = row.reduce((a, r) => a + (r.res?.advanceWidth || 0) * s, 0) + gapPx * (row.length - 1);
      let x = (W - total) / 2;
      row.forEach(({ char, res }) => {
        if (!res) return;
        const adv = res.advanceWidth * s;
        const boxTop = base - top * s, boxH = (top - bottom) * s;
        hitBoxes.current.push({ char, x: x - 8, y: boxTop, w: adv + 16, h: boxH });
        if (char === selectedChar) {
          ctx.fillStyle = isDarkMode ? 'rgba(245, 158, 11, 0.12)' : 'rgba(15, 23, 42, 0.05)';
          ctx.strokeStyle = isDarkMode ? '#f59e0b' : '#0f172a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          (ctx as any).roundRect ? (ctx as any).roundRect(x - 8, boxTop, adv + 16, boxH, 10) : ctx.rect(x - 8, boxTop, adv + 16, boxH);
          ctx.fill();
          ctx.stroke();
        }

        ctx.beginPath();
        res.path.commands.forEach((cmd: any) => {
          if (cmd.type === 'M') ctx.moveTo(x + cmd.x * s, base - cmd.y * s);
          else if (cmd.type === 'L') ctx.lineTo(x + cmd.x * s, base - cmd.y * s);
          else if (cmd.type === 'Q') ctx.quadraticCurveTo(x + cmd.x1 * s, base - cmd.y1 * s, x + cmd.x * s, base - cmd.y * s);
          else if (cmd.type === 'C') ctx.bezierCurveTo(x + cmd.x1 * s, base - cmd.y1 * s, x + cmd.x2 * s, base - cmd.y2 * s, x + cmd.x * s, base - cmd.y * s);
          else if (cmd.type === 'Z') ctx.closePath();
        });
        ctx.fillStyle = isDarkMode ? '#f4f4f5' : '#0f172a';
        ctx.fill('nonzero');

        const info = res.stackInfo;
        if (showGuides && info && info.pointA && info.pointB) {
          const st = stackStatus(info, matrix.minClear);
          const color = st === 'bad' ? '#dc2626' : st === 'warn' ? '#d97706' : '#10b981';
          const ax = x + info.pointA.x * s, ay = base - info.pointA.y * s;
          const bx = x + info.pointB.x * s, by = base - info.pointB.y * s;
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
          [[ax, ay], [bx, by]].forEach(([px, py]) => {
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.font = 'bold 10px monospace';
          const label = info.clearance < 0 ? 'chạm' : `${Math.round(info.clearance)} · ${(info.clearance / info.toneStroke).toFixed(2)}×`;
          ctx.fillText(label, Math.max(ax, bx) + 8, (ay + by) / 2 + 3);
        }
        x += adv + gapPx;
      });
    });
  }, [rows, size, showGuides, isDarkMode, selectedChar, font, fontMetadata, matrix.minClear]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const hit = hitBoxes.current.find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h);
    if (hit) onSelectChar(hit.char);
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Liveview dấu kép:</span>
          <span className="text-sm font-bold bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 px-2.5 py-0.5 rounded-md shadow-xs">
            {cell ? `${MOD_LABEL[cell.mod]} + ${TONE_LABEL[cell.tone]}` : selectedChar}
          </span>
          <span className="text-[10px] text-neutral-500 font-medium">bấm vào chữ để chọn</span>
        </div>
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
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs">Cả nhóm</span>
            <button
              type="button"
              onClick={onShowSingle}
              className="px-2 py-0.5 rounded-md text-neutral-500 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
            >
              Từng chữ
            </button>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <canvas ref={canvasRef} onClick={handleClick} className="w-full h-full block cursor-pointer" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};
