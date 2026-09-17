import React from 'react';
import * as opentype from 'opentype.js';
import { Check, CheckCircle2, RotateCcw, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { GlyphOverrideState } from '../../types';
import { NumericInput } from '../NumericInput';
import { VIETNAMESE_RECIPES } from '../../utils';

interface GlyphPropertiesProps {
  font: opentype.Font | null;
  selectedChar: string;
  override?: GlyphOverrideState;
  onUpdateOverride: (char: string, updates: Partial<GlyphOverrideState>) => void;
  onResetOverride: (char: string) => void;
}

export const GlyphProperties: React.FC<GlyphPropertiesProps> = ({
  font,
  selectedChar,
  override,
  onUpdateOverride,
  onResetOverride
}) => {
  const recipe = VIETNAMESE_RECIPES.find((r) => r.char === selectedChar);
  const isCompositeDouble = recipe && recipe.components.length === 2;

  const currentOffsetX = override?.offsetX ?? 0;
  const currentOffsetY = override?.offsetY ?? 0;
  const currentScaleX = override?.scaleX ?? 1.0;
  const currentScaleY = override?.scaleY ?? 1.0;
  const currentAdvanceTweak = override?.advanceWidthTweak ?? 0;
  const isCompleted = !!override?.isCompleted;

  const currentComp1X = override?.comp1OffsetX ?? 0;
  const currentComp1Y = override?.comp1OffsetY ?? 0;
  const currentComp2X = override?.comp2OffsetX ?? 0;
  const currentComp2Y = override?.comp2OffsetY ?? 0;

  const baseAdvanceWidth = font ? (font.charToGlyph(selectedChar)?.advanceWidth || 500) : 500;

  const isCustomForChar = !!override && (
    (override.offsetX !== undefined && override.offsetX !== 0) ||
    (override.offsetY !== undefined && override.offsetY !== 0) ||
    (override.scaleX !== undefined && override.scaleX !== 1) ||
    (override.scaleY !== undefined && override.scaleY !== 1) ||
    (override.advanceWidthTweak !== undefined && override.advanceWidthTweak !== 0) ||
    (override.comp1OffsetX !== undefined && override.comp1OffsetX !== 0) ||
    (override.comp1OffsetY !== undefined && override.comp1OffsetY !== 0) ||
    (override.comp2OffsetX !== undefined && override.comp2OffsetX !== 0) ||
    (override.comp2OffsetY !== undefined && override.comp2OffsetY !== 0) ||
    !!override.hasCustomDoubleAccent
  );

  return (
    <div className="flex flex-col space-y-2.5 pb-20 text-neutral-900">
      {/* Header Bar */}
      <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
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
                  ? 'Ký tự đã được tinh chỉnh'
                  : 'Ký tự được tạo tự động'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateOverride(selectedChar, { isCompleted: !isCompleted })}
              className={`px-2 py-1 text-[11px] font-bold rounded-md border transition flex items-center gap-1 cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isCompleted ? 'Đã duyệt' : 'Duyệt'}</span>
            </button>

            <button
              type="button"
              onClick={() => onResetOverride(selectedChar)}
              className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition cursor-pointer"
              title="Đặt lại thông số ký tự này về tự động"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Advance Width Tweak */}
      <div className="space-y-1.5 bg-neutral-50/80 p-2.5 rounded-xl border border-neutral-200/80">
        <div className="flex justify-between items-center text-[11px] text-neutral-700 font-semibold">
          <div>
            <span className="font-bold text-neutral-800 block text-xs">Spacing</span>
            <span className="text-[10px] text-neutral-500">
              Gốc: {baseAdvanceWidth} + Tinh chỉnh: {currentAdvanceTweak} ={' '}
              <strong className="text-neutral-900 font-bold">{baseAdvanceWidth + currentAdvanceTweak}</strong>
            </span>
          </div>
          <NumericInput
            size="sm"
            value={currentAdvanceTweak}
            onChange={(val) => onUpdateOverride(selectedChar, { advanceWidthTweak: val })}
            step={5}
            min={-300}
            max={500}
            unit="UPM"
          />
        </div>
        <input
          type="range"
          min="-200"
          max="300"
          step="5"
          value={currentAdvanceTweak}
          onChange={(e) => onUpdateOverride(selectedChar, { advanceWidthTweak: parseInt(e.target.value) })}
          className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
        />
      </div>

      {/* Main Transform Properties in 2-Column Grids */}
      <div className="space-y-2 bg-neutral-50/80 p-2.5 rounded-xl border border-neutral-200/80">
        <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
          Vị trí & Kích thước
        </span>

        {/* 2-Column Offset */}
        <div className="grid grid-cols-2 gap-2">
          {/* Offset X */}
          <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
              <span>Ngang (X)</span>
              <NumericInput
                size="sm"
                value={currentOffsetX}
                onChange={(val) => onUpdateOverride(selectedChar, { offsetX: val })}
                step={2}
                min={-300}
                max={300}
                unit="UPM"
              />
            </div>
            <input
              type="range"
              min="-200"
              max="200"
              step="2"
              value={currentOffsetX}
              onChange={(e) => onUpdateOverride(selectedChar, { offsetX: parseInt(e.target.value) })}
              className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
            />
          </div>

          {/* Offset Y */}
          <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
              <span>Dọc (Y)</span>
              <NumericInput
                size="sm"
                value={currentOffsetY}
                onChange={(val) => onUpdateOverride(selectedChar, { offsetY: val })}
                step={2}
                min={-300}
                max={300}
                unit="UPM"
              />
            </div>
            <input
              type="range"
              min="-200"
              max="200"
              step="2"
              value={currentOffsetY}
              onChange={(e) => onUpdateOverride(selectedChar, { offsetY: parseInt(e.target.value) })}
              className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
            />
          </div>
        </div>

        {/* 2-Column Scale */}
        <div className="grid grid-cols-2 gap-2">
          {/* Scale X */}
          <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
              <span>Scale X</span>
              <NumericInput
                size="sm"
                value={Math.round(currentScaleX * 100)}
                onChange={(val) => onUpdateOverride(selectedChar, { scaleX: val / 100 })}
                step={2}
                min={20}
                max={250}
                unit="%"
              />
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.02"
              value={currentScaleX}
              onChange={(e) => onUpdateOverride(selectedChar, { scaleX: parseFloat(e.target.value) })}
              className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
            />
          </div>

          {/* Scale Y */}
          <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
              <span>Scale Y</span>
              <NumericInput
                size="sm"
                value={Math.round(currentScaleY * 100)}
                onChange={(val) => onUpdateOverride(selectedChar, { scaleY: val / 100 })}
                step={2}
                min={20}
                max={250}
                unit="%"
              />
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.02"
              value={currentScaleY}
              onChange={(e) => onUpdateOverride(selectedChar, { scaleY: parseFloat(e.target.value) })}
              className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
            />
          </div>
        </div>
      </div>
     
      {/* Independent Component Tweaks for Double Accent characters */}
      {isCompositeDouble && (
        <div className="space-y-2 bg-neutral-50/80 p-2.5 rounded-xl border border-neutral-200/80">
          <div className="border-b border-neutral-200/80 pb-1 flex items-center justify-between">
            <span className="font-bold text-neutral-800 block text-xs">
              Bù vị trí dấu kép
            </span>
            <span className="text-[10px] text-neutral-600">
              ({recipe.components[0]}) & ({recipe.components[1]})
            </span>
          </div>

          {/* Comp 1 */}
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-bold text-neutral-500 block">
              Dấu 1: {recipe.components[0]}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/80 p-1.5 rounded-md border border border-neutral-200/80">
                <span className="text-[10px] text-neutral-600 block mb-0.5 font-medium">Ngang (X):</span>
                <NumericInput
                  size="sm"
                  value={currentComp1X}
                  onChange={(val) => onUpdateOverride(selectedChar, { comp1OffsetX: val })}
                  step={2}
                  min={-200}
                  max={200}
                  unit="UPM"
                />
              </div>
              <div className="bg-white/80 p-1.5 rounded-md border border border-neutral-200/80">
                <span className="text-[10px] text-neutral-600 block mb-0.5 font-medium">Dọc (Y):</span>
                <NumericInput
                  size="sm"
                  value={currentComp1Y}
                  onChange={(val) => onUpdateOverride(selectedChar, { comp1OffsetY: val })}
                  step={2}
                  min={-200}
                  max={200}
                  unit="UPM"
                />
              </div>
            </div>
          </div>

          {/* Comp 2 */}
          <div className="space-y-1 text-xs pt-1 border-t border-neutral-200/80">
            <span className="text-[10px] font-bold text-neutral-500 block">
              Dấu 2: {recipe.components[1]}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/80 p-1.5 rounded-md border border-neutral-200/80">
                <span className="text-[10px] text-neutral-600 block mb-0.5 font-medium">Ngang (X):</span>
                <NumericInput
                  size="sm"
                  value={currentComp2X}
                  onChange={(val) => onUpdateOverride(selectedChar, { comp2OffsetX: val })}
                  step={2}
                  min={-200}
                  max={200}
                  unit="UPM"
                />
              </div>
              <div className="bg-white/80 p-1.5 rounded-lg border border-neutral-200/80">
                <span className="text-[10px] text-neutral-600 block mb-0.5 font-medium">Dọc (Y):</span>
                <NumericInput
                  size="sm"
                  value={currentComp2Y}
                  onChange={(val) => onUpdateOverride(selectedChar, { comp2OffsetY: val })}
                  step={2}
                  min={-200}
                  max={200}
                  unit="UPM"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
