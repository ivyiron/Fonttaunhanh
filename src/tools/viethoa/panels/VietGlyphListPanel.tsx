import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { PreviewSession } from '../../../core/index';
import { previewGlyphs, STEP2_RECIPES } from '../../../core/index';

// Grouped by base vowel for browsing, but the deviation badge compares against a
// different, narrower reference: the same mark, on bases of the same case, with
// the same accent stack beneath it. That is the invariant the placement engine
// actually guarantees.
//
// Comparing a grave's top to a tilde's top measures the mark shapes, not the
// placement, and on real fonts it reports 250+ units of "error" that no one
// should act on. With the right reference the residual is 0-2 units, so a badge
// that lights up means something is genuinely off.

const GROUPS: { id: string; label: string; bases: string[] }[] = [
  { id: 'A', label: 'Nhóm A', bases: ['a', 'A', 'ă', 'Ă', 'â', 'Â'] },
  { id: 'E', label: 'Nhóm E', bases: ['e', 'E', 'ê', 'Ê'] },
  { id: 'I', label: 'Nhóm I', bases: ['i', 'I'] },
  { id: 'O', label: 'Nhóm O', bases: ['o', 'O', 'ô', 'Ô', 'ơ', 'Ơ'] },
  { id: 'U', label: 'Nhóm U', bases: ['u', 'U', 'ư', 'Ư'] },
  { id: 'Y', label: 'Nhóm Y', bases: ['y', 'Y'] },
  { id: 'D', label: 'Đ', bases: ['d', 'D'] }
];

interface VietGlyphListPanelProps {
  session: PreviewSession | null;
  activeChar: string | null;
  onSelectChar: (char: string) => void;
  touched: Set<string>;
}

export const VietGlyphListPanel: React.FC<VietGlyphListPanelProps> = ({
  session, activeChar, onSelectChar, touched
}) => {
  const [query, setQuery] = useState('');
  const [openGroup, setOpenGroup] = useState<string>('A');

  const grouped = useMemo(() => {
    return GROUPS.map(g => ({
      ...g,
      chars: STEP2_RECIPES
        .filter((r: any) => r.components.length > 0 && g.bases.includes(r.baseChar))
        .map((r: any) => r.char)
    })).filter(g => g.chars.length > 0);
  }, []);

  // Reference key: same tone mark, same case, same accent stack beneath it.
  // Dot-below marks sit under the baseline and are excluded from a top comparison.
  const deviations = useMemo(() => {
    if (!session) return {};

    const isUpper = (c: string) => c === c.toUpperCase() && c !== c.toLowerCase();
    const buckets = new Map<string, string[]>();

    for (const r of STEP2_RECIPES as any[]) {
      if (r.components.length === 0) continue;
      const tone = r.components[r.components.length - 1];
      if (tone === 'dot_below') continue;
      const key = `${tone}/${isUpper(r.baseChar) ? 'U' : 'l'}/${r.components.slice(0, -1).join('+')}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(r.char);
    }

    const out: Record<string, number> = {};
    for (const chars of buckets.values()) {
      if (chars.length < 2) continue;
      // Only composed glyphs are placed by this engine; kept originals are the
      // designer's own work and must not be flagged.
      const previews = previewGlyphs(session, chars).filter(p => p.source === 'composed');
      if (previews.length < 2) continue;
      const tops = previews.map(p => p.path.getBoundingBox().y2);
      const median = [...tops].sort((a, b) => a - b)[Math.floor(tops.length / 2)];
      previews.forEach((p, i) => { out[p.char] = tops[i] - median; });
    }
    return out;
  }, [session, session?.stats.lastRebuildMs]);

  const filtered = query
    ? grouped.map(g => ({ ...g, chars: g.chars.filter(c => c.includes(query)) })).filter(g => g.chars.length)
    : grouped;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-2 border-b border-neutral-100">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm ký tự"
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-neutral-200 rounded-lg
                       focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map(g => {
          const open = query ? true : openGroup === g.id;
          return (
            <div key={g.id} className="border-b border-neutral-100">
              <button
                onClick={() => setOpenGroup(open ? '' : g.id)}
                className="w-full flex items-center px-3 py-2 text-left hover:bg-neutral-50"
              >
                <span className="text-xs font-medium text-neutral-800">{g.label}</span>
                <span className="ml-auto text-[10px] text-neutral-400">{g.chars.length}</span>
              </button>
              {open ? (
                <div className="grid grid-cols-5 gap-1 px-2 pb-2">
                  {g.chars.map(char => {
                    const dev = deviations[char];
                    const off = dev !== undefined && Math.abs(dev) > 1;
                    const active = char === activeChar;
                    return (
                      <button
                        key={char}
                        onClick={() => onSelectChar(char)}
                        title={off ? `Lệch ${Math.round(dev)} đơn vị so với nhóm` : undefined}
                        className={[
                          'relative aspect-square rounded-md border text-base flex items-center justify-center transition',
                          active
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white border-neutral-200 hover:border-neutral-400 text-neutral-800'
                        ].join(' ')}
                      >
                        {char}
                        {off ? (
                          <span className="absolute -top-1 -right-1 text-[8px] leading-none px-1 py-0.5 rounded bg-amber-400 text-neutral-900 font-mono">
                            {dev > 0 ? '+' : ''}{Math.round(dev)}
                          </span>
                        ) : null}
                        {touched.has(char) && !off ? (
                          <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-500" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="border-t border-neutral-100 px-3 py-2 text-[10px] text-neutral-400">
        Số vàng: lệch đỉnh dấu so với các ký tự cùng dấu, cùng kiểu chữ, cùng tầng.
      </div>
    </div>
  );
};
