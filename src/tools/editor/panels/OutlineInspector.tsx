import React, { useRef, useState, useMemo } from 'react';
import * as opentype from 'opentype.js';
import {
  Upload,
  Sliders,
  Code,
  Sparkles,
  RotateCcw,
  Check,
  Tag,
  Link,
  Unlink,
  AlignHorizontalJustifyCenter,
  Move,
  Maximize,
  Copy,
  FileType,
  Layers,
  ArrowDownUp
} from 'lucide-react';
import { GlyphEditState, FontMetadata } from '../../../core/session';
import {
  parseSvgPath,
  transformCommands,
  getExactBoundingBox
} from '../../../core/index';

interface OutlineInspectorProps {
  font: opentype.Font;
  fontMetadata: FontMetadata;
  editState: GlyphEditState;
  onUpdateState: (id: string, updated: Partial<GlyphEditState>) => void;
  onSaveSlot: (id: string) => void;
  onResetSlot: (id: string) => void;
}

export const OutlineInspector: React.FC<OutlineInspectorProps> = ({
  font,
  fontMetadata,
  editState,
  onUpdateState,
  onSaveSlot,
  onResetSlot
}) => {
  const [activeTab, setActiveTab] = useState<'transform' | 'svg' | 'alt'>('transform');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [copiedPath, setCopiedPath] = useState(false);
  const [svgError, setSvgError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse and calculate current bounding box
  const parsedCommands = useMemo(() => {
    if (!editState.svgPath) return [];
    const parsed = parseSvgPath(editState.svgPath);
    return transformCommands(
      parsed,
      editState.scaleX,
      editState.scaleY,
      editState.offsetX,
      editState.offsetY,
      editState.flipY
    );
  }, [
    editState.svgPath,
    editState.scaleX,
    editState.scaleY,
    editState.offsetX,
    editState.offsetY,
    editState.flipY
  ]);

  const bBox = useMemo(() => {
    if (parsedCommands.length === 0) return null;
    return getExactBoundingBox(parsedCommands);
  }, [parsedCommands]);

  // Handle Scale changes with aspect lock
  const handleScaleXChange = (val: number) => {
    const clamped = Math.max(0.1, Math.min(5.0, Number(val.toFixed(2))));
    if (lockAspectRatio) {
      onUpdateState(editState.id, {
        scaleX: clamped,
        scaleY: clamped,
        isModified: true
      });
    } else {
      onUpdateState(editState.id, {
        scaleX: clamped,
        isModified: true
      });
    }
  };

  const handleScaleYChange = (val: number) => {
    const clamped = Math.max(0.1, Math.min(5.0, Number(val.toFixed(2))));
    if (lockAspectRatio) {
      onUpdateState(editState.id, {
        scaleX: clamped,
        scaleY: clamped,
        isModified: true
      });
    } else {
      onUpdateState(editState.id, {
        scaleY: clamped,
        isModified: true
      });
    }
  };

  // Quick Action: Center Glyph horizontally
  const handleCenterGlyph = () => {
    if (!bBox) return;
    const currentCenterX = (bBox.xMin + bBox.xMax) / 2;
    const targetCenterX = editState.advanceWidth / 2;
    const shift = targetCenterX - currentCenterX;
    onUpdateState(editState.id, {
      offsetX: Math.round(editState.offsetX + shift),
      isModified: true
    });
  };

  // Quick Action: Auto-fit Advance Width to glyph bounding box with sidebearings
  const handleAutoWidth = () => {
    if (!bBox) return;
    const sideMargin = Math.round(fontMetadata.unitsPerEm * 0.05); // 5% UPM margin
    const newWidth = Math.max(100, Math.round(bBox.xMax - bBox.xMin + sideMargin * 2));
    const shift = sideMargin - bBox.xMin;
    onUpdateState(editState.id, {
      advanceWidth: newWidth,
      offsetX: Math.round(editState.offsetX + shift),
      isModified: true
    });
  };

  // Handle SVG File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.svg')) {
      setSvgError('Vui lòng chọn file .SVG hợp lệ');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (!content) return;

      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'image/svg+xml');
        const pathEls = doc.querySelectorAll('path');

        if (pathEls.length === 0) {
          setSvgError('Không tìm thấy thẻ <path> trong file SVG');
          return;
        }

        // Combine all path data
        let fullPath = '';
        pathEls.forEach((p) => {
          const d = p.getAttribute('d');
          if (d) fullPath += ' ' + d;
        });

        fullPath = fullPath.trim();
        if (!fullPath) {
          setSvgError('Dữ liệu path trong file SVG rỗng');
          return;
        }

        // Determine if SVG needs Flip Y (most standard SVGs have Y downwards)
        onUpdateState(editState.id, {
          svgPath: fullPath,
          flipY: true, // Typical standard SVGs need Flip Y in font UPM space
          isModified: true
        });
        setSvgError(null);
      } catch (err: any) {
        setSvgError('Lỗi đọc file SVG: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Clean & Normalize raw SVG Path
  const handleCleanPath = () => {
    try {
      const parsed = parseSvgPath(editState.svgPath);
      // Re-serialize back
      let str = '';
      parsed.forEach(cmd => {
        if (cmd.type === 'M') str += `M ${cmd.x} ${cmd.y} `;
        else if (cmd.type === 'L') str += `L ${cmd.x} ${cmd.y} `;
        else if (cmd.type === 'C') str += `C ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y} `;
        else if (cmd.type === 'Q') str += `Q ${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y} `;
        else if (cmd.type === 'Z') str += 'Z ';
      });
      onUpdateState(editState.id, { svgPath: str.trim(), isModified: true });
    } catch (e) {
      // Keep as is
    }
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(editState.svgPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return (
    <aside className="w-80 lg:w-96 border-l border-neutral-200/90 bg-white flex flex-col shrink-0 h-full select-none">
      {/* Panel Header */}
      <div className="p-3 border-b border-neutral-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Thông Số & Căn Chỉnh
          </span>
          {editState.isModified && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-medium">
              Đã sửa
            </span>
          )}
        </div>

        <button
          onClick={() => onResetSlot(editState.id)}
          className="text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 p-1 rounded-md transition flex items-center gap-1"
          title="Khôi phục trạng thái ban đầu của ký tự này"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[11px]">Đặt lại</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200/80 bg-neutral-50/50 p-1 text-xs">
        <button
          onClick={() => setActiveTab('transform')}
          className={`flex-1 py-1.5 rounded-md font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'transform' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Căn chỉnh</span>
        </button>

        <button
          onClick={() => setActiveTab('svg')}
          className={`flex-1 py-1.5 rounded-md font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'svg' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Dữ liệu SVG</span>
        </button>

        <button
          onClick={() => setActiveTab('alt')}
          className={`flex-1 py-1.5 rounded-md font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'alt' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Chế độ & Alt</span>
        </button>
      </div>

      {/* Tab Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* TAB 1: CĂN CHỈNH & KÍCH THƯỚC */}
        {activeTab === 'transform' && (
          <div className="space-y-4 text-xs">
            {/* Advance Width */}
            <div className="bg-neutral-50/80 p-3 rounded-xl border border-neutral-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900">Chiều Rộng Ký Tự (Advance Width)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={Math.round(editState.advanceWidth)}
                    onChange={(e) =>
                      onUpdateState(editState.id, {
                        advanceWidth: Math.max(0, parseInt(e.target.value) || 0),
                        isModified: true
                      })
                    }
                    className="w-16 px-1.5 py-0.5 text-right font-mono font-bold bg-white border border-neutral-200 rounded text-xs focus:outline-hidden"
                  />
                  <span className="text-[11px] text-neutral-400 font-mono">UPM</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={fontMetadata.unitsPerEm * 2}
                step={5}
                value={editState.advanceWidth}
                onChange={(e) =>
                  onUpdateState(editState.id, {
                    advanceWidth: Number(e.target.value),
                    isModified: true
                  })
                }
                className="w-full accent-neutral-900 h-1.5"
              />

              {/* Quick Width Presets & Auto Alignment */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={handleCenterGlyph}
                  className="flex-1 py-1 px-2 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md font-medium text-neutral-700 transition flex items-center justify-center gap-1 text-[11px]"
                  title="Căn giữa hình vẽ vào giữa khoảng cách LSB và RSB"
                >
                  <AlignHorizontalJustifyCenter className="w-3 h-3" />
                  <span>Căn giữa</span>
                </button>
                <button
                  onClick={handleAutoWidth}
                  className="flex-1 py-1 px-2 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md font-medium text-neutral-700 transition flex items-center justify-center gap-1 text-[11px]"
                  title="Tự động tính chiều rộng vừa khít hình vẽ + lề biên"
                >
                  <Maximize className="w-3 h-3" />
                  <span>Auto Width</span>
                </button>
              </div>
            </div>

            {/* Scale (Tỷ lệ co giãn) */}
            <div className="bg-neutral-50/80 p-3 rounded-xl border border-neutral-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-neutral-900">Tỷ Lệ Co Giãn (Scale)</span>
                  <button
                    onClick={() => setLockAspectRatio(!lockAspectRatio)}
                    className={`p-1 rounded ${
                      lockAspectRatio ? 'text-neutral-900 bg-neutral-200' : 'text-neutral-400 hover:text-neutral-700'
                    }`}
                    title={lockAspectRatio ? 'Đang khóa tỷ lệ X = Y' : 'Tỷ lệ X và Y độc lập'}
                  >
                    {lockAspectRatio ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {[80, 100, 120, 150].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        const val = preset / 100;
                        onUpdateState(editState.id, { scaleX: val, scaleY: val, isModified: true });
                      }}
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-neutral-200/80 border border-neutral-200 text-[10px] font-mono text-neutral-700"
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale X */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Scale X</span>
                  <span className="font-mono font-semibold text-neutral-800">
                    {Math.round(editState.scaleX * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={3.0}
                  step={0.05}
                  value={editState.scaleX}
                  onChange={(e) => handleScaleXChange(parseFloat(e.target.value))}
                  className="w-full accent-neutral-900 h-1.5"
                />
              </div>

              {/* Scale Y */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Scale Y</span>
                  <span className="font-mono font-semibold text-neutral-800">
                    {Math.round(editState.scaleY * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={3.0}
                  step={0.05}
                  value={editState.scaleY}
                  onChange={(e) => handleScaleYChange(parseFloat(e.target.value))}
                  className="w-full accent-neutral-900 h-1.5"
                />
              </div>
            </div>

            {/* Offsets (Tọa độ dời X, Y) */}
            <div className="bg-neutral-50/80 p-3 rounded-xl border border-neutral-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900">Tọa Độ Dời (Offset)</span>
                <button
                  onClick={() => onUpdateState(editState.id, { offsetX: 0, offsetY: 0, isModified: true })}
                  className="text-[10px] text-neutral-500 hover:text-neutral-900"
                >
                  Về gốc (0, 0)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Offset X */}
                <div className="space-y-1">
                  <span className="text-[11px] text-neutral-500">Offset X</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateState(editState.id, { offsetX: editState.offsetX - 10, isModified: true })}
                      className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-neutral-600 font-mono hover:bg-neutral-100"
                    >
                      -10
                    </button>
                    <input
                      type="number"
                      value={Math.round(editState.offsetX)}
                      onChange={(e) =>
                        onUpdateState(editState.id, { offsetX: parseInt(e.target.value) || 0, isModified: true })
                      }
                      className="w-full px-1.5 py-0.5 text-center font-mono font-bold bg-white border border-neutral-200 rounded text-xs focus:outline-hidden"
                    />
                    <button
                      onClick={() => onUpdateState(editState.id, { offsetX: editState.offsetX + 10, isModified: true })}
                      className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-neutral-600 font-mono hover:bg-neutral-100"
                    >
                      +10
                    </button>
                  </div>
                </div>

                {/* Offset Y */}
                <div className="space-y-1">
                  <span className="text-[11px] text-neutral-500">Offset Y</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateState(editState.id, { offsetY: editState.offsetY - 10, isModified: true })}
                      className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-neutral-600 font-mono hover:bg-neutral-100"
                    >
                      -10
                    </button>
                    <input
                      type="number"
                      value={Math.round(editState.offsetY)}
                      onChange={(e) =>
                        onUpdateState(editState.id, { offsetY: parseInt(e.target.value) || 0, isModified: true })
                      }
                      className="w-full px-1.5 py-0.5 text-center font-mono font-bold bg-white border border-neutral-200 rounded text-xs focus:outline-hidden"
                    />
                    <button
                      onClick={() => onUpdateState(editState.id, { offsetY: editState.offsetY + 10, isModified: true })}
                      className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-neutral-600 font-mono hover:bg-neutral-100"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Flip Y & Kerning Settings */}
            <div className="bg-neutral-50/80 p-3 rounded-xl border border-neutral-200/80 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-neutral-900 block">Lật Trục Y (Flip Y)</span>
                  <span className="text-[11px] text-neutral-500">Chuẩn hóa hệ tọa độ SVG sang Font</span>
                </div>
                <input
                  type="checkbox"
                  checked={editState.flipY}
                  onChange={(e) => onUpdateState(editState.id, { flipY: e.target.checked, isModified: true })}
                  className="rounded text-neutral-900 focus:ring-0 w-4 h-4"
                />
              </label>

              <div className="h-px bg-neutral-200/70" />

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-neutral-900 block">Kế Thừa Kerning Ký Tự Gốc</span>
                  <span className="text-[11px] text-neutral-500">Áp dụng bảng kerning sẵn có từ font</span>
                </div>
                <input
                  type="checkbox"
                  checked={editState.inheritKerning}
                  onChange={(e) => onUpdateState(editState.id, { inheritKerning: e.target.checked, isModified: true })}
                  className="rounded text-neutral-900 focus:ring-0 w-4 h-4"
                />
              </label>

              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] text-neutral-600">
                  <span>Khoảng cách Tracking bù thêm</span>
                  <span className="font-mono font-semibold">{editState.trackingOffset} UPM</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={200}
                  step={5}
                  value={editState.trackingOffset}
                  onChange={(e) => onUpdateState(editState.id, { trackingOffset: parseInt(e.target.value), isModified: true })}
                  className="w-full accent-neutral-900 h-1.5"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THẺ DỮ LIỆU SVG */}
        {activeTab === 'svg' && (
          <div className="space-y-4 text-xs">
            {/* Upload SVG button */}
            <div className="space-y-2">
              <span className="font-semibold text-neutral-900 block">Nạp File Vector SVG</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-3 border-2 border-dashed border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 rounded-xl transition flex flex-col items-center justify-center gap-1.5 text-neutral-600 group"
              >
                <Upload className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900" />
                <span className="font-medium text-xs text-neutral-800">Chọn hoặc thả file .SVG vào đây</span>
                <span className="text-[10px] text-neutral-400">Tự động trích xuất các thẻ &lt;path&gt;</span>
              </button>

              {svgError && (
                <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px]">
                  {svgError}
                </div>
              )}
            </div>

            {/* SVG Path Code Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900">Dữ Liệu Path Vector (SVG d=)</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCleanPath}
                    className="text-[11px] text-neutral-600 hover:text-neutral-900 px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded"
                    title="Định dạng lại chuỗi path"
                  >
                    Format
                  </button>
                  <button
                    onClick={handleCopyPath}
                    className="text-[11px] text-neutral-600 hover:text-neutral-900 px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded flex items-center gap-1"
                  >
                    {copiedPath ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPath ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={6}
                value={editState.svgPath}
                onChange={(e) => onUpdateState(editState.id, { svgPath: e.target.value, isModified: true })}
                placeholder="Dán mã SVG path d=... vào đây"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200/90 rounded-xl font-mono text-[11px] text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 leading-relaxed break-all"
              />
            </div>

            {/* Bounding Box & Shape Analysis */}
            {bBox && (
              <div className="bg-neutral-50/80 p-3 rounded-xl border border-neutral-200/80 space-y-2">
                <span className="font-semibold text-neutral-900 block">Thống Kê Bounding Box (UPM)</span>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-neutral-200/80">
                    <span className="text-neutral-400 block text-[10px]">KÍCH THƯỚC (W × H)</span>
                    <span className="font-bold text-neutral-900">
                      {Math.round(bBox.xMax - bBox.xMin)} × {Math.round(bBox.yMax - bBox.yMin)}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-neutral-200/80">
                    <span className="text-neutral-400 block text-[10px]">LSB / RSB</span>
                    <span className="font-bold text-neutral-900">
                      {Math.round(bBox.xMin)} / {Math.round(editState.advanceWidth - bBox.xMax)}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-neutral-200/80">
                    <span className="text-neutral-400 block text-[10px]">Xmin / Xmax</span>
                    <span className="font-bold text-neutral-900">
                      {Math.round(bBox.xMin)} ... {Math.round(bBox.xMax)}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-neutral-200/80">
                    <span className="text-neutral-400 block text-[10px]">Ymin / Ymax</span>
                    <span className="font-bold text-neutral-900">
                      {Math.round(bBox.yMin)} ... {Math.round(bBox.yMax)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CHẾ ĐỘ & BẢN ALT */}
        {activeTab === 'alt' && (
          <div className="space-y-4 text-xs">
            {/* Mode selection */}
            <div className="space-y-2">
              <span className="font-semibold text-neutral-900 block">Chế Độ Biên Dịch Ký Tự</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateState(editState.id, { mode: 'replace', isModified: true })}
                  className={`p-3 rounded-xl border text-left transition ${
                    editState.mode === 'replace'
                      ? 'border-neutral-900 bg-neutral-900/5 ring-1 ring-neutral-900'
                      : 'border-neutral-200 bg-white hover:border-neutral-400'
                  }`}
                >
                  <span className="font-bold block text-neutral-900">Thay Thế</span>
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    Ghi đè trực tiếp lên vị trí glyph và Unicode gốc
                  </span>
                </button>

                <button
                  onClick={() => onUpdateState(editState.id, { mode: 'alt', isModified: true })}
                  className={`p-3 rounded-xl border text-left transition ${
                    editState.mode === 'alt'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                      : 'border-neutral-200 bg-white hover:border-neutral-400'
                  }`}
                >
                  <span className="font-bold block text-indigo-950">Tạo Bản Alt</span>
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    Giữ glyph gốc, thêm glyph dự phòng vào bảng PUA
                  </span>
                </button>
              </div>
            </div>

            {/* Alternate Glyph Details */}
            {editState.mode === 'alt' && (
              <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 space-y-3">
                <div className="space-y-1">
                  <span className="font-semibold text-neutral-900 text-[11px] block">Tên Glyph Mở Rộng (Alt Name)</span>
                  <input
                    type="text"
                    value={editState.altName}
                    onChange={(e) => onUpdateState(editState.id, { altName: e.target.value, isModified: true })}
                    placeholder="ví dụ: A.alt hoặc g.ss01"
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg font-mono text-xs focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-neutral-900 text-[11px] block">
                    Điểm Mã PUA (Private Use Area)
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-neutral-400">U+</span>
                    <input
                      type="text"
                      value={editState.altUnicode.toString(16).toUpperCase()}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 16);
                        if (!isNaN(parsed)) {
                          onUpdateState(editState.id, { altUnicode: parsed, isModified: true });
                        }
                      }}
                      className="w-24 px-2 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-mono font-bold focus:outline-hidden"
                    />
                    <span className="text-[10px] text-neutral-500 font-sans">
                      (Ký tự: {String.fromCodePoint(editState.altUnicode)})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-3 border-t border-neutral-200/80 bg-neutral-50/70 space-y-2">
        <button
          onClick={() => onSaveSlot(editState.id)}
          className={`w-full py-2 px-3 rounded-xl font-medium text-xs transition flex items-center justify-center gap-1.5 shadow-2xs ${
            editState.isCompleted
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-neutral-900 hover:bg-neutral-800 text-white'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>{editState.isCompleted ? 'Đã lưu (Click để xác nhận lại)' : 'Đánh dấu hoàn thành'}</span>
        </button>
      </div>
    </aside>
  );
};
