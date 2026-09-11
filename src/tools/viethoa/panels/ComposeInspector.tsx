import React from 'react';
import { RotateCcw, Check } from 'lucide-react';
import type { GlyphOverrideState } from '../../../core/session';
import { NumericInput } from '../../../ui/inspector/NumericInput';
import { Section, Field } from '../../../ui/inspector/Section';

// Per-character corrections. Arrow keys nudge by 1 unit and Shift by 10, because
// the real work here is moving an accent two or three units with certainty, not
// dragging it approximately.

interface ComposeInspectorProps {
  char: string;
  componentCount: number;
  override: GlyphOverrideState | undefined;
  onUpdate: (char: string, patch: Partial<GlyphOverrideState>) => void;
  onReset: (char: string) => void;
  onMarkDone: (char: string) => void;
}

const blank = (char: string): GlyphOverrideState => ({
  char, offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1,
  advanceWidthTweak: 0, isCompleted: false
});

export const ComposeInspector: React.FC<ComposeInspectorProps> = ({
  char, componentCount, override, onUpdate, onReset, onMarkDone
}) => {
  const o = override ?? blank(char);
  const set = (patch: Partial<GlyphOverrideState>) => onUpdate(char, patch);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowUp') { set({ offsetY: o.offsetY + step }); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { set({ offsetY: o.offsetY - step }); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { set({ offsetX: o.offsetX - step }); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { set({ offsetX: o.offsetX + step }); e.preventDefault(); }
  };

  return (
    <div className="flex flex-col min-h-0 outline-none" tabIndex={0} onKeyDown={onKeyDown}>
      <div className="px-3 py-2.5 border-b border-neutral-100 flex items-center gap-2">
        <span className="text-2xl leading-none">{char}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-neutral-600">
            {componentCount === 2 ? 'Hai dấu' : componentCount === 1 ? 'Một dấu' : 'Chữ nền'}
          </p>
          <p className="text-[10px] text-neutral-400">Phím mũi tên nhích 1, Shift nhích 10</p>
        </div>
        <button
          onClick={() => onReset(char)}
          title="Về mặc định"
          className="p-1.5 text-neutral-400 hover:text-neutral-800 rounded-md hover:bg-neutral-100"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <Section title="Căn chỉnh dấu" defaultOpen>
        <Field label="Dịch ngang">
          <NumericInput size="sm" value={o.offsetX} onChange={v => set({ offsetX: v })} unit="u" />
        </Field>
        <Field label="Dịch dọc">
          <NumericInput size="sm" value={o.offsetY} onChange={v => set({ offsetY: v })} unit="u" />
        </Field>
        <Field label="Bù advance" hint="Chỉ ký tự này">
          <NumericInput size="sm" value={o.advanceWidthTweak} onChange={v => set({ advanceWidthTweak: v })} unit="u" />
        </Field>
      </Section>

      <Section title="Nâng cao" advanced>
        <Field label="Phóng ngang">
          <NumericInput size="sm" step={0.01} value={o.scaleX} onChange={v => set({ scaleX: v })} />
        </Field>
        <Field label="Phóng dọc">
          <NumericInput size="sm" step={0.01} value={o.scaleY} onChange={v => set({ scaleY: v })} />
        </Field>
        {componentCount === 2 ? (
          <>
            <Field label="Dấu dưới lệch X">
              <NumericInput size="sm" value={o.comp1OffsetX ?? 0} onChange={v => set({ comp1OffsetX: v })} unit="u" />
            </Field>
            <Field label="Dấu dưới lệch Y">
              <NumericInput size="sm" value={o.comp1OffsetY ?? 0} onChange={v => set({ comp1OffsetY: v })} unit="u" />
            </Field>
            <Field label="Dấu trên lệch X">
              <NumericInput size="sm" value={o.comp2OffsetX ?? 0} onChange={v => set({ comp2OffsetX: v })} unit="u" />
            </Field>
            <Field label="Dấu trên lệch Y">
              <NumericInput size="sm" value={o.comp2OffsetY ?? 0} onChange={v => set({ comp2OffsetY: v })} unit="u" />
            </Field>
          </>
        ) : null}
      </Section>

      <div className="p-3 border-t border-neutral-100">
        <button
          onClick={() => onMarkDone(char)}
          className={[
            'w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg transition',
            o.isCompleted
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          ].join(' ')}
        >
          <Check className="w-3.5 h-3.5" />
          {o.isCompleted ? 'Đã duyệt' : 'Đánh dấu đã duyệt'}
        </button>
      </div>
    </div>
  );
};
