import React, { useState } from 'react';
import { AlertTriangle, X, ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react';

interface KerningWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDismissForever: () => void;
}

export const KerningWarningModal: React.FC<KerningWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onDismissForever
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleProceed = () => {
    if (dontShowAgain) {
      onDismissForever();
    }
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-amber-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-neutral-900 tracking-tight uppercase">
                Lưu Ý Tính Năng Kerning Tàu Nhanh
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Cảnh báo trước khi tạo hệ thống khoảng cách tự động
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200/60 rounded-xl transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-neutral-700 leading-relaxed">
          <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-xl text-amber-950 font-medium space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Những điều cần biết về Auto Kerning:</span>
            </div>
            <ul className="space-y-1.5 list-disc pl-4 text-amber-900/90 text-[11px]">
              <li>
                <strong>Tạo hàng nghìn cặp kerning:</strong> Hệ thống sẽ phân tích quang học và tự động sinh hàng nghìn cặp kerning cho chữ hoa, chữ thường, dấu tiếng Việt và dấu câu.
              </li>
              <li>
                <strong>Có thể thay đổi kerning gốc:</strong> Quá trình tính toán lại khoảng cách có thể ghi đè hoặc thay đổi các quy tắc Kerning gốc đã được thiết kế sẵn trong font.
              </li>
              <li>
                <strong>Quy trình khuyến nghị:</strong> Bạn nên hoàn thiện và xuất font ở tab <em>Việt hóa tàu nhanh</em> trước, sau đó nạp lại để tinh chỉnh riêng Kerning nếu font gốc có khoảng cách chưa tối ưu.
              </li>
            </ul>
          </div>

          <p className="text-neutral-500">
            Bạn vẫn hoàn toàn có thể kiểm soát, bật/tắt từng nhóm kerning hoặc chỉnh sửa thủ công từng cặp ký tự trong bảng điều khiển.
          </p>

          <label className="flex items-center gap-2 pt-2 border-t border-neutral-100 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-neutral-300 text-neutral-900 accent-neutral-900 cursor-pointer"
            />
            <span className="text-[11px] text-neutral-600">
              Không hiển thị lại cảnh báo này trong phiên làm việc này
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>

          <button
            type="button"
            onClick={handleProceed}
            className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Đã hiểu & Tiếp tục</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
