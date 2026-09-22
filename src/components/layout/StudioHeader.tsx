import React, { useState } from 'react';
import * as opentype from 'opentype.js';
import {
  WholeWord,
  TramFront,
  Sparkles,
  ArrowRightLeft,
  Upload,
  RefreshCw,
  Download,
  CheckCircle2,
  FileCheck,
  Type,
  Settings
} from 'lucide-react';
import { FontMetadata } from '../../types';
import { HeaderSettingsMenu } from './HeaderSettingsMenu';

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
  // Global Settings props
  isDarkMode: boolean;
  onToggleTheme: (dark: boolean) => void;
  skipVietnamize: boolean;
  onToggleSkipVietnamize: (skip: boolean) => void;
  saveSessionEnabled: boolean;
  onToggleSaveSession: (enabled: boolean) => void;
  onOpenCredit: () => void;
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
  onOpenExport,
  isDarkMode,
  onToggleTheme,
  skipVietnamize,
  onToggleSkipVietnamize,
  saveSessionEnabled,
  onToggleSaveSession,
  onOpenCredit
}) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  return (
    <header className="h-14 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between shrink-0 shadow-2xs z-30 select-none transition-colors">
      {/* Brand & Font Info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* SVG Logo replacing icon T and text VIỆT HÓA & KERNING */}
        <div className="flex items-center shrink-0 py-1" id="header-brand-logo">
          <img src="/MLogo.svg" alt="Việt hóa tàu nhanh" className="h-5 sm:h-7 w-auto object-contain object-left dark:brightness-0 dark:invert" />
        </div>
       
        {/* Center: 3 Big Tabs + Settings Gear Icon at the end of tab selection */}
        <div className="relative flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg border border-neutral-200 dark:border-neutral-700/80 gap-0.5">
          <button
            type="button"
            disabled={skipVietnamize}
            onClick={() => !skipVietnamize && setActiveTab('vietnamize')}
            title={skipVietnamize ? 'Đã vô hiệu hóa bước Việt Hóa theo cài đặt' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition ${
              skipVietnamize
                ? 'opacity-40 cursor-not-allowed text-neutral-400 line-through'
                : activeTab === 'vietnamize'
                ? 'bg-neutral-900 text-white shadow-2xs cursor-pointer'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50 cursor-pointer'
            }`}
          >
            <span>Việt hóa tàu nhanh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('glyph-edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
              activeTab === 'glyph-edit'
                ? 'bg-neutral-900 text-white shadow-2xs cursor-pointer shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50 cursor-pointer'
            }`}
          >
            <span>Edit tàu nhanh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kerning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
              activeTab === 'kerning'
                ? 'bg-neutral-900 text-white shadow-2xs cursor-pointer shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50 cursor-pointer'
            }`}
          >
            <span>Kerning tàu nhanh</span>
          </button>

          {/* Divider between tabs and Settings Gear */}
          <div className="w-[1px] h-4 bg-neutral-300 dark:bg-neutral-600 mx-0.5" />

          {/* Settings Gear Icon at the end of tab selection */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`p-1.5 rounded-md transition cursor-pointer flex items-center justify-center ${
                showSettingsMenu
                  ? 'bg-neutral-900 text-amber-400 dark:bg-[#323242] dark:text-amber-400'
                  : 'text-neutral-600 dark:text-amber-500 hover:text-neutral-900 dark:hover:text-amber-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50'
              }`}
              title="Cài đặt hệ thống"
            >
              <Settings className={`w-4 h-4 dark:text-amber-500 ${showSettingsMenu ? 'rotate-45' : ''} transition-transform duration-200`} />
            </button>

            {/* Dropdown Menu */}
            <HeaderSettingsMenu
              isOpen={showSettingsMenu}
              onClose={() => setShowSettingsMenu(false)}
              isDarkMode={isDarkMode}
              onToggleTheme={onToggleTheme}
              skipVietnamize={skipVietnamize}
              onToggleSkipVietnamize={onToggleSkipVietnamize}
              saveSessionEnabled={saveSessionEnabled}
              onToggleSaveSession={onToggleSaveSession}
              onOpenHelp={onOpenHelp}
              onOpenCredit={onOpenCredit}
            />
          </div>
        </div>
      </div>

      {/* Right Actions: Upload / Sync / Save & Export */}
      <div className="flex items-center gap-2">
        {/* Loaded Font Chip with Hover Metadata Popover */}
        {font && (
          <div className="relative group/fontinfo hidden md:flex items-center">
            <div className="flex items-center gap-1.5 pl-2.5 min-w-0 cursor-help py-1">
              <span
                id="font-status-dot"
                className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] opacity-100"
                style={{ backgroundColor: '#10b981' }}
              />
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate max-w-[140px] xl:max-w-[200px] group-hover/fontinfo:text-neutral-950 dark:group-hover/fontinfo:text-white transition">
                {fontFileName || fontMetadata?.family || 'Font'}
              </span>
              <span className="text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800/90 text-neutral-600 dark:text-amber-300 px-1.5 py-0.5 rounded border border-neutral-200/80 dark:border-amber-500/30 shrink-0 font-bold">
                {fontMetadata?.totalGlyphs || font.glyphs.length} glyphs
              </span>
            </div>

            {/* Hover Popover */}
            <div className="absolute top-full left-2 mt-2 w-80 bg-white/95 dark:bg-[#262632]/98 backdrop-blur-md rounded-xl border border-neutral-200 dark:border-[#3a3a4c] shadow-2xl p-3.5 text-xs z-50 pointer-events-none opacity-0 -translate-y-1 group-hover/fontinfo:opacity-100 group-hover/fontinfo:translate-y-0 group-hover/fontinfo:pointer-events-auto transition-all duration-150 ease-out">
              <div className="flex items-start justify-between border-b border-neutral-100 dark:border-[#383848] pb-2 mb-2.5">
                <div className="min-w-0 pr-2">
                  <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                    Thông số kỹ thuật font
                  </div>
                  <h3 className="text-sm font-black text-neutral-900 dark:text-white truncate mt-0.5">
                    {fontMetadata?.family || (font.names?.fontFamily?.en) || fontFileName}
                  </h3>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                    {fontMetadata?.style || (font.names?.fontSubfamily?.en) || 'Regular'}
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-neutral-100 dark:bg-[#323242] text-neutral-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-neutral-200 dark:border-amber-500/40 shrink-0 shadow-xs">
                  {fontMetadata?.format || 'OTF/TTF'}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <div className="bg-neutral-50 dark:bg-[#1e1e26] p-2 rounded-lg border border-neutral-200/70 dark:border-[#353545]">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-400 font-sans block">Tổng glyphs:</span>
                  <strong className="text-neutral-900 dark:text-neutral-100 text-xs font-bold">{fontMetadata?.totalGlyphs || font.glyphs.length}</strong>
                </div>
                <div className="bg-neutral-50 dark:bg-[#1e1e26] p-2 rounded-lg border border-neutral-200/70 dark:border-[#353545]">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-400 font-sans block">Units per em (UPM):</span>
                  <strong className="text-neutral-900 dark:text-neutral-100 text-xs font-bold">{fontMetadata?.unitsPerEm || font.unitsPerEm || 1000}</strong>
                </div>
                <div className="bg-neutral-50 dark:bg-[#1e1e26] p-2 rounded-lg border border-neutral-200/70 dark:border-[#353545]">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-400 font-sans block">Ascender:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 text-xs font-bold">+{fontMetadata?.ascender || font.ascender || 800}</strong>
                </div>
                <div className="bg-neutral-50 dark:bg-[#1e1e26] p-2 rounded-lg border border-neutral-200/70 dark:border-[#353545]">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-400 font-sans block">Descender:</span>
                  <strong className="text-rose-700 dark:text-rose-400 text-xs font-bold">{fontMetadata?.descender || font.descender || -200}</strong>
                </div>
                <div className="bg-neutral-50 dark:bg-[#1e1e26] p-2 rounded-lg border border-neutral-200/70 dark:border-[#353545]">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-400 font-sans block">Cap height:</span>
                  <strong className="text-neutral-900 dark:text-neutral-100 text-xs font-bold">
                    {fontMetadata?.capHeight || Math.round((fontMetadata?.ascender || font.ascender || 800) * 0.9)}
                  </strong>
                </div>
                <div className="bg-neutral-50 dark:bg-[#1e1e26] p-2 rounded-lg border border-neutral-200/70 dark:border-[#353545]">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-400 font-sans block">x-Height:</span>
                  <strong className="text-neutral-900 dark:text-neutral-100 text-xs font-bold">
                    {fontMetadata?.xHeight || Math.round((fontMetadata?.ascender || font.ascender || 800) * 0.55)}
                  </strong>
                </div>
              </div>

              {(font.names?.postScriptName?.en || fontMetadata?.weight) && (
                <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-[#383848] text-[10px] text-neutral-400 dark:text-neutral-400 space-y-0.5 font-mono truncate">
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
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition cursor-pointer hidden lg:flex items-center gap-1.5 text-xs font-semibold"
          title="Nạp font khác (.otf, .ttf, .woff)"
        >
          <Upload className="w-3.5 h-3.5 text-neutral-500 dark:text-amber-400" />
          <span>Tải lên font khác</span>
        </button>

        {/* Sync / Compile Font */}
        <button
          type="button"
          onClick={onCompileFont}
          disabled={compiling || !font}
          className="py-1.5 px-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#2c2c38] dark:hover:bg-[#383848] text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-[#3e3e50] text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
          title="Đồng bộ hóa font và kiểm tra"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${compiling ? 'animate-spin text-amber-600 dark:text-amber-400' : 'text-neutral-600 dark:text-amber-400'}`} />
          <span className="hidden sm:inline">{compiling ? 'Đang cập nhật...' : 'Cập nhật font'}</span>
        </button>

        {/* Save & Export Font */}
        <button
          type="button"
          onClick={onOpenExport}
          disabled={!font}
          className="py-1.5 px-3 bg-neutral-950 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-400 text-amber-400 dark:text-white border border-neutral-900 dark:border-amber-400 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Lưu & Xuất Font</span>
        </button>
      </div>
    </header>
  );
};

