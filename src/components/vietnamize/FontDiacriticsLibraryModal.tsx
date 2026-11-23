import React, { useEffect, useMemo, useState } from 'react';
import * as opentype from 'opentype.js';
import { Search, X, Copy, Code, Check, Sparkles } from 'lucide-react';
import { AutoPositionRules, DiacriticTemplate } from '../../types';
import {
  getNativeCharSvgPath,
  getNativeCharFullSvg,
  getExtractedDiacriticSvgPathFromChar,
  extractDiacriticFromSpecificChar,
  commandsToSvgPathD,
  getExactBoundingBox
} from '../../utils';
import { CenterGuidesPanel } from './CenterGuidesPanel';
import { GlyphSvg, Tile, DetailPanel, PanelCard, GlyphFrame } from './libraryShared';

interface FontDiacriticsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  font: opentype.Font;
  templates: Record<string, DiacriticTemplate>;
  onApplySvgToTemplate?: (diaId: string, svgPath: string) => void;
  rules?: AutoPositionRules;
  onUpdateRules?: (updates: Partial<AutoPositionRules>) => void;
}

const VIETNAMESE_CHAR_LIST = [
  { char: 'á', base: 'a', type: 'acute', label: 'a sắc' },
  { char: 'à', base: 'a', type: 'grave', label: 'a huyền' },
  { char: 'ả', base: 'a', type: 'hook', label: 'a hỏi' },
  { char: 'ã', base: 'a', type: 'tilde', label: 'a ngã' },
  { char: 'ạ', base: 'a', type: 'dot_below', label: 'a nặng' },
  { char: 'â', base: 'a', type: 'circumflex', label: 'a nón' },
  { char: 'ấ', base: 'â', type: 'acute', label: 'â sắc' },
  { char: 'ầ', base: 'â', type: 'grave', label: 'â huyền' },
  { char: 'ẩ', base: 'â', type: 'hook', label: 'â hỏi' },
  { char: 'ẫ', base: 'â', type: 'tilde', label: 'â ngã' },
  { char: 'ậ', base: 'â', type: 'dot_below', label: 'â nặng' },
  { char: 'ă', base: 'a', type: 'breve', label: 'a trăng' },
  { char: 'ắ', base: 'ă', type: 'acute', label: 'ă sắc' },
  { char: 'ằ', base: 'ă', type: 'grave', label: 'ă huyền' },
  { char: 'ẳ', base: 'ă', type: 'hook', label: 'ă hỏi' },
  { char: 'ẵ', base: 'ă', type: 'tilde', label: 'ă ngã' },
  { char: 'ặ', base: 'ă', type: 'dot_below', label: 'ă nặng' },
  { char: 'é', base: 'e', type: 'acute', label: 'e sắc' },
  { char: 'è', base: 'e', type: 'grave', label: 'e huyền' },
  { char: 'ẻ', base: 'e', type: 'hook', label: 'e hỏi' },
  { char: 'ẽ', base: 'e', type: 'tilde', label: 'e ngã' },
  { char: 'ẹ', base: 'e', type: 'dot_below', label: 'e nặng' },
  { char: 'ê', base: 'e', type: 'circumflex', label: 'e nón' },
  { char: 'ế', base: 'ê', type: 'acute', label: 'ê sắc' },
  { char: 'ề', base: 'ê', type: 'grave', label: 'ê huyền' },
  { char: 'ể', base: 'ê', type: 'hook', label: 'ê hỏi' },
  { char: 'ễ', base: 'ê', type: 'tilde', label: 'ễ ngã' },
  { char: 'ệ', base: 'ê', type: 'dot_below', label: 'ệ nặng' },
  { char: 'í', base: 'i', type: 'acute', label: 'i sắc' },
  { char: 'ì', base: 'i', type: 'grave', label: 'i huyền' },
  { char: 'ỉ', base: 'i', type: 'hook', label: 'i hỏi' },
  { char: 'ĩ', base: 'i', type: 'tilde', label: 'i ngã' },
  { char: 'ị', base: 'i', type: 'dot_below', label: 'i nặng' },
  { char: 'ó', base: 'o', type: 'acute', label: 'o sắc' },
  { char: 'ò', base: 'o', type: 'grave', label: 'o huyền' },
  { char: 'ỏ', base: 'o', type: 'hook', label: 'o hỏi' },
  { char: 'õ', base: 'o', type: 'tilde', label: 'o ngã' },
  { char: 'ọ', base: 'o', type: 'dot_below', label: 'o nặng' },
  { char: 'ô', base: 'o', type: 'circumflex', label: 'o nón' },
  { char: 'ố', base: 'ô', type: 'acute', label: 'ô sắc' },
  { char: 'ồ', base: 'ô', type: 'grave', label: 'ô huyền' },
  { char: 'ổ', base: 'ô', type: 'hook', label: 'ô hỏi' },
  { char: 'ỗ', base: 'ô', type: 'tilde', label: 'ô ngã' },
  { char: 'ộ', base: 'ô', type: 'dot_below', label: 'ô nặng' },
  { char: 'ơ', base: 'o', type: 'horn', label: 'o móc' },
  { char: 'ớ', base: 'ơ', type: 'acute', label: 'ơ sắc' },
  { char: 'ờ', base: 'ơ', type: 'grave', label: 'ơ huyền' },
  { char: 'ở', base: 'ơ', type: 'hook', label: 'ơ hỏi' },
  { char: 'ỡ', base: 'ơ', type: 'tilde', label: 'ơ ngã' },
  { char: 'ợ', base: 'ơ', type: 'dot_below', label: 'ơ nặng' },
  { char: 'ú', base: 'u', type: 'acute', label: 'u sắc' },
  { char: 'ù', base: 'u', type: 'grave', label: 'u huyền' },
  { char: 'ủ', base: 'u', type: 'hook', label: 'u hỏi' },
  { char: 'ũ', base: 'u', type: 'tilde', label: 'u ngã' },
  { char: 'ụ', base: 'u', type: 'dot_below', label: 'u nặng' },
  { char: 'ư', base: 'u', type: 'horn', label: 'u móc' },
  { char: 'ứ', base: 'ư', type: 'acute', label: 'ư sắc' },
  { char: 'ừ', base: 'ư', type: 'grave', label: 'ư huyền' },
  { char: 'ử', base: 'ư', type: 'hook', label: 'ư hỏi' },
  { char: 'ữ', base: 'ư', type: 'tilde', label: 'ư ngã' },
  { char: 'ự', base: 'ư', type: 'dot_below', label: 'ư nặng' },
  { char: 'ý', base: 'y', type: 'acute', label: 'y sắc' },
  { char: 'ỳ', base: 'y', type: 'grave', label: 'y huyền' },
  { char: 'ỷ', base: 'y', type: 'hook', label: 'y hỏi' },
  { char: 'ỹ', base: 'y', type: 'tilde', label: 'y ngã' },
  { char: 'ỵ', base: 'y', type: 'dot_below', label: 'y nặng' },
  { char: 'đ', base: 'd', type: 'bar', label: 'd gạch' },

  // Uppercase
  { char: 'Á', base: 'A', type: 'acute', label: 'A sắc' },
  { char: 'À', base: 'A', type: 'grave', label: 'A huyền' },
  { char: 'Ả', base: 'A', type: 'hook', label: 'A hỏi' },
  { char: 'Ã', base: 'A', type: 'tilde', label: 'A ngã' },
  { char: 'Ạ', base: 'A', type: 'dot_below', label: 'A nặng' },
  { char: 'Â', base: 'A', type: 'circumflex', label: 'A nón' },
  { char: 'Ấ', base: 'Â', type: 'acute', label: 'Â sắc' },
  { char: 'Ầ', base: 'Â', type: 'grave', label: 'Â huyền' },
  { char: 'Ẩ', base: 'Â', type: 'hook', label: 'Â hỏi' },
  { char: 'Ẫ', base: 'Â', type: 'tilde', label: 'Â ngã' },
  { char: 'Ậ', base: 'Â', type: 'dot_below', label: 'Â nặng' },
  { char: 'Ă', base: 'A', type: 'breve', label: 'A trăng' },
  { char: 'Ắ', base: 'Ă', type: 'acute', label: 'Ă sắc' },
  { char: 'Ằ', base: 'Ă', type: 'grave', label: 'Ă huyền' },
  { char: 'Ẳ', base: 'Ă', type: 'hook', label: 'Ă hỏi' },
  { char: 'Ẵ', base: 'Ă', type: 'tilde', label: 'Ă ngã' },
  { char: 'Ặ', base: 'Ă', type: 'dot_below', label: 'Ă nặng' },
  { char: 'É', base: 'E', type: 'acute', label: 'E sắc' },
  { char: 'È', base: 'E', type: 'grave', label: 'E huyền' },
  { char: 'Ẻ', base: 'E', type: 'hook', label: 'E hỏi' },
  { char: 'Ẽ', base: 'E', type: 'tilde', label: 'E ngã' },
  { char: 'Ẹ', base: 'E', type: 'dot_below', label: 'E nặng' },
  { char: 'Ê', base: 'E', type: 'circumflex', label: 'E nón' },
  { char: 'Ế', base: 'Ê', type: 'acute', label: 'Ê sắc' },
  { char: 'Ề', base: 'Ê', type: 'grave', label: 'Ê huyền' },
  { char: 'Ể', base: 'Ê', type: 'hook', label: 'Ê hỏi' },
  { char: 'Ễ', base: 'Ê', type: 'tilde', label: 'Ễ ngã' },
  { char: 'Ệ', base: 'Ê', type: 'dot_below', label: 'Ệ nặng' },
  { char: 'Í', base: 'I', type: 'acute', label: 'I sắc' },
  { char: 'Ì', base: 'I', type: 'grave', label: 'I huyền' },
  { char: 'Ỉ', base: 'I', type: 'hook', label: 'I hỏi' },
  { char: 'Ĩ', base: 'I', type: 'tilde', label: 'I ngã' },
  { char: 'Ị', base: 'I', type: 'dot_below', label: 'I nặng' },
  { char: 'Ó', base: 'O', type: 'acute', label: 'O sắc' },
  { char: 'Ò', base: 'O', type: 'grave', label: 'O huyền' },
  { char: 'Ỏ', base: 'O', type: 'hook', label: 'O hỏi' },
  { char: 'Õ', base: 'O', type: 'tilde', label: 'O ngã' },
  { char: 'Ọ', base: 'O', type: 'dot_below', label: 'O nặng' },
  { char: 'Ô', base: 'O', type: 'circumflex', label: 'O nón' },
  { char: 'Ố', base: 'Ô', type: 'acute', label: 'Ô sắc' },
  { char: 'Ồ', base: 'Ô', type: 'grave', label: 'Ô huyền' },
  { char: 'Ổ', base: 'Ô', type: 'hook', label: 'Ô hỏi' },
  { char: 'Ỗ', base: 'Ô', type: 'tilde', label: 'Ô ngã' },
  { char: 'Ộ', base: 'Ô', type: 'dot_below', label: 'Ô nặng' },
  { char: 'Ơ', base: 'O', type: 'horn', label: 'O móc' },
  { char: 'Ớ', base: 'Ơ', type: 'acute', label: 'Ơ sắc' },
  { char: 'Ờ', base: 'Ơ', type: 'grave', label: 'Ơ huyền' },
  { char: 'Ở', base: 'Ơ', type: 'hook', label: 'Ơ hỏi' },
  { char: 'Ỡ', base: 'Ơ', type: 'tilde', label: 'Ơ ngã' },
  { char: 'Ợ', base: 'Ơ', type: 'dot_below', label: 'Ơ nặng' },
  { char: 'Ú', base: 'U', type: 'acute', label: 'U sắc' },
  { char: 'Ù', base: 'U', type: 'grave', label: 'U huyền' },
  { char: 'Ủ', base: 'U', type: 'hook', label: 'U hỏi' },
  { char: 'Ũ', base: 'U', type: 'tilde', label: 'U ngã' },
  { char: 'Ụ', base: 'U', type: 'dot_below', label: 'U nặng' },
  { char: 'Ư', base: 'U', type: 'horn', label: 'U móc' },
  { char: 'Ứ', base: 'Ư', type: 'acute', label: 'Ư sắc' },
  { char: 'Ừ', base: 'Ư', type: 'grave', label: 'Ư huyền' },
  { char: 'Ử', base: 'Ư', type: 'hook', label: 'Ư hỏi' },
  { char: 'Ữ', base: 'Ư', type: 'tilde', label: 'Ư ngã' },
  { char: 'Ự', base: 'Ư', type: 'dot_below', label: 'Ư nặng' },
  { char: 'Ý', base: 'Y', type: 'acute', label: 'Y sắc' },
  { char: 'Ỳ', base: 'Y', type: 'grave', label: 'Y huyền' },
  { char: 'Ỷ', base: 'Y', type: 'hook', label: 'Y hỏi' },
  { char: 'Ỹ', base: 'Y', type: 'tilde', label: 'Y ngã' },
  { char: 'Ỵ', base: 'Y', type: 'dot_below', label: 'Y nặng' },
  { char: 'Đ', base: 'D', type: 'bar', label: 'D gạch' }
];


const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'acute', label: 'Sắc' },
  { id: 'grave', label: 'Huyền' },
  { id: 'hook', label: 'Hỏi' },
  { id: 'tilde', label: 'Ngã' },
  { id: 'dot_below', label: 'Nặng' },
  { id: 'circumflex', label: 'Mũ' },
  { id: 'breve', label: 'Trăng' },
  { id: 'horn', label: 'Móc' },
  { id: 'bar', label: 'Gạch' }
];

type Item = (typeof VIETNAMESE_CHAR_LIST)[number] & {
  d: string;
  markD: string;
  box: { x1: number; x2: number; y1: number; y2: number };
};

const templateIdFor = (item: { type: string; base: string }) =>
  item.type === 'horn' ? (item.base.toLowerCase() === 'u' ? 'horn_u' : 'horn_o') : item.type;

export const FontDiacriticsLibraryModal: React.FC<FontDiacriticsLibraryModalProps> = ({
  isOpen,
  onClose,
  font,
  templates,
  onApplySvgToTemplate,
  rules,
  onUpdateRules
}) => {
  const [view, setView] = useState<'marks' | 'centers'>('marks');
  const [filter, setFilter] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const items: Item[] = useMemo(() => {
    if (!font) return [];
    const out: Item[] = [];
    for (const it of VIETNAMESE_CHAR_LIST) {
      const idx = font.charToGlyphIndex(it.char);
      if (idx <= 0) continue;
      const g: any = font.glyphs.get(idx);
      if (!g || !g.path || !g.path.commands || !g.path.commands.length) continue;
      const b = getExactBoundingBox(g.path.commands);
      let markD = '';
      try {
        const m: any = extractDiacriticFromSpecificChar(font, it.char, it.base);
        if (m && m.path && m.path.commands.length) markD = commandsToSvgPathD(m.path.commands);
      } catch {
        markD = '';
      }
      out.push({ ...it, d: commandsToSvgPathD(g.path.commands), markD, box: { x1: b.xMin, x2: b.xMax, y1: b.yMin, y2: b.yMax } });
    }
    return out;
  }, [font]);

  const frame: GlyphFrame = useMemo(() => {
    const upm = (font as any)?.unitsPerEm || 1000;
    if (!items.length) return { top: upm, bottom: -upm * 0.25 };
    const top = Math.max(...items.map((i) => i.box.y2));
    const bottom = Math.min(...items.map((i) => i.box.y1), 0);
    const pad = (top - bottom) * 0.08;
    return { top: top + pad, bottom: bottom - pad };
  }, [items, font]);

  if (!isOpen || !font) return null;

  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (i) => (filter === 'all' || i.type === filter) && (!q || i.char.toLowerCase().includes(q) || i.label.toLowerCase().includes(q))
  );
  const current = items.find((i) => i.char === selected) || shown[0] || null;
  const canCenters = !!(rules && onUpdateRules);

  const copy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setToast(label);
    setTimeout(() => setToast(null), 1800);
  };

  const tabBtn = (id: 'marks' | 'centers', label: React.ReactNode) => (
    <button
      key={id}
      type="button"
      onClick={() => setView(id)}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
        view === id
          ? 'bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950'
          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-[#1b1b24] border border-neutral-200 dark:border-[#353545] rounded-2xl max-w-6xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in text-neutral-900 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: tabs + close */}
        <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-neutral-200 dark:border-[#323242]">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-[#22222e] p-1 rounded-xl">
            {tabBtn('marks', <>Dấu trong font <span className="font-mono opacity-60">{items.length}</span></>)}
            {canCenters && tabBtn('centers', 'Tâm chữ')}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-[#2e2e3e] rounded-lg transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {view === 'centers' && canCenters ? (
          <CenterGuidesPanel font={font} rules={rules!} onUpdateRules={onUpdateRules!} />
        ) : (
          <div className="flex-1 flex min-h-0">
            {/* Left: filter + grid */}
            <div className="flex-1 flex flex-col min-w-0 bg-neutral-50/60 dark:bg-[#16161f]">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-neutral-200/70 dark:border-[#2a2a38]">
                <div className="flex flex-wrap gap-1 flex-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                        filter === f.id
                          ? 'bg-white dark:bg-[#30303f] text-neutral-950 dark:text-white shadow-xs border border-neutral-200 dark:border-[#40405a]'
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-transparent'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="relative w-36">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full text-xs pl-7 pr-2 py-1.5 bg-white dark:bg-[#22222e] border border-neutral-200 dark:border-[#3a3a4c] rounded-lg focus:outline-hidden focus:border-neutral-900 dark:focus:border-amber-400 placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {shown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm font-semibold text-neutral-400 dark:text-neutral-500">
                    Font không có ký tự nào trong nhóm này.
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
                    {shown.map((i) => (
                      <Tile
                        key={i.char}
                        active={!!current && current.char === i.char}
                        onClick={() => setSelected(i.char)}
                        label={i.char}
                        badge={!i.markD ? <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" title="Dấu dính liền thân" /> : null}
                      >
                        <GlyphSvg d={i.d} box={i.box} frame={frame} highlight={i.markD} className="w-full aspect-square" />
                      </Tile>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: detail */}
            <DetailPanel>
              {current ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-extrabold">{current.label}</span>
                    <span className="font-mono text-[10px] text-neutral-400">
                      U+{current.char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}
                    </span>
                  </div>
                  <div className="rounded-xl border border-neutral-200 dark:border-[#353545] bg-neutral-50 dark:bg-[#20202a] text-neutral-900 dark:text-neutral-100">
                    <GlyphSvg d={current.d} box={current.box} frame={frame} highlight={current.markD} className="w-full aspect-square">
                      {({ x0, size, y }) => (
                        <line x1={x0} x2={x0 + size} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity="0.15" strokeWidth={size / 300} />
                      )}
                    </GlyphSvg>
                  </div>

                  {current.markD && onApplySvgToTemplate ? (
                    <button
                      type="button"
                      onClick={() => {
                        const id = templateIdFor(current);
                        const p = getExtractedDiacriticSvgPathFromChar(font, current.char, current.base);
                        onApplySvgToTemplate(id, p);
                      }}
                      className="w-full py-2 bg-neutral-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Dùng làm {(templates[templateIdFor(current)]?.name || 'dấu mẫu').replace(/\s*\(.*\)\s*$/, '').toLowerCase()}
                    </button>
                  ) : (
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center py-1">Dấu dính liền thân, không bóc tách được.</p>
                  )}

                  <PanelCard title="Copy SVG">
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { k: 'mark', icon: Sparkles, label: 'Dấu', text: current.markD ? getExtractedDiacriticSvgPathFromChar(font, current.char, current.base) : '' },
                        { k: 'char', icon: Copy, label: 'Ký tự', text: getNativeCharSvgPath(font, current.char) },
                        { k: 'svg', icon: Code, label: '<svg>', text: getNativeCharFullSvg(font, current.char) }
                      ].map(({ k, icon: Icon, label, text }) => (
                        <button
                          key={k}
                          type="button"
                          disabled={!text}
                          onClick={() => copy(text, label)}
                          className="py-2 rounded-lg bg-white dark:bg-[#282834] border border-neutral-200 dark:border-[#3e3e50] hover:border-neutral-400 dark:hover:border-[#5a5a70] text-[10px] font-bold flex flex-col items-center gap-1 transition cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
                        >
                          {toast === label ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Icon className="w-3.5 h-3.5" />}
                          {label}
                        </button>
                      ))}
                    </div>
                  </PanelCard>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-neutral-400 p-6 text-center">Chọn một ký tự</div>
              )}
            </DetailPanel>
          </div>
        )}
      </div>
    </div>
  );
};
