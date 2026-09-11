import React, { useState } from 'react';
import { Code, Check, AlertCircle } from 'lucide-react';
import { extractPathDataFromSvg, parseSvgPath, getExactBoundingBox } from '../../core/index';

// The handover point between whatever tool drew the shape and this app.
// Everything the user needs to judge the paste - does it parse, how heavy is it
// relative to the font's own stem - belongs here, not two panels away.

interface SvgPasteCardProps {
  value: string;
  onChange: (svgPath: string) => void;
  /** Stem width of the font, in font units. Used to report relative weight. */
  stemWidth?: number;
  label?: string;
}

export const SvgPasteCard: React.FC<SvgPasteCardProps> = ({
  value, onChange, stemWidth, label = 'Dán SVG'
}) => {
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const apply = (text: string) => {
    setRaw(text);
    if (!text.trim()) { setStatus(null); return; }
    try {
      const d = text.trim().startsWith('<') ? extractPathDataFromSvg(text) : text.trim();
      const cmds = parseSvgPath(d);
      if (!cmds.length) throw new Error('Không đọc được lệnh path nào');
      const box = getExactBoundingBox(cmds);
      const w = Math.round(box.xMax - box.xMin);
      const h = Math.round(box.yMax - box.yMin);
      onChange(d);

      const weight = stemWidth && stemWidth > 0
        ? `, nét ≈ ${Math.round((Math.min(w, h) / stemWidth) * 100)}% stem`
        : '';
      setStatus({ ok: true, text: `${cmds.length} lệnh · ${w}×${h} đơn vị${weight}` });
    } catch (err: any) {
      setStatus({ ok: false, text: err?.message ?? 'SVG không hợp lệ' });
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Code className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-[11px] font-medium text-neutral-700">{label}</span>
      </div>
      <textarea
        value={raw}
        onChange={e => apply(e.target.value)}
        placeholder='Dán <svg>...</svg> hoặc chuỗi "d" từ Illustrator, Figma...'
        rows={3}
        className="w-full text-[10px] font-mono px-2 py-1.5 border border-neutral-200 rounded-lg
                   focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-none bg-neutral-50/60"
      />
      {status ? (
        <div className={`flex items-start gap-1.5 text-[10px] ${status.ok ? 'text-emerald-700' : 'text-red-600'}`}>
          {status.ok ? <Check className="w-3 h-3 mt-px shrink-0" /> : <AlertCircle className="w-3 h-3 mt-px shrink-0" />}
          <span>{status.text}</span>
        </div>
      ) : (
        <p className="text-[10px] text-neutral-400">
          Hình vẽ ở công cụ khác dán thẳng vào đây. Trọng lượng nét được so với stem của font.
        </p>
      )}
      {value ? (
        <p className="text-[10px] text-neutral-400 truncate" title={value}>Đang dùng: {value.slice(0, 48)}…</p>
      ) : null}
    </div>
  );
};
