import React, { useMemo, useState } from 'react';
import type * as opentype from 'opentype.js';
import { findGlyphIndex } from '../../../core/index';

// Kerning has no single-glyph view. The canvas and the proof are the same thing
// here, which is why this tool opts out of the shared dock: judging a pair means
// seeing it large AND seeing it inside running text at reading size.

const PROOFS = [
  'Tiếng Việt mến yêu, đường phố Hà Nội',
  'AVATAR Wavy To Yell Ta Va We',
  'Quảng Ngãi · Đắk Lắk · Vũng Tàu',
  'Người Việt dùng chữ Quốc ngữ từ thế kỷ 17'
];

interface KerningProofProps {
  font: opentype.Font;
  /** Compiled font bytes, when available, so the proof text uses real shaping. */
  compiledBuffer: ArrayBuffer | null;
  fontFamilyName: string;
  leftChar: string;
  rightChar: string;
  value: number;
  /** The font's own value for this pair, when it had one. */
  previousValue?: number;
  onChangeValue: (v: number) => void;
}

export const KerningProof: React.FC<KerningProofProps> = ({
  font, compiledBuffer, fontFamilyName,
  leftChar, rightChar, value, previousValue, onChangeValue
}) => {
  const [proofIdx, setProofIdx] = useState(0);
  const [size, setSize] = useState(28);
  const [showBefore, setShowBefore] = useState(false);

  const upm = font.unitsPerEm || 1000;

  const glyphs = useMemo(() => {
    const il = findGlyphIndex(font, leftChar);
    const ir = findGlyphIndex(font, rightChar);
    return {
      left: il > 0 ? font.glyphs.get(il) : null,
      right: ir > 0 ? font.glyphs.get(ir) : null
    };
  }, [font, leftChar, rightChar]);

  // Hold to compare: the eye is poor at comparing two things side by side and
  // good at spotting one thing changing in place.
  const shownValue = showBefore ? (previousValue ?? 0) : value;

  const stage = useMemo(() => {
    const { left, right } = glyphs;
    if (!left || !right) return null;
    const bl = left.getBoundingBox();
    const br = right.getBoundingBox();
    const advance = left.advanceWidth ?? upm * 0.5;
    const offset = advance + shownValue;
    const minX = Math.min(bl.x1, offset + br.x1);
    const maxX = Math.max(bl.x2, offset + br.x2);
    const minY = Math.min(bl.y1, br.y1);
    const maxY = Math.max(bl.y2, br.y2);
    const pad = upm * 0.08;
    return {
      d: pathData(left.path.commands as any[]) + pathData(right.path.commands as any[], offset),
      viewBox: `${minX - pad} ${-(maxY + pad)} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`,
      seam: offset
    };
  }, [glyphs, shownValue, upm]);

  const fontFaceCss = compiledBuffer
    ? `@font-face{font-family:"${fontFamilyName}-proof";src:url(${bufferToUrl(compiledBuffer)}) format("opentype");}`
    : '';

  return (
    <div className="h-full flex flex-col min-h-0 bg-neutral-50/50">
      {fontFaceCss ? <style>{fontFaceCss}</style> : null}

      <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-100 bg-white">
        <span className="text-lg leading-none">{leftChar}{rightChar}</span>
        <div className="flex items-center gap-1.5 ml-2">
          <input
            type="range"
            min={-Math.round(upm * 0.25)}
            max={Math.round(upm * 0.1)}
            value={value}
            onChange={e => onChangeValue(Number(e.target.value))}
            className="w-48 accent-neutral-900"
          />
          <input
            type="number"
            value={value}
            onChange={e => onChangeValue(Number(e.target.value) || 0)}
            className="w-16 px-1.5 py-0.5 text-[11px] font-mono border border-neutral-200 rounded-md
                       focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
          <span className="text-[10px] text-neutral-400">đơn vị</span>
        </div>

        {previousValue !== undefined ? (
          <button
            onMouseDown={() => setShowBefore(true)}
            onMouseUp={() => setShowBefore(false)}
            onMouseLeave={() => setShowBefore(false)}
            className="px-2 py-1 text-[10px] rounded-md border border-neutral-200 bg-white
                       hover:border-neutral-400 text-neutral-600"
            title={`Giá trị gốc: ${previousValue}`}
          >
            Giữ để xem gốc ({previousValue})
          </button>
        ) : null}

        <div className="ml-auto flex items-center gap-2 text-[10px] text-neutral-400">
          <span>Cỡ chữ</span>
          <input type="range" min={12} max={64} value={size}
                 onChange={e => setSize(Number(e.target.value))} className="w-24 accent-neutral-900" />
          <span className="font-mono w-8">{size}px</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center p-6">
        {stage ? (
          <svg viewBox={stage.viewBox} className="max-h-full max-w-full">
            <path d={stage.d} fill="#171717" transform="scale(1,-1)" />
            <line
              x1={stage.seam} y1={-upm} x2={stage.seam} y2={upm}
              stroke={showBefore ? '#f59e0b' : '#d4d4d4'} strokeWidth={upm * 0.003}
              strokeDasharray={`${upm * 0.012} ${upm * 0.012}`}
            />
          </svg>
        ) : (
          <p className="text-xs text-neutral-400">Font không có một trong hai ký tự của cặp này.</p>
        )}
      </div>

      <div className="border-t border-neutral-100 bg-white px-4 py-3">
        <div className="flex items-center gap-1 mb-2">
          {PROOFS.map((_, i) => (
            <button
              key={i}
              onClick={() => setProofIdx(i)}
              className={`w-5 h-5 text-[10px] rounded ${proofIdx === i ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:bg-neutral-100'}`}
            >
              {i + 1}
            </button>
          ))}
          <span className="ml-2 text-[10px] text-neutral-400">
            {compiledBuffer ? 'Dùng font đã biên dịch' : 'Bấm Biên dịch để xem bằng font thật'}
          </span>
        </div>
        <p
          className="leading-snug text-neutral-900 break-words"
          style={{
            fontSize: size,
            fontFamily: compiledBuffer ? `"${fontFamilyName}-proof", serif` : 'inherit'
          }}
        >
          {PROOFS[proofIdx]}
        </p>
      </div>
    </div>
  );
};

function pathData(commands: any[], dx = 0): string {
  let d = '';
  for (const c of commands) {
    if (c.type === 'M') d += `M${c.x + dx} ${c.y}`;
    else if (c.type === 'L') d += `L${c.x + dx} ${c.y}`;
    else if (c.type === 'Q') d += `Q${c.x1 + dx} ${c.y1} ${c.x + dx} ${c.y}`;
    else if (c.type === 'C') d += `C${c.x1 + dx} ${c.y1} ${c.x2 + dx} ${c.y2} ${c.x + dx} ${c.y}`;
    else if (c.type === 'Z') d += 'Z';
  }
  return d;
}

const urlCache = new WeakMap<ArrayBuffer, string>();
function bufferToUrl(buffer: ArrayBuffer): string {
  const cached = urlCache.get(buffer);
  if (cached) return cached;
  const url = URL.createObjectURL(new Blob([buffer], { type: 'font/opentype' }));
  urlCache.set(buffer, url);
  return url;
}
