import React, { useMemo, useState } from 'react';
import { X, Search, Check, AlertCircle } from 'lucide-react';
import type * as opentype from 'opentype.js';
import {
  getGlyphsFromFont,
  getExtractedDiacriticSvgPathFromChar,
  getNativeCharSvgPath,
  VIETNAMESE_BASE_MAP
} from '../../core/index';
import type { FontGlyphItem } from '../../core/session';

// Harvesting a mark out of a character the font already has is the most reliable
// source of a diacritic that belongs to the typeface - far better than scaling a
// generic template. The extraction subtracts the base letter's outline from the
// composed one, so it needs both characters: the composed glyph and its base.

interface GlyphLibraryModalProps {
  font: opentype.Font;
  open: boolean;
  onClose: () => void;
  /** Applies the harvested outline to whichever mark the inspector has selected. */
  onApply: (svgPath: string) => void;
  markLabel: string;
}

export const GlyphLibraryModal: React.FC<GlyphLibraryModalProps> = ({
  font, open, onClose, onApply, markLabel
}) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [baseOverride, setBaseOverride] = useState<string>('');

  const glyphs = useMemo<FontGlyphItem[]>(() => {
    if (!open) return [];
    return getGlyphsFromFont(font).filter(g => g.char && g.unicode && g.unicode > 32);
  }, [font, open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return glyphs.slice(0, 600);
    const q = query.trim().toLowerCase();
    return glyphs.filter(g =>
      g.char.includes(query) ||
      g.name.toLowerCase().includes(q) ||
      (g.unicode ? g.unicode.toString(16).includes(q) : false)
    ).slice(0, 600);
  }, [glyphs, query]);

  // The base letter is usually derivable; the field is there for the cases where
  // it is not (a designer's own alternate, an unusual composition).
  const inferredBase = selected ? (VIETNAMESE_BASE_MAP as any)[selected] ?? '' : '';
  const baseChar = baseOverride || inferredBase;

  const extracted = useMemo(() => {
    if (!selected || !baseChar) return { d: '', error: 'Chưa xác định được chữ nền' };
    try {
      const d = getExtractedDiacriticSvgPathFromChar(font, selected, baseChar);
      if (!d) return { d: '', error: 'Không tách được dấu từ ký tự này' };
      return { d, error: '' };
    } catch (err: any) {
      return { d: '', error: err?.message ?? 'Tách dấu thất bại' };
    }
  }, [font, selected, baseChar]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900">Thư viện glyph</p>
            <p className="text-[11px] text-neutral-500">
              Trích dấu từ một ký tự có sẵn trong font, rồi gán cho {markLabel}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex-1 flex flex-col min-w-0 border-r border-neutral-100">
            <div className="p-2 border-b border-neutral-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Tìm theo ký tự, tên glyph hoặc mã hex"
                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-neutral-200 rounded-lg
                             focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-10 gap-1">
                {filtered.map(g => (
                  <button
                    key={g.index}
                    onClick={() => { setSelected(g.char); setBaseOverride(''); }}
                    title={`${g.name} · U+${g.unicode?.toString(16).toUpperCase()}`}
                    className={[
                      'aspect-square rounded-md border text-sm flex items-center justify-center transition',
                      g.char === selected
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white border-neutral-200 hover:border-neutral-400 text-neutral-800'
                    ].join(' ')}
                  >
                    {g.char}
                  </button>
                ))}
              </div>
              {filtered.length === 0 ? (
                <p className="text-xs text-neutral-400 p-4 text-center">Không tìm thấy ký tự nào.</p>
              ) : null}
            </div>
          </div>

          <div className="w-64 shrink-0 flex flex-col">
            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
              <div>
                <p className="text-[11px] font-medium text-neutral-700 mb-1">Ký tự nguồn</p>
                <div className="h-20 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center text-4xl">
                  {selected ?? <span className="text-xs text-neutral-400">chưa chọn</span>}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-700">Chữ nền</label>
                <input
                  value={baseChar}
                  onChange={e => setBaseOverride(e.target.value.slice(0, 1))}
                  placeholder="a"
                  className="mt-1 w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-lg
                             focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Phần bị trừ đi khỏi ký tự nguồn để còn lại dấu.
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium text-neutral-700 mb-1">Dấu tách được</p>
                <div className="h-24 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center p-2">
                  {extracted.d ? (
                    <svg viewBox="-250 -250 500 500" className="w-full h-full">
                      <path d={extracted.d} fill="#171717" transform="scale(1,-1)" />
                    </svg>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-neutral-400 text-center px-2">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {selected ? extracted.error : 'Chọn một ký tự bên trái'}
                    </span>
                  )}
                </div>
              </div>

              {selected && !getNativeCharSvgPath(font, selected) ? (
                <p className="text-[10px] text-amber-700">
                  Ký tự này không có outline trong font gốc.
                </p>
              ) : null}
            </div>

            <div className="p-3 border-t border-neutral-100">
              <button
                disabled={!extracted.d}
                onClick={() => { onApply(extracted.d); onClose(); }}
                className={[
                  'w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg transition',
                  extracted.d
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                ].join(' ')}
              >
                <Check className="w-3.5 h-3.5" />
                Dùng làm {markLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
