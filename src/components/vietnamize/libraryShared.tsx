import React from 'react';

/** Shared look for the Font list popup: glyph tiles and the detail panel. */

export interface GlyphFrame {
  top: number; // font units, y-up
  bottom: number;
}

/** A glyph drawn from its own outline (font units, y-up) in a square frame centred on the glyph. */
export const GlyphSvg: React.FC<{
  d: string;
  box: { x1: number; x2: number } | null;
  frame: GlyphFrame;
  highlight?: string; // part of the glyph drawn in amber (a mark)
  className?: string;
  children?: (map: { x0: number; size: number; y: (fy: number) => number }) => React.ReactNode;
  svgProps?: React.SVGProps<SVGSVGElement>;
}> = ({ d, box, frame, highlight, className, children, svgProps }) => {
  const size = frame.top - frame.bottom;
  const cx = box ? (box.x1 + box.x2) / 2 : 0;
  const x0 = cx - size / 2;
  const y = (fy: number) => frame.top - fy;
  return (
    <svg viewBox={`${x0} 0 ${size} ${size}`} className={className} {...svgProps}>
      <path d={d} transform={`translate(0 ${frame.top}) scale(1 -1)`} fill="currentColor" />
      {highlight && <path d={highlight} transform={`translate(0 ${frame.top}) scale(1 -1)`} fill="#f59e0b" />}
      {children && children({ x0, size, y })}
    </svg>
  );
};

/** Selectable tile, same in both tabs. */
export const Tile: React.FC<{
  active: boolean;
  onClick: () => void;
  label: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}> = ({ active, onClick, label, badge, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative rounded-xl border text-left transition cursor-pointer overflow-hidden ${
      active
        ? 'border-neutral-900 dark:border-amber-500 bg-white dark:bg-[#262634] shadow-sm'
        : 'border-neutral-200 dark:border-[#323242] bg-white dark:bg-[#20202a] hover:border-neutral-400 dark:hover:border-[#4a4a5e]'
    }`}
  >
    <div className="text-neutral-900 dark:text-neutral-100">{children}</div>
    <div className="flex items-center justify-between px-2 pb-1.5 -mt-1">
      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">{label}</span>
      {badge}
    </div>
  </button>
);

/** Right-hand detail panel shell. */
export const DetailPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <aside className="w-72 shrink-0 border-l border-neutral-200 dark:border-[#323242] bg-white dark:bg-[#1b1b24] flex flex-col overflow-y-auto">
    {children}
  </aside>
);

/** Small labelled section inside the detail panel, like the studio's property cards. */
export const PanelCard: React.FC<{ title?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }> = ({ title, right, children }) => (
  <div className="bg-neutral-50 dark:bg-[#22222e] border border-neutral-200/80 dark:border-[#353545] rounded-xl p-3 space-y-2">
    {(title || right) && (
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold text-neutral-800 dark:text-neutral-100">{title}</span>
        {right}
      </div>
    )}
    {children}
  </div>
);
