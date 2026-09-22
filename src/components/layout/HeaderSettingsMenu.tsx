import React, { useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  Check,
  RotateCcw,
  HelpCircle,
  Award,
  Settings,
  HardDrive,
  SkipForward
} from 'lucide-react';

export interface HeaderSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  // 1- Theme
  isDarkMode: boolean;
  onToggleTheme: (dark: boolean) => void;
  // 2- Skip Vietnamize
  skipVietnamize: boolean;
  onToggleSkipVietnamize: (skip: boolean) => void;
  // 3- Save Session
  saveSessionEnabled: boolean;
  onToggleSaveSession: (enabled: boolean) => void;
  // 4- Help Guide
  onOpenHelp: () => void;
  // 5- Credit
  onOpenCredit: () => void;
}

export const HeaderSettingsMenu: React.FC<HeaderSettingsMenuProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onToggleTheme,
  skipVietnamize,
  onToggleSkipVietnamize,
  saveSessionEnabled,
  onToggleSaveSession,
  onOpenHelp,
  onOpenCredit
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-auto right-0 mt-2 w-72 bg-white dark:bg-[#22222c] border border-neutral-200 dark:border-[#3a3a4c] rounded-2xl shadow-2xl p-2.5 z-50 text-neutral-900 dark:text-neutral-100 animate-scale-in select-none text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Title */}
      <div className="px-2.5 py-1.5 border-b border-neutral-100 dark:border-[#353545] flex items-center justify-between mb-1.5">
        <span className="font-extrabold text-xs tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-neutral-500 dark:text-amber-400" />
          Cài đặt ứng dụng
        </span>
      </div>

      {/* 1. Theme Switcher */}
      <div className="p-2 rounded-xl bg-neutral-50/80 dark:bg-[#1b1b24] border border-neutral-200/60 dark:border-[#323242] mb-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px] text-neutral-700 dark:text-neutral-300">Giao diện</span>
        </div>
        <div className="grid grid-cols-2 gap-1 bg-white dark:bg-[#282834] p-0.5 rounded-lg border border-neutral-200/70 dark:border-[#3e3e50]">
          <button
            type="button"
            onClick={() => onToggleTheme(false)}
            className={`py-1 px-2 rounded-md font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer ${
              !isDarkMode
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleTheme(true)}
            className={`py-1 px-2 rounded-md font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer ${
              isDarkMode
                ? 'bg-amber-500 text-neutral-950 shadow-2xs font-extrabold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* 2. Checkbox: Bỏ qua Việt Hóa */}
      <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-neutral-100/80 dark:hover:bg-[#2b2b38] transition cursor-pointer">
        <input
          type="checkbox"
          checked={skipVietnamize}
          onChange={(e) => onToggleSkipVietnamize(e.target.checked)}
          className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer accent-neutral-900 dark:accent-amber-500 w-3.5 h-3.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[11px] text-neutral-900 dark:text-neutral-100">Bỏ qua Việt Hóa</span>
            {skipVietnamize && (
              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 rounded text-[9px] font-bold">
                Bật
              </span>
            )}
          </div>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
            Chỉnh sửa glyph ở tab 2 hoặc kerning ở tab 3 và tải font về trực tiếp mà không cần qua bước Việt hóa.
          </p>
        </div>
      </label>

      {/* 3. Checkbox: Lưu phiên làm việc */}
      <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-neutral-100/80 dark:hover:bg-[#2b2b38] transition cursor-pointer">
        <input
          type="checkbox"
          checked={saveSessionEnabled}
          onChange={(e) => onToggleSaveSession(e.target.checked)}
          className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer accent-neutral-900 dark:accent-amber-500 w-3.5 h-3.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[11px] text-neutral-900 dark:text-neutral-100">Lưu phiên làm việc</span>
            {saveSessionEnabled && (
              <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 rounded text-[9px] font-bold">
                IndexedDB
              </span>
            )}
          </div>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
            Tự động lưu dự án và khôi phục phiên làm việc cũ.
          </p>
        </div>
      </label>

      <div className="my-1 border-t border-neutral-100 dark:border-[#353545]" />

      {/* 4. Hướng dẫn sử dụng */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onOpenHelp();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#2b2b38] text-neutral-800 dark:text-neutral-200 font-bold transition cursor-pointer text-left"
      >
        <HelpCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
        <span className="text-[11px]">Hướng dẫn sử dụng</span>
      </button>

      {/* 5. Credit */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onOpenCredit();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#2b2b38] text-neutral-800 dark:text-neutral-200 font-bold transition cursor-pointer text-left"
      >
        <Award className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
        <span className="text-[11px]">Credit</span>
      </button>
    </div>
  );
};
