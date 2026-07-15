import { useState, useCallback } from 'react';
import * as opentype from 'opentype.js';
import { FontUploader } from './components/FontUploader';
import { VietnameseScanner } from './components/VietnameseScanner';
import { GlyphStudio } from './components/GlyphStudio';
import { FontPlayground } from './components/FontPlayground';
import { GlyphEditState, FontMetadata } from './types';
import { VIETNAMESE_CHARS, VIETNAMESE_BASE_MAP, parseSvgPath, transformCommands } from './utils';
import { Sliders, Sparkles, Download, RefreshCw, HelpCircle, Check, AlertTriangle, FileType } from 'lucide-react';

export default function App() {
  const [originalFont, setOriginalFont] = useState<opentype.Font | null>(null);
  const [rawFontBuffer, setRawFontBuffer] = useState<ArrayBuffer | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<FontMetadata | null>(null);
  const [editedGlyphs, setEditedGlyphs] = useState<Record<string, GlyphEditState>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  
  const [compiledBuffer, setCompiledBuffer] = useState<ArrayBuffer | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [appSuccess, setAppSuccess] = useState<string | null>(null);

  const [customFamilyName, setCustomFamilyName] = useState<string>('');
  const [customSubfamilyName, setCustomSubfamilyName] = useState<string>('');

  // Initialize slot editing states for Vietnamese characters missing in the uploaded font
  const handleFontLoaded = useCallback((loadedFont: opentype.Font, nameOfFile: string, meta: FontMetadata, rawBuffer: ArrayBuffer) => {
    setOriginalFont(loadedFont);
    setRawFontBuffer(rawBuffer);
    setFilename(nameOfFile);
    setMetadata(meta);
    setCompiledBuffer(null);
    setAppError(null);
    setAppSuccess(null);

    setCustomFamilyName(meta.family + ' Viet');
    setCustomSubfamilyName(meta.subfamily || 'Regular');

    const initialStates: Record<string, GlyphEditState> = {};
    
    VIETNAMESE_CHARS.forEach(char => {
      const isMissing = loadedFont.charToGlyphIndex(char) === 0;
      if (isMissing) {
        const base = VIETNAMESE_BASE_MAP[char] || 'a';
        const baseGlyph = loadedFont.charToGlyph(base);
        // Fallback to average font glyph width if base character is absent
        const defaultWidth = baseGlyph ? baseGlyph.advanceWidth : 500;
        
        initialStates[char] = {
          char,
          baseChar: base,
          unicode: char.charCodeAt(0),
          svgPath: '',
          scaleX: 1.0,
          scaleY: 1.0,
          offsetX: 0,
          offsetY: 0,
          flipY: true,
          advanceWidth: defaultWidth,
          useSmartKerning: true,
          manualKerning: [],
          isCompleted: false
        };
      }
    });

    setEditedGlyphs(initialStates);
    setActiveSlot(null);
  }, []);

  const handleReset = useCallback(() => {
    setOriginalFont(null);
    setRawFontBuffer(null);
    setFilename(null);
    setMetadata(null);
    setEditedGlyphs({});
    setActiveSlot(null);
    setCompiledBuffer(null);
    setAppError(null);
    setAppSuccess(null);
    setCustomFamilyName('');
    setCustomSubfamilyName('');
  }, []);

  // Update a specific glyph's scale, offset, width, etc.
  const handleUpdateGlyphState = useCallback((char: string, updated: Partial<GlyphEditState>) => {
    setEditedGlyphs(prev => {
      const state = prev[char];
      if (!state) return prev;
      return {
        ...prev,
        [char]: { ...state, ...updated }
      };
    });
  }, []);

  // Mark the slot as completed
  const handleSaveSlot = useCallback((char: string) => {
    setEditedGlyphs(prev => {
      const state = prev[char];
      if (!state) return prev;
      return {
        ...prev,
        [char]: { ...state, isCompleted: true }
      };
    });
    setAppSuccess(`Đã lưu thiết lập cho ký tự [${char}]. Đừng quên bấm "Cập nhật & Chạy thử" để xem kết quả!`);
    
    // Auto clear success banner after 4 seconds
    setTimeout(() => {
      setAppSuccess(null);
    }, 4000);
  }, []);

  // Reset a slot
  const handleClearSlot = useCallback((char: string) => {
    setEditedGlyphs(prev => {
      const state = prev[char];
      if (!state) return prev;
      return {
        ...prev,
        [char]: {
          ...state,
          svgPath: '',
          scaleX: 1.0,
          scaleY: 1.0,
          offsetX: 0,
          offsetY: 0,
          flipY: true,
          isCompleted: false
        }
      };
    });
    setAppError(`Đã xóa dữ liệu của ký tự [${char}]`);
    setTimeout(() => {
      setAppError(null);
    }, 3000);
  }, []);

  // Core Compiler: Injects user SVG shapes and copies kerning structures
  const handleCompileFont = useCallback(async (downloadAfterCompile = false) => {
    if (!originalFont || !rawFontBuffer) return;
    setCompiling(true);
    setAppError(null);
    setAppSuccess(null);

    try {
      // Modify a clean parsed copy of the loaded font object for maximum safety and compatibility
      // Clone the raw buffer using .slice(0) to prevent any detaching issues across multiple loads/compiles
      const font = opentype.parse(rawFontBuffer.slice(0));

      // Rename font metadata to avoid system font collision/mixing
      if (font.names && customFamilyName) {
        const subfamily = customSubfamilyName || 'Regular';
        const fullName = `${customFamilyName} ${subfamily}`;
        const postScriptName = `${customFamilyName}-${subfamily}`.replace(/[^a-zA-Z0-9-]/g, '');
        const uniqueID = `${customFamilyName} ${subfamily};Version 1.00`;

        const setAllLangs = (nameObj: any, newVal: string) => {
          if (!nameObj) return { en: newVal };
          Object.keys(nameObj).forEach(lang => {
            nameObj[lang] = newVal;
          });
          if (!nameObj.en) {
            nameObj.en = newVal;
          }
          return nameObj;
        };

        const names = font.names as any;
        const platforms = ['unicode', 'macintosh', 'windows'];
        platforms.forEach(platform => {
          if (!names[platform]) {
            names[platform] = {};
          }
          names[platform].fontFamily = setAllLangs(names[platform].fontFamily, customFamilyName);
          names[platform].fontSubfamily = setAllLangs(names[platform].fontSubfamily, subfamily);
          names[platform].fullName = setAllLangs(names[platform].fullName, fullName);
          names[platform].postScriptName = setAllLangs(names[platform].postScriptName, postScriptName);
          names[platform].uniqueID = setAllLangs(names[platform].uniqueID, uniqueID);
          
          if (names[platform].preferredFamily) {
            names[platform].preferredFamily = setAllLangs(names[platform].preferredFamily, customFamilyName);
          }
          if (names[platform].preferredSubfamily) {
            names[platform].preferredSubfamily = setAllLangs(names[platform].preferredSubfamily, subfamily);
          }
        });
      }

      const completedList = (Object.values(editedGlyphs) as GlyphEditState[]).filter(g => g.isCompleted && g.svgPath);

      if (completedList.length === 0 && downloadAfterCompile) {
        setAppError('Chưa có ký tự Việt hóa nào được hoàn thành để đóng gói.');
        setCompiling(false);
        return;
      }

      completedList.forEach(state => {
        const rawCmds = parseSvgPath(state.svgPath);
        const transformed = transformCommands(
          rawCmds,
          state.scaleX,
          state.scaleY,
          state.offsetX,
          state.offsetY,
          state.flipY
        );

        const path = new opentype.Path();
        transformed.forEach(cmd => {
          if (cmd.type === 'M') path.moveTo(cmd.x, cmd.y);
          else if (cmd.type === 'L') path.lineTo(cmd.x, cmd.y);
          else if (cmd.type === 'Q') path.quadTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
          else if (cmd.type === 'C') path.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
          else if (cmd.type === 'Z') path.closePath();
        });

        const existingIndex = font.charToGlyphIndex(state.char);
        const glyphOptions = {
          name: state.char,
          unicode: state.unicode,
          unicodes: [state.unicode],
          advanceWidth: state.advanceWidth,
          path: path
        };

        let targetIndex = existingIndex;

        if (existingIndex > 0) {
          // Overwrite existing slot
          const newGlyph = new opentype.Glyph({
            ...glyphOptions,
            index: existingIndex
          });
          (font.glyphs as any).glyphs[existingIndex] = newGlyph;
        } else {
          // Append new glyph
          const newIndex = font.glyphs.length;
          const newGlyph = new opentype.Glyph({
            ...glyphOptions,
            index: newIndex
          });
          (font.glyphs as any).glyphs[newIndex] = newGlyph;
          font.glyphs.length++;
          targetIndex = newIndex;
        }

        // Smart Kerning Cloner
        if (state.useSmartKerning && targetIndex > 0) {
          const baseIndex = font.charToGlyphIndex(state.baseChar);
          if (baseIndex > 0) {
            if (!font.kerningPairs) {
              font.kerningPairs = {};
            }
            const pairs = font.kerningPairs as Record<string, number>;
            const newPairs: Record<string, number> = {};

            for (const [key, val] of Object.entries(pairs)) {
              const parts = key.split(',');
              if (parts.length !== 2) continue;
              const idx1 = parseInt(parts[0], 10);
              const idx2 = parseInt(parts[1], 10);

              if (idx1 === baseIndex && idx2 === baseIndex) {
                newPairs[`${targetIndex},${targetIndex}`] = val;
                newPairs[`${targetIndex},${baseIndex}`] = val;
                newPairs[`${baseIndex},${targetIndex}`] = val;
              } else if (idx1 === baseIndex) {
                newPairs[`${targetIndex},${idx2}`] = val;
              } else if (idx2 === baseIndex) {
                newPairs[`${idx1},${targetIndex}`] = val;
              }
            }
            Object.assign(pairs, newPairs);
          }
        } else if (!state.useSmartKerning && targetIndex > 0 && state.manualKerning && state.manualKerning.length > 0) {
          // Manual Kerning Builder
          if (!font.kerningPairs) {
            font.kerningPairs = {};
          }
          const pairs = font.kerningPairs as Record<string, number>;
          state.manualKerning.forEach(pair => {
            if (!pair.companion) return;
            const companionIndex = font.charToGlyphIndex(pair.companion);
            if (companionIndex > 0) {
              const leftIndex = pair.isCompanionLeft ? companionIndex : targetIndex;
              const rightIndex = pair.isCompanionLeft ? targetIndex : companionIndex;
              pairs[`${leftIndex},${rightIndex}`] = pair.value;
            }
          });
        }
      });

      // Write font tables to binary OpenType ArrayBuffer
      const buffer = font.toArrayBuffer();
      setCompiledBuffer(buffer);

      if (downloadAfterCompile) {
        const blob = new Blob([buffer], { type: 'font/opentype' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Clean download filename
        const cleanFamilyName = (customFamilyName || 'Vietnamese_Font').replace(/[^a-zA-Z0-9-]/g, '_');
        const extIndex = filename ? filename.lastIndexOf('.') : -1;
        const ext = extIndex !== -1 ? filename?.substring(extIndex) : '.otf';
        
        a.download = `${cleanFamilyName}${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        
        setAppSuccess('Đã đóng gói và tải xuống font thành công!');
      } else {
        setAppSuccess('Đã cập nhật bộ đệm chạy thử! Hãy xem kết quả hiển thị bên dưới.');
      }
    } catch (err: any) {
      console.error(err);
      setAppError('Biên dịch thất bại: ' + (err.message || 'Kiểm tra lại cú pháp vector'));
    } finally {
      setCompiling(false);
    }
  }, [originalFont, rawFontBuffer, editedGlyphs, filename, customFamilyName, customSubfamilyName]);

  const activeState = activeSlot ? editedGlyphs[activeSlot] : null;

  return (
    <div className="min-h-screen bg-neutral-50/40 text-neutral-900 font-sans">
      
      {/* Dynamic Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0">
        {appError && (
          <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-100 text-red-800 text-sm rounded-xl shadow-lg animate-slide-in">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Thông báo</p>
              <p className="text-xs text-red-700/90 mt-0.5">{appError}</p>
            </div>
          </div>
        )}
        {appSuccess && (
          <div className="flex items-start gap-2.5 p-4 bg-green-50 border border-green-100 text-green-800 text-sm rounded-xl shadow-lg animate-slide-in">
            <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Thành công</p>
              <p className="text-xs text-green-700/90 mt-0.5">{appSuccess}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Branding */}
        <header id="app-header" className="border-b border-neutral-200 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-950 tracking-tight font-sans flex items-center gap-2">
              <Sliders className="w-6 h-6 text-neutral-950" />
              Công Cụ Việt Hóa Font
            </h1>
            <p className="text-sm text-neutral-500 mt-1 max-w-xl leading-normal">
              Giải pháp chuyên nghiệp giúp tự động quét, thêm ký tự tiếng Việt có dấu phụ vào font chữ gốc, hỗ trợ copy vector từ AI, căn chỉnh baseline, tự đồng bộ Tracking và Kerning.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg border border-neutral-200/50 text-xs text-neutral-600">
            <HelpCircle className="w-4 h-4" />
            <span>Xử lý 100% trong trình duyệt</span>
          </div>
        </header>

        {/* Step 1: Upload Font */}
        <section id="upload-step-section">
          <FontUploader
            onFontLoaded={handleFontLoaded}
            onReset={handleReset}
            metadata={metadata}
            filename={filename}
          />
        </section>

        {originalFont && (
          <>
            {/* Step 2: Scanner grid slots */}
            <section id="scanner-step-section">
              <VietnameseScanner
                font={originalFont}
                editedGlyphs={editedGlyphs}
                onSelectSlot={setActiveSlot}
                activeSlot={activeSlot}
              />
            </section>

            {/* Step 3: Editor workspace for selected slot */}
            {activeSlot && activeState && (
              <section id="editor-step-section" className="scroll-mt-8 animate-fade-in">
                <GlyphStudio
                  font={originalFont}
                  fontMetadata={metadata!}
                  activeChar={activeSlot}
                  editState={activeState}
                  onUpdateState={handleUpdateGlyphState}
                  onSaveSlot={handleSaveSlot}
                  onClearSlot={handleClearSlot}
                />
              </section>
            )}

            {/* Step 4: Font Playground & Download compilation actions */}
            <section id="compile-and-playground-section" className="space-y-6">
              
              {/* Custom Metadata Rename Card */}
              <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Sliders className="w-5 h-5 text-neutral-800" />
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">
                      Cấu hình Tên Font Việt Hóa
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Đổi tên Font để tránh bị ghi đè, trùng lặp hoặc lẫn lộn với font gốc chưa Việt hóa khi cài đặt vào máy tính.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">Tên Family Font (Font Family Name):</label>
                    <input
                      type="text"
                      value={customFamilyName}
                      onChange={(e) => setCustomFamilyName(e.target.value)}
                      placeholder="Ví dụ: Roboto Viet"
                      className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-lg focus:border-neutral-400 outline-hidden font-semibold text-neutral-800"
                    />
                    <p className="text-[11px] text-neutral-400">
                      Tên nhóm font chính. Khuyên dùng thêm hậu tố như <strong className="font-semibold text-neutral-600">"Viet"</strong> hoặc <strong className="font-semibold text-neutral-600">"VH"</strong>.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 block">Subfamily (Regular/Bold/Italic/etc):</label>
                    <input
                      type="text"
                      value={customSubfamilyName}
                      onChange={(e) => setCustomSubfamilyName(e.target.value)}
                      placeholder="Ví dụ: Regular"
                      className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-lg focus:border-neutral-400 outline-hidden font-semibold text-neutral-800"
                    />
                    <p className="text-[11px] text-neutral-400">
                      Kiểu dáng/định dạng của font. Giữ nguyên theo gốc nếu chỉ Việt hóa 1 style.
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-50/50 p-3.5 rounded-lg border border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-600">
                  <div>
                    <span className="text-neutral-400 font-medium">Full Font Name (Tên đầy đủ):</span>
                    <p className="font-mono font-semibold text-neutral-700 mt-0.5">
                      {customFamilyName} {customSubfamilyName || 'Regular'}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-400 font-medium">PostScript Name (Không khoảng trắng):</span>
                    <p className="font-mono font-semibold text-neutral-700 mt-0.5">
                      {`${customFamilyName}-${customSubfamilyName || 'Regular'}`.replace(/[^a-zA-Z0-9-]/g, '')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Compile & Download Controls Card */}
              <div className="bg-neutral-900 text-neutral-100 p-6 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 border border-neutral-850 shadow-md">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Đóng Gói Bộ Font Việt Hóa
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-md">
                    Biên dịch toàn bộ các ký tự đã được thiết lập bên trên thành một tệp font thống nhất, bảo toàn nguyên vẹn tính năng OpenType và Kerning gốc.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
                  <button
                    id="btn-recompile"
                    onClick={() => handleCompileFont(false)}
                    disabled={compiling}
                    className="flex-1 sm:flex-none py-2.5 px-4 font-semibold text-xs border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 text-white rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-45"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${compiling ? 'animate-spin' : ''}`} />
                    Cập nhật & Chạy thử
                  </button>

                  <button
                    id="btn-download"
                    onClick={() => handleCompileFont(true)}
                    disabled={compiling}
                    className="flex-1 sm:flex-none py-2.5 px-5 font-bold text-xs bg-white text-neutral-900 rounded-lg hover:bg-neutral-100 flex items-center justify-center gap-1.5 transition shadow-xs disabled:opacity-45"
                  >
                    <Download className="w-4 h-4" />
                    Tải Font Mới (.otf / .ttf)
                  </button>
                </div>
              </div>

              {/* Font Playground container */}
              <FontPlayground
                fontBuffer={compiledBuffer}
                fontFamilyName={customFamilyName || 'VietnameseizedFontPreview'}
              />

            </section>
          </>
        )}

        {/* Informative Step Tutorial (When no font loaded yet) */}
        {!originalFont && (
          <section id="instructional-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="bg-white border border-neutral-100 p-5 rounded-xl">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-neutral-950 text-white text-xs font-bold rounded-full mb-3">1</span>
              <h4 className="font-bold text-sm text-neutral-900 mb-1">Tải và Quét Font Gốc</h4>
              <p className="text-xs text-neutral-500 leading-normal">
                Hệ thống tự động giải nén và quét toàn bộ 134 tổ hợp chữ cái tiếng Việt đặc trưng. Sau đó hiển thị danh sách các ký tự bị thiếu hụt.
              </p>
            </div>
            
            <div className="bg-white border border-neutral-100 p-5 rounded-xl">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-neutral-950 text-white text-xs font-bold rounded-full mb-3">2</span>
              <h4 className="font-bold text-sm text-neutral-900 mb-1">Thiết Kế & Cân Chỉnh</h4>
              <p className="text-xs text-neutral-500 leading-normal">
                Bấm vào một ô trống để dán hình vector SVG, điều chỉnh Baseline, khớp X-Height/Cap Height và thiết lập độ rộng Tracking so với chữ gốc.
              </p>
            </div>

            <div className="bg-white border border-neutral-100 p-5 rounded-xl">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-neutral-950 text-white text-xs font-bold rounded-full mb-3">3</span>
              <h4 className="font-bold text-sm text-neutral-900 mb-1">Đồng Bộ & Đóng Gói</h4>
              <p className="text-xs text-neutral-500 leading-normal">
                Đồng bộ Kerning tự động từ chữ cái gốc. Chạy thử bản mẫu trực tuyến bằng bàn phím ảo ngay trong trình duyệt trước khi tải về.
              </p>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
