import React, { useMemo } from 'react';
import * as opentype from 'opentype.js';
import { Layers, Sparkles, SlidersHorizontal, Info, CheckCircle2, RotateCcw } from 'lucide-react';
import { AutoPositionRules, GlyphOverrideState, DiacriticTemplate, StackMatrix, StackRule, StackMod, StackTone } from '../../types';
import { NumericInput } from '../NumericInput';
import {
  composeGlyphPath,
  getStackMatrix,
  getStackCell,
  STACK_PRESETS,
  STACK_TONES,
  VIETNAMESE_RECIPES
} from '../../utils';

const MOD_LABEL: Record<StackMod, string> = { circumflex: 'Mũ', breve: 'Trăng' };
const TONE_LABEL: Record<StackTone, string> = { acute: 'sắc', grave: 'huyền', hook: 'hỏi', tilde: 'ngã' };
const CELL_TARGETS: Record<StackMod, string> = { circumflex: 'â ê ô', breve: 'ă' };

const SLIDER = 'w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200';
const segBtn = (active: boolean) =>
  `py-1.5 text-xs font-bold rounded-md transition text-center cursor-pointer ${
    active ? 'bg-neutral-900 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
  }`;

/** a labelled slider + numeric box, in the same white tile the rest of the panel uses */
const RuleSlider: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}> = ({ label, value, onChange, min, max, step, unit }) => (
  <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
    <div className="flex justify-between items-center text-neutral-700 font-bold text-[10px]">
      <span>{label}</span>
      <NumericInput size="sm" value={value} onChange={onChange} step={step} min={min} max={max} unit={unit} />
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={SLIDER}
    />
  </div>
);

interface DoubleAccentPropertiesProps {
  font?: opentype.Font | null;
  templates?: Record<string, DiacriticTemplate>;
  onSelectChar?: (char: string) => void;
  doubleView?: 'group' | 'single'; // group: editing a rule-table cell; single: one letter
  rules: AutoPositionRules;
  onUpdateRules: (updates: Partial<AutoPositionRules>) => void;
  selectedChar: string;
  override?: GlyphOverrideState;
  onUpdateOverride: (char: string, updates: Partial<GlyphOverrideState>) => void;
  onResetOverride: (char: string) => void;
}

export const DoubleAccentProperties: React.FC<DoubleAccentPropertiesProps> = ({
  font,
  templates,
  doubleView = 'single',
  rules,
  onUpdateRules,
  selectedChar,
  override,
  onUpdateOverride,
  onResetOverride
}) => {
  const isCustomForChar = !!override?.hasCustomDoubleAccent;
  const isCompleted = !!override?.isCompleted;
  const currentCustomX = override?.doubleAccentCustomX ?? 0;

  // ---- rule table ----
  const matrix = getStackMatrix(rules);
  const cell = getStackCell(selectedChar);
  const editUpper = !!cell?.isCapital && matrix.capsSeparate;
  const tableKey: 'lower' | 'upper' = editUpper ? 'upper' : 'lower';
  const rule: StackRule | null = cell ? matrix[tableKey][cell.mod][cell.tone] : null;

  const stackInfo = useMemo(() => {
    if (!font || !templates || !cell) return undefined;
    const recipe = VIETNAMESE_RECIPES.find((r) => r.char === selectedChar);
    if (!recipe) return undefined;
    try {
      return composeGlyphPath(font, recipe, templates, rules, override, false).stackInfo;
    } catch {
      return undefined;
    }
  }, [font, templates, rules, override, selectedChar, cell]);

  const updateMatrix = (patch: Partial<StackMatrix>) => onUpdateRules({ stackMatrix: { ...matrix, ...patch } });

  const updateRule = (patch: Partial<StackRule>) => {
    if (!cell) return;
    const table = JSON.parse(JSON.stringify(matrix[tableKey]));
    table[cell.mod][cell.tone] = { ...table[cell.mod][cell.tone], ...patch };
    updateMatrix({ [tableKey]: table, preset: 'custom' } as Partial<StackMatrix>);
  };

  const applyRuleToRow = () => {
    if (!cell || !rule) return;
    const table = JSON.parse(JSON.stringify(matrix[tableKey]));
    STACK_TONES.forEach((t) => {
      // a tilde beside a circumflex is never right: it only follows rules that sit on top
      if (t === 'tilde' && rule.pos !== 'top') return;
      table[cell.mod][t] = { ...rule };
    });
    updateMatrix({ [tableKey]: table, preset: 'custom' } as Partial<StackMatrix>);
  };

  const resetRule = () => {
    if (!cell) return;
    const source = STACK_PRESETS[matrix.preset === 'custom' ? 'stack' : matrix.preset];
    updateRule({ ...source[cell.mod][cell.tone] });
  };

  // ---- per-letter nudge ("Chỉnh riêng cho ký tự này") ----
  const handleToggleCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onUpdateOverride(selectedChar, {
        hasCustomDoubleAccent: true,
        doubleAccentCustomX: override?.doubleAccentCustomX ?? 0,
        doubleAccentCustomY: override?.doubleAccentCustomY ?? 0,
        isCompleted: false
      });
    } else {
      onUpdateOverride(selectedChar, { hasCustomDoubleAccent: false, isCompleted: false });
    }
  };
  const handleToggleApprove = () => onUpdateOverride(selectedChar, { isCompleted: !isCompleted });
  const handleCustomXChange = (val: number) =>
    onUpdateOverride(selectedChar, { hasCustomDoubleAccent: true, doubleAccentCustomX: val });
  const handleMatrixNudgeY = (val: number) =>
    onUpdateOverride(selectedChar, { hasCustomDoubleAccent: true, doubleAccentCustomY: val });

  return (
    <div className="flex flex-col space-y-2.5 pb-20 text-neutral-900">
      {doubleView !== 'group' && (
        <>
      {/* 1. Character Scope & Toggle Card */}
      <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-neutral-900 text-white font-bold font-mono flex items-center justify-center text-sm shadow-2xs">
              {selectedChar}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-900">Ký tự: {selectedChar}</span>
                {isCustomForChar ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-900">
                    Tinh chỉnh
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600">
                    Tạo tự động
                  </span>
                )}
              </div>
              <span className="text-[10.5px] text-neutral-500 block">
                {isCustomForChar
                  ? 'Thanh của ký tự này được nhích riêng'
                  : 'Đang dùng bảng quy tắc dấu kép'}
              </span>
            </div>
          </div>

          {/* Action buttons: Duyệt & Reset (Hiện khi chỉnh riêng) */}
          {isCustomForChar && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleApprove}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50'
                }`}
                title={isCompleted ? 'Hủy duyệt ký tự này' : 'Duyệt xác nhận ký tự này'}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isCompleted ? 'Đã duyệt' : 'Duyệt'}</span>
              </button>

              <button
                type="button"
                onClick={() => onResetOverride(selectedChar)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                title="Đặt lại thông số ký tự này về tự động"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Toggle "Chỉnh riêng cho ký tự này" */}
        {cell && (
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
          <label className="flex items-center justify-between w-full cursor-pointer select-none">
            <span className="text-xs font-bold text-neutral-800">
              Chỉnh riêng cho ký tự này
            </span>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={isCustomForChar}
                onChange={handleToggleCustom}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
            </div>
          </label>
        </div>
        )}
      </div>

      {/* 2. Notification banner when customizing individual char */}
      {isCustomForChar && (
        <div className="p-2 bg-amber-50/80 border border-amber-200/90 rounded-lg text-[11px] text-amber-900 flex items-center justify-between">
          <span>
            Đang tùy chỉnh vị trí dấu cho <strong className="font-mono font-bold text-amber-950">'{selectedChar}'</strong>
          </span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Đã duyệt
            </span>
          )}
        </div>
      )}

        </>
      )}

          {cell && rule ? (
            <>
              {/* Rule of the selected pair */}
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                  <span className="font-bold text-neutral-900 text-[11px]">
                    {MOD_LABEL[cell.mod]} + {TONE_LABEL[cell.tone]}
                    <span className="ml-1.5 font-medium text-neutral-500">
                      {editUpper ? 'chữ HOA' : matrix.capsSeparate ? 'chữ thường' : 'áp cho cả hoa và thường'} · {CELL_TARGETS[cell.mod]}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={resetRule}
                    className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                  >
                    Đặt lại
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-700">Vị trí</span>
                    <div className={`grid ${cell.mod === 'breve' ? 'grid-cols-3' : 'grid-cols-2'} gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200`}>
                      <button type="button" onClick={() => updateRule({ pos: 'top' })} className={segBtn(rule.pos === 'top')}>Trên</button>
                      <button type="button" onClick={() => updateRule({ pos: 'side' })} className={segBtn(rule.pos === 'side')}>Cạnh</button>
                      {cell.mod === 'breve' && (
                        <button type="button" onClick={() => updateRule({ pos: 'nest' })} className={segBtn(rule.pos === 'nest')} title="Thanh lọt vào lòng dấu trăng">Lọt lòng</button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-700">Neo</span>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200">
                      <button type="button" onClick={() => updateRule({ anchor: 'center' })} className={segBtn(rule.anchor === 'center')}>Tâm khối</button>
                      <button type="button" onClick={() => updateRule({ anchor: 'foot' })} className={segBtn(rule.anchor === 'foot')} title="Căn chân dấu (điểm thấp nhất) vào vị trí">Chân dấu</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <RuleSlider label="Lệch ngang" value={rule.dx} onChange={(v) => updateRule({ dx: v })} min={-80} max={80} step={1} unit="%" />
                  {rule.pos === 'top' ? (
                    <RuleSlider label="Khoảng hở" value={rule.gap} onChange={(v) => updateRule({ gap: v })} min={0} max={3} step={0.05} unit="× nét" />
                  ) : (
                    <RuleSlider label="Độ cao chân" value={rule.rise} onChange={(v) => updateRule({ rise: v })} min={0} max={140} step={1} unit="%" />
                  )}
                  <RuleSlider label="Tỉ lệ thanh" value={rule.scale} onChange={(v) => updateRule({ scale: v })} min={55} max={110} step={1} unit="%" />
                  <div className="bg-white p-2 rounded-lg border border-neutral-200/70 flex flex-col justify-center">
                    <button
                      type="button"
                      onClick={applyRuleToRow}
                      className="w-full py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 font-bold rounded-lg text-center transition cursor-pointer text-[11px] shadow-2xs"
                    >
                      Áp cho cả hàng {MOD_LABEL[cell.mod].toLowerCase()}
                    </button>
                  </div>
                </div>

                {stackInfo && (
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-white p-2 rounded-lg border border-neutral-200/70">
                      <span className="text-neutral-500 block">Hở nhỏ nhất</span>
                      <span
                        className={`font-mono font-bold ${
                          stackInfo.clearance < 0.25 * stackInfo.toneStroke
                            ? 'text-red-600'
                            : stackInfo.clearance < matrix.minClear * stackInfo.toneStroke - 0.5
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                        }`}
                      >
                        {stackInfo.clearance < 0 ? 'chạm' : `${Math.round(stackInfo.clearance)} · ${(stackInfo.clearance / stackInfo.toneStroke).toFixed(2)}×`}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-neutral-200/70">
                      <span className="text-neutral-500 block">Tự nâng</span>
                      <span className="font-mono font-bold text-neutral-900">{matrix.autoClear ? `+${Math.round(stackInfo.lift)}` : 'tắt'}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-neutral-200/70">
                      <span className="text-neutral-500 block">Đỉnh cụm dấu</span>
                      <span className="font-mono font-bold text-neutral-900">{Math.round(stackInfo.top)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Squeeze with weight kept */}
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                  <span className="font-bold text-neutral-900 text-[11px]">Nén dấu kép</span>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={matrix.keepWeight}
                      onChange={(e) => updateMatrix({ keepWeight: e.target.checked })}
                      className="w-3.5 h-3.5 accent-neutral-900 rounded cursor-pointer"
                    />
                    <span>Bù nét về độ đậm gốc</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <RuleSlider label="Mũ/trăng thường" value={matrix.squeezeLowerMod} onChange={(v) => updateMatrix({ squeezeLowerMod: v })} min={60} max={100} step={1} unit="%" />
                  <RuleSlider label="Mũ/trăng HOA" value={matrix.squeezeUpperMod} onChange={(v) => updateMatrix({ squeezeUpperMod: v })} min={60} max={100} step={1} unit="%" />
                  <RuleSlider label="Thanh" value={matrix.squeezeTone} onChange={(v) => updateMatrix({ squeezeTone: v })} min={60} max={100} step={1} unit="%" />
                  {stackInfo && (
                    <div className="bg-white p-2 rounded-lg border border-neutral-200/70 text-[10px]">
                      <span className="text-neutral-500 block">Nét mũ / trăng</span>
                      <span className="font-mono font-bold text-neutral-900">
                        {Math.round(stackInfo.modWeight[0])} → {Math.round(stackInfo.modWeight[1])}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Clearance & capitals */}
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 space-y-2.5 text-xs">
                <label className="flex items-center justify-between w-full cursor-pointer select-none">
                  <span className="font-bold text-neutral-900 text-[11px]">Tự tránh chạm</span>
                  <div className="relative inline-flex items-center shrink-0">
                    <input type="checkbox" checked={matrix.autoClear} onChange={(e) => updateMatrix({ autoClear: e.target.checked })} className="sr-only peer" />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                  </div>
                </label>
                {matrix.autoClear && (
                  <RuleSlider label="Hở tối thiểu" value={matrix.minClear} onChange={(v) => updateMatrix({ minClear: v })} min={0.2} max={1.6} step={0.05} unit="× nét" />
                )}
                <label className="flex items-center justify-between w-full cursor-pointer select-none pt-2 border-t border-neutral-200">
                  <span className="font-bold text-neutral-900 text-[11px]">Bảng riêng cho chữ Hoa</span>
                  <div className="relative inline-flex items-center shrink-0">
                    <input
                      type="checkbox"
                      checked={matrix.capsSeparate}
                      onChange={(e) =>
                        updateMatrix(
                          e.target.checked
                            ? { capsSeparate: true, upper: JSON.parse(JSON.stringify(matrix.lower)) }
                            : { capsSeparate: false }
                        )
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                  </div>
                </label>
              </div>

              {/* Per-character nudge on top of the table */}
              {isCustomForChar && doubleView !== 'group' && (
                <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 space-y-2.5 text-xs">
                  <span className="font-bold text-neutral-900 text-[11px] block border-b border-neutral-200 pb-1.5">
                    Nhích riêng thanh của '{selectedChar}'
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <RuleSlider label="Ngang (X)" value={currentCustomX} onChange={handleCustomXChange} min={-300} max={300} step={5} unit="UPM" />
                    <RuleSlider
                      label="Dọc (Y)"
                      value={override?.doubleAccentCustomY ?? 0}
                      onChange={handleMatrixNudgeY}
                      min={-300}
                      max={300}
                      step={5}
                      unit="UPM"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 leading-relaxed">
              '{selectedChar}' không thuộc bảng quy tắc: chữ có râu (ơ ư) và dấu nặng dùng vị trí dấu đơn.
            </div>
          )}

      {/* Typographic guidance note */}
      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Info className="w-3.5 h-3.5 text-amber-700" />
          <span>Lưu ý: Bộ dấu móc (ơ Ơ, ư Ư) sẽ lấy dấu chuẩn theo cách bỏ dấu đơn:</span>
        </div>
      </div>
    </div>
  );
};
