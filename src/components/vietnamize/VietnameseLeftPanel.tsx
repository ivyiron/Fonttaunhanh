import React, { useState, useMemo } from 'react';
import * as opentype from 'opentype.js';
import {
  Sparkles,
  Layers,
  Search,
  CheckCircle2,
  Sliders,
  Filter,
  Check
} from 'lucide-react';
import { DiacriticTemplate, AutoPositionRules, GlyphOverrideState } from '../../types';
import { DEFAULT_DIACRITICS, VIETNAMESE_CHARS, VIETNAMESE_RECIPES } from '../../utils';

export type VietnamizeSubTab = 'diacritics' | 'double_accents' | 'glyphs';

interface VietnameseLeftPanelProps {
  font: opentype.Font | null;
  activeSubTab: VietnamizeSubTab;
  setActiveSubTab: (tab: VietnamizeSubTab) => void;
  // Diacritic tab props
  activeDiaId: string;
  setActiveDiaId: (id: string) => void;
  templates: Record<string, DiacriticTemplate>;
  onOpenLibraryModal: () => void;
  // Double accent tab props
  rules: AutoPositionRules;
  onUpdateRules: (updates: Partial<AutoPositionRules>) => void;
  selectedDoubleChar: string;
  setSelectedDoubleChar: (char: string) => void;
  // Glyph tab props
  selectedGlyphChar: string;
  setSelectedGlyphChar: (char: string) => void;
  overrides: Record<string, GlyphOverrideState>;
  onBatchApproveOverrides: () => void;
}

const DOUBLE_ACCENT_GROUPS: Record<string, { lower: string[]; upper: string[] }> = {
  'A': {
    lower: ['ấ', 'ầ', 'ẩ', 'ẫ', 'ậ', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'],
    upper: ['Ấ', 'Ầ', 'Ẩ', 'Ẫ', 'Ậ', 'Ắ', 'Ằ', 'Ẳ', 'Ẵ', 'Ặ']
  },
  'E': {
    lower: ['ế', 'ề', 'ể', 'ễ', 'ệ'],
    upper: ['Ế', 'Ề', 'Ể', 'Ễ', 'Ệ']
  },
  'O': {
    lower: ['ố', 'ồ', 'ổ', 'ỗ', 'ộ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
    upper: ['Ố', 'Ồ', 'Ổ', 'Ỗ', 'Ộ', 'Ớ', 'Ờ', 'Ở', 'Ỡ', 'Ợ']
  },
  'U': {
    lower: ['ứ', 'ừ', 'ử', 'ữ', 'ự'],
    upper: ['Ứ', 'Ừ', 'Ử', 'Ữ', 'Ự']
  }
};

export const VietnameseLeftPanel: React.FC<VietnameseLeftPanelProps> = ({
  font,
  activeSubTab,
  setActiveSubTab,
  activeDiaId,
  setActiveDiaId,
  templates,
  onOpenLibraryModal,
  rules,
  onUpdateRules,
  selectedDoubleChar,
  setSelectedDoubleChar,
  selectedGlyphChar,
  setSelectedGlyphChar,
  overrides,
  onBatchApproveOverrides
}) => {
  // SubTab 2 State (Dấu Kép)
  const [doubleGroup, setDoubleGroup] = useState<'ALL' | 'A' | 'E' | 'O' | 'U'>('ALL');
  const [doubleCase, setDoubleCase] = useState<'lower' | 'upper'>('lower');

  // SubTab 3 State (Ký Tự)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<
    'all' | 'lower' | 'upper' | 'a' | 'e' | 'o' | 'u' | 'other' | 'modified'
  >('all');

  // List of double accent chars based on filter
  const currentDoubleList = useMemo(() => {
    let list: string[] = [];
    if (doubleGroup === 'ALL') {
      Object.values(DOUBLE_ACCENT_GROUPS).forEach((grp) => {
        list = list.concat(doubleCase === 'lower' ? grp.lower : grp.upper);
      });
    } else {
      const grp = DOUBLE_ACCENT_GROUPS[doubleGroup];
      if (grp) list = doubleCase === 'lower' ? grp.lower : grp.upper;
    }
    return list;
  }, [doubleGroup, doubleCase]);

  // List of 134 chars filtered for SubTab 3
  const filteredGlyphs = useMemo(() => {
    return VIETNAMESE_CHARS.filter((char) => {
      // Search
      if (searchQuery.trim()) {
        if (!char.includes(searchQuery.trim().toLowerCase()) && !char.includes(searchQuery.trim().toUpperCase())) {
          return false;
        }
      }

      const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();
      const isLower = !isUpper;

      if (filterCategory === 'lower' && !isLower) return false;
      if (filterCategory === 'upper' && !isUpper) return false;

      const norm = char.toLowerCase();
      const isA = ['a', 'à', 'á', 'ả', 'ã', 'ạ', 'ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ', 'â', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ'].includes(norm);
      const isE = ['e', 'è', 'é', 'ẻ', 'ẽ', 'ẹ', 'ê', 'ề', 'ế', 'ể', 'ễ', 'ệ'].includes(norm);
      const isO = ['o', 'ò', 'ó', 'ỏ', 'õ', 'ọ', 'ô', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ', 'ơ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ'].includes(norm);
      const isU = ['u', 'ù', 'ú', 'ủ', 'ũ', 'ụ', 'ư', 'ừ', 'ứ', 'ử', 'ữ', 'ự'].includes(norm);

      if (filterCategory === 'a' && !isA) return false;
      if (filterCategory === 'e' && !isE) return false;
      if (filterCategory === 'o' && !isO) return false;
      if (filterCategory === 'u' && !isU) return false;
      if (filterCategory === 'other' && (isA || isE || isO || isU)) return false;

      if (filterCategory === 'modified') {
        const ov = overrides[char];
        if (!ov) return false;
        const hasTweak =
          ov.offsetX !== 0 ||
          ov.offsetY !== 0 ||
          ov.scaleX !== 1 ||
          ov.scaleY !== 1 ||
          ov.advanceWidthTweak !== 0;
        return hasTweak;
      }

      return true;
    });
  }, [searchQuery, filterCategory, overrides]);

  const modifiedCount = useMemo(() => {
    return (Object.values(overrides) as GlyphOverrideState[]).filter(
      (ov) =>
        ov.offsetX !== 0 ||
        ov.offsetY !== 0 ||
        ov.scaleX !== 1 ||
        ov.scaleY !== 1 ||
        ov.advanceWidthTweak !== 0 ||
        (ov.comp1OffsetX !== undefined && ov.comp1OffsetX !== 0) ||
        (ov.comp1OffsetY !== undefined && ov.comp1OffsetY !== 0) ||
        (ov.comp2OffsetX !== undefined && ov.comp2OffsetX !== 0) ||
        (ov.comp2OffsetY !== undefined && ov.comp2OffsetY !== 0) ||
        !!ov.hasCustomDoubleAccent
    ).length;
  }, [overrides]);

  const modifiedDoubleCount = useMemo(() => {
    return currentDoubleList.filter((char) => {
      const ov = overrides[char];
      return (
        ov &&
        (ov.offsetX !== 0 ||
          ov.offsetY !== 0 ||
          ov.scaleX !== 1 ||
          ov.scaleY !== 1 ||
          ov.advanceWidthTweak !== 0 ||
          (ov.comp1OffsetX !== undefined && ov.comp1OffsetX !== 0) ||
          (ov.comp1OffsetY !== undefined && ov.comp1OffsetY !== 0) ||
          (ov.comp2OffsetX !== undefined && ov.comp2OffsetX !== 0) ||
          (ov.comp2OffsetY !== undefined && ov.comp2OffsetY !== 0) ||
          !!ov.hasCustomDoubleAccent)
      );
    }).length;
  }, [currentDoubleList, overrides]);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* 3 Sub-Tabs Header Navigation */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('diacritics')}
          className={`py-1.5 px-2 text-xs font-bold rounded-md transition text-center cursor-pointer ${
            activeSubTab === 'diacritics'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
          }`}
        >
          Thanh dấu
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('double_accents')}
          className={`py-1.5 px-2 text-xs font-bold rounded-md transition text-center cursor-pointer ${
            activeSubTab === 'double_accents'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
          }`}
        >
          Dấu kép
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('glyphs')}
          className={`py-1.5 px-2 text-xs font-bold rounded-md transition text-center cursor-pointer ${
            activeSubTab === 'glyphs'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
          }`}
        >
          Ký tự
        </button>
      </div>

      {/* SUB-TAB 1: THANH DẤU */}
      {activeSubTab === 'diacritics' && (
        <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-neutral-500">
              Danh sách dấu mẫu (9)
            </span>
            <button
              type="button"
              onClick={onOpenLibraryModal}
              className="text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition cursor-pointer flex items-center gap-1"
            >
              
              <span>Font list</span>
            </button>
          </div>

          {/* 9 Diacritics List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
            {DEFAULT_DIACRITICS.map((defaultDia) => {
              const dia = templates[defaultDia.id] || defaultDia;
              const isSelected = activeDiaId === dia.id;
              const hasCustomVector = !!dia.svgPath;

              return (
                <button
                  key={dia.id}
                  type="button"
                  onClick={() => setActiveDiaId(dia.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-bold truncate">{dia.name}</span>
                    <span
                      className={`text-[10px] font-mono mt-0.5 truncate ${
                        isSelected ? 'text-neutral-400' : 'text-neutral-400'
                      }`}
                    >
                      ID: {dia.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasCustomVector ? (
                      <span
                        className={`text-[8px] px-1.5 py-0.5 rounded-md font-semibold ${
                          isSelected
                            ? 'bg-emerald-900/80 text-emerald-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        ✓Auto
                      </span>
                    ) : (
                      <span className="text-[8px] text-neutral-400">Mặc định</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DẤU KÉP */}
      {activeSubTab === 'double_accents' && (
        <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
          
          {/* Group & Case Filter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                {(['ALL', 'A', 'E', 'O', 'U'] as const).map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setDoubleGroup(grp)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                      doubleGroup === grp
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {grp === 'ALL' ? 'Tất cả' : grp}
                  </button>
                ))}
              </div>

              {/* Case switch */}
              <div className="flex items-center p-0.5 bg-neutral-200/70 rounded-md text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setDoubleCase('lower')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                    doubleCase === 'lower' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'
                  }`}
                >
                  Thường
                </button>
                <button
                  type="button"
                  onClick={() => setDoubleCase('upper')}
                  className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                    doubleCase === 'upper' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500'
                  }`}
                >
                  Hoa
                </button>
              </div>
            </div>
          </div>

          {/* Double Accents Characters Grid */}
          {modifiedDoubleCount > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-neutral-500 font-medium">
                {modifiedDoubleCount} ký tự có tinh chỉnh riêng
              </span>
              <button
                type="button"
                onClick={onBatchApproveOverrides}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                Duyệt tất cả đã chỉnh
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
              {currentDoubleList.map((char) => {
                const isSelected = selectedDoubleChar === char;
                const ov = overrides[char];
                const isCompleted = !!ov?.isCompleted;
                const hasOverride =
                  ov &&
                  (ov.offsetX !== 0 ||
                    ov.offsetY !== 0 ||
                    ov.scaleX !== 1 ||
                    ov.scaleY !== 1 ||
                    ov.advanceWidthTweak !== 0 ||
                    (ov.comp1OffsetX !== undefined && ov.comp1OffsetX !== 0) ||
                    (ov.comp1OffsetY !== undefined && ov.comp1OffsetY !== 0) ||
                    (ov.comp2OffsetX !== undefined && ov.comp2OffsetX !== 0) ||
                    (ov.comp2OffsetY !== undefined && ov.comp2OffsetY !== 0) ||
                    !!ov.hasCustomDoubleAccent);

                return (
                  <button
                    key={char}
                    type="button"
                    onClick={() => setSelectedDoubleChar(char)}
                    className={`h-11 rounded-xl border font-mono text-base font-bold transition flex flex-col items-center justify-center relative cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-50/50 text-emerald-950 border-emerald-200 hover:border-emerald-300'
                        : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{char}</span>
                    {hasOverride && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 right-1"
                        title="Có tinh chỉnh riêng"
                      />
                    )}
                    {isCompleted && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-1 right-1"
                        title="Đã duyệt"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: KÝ TỰ (BƯỚC 2 CĂN CHỈNH NÂNG CAO) */}
      {activeSubTab === 'glyphs' && (
        <div className="flex-1 flex flex-col space-y-2.5 overflow-hidden">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm ký tự (ví dụ: a, ắ, ệ...)"
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900 transition text-neutral-900"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-1 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Tất cả (134)
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('lower')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                filterCategory === 'lower'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Thường
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('upper')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                filterCategory === 'upper'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Hoa
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('a')}
              className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                filterCategory === 'a'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              A/Ă/Â
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('e')}
              className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                filterCategory === 'e'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              E/Ê
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('o')}
              className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                filterCategory === 'o'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              O/Ô/Ơ
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('u')}
              className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                filterCategory === 'u'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              U/Ư
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('other')}
              className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                filterCategory === 'other'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              I/Y/Đ
            </button>
            {modifiedCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterCategory('modified')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  filterCategory === 'modified'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>Đã tinh chỉnh ({modifiedCount})</span>
              </button>
            )}
          </div>

          {/* Quick Approve Action */}
          {modifiedCount > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-neutral-500 font-medium">
                {modifiedCount} ký tự có tinh chỉnh riêng
              </span>
              <button
                type="button"
                onClick={onBatchApproveOverrides}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                Duyệt tất cả đã chỉnh
              </button>
            </div>
          )}

          {/* 134 Glyphs Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
              {filteredGlyphs.map((char) => {
                const isSelected = selectedGlyphChar === char;
                const ov = overrides[char];
                const isCompleted = ov?.isCompleted;
                const hasTweak =
                  ov &&
                  (ov.offsetX !== 0 ||
                    ov.offsetY !== 0 ||
                    ov.scaleX !== 1 ||
                    ov.scaleY !== 1 ||
                    ov.advanceWidthTweak !== 0 ||
                    (ov.comp1OffsetX !== undefined && ov.comp1OffsetX !== 0) ||
                    (ov.comp1OffsetY !== undefined && ov.comp1OffsetY !== 0) ||
                    (ov.comp2OffsetX !== undefined && ov.comp2OffsetX !== 0) ||
                    (ov.comp2OffsetY !== undefined && ov.comp2OffsetY !== 0) ||
                    !!ov.hasCustomDoubleAccent);

                return (
                  <button
                    key={char}
                    type="button"
                    onClick={() => setSelectedGlyphChar(char)}
                    className={`h-11 rounded-xl border font-mono text-base font-bold transition flex flex-col items-center justify-center relative cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-50/50 text-emerald-950 border-emerald-200 hover:border-emerald-300'
                        : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{char}</span>
                    {hasTweak && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 right-1"
                        title="Có tinh chỉnh riêng"
                      />
                    )}
                    {isCompleted && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-1 right-1"
                        title="Đã duyệt"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
