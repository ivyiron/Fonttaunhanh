import React from 'react';
import { Layers, Sparkles, SlidersHorizontal, Info, CheckCircle2, RotateCcw } from 'lucide-react';
import { AutoPositionRules, GlyphOverrideState } from '../../types';
import { NumericInput } from '../NumericInput';

interface DoubleAccentPropertiesProps {
  rules: AutoPositionRules;
  onUpdateRules: (updates: Partial<AutoPositionRules>) => void;
  selectedChar: string;
  override?: GlyphOverrideState;
  onUpdateOverride: (char: string, updates: Partial<GlyphOverrideState>) => void;
  onResetOverride: (char: string) => void;
}

export const DoubleAccentProperties: React.FC<DoubleAccentPropertiesProps> = ({
  rules,
  onUpdateRules,
  selectedChar,
  override,
  onUpdateOverride,
  onResetOverride
}) => {
  const isCustomForChar = !!override?.hasCustomDoubleAccent;
  const isCompleted = !!override?.isCompleted;

  const currentStyle = isCustomForChar
    ? (override?.doubleAccentStyle ?? rules.doubleAccentStyle)
    : rules.doubleAccentStyle;

  const currentCustomX = isCustomForChar
    ? (override?.doubleAccentCustomX ?? rules.doubleAccentCustomX ?? 0)
    : (rules.doubleAccentCustomX ?? 0);

  const currentGap = isCustomForChar
    ? (override?.doubleAccentGap ?? rules.doubleAccentGap)
    : rules.doubleAccentGap;

  const currentCapCustomEnabled = isCustomForChar
    ? (override?.doubleAccentCapCustomEnabled ?? rules.doubleAccentCapCustomEnabled ?? false)
    : (rules.doubleAccentCapCustomEnabled ?? false);

  const currentCapCustomX = isCustomForChar
    ? (override?.doubleAccentCapCustomX ?? rules.doubleAccentCapCustomX ?? 0)
    : (rules.doubleAccentCapCustomX ?? 0);

  const currentCapCustomY = isCustomForChar
    ? (override?.doubleAccentCapCustomY ?? rules.doubleAccentCapCustomY ?? rules.doubleAccentGap)
    : (rules.doubleAccentCapCustomY ?? rules.doubleAccentGap);

  const currentCapCompressY = isCustomForChar
    ? (override?.doubleAccentCapCompressY ?? rules.doubleAccentCapCompressY ?? 100)
    : (rules.doubleAccentCapCompressY ?? 100);

  const handleToggleCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const willBeCustom = e.target.checked;
    if (willBeCustom) {
      onUpdateOverride(selectedChar, {
        hasCustomDoubleAccent: true,
        doubleAccentStyle: override?.doubleAccentStyle ?? rules.doubleAccentStyle,
        doubleAccentGap: override?.doubleAccentGap ?? rules.doubleAccentGap,
        doubleAccentCustomX: override?.doubleAccentCustomX ?? (rules.doubleAccentCustomX ?? 0),
        doubleAccentCustomY: 0,
        doubleAccentCapCustomEnabled: override?.doubleAccentCapCustomEnabled ?? rules.doubleAccentCapCustomEnabled ?? false,
        doubleAccentCapCustomX: override?.doubleAccentCapCustomX ?? (rules.doubleAccentCapCustomX ?? 0),
        doubleAccentCapCustomY: override?.doubleAccentCapCustomY ?? rules.doubleAccentGap,
        doubleAccentCapCompressY: override?.doubleAccentCapCompressY ?? (rules.doubleAccentCapCompressY ?? 100),
        isCompleted: false
      });
    } else {
      onUpdateOverride(selectedChar, {
        hasCustomDoubleAccent: false,
        isCompleted: false
      });
    }
  };

  const handleToggleApprove = () => {
    onUpdateOverride(selectedChar, {
      isCompleted: !isCompleted
    });
  };

  const handleStyleChange = (style: 'stacked' | 'side' | 'custom') => {
    if (isCustomForChar) {
      onUpdateOverride(selectedChar, {
        hasCustomDoubleAccent: true,
        doubleAccentStyle: style
      });
    } else {
      onUpdateRules({ doubleAccentStyle: style });
    }
  };

  const handleCustomXChange = (val: number) => {
    if (isCustomForChar) {
      onUpdateOverride(selectedChar, {
        hasCustomDoubleAccent: true,
        doubleAccentCustomX: val
      });
    } else {
      onUpdateRules({ doubleAccentCustomX: val });
    }
  };

  const handleGapChange = (val: number) => {
    if (isCustomForChar) {
      onUpdateOverride(selectedChar, {
        hasCustomDoubleAccent: true,
        doubleAccentGap: val,
        doubleAccentCustomY: 0
      });
    } else {
      onUpdateRules({ doubleAccentGap: val, doubleAccentCustomY: 0 });
    }
  };

  const handleToggleCapCustom = (checked: boolean) => {
    if (isCustomForChar) {
      onUpdateOverride(selectedChar, {
        hasCustomDoubleAccent: true,
        doubleAccentCapCustomEnabled: checked,
        doubleAccentCapCustomX: currentCapCustomX,
        doubleAccentCapCustomY: currentCapCustomY,
        doubleAccentCapCompressY: currentCapCompressY
      });
    } else {
      onUpdateRules({
        doubleAccentCapCustomEnabled: checked,
        doubleAccentCapCustomX: currentCapCustomX,
        doubleAccentCapCustomY: currentCapCustomY,
        doubleAccentCapCompressY: currentCapCompressY
      });
    }
  };

  const handleCapCustomXChange = (val: number) => {
    if (isCustomForChar) {
      onUpdateOverride(selectedChar, {
        hasCustomDoubleAccent: true,
        doubleAccentCapCustomX: val
      });
    } else {
      onUpdateRules({ doubleAccentCapCustomX: val });
    }
  };

  const handleCapCustomYChange = (val: number) => {
    if (isCustomForChar) {
      onUpdateOverride(selectedChar, {
        hasCustomDoubleAccent: true,
        doubleAccentCapCustomY: val
      });
    } else {
      onUpdateRules({ doubleAccentCapCustomY: val });
    }
  };

  const handleCapCompressYChange = (val: number) => {
    const clamped = Math.max(10, Math.min(100, isNaN(val) ? 100 : val));
    if (isCustomForChar) {
      onUpdateOverride(selectedChar, {
        hasCustomDoubleAccent: true,
        doubleAccentCapCompressY: clamped
      });
    } else {
      onUpdateRules({ doubleAccentCapCompressY: clamped });
    }
  };

  const handleResetSettings = () => {
    if (isCustomForChar) {
      onUpdateOverride(selectedChar, {
        hasCustomDoubleAccent: true,
        doubleAccentStyle: 'custom',
        doubleAccentGap: rules.doubleAccentGap,
        doubleAccentCustomX: rules.doubleAccentCustomX ?? 0,
        doubleAccentCustomY: 0,
        doubleAccentCapCustomEnabled: false,
        doubleAccentCapCustomX: 0,
        doubleAccentCapCustomY: rules.doubleAccentGap,
        doubleAccentCapCompressY: 100
      });
    } else {
      onUpdateRules({
        doubleAccentGap: 30,
        doubleAccentCustomX: 0,
        doubleAccentCustomY: 0,
        doubleAccentCapCustomEnabled: false,
        doubleAccentCapCustomX: 0,
        doubleAccentCapCustomY: 20,
        doubleAccentCapCompressY: 100
      });
    }
  };

  return (
    <div className="flex flex-col space-y-2.5 pb-20 text-neutral-900">
      
      {/* 1. Character Scope & Toggle Card */}
      <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white font-bold font-mono flex items-center justify-center text-sm shadow-2xs">
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
                  ? 'Ký tự này đang dùng thông số dấu kép riêng'
                  : 'Đang dùng quy tắc dấu kép chung'}
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

      {/* 3. Style selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-neutral-700 block">
          Chọn kiểu ghép dấu:
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-lg border border-neutral-200">
          <button
            type="button"
            onClick={() => handleStyleChange('stacked')}
            className={`py-1.5 text-xs font-bold rounded-md transition text-center cursor-pointer ${
              currentStyle === 'stacked'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
            }`}
          >
            Xếp chồng
          </button>
          <button
            type="button"
            onClick={() => handleStyleChange('side')}
            className={`py-1.5 text-xs font-bold rounded-md transition text-center cursor-pointer ${
              currentStyle === 'side'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
            }`}
          >
            Chéo sườn
          </button>
          <button
            type="button"
            onClick={() => handleStyleChange('custom')}
            className={`py-1.5 text-xs font-bold rounded-md transition text-center cursor-pointer ${
              currentStyle === 'custom'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
            }`}
          >
            Tùy chỉnh
          </button>
        </div>
      </div>

      {/* 4. Custom options or explanation */}
      {currentStyle === 'custom' ? (
        <div className="space-y-2.5">
          {/* Card 1: Tùy chỉnh vị trí tầng dấu thứ hai */}
          <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
              <span className="font-bold text-neutral-900 text-[11px] flex items-center gap-1.5">
                Tùy chỉnh vị trí tầng dấu thứ hai
              </span>
              <button
                type="button"
                onClick={handleResetSettings}
                className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
              >
                Đặt lại
              </button>
            </div>

            {/* 2-Column Grid for Custom Position: Ngang (X) and Dọc (Y) */}
            <div className="grid grid-cols-2 gap-2">
              {/* Ngang (X) */}
              <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
                <div className="flex justify-between items-center text-neutral-700 font-bold text-[10px]">
                  <span>Ngang (X)</span>
                  <NumericInput
                    size="sm"
                    value={currentCustomX}
                    onChange={handleCustomXChange}
                    step={5}
                    min={-500}
                    max={500}
                    unit="UPM"
                  />
                </div>
                <input
                  type="range"
                  min="-300"
                  max="300"
                  step="5"
                  value={currentCustomX}
                  onChange={(e) => handleCustomXChange(parseInt(e.target.value))}
                  className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
                />
              </div>

              {/* Dọc (Y) */}
              <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
                <div className="flex justify-between items-center text-neutral-700 font-bold text-[10px]">
                  <span>Dọc (Y)</span>
                  <NumericInput
                    size="sm"
                    value={currentGap}
                    onChange={handleGapChange}
                    step={5}
                    min={-500}
                    max={500}
                    unit="UPM"
                  />
                </div>
                <input
                  type="range"
                  min="-150"
                  max="400"
                  step="5"
                  value={currentGap}
                  onChange={(e) => handleGapChange(parseInt(e.target.value))}
                  className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Chỉnh riêng cho chữ Hoa */}
          <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 space-y-2.5 text-xs">
            <label className={`flex items-center justify-between w-full cursor-pointer select-none ${currentCapCustomEnabled ? 'border-b border-neutral-200 pb-1.5' : ''}`}>
              <div className="flex flex-col pr-2">
                <span className="font-bold text-neutral-900 text-[11px]">
                  Chỉnh riêng cho chữ Hoa
                </span>
              </div>

              <div className="relative inline-flex items-center shrink-0">
                <input
                  type="checkbox"
                  checked={currentCapCustomEnabled}
                  onChange={(e) => handleToggleCapCustom(e.target.checked)}
                  className="sr-only peer"
                />

                <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
              </div>
            </label>

            {/* Khi bật toggle Chỉnh riêng thông số cho chữ Hoa */}
            {currentCapCustomEnabled && (
              <div className="p-2.5 bg-white rounded-lg border border-neutral-200 space-y-2.5">
                <div className="text-[11px] font-bold text-neutral-800 flex items-center justify-between">
                  <span>Vị trí dấu chữ Hoa</span>
                </div>

                {/* 2-Column Grid: Ngang (X) Hoa & Dọc (Y) Hoa */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Ngang (X) Hoa */}
                  <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/70 space-y-1">
                    <div className="flex justify-between items-center text-neutral-700 font-bold text-[10px]">
                      <span>Ngang (X)</span>
                      <NumericInput
                        size="sm"
                        value={currentCapCustomX}
                        onChange={handleCapCustomXChange}
                        step={5}
                        min={-500}
                        max={500}
                        unit="UPM"
                      />
                    </div>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      step="5"
                      value={currentCapCustomX}
                      onChange={(e) => handleCapCustomXChange(parseInt(e.target.value))}
                      className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
                    />
                  </div>

                  {/* Dọc (Y) Hoa */}
                  <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/70 space-y-1">
                    <div className="flex justify-between items-center text-neutral-700 font-bold text-[10px]">
                      <span>Dọc (Y)</span>
                      <NumericInput
                        size="sm"
                        value={currentCapCustomY}
                        onChange={handleCapCustomYChange}
                        step={5}
                        min={-500}
                        max={500}
                        unit="UPM"
                      />
                    </div>
                    <input
                      type="range"
                      min="-150"
                      max="400"
                      step="5"
                      value={currentCapCustomY}
                      onChange={(e) => handleCapCustomYChange(parseInt(e.target.value))}
                      className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
                    />
                  </div>
                </div>

                {/* Slider: Nén dấu chữ HOA */}
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/70 space-y-1.5">
                  <div className="flex justify-between items-center text-neutral-800 font-bold text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span>Nén dấu chữ HOA</span>
                    </div>
                    <NumericInput
                      size="sm"
                      value={currentCapCompressY}
                      onChange={handleCapCompressYChange}
                      step={1}
                      min={10}
                      max={100}
                      unit="%"
                    />
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={currentCapCompressY}
                    onChange={(e) => handleCapCompressYChange(parseInt(e.target.value))}
                    className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 space-y-2">
          <p className="leading-relaxed text-[11px]">
            Đang áp dụng kiểu ghép{' '}
            <strong className="text-neutral-900">
              {currentStyle === 'stacked'
                ? 'Xếp chồng thẳng đứng (Standard Stack)'
                : 'Nằm chéo sườn phải (Side-by-side)'}
            </strong>
            .
          </p>
          <button
            type="button"
            onClick={() => handleStyleChange('custom')}
            className="w-full py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 font-bold rounded-lg text-center transition cursor-pointer text-xs shadow-2xs"
          >
            Chuyển sang chế độ Tùy chỉnh
          </button>
        </div>
      )}

      {/* Typographic guidance note */}
      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Info className="w-3.5 h-3.5 text-amber-700" />
          <span>Lưu ý: Bộ dấu móc (ơ Ơ, ư Ư) sẽ lấy dấu chuẩn theo cách bỏ dấu đơn:</span>
        </div>
      </div>
    </div>
  );
};
