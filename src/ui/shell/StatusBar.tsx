import React from 'react';

// Turns "tôn trọng font gốc" from a promise into four numbers the user can watch.
// A one-time warning dialog is easy to click past; a counter that moves while you
// work is not.

export interface InterventionCounters {
  originalPairsKept: number;
  pairsAddedForNewGlyphs: number;
  originalPairsOverwritten: number;
  glyphsWithChangedAdvance: number;
  glyphsReplaced: number;
  glyphsAdded: number;
}

interface StatusBarProps {
  counters: InterventionCounters;
  note?: string;
}

const fmt = (n: number) => n.toLocaleString('vi-VN');

export const StatusBar: React.FC<StatusBarProps> = ({ counters, note }) => {
  const invasive = counters.originalPairsOverwritten > 0 || counters.glyphsWithChangedAdvance > 0;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 text-[11px] text-neutral-500">
      <span>
        Giữ nguyên <strong className="text-neutral-800 font-medium">{fmt(counters.originalPairsKept)}</strong> cặp gốc
      </span>
      <span>
        Thêm <strong className="text-neutral-800 font-medium">{fmt(counters.pairsAddedForNewGlyphs)}</strong> cặp cho glyph mới
      </span>
      <span className={counters.originalPairsOverwritten > 0 ? 'text-amber-700' : undefined}>
        Ghi đè <strong className="font-medium">{fmt(counters.originalPairsOverwritten)}</strong>
      </span>
      <span className={counters.glyphsWithChangedAdvance > 0 ? 'text-amber-700' : undefined}>
        Đổi advance <strong className="font-medium">{fmt(counters.glyphsWithChangedAdvance)}</strong> glyph
      </span>
      <span className="text-neutral-400">|</span>
      <span>
        Thay <strong className="text-neutral-800 font-medium">{fmt(counters.glyphsReplaced)}</strong>,
        thêm <strong className="text-neutral-800 font-medium">{fmt(counters.glyphsAdded)}</strong> glyph
      </span>
      {note ? <span className="text-neutral-400">{note}</span> : null}
      {invasive ? (
        <span className="ml-auto text-amber-700">Đang can thiệp vào dữ liệu gốc của font</span>
      ) : (
        <span className="ml-auto text-emerald-700">Chưa đụng tới dữ liệu gốc</span>
      )}
    </div>
  );
};
