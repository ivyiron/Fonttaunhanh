import React from 'react';
import { Sparkles, Trash2, Plus, Info, Search } from 'lucide-react';
import { GeneratedKerningPair } from '../../utils/kerningEngine';
import { NumericInput } from '../NumericInput';

interface KerningPairsLeftPanelProps {
  kerningPairs: GeneratedKerningPair[];
  filteredPairs: GeneratedKerningPair[];
  selectedCategory: 'all' | 'upper_upper' | 'upper_lower' | 'vietnamese' | 'punctuation' | 'number' | 'custom';
  setSelectedCategory: (category: 'all' | 'upper_upper' | 'upper_lower' | 'vietnamese' | 'punctuation' | 'number' | 'custom') => void;
  searchFilter: string;
  setSearchFilter: (query: string) => void;
  smartGroupEdit: boolean;
  setSmartGroupEdit: (enabled: boolean) => void;
  newCharLeft: string;
  setNewCharLeft: (val: string) => void;
  newCharRight: string;
  setNewCharRight: (val: string) => void;
  newValue: number;
  setNewValue: (val: number) => void;
  onAddCustomPair: (e: React.FormEvent) => void;
  onEditPairValue: (charLeft: string, charRight: string, newVal: number) => void;
  onRemovePair: (charLeft: string, charRight: string) => void;
  compiledRegistered: boolean;
  compiledFamilyName: string | null;
  originalRegistered: boolean;
  originalFamilyName: string | null;
}

export const KerningPairsLeftPanel: React.FC<KerningPairsLeftPanelProps> = ({
  kerningPairs,
  filteredPairs,
  selectedCategory,
  setSelectedCategory,
  searchFilter,
  setSearchFilter,
  smartGroupEdit,
  setSmartGroupEdit,
  newCharLeft,
  setNewCharLeft,
  newCharRight,
  setNewCharRight,
  newValue,
  setNewValue,
  onAddCustomPair,
  onEditPairValue,
  onRemovePair,
  compiledRegistered,
  compiledFamilyName,
  originalRegistered,
  originalFamilyName
}) => {
  return (
    <div className="flex flex-col h-full space-y-3 overflow-hidden text-neutral-900">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-neutral-900">
            Danh sách cặp kerning
          </h3>
          <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
            {filteredPairs.length} / {kerningPairs.length}
          </span>
        </div>
        <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
          Cặp chữ được tính toán quang học & tinh chỉnh
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 shrink-0">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'upper_upper', label: 'Hoa' },
          { id: 'upper_lower', label: 'Hoa-Thường' },
          { id: 'vietnamese', label: 'Tiếng Việt' },
          { id: 'punctuation', label: 'Dấu câu' },
          { id: 'number', label: 'Số' },
          { id: 'custom', label: 'Tự thêm' }
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-neutral-950 text-white shadow-2xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative shrink-0">
        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Tìm kiếm cặp (AV, Ta, Tà...)"
          className="w-full text-xs pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:border-neutral-900 outline-hidden font-medium"
        />
      </div>

  {/* Smart Group Kerning Toggle */}
<div className="pt-2 border-t border-neutral-200/70">
  <label className="flex items-center justify-between w-full cursor-pointer select-none group/toggle">
    <span className="text-xs font-semibold text-neutral-800 group-hover/toggle:text-neutral-950">
       Smart Group Kerning
    </span>

    <div className="relative inline-flex items-center shrink-0">
      <input
        type="checkbox"
        checked={smartGroupEdit}
        onChange={(e) => setSmartGroupEdit(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
    </div>
  </label>
</div>

      {/* Add Custom Pair Form */}
      <form
        onSubmit={onAddCustomPair}
        className="bg-neutral-50 p-2 rounded-xl border border-neutral-200/90 space-y-1.5 shrink-0"
      >
        <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
          <div className="flex items-center gap-1.5">
          <input
            type="text"
            maxLength={2}
            value={newCharLeft}
            onChange={(e) => setNewCharLeft(e.target.value)}
            placeholder="A"
            className="w-10 text-xs text-center font-mono font-bold py-1 bg-white border border-neutral-200 rounded-md outline-hidden"
          />
          <span className="text-xs text-neutral-400">+</span>
          <input
            type="text"
            maxLength={2}
            value={newCharRight}
            onChange={(e) => setNewCharRight(e.target.value)}
            placeholder="V"
            className="w-10 text-xs text-center font-mono font-bold py-1 bg-white border border-neutral-200 rounded-md outline-hidden"
          />
          <div className="flex-1">
            <NumericInput
              value={newValue}
              onChange={(val) => setNewValue(val)}
              step={5}
              min={-1000}
              max={1000}
              size="sm"
            />
          </div>
        </div>
          <button
            type="submit"
            disabled={!newCharLeft || !newCharRight}
            className="py-1 px-2.5 bg-neutral-900 hover:bg-black disabled:opacity-40 text-white text-[10px] font-bold rounded-md flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm cặp kerning</span>
          </button>
        </div>
       
      </form>

      {/* Pairs List / Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredPairs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-400 space-y-1.5 border border-dashed border-neutral-200 rounded-xl">
            <Info className="w-6 h-6 text-neutral-300" />
            <p className="text-xs font-semibold text-neutral-600">Không tìm thấy cặp Kerning</p>
            <p className="text-[10px] text-neutral-400">Thử đổi bộ lọc hoặc thêm cặp mới bên trên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredPairs.map((pair) => {
              const pairKey = `${pair.charLeft},${pair.charRight}`;
              return (
                <div
                  key={pairKey}
                  className="bg-neutral-50 hover:bg-white border border-neutral-200 hover:border-neutral-300 p-2 rounded-xl space-y-1 flex flex-col justify-between transition shadow-2xs group"
                >
                  <div className="text-center py-1 bg-white rounded-lg border border-neutral-100 group-hover:border-neutral-200 overflow-hidden">
                    <span
                      className="text-xl tracking-tight text-neutral-900 font-extrabold inline-block"
                      style={{
                        fontFamily: compiledRegistered && compiledFamilyName
                          ? `"${compiledFamilyName}", serif`
                          : originalRegistered && originalFamilyName
                          ? `"${originalFamilyName}", serif`
                          : 'serif',
                        fontKerning: 'normal',
                        fontFeatureSettings: '"kern" 1, "liga" 1',
                        WebkitFontFeatureSettings: '"kern" 1, "liga" 1'
                      }}
                    >
                      {pair.charLeft}{pair.charRight}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] text-neutral-400 font-medium">
                      <span className="truncate">{pair.category}</span>
                      <button
                        type="button"
                        onClick={() => onRemovePair(pair.charLeft, pair.charRight)}
                        className="text-neutral-300 hover:text-rose-600 transition p-0.5 rounded cursor-pointer"
                        title="Xóa cặp Kerning này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-center">
                      <NumericInput
                        value={pair.value}
                        onChange={(val) => onEditPairValue(pair.charLeft, pair.charRight, val)}
                        step={5}
                        min={-2000}
                        max={2000}
                        size="sm"
                        className="w-full justify-between"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
