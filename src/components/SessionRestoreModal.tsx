import React from 'react';
import { RotateCcw, X, FolderOpen, AlertCircle, Sparkles } from 'lucide-react';
import { VietnameseProjectFile } from '../types';

interface SessionRestoreModalProps {
  isOpen: boolean;
  savedSession: VietnameseProjectFile | null;
  onRestore: () => void;
  onDismiss: () => void;
}

export const SessionRestoreModal: React.FC<SessionRestoreModalProps> = ({
  isOpen,
  savedSession,
  onRestore,
  onDismiss
}) => {
  if (!isOpen || !savedSession) return null;

  const savedDate = savedSession.savedAt
    ? new Date(savedSession.savedAt).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : 'Không rõ thời gian';

  const fontName =
    savedSession.customFamilyName ||
    savedSession.fontMetadata?.family ||
    savedSession.filename ||
    'Dự án font cũ';

  return (
    <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div
        className="bg-white dark:bg-[#1b1b24] border border-neutral-200 dark:border-[#353545] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in text-neutral-900 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            
            <div>
              <h2 className="text-base font-bold tracking-tight">Khôi phục phiên làm việc?</h2>
              
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2e2e3e] rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5 text-xs">
          <p className="text-neutral-600 dark:text-neutral-300">
            Hệ thống phát hiện phiên làm việc trước đó được lưu tự động trong trình duyệt:
          </p>

          <div className="p-3 bg-neutral-50 dark:bg-[#22222e] border border-neutral-200/80 dark:border-[#3a3a4c] rounded-xl space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-400 font-sans">Tệp font:</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{fontName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400 font-sans">Thời điểm lưu:</span>
              <span className="text-neutral-700 dark:text-neutral-300">{savedDate}</span>
            </div>
            {savedSession.customGlyphDesigns && Object.keys(savedSession.customGlyphDesigns).length > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-400 font-sans">Ký tự tùy biến:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  {Object.keys(savedSession.customGlyphDesigns).length} glyphs
                </span>
              </div>
            )}
          </div>

          <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
            Bạn có muốn khôi phục toàn bộ dấu mẫu, thông số căn chỉnh, ký tự edit và kerning đã thiết lập để tiếp tục làm việc không?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3.5 flex flex-between items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-2 text-neutral-600 hover:text-neutral-900  hover:bg-neutral-100 font-bold rounded-xl transition cursor-pointer"
          >
            Bỏ qua
          </button>
          <button
            type="button"
            onClick={onRestore}
            className="py-2 px-3 bg-neutral-950 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-400 text-amber-400 dark:text-white border border-neutral-900 dark:border-amber-400 font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw  className="w-4 h-4" />
            <span>Khôi phục</span>
          </button>
        </div>
      </div>
    </div>
  );
};
