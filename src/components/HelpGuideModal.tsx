import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { APP_VERSION } from '../version';

interface HelpGuideModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

/* ---------- Minh họa: SVG nhỏ, dùng currentColor để theo theme ---------- */

const SERIF = 'Georgia, "Times New Roman", serif';
const ACCENT = '#f59e0b';

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 260 160" className="w-full h-auto" role="img" aria-hidden="true">
    {children}
  </svg>
);

const IllStart = () => (
  <Frame>
    <rect x="40" y="14" width="180" height="84" rx="14" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="5 5" />
    <rect x="112" y="30" width="36" height="44" rx="5" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" />
    <path d="M136 30 v10 h12" fill="none" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" />
    <text x="130" y="64" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor" fontFamily="ui-monospace, monospace">OTF</text>
    <text x="130" y="90" textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.55">.otf · .ttf · .ftn</text>
    <path d="M130 104 v12 m-5 -5 l5 5 l5 -5" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    {['Việt hóa', 'Edit', 'Kerning'].map((t, i) => (
      <g key={t} transform={`translate(${28 + i * 70} 124)`}>
        <rect width="64" height="22" rx="7" fill={i === 0 ? ACCENT : 'currentColor'} fillOpacity={i === 0 ? 1 : 0.08} />
        <text x="32" y="15" textAnchor="middle" fontSize="10" fontWeight="700" fill={i === 0 ? '#111' : 'currentColor'}>{t}</text>
      </g>
    ))}
  </Frame>
);

const IllMarks = () => (
  <Frame>
    {/* đường x-height và baseline */}
    <line x1="20" y1="118" x2="170" y2="118" stroke="currentColor" strokeOpacity="0.3" />
    <line x1="20" y1="76" x2="170" y2="76" stroke="currentColor" strokeOpacity="0.3" strokeDasharray="3 3" />
    <text x="22" y="114" fontSize="8" fill="currentColor" fillOpacity="0.45">baseline</text>
    <text x="22" y="72" fontSize="8" fill="currentColor" fillOpacity="0.45">x-height</text>
    {/* trục căn nghiêng theo font */}
    <line x1="84" y1="140" x2="110" y2="18" stroke={ACCENT} strokeWidth="1.2" strokeDasharray="4 3" />
    <text x="94" y="118" textAnchor="middle" fontSize="84" fontStyle="italic" fill="currentColor" fontFamily={SERIF}>a</text>
    {/* dấu sắc, căn trên trục nghiêng */}
    <path d="M99 64 L112 42 L118 45 L103 66 Z" fill={ACCENT} />
    {/* thanh trượt */}
    {[{ l: 'X', v: 0.55 }, { l: 'Y', v: 0.35 }, { l: 'Cỡ', v: 0.7 }].map((s, i) => (
      <g key={s.l} transform={`translate(184 ${46 + i * 26})`}>
        <text x="0" y="4" fontSize="9" fontWeight="700" fill="currentColor" fillOpacity="0.6">{s.l}</text>
        <line x1="18" y1="1" x2="66" y2="1" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" strokeLinecap="round" />
        <line x1="18" y1="1" x2={18 + 48 * s.v} y2="1" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
        <circle cx={18 + 48 * s.v} cy="1" r="4" fill="#fff" stroke={ACCENT} strokeWidth="1.5" />
      </g>
    ))}
  </Frame>
);

const IllStacks = () => {
  const tones = ['sắc', 'huyền', 'hỏi', 'ngã', 'nặng'];
  const rows = [
    { h: 'mũ', c: ['ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'] },
    { h: 'trăng', c: ['ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'] },
  ];
  return (
    <Frame>
      {tones.map((t, i) => (
        <text key={i} x={76 + i * 36} y="34" textAnchor="middle" fontSize="9" fontWeight="600" fill="currentColor" fillOpacity="0.5">
          {t}
        </text>
      ))}
      {rows.map((r, ri) => (
        <g key={ri}>
          <text x="52" y={70 + ri * 52} textAnchor="end" fontSize="9" fontWeight="600" fill="currentColor" fillOpacity="0.5">{r.h}</text>
          {r.c.map((ch, ci) => {
            const on = ri === 0 && ci === 2;
            return (
              <g key={ci} transform={`translate(${60 + ci * 36} ${44 + ri * 52})`}>
                <rect width="32" height="44" rx="7" fill={on ? ACCENT : 'currentColor'} fillOpacity={on ? 0.18 : 0.06} stroke={on ? ACCENT : 'none'} strokeWidth="1.5" />
                <text x="16" y="34" textAnchor="middle" fontSize="24" fill="currentColor" fontFamily={SERIF}>{ch}</text>
              </g>
            );
          })}
        </g>
      ))}
    </Frame>
  );
};

const IllChars = () => {
  const cells: { c: string; regen: boolean }[] = [
    { c: 'á', regen: false }, { c: 'à', regen: false }, { c: 'ả', regen: true }, { c: 'ã', regen: false },
    { c: 'ơ', regen: true }, { c: 'ư', regen: true }, { c: 'đ', regen: false }, { c: 'Đ', regen: false },
  ];
  return (
    <Frame>
      {cells.map((x, i) => (
        <g key={i} transform={`translate(${34 + (i % 4) * 50} ${12 + Math.floor(i / 4) * 56})`}>
          <rect width="42" height="48" rx="8" fill={x.regen ? ACCENT : 'none'} fillOpacity={x.regen ? 0.18 : 0} stroke={x.regen ? ACCENT : 'currentColor'} strokeOpacity={x.regen ? 1 : 0.3} strokeWidth="1.5" />
          <text x="21" y="35" textAnchor="middle" fontSize="26" fill="currentColor" fontFamily={SERIF}>{x.c}</text>
        </g>
      ))}
      <g transform="translate(54 136)">
        <rect width="12" height="12" rx="3" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
        <text x="18" y="10" fontSize="10" fill="currentColor" fillOpacity="0.7">Giữ bản gốc</text>
        <rect x="96" width="12" height="12" rx="3" fill={ACCENT} fillOpacity="0.3" stroke={ACCENT} strokeWidth="1.5" />
        <text x="114" y="10" fontSize="10" fill="currentColor" fillOpacity="0.7">Làm mới</text>
      </g>
    </Frame>
  );
};

const IllEdit = () => (
  <Frame>
    <line x1="30" y1="112" x2="150" y2="112" stroke="currentColor" strokeOpacity="0.3" />
    <rect x="58" y="34" width="64" height="100" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeDasharray="3 3" />
    <text x="90" y="112" textAnchor="middle" fontSize="92" fill="currentColor" fontFamily={SERIF}>g</text>
    {/* sidebearing */}
    <path d="M42 142 h16 M42 139 v6 M58 139 v6" stroke={ACCENT} strokeWidth="1.5" />
    <path d="M122 142 h16 M122 139 v6 M138 139 v6" stroke={ACCENT} strokeWidth="1.5" />
    <text x="50" y="156" textAnchor="middle" fontSize="8" fill="currentColor" fillOpacity="0.55">LSB</text>
    <text x="130" y="156" textAnchor="middle" fontSize="8" fill="currentColor" fillOpacity="0.55">RSB</text>
    {/* dán SVG */}
    <g transform="translate(164 46)">
      <rect width="80" height="62" rx="9" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.2" />
      <text x="10" y="20" fontSize="9" fill={ACCENT} fontFamily="ui-monospace, monospace" fontWeight="700">&lt;svg&gt;</text>
      <text x="10" y="34" fontSize="8" fill="currentColor" fillOpacity="0.5" fontFamily="ui-monospace, monospace">M120 40 C…</text>
      <text x="10" y="50" fontSize="9" fill={ACCENT} fontFamily="ui-monospace, monospace" fontWeight="700">&lt;/svg&gt;</text>
      <path d="M-4 31 h-14 m5 -5 l-5 5 l5 5" fill="none" stroke={ACCENT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </Frame>
);

const IllKerning = () => (
  <Frame>
    <text x="70" y="96" textAnchor="middle" fontSize="70" fill="currentColor" fontFamily={SERIF}>A</text>
    <text x="118" y="96" textAnchor="middle" fontSize="70" fill="currentColor" fontFamily={SERIF}>V</text>
    <path d="M80 112 h10 m-4 -4 l4 4 l-4 4 M108 112 h-10 m4 -4 l-4 4 l4 4" fill="none" stroke={ACCENT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <text x="94" y="130" textAnchor="middle" fontSize="10" fontWeight="700" fill={ACCENT} fontFamily="ui-monospace, monospace">−60</text>
    {/* nhóm cùng gốc */}
    <g transform="translate(168 34)">
      {['A', 'Á', 'À', 'Â'].map((c, i) => (
        <g key={c} transform={`translate(${(i % 2) * 34} ${Math.floor(i / 2) * 40})`}>
          <rect width="30" height="36" rx="6" fill="currentColor" fillOpacity={i === 0 ? 0.14 : 0.06} />
          <text x="15" y="27" textAnchor="middle" fontSize="20" fill="currentColor" fontFamily={SERIF}>{c}</text>
        </g>
      ))}
      <text x="32" y="96" textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.55">cùng một cặp</text>
    </g>
  </Frame>
);

const IllExport = () => (
  <Frame>
    <rect x="20" y="22" width="220" height="44" rx="10" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.15" />
    <text x="34" y="52" fontSize="20" fill="currentColor" fontFamily={SERIF}>Thương nhớ đường xưa</text>
    <rect x="226" y="34" width="1.5" height="20" fill={ACCENT} />
    {[{ t: '.ftn', s: 'dự án' }, { t: '.otf', s: 'font' }].map((f, i) => (
      <g key={f.t} transform={`translate(${62 + i * 82} 86)`}>
        <rect width="56" height="58" rx="8" fill={i === 1 ? ACCENT : 'currentColor'} fillOpacity={i === 1 ? 1 : 0.08} />
        <text x="28" y="30" textAnchor="middle" fontSize="13" fontWeight="800" fill={i === 1 ? '#111' : 'currentColor'} fontFamily="ui-monospace, monospace">{f.t}</text>
        <text x="28" y="46" textAnchor="middle" fontSize="9" fill={i === 1 ? '#111' : 'currentColor'} fillOpacity="0.65">{f.s}</text>
      </g>
    ))}
  </Frame>
);

/* ---------- Nội dung ---------- */

type Step = { tab: string; title: string; Ill: React.FC; lines: React.ReactNode[]; tip?: React.ReactNode };

const K: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-[#282838] text-neutral-900 dark:text-amber-300 font-semibold text-[11px] whitespace-nowrap">{children}</span>
);

const STEPS: Step[] = [
  {
    tab: 'Bắt đầu',
    title: 'Tải font lên',
    Ill: IllStart,
    lines: [
      <>Kéo thả file <K>.otf</K> / <K>.ttf</K>, hoặc mở lại dự án <K>.ftn</K>.</>,
      <>Ba tab trên cùng: <K>Việt hóa</K> <K>Edit</K> <K>Kerning</K>.</>,
      <>Font đã đủ tiếng Việt: bật <K>Cài đặt › Bỏ qua Việt Hóa</K>.</>,
    ],
  },
  {
    tab: 'Thanh dấu',
    title: 'Đặt từng dấu',
    Ill: IllMarks,
    lines: [
      <>Chọn dấu ở cột trái, chỉnh <K>Vị trí</K> và <K>Kích thước</K>.</>,
      <>Giá trị mặc định đã được đo theo chính font.</>,
      <>Font nghiêng: trục căn nghiêng theo góc của font.</>,
    ],
    tip: <>Muốn dấu của riêng bạn: vẽ trong Illustrator, copy rồi dán vào ô <K>SVG</K>. App tự co dấu theo nét chữ.</>,
  },
  {
    tab: 'Dấu kép',
    title: 'Ghép mũ / trăng với thanh',
    Ill: IllStacks,
    lines: [
      <>Ma trận <K>Thanh × Mũ/trăng</K> cho ấ ầ ẩ ắ ằ…</>,
      <>Chỉnh <K>Lệch ngang</K>, <K>Khoảng hở</K>, <K>Tỉ lệ thanh</K>.</>,
      <>Chữ hoa có bảng riêng, vì chỗ trống phía trên ít hơn.</>,
    ],
  },
  {
    tab: 'Ký tự',
    title: 'Giữ hay làm mới',
    Ill: IllChars,
    lines: [
      <>Chữ font đã có: bấm để chuyển <K>Giữ bản gốc</K> ↔ <K>Làm mới</K>.</>,
      <>Chọn một ký tự để chỉnh riêng; nút đặt lại đưa về tự động.</>,
      <>Soi kỹ <K>đ Đ</K>, <K>ư ơ</K> và chữ hoa.</>,
    ],
  },
  {
    tab: 'Edit',
    title: 'Sửa một glyph',
    Ill: IllEdit,
    lines: [
      <>Chọn glyph, dán SVG để thay hình.</>,
      <>Chỉnh vị trí, scale, lật, <K>LSB</K> / <K>RSB</K>.</>,
      <><K>Copy thẻ SVG</K> để vẽ tiếp trong Figma / Illustrator.</>,
    ],
  },
  {
    tab: 'Kerning',
    title: 'Khoảng cách chữ',
    Ill: IllKerning,
    lines: [
      <>Chữ mới kế thừa kerning của chữ gốc (Tờ như To).</>,
      <>Sửa một cặp là áp cho cả nhóm cùng gốc <span className="whitespace-nowrap">(A Á À Â…)</span>.</>,
      <><K>Auto kerning</K> ghi đè kerning gốc, chỉ dùng khi cần.</>,
    ],
    tip: <>Nên xuất font đã Việt hóa trước, rồi tải lại để chỉnh kerning riêng.</>,
  },
  {
    tab: 'Xuất',
    title: 'Gõ thử & lưu',
    Ill: IllExport,
    lines: [
      <>Gõ thử ở thanh dưới; font tự cập nhật sau mỗi lần chỉnh.</>,
      <><K>Dự án › Lưu dự án (.ftn)</K> để làm tiếp lần sau.</>,
      <><K>Lưu & Xuất Font</K>: đổi tên để không đè font gốc.</>,
    ],
  },
];

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen = true, onClose }) => {
  const [i, setI] = useState(0);
  const last = STEPS.length - 1;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setI(v => Math.min(last, v + 1));
      else if (e.key === 'ArrowLeft') setI(v => Math.max(0, v - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, last]);

  if (!isOpen) return null;
  const s = STEPS[i];
  const Ill = s.Ill;

  return (
    <div
      className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-guide-title"
        className="bg-white dark:bg-[#1b1b24] border border-neutral-200 dark:border-[#353545] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in text-neutral-900 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 shrink-0">
          <h2 id="help-guide-title" className="text-base font-extrabold tracking-tight flex items-baseline gap-2">
            Hướng dẫn
            <span className="font-mono text-[11px] font-bold text-amber-500">v{APP_VERSION}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-[#2e2e3e] rounded-xl transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 shrink-0">
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
            {STEPS.map((st, k) => (
              <button
                key={st.tab}
                type="button"
                onClick={() => setI(k)}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  k === i
                    ? 'bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-[#2b2b38]'
                }`}
              >
                <span className="font-mono opacity-60">{k + 1}</span>
                {st.tab}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto">
          <div className="grid sm:grid-cols-[1.1fr_1fr] gap-5 items-center">
            <div className="rounded-xl bg-neutral-50 dark:bg-[#20202b] border border-neutral-200/80 dark:border-[#353545] px-4 py-3 text-neutral-800 dark:text-neutral-200">
              <Ill />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-extrabold tracking-tight">{s.title}</h3>
              <ol className="space-y-2">
                {s.lines.map((l, k) => (
                  <li key={k} className="flex gap-2.5 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                    <span className="mt-[3px] w-4 h-4 shrink-0 rounded-md bg-neutral-900 dark:bg-amber-500 text-white dark:text-neutral-950 text-[10px] font-mono font-bold flex items-center justify-center">{k + 1}</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ol>
              {s.tip && (
                <p className="text-[12px] leading-relaxed bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 px-3 py-2 rounded-xl text-amber-950 dark:text-amber-200">
                  {s.tip}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 dark:border-[#353545] flex items-center justify-between shrink-0">
          <div className="flex gap-1.5">
            {STEPS.map((_, k) => (
              <button
                key={k}
                type="button"
                aria-label={`Bước ${k + 1}`}
                onClick={() => setI(k)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${k === i ? 'w-5 bg-amber-500' : 'w-1.5 bg-neutral-300 dark:bg-neutral-600'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setI(v => Math.max(0, v - 1))}
              disabled={i === 0}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-[#2b2b38] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => (i === last ? onClose() : setI(i + 1))}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-neutral-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              {i === last ? 'Đã hiểu' : <>Tiếp <ChevronRight className="w-3.5 h-3.5" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
