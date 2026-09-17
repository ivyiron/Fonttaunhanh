import React, { useState } from 'react';
import * as opentype from 'opentype.js';
import {
  Blocks,
  CaseSensitive,
  RotateCcw,
  Sparkles,
  Link,
  Unlink,
  Check,
  Upload,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  Code2
} from 'lucide-react';
import { DiacriticTemplate, AutoPositionRules } from '../../types';
import { NumericInput } from '../NumericInput';
import {
  DEFAULT_DIACRITICS,
  extractPathDataFromSvg,
  getExtractedDiacriticSvgPathFromChar,
  formatSvgPathToFullSvg
} from '../../utils';

interface DiacriticPropertiesProps {
  font: opentype.Font | null;
  activeDiaId: string;
  template: DiacriticTemplate;
  rules: AutoPositionRules;
  onUpdateTemplate: (id: string, updates: Partial<DiacriticTemplate>) => void;
  onUpdateRules: (updates: Partial<AutoPositionRules>) => void;
  onOpenLibraryModal: () => void;
  isCapitalEditing?: boolean;
  onToggleCapitalEditing?: (val: boolean) => void;
  existingGlyphInfo?: { count: number; total: number; samples: string[] };
  preserveExistingGlyphs?: boolean;
  onTogglePreserveExisting?: (val: boolean) => void;
}

export const DiacriticProperties: React.FC<DiacriticPropertiesProps> = ({
  font,
  activeDiaId,
  template,
  rules,
  onUpdateTemplate,
  onUpdateRules,
  onOpenLibraryModal,
  isCapitalEditing,
  onToggleCapitalEditing,
  existingGlyphInfo,
  preserveExistingGlyphs,
  onTogglePreserveExisting
}) => {
  const [aspectLocked, setAspectLocked] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showGlobalGaps, setShowGlobalGaps] = useState<boolean>(false);
  const [localIsCap, setLocalIsCap] = useState<boolean>(false);

  const editingCap = onToggleCapitalEditing !== undefined ? (isCapitalEditing ?? false) : localIsCap;
  const setEditingCap = (val: boolean) => {
    if (onToggleCapitalEditing) {
      onToggleCapitalEditing(val);
    } else {
      setLocalIsCap(val);
    }
  };

  const isCapVariantActive = !!template?.hasCapVariant && editingCap;

  const currentSvgPath = isCapVariantActive && template.capSvgPath !== undefined ? template.capSvgPath : (template?.svgPath || '');
  const currentScaleX = isCapVariantActive && template.capScaleX !== undefined ? template.capScaleX : (template?.scaleX ?? 1.0);
  const currentScaleY = isCapVariantActive && template.capScaleY !== undefined ? template.capScaleY : (template?.scaleY ?? 1.0);
  const currentOffsetX = isCapVariantActive && template.capOffsetX !== undefined ? template.capOffsetX : (template?.offsetX ?? 0);
  const currentOffsetY = isCapVariantActive && template.capOffsetY !== undefined ? template.capOffsetY : (template?.offsetY ?? 0);
  const currentAutoCenterX = isCapVariantActive && template.capAutoCenterX !== undefined ? template.capAutoCenterX : (template?.autoCenterX !== false);

  const updateActiveValues = (updates: Partial<DiacriticTemplate>) => {
    if (!template) return;
    if (isCapVariantActive) {
      const capUpdates: Partial<DiacriticTemplate> = {};
      if (updates.svgPath !== undefined) capUpdates.capSvgPath = updates.svgPath;
      if (updates.scaleX !== undefined) capUpdates.capScaleX = updates.scaleX;
      if (updates.scaleY !== undefined) capUpdates.capScaleY = updates.scaleY;
      if (updates.offsetX !== undefined) capUpdates.capOffsetX = updates.offsetX;
      if (updates.offsetY !== undefined) capUpdates.capOffsetY = updates.offsetY;
      if (updates.autoCenterX !== undefined) capUpdates.capAutoCenterX = updates.autoCenterX;
      onUpdateTemplate(activeDiaId, capUpdates);
    } else {
      onUpdateTemplate(activeDiaId, updates);
    }
  };

  const handleReset = () => {
    const originalDefault = DEFAULT_DIACRITICS.find((d) => d.id === activeDiaId);
    if (originalDefault) {
      updateActiveValues({
        svgPath: originalDefault.svgPath,
        scaleX: 1.0,
        scaleY: 1.0,
        offsetX: 0,
        offsetY: 0,
        autoCenterX: true
      });
      setStatusMsg(`Đã đặt lại về thiết kế chuẩn (${isCapVariantActive ? 'Chữ HOA' : 'Chữ thường'})!`);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleExtractFromFont = () => {
    if (!font) {
      setStatusMsg('Chưa nạp font');
      return;
    }
    // Mapping of diacritics to representative Vietnamese sample characters in font
    const sampleMap: Record<string, { char: string; base: string }> = {
      acute: { char: isCapVariantActive ? 'Á' : 'á', base: isCapVariantActive ? 'A' : 'a' },
      grave: { char: isCapVariantActive ? 'À' : 'à', base: isCapVariantActive ? 'A' : 'a' },
      hook: { char: isCapVariantActive ? 'Ả' : 'ả', base: isCapVariantActive ? 'A' : 'a' },
      tilde: { char: isCapVariantActive ? 'Ã' : 'ã', base: isCapVariantActive ? 'A' : 'a' },
      dot_below: { char: isCapVariantActive ? 'Ạ' : 'ạ', base: isCapVariantActive ? 'A' : 'a' },
      circumflex: { char: isCapVariantActive ? 'Â' : 'â', base: isCapVariantActive ? 'A' : 'a' },
      breve: { char: isCapVariantActive ? 'Ă' : 'ă', base: isCapVariantActive ? 'A' : 'a' },
      horn_o: { char: isCapVariantActive ? 'Ơ' : 'ơ', base: isCapVariantActive ? 'O' : 'o' },
      horn_u: { char: isCapVariantActive ? 'Ư' : 'ư', base: isCapVariantActive ? 'U' : 'u' },
      bar: { char: isCapVariantActive ? 'Đ' : 'đ', base: isCapVariantActive ? 'D' : 'd' }
    };

    const target = sampleMap[activeDiaId] || {
      char: isCapVariantActive ? 'Á' : 'á',
      base: isCapVariantActive ? 'A' : 'a'
    };
    const extracted = getExtractedDiacriticSvgPathFromChar(font, target.char, target.base);
    if (extracted) {
      updateActiveValues({ svgPath: extracted });
      setStatusMsg(`Đã bóc tách thành công từ '${target.char}' (${isCapVariantActive ? 'Chữ HOA' : 'Chữ thường'})!`);
    } else {
      onOpenLibraryModal();
    }
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        const pathData = extractPathDataFromSvg(content);
        if (pathData) {
          updateActiveValues({ svgPath: pathData });
          setStatusMsg('Đã nạp file SVG thành công!');
        } else {
          setStatusMsg('Không tìm thấy đường vẽ vector trong SVG');
        }
        setTimeout(() => setStatusMsg(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopySvgTag = () => {
    if (!currentSvgPath) return;
    const fullSvg = formatSvgPathToFullSvg(currentSvgPath);
    navigator.clipboard.writeText(fullSvg);
    setStatusMsg('Đã sao chép thẻ SVG vào Clipboard!');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleCopySvgPath = () => {
    if (!currentSvgPath) return;
    navigator.clipboard.writeText(currentSvgPath);
    setStatusMsg('Đã sao chép mã Path d="..." vào Clipboard!');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="flex flex-col space-y-2.5 pb-20 text-neutral-900">
      
      {/* Dấu tiếng Việt gốc trong font - Compact and Informative */}
      {existingGlyphInfo && (
        <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200/90 text-xs shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-600">
            {/* Thông tin bên trái */}
            <span className="min-w-0 truncate">
              {existingGlyphInfo.count > 0 ? (
                <>
                  Font gốc đã có ·{' '}
                  <span
                    className="font-mono text-neutral-800"
                    title={existingGlyphInfo.samples.join(', ')}
                  >
                    {existingGlyphInfo.samples.slice(0, 10).join(', ')}
                    {existingGlyphInfo.samples.length > 10 && '…'}
                  </span>
                </>
              ) : (
                'Chưa có ký tự tiếng Việt có dấu'
              )}
            </span>

            {/* Số lượng bên phải */}
            <span
              className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md font-mono font-bold ${
                existingGlyphInfo.count > 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {existingGlyphInfo.count}/{existingGlyphInfo.total}
            </span>
          </div>

          {/* Toggle: chỉ hiện khi font gốc có ký tự */}
          {existingGlyphInfo.count > 0 && onTogglePreserveExisting && (
            <div className="pt-2 border-t border-neutral-200/70">
              <label className="flex items-center justify-between w-full cursor-pointer select-none group/toggle">
                <span className="text-xs font-semibold text-neutral-800 group-hover/toggle:text-neutral-950">
                  Giữ lại các ký tự tiếng Việt đã có
                </span>
                <div className="relative inline-flex items-center shrink-0">
                  <input
                    type="checkbox"
                    checked={preserveExistingGlyphs}
                    onChange={(e) => onTogglePreserveExisting(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
                </div>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Uppercase specific variant toggle box */}
      <div className="p-2.5 bg-neutral-50/90 rounded-xl border border-neutral-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center justify-between w-full cursor-pointer select-none">
            <span className="text-xs font-bold text-neutral-800 hover:text-neutral-950">
              Chữ HOA khác chữ thường
            </span>
            <div className="relative inline-flex items-center shrink-0">
              <input
                type="checkbox"
                checked={!!template?.hasCapVariant}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  onUpdateTemplate(activeDiaId, {
                    hasCapVariant: enabled,
                    capSvgPath: enabled ? (template.capSvgPath || template.svgPath) : undefined,
                    capScaleX: enabled ? (template.capScaleX ?? template.scaleX ?? 1.0) : undefined,
                    capScaleY: enabled ? (template.capScaleY ?? template.scaleY ?? 1.0) : undefined,
                    capOffsetX: enabled ? (template.capOffsetX ?? template.offsetX ?? 0) : undefined,
                    capOffsetY: enabled ? (template.capOffsetY ?? template.offsetY ?? 0) : undefined,
                    capAutoCenterX: enabled ? (template.capAutoCenterX ?? template.autoCenterX ?? true) : undefined
                  });
                  if (enabled) {
                    setEditingCap(true);
                  } else {
                    setEditingCap(false);
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
            </div>
          </label>
        </div>

        {template?.hasCapVariant ? (
          <div className="pt-1.5 space-y-1.5 border-t border-neutral-200/70">
            {/* Toggle chuyển qua lại edit thông số Chữ thường / Chữ HOA */}
            <div className="flex bg-neutral-200/80 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setEditingCap(false)}
                className={`flex-1 py-1 px-2 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  !isCapVariantActive
                    ? 'bg-white text-neutral-950 shadow-2xs font-extrabold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>Chữ thường</span>
                             </button>
              <button
                type="button"
                onClick={() => setEditingCap(true)}
                className={`flex-1 py-1 px-2 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  isCapVariantActive
                    ? 'bg-neutral-900 text-white shadow-2xs font-extrabold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>Chữ HOA</span>
                              </button>
            </div>

            <div className="flex items-center text-[10px] px-0.5 text-neutral-500">
               <span className={`font-semibold text-neutral-700}`}>
                {isCapVariantActive ? 'Cấu hình thông số cho chữ HOA (Á, Â, Ơ, Ư, Đ...)' : 'Cấu hình thông số cho chữ thường (á, â, ơ, ư, đ...)'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-neutral-500 leading-tight">
            Mặc định dùng chung một thiết kế dấu và tỷ lệ cho cả chữ thường lẫn chữ hoa.
          </p>
        )}
      </div>

      {/* Vector Path Input */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          {/* 2 nút bên trái */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopySvgTag}
              disabled={!currentSvgPath}
              className="text-[10px] font-bold text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
              title="Copy toàn bộ thẻ <svg>...</svg> của dấu này"
            >
              <Code2 className="w-2.5 h-2.5 text-neutral-600" />
              <span>Copy thẻ SVG</span>
            </button>
            <button
              type="button"
              onClick={handleCopySvgPath}
              disabled={!currentSvgPath}
              className="text-[10px] font-bold text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
              title="Copy chuỗi d='...' của dấu này"
            >
              <Copy className="w-2.5 h-2.5 text-neutral-500" />
              <span>Copy path</span>
            </button>
            </div>

             {/* Label bên phải */}
            <label className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1 ml-0.5">
              <Upload className="w-2.5 h-2.5" />
              Tải lên SVG
              <input type="file" accept=".svg" onChange={handleFileUpload} className="hidden" />
            </label>
                    
        </div>
        <textarea
          rows={5}
          value={currentSvgPath}
          onChange={(e) => updateActiveValues({ svgPath: extractPathDataFromSvg(e.target.value) })}
          placeholder="M 10 20 L 30 50..."
          className="w-full text-[10px] font-mono p-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900 transition resize-none text-neutral-900"
        />
        {statusMsg && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-0.5">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Title & Quick Actions */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
        <div>
          
          <span className="text-[11px] text-neutral-500 font-medium">
            Mã SVG cho {template?.name || activeDiaId} {template?.hasCapVariant ? (isCapVariantActive ? '(Chữ HOA)' : '(Chữ thường)') : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExtractFromFont}
            className="px-2 py-1 text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-md transition cursor-pointer flex items-center gap-1"
            title="Bóc tách tự động từ font"
          >
            <Blocks className="w-3 h-3 text-amber-600" />
            Bóc tách
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
            title="Đặt lại nét và kích thước mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Scale Controls - Compact 2-Column Grid */}
      <div className="space-y-2 bg-neutral-50/70 p-2.5 rounded-xl border border-neutral-200/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800">Kích Thước Dấu</span>
          <button
            type="button"
            onClick={() => setAspectLocked(!aspectLocked)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
              aspectLocked
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
            }`}
            title="Khóa tỉ lệ X/Y"
          >
            {aspectLocked ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
            <span>{aspectLocked ? 'Khóa X/Y' : 'Tự do'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Scale X */}
          <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
              <span>Scale X</span>
              <NumericInput
                size="sm"
                value={Math.round(currentScaleX * 100)}
                onChange={(val) => {
                  const newX = val / 100;
                  if (aspectLocked) {
                    updateActiveValues({ scaleX: newX, scaleY: newX });
                  } else {
                    updateActiveValues({ scaleX: newX });
                  }
                }}
                step={1}
                min={10}
                max={300}
                unit="%"
              />
            </div>
            <input
              type="range"
              min="0.1"
              max="2.5"
              step="0.02"
              value={currentScaleX}
              onChange={(e) => {
                const newX = parseFloat(e.target.value);
                if (aspectLocked) {
                  updateActiveValues({ scaleX: newX, scaleY: newX });
                } else {
                  updateActiveValues({ scaleX: newX });
                }
              }}
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
                onChange={(val) => {
                  const newY = val / 100;
                  if (aspectLocked) {
                    updateActiveValues({ scaleX: newY, scaleY: newY });
                  } else {
                    updateActiveValues({ scaleY: newY });
                  }
                }}
                step={1}
                min={10}
                max={300}
                unit="%"
              />
            </div>
            <input
              type="range"
              min="0.1"
              max="2.5"
              step="0.02"
              value={currentScaleY}
              onChange={(e) => {
                const newY = parseFloat(e.target.value);
                if (aspectLocked) {
                  updateActiveValues({ scaleX: newY, scaleY: newY });
                } else {
                  updateActiveValues({ scaleY: newY });
                }
              }}
              className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
            />
          </div>
        </div>
      </div>

      {/* Position Offset Controls */}
      <div className="space-y-2 bg-neutral-50/70 p-2.5 rounded-xl border border-neutral-200/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800">Vị Trí Dấu</span>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={currentAutoCenterX}
              onChange={(e) => updateActiveValues({ autoCenterX: e.target.checked })}
              className="w-3.5 h-3.5 accent-neutral-900 rounded cursor-pointer"
            />
            <span>Căn giữa X tự động</span>
          </label>
        </div>

        {currentAutoCenterX ? (
          <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
              <span>Dọc (Y)</span>
              <NumericInput
                size="sm"
                value={currentOffsetY}
                onChange={(val) => updateActiveValues({ offsetY: val })}
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
              value={currentOffsetY}
              onChange={(e) => updateActiveValues({ offsetY: parseInt(e.target.value) })}
              className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
                <span>Ngang (X)</span>
                <NumericInput
                  size="sm"
                  value={currentOffsetX}
                  onChange={(val) => updateActiveValues({ offsetX: val })}
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
                value={currentOffsetX}
                onChange={(e) => updateActiveValues({ offsetX: parseInt(e.target.value) })}
                className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
              />
            </div>
            <div className="bg-white p-2 rounded-lg border border-neutral-200/70 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
                <span>Dọc (Y)</span>
                <NumericInput
                  size="sm"
                  value={currentOffsetY}
                  onChange={(val) => updateActiveValues({ offsetY: val })}
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
                value={currentOffsetY}
                onChange={(e) => updateActiveValues({ offsetY: parseInt(e.target.value) })}
                className="w-full h-1.5 accent-neutral-900 cursor-pointer rounded-lg bg-neutral-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Global Positioning Rules Block */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setShowGlobalGaps(!showGlobalGaps)}
          className="w-full p-2.5 bg-neutral-100/80 hover:bg-neutral-100 flex items-center justify-between font-bold text-neutral-900 transition cursor-pointer"
        >
          <span className="text-xs font-bold text-neutral-900">Cao độ dấu chung</span>
          {showGlobalGaps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showGlobalGaps && (
          <div className="p-2.5 space-y-2.5 bg-white border-t border-neutral-200">
            {/* Toggle Group Height Alignment */}
            <label className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg border border-neutral-200/70 cursor-pointer select-none">
              <div>
                <span className="text-xs font-bold text-neutral-900 block">
                  Cao độ dấu đồng đều
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  Đồng bộ x-Height / Cap-Height tránh bỏ dấu nhấp nhô
                </span>
              </div>
              <div className="relative inline-flex items-center shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={rules.useGroupHeightAlignment !== false}
                  onChange={(e) => onUpdateRules({ useGroupHeightAlignment: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
              </div>
            </label>

            {/* Lowercase & Uppercase Gaps in 2-Column Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/70 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
                  <span>Chữ thường</span>
                  <NumericInput
                    size="sm"
                    value={rules.lowercaseAccentGap}
                    onChange={(val) => onUpdateRules({ lowercaseAccentGap: val })}
                    step={5}
                    min={-500}
                    max={500}
                    unit="UPM"
                  />
                </div>
                <input
                  type="range"
                  min="-200"
                  max="500"
                  step="5"
                  value={rules.lowercaseAccentGap}
                  onChange={(e) => onUpdateRules({ lowercaseAccentGap: parseInt(e.target.value) })}
                  className="w-full h-1.5 accent-neutral-800 cursor-pointer rounded-lg bg-neutral-200"
                />
              </div>

              <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/70 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-neutral-700 font-bold">
                  <span>Chữ hoa</span>
                  <NumericInput
                    size="sm"
                    value={rules.uppercaseAccentGap}
                    onChange={(val) => onUpdateRules({ uppercaseAccentGap: val })}
                    step={5}
                    min={-500}
                    max={500}
                    unit="UPM"
                  />
                </div>
                <input
                  type="range"
                  min="-200"
                  max="500"
                  step="5"
                  value={rules.uppercaseAccentGap}
                  onChange={(e) => onUpdateRules({ uppercaseAccentGap: parseInt(e.target.value) })}
                  className="w-full h-1.5 accent-neutral-800 cursor-pointer rounded-lg bg-neutral-200"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
