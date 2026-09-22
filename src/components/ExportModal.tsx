import React, { useRef, useState } from 'react';
import * as opentype from 'opentype.js';
import {
  X,
  Download,
  FolderDown,
  FolderOpen,
  Sliders,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { FontMetadata, VietnameseProjectFile } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  font: opentype.Font | null;
  fontMetadata: FontMetadata | null;
  fontFileName: string;
  compiledBuffer: ArrayBuffer | null;
  customFamilyName: string;
  customSubfamilyName: string;
  onSetCustomFamilyName: (val: string) => void;
  onSetCustomSubfamilyName: (val: string) => void;
  onCompileFont: () => void;
  compiling: boolean;
  onDownloadFont: (format: 'ttf' | 'woff2' | 'otf') => void;
  onSaveProject: () => void;
  onLoadProject: (project: VietnameseProjectFile) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  font,
  fontMetadata,
  fontFileName,
  compiledBuffer,
  customFamilyName,
  customSubfamilyName,
  onSetCustomFamilyName,
  onSetCustomSubfamilyName,
  onCompileFont,
  compiling,
  onDownloadFont,
  onSaveProject,
  onLoadProject
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'otf' | 'ttf' | 'woff2'>('otf');
  const projectInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const fullName = `${customFamilyName} ${customSubfamilyName || 'Regular'}`.trim();
  const postscriptName = `${customFamilyName}-${customSubfamilyName || 'Regular'}`.replace(
    /[^a-zA-Z0-9-]/g,
    ''
  );

  const handleProjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const projectData = JSON.parse(text) as VietnameseProjectFile;
        onLoadProject(projectData);
        onClose();
      } catch (err: any) {
        console.error('Lỗi khi đọc file dự án:', err);
      }
    };
    reader.readAsText(file);
    if (projectInputRef.current) projectInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1b1b24] border border-neutral-200 dark:border-[#353545] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scale-in text-neutral-900 dark:text-neutral-100 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#2e2e3e] transition cursor-pointer"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 pr-8">
          <div>
            <h3 className="text-base font-black text-neutral-950 dark:text-white tracking-tight">
              Lưu Dự Án & Xuất Bản Font
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Lưu dự án (.ftn) hoặc xuất file font (.otf, .ttf, .woff2).
            </p>
          </div>
        </div>

        {/* Metadata Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-200 block">
                Tên Font (Family):
              </label>
              <input
                type="text"
                value={customFamilyName}
                onChange={(e) => onSetCustomFamilyName(e.target.value)}
                placeholder="Ví dụ: Roboto Viet"
                className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-[#181822] border border-neutral-200 dark:border-[#38384a] rounded-lg focus:outline-hidden focus:border-neutral-950 dark:focus:border-amber-400 transition text-neutral-900 dark:text-neutral-100"
              />
              <span className="text-[10px] text-neutral-400 dark:text-neutral-400 block">
                Nên thêm hậu tố "Viet" hoặc "VH"
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-200 block">
                Kiểu dáng (Subfamily):
              </label>
              <input
                type="text"
                value={customSubfamilyName}
                onChange={(e) => onSetCustomSubfamilyName(e.target.value)}
                placeholder="Ví dụ: Regular, Bold..."
                className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-[#181822] border border-neutral-200 dark:border-[#38384a] rounded-lg focus:outline-hidden focus:border-neutral-950 dark:focus:border-amber-400 transition text-neutral-900 dark:text-neutral-100"
              />
              <span className="text-[10px] text-neutral-400 dark:text-neutral-400 block">
                Mặc định: Regular
              </span>
            </div>
          </div>

          {/* Derived Names Preview */}
          <div className="bg-white dark:bg-[#181822] p-2.5 rounded-lg border border-neutral-200/60 dark:border-[#353545] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-neutral-400 dark:text-neutral-400 text-[10px] font-medium block">Full Font Name:</span>
              <p className="font-mono font-bold text-neutral-800 dark:text-neutral-100 truncate">{fullName}</p>
            </div>
            <div>
              <span className="text-neutral-400 dark:text-neutral-400 text-[10px] font-medium block">PostScript Name:</span>
              <p className="font-mono font-bold text-neutral-800 dark:text-neutral-100 truncate">{postscriptName}</p>
            </div>
          </div>
        

        {/* Format Selection for Export */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-700 block">
            Định dạng:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'otf', label: 'OpenType (.otf)'},
              { id: 'ttf', label: 'TrueType (.ttf)'},
              { id: 'woff2', label: 'WebFont (.woff2)'}
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setSelectedFormat(fmt.id as any)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  selectedFormat === fmt.id
                    ? 'bg-neutral-950 dark:bg-amber-500 text-white border-neutral-950 dark:border-amber-400 shadow-2xs font-extrabold'
                    : 'bg-neutral-50 dark:bg-[#20202b] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-[#353545] hover:bg-neutral-100 dark:hover:bg-[#282836]'
                }`}
              >
                <span className="text-xs font-black block">{fmt.label}</span>
                
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-[#2e2e3e]">
          {/* Project load/save group */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                onSaveProject();
                onClose();
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-500/40 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Lưu file cấu hình (.ftn) để mở lại sau này"
            >
              <FolderDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Lưu Dự Án (.ftn)</span>
            </button>

            <button
              type="button"
              onClick={() => projectInputRef.current?.click()}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-[#262634] hover:bg-neutral-200 dark:hover:bg-[#323244] border border-neutral-200 dark:border-[#3a3a4c] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Mở lại file dự án .ftn đã lưu"
            >
              <FolderOpen className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
              <span>Mở Dự Án</span>
            </button>
            <input
              ref={projectInputRef}
              type="file"
              accept=".ftn,application/json"
              onChange={handleProjectFileChange}
              className="hidden"
            />
          </div>

          {/* Export Font Button */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onDownloadFont(selectedFormat);
                onClose();
              }}
              disabled={compiling || !font}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-black text-neutral-950 bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Tải Font .{selectedFormat.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
