import React, { useRef, useState } from 'react';
import * as opentype from 'opentype.js';
import { Upload, FileType, CheckCircle, Info } from 'lucide-react';
import { FontMetadata } from '../types';

interface FontUploaderProps {
  onFontLoaded: (font: opentype.Font, filename: string, metadata: FontMetadata, rawBuffer: ArrayBuffer) => void;
  onReset: () => void;
  metadata: FontMetadata | null;
  filename: string | null;
}

// Helper to safely retrieve localized font name strings across flat and platform-specific formats in opentype.js
const getFontName = (font: any, key: string, defaultValue: string): string => {
  if (!font || !font.names) return defaultValue;
  
  // 1. Check flat structure first (e.g., font.names.fontFamily)
  const flatObj = font.names[key];
  if (flatObj) {
    if (typeof flatObj === 'string') return flatObj;
    if (flatObj.en) return flatObj.en;
    if (flatObj.vi) return flatObj.vi;
    const langKeys = Object.keys(flatObj);
    if (langKeys.length > 0) {
      const val = flatObj[langKeys[0]];
      if (typeof val === 'string') return val;
      if (val && typeof val === 'object') {
        const subKeys = Object.keys(val);
        if (subKeys.length > 0) return val[subKeys[0]];
      }
    }
  }

  // 2. Check platform-specific structures (e.g., font.names.windows.fontFamily)
  const platforms = ['windows', 'macintosh'];
  for (const plat of platforms) {
    const platObj = font.names[plat]?.[key];
    if (platObj) {
      if (typeof platObj === 'string') return platObj;
      if (platObj.en) return platObj.en;
      if (platObj.vi) return platObj.vi;
      const langKeys = Object.keys(platObj);
      if (langKeys.length > 0) {
        const val = platObj[langKeys[0]];
        if (typeof val === 'string') return val;
        if (val && typeof val === 'object') {
          const subKeys = Object.keys(val);
          if (subKeys.length > 0) return val[subKeys[0]];
        }
      }
    }
  }

  return defaultValue;
};

export const FontUploader: React.FC<FontUploaderProps> = ({
  onFontLoaded,
  onReset,
  metadata,
  filename
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.otf') && !file.name.endsWith('.ttf')) {
      setError('Vui lòng tải lên file font định dạng .otf hoặc .ttf');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const font = opentype.parse(buffer);
          
          // Retrieve metadata safely
          const family = getFontName(font, 'fontFamily', 'Không rõ');
          const subfamily = getFontName(font, 'fontSubfamily', 'Regular');
          const name = getFontName(font, 'fullName', `${family} ${subfamily}`);
          
          // Safely fetch unitsPerEm
          const unitsPerEm = font.unitsPerEm || font.tables?.head?.unitsPerEm || 1000;

          // Safely fetch capHeight and xHeight, or default based on ascender
          let capHeight = 700;
          let xHeight = 500;
          if (font.tables.os2) {
            if (font.tables.os2.sCapHeight) capHeight = font.tables.os2.sCapHeight;
            if (font.tables.os2.sxHeight) xHeight = font.tables.os2.sxHeight;
          }

          const fontMetadata: FontMetadata = {
            name,
            family,
            subfamily,
            unitsPerEm,
            ascender: font.ascender || 1000,
            descender: font.descender || -200,
            capHeight,
            xHeight,
            totalGlyphs: font.glyphs ? font.glyphs.length : 0
          };

          onFontLoaded(font, file.name, fontMetadata, buffer);
        } catch (parseError) {
          console.error(parseError);
          setError('Không thể đọc file font này. File có thể bị hỏng hoặc không đúng định dạng OpenType/TrueType.');
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Đã xảy ra lỗi khi đọc file.');
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi không xác định.');
      setLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="w-full">
      {!metadata ? (
        <div
          id="font-dropzone"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? 'border-neutral-800 bg-neutral-50 dark:bg-neutral-900/10'
              : 'border-neutral-200 hover:border-neutral-400 bg-white dark:bg-neutral-950/20'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".otf,.ttf"
            className="hidden"
          />
          
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110">
            <Upload className="w-8 h-8 text-neutral-500" />
          </div>

          <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-1">
            {loading ? 'Đang phân tích font...' : 'Tải lên font của bạn'}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mb-4">
            Kéo và thả file font <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">.OTF</span> hoặc <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">.TTF</span> của bạn vào đây, hoặc click để duyệt file.
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-50 dark:bg-neutral-900 rounded-full border border-neutral-100 text-xs text-neutral-500">
            <FileType className="w-3.5 h-3.5" />
            <span>Hỗ trợ OpenType & TrueType Font</span>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/25 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg max-w-md">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div id="font-metadata-panel" className="bg-white border border-neutral-100 rounded-xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-100 pb-4 mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-neutral-50 rounded-lg">
                <FileType className="w-6 h-6 text-neutral-800" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-950">{metadata.name}</h3>
                <p className="text-xs text-neutral-500 font-mono flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  File: {filename}
                </p>
              </div>
            </div>
            
            <button
              id="btn-font-reset"
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-lg transition-all duration-200"
            >
              Chọn font khác
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 bg-neutral-50/50 rounded-lg border border-neutral-100/50">
              <span className="block text-xs text-neutral-500 font-medium mb-1">Family</span>
              <span className="font-semibold text-sm text-neutral-800">{metadata.family}</span>
            </div>
            <div className="p-3.5 bg-neutral-50/50 rounded-lg border border-neutral-100/50">
              <span className="block text-xs text-neutral-500 font-medium mb-1">Subfamily</span>
              <span className="font-semibold text-sm text-neutral-800">{metadata.subfamily}</span>
            </div>
            <div className="p-3.5 bg-neutral-50/50 rounded-lg border border-neutral-100/50">
              <span className="block text-xs text-neutral-500 font-medium mb-1">Units Per Em</span>
              <span className="font-semibold text-sm text-neutral-800 font-mono">{metadata.unitsPerEm} UPM</span>
            </div>
            <div className="p-3.5 bg-neutral-50/50 rounded-lg border border-neutral-100/50">
              <span className="block text-xs text-neutral-500 font-medium mb-1">Tổng số ký tự gốc</span>
              <span className="font-semibold text-sm text-neutral-800 font-mono">{metadata.totalGlyphs} ký tự</span>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 bg-neutral-50 border border-neutral-100 rounded-lg">
            <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-600 space-y-1">
              <p>
                <strong>Hệ tọa độ Font:</strong> Đường baseline ở mức <span className="font-mono">Y = 0</span>. Các chỉ số tham chiếu: 
                Ascender = <span className="font-mono">+{metadata.ascender}</span>, 
                Descender = <span className="font-mono">{metadata.descender}</span>, 
                Cap Height = <span className="font-mono">+{metadata.capHeight}</span>, 
                X Height = <span className="font-mono">+{metadata.xHeight}</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
