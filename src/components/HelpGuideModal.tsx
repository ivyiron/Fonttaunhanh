import React from 'react';
import { HelpCircle, X, BookOpen, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen = true, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1b1b24] border border-neutral-200 dark:border-[#353545] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in text-neutral-900 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
         
            <div>
              <h2 className="text-base font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Hướng Dẫn Sử Dụng Ứng Dụng Việt Hóa Font
              </h2>
             
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-[#2e2e3e] rounded-xl transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed">
          
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 p-4 rounded-xl text-indigo-950 dark:text-indigo-200 text-xs sm:text-sm font-medium leading-normal flex items-start gap-3">
            <div>
              Ứng dụng hỗ trợ Việt hóa font chữ OTF/TTF bằng cách tự động tạo đầy đủ bộ ký tự tiếng Việt từ hệ thống dấu do bạn thiết lập. Để đạt kết quả tốt nhất, hãy đọc các thông tin dưới đây.
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Bước 1 */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-amber-500 text-white dark:text-neutral-950 text-xs font-mono font-bold flex items-center justify-center shrink-0">1</span>
               Tải font và thiết lập bộ dấu
              </h3>
              <div className="pl-8 space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                <p>
                  Sau khi tải font (.otf hoặc .ttf) lên, tại Tab 1 bạn có thể tùy chỉnh 9 thành phần cơ bản của tiếng Việt gồm:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-neutral-50 dark:bg-[#20202b] p-3 rounded-xl border border-neutral-200/80 dark:border-[#353545] font-medium text-xs text-neutral-700 dark:text-neutral-300">
                  <span>• Dấu sắc</span>
                  <span>• Dấu huyền</span>
                  <span>• Dấu hỏi</span>
                  <span>• Dấu ngã</span>
                  <span>• Dấu nặng</span>
                  <span>• Dấu mũ (â, ê, ô)</span>
                  <span>• Dấu trăng (ă)</span>
                  <span>• Dấu móc (ư, ơ)</span>
                  <span className="col-span-2 sm:col-span-1">• Thanh ngang của đ / Đ</span>
                </div>
                <p>
                  Mỗi dấu đều có giao diện để điều chỉnh vị trí, kích thước và tỷ lệ cùng các gợi ý thiết kế.
                </p>
                <p className="bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 p-3 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
                  <strong>Mẹo:</strong> Nếu cảm thấy thiết kế gợi ý chưa phù hợp với font của mình, bạn hoàn toàn có thể tự thiết kế lại bằng vector trong Adobe Illustrator, sau đó copy nội dung SVG/vector và dán vào ô <strong>Mã SVG / Vector</strong> ở bên phải.
                </p>
              </div>
            </div>

            {/* Bước 2 */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-amber-500 text-white dark:text-neutral-950 text-xs font-mono font-bold flex items-center justify-center shrink-0">2</span>
                Tự động tạo toàn bộ ký tự tiếng Việt
              </h3>
              <div className="pl-8 space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                <p>
                  Sau khi hoàn thành bộ dấu, hệ thống sẽ tự động sinh toàn bộ ký tự tiếng Việt từ các thành phần bạn đã cung cấp.
                </p>
                <div className="bg-neutral-50 dark:bg-[#20202b] p-3 rounded-xl border border-neutral-200 dark:border-[#353545] text-xs space-y-1 text-neutral-700 dark:text-neutral-300">
                  <p className="font-bold text-neutral-900 dark:text-white">Lưu ý:</p>
                  <p>• Kiểm tra cả chữ hoa và chữ thường, vì vị trí dấu của hai bộ ký tự có thể khác nhau.</p>
                  <p>• Đặc biệt nên kiểm tra kỹ ký tự <strong>đ</strong> và <strong>Đ</strong>.</p>
                </div>
              </div>
            </div>

            {/* Bước 3 */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-amber-500 text-white dark:text-neutral-950 text-xs font-mono font-bold flex items-center justify-center shrink-0">3</span>
                Cấu hình kiểu ghép dấu kép
              </h3>
              <div className="pl-8 space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                <p>
                  Bạn có thể thiết lập cách hệ thống ghép các dấu kép cho những ký tự như: <code className="bg-neutral-100 dark:bg-[#282838] px-1.5 py-0.5 rounded text-neutral-800 dark:text-amber-300 font-mono text-xs">ấ</code>, <code className="bg-neutral-100 dark:bg-[#282838] px-1.5 py-0.5 rounded text-neutral-800 dark:text-amber-300 font-mono text-xs">ề</code>, <code className="bg-neutral-100 dark:bg-[#282838] px-1.5 py-0.5 rounded text-neutral-800 dark:text-amber-300 font-mono text-xs">ố</code>, <code className="bg-neutral-100 dark:bg-[#282838] px-1.5 py-0.5 rounded text-neutral-800 dark:text-amber-300 font-mono text-xs">ữ</code>...
                </p>
                <p>
                  Tùy chọn này giúp kiểm soát chính xác thứ tự và cách kết hợp dấu trên từng nhóm ký tự.
                </p>
              </div>
            </div>

            {/* Bước 4 */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-amber-500 text-white dark:text-neutral-950 text-xs font-mono font-bold flex items-center justify-center shrink-0">4</span>
                Chỉnh sửa từng ký tự
              </h3>
              <div className="pl-8 space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                <p>
                  Nếu thực sự có tâm và muốn tinh chỉnh kỹ hơn, App cũng cho phép bạn chỉnh dấu riêng cho từng ký tự.
                </p>
                <p>
                  Giúp bạn xử lý những trường hợp đặc biệt mà hệ thống tự động chưa cho kết quả như mong muốn.
                </p>
              </div>
            </div>

            {/* Bước 5 */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-amber-500 text-white dark:text-neutral-950 text-xs font-mono font-bold flex items-center justify-center shrink-0">5</span>
                Kiểm tra kết quả
              </h3>
              <div className="pl-8 space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                <p>
                  Phía dưới giao diện luôn có khu vực gõ thử font để kiểm tra kết quả sau mỗi lần chỉnh sửa.
                </p>
                <p>
                  Nếu có thay đổi nhưng chưa được cập nhật, hãy nhấn nút <strong>Cập nhật</strong> (nút màu vàng).
                </p>
              </div>
            </div>

            {/* Bước 6 */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-amber-500 text-white dark:text-neutral-950 text-xs font-mono font-bold flex items-center justify-center shrink-0">6</span>
                Lưu dự án
              </h3>
              <div className="pl-8 space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                <p>
                  Ứng dụng hoạt động hoàn toàn trên trình duyệt, có hỗ trợ lưu phiên làm việc.
                </p>
                <p>Nhưng để chắc chắn, hãy chủ động lưu:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>File font</li>
                  <li>Hoặc file dự án (.ftn)</li>
                </ul>
                               
              </div>
            </div>

            {/* Bước 7 */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-amber-500 text-white dark:text-neutral-950 text-xs font-mono font-bold flex items-center justify-center shrink-0">7</span>
                Đổi tên font trước khi xuất
              </h3>
              <div className="pl-8 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                <p>
                  Trước khi lưu font đã Việt hóa, hãy đổi tên file để tránh ghi đè hoặc nhầm lẫn với font gốc chưa Việt hóa.
                </p>
              </div>
            </div>

            {/* Bước 8 */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-neutral-900 dark:bg-amber-500 text-white dark:text-neutral-950 text-xs font-mono font-bold flex items-center justify-center shrink-0">8</span>
                Auto Kerning
              </h3>
              <div className="pl-8 space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                <p>
                  Mặc định, toàn bộ ký tự tiếng Việt được tạo ra sẽ kế thừa kerning của font gốc.
                </p>
                <p>
                  Tuy nhiên, một số font có kerning chưa tốt hoặc không phù hợp với tiếng Việt. Vì vậy, app cung cấp tính năng Auto Kerning để tự động tính toán lại khoảng cách giữa các ký tự.
                </p>
                <div className="bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 p-3.5 rounded-xl text-amber-950 dark:text-amber-200 text-xs space-y-1.5">
                  <p className="font-bold">Lưu ý quan trọng:</p>
                  <p>• Auto Kerning sẽ xóa toàn bộ kerning gốc của font trước khi tính toán lại.</p>
                  <p>• Thuật toán không hoàn hảo và chỉ nên sử dụng khi thực sự cần thiết.</p>
                  <p>• Để đạt kết quả tối ưu, hãy chạy Auto Kerning với 1 file font đã hoàn thành toàn bộ quá trình Việt hóa (lưu file font đã việt hóa rồi tải lên lại để chạy riêng Auto Kerning).</p>
                </div>
                <p>
                  Ngoài Auto Kerning, App cũng cung cấp bảng chỉnh kerning thủ công dành cho những ai muốn tinh chỉnh từng cặp ký tự một cách chi tiết.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>

      </div>
    </div>
  );
};
