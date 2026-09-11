import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import type { AutoSpacingRules, AutoKerningSettings } from '../../../core/session';
import type { InterventionLevel, KerningPlan } from '../../../core/index';
import { LEVEL_INFO } from '../../../core/index';
import { NumericInput } from '../../../ui/inspector/NumericInput';
import { Section, Field } from '../../../ui/inspector/Section';

interface KerningInspectorProps {
  level: InterventionLevel;
  onSetLevel: (level: InterventionLevel) => void;
  plan: KerningPlan | null;
  settings: AutoKerningSettings;
  onUpdateSettings: (patch: Partial<AutoKerningSettings>) => void;
  spacing: AutoSpacingRules;
  onUpdateSpacing: (patch: Partial<AutoSpacingRules>) => void;
}

export const KerningInspector: React.FC<KerningInspectorProps> = ({
  level, onSetLevel, plan, settings, onUpdateSettings, spacing, onUpdateSpacing
}) => {
  const report = plan?.report;

  return (
    <div className="flex flex-col min-h-0">
      <div className="px-3 py-2.5 border-b border-neutral-100">
        <p className="text-xs font-medium text-neutral-800">Mức can thiệp</p>
        <p className="text-[10px] text-neutral-400 mt-0.5">
          Quyết định app được phép sửa bao nhiêu dữ liệu gốc
        </p>
      </div>

      <div className="p-2 space-y-1 border-b border-neutral-100">
        {([0, 1, 2, 3] as InterventionLevel[]).map(l => {
          const active = l === level;
          const risky = l === 3;
          return (
            <button
              key={l}
              onClick={() => onSetLevel(l)}
              className={[
                'w-full text-left px-2.5 py-2 rounded-lg border transition',
                active
                  ? risky
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-neutral-900 border-neutral-900 text-white'
                  : 'bg-white border-neutral-200 hover:border-neutral-300'
              ].join(' ')}
            >
              <div className="flex items-center gap-1.5">
                {risky
                  ? <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-amber-700' : 'text-amber-500'}`} />
                  : <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-emerald-600'}`} />}
                <span className={`text-xs font-medium ${active && risky ? 'text-amber-900' : ''}`}>
                  {l}. {LEVEL_INFO[l].name}
                </span>
                {l === 1 && !active ? (
                  <span className="ml-auto text-[9px] text-neutral-400">mặc định</span>
                ) : null}
              </div>
              <p className={[
                'text-[10px] mt-0.5 leading-snug',
                active ? (risky ? 'text-amber-800' : 'text-neutral-300') : 'text-neutral-500'
              ].join(' ')}>
                {LEVEL_INFO[l].detail}
              </p>
            </button>
          );
        })}
      </div>

      {report ? (
        <div className="px-3 py-2.5 border-b border-neutral-100 space-y-1">
          <Line label="Giữ nguyên cặp gốc" value={report.originalPairsKept} />
          <Line label="Thêm cho glyph mới" value={report.pairsAddedForNewGlyphs} />
          {report.pairsRebuilt > 0 ? <Line label="Cặp dựng lại" value={report.pairsRebuilt} /> : null}
          <Line label="Ghi đè cặp gốc" value={report.originalPairsOverwritten} warn />
          {report.collisionsFound > 0 ? (
            <Line label="Cặp chạm đã duyệt" value={`${report.collisionsFixed}/${report.collisionsFound}`} warn />
          ) : null}
        </div>
      ) : null}

      <Section title="Cường độ tự động" defaultOpen>
        <Field label="Hệ số nhân" hint="1.0 = giữ nguyên giá trị đo được">
          <NumericInput size="sm" step={0.05} value={settings.intensityMultiplier}
                        onChange={v => onUpdateSettings({ intensityMultiplier: v })} />
        </Field>
        <Field label="Ngưỡng tối thiểu" hint="Bỏ qua chỉnh nhỏ hơn giá trị này">
          <NumericInput size="sm" value={settings.minThreshold}
                        onChange={v => onUpdateSettings({ minThreshold: v })} unit="u" />
        </Field>
      </Section>

      <Section title="Phạm vi áp dụng" advanced>
        {([
          ['applyClassics', 'Cặp kinh điển (AV, To…)'],
          ['applyUpperLower', 'Hoa + thường'],
          ['applyVietnameseVariants', 'Biến thể tiếng Việt'],
          ['applyPunctuation', 'Dấu câu'],
          ['applyNumbers', 'Chữ số']
        ] as [keyof AutoKerningSettings, string][]).map(([key, label]) => (
          <Field key={String(key)} label={label}>
            <input
              type="checkbox"
              checked={Boolean(settings[key])}
              onChange={e => onUpdateSettings({ [key]: e.target.checked } as Partial<AutoKerningSettings>)}
              className="w-3.5 h-3.5 accent-neutral-900"
            />
          </Field>
        ))}
      </Section>

      <Section title="Spacing toàn font" advanced>
        <p className="text-[10px] text-amber-700 leading-snug">
          Spacing đổi advance của mọi glyph, kể cả những chữ font gốc vốn làm đúng.
          Đây là thao tác xâm phạm nhất trong app, nên mặc định tắt.
        </p>
        <Field label="Bù tracking chung">
          <NumericInput size="sm" value={spacing.globalTrackingOffset}
                        onChange={v => onUpdateSpacing({ globalTrackingOffset: v })} unit="u" />
        </Field>
        <Field label="Siết chữ tròn" hint="Phần trăm">
          <NumericInput size="sm" value={spacing.curveTighteningPercent}
                        onChange={v => onUpdateSpacing({ curveTighteningPercent: v })} unit="%" />
        </Field>
        <Field label="Áp cho chữ Latin">
          <input type="checkbox" checked={spacing.applyToLatin}
                 onChange={e => onUpdateSpacing({ applyToLatin: e.target.checked })}
                 className="w-3.5 h-3.5 accent-neutral-900" />
        </Field>
        <Field label="Áp cho chữ tiếng Việt">
          <input type="checkbox" checked={spacing.applyToVietnamese}
                 onChange={e => onUpdateSpacing({ applyToVietnamese: e.target.checked })}
                 className="w-3.5 h-3.5 accent-neutral-900" />
        </Field>
      </Section>
    </div>
  );
};

const Line: React.FC<{ label: string; value: number | string; warn?: boolean }> = ({ label, value, warn }) => {
  const isZero = value === 0 || value === '0';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-neutral-500 flex-1">{label}</span>
      <span className={[
        'text-[11px] font-mono',
        warn && !isZero ? 'text-amber-700 font-medium' : 'text-neutral-800'
      ].join(' ')}>
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </span>
    </div>
  );
};
