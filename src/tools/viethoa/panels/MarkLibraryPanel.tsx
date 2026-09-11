import React from 'react';
import { Check } from 'lucide-react';
import type { DiacriticTemplate, AutoPositionRules } from '../../../core/session';

const MARK_LABELS: Record<string, string> = {
  acute: 'Sắc',
  grave: 'Huyền',
  hook: 'Hỏi',
  tilde: 'Ngã',
  dot_below: 'Nặng',
  circumflex: 'Mũ â ê ô',
  breve: 'Trăng ă',
  horn_o: 'Sừng ơ',
  horn_u: 'Sừng ư',
  bar: 'Gạch đ'
};

const DOUBLE_GROUPS = [
  { id: 'Â', chars: ['ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'] },
  { id: 'Ă', chars: ['ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'] },
  { id: 'Ê', chars: ['ế', 'ề', 'ể', 'ễ', 'ệ'] },
  { id: 'Ô', chars: ['ố', 'ồ', 'ổ', 'ỗ', 'ộ'] },
  { id: 'Ơ', chars: ['ớ', 'ờ', 'ở', 'ỡ', 'ợ'] },
  { id: 'Ư', chars: ['ứ', 'ừ', 'ử', 'ữ', 'ự'] }
];

interface MarkLibraryPanelProps {
  templates: Record<string, DiacriticTemplate>;
  activeMarkId: string;
  onSelectMark: (id: string) => void;
  rules: AutoPositionRules;
  onUpdateRules: (patch: Partial<AutoPositionRules>) => void;
  /** Characters the user has already touched, for the done marker. */
  touchedMarks: Set<string>;
}

export const MarkLibraryPanel: React.FC<MarkLibraryPanelProps> = ({
  templates, activeMarkId, onSelectMark, rules, onUpdateRules, touchedMarks
}) => {
  const ids = Object.keys(MARK_LABELS).filter(id => templates[id]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2.5 border-b border-neutral-100">
        <p className="text-xs font-medium text-neutral-800">Bộ dấu</p>
        <p className="text-[10px] text-neutral-400 mt-0.5">Chỉnh một lần, áp cho mọi ký tự dùng nó</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {ids.map(id => {
          const active = id === activeMarkId;
          return (
            <button
              key={id}
              onClick={() => onSelectMark(id)}
              className={[
                'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition border',
                active
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-700'
              ].join(' ')}
            >
              <MarkThumb template={templates[id]} inverted={active} />
              <span className="text-xs flex-1">{MARK_LABELS[id]}</span>
              {touchedMarks.has(id) ? (
                <Check className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-emerald-600'}`} />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="border-t border-neutral-100 p-3 space-y-2">
        <p className="text-[11px] font-medium text-neutral-700">Dấu hai tầng</p>
        <div className="flex flex-wrap gap-1">
          {DOUBLE_GROUPS.map(g => (
            <span
              key={g.id}
              title={g.chars.join(' ')}
              className="px-1.5 py-0.5 text-[11px] rounded bg-neutral-100 text-neutral-600"
            >
              {g.id}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 pt-1">
          {(['stacked', 'side', 'custom'] as const).map(style => (
            <button
              key={style}
              onClick={() => onUpdateRules({ doubleAccentStyle: style })}
              className={[
                'flex-1 px-2 py-1 text-[10px] rounded-md border transition',
                rules.doubleAccentStyle === style
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
              ].join(' ')}
            >
              {style === 'stacked' ? 'Xếp chồng' : style === 'side' ? 'Lệch bên' : 'Tùy chỉnh'}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-neutral-400">
          30 ký tự mang hai dấu. Kiểu xếp quyết định cả 30.
        </p>
      </div>
    </div>
  );
};

const MarkThumb: React.FC<{ template?: DiacriticTemplate; inverted: boolean }> = ({ template, inverted }) => {
  if (!template?.svgPath) {
    return <span className="w-6 h-6 rounded bg-neutral-100 shrink-0" />;
  }
  return (
    <span className={`w-6 h-6 rounded shrink-0 flex items-center justify-center ${inverted ? 'bg-white/15' : 'bg-neutral-100'}`}>
      <svg viewBox="-120 -180 240 240" className="w-4 h-4" aria-hidden>
        <path d={template.svgPath} fill={inverted ? '#fff' : '#404040'} transform="scale(1,-1)" />
      </svg>
    </span>
  );
};
