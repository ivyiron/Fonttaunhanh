import React, { useMemo, useState } from 'react';
import { Search, AlertTriangle, Plus, Lock } from 'lucide-react';
import type { PairEntry } from '../../../core/index';

// A flat list of "all pairs" would be tens of thousands of rows and useless.
// Three sections with their own counts answer the only question that matters
// here: how much of this is the designer's, and how much is ours.

type SectionId = 'original' | 'inherited' | 'flagged';

const SECTIONS: { id: SectionId; label: string; hint: string; icon: React.ElementType }[] = [
  { id: 'original', label: 'Cặp gốc của font', hint: 'Không đụng tới', icon: Lock },
  { id: 'inherited', label: 'Cặp thêm cho glyph mới', hint: 'Nhân bản từ chữ nền', icon: Plus },
  { id: 'flagged', label: 'Cặp bị đánh dấu chạm', hint: 'Cần duyệt từng cái', icon: AlertTriangle }
];

interface PairListPanelProps {
  entries: PairEntry[];
  activeKey: string | null;
  onSelectPair: (entry: PairEntry) => void;
  /** Keys the user has approved for repair. */
  approvedRepairs: Set<string>;
  onToggleRepair: (key: string) => void;
}

export const PairListPanel: React.FC<PairListPanelProps> = ({
  entries, activeKey, onSelectPair, approvedRepairs, onToggleRepair
}) => {
  const [open, setOpen] = useState<SectionId>('flagged');
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const out: Record<SectionId, PairEntry[]> = { original: [], inherited: [], flagged: [] };
    for (const e of entries) {
      if (e.origin === 'repair') out.flagged.push(e);
      else if (e.origin === 'inherited' || e.origin === 'rebuilt') out.inherited.push(e);
      else out.original.push(e);
    }
    return out;
  }, [entries]);

  const filterList = (list: PairEntry[]) => {
    const q = query.trim();
    const base = q
      ? list.filter(e => (e.leftChar + e.rightChar).includes(q))
      : list;
    // The original list can be 70.000 rows; render a window of it.
    return base.slice(0, 400);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-2 border-b border-neutral-100">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm cặp, ví dụ Ta"
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-neutral-200 rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {SECTIONS.map(section => {
          const list = grouped[section.id];
          const shown = filterList(list);
          const isOpen = open === section.id;
          const Icon = section.icon;
          return (
            <div key={section.id} className="border-b border-neutral-100">
              <button
                onClick={() => setOpen(isOpen ? ('' as SectionId) : section.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 text-left"
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${section.id === 'flagged' && list.length ? 'text-amber-600' : 'text-neutral-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-800">{section.label}</p>
                  <p className="text-[10px] text-neutral-400">{section.hint}</p>
                </div>
                <span className="text-[11px] font-mono text-neutral-500">
                  {list.length.toLocaleString('vi-VN')}
                </span>
              </button>

              {isOpen ? (
                <div className="pb-1">
                  {shown.length === 0 ? (
                    <p className="px-3 py-2 text-[11px] text-neutral-400">
                      {section.id === 'flagged' ? 'Không phát hiện cặp nào chạm nhau.' : 'Không có cặp nào.'}
                    </p>
                  ) : shown.map(e => {
                    const active = e.key === activeKey;
                    const approved = approvedRepairs.has(e.key);
                    return (
                      <div
                        key={e.key}
                        className={[
                          'flex items-center gap-2 px-3 py-1.5 cursor-pointer',
                          active ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'
                        ].join(' ')}
                        onClick={() => onSelectPair(e)}
                      >
                        <span className="text-sm w-10 shrink-0">{e.leftChar}{e.rightChar}</span>
                        <span className={`text-[11px] font-mono flex-1 ${active ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {e.value > 0 ? '+' : ''}{e.value}
                        </span>
                        {e.previousValue !== undefined ? (
                          <span className={`text-[10px] font-mono ${active ? 'text-amber-300' : 'text-amber-700'}`}>
                            gốc {e.previousValue}
                          </span>
                        ) : null}
                        {section.id === 'flagged' ? (
                          <input
                            type="checkbox"
                            checked={approved}
                            onChange={ev => { ev.stopPropagation(); onToggleRepair(e.key); }}
                            onClick={ev => ev.stopPropagation()}
                            className="w-3.5 h-3.5 accent-amber-600 shrink-0"
                            title="Duyệt sửa cặp này"
                          />
                        ) : null}
                      </div>
                    );
                  })}
                  {list.length > shown.length ? (
                    <p className="px-3 py-1.5 text-[10px] text-neutral-400">
                      Hiện {shown.length.toLocaleString('vi-VN')} trong {list.length.toLocaleString('vi-VN')} cặp. Dùng ô tìm để thu hẹp.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
