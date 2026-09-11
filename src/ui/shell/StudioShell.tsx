import React, { ReactNode } from 'react';

// The layout font-editer already settled on, lifted out so all three tools
// share one shell. The important structural rule: h-screen with overflow only
// inside panels. The page itself never scrolls, so the canvas and the proof
// dock can never scroll away from the control that changes them - which is the
// actual reason the old single-column Việt hóa layout felt cramped.

interface StudioShellProps {
  header: ReactNode;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  /** Proof strip. Hidden entirely by the Kerning tool, which merges it with the canvas. */
  dock?: ReactNode;
  /** Intervention counters, pinned under the canvas. */
  statusBar?: ReactNode;
  leftWidth?: 'narrow' | 'wide';
  rightWidth?: 'narrow' | 'wide';
  dockExpanded?: boolean;
}

const WIDTHS = {
  narrow: 'w-[248px]',
  wide: 'w-[320px]'
} as const;

export const StudioShell: React.FC<StudioShellProps> = ({
  header,
  left,
  center,
  right,
  dock,
  statusBar,
  leftWidth = 'narrow',
  rightWidth = 'wide',
  dockExpanded = true
}) => {
  return (
    <div className="h-screen flex flex-col bg-neutral-50/60 text-neutral-900 font-sans overflow-hidden">
      {header}

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <aside
          className={`${WIDTHS[leftWidth]} shrink-0 border-r border-neutral-200/90 bg-white flex flex-col min-h-0`}
        >
          {left}
        </aside>

        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex-1 min-h-0 overflow-hidden">{center}</div>
          {statusBar ? (
            <div className="shrink-0 border-t border-neutral-200/90 bg-white/80 backdrop-blur-sm">
              {statusBar}
            </div>
          ) : null}
        </main>

        <aside
          className={`${WIDTHS[rightWidth]} shrink-0 border-l border-neutral-200/90 bg-white flex flex-col min-h-0 overflow-y-auto`}
        >
          {right}
        </aside>
      </div>

      {dock ? (
        <div
          className={`shrink-0 border-t border-neutral-200/90 bg-white transition-[height] duration-200 ${
            dockExpanded ? 'h-[220px]' : 'h-[44px]'
          }`}
        >
          {dock}
        </div>
      ) : null}
    </div>
  );
};
