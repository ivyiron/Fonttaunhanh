import React from 'react';
import type { DiacriticTemplate, AutoPositionRules } from '../../../core/session';
import { NumericInput } from '../../../ui/inspector/NumericInput';
import { Section, Field } from '../../../ui/inspector/Section';
import { SvgPasteCard } from '../../../ui/inspector/SvgPasteCard';
import { Library } from 'lucide-react';

// Only the controls that apply to the selected mark are rendered. Showing the
// horn sliders while the acute is selected is most of what made the old panel
// feel overwhelming - there was nothing wrong with the controls themselves.

const AFFECTS: Record<string, string[]> = {
  horn_o: ['hornScale', 'hornOffsetX', 'hornOffsetY'],
  horn_u: ['hornScale', 'hornOffsetX', 'hornOffsetY'],
  bar: ['barScale', 'barOffsetX', 'barOffsetY'],
  dot_below: ['dotBelowGap', 'dotBelowScale']
};
const ABOVE_MARKS = ['acute', 'grave', 'hook', 'tilde', 'circumflex', 'breve'];

interface MarkInspectorProps {
  markId: string;
  template: DiacriticTemplate;
  rules: AutoPositionRules;
  isUppercase: boolean;
  stemWidth?: number;
  onUpdateTemplate: (id: string, patch: Partial<DiacriticTemplate>) => void;
  onUpdateRules: (patch: Partial<AutoPositionRules>) => void;
  onSetUppercase: (v: boolean) => void;
  onOpenLibrary: () => void;
}

export const MarkInspector: React.FC<MarkInspectorProps> = ({
  markId, template, rules, isUppercase, stemWidth,
  onUpdateTemplate, onUpdateRules, onSetUppercase, onOpenLibrary
}) => {
  const set = (patch: Partial<DiacriticTemplate>) => onUpdateTemplate(markId, patch);
  const ruleKeys = AFFECTS[markId] ?? (ABOVE_MARKS.includes(markId)
    ? (isUppercase ? ['uppercaseAccentGap', 'uppercaseAccentScale'] : ['lowercaseAccentGap', 'lowercaseAccentScale'])
    : []);

  return (
    <div className="flex flex-col min-h-0">
      <div className="px-3 py-2.5 border-b border-neutral-100 flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-800 flex-1">{template.name || markId}</span>
        <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-md">
          {[false, true].map(upper => (
            <button
              key={String(upper)}
              onClick={() => onSetUppercase(upper)}
              className={`px-2 py-0.5 text-[10px] rounded ${isUppercase === upper ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500'}`}
            >
              {upper ? 'HOA' : 'thường'}
            </button>
          ))}
        </div>
      </div>

      <Section title="Hình dạng" defaultOpen>
        <SvgPasteCard
          value={template.svgPath}
          stemWidth={stemWidth}
          onChange={d => set({ svgPath: d })}
          label="Thay hình dấu"
        />
        <button
          onClick={onOpenLibrary}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px]
                     rounded-lg border border-neutral-200 bg-white text-neutral-700
                     hover:border-neutral-400 transition"
        >
          <Library className="w-3.5 h-3.5" />
          Trích dấu từ ký tự có sẵn
        </button>
        <p className="text-[10px] text-neutral-400">
          Dấu lấy ra từ chính font luôn hợp với typeface hơn là mẫu chung phóng to.
        </p>
      </Section>

      <Section title="Kích thước và vị trí" defaultOpen>
        <Field label="Phóng ngang">
          <NumericInput size="sm" step={0.01} value={template.scaleX} onChange={v => set({ scaleX: v })} />
        </Field>
        <Field label="Phóng dọc">
          <NumericInput size="sm" step={0.01} value={template.scaleY} onChange={v => set({ scaleY: v })} />
        </Field>
        <Field label="Dịch ngang" hint="Đơn vị font">
          <NumericInput size="sm" value={template.offsetX} onChange={v => set({ offsetX: v })} unit="u" />
        </Field>
        <Field label="Dịch dọc" hint="Đơn vị font">
          <NumericInput size="sm" value={template.offsetY} onChange={v => set({ offsetY: v })} unit="u" />
        </Field>
      </Section>

      {ruleKeys.length > 0 ? (
        <Section title="Quy tắc đặt dấu" subtitle={`${ruleKeys.length} mục`} defaultOpen>
          {ruleKeys.map(key => (
            <Field key={key} label={RULE_LABELS[key] ?? key}>
              <NumericInput
                size="sm"
                step={key.includes('Scale') ? 0.01 : 1}
                value={(rules as any)[key] ?? 0}
                onChange={v => onUpdateRules({ [key]: v } as Partial<AutoPositionRules>)}
              />
            </Field>
          ))}
        </Section>
      ) : null}

      <Section title="Nâng cao" advanced>
        <Field label="Căn đỉnh dấu theo nhóm" hint="Giữ á é í ó ú ý cùng một đường">
          <input
            type="checkbox"
            checked={rules.useGroupHeightAlignment !== false}
            onChange={e => onUpdateRules({ useGroupHeightAlignment: e.target.checked })}
            className="w-3.5 h-3.5 accent-neutral-900"
          />
        </Field>
        <Field label="Tự căn giữa ngang">
          <input
            type="checkbox"
            checked={template.autoCenterX !== false}
            onChange={e => set({ autoCenterX: e.target.checked })}
            className="w-3.5 h-3.5 accent-neutral-900"
          />
        </Field>
        <Field label="Khoảng cách dấu hai tầng">
          <NumericInput size="sm" value={rules.doubleAccentGap} onChange={v => onUpdateRules({ doubleAccentGap: v })} unit="u" />
        </Field>
        {rules.doubleAccentStyle === 'custom' ? (
          <>
            <Field label="Lệch X dấu trên">
              <NumericInput size="sm" value={rules.doubleAccentCustomX ?? 0} onChange={v => onUpdateRules({ doubleAccentCustomX: v })} unit="u" />
            </Field>
            <Field label="Lệch Y dấu trên">
              <NumericInput size="sm" value={rules.doubleAccentCustomY ?? 0} onChange={v => onUpdateRules({ doubleAccentCustomY: v })} unit="u" />
            </Field>
          </>
        ) : null}
      </Section>
    </div>
  );
};

const RULE_LABELS: Record<string, string> = {
  lowercaseAccentGap: 'Hở trên chữ thường',
  lowercaseAccentScale: 'Cỡ dấu chữ thường',
  uppercaseAccentGap: 'Hở trên chữ hoa',
  uppercaseAccentScale: 'Cỡ dấu chữ hoa',
  dotBelowGap: 'Hở dưới baseline',
  dotBelowScale: 'Cỡ dấu nặng',
  hornScale: 'Cỡ sừng',
  hornOffsetX: 'Sừng lệch ngang',
  hornOffsetY: 'Sừng lệch dọc',
  barScale: 'Cỡ gạch',
  barOffsetX: 'Gạch lệch ngang',
  barOffsetY: 'Gạch lệch dọc'
};
