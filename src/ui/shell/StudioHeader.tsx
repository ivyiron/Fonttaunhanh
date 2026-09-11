import React from 'react';
import {
  Download,
  RefreshCw,
  Edit2,
  FileType,
  Layers,
  Sparkles,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';
import { FontMetadata, GlyphEditState } from '../../core/session';

interface StudioHeaderProps {
  metadata: FontMetadata;
  filename: string | null;
  customFamilyName: string;
  setCustomFamilyName: (name: string) => void;
  customSubfamilyName: string;
  setCustomSubfamilyName: (name: string) => void;
  editedGlyphs: Record<string, GlyphEditState>;
  compiling: boolean;
  onCompileFont: (download: boolean) => void;
  onResetFont: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  metadata,
  filename,
  customFamilyName,
  setCustomFamilyName,
  customSubfamilyName,
  setCustomSubfamilyName,
  editedGlyphs,
  compiling,
  onCompileFont,
  onResetFont
}) => {
  const editedList = Object.values(editedGlyphs) as GlyphEditState[];
  const editedCount = editedList.filter((g) => g.isModified || g.isCompleted).length;
  const altCount = editedList.filter((g) => g.mode === 'alt').length;

  return (
    <header className="h-14 border-b border-neutral-200/90 bg-white px-4 flex items-center justify-between gap-4 select-none shrink-0 z-30 shadow-2xs">
      {/* Brand & Font Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Edit2 className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-neutral-900 tracking-tight hidden sm:inline">
            Font editer <span className="text-[10px] uppercase font-semibold text-neutral-400 ml-1 px-1.5 py-0.5 rounded-md bg-neutral-100 border border-neutral-200">Studio</span>
          </span>
        </div>

        <div className="h-5 w-px bg-neutral-200 hidden sm:block" />

        {/* Font Metadata Badges & Inline Renaming */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/80 rounded-lg px-2.5 py-1 text-xs transition">
            <FileType className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <input
              type="text"
              value={customFamilyName}
              onChange={(e) => setCustomFamilyName(e.target.value)}
              placeholder="Tên font..."
              title="Đổi tên Family khi xuất font"
              className="bg-transparent font-semibold text-neutral-900 focus:outline-hidden text-xs w-28 sm:w-36 truncate"
            />
            <span className="text-neutral-300">/</span>
            <input
              type="text"
              value={customSubfamilyName}
              onChange={(e) => setCustomSubfamilyName(e.target.value)}
              placeholder="Regular"
              title="Đổi tên Subfamily khi xuất font"
              className="bg-transparent text-neutral-600 focus:outline-hidden text-xs w-16 sm:w-20 truncate"
            />
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-neutral-500">
            <span className="px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 font-mono">
              {metadata.unitsPerEm} UPM
            </span>
            <span className="px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 font-mono">
              {metadata.totalGlyphs} glyphs
            </span>
            {editedCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {editedCount} đã sửa {altCount > 0 && `(${altCount} alt)`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onResetFont}
          className="px-2.5 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg border border-neutral-200/80 transition font-medium flex items-center gap-1.5"
          title={`File đang mở: ${filename || 'Font'}. Click để đổi font.`}
        >
          <UploadCloud className="w-3.5 h-3.5 text-neutral-500" />
          <span className="hidden md:inline">Đổi font</span>
        </button>

        <button
          disabled={compiling}
          onClick={() => onCompileFont(false)}
          className="px-3 py-1.5 text-xs bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 rounded-lg transition font-medium shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
          title="Biên dịch các thay đổi vào khu vực chạy thử font"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${compiling ? 'animate-spin text-neutral-900' : 'text-neutral-500'}`} />
          <span className="hidden sm:inline">Cập nhật & Chạy thử</span>
        </button>

        <button
          disabled={compiling}
          onClick={() => onCompileFont(true)}
          className="px-3.5 py-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition font-medium shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          title="Biên dịch và tải về file font OpenType (.OTF)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất Font (.OTF)</span>
        </button>
      </div>
    </header>
  );
};
