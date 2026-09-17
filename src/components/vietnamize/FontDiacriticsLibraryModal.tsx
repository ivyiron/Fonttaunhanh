import React, { useState } from 'react';
import * as opentype from 'opentype.js';
import { Search, X, Sparkles, Copy, Code, Check } from 'lucide-react';
import { DiacriticTemplate } from '../../types';
import {
  getNativeCharSvgPath,
  getNativeCharFullSvg,
  getExtractedDiacriticSvgPathFromChar
} from '../../utils';

interface FontDiacriticsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  font: opentype.Font;
  templates: Record<string, DiacriticTemplate>;
  onApplySvgToTemplate?: (diaId: string, svgPath: string) => void;
}

const VIETNAMESE_CHAR_LIST = [
  { char: 'á', base: 'a', type: 'acute', label: 'a sắc' },
  { char: 'à', base: 'a', type: 'grave', label: 'a huyền' },
  { char: 'ả', base: 'a', type: 'hook', label: 'a hỏi' },
  { char: 'ã', base: 'a', type: 'tilde', label: 'a ngã' },
  { char: 'ạ', base: 'a', type: 'dot_below', label: 'a nặng' },
  { char: 'â', base: 'a', type: 'circumflex', label: 'a nón' },
  { char: 'ấ', base: 'â', type: 'acute', label: 'â sắc' },
  { char: 'ầ', base: 'â', type: 'grave', label: 'â huyền' },
  { char: 'ẩ', base: 'â', type: 'hook', label: 'â hỏi' },
  { char: 'ẫ', base: 'â', type: 'tilde', label: 'â ngã' },
  { char: 'ậ', base: 'â', type: 'dot_below', label: 'â nặng' },
  { char: 'ă', base: 'a', type: 'breve', label: 'a trăng' },
  { char: 'ắ', base: 'ă', type: 'acute', label: 'ă sắc' },
  { char: 'ằ', base: 'ă', type: 'grave', label: 'ă huyền' },
  { char: 'ẳ', base: 'ă', type: 'hook', label: 'ă hỏi' },
  { char: 'ẵ', base: 'ă', type: 'tilde', label: 'ă ngã' },
  { char: 'ặ', base: 'ă', type: 'dot_below', label: 'ă nặng' },
  { char: 'é', base: 'e', type: 'acute', label: 'e sắc' },
  { char: 'è', base: 'e', type: 'grave', label: 'e huyền' },
  { char: 'ẻ', base: 'e', type: 'hook', label: 'e hỏi' },
  { char: 'ẽ', base: 'e', type: 'tilde', label: 'e ngã' },
  { char: 'ẹ', base: 'e', type: 'dot_below', label: 'e nặng' },
  { char: 'ê', base: 'e', type: 'circumflex', label: 'e nón' },
  { char: 'ế', base: 'ê', type: 'acute', label: 'ê sắc' },
  { char: 'ề', base: 'ê', type: 'grave', label: 'ê huyền' },
  { char: 'ể', base: 'ê', type: 'hook', label: 'ê hỏi' },
  { char: 'ễ', base: 'ê', type: 'tilde', label: 'ễ ngã' },
  { char: 'ệ', base: 'ê', type: 'dot_below', label: 'ệ nặng' },
  { char: 'í', base: 'i', type: 'acute', label: 'i sắc' },
  { char: 'ì', base: 'i', type: 'grave', label: 'i huyền' },
  { char: 'ỉ', base: 'i', type: 'hook', label: 'i hỏi' },
  { char: 'ĩ', base: 'i', type: 'tilde', label: 'i ngã' },
  { char: 'ị', base: 'i', type: 'dot_below', label: 'i nặng' },
  { char: 'ó', base: 'o', type: 'acute', label: 'o sắc' },
  { char: 'ò', base: 'o', type: 'grave', label: 'o huyền' },
  { char: 'ỏ', base: 'o', type: 'hook', label: 'o hỏi' },
  { char: 'õ', base: 'o', type: 'tilde', label: 'o ngã' },
  { char: 'ọ', base: 'o', type: 'dot_below', label: 'o nặng' },
  { char: 'ô', base: 'o', type: 'circumflex', label: 'o nón' },
  { char: 'ố', base: 'ô', type: 'acute', label: 'ô sắc' },
  { char: 'ồ', base: 'ô', type: 'grave', label: 'ô huyền' },
  { char: 'ổ', base: 'ô', type: 'hook', label: 'ô hỏi' },
  { char: 'ỗ', base: 'ô', type: 'tilde', label: 'ô ngã' },
  { char: 'ộ', base: 'ô', type: 'dot_below', label: 'ô nặng' },
  { char: 'ơ', base: 'o', type: 'horn', label: 'o móc' },
  { char: 'ớ', base: 'ơ', type: 'acute', label: 'ơ sắc' },
  { char: 'ờ', base: 'ơ', type: 'grave', label: 'ơ huyền' },
  { char: 'ở', base: 'ơ', type: 'hook', label: 'ơ hỏi' },
  { char: 'ỡ', base: 'ơ', type: 'tilde', label: 'ơ ngã' },
  { char: 'ợ', base: 'ơ', type: 'dot_below', label: 'ơ nặng' },
  { char: 'ú', base: 'u', type: 'acute', label: 'u sắc' },
  { char: 'ù', base: 'u', type: 'grave', label: 'u huyền' },
  { char: 'ủ', base: 'u', type: 'hook', label: 'u hỏi' },
  { char: 'ũ', base: 'u', type: 'tilde', label: 'u ngã' },
  { char: 'ụ', base: 'u', type: 'dot_below', label: 'u nặng' },
  { char: 'ư', base: 'u', type: 'horn', label: 'u móc' },
  { char: 'ứ', base: 'ư', type: 'acute', label: 'ư sắc' },
  { char: 'ừ', base: 'ư', type: 'grave', label: 'ư huyền' },
  { char: 'ử', base: 'ư', type: 'hook', label: 'ư hỏi' },
  { char: 'ữ', base: 'ư', type: 'tilde', label: 'ư ngã' },
  { char: 'ự', base: 'ư', type: 'dot_below', label: 'ư nặng' },
  { char: 'ý', base: 'y', type: 'acute', label: 'y sắc' },
  { char: 'ỳ', base: 'y', type: 'grave', label: 'y huyền' },
  { char: 'ỷ', base: 'y', type: 'hook', label: 'y hỏi' },
  { char: 'ỹ', base: 'y', type: 'tilde', label: 'y ngã' },
  { char: 'ỵ', base: 'y', type: 'dot_below', label: 'y nặng' },
  { char: 'đ', base: 'd', type: 'bar', label: 'd gạch' },

  // Uppercase
  { char: 'Á', base: 'A', type: 'acute', label: 'A sắc' },
  { char: 'À', base: 'A', type: 'grave', label: 'A huyền' },
  { char: 'Ả', base: 'A', type: 'hook', label: 'A hỏi' },
  { char: 'Ã', base: 'A', type: 'tilde', label: 'A ngã' },
  { char: 'Ạ', base: 'A', type: 'dot_below', label: 'A nặng' },
  { char: 'Â', base: 'A', type: 'circumflex', label: 'A nón' },
  { char: 'Ấ', base: 'Â', type: 'acute', label: 'Â sắc' },
  { char: 'Ầ', base: 'Â', type: 'grave', label: 'Â huyền' },
  { char: 'Ẩ', base: 'Â', type: 'hook', label: 'Â hỏi' },
  { char: 'Ẫ', base: 'Â', type: 'tilde', label: 'Â ngã' },
  { char: 'Ậ', base: 'Â', type: 'dot_below', label: 'Â nặng' },
  { char: 'Ă', base: 'A', type: 'breve', label: 'A trăng' },
  { char: 'Ắ', base: 'Ă', type: 'acute', label: 'Ă sắc' },
  { char: 'Ằ', base: 'Ă', type: 'grave', label: 'Ă huyền' },
  { char: 'Ẳ', base: 'Ă', type: 'hook', label: 'Ă hỏi' },
  { char: 'Ẵ', base: 'Ă', type: 'tilde', label: 'Ă ngã' },
  { char: 'Ặ', base: 'Ă', type: 'dot_below', label: 'Ă nặng' },
  { char: 'É', base: 'E', type: 'acute', label: 'E sắc' },
  { char: 'È', base: 'E', type: 'grave', label: 'E huyền' },
  { char: 'Ẻ', base: 'E', type: 'hook', label: 'E hỏi' },
  { char: 'Ẽ', base: 'E', type: 'tilde', label: 'E ngã' },
  { char: 'Ẹ', base: 'E', type: 'dot_below', label: 'E nặng' },
  { char: 'Ê', base: 'E', type: 'circumflex', label: 'E nón' },
  { char: 'Ế', base: 'Ê', type: 'acute', label: 'Ê sắc' },
  { char: 'Ề', base: 'Ê', type: 'grave', label: 'Ê huyền' },
  { char: 'Ể', base: 'Ê', type: 'hook', label: 'Ê hỏi' },
  { char: 'Ễ', base: 'Ê', type: 'tilde', label: 'Ễ ngã' },
  { char: 'Ệ', base: 'Ê', type: 'dot_below', label: 'Ệ nặng' },
  { char: 'Í', base: 'I', type: 'acute', label: 'I sắc' },
  { char: 'Ì', base: 'I', type: 'grave', label: 'I huyền' },
  { char: 'Ỉ', base: 'I', type: 'hook', label: 'I hỏi' },
  { char: 'Ĩ', base: 'I', type: 'tilde', label: 'I ngã' },
  { char: 'Ị', base: 'I', type: 'dot_below', label: 'I nặng' },
  { char: 'Ó', base: 'O', type: 'acute', label: 'O sắc' },
  { char: 'Ò', base: 'O', type: 'grave', label: 'O huyền' },
  { char: 'Ỏ', base: 'O', type: 'hook', label: 'O hỏi' },
  { char: 'Õ', base: 'O', type: 'tilde', label: 'O ngã' },
  { char: 'Ọ', base: 'O', type: 'dot_below', label: 'O nặng' },
  { char: 'Ô', base: 'O', type: 'circumflex', label: 'O nón' },
  { char: 'Ố', base: 'Ô', type: 'acute', label: 'Ô sắc' },
  { char: 'Ồ', base: 'Ô', type: 'grave', label: 'Ô huyền' },
  { char: 'Ổ', base: 'Ô', type: 'hook', label: 'Ô hỏi' },
  { char: 'Ỗ', base: 'Ô', type: 'tilde', label: 'Ô ngã' },
  { char: 'Ộ', base: 'Ô', type: 'dot_below', label: 'Ô nặng' },
  { char: 'Ơ', base: 'O', type: 'horn', label: 'O móc' },
  { char: 'Ớ', base: 'Ơ', type: 'acute', label: 'Ơ sắc' },
  { char: 'Ờ', base: 'Ơ', type: 'grave', label: 'Ơ huyền' },
  { char: 'Ở', base: 'Ơ', type: 'hook', label: 'Ơ hỏi' },
  { char: 'Ỡ', base: 'Ơ', type: 'tilde', label: 'Ơ ngã' },
  { char: 'Ợ', base: 'Ơ', type: 'dot_below', label: 'Ơ nặng' },
  { char: 'Ú', base: 'U', type: 'acute', label: 'U sắc' },
  { char: 'Ù', base: 'U', type: 'grave', label: 'U huyền' },
  { char: 'Ủ', base: 'U', type: 'hook', label: 'U hỏi' },
  { char: 'Ũ', base: 'U', type: 'tilde', label: 'U ngã' },
  { char: 'Ụ', base: 'U', type: 'dot_below', label: 'U nặng' },
  { char: 'Ư', base: 'U', type: 'horn', label: 'U móc' },
  { char: 'Ứ', base: 'Ư', type: 'acute', label: 'Ư sắc' },
  { char: 'Ừ', base: 'Ư', type: 'grave', label: 'Ư huyền' },
  { char: 'Ử', base: 'Ư', type: 'hook', label: 'Ư hỏi' },
  { char: 'Ữ', base: 'Ư', type: 'tilde', label: 'Ư ngã' },
  { char: 'Ự', base: 'Ư', type: 'dot_below', label: 'Ư nặng' },
  { char: 'Ý', base: 'Y', type: 'acute', label: 'Y sắc' },
  { char: 'Ỳ', base: 'Y', type: 'grave', label: 'Y huyền' },
  { char: 'Ỷ', base: 'Y', type: 'hook', label: 'Y hỏi' },
  { char: 'Ỹ', base: 'Y', type: 'tilde', label: 'Y ngã' },
  { char: 'Ỵ', base: 'Y', type: 'dot_below', label: 'Y nặng' },
  { char: 'Đ', base: 'D', type: 'bar', label: 'D gạch' }
];

export const FontDiacriticsLibraryModal: React.FC<FontDiacriticsLibraryModalProps> = ({
  isOpen,
  onClose,
  font,
  templates,
  onApplySvgToTemplate
}) => {
  if (!isOpen || !font) return null;

  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const triggerCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyToast(`Đã sao chép: ${label}`);
    setTimeout(() => setCopyToast(null), 3000);
  };

  const availableItems = VIETNAMESE_CHAR_LIST.filter((item) => {
    const idx = font.charToGlyphIndex(item.char);
    if (idx <= 0) return false;
    const g = font.glyphs.get(idx);
    return g && g.path && g.path.commands && g.path.commands.length > 0;
  });

  const filteredItems = availableItems.filter((item) => {
    if (activeTab !== 'all' && item.type !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.char.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-5xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in text-neutral-900">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-3">
           
            <div>
              <h3 className="text-base font-extrabold text-neutral-950">
                Thư Viện Dấu Có Sẵn Trong Font ({availableItems.length})
              </h3>
              <p className="text-xs text-neutral-500">
                Font gốc có các nét dấu dưới đây. Bạn có thể copy mã SVG Path hoặc nạp trực tiếp làm mẫu dấu chuẩn.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 px-6 border-b border-neutral-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white">
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'acute', label: 'Sắc' },
              { id: 'grave', label: 'Huyền' },
              { id: 'hook', label: 'Hỏi' },
              { id: 'tilde', label: 'Ngã' },
              { id: 'dot_below', label: 'Nặng' },
              { id: 'circumflex', label: 'Nón (Mũ)' },
              { id: 'breve', label: 'Trăng' },
              { id: 'horn', label: 'Móc (Ơ, Ư)' },
              { id: 'bar', label: 'Gạch (Đ)' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-neutral-950 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm ký tự..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900"
            />
          </div>
        </div>

        {/* Toast */}
        {copyToast && (
          <div className="bg-neutral-900 text-white text-xs px-4 py-2 font-bold flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{copyToast}</span>
          </div>
        )}

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/50">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-400">
              <p className="text-sm font-semibold">
                Không tìm thấy ký tự tiếng Việt nào trong nhóm này trong font gốc.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredItems.map((item) => {
                const nativeSvgPath = getNativeCharSvgPath(font, item.char);
                const fullSvg = getNativeCharFullSvg(font, item.char);
                const extractedMarkPath = getExtractedDiacriticSvgPathFromChar(font, item.char, item.base);

                return (
                  <div
                    key={item.char}
                    className="p-3 bg-white rounded-xl border border-neutral-200 shadow-xs hover:border-neutral-400 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl font-black text-neutral-950 font-mono">{item.char}</span>
                        <span className="text-[9px] font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
                          U+{item.char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-medium mb-2 truncate">{item.label}</p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-neutral-100 text-[10px]">
                      {extractedMarkPath ? (
                        <button
                          type="button"
                          onClick={() => triggerCopy(extractedMarkPath, `Mã SVG Path dấu từ '${item.char}'`)}
                          className="w-full py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                          title="Copy mã SVG Path d='...' của dấu bóc tách từ ký tự này"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Copy SVG Dấu (Path)</span>
                        </button>
                      ) : (
                        <span className="text-[9px] text-neutral-400 italic block text-center py-0.5">
                          Dấu dính liền thân
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => triggerCopy(nativeSvgPath, `Mã SVG Path ký tự '${item.char}'`)}
                        className="w-full py-1 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 rounded-md font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Copy mã SVG Path d='...' của toàn bộ ký tự này"
                      >
                        <Copy className="w-3 h-3 text-neutral-600 shrink-0" />
                        <span>Copy SVG Ký tự (Path)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerCopy(fullSvg, `Thẻ <svg> đầy đủ của '${item.char}'`)}
                        className="w-full py-1 px-2 bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-md font-mono text-[9px] flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Copy thẻ <svg>...</svg> đầy đủ"
                      >
                        <Code className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span>Copy thẻ &lt;svg&gt;</span>
                      </button>

                      {extractedMarkPath && onApplySvgToTemplate && (
                        <button
                          type="button"
                          onClick={() => {
                            let mappedType = item.type;
                            if (mappedType === 'horn') {
                              mappedType = item.base.toLowerCase() === 'u' ? 'horn_u' : 'horn_o';
                            }
                            onApplySvgToTemplate(mappedType, extractedMarkPath);
                            triggerCopy(extractedMarkPath, `Đã áp dụng dấu từ '${item.char}' vào Studio!`);
                          }}
                          className="w-full py-1 px-2 bg-neutral-900 hover:bg-black text-white rounded-md font-bold text-[9px] flex items-center justify-center gap-1 transition mt-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Dùng làm Dấu mẫu</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 px-6 bg-neutral-50 border-t border-neutral-200 flex justify-between items-center text-xs text-neutral-500">
          <span>* Các mã dấu câu đã được bóc tách và chuyển đổi chuẩn hóa SVG Path.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 text-white font-bold rounded-lg hover:bg-black transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
