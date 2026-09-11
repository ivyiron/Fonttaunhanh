import type { ComponentType } from 'react';

export type ToolId = 'viethoa' | 'editor' | 'kerning';

export interface ToolTab {
  id: string;
  label: string;
  leftWidth?: 'narrow' | 'wide';
  rightWidth?: 'narrow' | 'wide';
  /** Kerning merges its proof into the canvas, so it opts out of the dock. */
  showDock?: boolean;
}

export interface ToolDescriptor {
  id: ToolId;
  label: string;
  tabs: ToolTab[];
  /** Not yet ported. Shown greyed out rather than hidden, so the plan stays visible. */
  available: boolean;
}

// Each tool is a description of which slots the shell fills, not a separate app.
// Switching tools keeps the same font and the same edits.
export const TOOLS: ToolDescriptor[] = [
  {
    id: 'viethoa',
    label: 'Việt hóa tàu nhanh',
    available: true,
    tabs: [
      { id: 'marks', label: 'Dấu', leftWidth: 'narrow', rightWidth: 'wide', showDock: true },
      { id: 'characters', label: 'Chi tiết', leftWidth: 'wide', rightWidth: 'wide', showDock: true }
    ]
  },
  {
    id: 'editor',
    label: 'Sửa font tàu nhanh',
    available: true,
    tabs: [
      { id: 'glyphs', label: 'Ký tự', leftWidth: 'wide', rightWidth: 'wide', showDock: true }
    ]
  },
  {
    id: 'kerning',
    label: 'Kerning tàu nhanh',
    available: true,
    tabs: [
      { id: 'pairs', label: 'Cặp ký tự', leftWidth: 'wide', rightWidth: 'wide', showDock: false }
    ]
  }
];
