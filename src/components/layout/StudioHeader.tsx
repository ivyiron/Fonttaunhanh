import React from 'react';
import * as opentype from 'opentype.js';
import {
  WholeWord,
  TramFront,
  Sparkles,
  ArrowRightLeft,
  Upload,
  HelpCircle,
  RefreshCw,
  Download,
  CheckCircle2,
  FileCheck,
  Type
} from 'lucide-react';
import { FontMetadata } from '../../types';

export type MainTabType = 'vietnamize' | 'glyph-edit' | 'kerning';

interface StudioHeaderProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  font: opentype.Font | null;
  fontMetadata: FontMetadata | null;
  fontFileName: string;
  onUploadNewFont: () => void;
  onOpenHelp: () => void;
  onCompileFont: () => void;
  compiling: boolean;
  onOpenExport: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  activeTab,
  setActiveTab,
  font,
  fontMetadata,
  fontFileName,
  onUploadNewFont,
  onOpenHelp,
  onCompileFont,
  compiling,
  onOpenExport
}) => {
  return (
    <header className="h-14 bg-white border-b border-neutral-200 px-4 flex items-center justify-between shrink-0 shadow-2xs z-30 select-none">
      {/* Brand & Font Info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* SVG Logo replacing icon T and text VIỆT HÓA & KERNING */}
        <div className="flex items-center shrink-0 py-1" id="header-brand-logo">
         
              <img src="/MLogo.svg" alt="Việt hóa tàu nhanh" className="h-5 sm:h-7 w-auto object-contain object-left" />
            
        </div>
       
          {/* Center: 3 Big Tabs ("Việt hóa tàu nhanh", "Edit tàu nhanh", "Kerning tàu nhanh") */}
      <div className="flex items-center p-1 bg-neutral-100 rounded-lg border border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveTab('vietnamize')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
            activeTab === 'vietnamize'
              ? 'bg-neutral-950 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
          }`}
        >
          <span>Việt hóa tàu nhanh</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('glyph-edit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
            activeTab === 'glyph-edit'
              ? 'bg-neutral-950 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
          }`}
        >
          <span>Edit tàu nhanh</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kerning')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
            activeTab === 'kerning'
              ? 'bg-neutral-950 text-white shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/50'
          }`}
        >
          <span>Kerning tàu nhanh</span>
        </button>
      </div>
      </div>

          {/* Right Actions: Upload / Help / Sync / Save & Export */}
      <div className="flex items-center gap-2">
      {/* Loaded Font Chip with Hover Metadata Popover */}
        {font && (
          <div className="relative group/fontinfo hidden md:flex items-center">
            <div className="flex items-center gap-1.5 pl-2.5 min-w-0 cursor-help py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-neutral-800 truncate max-w-[140px] xl:max-w-[200px] group-hover/fontinfo:text-neutral-950 transition">
                {fontFileName || fontMetadata?.family || 'Font'}
              </span>
              <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200/80 shrink-0">
                {fontMetadata?.totalGlyphs || font.glyphs.length} glyphs
              </span>
            </div>

            {/* Hover Popover */}
            <div className="absolute top-full left-2 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-xl border border-neutral-200 shadow-xl p-3.5 text-xs z-50 pointer-events-none opacity-0 -translate-y-1 group-hover/fontinfo:opacity-100 group-hover/fontinfo:translate-y-0 group-hover/fontinfo:pointer-events-auto transition-all duration-150 ease-out">
              <div className="flex items-start justify-between border-b border-neutral-100 pb-2 mb-2.5">
                <div className="min-w-0 pr-2">
                  <div className="text-[11px] font-bold text-neutral-500">
                    Thông số kỹ thuật font
                  </div>
                  <h3 className="text-sm font-black text-neutral-900 truncate mt-0.5">
                    {fontMetadata?.family || (font.names?.fontFamily?.en) || fontFileName}
                  </h3>
                  <div className="text-[11px] text-neutral-500 font-medium">
                    {fontMetadata?.style || (font.names?.fontSubfamily?.en) || 'Regular'}
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md border border-neutral-200 shrink-0">
                  {fontMetadata?.format || 'OTF/TTF'}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/70">
                  <span className="text-[10px] text-neutral-400 font-sans block">Tổng glyphs:</span>
                  <strong className="text-neutral-900 text-xs">{fontMetadata?.totalGlyphs || font.glyphs.length}</strong>
                </div>
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/70">
                  <span className="text-[10px] text-neutral-400 font-sans block">Units per em (UPM):</span>
                  <strong className="text-neutral-900 text-xs">{fontMetadata?.unitsPerEm || font.unitsPerEm || 1000}</strong>
                </div>
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/70">
                  <span className="text-[10px] text-neutral-400 font-sans block">Ascender:</span>
                  <strong className="text-emerald-700 text-xs">+{fontMetadata?.ascender || font.ascender || 800}</strong>
                </div>
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/70">
                  <span className="text-[10px] text-neutral-400 font-sans block">Descender:</span>
                  <strong className="text-rose-700 text-xs">{fontMetadata?.descender || font.descender || -200}</strong>
                </div>
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/70">
                  <span className="text-[10px] text-neutral-400 font-sans block">Cap height:</span>
                  <strong className="text-neutral-900 text-xs">
                    {fontMetadata?.capHeight || Math.round((fontMetadata?.ascender || font.ascender || 800) * 0.9)}
                  </strong>
                </div>
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/70">
                  <span className="text-[10px] text-neutral-400 font-sans block">x-Height:</span>
                  <strong className="text-neutral-900 text-xs">
                    {fontMetadata?.xHeight || Math.round((fontMetadata?.ascender || font.ascender || 800) * 0.55)}
                  </strong>
                </div>
              </div>

              {(font.names?.postScriptName?.en || fontMetadata?.weight) && (
                <div className="mt-2.5 pt-2 border-t border-neutral-100 text-[10px] text-neutral-400 space-y-0.5 font-mono truncate">
                  {font.names?.postScriptName?.en && (
                    <div className="truncate">PS: {font.names.postScriptName.en}</div>
                  )}
                  {fontMetadata?.weight && (
                    <div>Weight: {fontMetadata.weight}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Upload Other Font */}
        <button
          type="button"
          onClick={onUploadNewFont}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition cursor-pointer hidden lg:flex items-center gap-1 text-xs font-semibold"
          title="Nạp font khác (.otf, .ttf, .woff)"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Tải lên font khác</span>
        </button>

        {/* Help Guide */}
        <button
          type="button"
          onClick={onOpenHelp}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition cursor-pointer"
          title="Hướng dẫn sử dụng"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Sync / Compile Font */}
        <button
          type="button"
          onClick={onCompileFont}
          disabled={compiling || !font}
          className="py-1.5 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
          title="Đồng bộ hóa font và kiểm tra"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${compiling ? 'animate-spin text-amber-600' : ''}`} />
          <span className="hidden sm:inline">{compiling ? 'Đang cập nhật...' : 'Cập nhật font'}</span>
        </button>

        {/* Save & Export Font */}
        <button
          type="button"
          onClick={onOpenExport}
          disabled={!font}
          className="py-1.5 px-3 bg-neutral-950 hover:bg-black text-amber-400 border border-neutral-900 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Lưu & Xuất Font</span>
        </button>
      </div>
    </header>
  );
};
