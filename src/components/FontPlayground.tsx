import React, { useEffect, useState } from 'react';
import { Type, ArrowRight, Play } from 'lucide-react';

interface FontPlaygroundProps {
  fontBuffer: ArrayBuffer | null;
  fontFamilyName?: string;
}

const DEFAULT_SENTENCE = 'Chưng cất rượu nếp thơm lừng hoặc giã giò lụa truyền thống. Đất nước Việt Nam vạn dặm gấm vóc, núi sông hùng vĩ chứa chan nghĩa tình. 1234567890!';

export const FontPlayground: React.FC<FontPlaygroundProps> = ({
  fontBuffer,
  fontFamilyName = 'VietnameseizedFontPreview'
}) => {
  const [inputText, setInputText] = useState(DEFAULT_SENTENCE);
  const [fontSize, setFontSize] = useState(32);
  const [fontRegistered, setFontRegistered] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!fontBuffer) {
      setFontRegistered(false);
      return;
    }

    const registerFont = async () => {
      try {
        setLoadError(null);
        // Create custom FontFace
        const fontFace = new FontFace(fontFamilyName, fontBuffer);
        const loadedFace = await fontFace.load();
        
        // Add to document
        document.fonts.add(loadedFace);
        setFontRegistered(true);
        console.log(`Successfully registered dynamic font face: ${fontFamilyName}`);
      } catch (err: any) {
        console.error('FontFace registration failed', err);
        setLoadError('Không thể nạp font vào trình duyệt để chạy thử: ' + (err.message || 'Lỗi không xác định'));
        setFontRegistered(false);
      }
    };

    registerFont();
  }, [fontBuffer, fontFamilyName]);

  return (
    <div id="font-playground-panel" className="bg-white border border-neutral-100 rounded-xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-100 pb-4 mb-4 gap-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Type className="w-5 h-5 text-neutral-800" />
            Vùng Chạy Thử Font Chữ (Live Playground)
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gõ văn bản tiếng Việt bất kỳ dưới đây để kiểm tra trực tiếp các nét Việt hóa, độ rộng và kerning của font.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5">
          {fontRegistered ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
              Đã nạp font thành công
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 text-neutral-500 text-xs font-semibold rounded-full border border-neutral-200">
              Đang đợi xuất bản font...
            </span>
          )}
        </div>
      </div>

      {loadError && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs border border-red-100 rounded-lg">
          {loadError}
        </div>
      )}

      {/* Font Size & Presets bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4 bg-neutral-50 p-3 rounded-lg border border-neutral-100/60">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-neutral-600 font-medium">Cỡ chữ:</span>
          <input
            id="slider-playground-font-size"
            type="range"
            min="12"
            max="120"
            step="1"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="accent-neutral-800 w-32 sm:w-48"
          />
          <span className="text-xs text-neutral-700 font-mono font-bold">{fontSize}px</span>
        </div>

        {/* Quick Sentences */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-neutral-600 font-medium shrink-0">Mẫu:</span>
          <button
            onClick={() => setInputText('Chưng cất rượu nếp thơm lừng hoặc giã giò lụa truyền thống.')}
            className="text-[10px] bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium py-1 px-2 rounded-sm shrink-0"
          >
            Đầy đủ dấu phụ
          </button>
          <button
            onClick={() => setInputText('ÁĂÂÈÉÊÌÍÒÓÔƠÙÚƯÝ Đ / áăâèéêìíòóôơùúưý đ')}
            className="text-[10px] bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium py-1 px-2 rounded-sm shrink-0"
          >
            Bảng Việt hóa
          </button>
          <button
            onClick={() => setInputText('Trăm năm trong cõi người ta, chữ tài chữ mệnh khéo là ghét nhau.')}
            className="text-[10px] bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium py-1 px-2 rounded-sm shrink-0"
          >
            Truyện Kiều
          </button>
        </div>
      </div>

      {/* Main interactive area split into input and output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Input Textarea */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-neutral-700 block">Văn bản kiểm thử:</span>
          <textarea
            id="playground-input-area"
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Gõ đoạn văn bản kiểm tra độ giãn chữ, khoảng cách và độ cao..."
            className="w-full text-sm p-4 border border-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-neutral-800 rounded-xl"
          />
        </div>

        {/* Right: Live Font Render */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-neutral-700 block">Khu vực hiển thị thực tế (Kéo góc dưới bên phải để chỉnh chiều cao):</span>
          <div 
            id="playground-rendering-box"
            className="w-full h-[122px] min-h-[122px] max-h-[600px] p-4 bg-neutral-50 border border-neutral-200 rounded-xl overflow-y-auto break-words leading-relaxed resize-y shadow-inner"
            style={{
              fontFamily: fontRegistered ? `"${fontFamilyName}", sans-serif` : 'sans-serif',
              fontSize: `${fontSize}px`,
              transition: 'font-size 0.1s ease'
            }}
          >
            {inputText || <span className="text-neutral-400 italic">Nhập chữ để kiểm tra hiển thị...</span>}
          </div>
        </div>
      </div>
      
      {!fontRegistered && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50/50 p-2.5 border border-amber-100 rounded-lg">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
          <span>Hãy lưu ít nhất 1 ký tự Việt hóa hoặc bấm nút <strong>"Cập nhật & Chạy thử font mới"</strong> phía dưới để xem kết quả chạy thử trực tiếp.</span>
        </div>
      )}
    </div>
  );
};
