import React from 'react';

/** Vietnamese names of the mark ids used in recipes. */
export const MARK_NAME_VI: Record<string, string> = {
  acute: 'sắc',
  grave: 'huyền',
  hook: 'hỏi',
  tilde: 'ngã',
  dot_below: 'nặng',
  circumflex: 'mũ',
  breve: 'trăng',
  horn: 'móc',
  horn_o: 'móc',
  horn_u: 'móc',
  bar: 'gạch'
};

/** "a + mũ + sắc" for a recipe */
export function recipeNote(baseChar: string, components: string[]): string {
  return [baseChar, ...components.map((c) => MARK_NAME_VI[c] || c)].join(' + ');
}

/** The one title style used at the top of every live view (Thanh dấu, Dấu kép, Ký tự). */
export const StageTitle: React.FC<{ title: string; note?: string }> = ({ title, note }) => (
  <div className="flex items-baseline gap-2 min-w-0">
    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">{title}</span>
    {note && <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{note}</span>}
  </div>
);
