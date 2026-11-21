import React from 'react';
import { Plus, Info, Search, RotateCcw, Trash2 } from 'lucide-react';
import { GeneratedKerningPair } from '../../utils/kerningEngine';
import { NumericInput } from '../NumericInput';
import { Switch } from '../Switch';

export type KerningPairFilter =
  | 'all'
  | 'upper_upper'
  | 'upper_lower'
  | 'vietnamese'
  | 'punctuation'
  | 'number'
  | 'custom'
  | 'changed';

interface KerningPairsLeftPanelProps {
  kerningPairs: GeneratedKerningPair[];
  filteredPairs: GeneratedKerningPair[];
  selectedCategory: KerningPairFilter;
  setSelectedCategory: (category: KerningPairFilter) => void;
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
  onClearCustomPair: (charLeft: string, charRight: string) => void;
  selectedPairKey: string | null;
  onSelectPair: (key: string | null) => void;
  originalValueOf: (pair: GeneratedKerningPair) => number;
  customCount: number;
  changedCount: number;
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
  onClearCustomPair,
  selectedPairKey,
  onSelectPair,
  originalValueOf,
  customCount,
  changedCount,
  compiledRegistered,
  compiledFamilyName,
  originalRegistered,
  originalFamilyName
}) => {
  const pairFont =
    compiledRegistered && compiledFamilyName
      ? `"${compiledFamilyName}", sans-serif`
      : originalRegistered && originalFamilyName
      ? `"${originalFamilyName}", sans-serif`
      : 'sans-serif';

  const selected = selectedPairKey
    ? kerningPairs.find((p) => `${p.charLeft},${p.charRight}` === selectedPairKey) || null
    : null;

  return (
    <div className="flex flex-col h-full space-y-2.5 overflow-hidden text-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold text-neutral-900">Cặp kerning</h3>
        <span className="text-[10px] font-mono font-bold text-neutral-500">
          {filteredPairs.length}/{kerningPairs.length}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1 shrink-0">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'upper_upper', label: 'Hoa' },
          { id: 'upper_lower', label: 'Hoa-Thường' },
          { id: 'vietnamese', label: 'Tiếng Việt' },
          { id: 'punctuation', label: 'Dấu câu' },
          { id: 'number', label: 'Số' },
          { id: 'custom', label: `Đã sửa tay (${customCount})` },
          { id: 'changed', label: `Khác gốc (${changedCount})` }
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id as KerningPairFilter)}
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

      {/* Search + smart group */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="AV, Ta, Tà…"
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:border-neutral-900 outline-hidden font-medium"
          />
        </div>
        <label
          className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 cursor-pointer select-none shrink-0"
          title="Sửa một cặp áp cho cả nhóm chữ cùng gốc (A Á À Â…)"
        >
          Theo nhóm
          <Switch checked={smartGroupEdit} onChange={setSmartGroupEdit} />
        </label>
      </div>

      {/* Selected pair editor, or the add form when nothing is selected */}
      {selected ? (
        <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 flex items-center gap-2 shrink-0">
          <span className="text-2xl leading-none min-w-12 text-center" style={{ fontFamily: pairFont, fontKerning: 'normal' }}>
            {selected.charLeft}
            {selected.charRight}
          </span>
          <div className="flex-1 min-w-0 space-y-0.5">
            <NumericInput
              value={selected.value}
              onChange={(val) => onEditPairValue(selected.charLeft, selected.charRight, val)}
              step={5}
              min={-2000}
              max={2000}
              size="sm"
              unit="UPM"
              className="w-full justify-between"
            />
            <span className="text-[10px] font-mono text-neutral-500 block">gốc {originalValueOf(selected)}</span>
          </div>
          {selected.category === 'custom' && (
            <button
              type="button"
              onClick={() => onClearCustomPair(selected.charLeft, selected.charRight)}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-md cursor-pointer"
              title="Bỏ giá trị sửa tay"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemovePair(selected.charLeft, selected.charRight)}
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-200/60 rounded-md cursor-pointer"
            title="Đặt cặp này về 0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <form
          onSubmit={onAddCustomPair}
          className="bg-neutral-50 p-2 rounded-lg border border-neutral-200 flex items-center gap-1.5 shrink-0"
        >
          <input
            type="text"
            maxLength={2}
            value={newCharLeft}
            onChange={(e) => setNewCharLeft(e.target.value)}
            placeholder="A"
            className="w-9 text-xs text-center font-mono font-bold py-1 bg-white border border-neutral-200 rounded-md outline-hidden"
          />
          <input
            type="text"
            maxLength={2}
            value={newCharRight}
            onChange={(e) => setNewCharRight(e.target.value)}
            placeholder="V"
            className="w-9 text-xs text-center font-mono font-bold py-1 bg-white border border-neutral-200 rounded-md outline-hidden"
          />
          <div className="flex-1 min-w-0">
            <NumericInput value={newValue} onChange={setNewValue} step={5} min={-1000} max={1000} size="sm" unit="UPM" />
          </div>
          <button
            type="submit"
            disabled={!newCharLeft || !newCharRight}
            className="p-1.5 bg-neutral-900 hover:bg-black disabled:opacity-40 text-white rounded-md flex items-center transition cursor-pointer"
            title="Thêm cặp"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* Pair chips */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredPairs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-400 space-y-1.5 border border-dashed border-neutral-200 rounded-xl">
            <Info className="w-6 h-6 text-neutral-300" />
            <p className="text-xs font-semibold text-neutral-600">Không có cặp nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5">
            {filteredPairs.map((pair) => {
              const key = `${pair.charLeft},${pair.charRight}`;
              const isSel = key === selectedPairKey;
              const isCustom = pair.category === 'custom';
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectPair(isSel ? null : key)}
                  className={`relative h-14 rounded-lg border flex flex-col items-center justify-center transition cursor-pointer ${
                    isSel
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <span className="text-xl leading-none" style={{ fontFamily: pairFont, fontKerning: 'normal' }}>
                    {pair.charLeft}
                    {pair.charRight}
                  </span>
                  <span className={`text-[9px] font-mono mt-1 ${isSel ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {pair.value}
                  </span>
                  {isCustom && <i className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 right-1" title="Đã sửa tay" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
