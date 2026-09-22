import React, { useEffect, useState } from 'react';
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Moon,
  Sun,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface StudioFooterPlaygroundProps {
  fontBuffer: ArrayBuffer | null;
  fontFamilyName?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const DEFAULT_SENTENCE =
  'Chưng cất rượu nếp thơm lừng hoặc giã giò lụa truyền thống. Đất nước Việt Nam vạn dặm gấm vóc, núi sông hùng vĩ chứa chan nghĩa tình. 1234567890!';

export const StudioFooterPlayground: React.FC<StudioFooterPlaygroundProps> = ({
  fontBuffer,
  fontFamilyName = 'VietnameseizedFontPreview',
  isCollapsed,
  onToggleCollapse
}) => {
  const [inputText, setInputText] = useState(DEFAULT_SENTENCE);
  const [fontSize, setFontSize] = useState(32);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [bgTheme, setBgTheme] = useState<'light' | 'dark' | 'paper' | 'black'>(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setBgTheme(isDark ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [fontRegistered, setFontRegistered] = useState(false);
  const [activeFamilyName, setActiveFamilyName] = useState(fontFamilyName);

  // Register font face in the browser
  useEffect(() => {
    if (!fontBuffer) {
      setFontRegistered(false);
      return;
    }

    const registerFont = async () => {
      try {
        const uniqueName = `${fontFamilyName}_v${Date.now()}`;
        // Create a copy of the buffer to prevent any detached ArrayBuffer issues
        const bufferCopy = fontBuffer.slice(0);
        const fontFace = new FontFace(uniqueName, bufferCopy);
        const loadedFace = await fontFace.load();

        try {
          const toRemove: FontFace[] = [];
          document.fonts.forEach((face) => {
            if (face.family.startsWith(fontFamilyName + '_v') || face.family === fontFamilyName) {
              toRemove.push(face);
            }
          });
          toRemove.forEach((face) => {
            document.fonts.delete(face);
          });
        } catch (cleanErr) {
          console.warn('Error cleaning up previous dynamic fonts:', cleanErr);
        }

        document.fonts.add(loadedFace);
        setActiveFamilyName(uniqueName);
        setFontRegistered(true);
      } catch (err: any) {
        console.error('FontFace registration failed', err);
        setFontRegistered(false);
      }
    };

    registerFont();
  }, [fontBuffer, fontFamilyName]);

  const getThemeClasses = () => {
    switch (bgTheme) {
      case 'dark':
        return 'bg-neutral-900 text-neutral-100 border-neutral-800 dark:border-[#3a3a4c] placeholder:text-neutral-500';
      case 'black':
        return 'bg-black text-amber-300 border-neutral-900 placeholder:text-neutral-700';
      case 'paper':
        return 'bg-[#FAF6EE] text-[#2C2621] border-[#EADFCB] placeholder:text-neutral-400';
      case 'light':
      default:
        return 'bg-neutral-50 text-neutral-900 border-neutral-200 dark:border-[#383848] placeholder:text-neutral-400 dark:placeholder:text-neutral-500';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1b1b24] border-t border-neutral-200 dark:border-[#2e2e3e] overflow-hidden text-neutral-900 dark:text-neutral-100">
      {/* Footer Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-neutral-100 dark:border-[#2b2b3a] bg-neutral-50/80 dark:bg-[#20202a] shrink-0">
                    
        <div className="flex items-center gap-2">
         {fontRegistered ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-200 dark:border-emerald-500/40">
              <span
              id="font-status-dot"
              className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse]" />
              Font đã nạp
            </span>
          ) : (
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 italic">
              Chưa nạp font
            </span>
          )}

          <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-300 bg-neutral-200/70 dark:bg-[#2d2d3c] px-1.5 py-0.5 rounded">
            {inputText.length} ký tự
          </span>
          
        </div>

        {/* Compact Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Font Size slider */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#282834] px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-[#3a3a4c] text-[11px]">
            <input
              type="range"
              min="14"
              max="150"
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="w-16 accent-neutral-900 dark:accent-amber-500 cursor-pointer h-1 bg-neutral-200 dark:bg-neutral-700 rounded"
            />
            <span className="font-mono text-neutral-900 dark:text-neutral-100 font-bold w-9 text-right">{fontSize}px</span>
          </div>

          {/* Quick Presets */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setInputText(
                  'Chưng cất rượu nếp thơm lừng hoặc giã giò lụa truyền thống. Đất nước Việt Nam vạn dặm gấm vóc.'
                )
              }
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white dark:bg-[#282834] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#343444] border border-neutral-200 dark:border-[#3a3a4c] transition cursor-pointer"
            >
              Tiêu chuẩn
            </button>
            <button
              type="button"
              onClick={() =>
                setInputText(
                  'ÁĂÂÈÉÊÌÍÒÓÔƠÙÚƯÝ Đ áăâèéêìíòóôơùúưý đ ảẻỉỏủỷ ãẽĩõũỹ ạẹịọụỵ ầấẩẫậ ằắẳẵặ ềếểễệ ồốổỗộ ờớởỡợ ừứửữự'
                )
              }
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white dark:bg-[#282834] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#343444] border border-neutral-200 dark:border-[#3a3a4c] transition cursor-pointer"
            >
              134 ký tự
            </button>
            <button
              type="button"
              onClick={() => setInputText('VIỆT NAM HÙNG CƯỜNG - TỰ DO - HẠNH PHÚC 2026')}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white dark:bg-[#282834] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#343444] border border-neutral-200 dark:border-[#3a3a4c] transition cursor-pointer"
            >
              IN HOA
            </button>
          </div>

          {/* Align */}
          <div className="flex items-center bg-white dark:bg-[#282834] rounded-lg border border-neutral-200 dark:border-[#3a3a4c] p-0.5">
            <button
              type="button"
              onClick={() => setTextAlign('left')}
              className={`p-1 rounded transition cursor-pointer ${
                textAlign === 'left' 
                  ? 'bg-neutral-200 dark:bg-amber-500 text-neutral-950 dark:text-neutral-950 font-bold' 
                  : 'text-neutral-400 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              <AlignLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setTextAlign('center')}
              className={`p-1 rounded transition cursor-pointer ${
                textAlign === 'center' 
                  ? 'bg-neutral-200 dark:bg-amber-500 text-neutral-950 dark:text-neutral-950 font-bold' 
                  : 'text-neutral-400 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              <AlignCenter className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setTextAlign('right')}
              className={`p-1 rounded transition cursor-pointer ${
                textAlign === 'right' 
                  ? 'bg-neutral-200 dark:bg-amber-500 text-neutral-950 dark:text-neutral-950 font-bold' 
                  : 'text-neutral-400 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              <AlignRight className="w-3 h-3" />
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => setBgTheme(bgTheme === 'dark' ? 'light' : 'dark')}
            className="p-1 rounded-lg bg-white dark:bg-[#282834] border border-neutral-200 dark:border-[#3a3a4c] text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
            title={bgTheme === 'dark' ? 'Chuyển sang nền Sáng' : 'Chuyển sang nền Tối'}
          >
            {bgTheme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-neutral-500 dark:text-amber-400" />
            )}
          </button>

          {/* Collapse / Expand */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-[#2f2f3e] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
            title={isCollapsed ? 'Mở rộng bảng gõ thử' : 'Thu gọn bảng gõ thử'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Direct Interactive Display Box */}
      {!isCollapsed && (
        <div className="flex-1 p-2 bg-neutral-100 dark:bg-[#171720] overflow-hidden">
          <textarea
            id="playground-preview-textarea"
            data-preview-theme={bgTheme}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Gõ trực tiếp văn bản tiếng Việt vào đây để kiểm tra..."
            spellCheck={false}
            className={`w-full h-full p-4 border rounded-xl overflow-y-auto break-words resize-none shadow-inner transition-colors duration-200 outline-none focus:ring-1 focus:ring-amber-400 ${getThemeClasses()}`}
            style={{
              fontFamily: fontRegistered ? `"${activeFamilyName}", sans-serif` : 'sans-serif',
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              textAlign: textAlign,
              fontWeight: 400,
              fontSynthesis: 'none',
              WebkitTextStroke: '0px',
              textShadow: 'none',
              fontKerning: 'normal',
              fontFeatureSettings: '"kern" 1, "liga" 1',
              WebkitFontFeatureSettings: '"kern" 1, "liga" 1'
            }}
          />
        </div>
      )}
    </div>
  );
};
