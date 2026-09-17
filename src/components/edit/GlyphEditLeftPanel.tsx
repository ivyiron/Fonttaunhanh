import React, { useState, useMemo, useEffect } from 'react';
import * as opentype from 'opentype.js';
import { Search, Sparkles, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { CustomGlyphDesign } from '../../types';

export interface GlyphItemInfo {
  index: number;
  char: string;
  name: string;
  unicode?: number;
  unicodeHex: string;
  category: 'uppercase' | 'lowercase' | 'number' | 'vietnamese' | 'symbol' | 'other';
}

interface GlyphEditLeftPanelProps {
  font: opentype.Font | null;
  fontBuffer?: ArrayBuffer | null;
  selectedGlyphKey: string;
  onSelectGlyphKey: (key: string) => void;
  customDesigns: Record<string, CustomGlyphDesign>;
}

type FilterCategory = 'all' | 'uppercase' | 'lowercase' | 'number' | 'vietnamese' | 'symbol' | 'edited';

export const GlyphEditLeftPanel: React.FC<GlyphEditLeftPanelProps> = ({
  font,
  fontBuffer,
  selectedGlyphKey,
  onSelectGlyphKey,
  customDesigns
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [previewFontFamily, setPreviewFontFamily] = useState<string | null>(null);

  // Register font face so glyphs display with the loaded font
  useEffect(() => {
    let active = true;

    const setupFont = async () => {
      try {
        let bufferToUse: ArrayBuffer | null = fontBuffer || null;

        // Fallback: if fontBuffer prop is not directly provided, export buffer from font
        if (!bufferToUse && font) {
          try {
            bufferToUse = font.toArrayBuffer();
          } catch (e) {
            console.warn('Cannot convert font to ArrayBuffer:', e);
          }
        }

        if (!bufferToUse) {
          if (active) setPreviewFontFamily(null);
          return;
        }

        const uniqueFamily = `CustomFontForPreview_${Date.now()}`;
        const fontFace = new FontFace(uniqueFamily, bufferToUse);
        const loadedFace = await fontFace.load();

        if (!active) return;

        // Clean up older CustomFontForPreview faces
        const toRemove: FontFace[] = [];
        document.fonts.forEach((face) => {
          if (face.family.startsWith('CustomFontForPreview')) {
            toRemove.push(face);
          }
        });
        toRemove.forEach((face) => document.fonts.delete(face));

        document.fonts.add(loadedFace);
        setPreviewFontFamily(uniqueFamily);
      } catch (err) {
        console.warn('Could not register CustomFontForPreview font face:', err);
        if (active) setPreviewFontFamily(null);
      }
    };

    setupFont();

    return () => {
      active = false;
    };
  }, [font, fontBuffer]);

  // Extract all glyphs from font
  const allGlyphs = useMemo<GlyphItemInfo[]>(() => {
    if (!font || !font.glyphs) return [];

    const list: GlyphItemInfo[] = [];
    const len = font.glyphs.length;

    for (let i = 0; i < len; i++) {
      const g = font.glyphs.get(i);
      if (!g) continue;

      // Skip .notdef if desired, or include it so user can design .notdef
      const unicode = g.unicode;
      const char = unicode ? String.fromCharCode(unicode) : '';
      const name = g.name || (char ? char : `glyph_${i}`);
      const unicodeHex = unicode
        ? `U+${unicode.toString(16).toUpperCase().padStart(4, '0')}`
        : '';

      let cat: GlyphItemInfo['category'] = 'other';
      if (char) {
        if (/[A-Z]/.test(char) && !/[À-ỸĂÂĐÊÔƠƯ]/.test(char)) cat = 'uppercase';
        else if (/[a-z]/.test(char) && !/[à-ỹăâđêôơư]/.test(char)) cat = 'lowercase';
        else if (/[0-9]/.test(char)) cat = 'number';
        else if (/[à-ỹÀ-ỸăĂâÂđĐêÊôÔơƠưƯ]/.test(char)) cat = 'vietnamese';
        else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(char)) cat = 'symbol';
      }

      list.push({
        index: i,
        char,
        name,
        unicode,
        unicodeHex,
        category: cat
      });
    }

    return list;
  }, [font]);

  // Count edited glyphs
  const editedCount = useMemo(() => {
    return Object.keys(customDesigns).length;
  }, [customDesigns]);

  // Filtered glyphs
  const filteredGlyphs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return allGlyphs.filter((item) => {
      const itemKey = item.char || item.name;
      const isEdited = !!customDesigns[itemKey] || !!customDesigns[item.name];

      // Category filter
      if (filterCategory === 'edited') {
        if (!isEdited) return false;
      } else if (filterCategory === 'uppercase') {
        if (item.category !== 'uppercase') return false;
      } else if (filterCategory === 'lowercase') {
        if (item.category !== 'lowercase') return false;
      } else if (filterCategory === 'number') {
        if (item.category !== 'number') return false;
      } else if (filterCategory === 'vietnamese') {
        if (item.category !== 'vietnamese') return false;
      } else if (filterCategory === 'symbol') {
        if (item.category !== 'symbol') return false;
      }

      // Search term filter
      if (!term) return true;

      if (item.char && item.char.toLowerCase() === term) return true;
      if (item.name && item.name.toLowerCase().includes(term)) return true;
      if (item.unicodeHex && item.unicodeHex.toLowerCase().includes(term)) return true;
      if (item.unicode && item.unicode.toString() === term) return true;

      return false;
    });
  }, [allGlyphs, searchTerm, filterCategory, customDesigns]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200 select-none overflow-hidden">
      {/* Header Info */}
      <div className="p-3 border-b border-neutral-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 tracking-tight">
              Danh sách ký tự
            </span>
            <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200">
              {filteredGlyphs.length}/{allGlyphs.length}
            </span>
          </div>

          {editedCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              {editedCount} đã sửa
            </span>
          )}
        </div>

        {/* Search Input */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm ký tự, tên glyph hoặc U+0041..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-md focus:bg-white focus:outline-none focus:border-neutral-400 text-neutral-800 transition placeholder:text-neutral-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'uppercase', label: 'Hoa (A-Z)' },
            { id: 'lowercase', label: 'Thường (a-z)' },
            { id: 'number', label: 'Số' },
            { id: 'vietnamese', label: 'Tiếng Việt' },
            { id: 'symbol', label: 'Ký hiệu' },
            { id: 'edited', label: `Đã sửa (${editedCount})` }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id as FilterCategory)}
              className={`px-2 py-1 text-[10px] font-medium rounded whitespace-nowrap transition cursor-pointer shrink-0 ${
                filterCategory === cat.id
                  ? 'bg-neutral-900 text-white font-semibold shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Glyphs Grid */}
      <div className="flex-1 overflow-y-auto p-2.5">
        {filteredGlyphs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-neutral-400">
            <span className="text-xs">Không tìm thấy ký tự phù hợp</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
            {filteredGlyphs.map((item) => {
              const itemKey = item.char || item.name;
              const isSelected = selectedGlyphKey === itemKey || selectedGlyphKey === item.name;
              const custom = customDesigns[itemKey] || customDesigns[item.name];
              const isEdited = !!custom;

              return (
                <button
                  key={`${item.index}_${item.name}`}
                  type="button"
                  onClick={() => onSelectGlyphKey(itemKey)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer group aspect-square ${
                    isSelected
                      ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                      : isEdited
                      ? 'bg-emerald-50/70 border-emerald-300 text-neutral-900 hover:bg-emerald-100/50'
                      : 'bg-white border-neutral-200/80 text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  {/* Edited indicator dot */}
                  {isEdited && (
                    <span
                      className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-emerald-400 ring-1 ring-white' : 'bg-emerald-600'
                      }`}
                      title={
                        custom.mode === 'replace'
                          ? 'Thay thế hoàn toàn'
                          : custom.mode === 'old_is_alt'
                          ? 'Ký tự cũ là alt'
                          : 'Ký tự mới là alt'
                      }
                    />
                  )}

                  {/* Character Display */}
                  <span
                    className={`text-xl leading-none font-normal mb-1 truncate max-w-full ${
                      isSelected ? 'text-white' : 'text-neutral-950'
                    }`}
                    style={{
                      fontFamily: previewFontFamily ? `"${previewFontFamily}", sans-serif` : 'sans-serif'
                    }}
                  >
                    {item.char || (item.name.length <= 3 ? item.name : item.name.slice(0, 2))}
                  </span>

                  {/* Mini info label */}
                  <span
                    className={`text-[9px] font-mono tracking-tighter truncate max-w-full px-0.5 ${
                      isSelected ? 'text-neutral-300' : 'text-neutral-500'
                    }`}
                  >
                    {item.char ? item.unicodeHex || item.name : item.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="p-2 border-t border-neutral-100 bg-neutral-50 text-[10px] text-neutral-500 flex items-center justify-between">
        <span>Chọn ký tự để xem & thay thế SVG</span>
        <span className="font-mono">Total: {allGlyphs.length}</span>
      </div>
    </div>
  );
};
