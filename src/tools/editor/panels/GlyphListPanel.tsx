import React, { useMemo, useState } from 'react';
import * as opentype from 'opentype.js';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sparkles,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { FontGlyphItem, GlyphCategory, GlyphEditState, FontMetadata } from '../../../core/session';
import { getGlyphsFromFont } from '../../../core/index';

interface GlyphListPanelProps {
  font: opentype.Font;
  fontMetadata: FontMetadata;
  editedGlyphs: Record<string, GlyphEditState>;
  onSelectGlyph: (glyph: FontGlyphItem) => void;
  activeGlyphId: string | null;
}

const ITEMS_PER_PAGE = 64;

export const GlyphListPanel: React.FC<GlyphListPanelProps> = ({
  font,
  fontMetadata,
  editedGlyphs,
  onSelectGlyph,
  activeGlyphId
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GlyphCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showGridGuides, setShowGridGuides] = useState(true);

  // Extract all glyphs
  const allGlyphs = useMemo(() => {
    return getGlyphsFromFont(font);
  }, [font]);

  // Statistics
  const editedCount = useMemo(() => {
    return (Object.values(editedGlyphs) as GlyphEditState[]).filter(
      (g) => g.isModified || g.isCompleted
    ).length;
  }, [editedGlyphs]);

  // Filtered glyphs
  const filteredGlyphs = useMemo(() => {
    return allGlyphs.filter(item => {
      const editState = editedGlyphs[`glyph_${item.index}`];
      const isEdited = editState && (editState.isModified || editState.isCompleted);

      if (selectedCategory === 'modified') {
        if (!isEdited) return false;
      } else if (selectedCategory !== 'all') {
        if (item.category !== selectedCategory) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hex = item.unicode ? item.unicode.toString(16).toLowerCase() : '';
        const dec = item.unicode ? item.unicode.toString() : '';
        const nameMatch = item.name.toLowerCase().includes(q);
        const charMatch = item.char ? item.char.toLowerCase() === q : false;
        const hexMatch = hex.includes(q.replace('u+', '')) || `u+${hex}`.includes(q);
        const decMatch = dec.includes(q);
        const idxMatch = item.index.toString() === q || `#${item.index}` === q;

        return nameMatch || charMatch || hexMatch || decMatch || idxMatch;
      }

      return true;
    });
  }, [allGlyphs, selectedCategory, searchQuery, editedGlyphs]);

  const totalPages = Math.max(1, Math.ceil(filteredGlyphs.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedGlyphs = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredGlyphs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGlyphs, safePage]);

  const categories: { id: GlyphCategory; label: string; count?: number }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'latin', label: 'A-Z' },
    { id: 'digits', label: '0-9' },
    { id: 'punctuation', label: 'Dấu câu' },
    { id: 'symbols', label: 'Ký hiệu' },
    { id: 'extended', label: 'Mở rộng' },
    { id: 'modified', label: 'Đã sửa', count: editedCount },
  ];

  const unitsPerEm = fontMetadata.unitsPerEm || 1000;
  const ascender = fontMetadata.ascender || 800;
  const descender = fontMetadata.descender || -200;
  const totalHeight = ascender - descender;

  return (
    <aside className="w-72 lg:w-80 border-r border-neutral-200/90 bg-white flex flex-col shrink-0 h-full select-none">
      {/* Top Header & Search */}
      <div className="p-3 border-b border-neutral-200/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Danh Sách Ký Tự
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 font-mono text-neutral-600 font-medium">
              {filteredGlyphs.length}
            </span>
          </div>

          <button
            onClick={() => setShowGridGuides(!showGridGuides)}
            className={`p-1 rounded-md text-xs transition ${
              showGridGuides ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100'
            }`}
            title="Bật/tắt đường gióng mini"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo ký tự, tên, U+..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-neutral-50 border border-neutral-200/80 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition flex items-center gap-1 ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100/70 text-neutral-600 hover:bg-neutral-200/70'
                }`}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && cat.count > 0 && (
                  <span
                    className={`px-1 py-0.2 rounded-full text-[9px] font-mono ${
                      isActive ? 'bg-neutral-700 text-white' : 'bg-amber-100 text-amber-900 font-bold'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Glyph Grid */}
      <div className="flex-1 overflow-y-auto p-2.5">
        {paginatedGlyphs.length === 0 ? (
          <div className="py-16 text-center text-xs text-neutral-400">
            Không tìm thấy ký tự phù hợp
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
            {paginatedGlyphs.map((glyph) => {
              const editKey = `glyph_${glyph.index}`;
              const editState = editedGlyphs[editKey];
              const isSelected = activeGlyphId === editKey;
              const isModified = editState && editState.isModified;
              const isCompleted = editState && editState.isCompleted;
              const isAlt = editState && editState.mode === 'alt';

              const displaySvg = editState ? editState.svgPath : glyph.svgPath;
              const glyphWidth = editState ? editState.advanceWidth : glyph.advanceWidth || unitsPerEm * 0.6;

              return (
                <button
                  key={glyph.index}
                  onClick={() => onSelectGlyph(glyph)}
                  className={`group relative flex flex-col items-center justify-between p-1.5 rounded-xl border transition text-left ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-900/5 ring-2 ring-neutral-900 shadow-2xs'
                      : 'border-neutral-200/70 bg-white hover:border-neutral-400 hover:bg-neutral-50/80'
                  }`}
                  title={`${glyph.name} (Unicode: U+${glyph.unicode?.toString(16).toUpperCase() || 'none'}) - Click để chỉnh sửa`}
                >
                  {/* Status Badges */}
                  <div className="w-full flex items-center justify-between text-[9px] font-mono text-neutral-400">
                    <span className="truncate max-w-[36px]">
                      {glyph.unicode ? `U+${glyph.unicode.toString(16).toUpperCase()}` : `#${glyph.index}`}
                    </span>
                    {isModified && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Đã chỉnh sửa" />
                    )}
                    {isCompleted && (
                      <span title="Hoàn tất" className="shrink-0 inline-flex">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      </span>
                    )}
                  </div>

                  {/* Character Visual */}
                  <div className="w-full h-11 flex items-center justify-center my-0.5 relative">
                    {displaySvg ? (
                      <svg
                        viewBox={`0 ${-ascender} ${glyphWidth} ${totalHeight}`}
                        className="w-full h-full max-h-10 text-neutral-900 group-hover:scale-105 transition-transform"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <g transform="scale(1, -1)">
                          {showGridGuides && (
                            <line
                              x1={0}
                              y1={0}
                              x2={glyphWidth}
                              y2={0}
                              stroke="rgba(100, 116, 139, 0.4)"
                              strokeWidth={Math.max(1, totalHeight * 0.015)}
                              strokeDasharray={`${totalHeight * 0.04} ${totalHeight * 0.04}`}
                            />
                          )}
                          <path d={displaySvg} fill="currentColor" />
                        </g>
                      </svg>
                    ) : (
                      <span className="text-neutral-300 text-xs font-mono">.notdef</span>
                    )}
                  </div>

                  {/* Name or Char bottom */}
                  <div className="w-full text-center">
                    <span className="text-[10px] font-semibold text-neutral-700 group-hover:text-neutral-900 truncate block">
                      {glyph.char || glyph.name}
                    </span>
                  </div>

                  {isAlt && (
                    <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5">
                      <Tag className="w-2 h-2" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-2 border-t border-neutral-200/80 flex items-center justify-between text-xs text-neutral-600 bg-neutral-50/50">
        <span className="text-[11px] font-mono text-neutral-500">
          Trang {safePage} / {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={safePage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-1 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none"
            title="Trang trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-1 rounded-md border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none"
            title="Trang sau"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
