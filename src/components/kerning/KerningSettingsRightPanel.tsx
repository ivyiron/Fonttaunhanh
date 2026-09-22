import React from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import { AutoSpacingRules, AutoKerningSettings, FontMetadata } from '../../types';
import { NumericInput } from '../NumericInput';

interface KerningSettingsRightPanelProps {
  fontMetadata: FontMetadata | null;
  totalGlyphsCount: number;
  kerningPairsCount: number;
  spacingRules: AutoSpacingRules;
  kerningSettings: AutoKerningSettings;
  onUpdateSpacingRules: (rules: Partial<AutoSpacingRules>) => void;
  onUpdateKerningSettings: (settings: Partial<AutoKerningSettings>) => void;
  onCompileFont: () => void;
  compiling: boolean;
}

export const KerningSettingsRightPanel: React.FC<KerningSettingsRightPanelProps> = ({
  fontMetadata,
  totalGlyphsCount,
  kerningPairsCount,
  spacingRules,
  kerningSettings,
  onUpdateSpacingRules,
  onUpdateKerningSettings,
  onCompileFont,
  compiling
}) => {
  return (
    <div className="flex flex-col space-y-3 pb-20 text-neutral-900">
      {/* Header & Stats */}
      <div className="border-b border-neutral-100 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-neutral-900">
              Cài đặt kerning & spacing
            </h3>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200/80 text-center">
          <div>
            <span className="text-[10px] text-neutral-500 font-medium block">Ký tự quét</span>
            <span className="text-xs font-black text-neutral-900">
              {fontMetadata?.totalGlyphs || totalGlyphsCount}
            </span>
          </div>
          <div className="border-l border-neutral-200">
            <span className="text-[10px] text-neutral-500 font-medium block">Cặp Kerning</span>
            <span className="text-xs font-black text-indigo-600">{kerningPairsCount}</span>
          </div>
        </div>
      </div>

       <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700 space-y-1">
        <div className="flex items-start gap-1.5 text-[11px]">
          <Info className="w-4.5 h-4.5 text-amber-700" />
          <span>Lưu ý: Kerning sẽ chỉ tác động lên font ở tab này. Nếu muốn export font với kerning đã thiết lập hãy export khi đang mở tap.</span>
        </div>
      </div>

      {/* SECTION 1: AUTO SPACING (SIDEBEARINGS) */}
      <div className="bg-neutral-50/90 border border-neutral-200/90 p-2.5 rounded-lg space-y-2.5">
        <div className="flex items-center gap-1.5 border-b border-neutral-200/60 pb-1">
          
          <h4 className="text-xs font-bold text-neutral-900">
            Auto spacing
          </h4>
        </div>

        {/* Spacing Presets */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-neutral-700 block">
            Mật độ chữ:
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'compact', label: 'Chặt' },
              { id: 'normal', label: 'Chuẩn' },
              { id: 'spacious', label: 'Rộng' }
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onUpdateSpacingRules({ spacingPreset: preset.id as any })}
                className={`py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer text-center ${
                  spacingRules.spacingPreset === preset.id
                    ? 'bg-neutral-950 text-white border-neutral-950 shadow-2xs'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Grid for Spacing Controls */}
        <div className="grid grid-cols-2 gap-2">
          {/* Global Tracking Slider */}
          <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-700">
              <span>Tracking</span>
              <NumericInput
                size="sm"
                value={spacingRules.globalTrackingOffset}
                onChange={(val) => onUpdateSpacingRules({ globalTrackingOffset: val })}
                step={2}
                min={-200}
                max={200}
                unit="UPM"
              />
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="2"
              value={spacingRules.globalTrackingOffset}
              onChange={(e) => onUpdateSpacingRules({ globalTrackingOffset: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
            />
          </div>

          {/* Curve Tightening */}
          <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-700">
              <span>Chữ cong</span>
              <NumericInput
                size="sm"
                value={spacingRules.curveTighteningPercent}
                onChange={(val) => onUpdateSpacingRules({ curveTighteningPercent: val })}
                step={1}
                min={-50}
                max={100}
                unit="%"
              />
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={spacingRules.curveTighteningPercent}
              onChange={(e) => onUpdateSpacingRules({ curveTighteningPercent: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: AUTO KERNING */}
      <div className="bg-neutral-50/90 border border-neutral-200/90 p-2.5 rounded-lg space-y-2.5">
        <div className="flex items-center gap-1.5 border-b border-neutral-200/60 pb-1">
          <h4 className="text-xs font-bold text-neutral-900">
            Auto kerning
          </h4>
        </div>

        {/* 2-Column Grid for Kerning Multiplier & Threshold */}
        <div className="grid grid-cols-2 gap-2">
          {/* Intensity Multiplier */}
          <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-700">
              <span>Cường độ</span>
              <NumericInput
                size="sm"
                value={Math.round(kerningSettings.intensityMultiplier * 100)}
                onChange={(val) => onUpdateKerningSettings({ intensityMultiplier: val / 100 })}
                step={5}
                min={-200}
                max={300}
                unit="%"
              />
            </div>
            <input
              type="range"
              min="-1"
              max="3"
              step="0.05"
              value={kerningSettings.intensityMultiplier}
              onChange={(e) => onUpdateKerningSettings({ intensityMultiplier: parseFloat(e.target.value) })}
              className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
            />
          </div>

          {/* Min Threshold */}
          <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-700">
              <span>Ngưỡng</span>
              <NumericInput
                size="sm"
                value={kerningSettings.minThreshold}
                onChange={(val) => onUpdateKerningSettings({ minThreshold: val })}
                step={1}
                min={-100}
                max={100}
                unit="UPM"
              />
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={kerningSettings.minThreshold}
              onChange={(e) => onUpdateKerningSettings({ minThreshold: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
            />
          </div>
        </div>

        {/* Scope Checkboxes in 2-Column Grid */}
        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
          <label className="flex items-center gap-1.5 font-medium text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={kerningSettings.applyClassics}
              onChange={(e) => onUpdateKerningSettings({ applyClassics: e.target.checked })}
              className="w-3.5 h-3.5 accent-neutral-900 rounded cursor-pointer"
            />
            <span className="truncate">Hoa-Hoa (AV, AT...)</span>
          </label>

          <label className="flex items-center gap-1.5 font-medium text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={kerningSettings.applyUpperLower}
              onChange={(e) => onUpdateKerningSettings({ applyUpperLower: e.target.checked })}
              className="w-3.5 h-3.5 accent-neutral-900 rounded cursor-pointer"
            />
            <span className="truncate">Hoa-Thường (Ta, Va)</span>
          </label>

          <label className="flex items-center gap-1.5 font-medium text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={kerningSettings.applyVietnameseVariants}
              onChange={(e) => onUpdateKerningSettings({ applyVietnameseVariants: e.target.checked })}
              className="w-3.5 h-3.5 accent-neutral-900 rounded cursor-pointer"
            />
            <span className="truncate">Tiếng Việt (Tà, Vô)</span>
          </label>

          <label className="flex items-center gap-1.5 font-medium text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={kerningSettings.applyPunctuation}
              onChange={(e) => onUpdateKerningSettings({ applyPunctuation: e.target.checked })}
              className="w-3.5 h-3.5 accent-neutral-900 rounded cursor-pointer"
            />
            <span className="truncate">Dấu câu (A., T.)</span>
          </label>
        </div>
      </div>

      {/* Sync Action Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onCompileFont}
          disabled={compiling}
          className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${compiling ? 'animate-spin' : ''}`} />
          <span>Rekerning</span>
        </button>
      </div>
    </div>
  );
};
